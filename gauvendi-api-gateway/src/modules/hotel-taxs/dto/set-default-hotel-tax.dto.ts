import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";




export class SetDefaultHotelTaxDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defaultTaxIds?: string[];

  @IsString()
  @IsNotEmpty()
  hotelId: string;
}