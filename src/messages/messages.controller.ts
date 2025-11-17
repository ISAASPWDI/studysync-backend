import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


import { GetMessagesResponseDTO, MarkAsReadDTO } from './infrastructure/dto/message.dto';
import { MessagesService } from './application/messages.service';
import { GetUser } from 'src/users/infrastructure/decorators/get-user.decorator';


@Controller('messages')
@UseGuards(AuthGuard('jwt'))
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('chats/:matchId')
  async getOrCreateChat(
    @GetUser('id') userId: string,
    @Param('matchId') matchId: string,
  ) {
    const chatId = await this.messagesService.getOrCreateChat(matchId, userId);
    return {
      success: true,
      chatId,
    };
  }

  @Get('chats/:chatId')
  async getMessages(
    @GetUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<GetMessagesResponseDTO> {
    return this.messagesService.getMessages(chatId, userId, page, limit);
  }

  @Post('chats/:chatId/read')
  async markAsRead(
    @GetUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Body() body: MarkAsReadDTO,
  ) {
    await this.messagesService.markMessagesAsRead(body.messageIds, userId);
    await this.messagesService.resetUnreadCount(chatId, userId);
    
    return {
      success: true,
      message: 'Mensajes marcados como leídos',
    };
  }

  @Delete(':messageId')
  async deleteMessage(
    @GetUser('id') userId: string,
    @Param('messageId') messageId: string,
  ) {
    await this.messagesService.deleteMessage(messageId, userId);
    
    return {
      success: true,
      message: 'Mensaje eliminado',
    };
  }

  @Get('chats/:chatId/unread-count')
  async getUnreadCount(
    @GetUser('id') userId: string,
    @Param('chatId') chatId: string,
  ) {
    const count = await this.messagesService.getUnreadCount(chatId, userId);
    
    return {
      chatId,
      unreadCount: count,
    };
  }
}