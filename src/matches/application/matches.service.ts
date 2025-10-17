// src/matches/application/matches.service.ts

import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { MatchRepository } from '../domain/repositories/match.repository';
import { UserRepository } from '../../users/domain/repositories/user.repository';
import {
  ConfirmedMatchesResponseDTO,
  PendingMatchesResponseDTO,
  SentMatchesResponseDTO,
  AcceptMatchResponseDTO,
  RejectMatchResponseDTO,
  SearchMatchesResponseDTO,
  ConfirmedMatchDTO,
  PendingMatchDTO,
  SentMatchDTO,
  SearchMatchResultDTO,
  OtherUserDTO,
} from '../infrastructure/dto/match-response.dto';
import { Match, MatchStatus } from '../domain/entities/match.entity';
import { User } from '../../users/domain/entities/user.entity';

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly userRepository: UserRepository,
  ) { }

  async getConfirmedMatches(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ConfirmedMatchesResponseDTO> {
    const result = await this.matchRepository.getConfirmedMatches(userId, page, limit);

    const processedMatches = await Promise.all(
      result.data.map(match => this.processConfirmedMatch(match, userId)),
    );

    return {
      data: processedMatches,
      pagination: result.pagination,
    };
  }

  async getPendingReceivedMatches(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PendingMatchesResponseDTO> {
    const result = await this.matchRepository.getPendingReceivedMatches(userId, page, limit);

    const processedMatches = await Promise.all(
      result.data.map(match => this.processPendingMatch(match, userId)),
    );

    return {
      data: processedMatches,
      pagination: result.pagination,
    };
  }

  async getSentMatches(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status: MatchStatus | 'all' = 'all',
  ): Promise<SentMatchesResponseDTO> {
    const result = await this.matchRepository.getSentMatches(userId, page, limit, status);

    const processedMatches = await Promise.all(
      result.data.map(match => this.processSentMatch(match, userId)),
    );

    return {
      data: processedMatches,
      pagination: result.pagination,
    };
  }

  async acceptMatch(userId: string, matchId: string): Promise<AcceptMatchResponseDTO> {
    const match = await this.matchRepository.findByIdOrThrow(matchId);

    if (match.user2 !== userId) {
      throw new ForbiddenException('No tienes permiso para aceptar este match');
    }

    if (match.status !== 'pending') {
      throw new BadRequestException('El match ya no está pendiente');
    }

    const updatedMatch = await this.matchRepository.acceptMatch(matchId);

    // TODO: Crear chat para estos usuarios
    // const chat = await this.chatService.createChat(match.user1, match.user2, match.id);

    // TODO: Enviar notificación
    // await this.notificationService.sendMatchAccepted(match.user1);

    return {
      success: true,
      message: 'Match aceptado exitosamente',
      matchId: updatedMatch.id,
      match: {
        id: updatedMatch.id,
        status: updatedMatch.status,
        user1: updatedMatch.user1,
        user2: updatedMatch.user2,
        updatedAt: updatedMatch.updatedAt,
        chatId: updatedMatch.chatId,
      },
    };
  }

  async rejectMatch(userId: string, matchId: string): Promise<RejectMatchResponseDTO> {
    const match = await this.matchRepository.findByIdOrThrow(matchId);

    if (match.user2 !== userId) {
      throw new ForbiddenException('No tienes permiso para rechazar este match');
    }

    if (match.status !== 'pending') {
      throw new BadRequestException('El match ya no está pendiente');
    }

    await this.matchRepository.rejectMatch(matchId);

    return {
      success: true,
      message: 'Match rechazado',
      matchId,
    };
  }

  async searchMatches(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchMatchesResponseDTO> {
    if (!query || query.length < 2) {
      throw new BadRequestException('La búsqueda debe tener al menos 2 caracteres');
    }

    const matches = await this.matchRepository.searchMatches(userId, query, page, limit);

    const processedMatches = await Promise.all(
      matches.map(match => this.processSearchResult(match, userId)),
    );

    // Filtrar matches nulos Y además filtrar por el query en los datos procesados
    const filteredMatches = processedMatches.filter((m): m is SearchMatchResultDTO => {
      if (!m) return false;

      const searchLower = query.toLowerCase();
      const nameMatch = m.name.toLowerCase().includes(searchLower);
      const subjectMatch = m.subject?.toLowerCase().includes(searchLower) ?? false;
      const universityMatch = m.university?.toLowerCase().includes(searchLower) ?? false;

      return nameMatch || subjectMatch || universityMatch;
    });


    const totalPages = Math.ceil(filteredMatches.length / limit);

    return {
      data: filteredMatches, // ✅ Ahora TypeScript sabe que no hay nulls
      pagination: {
        total: filteredMatches.length,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Helper methods
  private async processConfirmedMatch(match: Match, userId: string): Promise<ConfirmedMatchDTO> {
    const otherUserId = this.getOtherUserId(match, userId);
    const otherUser = await this.userRepository.findById(otherUserId);

    if (!otherUser) {
      throw new Error('Usuario no encontrado');
    }

    const isOnline = await this.userRepository.isUserOnline(otherUser.activity?.lastSeenAt || null);

    return {
      id: match.id,
      matchId: match.id,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      otherUser: this.mapToOtherUserDTO(otherUser, isOnline),
      lastMessage: undefined, // TODO: Obtener del servicio de mensajes
      unreadCount: 0, // TODO: Obtener del servicio de mensajes
      matchScore: match.matchScore,
    };
  }

  private async processPendingMatch(match: Match, userId: string): Promise<PendingMatchDTO> {
    const otherUserId = this.getOtherUserId(match, userId);
    const otherUser = await this.userRepository.findById(otherUserId);

    if (!otherUser) {
      throw new Error('Usuario no encontrado');
    }

    const isOnline = await this.userRepository.isUserOnline(otherUser.activity?.lastSeenAt || null);

    return {
      id: match.id,
      matchId: match.id,
      createdAt: match.createdAt,
      matchScore: match.matchScore,
      otherUser: this.mapToOtherUserDTO(otherUser, isOnline),
    };
  }

  private async processSentMatch(match: Match, userId: string): Promise<SentMatchDTO> {
    const otherUserId = this.getOtherUserId(match, userId);
    const otherUser = await this.userRepository.findById(otherUserId);

    if (!otherUser) {
      throw new Error('Usuario no encontrado');
    }

    const isOnline = await this.userRepository.isUserOnline(otherUser.activity?.lastSeenAt || null);

    return {
      id: match.id,
      matchId: match.id,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      status: match.status,
      otherUser: this.mapToOtherUserDTO(otherUser, isOnline),
    };
  }

  private async processSearchResult(match: Match, userId: string): Promise<SearchMatchResultDTO | null> {
    const otherUserId = this.getOtherUserId(match, userId);
    const otherUser = await this.userRepository.findById(otherUserId);

    if (!otherUser) {
      return null;
    }

    const fullName = `${otherUser.profile?.firstName || ''} ${otherUser.profile?.lastName || ''}`.trim();

    return {
      id: match.id,
      matchId: match.id,
      name: fullName || 'Usuario sin nombre',
      picture: otherUser.picture,
      subject: otherUser.skills?.technical?.[0] || 'Sin materia',
      university: otherUser.profile?.university || 'Sin universidad',
      status: match.status,
      type: match.status === 'accepted' ? 'confirmed' : 'pending',
      lastMessage: undefined, // TODO: Obtener del servicio de mensajes
      updatedAt: match.updatedAt,
    };
  }

  private getOtherUserId(match: Match, userId: string): string {
    return match.user1 === userId ? match.user2 : match.user1;
  }

  private mapToOtherUserDTO(user: User, isOnline: boolean): OtherUserDTO {
    const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim();

    return {
      id: user.id,
      name: fullName,
      picture: user.picture,
      subject: user.skills?.technical?.[0],
      university: user.profile?.university,
      isOnline,
      lastSeenAt: user.activity?.lastSeenAt,
      bio: user.profile?.bio,
    };
  }
}