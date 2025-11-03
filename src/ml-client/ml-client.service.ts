// src/common/services/ml-client.service.ts

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface MLPaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  showing: number;
}

interface MLRecommendationResponse {
  recommendations: Array<{
    user_id: string;
    similarity_score: number;
    distance_info?: {
      distance_km: number;
    };
    compatibility_indicators?: any;
    profile_preview?: any;
  }>;
  pagination: MLPaginationResponse;
  compatibility_metrics?: any;
  cache_used: boolean;
  model_version: string;
  generated_at: string;
}


@Injectable()
export class MlClientService {
    private readonly logger = new Logger(MlClientService.name);
    private readonly ML_SERVICE_URL: string;
    private readonly WEBHOOK_API_KEY: string | undefined;
    private readonly REQUEST_TIMEOUT = 5000;
    private readonly RECOMMENDATIONS_TIMEOUT = 10000;
    private readonly RETRAIN_TIMEOUT = 30000;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const mlUrl = this.configService.get<string>('ML_SERVICE_URL');
        if (!mlUrl) {
            this.logger.error('❌ ML_SERVICE_URL no está definido en .env');
            throw new InternalServerErrorException('ML_SERVICE_URL no configurado');
        }

        this.ML_SERVICE_URL = mlUrl;
        this.WEBHOOK_API_KEY = this.configService.get<string>('ML_WEBHOOK_API_KEY');

        this.logger.log(`✅ ML Client Service inicializado: ${this.ML_SERVICE_URL}`);
    }

    /**
     * Notifica al servicio ML que un usuario fue actualizado
     * MODO SÍNCRONO: Espera a que el ML termine de re-entrenar (30 segundos timeout)
     * 
     * @param userId - ID del usuario actualizado
     */
    async notifyUserUpdated(userId: string): Promise<void> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.WEBHOOK_API_KEY) {
                headers['x-api-key'] = this.WEBHOOK_API_KEY;
            }

            this.logger.log(`📤 Notificando ML (síncrono): Usuario ${userId} actualizado`);
            this.logger.log(`   URL: ${this.ML_SERVICE_URL}/webhook/user-updated`);

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.ML_SERVICE_URL}/webhook/user-updated`,
                    {}, // Body vacío - el ML re-entrena toda la BD
                    {
                        headers,
                        timeout: this.RETRAIN_TIMEOUT,
                    }
                )
            );

            this.logger.log(`📥 ML Response: ${JSON.stringify(response.data)}`);

            if (response.data.status === 'completed') {
                this.logger.log(`✅ ML re-entrenado: ${response.data.users_processed || 'N/A'} usuarios`);
            } else if (response.data.status === 'error') {
                this.logger.error(`❌ ML error: ${response.data.error}`);
            } else {
                this.logger.warn(`⚠️ ML respuesta inesperada: ${response.data.message}`);
            }
        } catch (error) {
            this.handleMlError(error, 'notifyUserUpdated');
        }
    }

    /**
     * Solicita recomendaciones al servicio ML CON PAGINACIÓN
     * BLOQUEA - Espera respuesta del ML
     * 
     * @param userId - ID del usuario
     * @param excludeUsers - Usuarios a excluir (ya swipeados)
     * @param limit - Resultados por página (default: 10)
     * @param page - Número de página (default: 1)
     * @param useCache - Usar cache de recomendaciones (default: true)
     */
    async getRecommendations(
        userId: string,
        excludeUsers: string[],
        limit: number = 10,
        page: number = 1,
        useCache: boolean = true
    ): Promise<MLRecommendationResponse> {
        try {
            this.logger.log(`🔍 Solicitando recomendaciones para: ${userId}`);
            this.logger.log(`   Página: ${page}, Límite: ${limit}, Cache: ${useCache}`);

            const response = await firstValueFrom(
                this.httpService.post<MLRecommendationResponse>(
                    `${this.ML_SERVICE_URL}/recommendations`,
                    {
                        user_id: userId,
                        exclude_users: excludeUsers,
                        limit: limit,
                        page: page,
                        use_cache: useCache,
                    },
                    {
                        timeout: this.RECOMMENDATIONS_TIMEOUT,
                    }
                )
            );

            const data = response.data;
            this.logger.log(
                `✅ Recomendaciones obtenidas: ${data.recommendations?.length || 0} usuarios, ` +
                `Página ${data.pagination.page}/${data.pagination.total_pages}, ` +
                `Total: ${data.pagination.total}, Cache: ${data.cache_used}`
            );

            return data;
        } catch (error) {
            this.handleMlError(error, 'getRecommendations');
            throw error;
        }
    }

    /**
     * Limpia el cache de recomendaciones
     * 
     * @param userId - Usuario específico (opcional). Si no se envía, limpia todo el cache
     */
    async clearRecommendationCache(userId?: string): Promise<boolean> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.WEBHOOK_API_KEY) {
                headers['x-api-key'] = this.WEBHOOK_API_KEY;
            }

            this.logger.log(`🗑️ Limpiando cache de recomendaciones ${userId ? `para ${userId}` : '(completo)'}`);

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.ML_SERVICE_URL}/cache/clear`,
                    {
                        user_id: userId || null,
                    },
                    {
                        headers,
                        timeout: this.REQUEST_TIMEOUT,
                    }
                )
            );

            this.logger.log(`✅ Cache limpiado: ${response.data.message} (${response.data.cleared_entries} entradas)`);
            return true;
        } catch (error) {
            this.handleMlError(error, 'clearRecommendationCache');
            return false;
        }
    }

    /**
     * Re-entrena el modelo ML manualmente
     */
    async triggerManualRetrain(): Promise<boolean> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (this.WEBHOOK_API_KEY) {
                headers['x-api-key'] = this.WEBHOOK_API_KEY;
            }

            this.logger.log('🔄 Solicitando re-entrenamiento manual del modelo ML');

            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.ML_SERVICE_URL}/retrain`,
                    {},
                    {
                        headers,
                        timeout: this.RETRAIN_TIMEOUT,
                    }
                )
            );

            this.logger.log(`✅ Modelo re-entrenado: ${response.data.details?.users_processed || 'N/A'} usuarios`);
            return true;
        } catch (error) {
            this.handleMlError(error, 'triggerManualRetrain');
            return false;
        }
    }

    /**
     * Verifica el estado del servicio ML
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.ML_SERVICE_URL}/health`, {
                    timeout: this.REQUEST_TIMEOUT,
                })
            );

            const isHealthy = response.data.status === 'healthy' && response.data.model_trained === true;
            
            if (isHealthy) {
                this.logger.log(
                    `✅ ML Service healthy: ${response.data.users_loaded} usuarios cargados, ` +
                    `${response.data.cache_entries || 0} entradas en cache`
                );
            } else {
                this.logger.warn('⚠️ ML Service responde pero el modelo no está entrenado');
            }

            return isHealthy;
        } catch (error) {
            this.handleMlError(error, 'checkHealth');
            return false;
        }
    }

    /**
     * Obtiene estadísticas del modelo ML
     */
    async getModelStats(): Promise<any> {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.ML_SERVICE_URL}/model/stats`, {
                    timeout: this.REQUEST_TIMEOUT,
                })
            );

            this.logger.log(`📊 Model Stats: ${response.data.total_users} usuarios, Cache: ${response.data.cache_size || 0}`);
            return response.data;
        } catch (error) {
            this.handleMlError(error, 'getModelStats');
            return null;
        }
    }

    /**
     * Manejo centralizado de errores del ML
     */
    private handleMlError(error: any, operation: string): void {
        if (error.code === 'ECONNREFUSED') {
            this.logger.warn(`⚠️ [${operation}] ML service no está disponible (ECONNREFUSED)`);
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            this.logger.warn(`⚠️ [${operation}] Timeout conectando con ML service`);
        } else if (error.response) {
            const status = error.response.status;
            const detail = error.response.data?.detail || 'Unknown error';
            
            if (status === 400) {
                this.logger.warn(`⚠️ [${operation}] Solicitud inválida: ${detail}`);
            } else if (status === 404) {
                this.logger.warn(`⚠️ [${operation}] Recurso no encontrado: ${detail}`);
            } else {
                this.logger.warn(`⚠️ [${operation}] ML service respondió con error: ${status} - ${detail}`);
            }
        } else {
            this.logger.warn(`⚠️ [${operation}] Error inesperado: ${error.message}`);
        }
    }
}