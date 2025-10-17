import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: AuthenticatedSocket = context.switchToWs().getClient();
      
      // Si ya tiene userId, está autenticado
      if (client.userId) {
        return true;
      }

      // Extraer token
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.error('❌ No token provided');
        return false;
      }

      // Validar token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;

      this.logger.log(`✅ User authenticated: ${client.userId}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Authentication failed: ${error.message}`);
      return false;
    }
  }

  private extractToken(client: Socket): string | null {
    // Intentar desde query
    const queryToken = client.handshake.query.token as string;
    if (queryToken) return queryToken;

    // Intentar desde headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Intentar desde auth (algunas versiones de socket.io)
    const auth = client.handshake.auth?.token;
    if (auth) return auth;

    return null;
  }
}