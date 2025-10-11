import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ObjectiveDocument = HydratedDocument<Objectives>;

@Schema({ _id: false })
export class Objectives {
  @Prop({ type: [String] })
  primary: string[];

  @Prop({ required: false })
  timeAvailability: string;

  @Prop({ required: false })
  preferredGroupSize: string;
}

export const ObjectiveSchema = SchemaFactory.createForClass(Objectives);