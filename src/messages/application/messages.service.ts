import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageRepository } from '../domain/repositories/message.repository';
import { Message } from '../domain/entities/message.entity';
import { MatchRepository } from '../../matches/domain/repositories/match.repository';
import { UserRepository } from '../../users/domain/repositories/user.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from '../infrastructure/schemas/chat.schema';


@Injectable()
export class MessagesService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly matchRepository: MatchRepository,
    private readonly userRepository: UserRepository,
    @InjectModel(Chat.name)
    private readonly chatModel: Model<ChatDocument>,
  ) {}

  async createMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
    type: string;
    replyTo?: string;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    // Verificar que el usuario es participante del chat
    const isParticipant = await this.isUserInChat(data.senderId, data.chatId);
    if (!isParticipant) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    const message = new Message(
      '', // Se generará en BD
      data.chatId,
      data.senderId,
      data.content,
      data.type as any,
      'sent',
      new Date(),
      new Date(),
      false,
      false,
      data.replyTo,
      data.metadata,
    );

    const created = await this.messageRepository.create(message);

    // Incrementar contador de no leídos para el receptor
    await this.incrementUnreadCount(data.chatId, data.senderId);

    return created;
  }

  async getMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verificar acceso
    const isParticipant = await this.isUserInChat(userId, chatId);
    if (!isParticipant) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    return this.messageRepository.findByChatId(chatId, page, limit);
  }

  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    // Verificar que los mensajes pertenecen a chats del usuario
    // Por simplicidad, asumimos que el gateway ya validó esto
    await this.messageRepository.markAsRead(messageIds);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propios mensajes');
    }

    await this.messageRepository.deleteMessage(messageId, userId);
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    return this.messageRepository.getUnreadCount(chatId, userId);
  }

  async isUserInChat(userId: string, chatId: string): Promise<boolean> {
    const chat = await this.chatModel.findById(chatId);
    
    if (!chat) {
      return false;
    }

    return chat.participants.some(
      p => p.toString() === userId
    );
  }

  async getChatParticipants(chatId: string): Promise<string[]> {
    const chat = await this.chatModel.findById(chatId);
    
    if (!chat) {
      return [];
    }

    return chat.participants.map(p => p.toString());
  }

  async getUserChats(userId: string): Promise<string[]> {
    const chats = await this.chatModel.find({
      participants: new Types.ObjectId(userId),
      isActive: true,
    });

    return chats.map(chat => chat._id.toString());
  }

  async getUserContacts(userId: string): Promise<string[]> {
    // Obtener todos los matches confirmados del usuario
    const confirmedMatches = await this.matchRepository.getConfirmedMatches(
      userId,
      1,
      1000,
    );

    const contacts: string[] = [];

    for (const match of confirmedMatches.data) {
      const otherId = match.user1 === userId ? match.user2 : match.user1;
      contacts.push(otherId);
    }

    return contacts;
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.userRepository.updateLastSeen(userId);
  }

  async getOrCreateChat(matchId: string, userId: string): Promise<string> {
    // Verificar que el match existe y está confirmado
    const match = await this.matchRepository.findByIdOrThrow(matchId);

    if (match.status !== 'accepted') {
      throw new ForbiddenException('El match debe estar confirmado');
    }

    // Verificar que el usuario es parte del match
    if (match.user1 !== userId && match.user2 !== userId) {
      throw new ForbiddenException('No eres parte de este match');
    }

    // Buscar chat existente
    let chat = await this.chatModel.findOne({ matchId: new Types.ObjectId(matchId) });

    // Si no existe, crear uno nuevo
    if (!chat) {
      chat = new this.chatModel({
        matchId: new Types.ObjectId(matchId),
        participants: [
          new Types.ObjectId(match.user1),
          new Types.ObjectId(match.user2),
        ],
        unreadCount: new Map(),
        isActive: true,
      });
      await chat.save();
    }

    return chat._id.toString();
  }

  private async incrementUnreadCount(chatId: string, senderId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    
    if (!chat) return;

    // Incrementar contador para cada participante que NO sea el remitente
    for (const participantId of chat.participants) {
      const participantIdStr = participantId.toString();
      if (participantIdStr !== senderId) {
        const currentCount = chat.unreadCount.get(participantIdStr) || 0;
        chat.unreadCount.set(participantIdStr, currentCount + 1);
      }
    }

    await chat.save();
  }

  async resetUnreadCount(chatId: string, userId: string): Promise<void> {
    await this.chatModel.findByIdAndUpdate(
      chatId,
      {
        $set: {
          [`unreadCount.${userId}`]: 0,
        },
      },
    );
  }
}