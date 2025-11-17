import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';


import {
  Message as MessageSchema,
  MessageDocument,
} from '../schemas/message.schema';
import {
  Chat as ChatSchema,
  ChatDocument,
} from '../schemas/chat.schema';
import { MessageMapper } from '../mappers/message.mapper';
import { Message } from 'src/messages/domain/entities/message.entity';
import { MessageRepository, PaginationResult } from 'src/messages/domain/repositories/message.repository';


@Injectable()
export class MessageRepositoryMongo implements MessageRepository {
  constructor(
    @InjectModel(MessageSchema.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ChatSchema.name)
    private readonly chatModel: Model<ChatDocument>,
  ) {}

  async create(message: Message): Promise<Message> {
    const messageDoc = new this.messageModel({
      chatId: new Types.ObjectId(message.chatId),
      senderId: new Types.ObjectId(message.senderId),
      content: message.content, // se podria encriptar mediante un servicio
      type: message.type,
      status: message.status,
      replyTo: message.replyTo ? new Types.ObjectId(message.replyTo) : undefined,
      metadata: message.metadata,
    });

    const saved = await messageDoc.save();

    // Actualizar el chat con el último mensaje
    await this.chatModel.findByIdAndUpdate(
      message.chatId,
      {
        $set: {
          lastMessageId: saved._id,
          lastMessageAt: saved.createdAt,
        },
        $inc: {

        },
      },
    );

    return MessageMapper.toDomain(saved);
  }

  async findById(messageId: string): Promise<Message | null> {
    const messageDoc = await this.messageModel
      .findById(messageId)
      .populate('replyTo')
      .exec();

    return messageDoc ? MessageMapper.toDomain(messageDoc) : null;
  }

  async findByChatId(
    chatId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<Message>> {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ 
          chatId: new Types.ObjectId(chatId),
          isDeleted: false 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('replyTo')
        .exec(),
      this.messageModel.countDocuments({ 
        chatId: new Types.ObjectId(chatId),
        isDeleted: false 
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: messages.map(MessageMapper.toDomain),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateStatus(messageId: string, status: string): Promise<Message | null> {
    const updated = await this.messageModel
      .findByIdAndUpdate(
        messageId,
        { $set: { status } },
        { new: true },
      )
      .exec();

    return updated ? MessageMapper.toDomain(updated) : null;
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    await this.messageModel.updateMany(
      { _id: { $in: messageIds.map(id => new Types.ObjectId(id)) } },
      { $set: { status: 'read' } },
    );
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    await this.messageModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(messageId),
        senderId: new Types.ObjectId(userId)
      },
      { 
        $set: { 
          isDeleted: true,
          content: '[Mensaje eliminado]'
        } 
      },
    );
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      chatId: new Types.ObjectId(chatId),
      senderId: { $ne: new Types.ObjectId(userId) },
      status: { $ne: 'read' },
      isDeleted: false,
    });
  }
}