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
    
    // 🔍 DEBUG: Logging inicial
    this.logger.log('====================================');
    this.logger.log('🔍 CONFIGURACIÓN ML SERVICE');
    this.logger.log(`📍 ML_SERVICE_URL desde .env: "${mlUrl}"`);
    this.logger.log(`📍 Tipo: ${typeof mlUrl}`);
    this.logger.log(`📍 Longitud: ${mlUrl?.length || 0} caracteres`);
    
    if (!mlUrl) {
      this.logger.error('❌ ML_SERVICE_URL no está definido en el archivo .env');
      throw new InternalServerErrorException('ML_SERVICE_URL no está definido en las variables de entorno');
    }

    // Remover barra final si existe
    this.ML_SERVICE_URL = mlUrl.endsWith('/') ? mlUrl.slice(0, -1) : mlUrl;
    
    this.logger.log(`✅ URL limpia: "${this.ML_SERVICE_URL}"`);
    this.logger.log(`📍 Endpoint completo: "${this.ML_SERVICE_URL}/recommendations"`);
    this.logger.log('====================================');
  }

// Reemplaza tu método getRecommendations actual con este:

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
    
    this.logger.log('');
    this.logger.log('📤 PETICIÓN HTTP AL ML SERVICE');
    this.logger.log(`📍 URL: "${fullUrl}"`);
    this.logger.log(`📍 Método: POST`);
    this.logger.log(`📍 Payload: ${JSON.stringify(requestPayload, null, 2)}`);
    this.logger.log('⏳ Enviando petición...');
    const startTime = Date.now();

    const mlResponse = await firstValueFrom(
      this.httpService.post(fullUrl, requestPayload).pipe(
        timeout(55000),
        catchError(async (error: AxiosError) => {
          const elapsed = Date.now() - startTime;
          
          this.logger.error('');
          this.logger.error('❌❌❌ ERROR EN PETICIÓN HTTP ❌❌❌');
          this.logger.error(`⏱️ Tiempo: ${elapsed}ms`);
          this.logger.error(`📍 URL intentada: "${error.config?.url}"`);
          this.logger.error(`📍 Método: ${error.config?.method?.toUpperCase()}`);
          this.logger.error(`📍 Error code: ${error.code}`);
          this.logger.error(`📍 Error message: ${error.message}`);
          
          if (error.response) {
            this.logger.error(`📍 HTTP Status: ${error.response.status}`);
            this.logger.error(`📍 Status Text: ${error.response.statusText}`);
            this.logger.error(`📍 Response Data: ${JSON.stringify(error.response.data)}`);
            
            // 🔥 SI ES 404 POR USUARIO NO ENCONTRADO, INTENTAR SINCRONIZAR
            if (error.response.status === 404 ) {
              
              this.logger.warn('🔄 Usuario no encontrado en ML Service, intentando sincronizar...');
              
              try {
                // Sincronizar usuario
                await this.syncUserToMLService(userId);
                
                this.logger.log('✅ Usuario sincronizado, reintentando recomendaciones...');
                
                // Esperar 2 segundos para que el ML procese
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Reintentar la petición
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

    const elapsed = Date.now() - startTime;
    
    this.logger.log('');
    this.logger.log('✅✅✅ RESPUESTA EXITOSA DEL ML SERVICE ✅✅✅');
    this.logger.log(`⏱️ Tiempo: ${elapsed}ms`);
    this.logger.log(`📍 HTTP Status: ${mlResponse.status}`);
    this.logger.log(`📊 Datos: ${JSON.stringify(mlResponse.data).substring(0, 300)}...`);
    this.logger.log('✅✅✅ FIN DE RESPUESTA EXITOSA ✅✅✅');
    this.logger.log('');

    const recommendations = mlResponse.data.recommendations || [];
    this.logger.log(`📊 Recomendaciones recibidas: ${recommendations.length}`);

    if (recommendations.length === 0) {
      this.logger.warn(`⚠️ No ML recommendations for user ${userId}, using fallback`);
      return this.getFallbackRecommendations(userId, excludeUsers, limit);
    }

    this.logger.log(`🔄 Enriqueciendo ${recommendations.length} recomendaciones...`);
    const enrichedUsers = await this.enrichRecommendations(recommendations);
    
    this.logger.log(`✅ ${enrichedUsers.length} usuarios enriquecidos`);
    this.logger.log('====================================');

    return {
      success: true,
      data: enrichedUsers,
      total: enrichedUsers.length,
      message: 'Recomendaciones obtenidas exitosamente',
    };

  } catch (error) {
    this.logger.error('');
    this.logger.error('💥💥💥 ERROR GENERAL 💥💥💥');
    this.logger.error(`📍 Error: ${error.message}`);
    
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
    this.logger.error('💥💥💥 FIN DEL ERROR 💥💥💥');
    this.logger.error('');

    this.logger.log('🔄 Usando fallback...');
    const excludeUsers = await this.getExcludedUsers(userId);
    return this.getFallbackRecommendations(userId, excludeUsers, limit);
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

/**
 * Sincroniza TODOS los usuarios con el ML Service
 */
async syncAllUsersToMLService(): Promise<{ synced: number; failed: number }> {
  try {
    this.logger.log('🔄 Iniciando sincronización masiva con ML Service...');

    const syncAllUrl = `${this.ML_SERVICE_URL}/users/sync-all`;
    
    this.logger.log(`📤 Enviando petición a: ${syncAllUrl}`);
    
    const response = await firstValueFrom(
      this.httpService.post(
        syncAllUrl,
        {},
        { 
          timeout: 120000, // 2 minutos para sincronización masiva
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    );

    const result = response.data;
    
    this.logger.log(`✅ Sincronización masiva completada:`);
    this.logger.log(`   Sincronizados: ${result.users_synced}`);
    this.logger.log(`   Fallidos: ${result.users_failed}`);

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

/**
 * Verifica si un usuario existe en el ML Service
 */
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

/**
 * Obtiene estadísticas del ML Service
 */
async getMLServiceStats(): Promise<any> {
  try {
    this.logger.log('📊 Obteniendo estadísticas del ML Service...');

    // Puedes agregar un endpoint /stats en tu Python API
    const statsUrl = `${this.ML_SERVICE_URL}/stats`;
    
    const response = await firstValueFrom(
      this.httpService.get(statsUrl, { timeout: 10000 })
    );

    return response.data;
    
  } catch (error) {
    this.logger.error(`❌ Error obteniendo estadísticas: ${error.message}`);
    
    // Si el endpoint no existe, retornar info básica
    return {
      available: false,
      error: error.message,
      ml_service_url: this.ML_SERVICE_URL,
    };
  }
}

/**
 * Hook: Sincronizar automáticamente cuando se solicitan recomendaciones
 * y el usuario no existe en ML
 */
private async ensureUserSyncedBeforeRecommendations(userId: string): Promise<void> {
  try {
    const exists = await this.checkUserExistsInML(userId);
    
    if (!exists) {
      this.logger.warn(`⚠️ Usuario ${userId} no existe en ML, sincronizando...`);
      await this.syncUserToMLService(userId);
      
      // Pequeña espera para que el ML Service procese
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    this.logger.error(`❌ Error asegurando sincronización: ${error.message}`);
    // No lanzar error, dejar que el fallback maneje esto
  }
}
  async createSwipeAction(
    userId: string,
    dto: CreateSwipeActionDTO,
  ): Promise<SwipeActionResponseDTO> {
    const { targetUserId, action } = dto;

    // Validar que no esté intentando hacerse match consigo mismo
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

    // Si la acción es dislike, solo registramos (opcional: guardar en colección de dislikes)
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
      // ¡ES UN MATCH MUTUO!
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

    // Agregar el propio userId
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
        matchScore: rec.score || 0,
        distance: rec.distance || 0,
        isOnline: user.activity?.isOnline || false,
        lastActive: user.activity?.lastActive || null,
        showAge: user.privacy?.showAge !== false,
        showLocation: user.privacy?.showLocation !== false,
        showSemester: user.privacy?.showSemester !== false,
      };
    }).filter(u => u !== null);
  }


  private async getFallbackRecommendations(
    userId: string,
    excludeUsers: string[],
    limit: number
  ): Promise<GetRecommendationsResponseDTO> {
    this.logger.warn('🔄 Using fallback recommendations');

    const users = await this.userModel
      .find({
        _id: {
          $nin: excludeUsers.map(id => id)
        }
      })
      .select('email profile skills objectives activity privacy')
      .limit(limit)
      .lean();

    this.logger.log(`📊 Fallback encontró ${users.length} usuarios`);

    const recommendations: RecommendedUserDTO[] = users.map(user => ({
      userId: user._id.toString(),
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
      matchScore: 0,
      distance: 0,
      isOnline: user.activity?.isOnline || false,
      lastActive: user.activity?.lastActive || null,
      showAge: user.privacy?.showAge !== false,
      showLocation: user.privacy?.showLocation !== false,
      showSemester: user.privacy?.showSemester !== false,
    }));

    return {
      success: true,
      data: recommendations,
      total: recommendations.length,
      message: 'Recomendaciones generadas (modo respaldo)',
    };
  }
}