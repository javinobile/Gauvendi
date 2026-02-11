import { IsArray, IsOptional, IsString } from 'class-validator';

export class HotelAmenityDto {
  @IsOptional()
  ids?: string[];

  @IsOptional()
  @IsString()
  hotelId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relations?: string[];
}
