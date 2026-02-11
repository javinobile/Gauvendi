import { IsArray, IsString } from 'class-validator';

export class RfcAvailabilityAdjustmentDto {
  @IsArray()
  @IsString({ each: true })
  rfcIds: string[];

  @IsString()
  hotelId: string;

  @IsString()
  arrivalDate: string;

  @IsString()
  departureDate: string;
}
