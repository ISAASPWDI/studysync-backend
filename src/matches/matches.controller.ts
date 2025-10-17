// src/matches/matches.controller.ts

import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './infrastructure/decorators/get-user.decorator';
import { MatchesService } from './application/matches.service';
import {
  ConfirmedMatchesResponseDTO,
  PendingMatchesResponseDTO,
  SentMatchesResponseDTO,
  AcceptMatchResponseDTO,
  RejectMatchResponseDTO,
  SearchMatchesResponseDTO,
} from './infrastructure/dto/match-response.dto';
import { MatchStatus } from './domain/entities/match.entity';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('confirmed')
  async getConfirmedMatches(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<ConfirmedMatchesResponseDTO> {
    return this.matchesService.getConfirmedMatches(userId, page, limit);
  }

  @Get('pending/received')
  async getPendingReceivedMatches(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<PendingMatchesResponseDTO> {
    return this.matchesService.getPendingReceivedMatches(userId, page, limit);
  }

  @Get('pending/sent')
  async getSentMatches(
    @GetUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new DefaultValuePipe('all')) status: MatchStatus | 'all',
  ): Promise<SentMatchesResponseDTO> {
    return this.matchesService.getSentMatches(userId, page, limit, status);
  }

  @Post(':matchId/accept')
  @HttpCode(200)
  async acceptMatch(
    @GetUser('id') userId: string,
    @Param('matchId') matchId: string,
  ): Promise<AcceptMatchResponseDTO> {
    return this.matchesService.acceptMatch(userId, matchId);
  }

  @Post(':matchId/reject')
  @HttpCode(200)
  async rejectMatch(
    @GetUser('id') userId: string,
    @Param('matchId') matchId: string,
  ): Promise<RejectMatchResponseDTO> {
    return this.matchesService.rejectMatch(userId, matchId);
  }

  @Get('search')
  async searchMatches(
    @GetUser('id') userId: string,
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<SearchMatchesResponseDTO> {
    return this.matchesService.searchMatches(userId, query, page, limit);
  }
}