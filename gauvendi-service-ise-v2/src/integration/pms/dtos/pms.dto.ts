import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { ReservationTimeSlice } from 'src/core/entities/booking-entities/reservation-time-slice.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  RequestBookingDto,
  RoomAvailabilityDto
} from 'src/modules/booking/dtos/request-booking.dto';

export class ReservationsCreatePmsInput {
  bookingInput: RequestBookingDto;
  booking: Booking;
  connector: Connector | null;
  booker: Guest;
  guest: Guest;
  roomProductList: RoomAvailabilityDto[];
  hotel: Hotel;
  reservationTimeSlices: ReservationTimeSlice[];
  isProposalBooking?: boolean;
}

export class ProductPmsDto {
  roomProductMappingPmsCode: string;
  roomUnitMappingPmsCode: string[];
  hotel: Hotel;
  reservationTimeSlices: ReservationTimeSlice[];
}
