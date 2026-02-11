import { Reservation } from "@src/core/entities/booking-entities/reservation.entity";

export class SendCancelReservationEmailDto {
  bookingId: string;
  reservation: Reservation;
  translateTo?: string;
  hotelTemplateEmail?: string;

}
