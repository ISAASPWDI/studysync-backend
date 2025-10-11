import { IsArray, IsOptional, IsString } from 'class-validator';

export class ObjectivesDTO {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primary?: string[];

  @IsOptional()
  @IsString()
  timeAvailability?: string;

  @IsOptional()
  @IsString()
  preferredGroupSize?: string;
}