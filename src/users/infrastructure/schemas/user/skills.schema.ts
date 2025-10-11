import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type SkillDocument = HydratedDocument<Skills>;

@Schema({ _id: false })
export class Skills {
    @Prop({ type: [String]})
    technical: string[];

    @Prop({ type: [String]})
    interests: string[];
}

export const SkillSchema = SchemaFactory.createForClass(Skills);