// src/matches/infrastructure/mappers/match.mapper.ts

import { Match as MatchEntity } from '../../domain/entities/match.entity';


export class MatchMapper {
  static toDomain(matchDoc: any): MatchEntity {
    return new MatchEntity(
      matchDoc._id?.toString() || matchDoc.id?.toString(),
      matchDoc.user1?.toString() || matchDoc.user1,
      matchDoc.user2?.toString() || matchDoc.user2,
      matchDoc.status as any,
      matchDoc.matchScore || 0,
      matchDoc.initiatedBy?.toString() || matchDoc.initiatedBy,
      matchDoc.createdAt,
      matchDoc.updatedAt,
      matchDoc.chatId?.toString(),
    );
  }

  static toDomainArray(matchDocs: any[]): MatchEntity[] {
    return matchDocs.map(doc => this.toDomain(doc));
  }
}