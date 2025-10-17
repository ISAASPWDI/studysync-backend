import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateMessageDTO {
  @IsString()
  chatId: string;

  @IsString()
  content: string;

  @IsEnum(['text', 'image', 'file', 'location', 'voice'])
  type: string;

  @IsOptional()
  @IsString()
  replyTo?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class MessageResponseDTO {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: string;
  metadata?: Record<string, any>;
}

export class GetMessagesResponseDTO {
  data: MessageResponseDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class MarkAsReadDTO {
  @IsString({ each: true })
  messageIds: string[];
}

export class UpdateMessageStatusDTO {
  @IsEnum(['sent', 'delivered', 'read'])
  status: string;
}