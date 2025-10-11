import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({ _id: false })
export class Activity {
  @Prop({ type: Date })
  lastActive: Date;

  @Prop({ default: true })
  isOnline: boolean;

  @Prop({ type: Date })
  joinDate: Date;

  @Prop()
  profileCompletion: number;
}
export const ActivitySchema = SchemaFactory.createForClass(Activity);