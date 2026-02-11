import { IsString } from 'class-validator';

export class MappingPmsHotelDto {
  @IsString()
  hotelId: string;
}
