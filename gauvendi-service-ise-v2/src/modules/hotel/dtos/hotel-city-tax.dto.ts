import { IsString } from 'class-validator';

export class HotelCityTaxDto {
  @IsString()
  hotelId: string;

  @IsString()
  status: string;
}
