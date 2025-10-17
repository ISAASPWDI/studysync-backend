// src/matches/matches.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchesController } from './matches.controller';
import { MatchesService } from './application/matches.service';
import { Match, MatchSchema } from './infrastructure/schemas/match.schema';
import { MatchRepository } from './domain/repositories/match.repository';
import { MatchRepositoryMongo } from './infrastructure/repositories/match.repository.mongo';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
    ]),
    UsersModule, // Importamos UsersModule para acceder al UserRepository
  ],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    {
      provide: MatchRepository,
      useClass: MatchRepositoryMongo,
    },
  ],
  exports: [MatchesService, MatchRepository],
})
export class MatchesModule {}