import { IsBoolean, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class UpdateHotelOperationBodyDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  defaultPax: number;

  @IsNumber()
  @IsNotEmpty()
  defaultStayNight: number;

  @IsBoolean()
  @IsNotEmpty()
  isRequireMainGuestAddress: boolean;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Time must be in the format HH:MM" })
  timeSliceArrivalTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Time must be in the format HH:MM" })
  timeSliceDepartureTime: string;
}


export class UpdateHotelLastAvailabilityDateBodyDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsNumber()
  @IsNotEmpty()
  lastAvailabilityDate: string;
}
