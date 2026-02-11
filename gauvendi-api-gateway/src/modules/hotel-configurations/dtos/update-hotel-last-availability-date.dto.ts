import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class UpdateHotelLastAvailabilityDateDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsDateString()
  @IsNotEmpty()
  lastAvailabilityDate: string;
}
