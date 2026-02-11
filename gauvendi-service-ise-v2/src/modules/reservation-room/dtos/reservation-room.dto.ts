import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { RoomAvailabilityDto } from 'src/modules/booking/dtos/request-booking.dto';

export class CreateReservationRoomDto {
  reservations: Reservation[];
  roomAvailability: RoomAvailabilityDto[];
}
