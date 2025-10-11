import { IsBoolean, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class ActivityDTO {
  @IsOptional()
  @IsDateString()
  lastActive?: Date;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsDateString()
  joinDate?: Date;

  @IsOptional()
  @IsNumber()
  profileCompletion?: number;
}