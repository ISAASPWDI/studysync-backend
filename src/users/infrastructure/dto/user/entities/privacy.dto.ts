import { IsBoolean, IsOptional } from 'class-validator';

export class PrivacyDTO {
  @IsOptional()
  @IsBoolean()
  showAge?: boolean;

  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;

  @IsOptional()
  @IsBoolean()
  showSemester?: boolean;
}