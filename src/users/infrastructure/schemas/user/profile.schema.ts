import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Location } from "../common/location.schema";

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ _id: false })
export class Profile {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  age: number;

  @Prop()
  semester: number;

  @Prop()
  university: string;

  @Prop()
  faculty: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  bio?: string;

  @Prop({ type: Location })
  location: Location;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
