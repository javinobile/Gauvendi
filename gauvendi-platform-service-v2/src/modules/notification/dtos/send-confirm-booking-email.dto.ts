export class SendConfirmBookingEmailDto {
  bookingId: string;
  translateTo?: string;
  hotelTemplateEmail?: string;
  hotelId?: string;
}
