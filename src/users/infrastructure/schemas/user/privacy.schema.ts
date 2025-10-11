import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrivacyDocument = HydratedDocument<Privacy>;

@Schema({ _id: false })
export class Privacy {
  @Prop({ default: true })
  showAge: boolean;

  @Prop({ default: true })
  showLocation: boolean;

  @Prop({ default: true })
  showSemester: boolean;
}

export const PrivacySchema = SchemaFactory.createForClass(Privacy);