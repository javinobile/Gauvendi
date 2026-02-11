import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  RequestBookingDto,
  RoomAvailabilityDto
} from 'src/modules/booking/dtos/request-booking.dto';

export class CreateReservationDto {
  bookingInput: RequestBookingDto;
  hotel: Hotel;
  booking: Booking;
  company: Company | null;
  guest: Guest | null;
  timeSlice: { CI: string; CO: string };
  additionalGuestList: Partial<Guest>[][];
  cancelPolicyCodes: Map<string, string | null>;
  roomAvailability: RoomAvailabilityDto[];
}
