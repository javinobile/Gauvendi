import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class HotelAmenityPriceDto {
  @IsString()
  hotelAmenityId?: string;

  @IsArray()
  @IsString({ each: true })
  hotelAmenityIds?: string[];

  @IsOptional()
  @IsObject()
  hotelAgeCategory?: {
    code?: string;
    fromAge?: number;
    toAge?: number;
  };
}
