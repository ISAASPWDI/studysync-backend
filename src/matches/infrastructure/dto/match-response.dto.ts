// src/matches/infrastructure/dto/match-response.dto.ts

import { IsString, IsNumber, IsBoolean, IsDate, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class OtherUserDTO {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsBoolean()
  isOnline: boolean;

  @IsOptional()
  @IsDate()
  lastSeenAt?: Date;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class LastMessageDTO {
  @IsString()
  content: string;

  @IsDate()
  createdAt: Date;

  @IsString()
  senderId: string;
}

export class ConfirmedMatchDTO {
  @IsString()
  id: string;

  @IsString()
  matchId: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @Type(() => OtherUserDTO)
  otherUser: OtherUserDTO;

  @IsOptional()
  @Type(() => LastMessageDTO)
  lastMessage?: LastMessageDTO;

  @IsNumber()
  unreadCount: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore: number;
}

export class PendingMatchDTO {
  @IsString()
  id: string;

  @IsString()
  matchId: string;

  @IsDate()
  createdAt: Date;

  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore: number;

  @Type(() => OtherUserDTO)
  otherUser: OtherUserDTO;
}

export class SentMatchDTO {
  @IsString()
  id: string;

  @IsString()
  matchId: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  @IsEnum(['pending', 'accepted', 'rejected'])
  status: string;

  @Type(() => OtherUserDTO)
  otherUser: OtherUserDTO;
}

export class PaginationDTO {
  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  totalPages: number;

  @IsBoolean()
  hasNextPage: boolean;

  @IsBoolean()
  hasPrevPage: boolean;
}

export class ConfirmedMatchesResponseDTO {
  @Type(() => ConfirmedMatchDTO)
  data: ConfirmedMatchDTO[];

  @Type(() => PaginationDTO)
  pagination: PaginationDTO;
}

export class PendingMatchesResponseDTO {
  @Type(() => PendingMatchDTO)
  data: PendingMatchDTO[];

  @Type(() => PaginationDTO)
  pagination: PaginationDTO;
}

export class SentMatchesResponseDTO {
  @Type(() => SentMatchDTO)
  data: SentMatchDTO[];

  @Type(() => PaginationDTO)
  pagination: PaginationDTO;
}

export class AcceptMatchResponseDTO {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  @IsString()
  matchId: string;

  match: {
    id: string;
    status: string;
    user1: string;
    user2: string;
    updatedAt: Date;
    chatId?: string;
  };
}

export class RejectMatchResponseDTO {
  @IsBoolean()
  success: boolean;

  @IsString()
  message: string;

  @IsString()
  matchId: string;
}

export class SearchMatchResultDTO {
  @IsString()
  id: string;

  @IsString()
  matchId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  picture?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsEnum(['pending', 'accepted', 'rejected'])
  status: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  lastMessage?: string;

  @IsDate()
  updatedAt: Date;
}

export class SearchMatchesResponseDTO {
  @Type(() => SearchMatchResultDTO)
  data: SearchMatchResultDTO[];

  @Type(() => PaginationDTO)
  pagination: PaginationDTO;
}