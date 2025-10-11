import { IsOptional, ValidateNested } from "class-validator"
import { ProfileDTO } from "../entities/profile.dto"
import { Type } from "class-transformer"

export class UpdateGeneralProfileDTO {
    @IsOptional()
    email: string

    @IsOptional()
    @ValidateNested()
    @Type(() => ProfileDTO)
    profile: ProfileDTO
}