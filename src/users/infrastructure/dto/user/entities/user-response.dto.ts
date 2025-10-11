import { IsOptional, IsString, ValidateNested } from "class-validator";
import { ProfileDTO } from "./profile.dto";
import { Type } from "class-transformer";
import { SkillsDTO } from "./skills.dto";
import { ObjectivesDTO } from "./objectives.dto";
import { ActivityDTO } from "./activity.dto";
import { PrivacyDTO } from "./privacy.dto";

export class UserResponseDTO {


    @IsString()
    id: string;

    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ProfileDTO)
    profile?: ProfileDTO

    @IsOptional()
    @ValidateNested()
    @Type(() => SkillsDTO)
    skills?: SkillsDTO;

    @IsOptional()
    @ValidateNested()
    @Type(() => ObjectivesDTO)
    objectives?: ObjectivesDTO;

    @IsOptional()
    @ValidateNested()
    @Type(() => ActivityDTO)
    activity?: ActivityDTO;

    @IsOptional()
    @ValidateNested()
    @Type(() => PrivacyDTO)
    privacy?: PrivacyDTO;
}