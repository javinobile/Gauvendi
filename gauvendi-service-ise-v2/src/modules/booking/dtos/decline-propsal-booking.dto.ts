import { IsOptional, IsString, IsUUID } from "class-validator";


export class DeclineProposalBookingDto {
  @IsString()
  @IsUUID()
  bookingId: string;


  @IsString()
  @IsOptional()
  cancelledBy: string;

}