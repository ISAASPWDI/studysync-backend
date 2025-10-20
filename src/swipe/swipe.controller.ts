// Agregar estos endpoints en swipe.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SwipeService } from './application/swipe.service';
import {
  GetRecommendationsResponseDTO,
  CreateSwipeActionDTO,
  SwipeActionResponseDTO,
} from './infrastructure/dto/swipe.dto';
import { GetUser } from 'src/users/infrastructure/decorators/get-user.decorator';

@Controller('swipe')
@UseGuards(AuthGuard('jwt'))
export class SwipeController {
  constructor(private readonly swipeService: SwipeService) {}

  @Get('recommendations')
  async getRecommendations(
    @GetUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<GetRecommendationsResponseDTO> {
    return this.swipeService.getRecommendations(userId, limit);
  }

  @Post('action')
  async createSwipeAction(
    @GetUser('id') userId: string,
    @Body() dto: CreateSwipeActionDTO,
  ): Promise<SwipeActionResponseDTO> {
    return this.swipeService.createSwipeAction(userId, dto);
  }

  // 🔥 NUEVOS ENDPOINTS DE SINCRONIZACIÓN

  /**
   * Sincroniza el perfil del usuario actual con el ML Service
   * Llamar después de completar/actualizar el perfil
   */
  @Post('sync-profile')
  async syncCurrentUserProfile(@GetUser('id') userId: string) {
    try {
      const result = await this.swipeService.syncUserToMLService(userId);
      return {
        success: true,
        message: 'Perfil sincronizado con el sistema de recomendaciones',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Error sincronizando perfil: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sincroniza un usuario específico (por admin o testing)
   */
  @Post('sync-user/:userId')
  async syncSpecificUser(@Param('userId') userId: string) {
    try {
      const result = await this.swipeService.syncUserToMLService(userId);
      return {
        success: true,
        message: `Usuario ${userId} sincronizado exitosamente`,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Error sincronizando usuario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sincroniza TODOS los usuarios con el ML Service
   * ⚠️ IMPORTANTE: En producción, protege este endpoint con rol de admin
   */
  @Post('sync-all-users')
  async syncAllUsers() {
    try {
      const result = await this.swipeService.syncAllUsersToMLService();
      return {
        success: true,
        message: 'Sincronización masiva completada',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Error en sincronización masiva: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifica si un usuario existe en el ML Service
   */
  @Get('check-ml-sync/:userId')
  async checkMLSync(@Param('userId') userId: string) {
    try {
      const exists = await this.swipeService.checkUserExistsInML(userId);
      return {
        success: true,
        userId,
        existsInML: exists,
        message: exists 
          ? 'Usuario sincronizado correctamente' 
          : 'Usuario no encontrado en ML Service',
      };
    } catch (error) {
      return {
        success: false,
        userId,
        existsInML: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtiene estadísticas del ML Service
   */
  @Get('ml-stats')
  async getMLStats() {
    try {
      const stats = await this.swipeService.getMLServiceStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        `Error obteniendo estadísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}