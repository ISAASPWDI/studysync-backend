// src/matches/infrastructure/repositories/match.repository.mongo.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from '../schemas/match.schema';
import { MatchRepository, PaginationResult } from '../../domain/repositories/match.repository';
import { Match as MatchEntity, MatchStatus } from '../../domain/entities/match.entity';
import { MatchMapper } from '../mappers/match.mapper';

@Injectable()
export class MatchRepositoryMongo implements MatchRepository {
  constructor(
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
  ) {}

  async findById(matchId: string): Promise<MatchEntity | null> {
    const matchDoc = await this.matchModel.findById(matchId).exec();
    return matchDoc ? MatchMapper.toDomain(matchDoc) : null;
  }

  async findByIdOrThrow(matchId: string): Promise<MatchEntity> {
    const match = await this.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match no encontrado');
    }
    return match;
  }

  async getConfirmedMatches(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<MatchEntity>> {
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.matchModel
        .find({
          $or: [{ user1: userId }, { user2: userId }],
          status: 'accepted',
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // Usar lean() para obtener objetos planos
        .exec(),

      this.matchModel.countDocuments({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'accepted',
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: MatchMapper.toDomainArray(matches as any),
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

  async getPendingReceivedMatches(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResult<MatchEntity>> {
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.matchModel
        .find({
          user2: userId,
          status: 'pending',
          initiatedBy: { $ne: userId },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      this.matchModel.countDocuments({
        user2: userId,
        status: 'pending',
        initiatedBy: { $ne: userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: MatchMapper.toDomainArray(matches as any),
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

  async getSentMatches(
    userId: string,
    page: number,
    limit: number,
    status: MatchStatus | 'all',
  ): Promise<PaginationResult<MatchEntity>> {
    const skip = (page - 1) * limit;

    const statusFilter = status === 'all' 
      ? { $in: ['pending', 'accepted', 'rejected'] } 
      : status;

    const [matches, total] = await Promise.all([
      this.matchModel
        .find({
          initiatedBy: userId,
          status: statusFilter,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),

      this.matchModel.countDocuments({
        initiatedBy: userId,
        status: statusFilter,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: MatchMapper.toDomainArray(matches as any),
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

  async searchMatches(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<MatchEntity[]> {
    const skip = (page - 1) * limit;

    const matches = await this.matchModel
      .find({
        $or: [{ user1: userId }, { user2: userId }],
        status: { $in: ['accepted', 'pending'] },
      })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    return MatchMapper.toDomainArray(matches as any);
  }

  async acceptMatch(matchId: string): Promise<MatchEntity> {
    const matchDoc = await this.matchModel
      .findByIdAndUpdate(
        matchId,
        {
          $set: {
            status: 'accepted',
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!matchDoc) {
      throw new NotFoundException('Match no encontrado');
    }

    return MatchMapper.toDomain(matchDoc);
  }

  async rejectMatch(matchId: string): Promise<MatchEntity> {
    const matchDoc = await this.matchModel
      .findByIdAndUpdate(
        matchId,
        {
          $set: {
            status: 'rejected',
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!matchDoc) {
      throw new NotFoundException('Match no encontrado');
    }

    return MatchMapper.toDomain(matchDoc);
  }

  async countDocuments(filter: any): Promise<number> {
    return this.matchModel.countDocuments(filter).exec();
  }
}