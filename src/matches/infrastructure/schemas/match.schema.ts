// src/matches/infrastructure/schemas/match.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user1: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user2: string;

  @Prop({ 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ type: Number, min: 0, max: 1, default: 0 })
  matchScore: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  initiatedBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chat', required: false })
  chatId?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// Índices para optimizar consultas
MatchSchema.index({ user1: 1, status: 1 });
MatchSchema.index({ user2: 1, status: 1 });
MatchSchema.index({ initiatedBy: 1 });
MatchSchema.index({ createdAt: -1 });
MatchSchema.index({ updatedAt: -1 });