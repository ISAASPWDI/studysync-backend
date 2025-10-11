import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfileDTO } from '../entities/profile.dto';
import { SkillsDTO } from '../entities/skills.dto';
import { ObjectivesDTO } from '../entities/objectives.dto';
import { ActivityDTO } from '../entities/activity.dto';
import { PrivacyDTO } from '../entities/privacy.dto';

export class UpsertUserDTO {
  @IsOptional()
  email?: string;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDTO)
  profile?: ProfileDTO;

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