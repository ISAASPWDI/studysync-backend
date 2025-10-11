import { IsArray, IsOptional, IsString } from 'class-validator';

export class SkillsDTO {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technical?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}