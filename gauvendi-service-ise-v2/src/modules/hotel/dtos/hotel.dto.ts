import { IsString } from 'class-validator';

export class HotelDto {
  @IsString()
  hotelCode?: string;

  @IsString()
  hotelId?: string;
}
