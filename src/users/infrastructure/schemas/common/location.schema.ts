import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LocationDocument = HydratedDocument<Location>

@Schema({ _id: false })
export class Location {
  @Prop()
  district: string;

  @Prop({ type: [Number] })
  coordinates: number[];
}

export const LocationSchema = SchemaFactory.createForClass(Location);