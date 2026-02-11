import { IsString } from 'class-validator';

export class HotelTaxDto {
  @IsString()
  hotelId: string;
}
