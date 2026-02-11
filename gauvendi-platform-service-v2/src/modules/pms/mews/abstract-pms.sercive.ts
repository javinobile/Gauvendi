import { Injectable, Logger } from '@nestjs/common';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { BookingRepository } from 'src/modules/booking/repositories/booking.repository';
import { ReservationRepository } from 'src/modules/reservation/repositories/reservation.repository';

@Injectable()
export abstract class AbstractPmsService {
  protected readonly logger = new Logger(AbstractPmsService.name);

  baseUrl: string;

  constructor(
    protected readonly reservationRepository: ReservationRepository,
    protected readonly bookingRepository: BookingRepository
  ) {}

  async handleAfterPushPms(
    reservations: Partial<Reservation> & Pick<Reservation, 'id'>[],
    booking: Partial<Booking> & Pick<Booking, 'id'>,
    fromPms: string
  ) {
    await Promise.all([
      this.reservationRepository.updatePartialReservations(reservations),
      this.bookingRepository.updateBooking({
        id: booking.id,
        mappingBookingCode: booking.mappingBookingCode
      })
    ]);
    this.logger.log(
      `Updated booking after push to pms successfully ${booking?.id} from ${fromPms}`
    );
  }
}
