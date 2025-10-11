import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Profile } from "./profile.schema";
import { Skills } from "./skills.schema";
import { Objectives } from "./objectives.schema";
import { Activity } from "./activity.schema";
import { Privacy } from "./privacy.schema";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: false })
    password?: string;

    @Prop({ required: false })
    picture?: string;
    
    @Prop({ type: Profile })
    profile?: Profile

    @Prop({ type: Skills })
    skills?: Skills;

    @Prop({ type: Objectives })
    objectives?: Objectives;

    @Prop({ type: Activity })
    activity?: Activity;

    @Prop({ type: Privacy })
    privacy?: Privacy;
}

export const UserSchema = SchemaFactory.createForClass(User);
