import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, InternalServerErrorException } from '@nestjs/common';
import { MessagesService } from '../../application/messages.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway()
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  afterInit(server: Server) {
    const clientUrl = this.configService.get<string>('CLIENT_URL');

    if (!clientUrl) {
      this.logger.error('❌ CLIENT_URL no está definido en el archivo .env');
      throw new InternalServerErrorException('CLIENT_URL no está definido en las variables de entorno');
    }
    server.engine.opts.cors = {
      origin: clientUrl,
      credentials: true,
    };

    this.logger.log(`🌐 WebSocket CORS configurado para: ${clientUrl}`);
  }
  // Conexión de cliente
  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.log(`🔌 Client attempting connection: ${client.id}`);

      const token = this.extractToken(client);

      if (!token) {
        this.logger.error('❌ No token provided');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;

      this.logger.log(`✅ Client connected: ${client.id}, User: ${client.userId}`);

      // Registrar socket del usuario
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      await this.messagesService.updateUserOnlineStatus(client.userId, true);
      this.emitUserStatusToContacts(client.userId, 'online');

      // Unir al usuario a sus chats
      const userChats = await this.messagesService.getUserChats(client.userId);
      userChats.forEach(chatId => {
        client.join(`chat:${chatId}`);
        this.logger.log(`👥 User ${client.userId} joined chat: ${chatId}`);
      });

    } catch (error) {
      this.logger.error(`❌ Connection error: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  // Desconexión de cliente
  async handleDisconnect(client: AuthenticatedSocket) {
    try {
      const userId = client.userId;

      if (userId) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(client.id);

          // Si no quedan sockets para este usuario, está offline
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            await this.messagesService.updateUserOnlineStatus(userId, false);
            this.emitUserStatusToContacts(userId, 'offline');
          }
        }
      }

      this.logger.log(`🔴 Client disconnected: ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Disconnection error: ${error.message}`);
    }
  }
  private extractToken(client: Socket): string | null {
    // Intentar desde query
    const queryToken = client.handshake.query.token as string;
    if (queryToken) {
      this.logger.log('✅ Token found in query');
      return queryToken;
    }

    // Intentar desde headers
    const authHeader = client.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      this.logger.log('✅ Token found in headers');
      return authHeader.substring(7);
    }

    // Intentar desde auth
    const auth = client.handshake.auth?.token;
    if (auth) {
      this.logger.log('✅ Token found in auth');
      return auth;
    }

    this.logger.error('❌ No token found in query, headers, or auth');
    return null;
  }

  // Enviar mensaje
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      chatId: string;
      content: string;
      type: string;
      replyTo?: string;
      metadata?: Record<string, any>;
    },
  ) {
    try {
      const userId = client.userId;

      this.logger.log(`Message from ${userId} to chat ${data.chatId}`);

      // Crear mensaje en BD
      const message = await this.messagesService.createMessage({
        chatId: data.chatId,
        senderId: userId,
        content: data.content,
        type: data.type,
        replyTo: data.replyTo,
        metadata: data.metadata,
      });

      // Emitir a todos los participantes del chat
      this.server.to(`chat:${data.chatId}`).emit('newMessage', {
        message,
        chatId: data.chatId,
      });

      // Actualizar contadores de no leídos
      const chatParticipants = await this.messagesService.getChatParticipants(
        data.chatId,
      );

      for (const participantId of chatParticipants) {
        if (participantId !== userId) {
          const unreadCount = await this.messagesService.getUnreadCount(
            data.chatId,
            participantId,
          );
          this.emitToUser(participantId, 'unreadCountUpdate', {
            chatId: data.chatId,
            unreadCount,
          });
        }
      }

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Usuario está escribiendo
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = client.userId;

    // Emitir a otros participantes del chat
    client.to(`chat:${data.chatId}`).emit('userTyping', {
      userId,
      chatId: data.chatId,
      isTyping: data.isTyping,
    });
  }

  // Marcar mensajes como leídos
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ) {
    try {
      const userId = client.userId;

      await this.messagesService.markMessagesAsRead(data.messageIds, userId);

      // Notificar al remitente que los mensajes fueron leídos
      this.server.to(`chat:${data.chatId}`).emit('messagesRead', {
        chatId: data.chatId,
        messageIds: data.messageIds,
        readBy: userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Mark as read error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Unirse a un chat
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    try {
      const userId = client.userId;

      // Verificar que el usuario es participante del chat
      const isParticipant = await this.messagesService.isUserInChat(
        userId,
        data.chatId,
      );

      if (!isParticipant) {
        return { success: false, error: 'No autorizado' };
      }

      client.join(`chat:${data.chatId}`);
      this.logger.log(`User ${userId} joined chat ${data.chatId}`);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Salir de un chat
  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
    this.logger.log(`User ${client.userId} left chat ${data.chatId}`);
  }

  // Helper: Emitir a un usuario específico (todas sus conexiones)
  private emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Helper: Notificar estado online a contactos
  private async emitUserStatusToContacts(userId: string, status: 'online' | 'offline') {
    try {
      const contacts = await this.messagesService.getUserContacts(userId);

      contacts.forEach(contactId => {
        this.emitToUser(contactId, 'userStatusChange', {
          userId,
          status,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      this.logger.error(`Error emitting user status: ${error.message}`);
    }
  }
}