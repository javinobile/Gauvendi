import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CancelReservationDto {
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  reservationNumber: string;
}
