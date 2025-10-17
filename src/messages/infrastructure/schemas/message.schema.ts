import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true, index: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  // Contenido encriptado (puedes implementar encriptación aquí)
  @Prop({ required: true })
  content: string;

  @Prop({ 
    type: String, 
    enum: ['text', 'image', 'file', 'location', 'voice'],
    default: 'text' 
  })
  type: string;

  @Prop({ 
    type: String, 
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true 
  })
  status: string;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Índice compuesto para queries eficientes
  @Prop({ type: Date, index: true })
  createdAt: Date;
@Prop({ type: Date, index: true })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Índices para optimizar queries
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, status: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });