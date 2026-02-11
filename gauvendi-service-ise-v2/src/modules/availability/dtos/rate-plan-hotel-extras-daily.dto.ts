import { IsString } from 'class-validator';

export class RatePlanHotelExtrasDailyDto {
  @IsString()
  hotelId: string;

  @IsString()
  ratePlanId: string;

  @IsString()
  from: string;

  @IsString()
  to: string;
}
