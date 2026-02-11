import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import {
  RequestBookingDto,
  RoomAvailabilityDto
} from '@src/modules/booking/dtos/request-booking.dto';

export class CreateReservationTimeSliceDto {
  hotelId: string;
  reservations: Reservation[];
  roomAvailability: RoomAvailabilityDto[];
  timeSlice: { CI: string; CO: string };
  timeZone: string;
  bookingInput: RequestBookingDto;
}
