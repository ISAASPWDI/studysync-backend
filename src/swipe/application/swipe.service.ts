// src/swipe/application/swipe.service.ts

import { Injectable, HttpException, HttpStatus, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { Match, MatchDocument } from '../../matches/infrastructure/schemas/match.schema';

import {
  GetRecommendationsResponseDTO,
  CreateSwipeActionDTO,
  SwipeActionResponseDTO,
  RecommendedUserDTO,
} from '../infrastructure/dto/swipe.dto';
import { User, UserDocument } from 'src/users/infrastructure/schemas/user/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SwipeService {
  private readonly logger = new Logger(SwipeService.name);
  private readonly ML_SERVICE_URL: string;

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly configService: ConfigService
  ) {
    const mlUrl = this.configService.get<string>('ML_SERVICE_URL');

    if (!mlUrl) {
      this.logger.error('❌ ML_SERVICE_URL no está definido en el archivo .env');
      throw new InternalServerErrorException('ML_SERVICE_URL no está definido en las variables de entorno');
    }


    this.ML_SERVICE_URL = mlUrl.endsWith('/') ? mlUrl.slice(0, -1) : mlUrl;
  }

  async getRecommendations(
    userId: string,
    limit: number
  ): Promise<GetRecommendationsResponseDTO> {
    try {
      this.logger.log('====================================');
      this.logger.log(`🔍 getRecommendations - Usuario: ${userId}, Límite: ${limit}`);

      const excludeUsers = await this.getExcludedUsers(userId);
      this.logger.log(`📋 Usuarios excluidos: ${excludeUsers.length}`);

      const requestPayload = {
        user_id: userId,
        exclude_users: excludeUsers,
        limit: limit,
      };

      const fullUrl = `${this.ML_SERVICE_URL}/recommendations`;

      const mlResponse = await firstValueFrom(
        this.httpService.post(fullUrl, requestPayload).pipe(
          timeout(55000),
          catchError(async (error: AxiosError) => {
            if (error.response) {
              if (error.response.status === 404) {
                try {
                  await this.syncUserToMLService(userId);

                  await new Promise(resolve => setTimeout(resolve, 2000));

                  const retryResponse = await firstValueFrom(
                    this.httpService.post(fullUrl, requestPayload).pipe(
                      timeout(55000)
                    )
                  );

                  this.logger.log('✅ Reintento exitoso después de sincronización');
                  return retryResponse;

                } catch (syncError) {
                  this.logger.error(`❌ Error sincronizando: ${syncError.message}`);
                  throw error; // Lanzar el error original
                }
              }
            } else if (error.request) {
              this.logger.error('📍 No se recibió respuesta del servidor');
            } else {
              this.logger.error('📍 Error al configurar la petición');
            }
            this.logger.error('❌❌❌ FIN DEL ERROR ❌❌❌');
            this.logger.error('');

            throw error;
          })
        )
      );

      const recommendations = mlResponse.data.recommendations || [];

      if (recommendations.length === 0) {
       this.logger.error('🚫 Servicio ML no disponible');
      }
      const enrichedUsers = await this.enrichRecommendations(recommendations);

      return {
        success: true,
        data: enrichedUsers,
        total: enrichedUsers.length,
        message: 'Recomendaciones obtenidas exitosamente',
      };

    } catch (error) {

      if (error.code === 'ECONNREFUSED') {
        this.logger.error('🚫 ECONNREFUSED: Servicio ML no disponible');
      } else if (error.code === 'ETIMEDOUT') {
        this.logger.error('⏱️ ETIMEDOUT: Timeout de conexión');
      } else if (error.name === 'TimeoutError') {
        this.logger.error('⏱️ TimeoutError: Petición tardó >55s');
      } else if (error.response?.status === 404) {
        this.logger.error('🔍 404: Endpoint no encontrado');
        this.logger.error(`   URL: ${this.ML_SERVICE_URL}/recommendations`);
      }

      this.logger.log('🔄 Usando fallback...');
      
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Recomendaciones obtenidas incorrectamente',
      };
    }
  }

  async syncUserToMLService(userId: string): Promise<any> {
    try {
      this.logger.log(`🔄 Sincronizando usuario ${userId} con ML Service...`);

      const syncUrl = `${this.ML_SERVICE_URL}/users/sync`;

      const response = await firstValueFrom(
        this.httpService.post(
          syncUrl,
          {
            user_id: userId,
            force_reload: true
          },
          {
            timeout: 15000,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      );

      this.logger.log(`✅ Usuario ${userId} sincronizado: ${response.data.message}`);

      return response.data;

    } catch (error) {
      this.logger.error(`❌ Error sincronizando usuario ${userId}: ${error.message}`);
      if (error.response) {
        this.logger.error(`   HTTP Status: ${error.response.status}`);
        this.logger.error(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error sincronizando con ML Service: ${error.message}`);
    }
  }

  async syncAllUsersToMLService(): Promise<{ synced: number; failed: number }> {
    try {

      const syncAllUrl = `${this.ML_SERVICE_URL}/users/sync-all`;

      this.logger.log(`📤 Enviando petición a: ${syncAllUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(
          syncAllUrl,
          {},
          {
            timeout: 120000, 
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      );

      const result = response.data;

      return {
        synced: result.users_synced,
        failed: result.users_failed,
      };

    } catch (error) {
      this.logger.error(`❌ Error en sincronización masiva: ${error.message}`);
      if (error.response) {
        this.logger.error(`   HTTP Status: ${error.response.status}`);
        this.logger.error(`   Response: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Error en sincronización masiva: ${error.message}`);
    }
  }

  async checkUserExistsInML(userId: string): Promise<boolean> {
    try {
      this.logger.log(`🔍 Verificando si usuario ${userId} existe en ML Service...`);

      const checkUrl = `${this.ML_SERVICE_URL}/users/${userId}/exists`;

      const response = await firstValueFrom(
        this.httpService.get(checkUrl, { timeout: 10000 })
      );

      const exists = response.data.exists;

      if (exists) {
        this.logger.log(`✅ Usuario ${userId} existe en ML Service`);
      } else {
        this.logger.warn(`⚠️ Usuario ${userId} NO existe en ML Service`);
      }

      return exists;

    } catch (error) {
      this.logger.error(`❌ Error verificando usuario en ML: ${error.message}`);
      return false;
    }
  }

  async getMLServiceStats(): Promise<any> {
    try {
      this.logger.log('📊 Obteniendo estadísticas del ML Service...');

      const statsUrl = `${this.ML_SERVICE_URL}/stats`;

      const response = await firstValueFrom(
        this.httpService.get(statsUrl, { timeout: 10000 })
      );

      return response.data;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo estadísticas: ${error.message}`);

      return {
        available: false,
        error: error.message,
        ml_service_url: this.ML_SERVICE_URL,
      };
    }
  }

  async createSwipeAction(
    userId: string,
    dto: CreateSwipeActionDTO,
  ): Promise<SwipeActionResponseDTO> {
    const { targetUserId, action } = dto;

    if (userId === targetUserId) {
      throw new HttpException(
        'No puedes hacer match contigo mismo',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verificar si ya existe un match entre estos usuarios
    const existingMatch = await this.matchModel.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId },
      ],
    });

    if (existingMatch) {
      throw new HttpException(
        'Ya existe un match entre estos usuarios',
        HttpStatus.CONFLICT,
      );
    }
    if (action === 'dislike') {
      this.logger.log(`User ${userId} disliked ${targetUserId}`);
      return {
        success: true,
        action: 'dislike',
        message: 'Perfil rechazado',
        isMatch: false,
      };
    }

    // Si es like o superlike, crear el match pendiente
    const newMatch = await this.matchModel.create({
      user1: userId,
      user2: targetUserId,
      status: 'pending',
      matchScore: dto.matchScore || 0,
      initiatedBy: userId,
    });

    // Verificar si el otro usuario ya había dado like (match mutuo)
    const reverseMatch = await this.matchModel.findOne({
      user1: targetUserId,
      user2: userId,
      status: 'pending',
    });

    if (reverseMatch) {
      await this.matchModel.updateMany(
        {
          $or: [
            { _id: newMatch._id },
            { _id: reverseMatch._id },
          ],
        },
        {
          status: 'accepted',
          updatedAt: new Date(),
        }
      );

      this.logger.log(`MUTUAL MATCH between ${userId} and ${targetUserId}`);

      return {
        success: true,
        action: action,
        message: '¡Es un match! Ahora pueden chatear',
        isMatch: true,
        matchId: newMatch._id.toString(),
      };
    }

    // Si no es mutuo, queda como pendiente
    return {
      success: true,
      action: action,
      message: action === 'superlike'
        ? 'Super like enviado'
        : 'Like enviado, esperando respuesta',
      isMatch: false,
      matchId: newMatch._id.toString(),
    };
  }


  private async getExcludedUsers(userId: string): Promise<string[]> {
    const matches = await this.matchModel.find({
      $or: [
        { user1: userId },
        { user2: userId },
      ],
    }).select('user1 user2');

    const excludedIds = matches.flatMap(match =>
      [match.user1.toString(), match.user2.toString()]
    );

    excludedIds.push(userId);

    return [...new Set(excludedIds)];
  }

  private async enrichRecommendations(
    recommendations: any[]
  ): Promise<RecommendedUserDTO[]> {
    const userIds = recommendations.map(r => r.user_id);

    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('email profile skills objectives activity privacy')
      .lean();

    // Crear un mapa para acceso rápido
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    return recommendations.map(rec => {
      const user = userMap.get(rec.user_id);

      if (!user) {
        this.logger.warn(`User ${rec.user_id} not found in MongoDB`);
        return null;
      }

      return {
        userId: rec.user_id,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Usuario',
        age: user.profile?.age || 0,
        location: user.profile?.location?.district || 'Sin ubicación',
        university: user.profile?.university || 'Sin universidad',
        faculty: user.profile?.faculty || 'Sin facultad',
        semester: user.profile?.semester || 0,
        bio: user.profile?.bio || 'Sin descripción',
        profilePicture: user.profile?.profilePicture || user.picture || null,
        skills: user.skills?.technical || [],
        interests: user.skills?.interests || [],
        objectives: user.objectives?.primary || [],
        timeAvailability: user.objectives?.timeAvailability || 'No especificado',
        preferredGroupSize: user.objectives?.preferredGroupSize || 'No especificado',
        matchScore: rec.similarity_score || 0, 
        distance: rec.distance_info?.distance_km || 0,
        isOnline: user.activity?.isOnline || false,
        lastActive: user.activity?.lastActive || null,
        showAge: user.privacy?.showAge !== false,
        showLocation: user.privacy?.showLocation !== false,
        showSemester: user.privacy?.showSemester !== false,
      };
    }).filter(u => u !== null);
  }



}