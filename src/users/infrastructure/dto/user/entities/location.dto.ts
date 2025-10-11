import { IsArray, IsNumber, IsOptional, IsString, ArrayMinSize } from 'class-validator'; 
export class LocationDTO {
  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  coordinates?: number[];
}
