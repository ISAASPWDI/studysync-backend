// src/swipe/swipe.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { SwipeController } from './swipe.controller';
import { SwipeService } from './application/swipe.service';
import { Match, MatchSchema } from '../matches/infrastructure/schemas/match.schema';import { User, UserSchema } from 'src/users/infrastructure/schemas/user/user.schema';
;

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SwipeController],
  providers: [SwipeService],
  exports: [SwipeService],
})
export class SwipeModule {}