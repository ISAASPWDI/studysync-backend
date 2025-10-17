// src/swipe/infrastructure/dto/swipe.dto.ts

import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';

// ==================== REQUEST DTOs ====================

export class CreateSwipeActionDTO {
  @IsString()
  targetUserId: string;

  @IsEnum(['like', 'dislike', 'superlike'])
  action: 'like' | 'dislike' | 'superlike';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore?: number;
}

// ==================== RESPONSE DTOs ====================

export class RecommendedUserDTO {
  userId: string;
  name: string;
  age: number;
  location: string;
  university: string;
  faculty: string;
  semester: number;
  bio: string;
  profilePicture: string | null;
  skills: string[];
  interests: string[];
  objectives: string[];
  matchScore: number;
  distance: number;
  isOnline: boolean;
  lastActive: Date | null;
  showAge: boolean;
  showLocation: boolean;
  showSemester: boolean;
}

export class GetRecommendationsResponseDTO {
  success: boolean;
  data: RecommendedUserDTO[];
  total: number;
  message: string;
}

export class SwipeActionResponseDTO {
  success: boolean;
  action: 'like' | 'dislike' | 'superlike';
  message: string;
  isMatch: boolean;
  matchId?: string;
}