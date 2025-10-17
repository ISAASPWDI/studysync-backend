

import { 
  Controller, 
  Get, 
  Post, 
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SwipeService } from './application/swipe.service';
import {
  GetRecommendationsResponseDTO,
  CreateSwipeActionDTO,
  SwipeActionResponseDTO,
} from './infrastructure/dto/swipe.dto';
import { GetUser } from 'src/users/infrastructure/decorators/get-user.decorator';

@Controller('swipe')
@UseGuards(AuthGuard('jwt'))
export class SwipeController {
  constructor(private readonly swipeService: SwipeService) {}


  @Get('recommendations')
  async getRecommendations(
    @GetUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<GetRecommendationsResponseDTO> {
    return this.swipeService.getRecommendations(userId, limit);
  }

  @Post('action')
  async createSwipeAction(
    @GetUser('id') userId: string,
    @Body() dto: CreateSwipeActionDTO,
  ): Promise<SwipeActionResponseDTO> {
    return this.swipeService.createSwipeAction(userId, dto);
  }
}