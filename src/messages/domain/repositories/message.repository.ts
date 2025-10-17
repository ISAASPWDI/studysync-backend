import { Message } from '../entities/message.entity';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export abstract class MessageRepository {
  abstract create(message: Message): Promise<Message>;
  abstract findById(messageId: string): Promise<Message | null>;
  abstract findByChatId(
    chatId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<Message>>;
  abstract updateStatus(
    messageId: string,
    status: string,
  ): Promise<Message | null>;
  abstract markAsRead(messageIds: string[]): Promise<void>;
  abstract deleteMessage(messageId: string, userId: string): Promise<void>;
  abstract getUnreadCount(chatId: string, userId: string): Promise<number>;
}