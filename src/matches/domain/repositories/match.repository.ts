// src/matches/domain/repositories/match.repository.ts

import { Match, MatchStatus } from '../entities/match.entity';

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

export abstract class MatchRepository {
  abstract findById(matchId: string): Promise<Match | null>;
  abstract findByIdOrThrow(matchId: string): Promise<Match>;
  
  abstract getConfirmedMatches(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<Match>>;
  
  abstract getPendingReceivedMatches(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<Match>>;
  
  abstract getSentMatches(
    userId: string,
    page: number,
    limit: number,
    status: MatchStatus | 'all',
  ): Promise<PaginationResult<Match>>;
  
  abstract searchMatches(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<Match[]>;
  
  abstract acceptMatch(matchId: string): Promise<Match>;
  abstract rejectMatch(matchId: string): Promise<Match>;
  
  abstract countDocuments(filter: any): Promise<number>;
}