import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './application/messages.service';
import { MessageRepository } from './domain/repositories/message.repository';
import { MatchesModule } from '../matches/matches.module';
import { UsersModule } from '../users/users.module';
import { Message, MessageSchema } from './infrastructure/schemas/message.schema';
import { Chat, ChatSchema } from './infrastructure/schemas/chat.schema';
import { MessagesController } from './messages.controller';
import { MessageRepositoryMongo } from './infrastructure/repositories/message.repository.mongo';
import { JwtConfigModule } from 'src/shared/jwt/jwt.module';
import { MessagesGateway } from './infrastructure/websockets/messages.gateway';
import { WsAuthGuard } from './infrastructure/websockets/guards/ws-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    MatchesModule,
    UsersModule,
    JwtConfigModule
  ],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    WsAuthGuard,
    {
      provide: MessageRepository,
      useClass: MessageRepositoryMongo,
    },
  ],
  exports: [MessagesService, MessageRepository],
})
export class MessagesModule {}