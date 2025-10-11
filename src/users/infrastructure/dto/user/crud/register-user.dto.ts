import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Profile } from "../../../../domain/entities/profile.entity";
import { Skills } from "../../../../domain/entities/skills.entity";
import { Objectives } from "../../../../domain/entities/objectives.entity";
import { Activity } from "../../../../domain/entities/activity.entity";
import { Privacy } from "../../../../domain/entities/privacy.entity";
export class RegisterUserDTO {

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsNotEmpty()
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    password: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => Profile)
    profile?: Profile;

    @IsOptional()
    @ValidateNested()
    @Type(() => Skills)
    skills?: Skills;

    @IsOptional()
    @ValidateNested()
    @Type(() => Objectives)
    objectives?: Objectives;

    @IsOptional()
    @ValidateNested()
    @Type(() => Activity)
    activity?: Activity;

    @IsOptional()
    @ValidateNested()
    @Type(() => Privacy)
    privacy?: Privacy;
}