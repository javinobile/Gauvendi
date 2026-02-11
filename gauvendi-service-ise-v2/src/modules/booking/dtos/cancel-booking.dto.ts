import { IsString, IsUUID } from 'class-validator';

export class CancelBookingFilterDto {
  @IsString()
  @IsUUID('4')
  bookingId: string;

  @IsString()
  cancelledBy: string;
}
