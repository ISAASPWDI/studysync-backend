import { IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDTO } from './location.dto';

export class ProfileDTO {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsNumber()
  semester?: number;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDTO)
  location?: LocationDTO;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}