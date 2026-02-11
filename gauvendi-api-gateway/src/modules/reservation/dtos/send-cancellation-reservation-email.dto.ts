import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class SendCancellationReservationEmailDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  reservationId: string;

  @IsString()
  @IsOptional()
  language: string;
}
