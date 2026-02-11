import { Filter } from 'src/core/dtos/common.dto';
import { ReservationAmenity } from 'src/core/entities/booking-entities/reservation-amenity.entity';

export class ReservationAmenityFilterDto extends Filter {
  ids: string[];
}

export class CreateReservationAmenityDto {
  reservationAmenities: ReservationAmenity[];
}

export class GetReservationAmenityDto {
  reservationId: string;
}
