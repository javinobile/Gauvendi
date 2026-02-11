import { IsString } from 'class-validator';

export class MappingHotelDto {
  @IsString()
  hotelId: string;
}
