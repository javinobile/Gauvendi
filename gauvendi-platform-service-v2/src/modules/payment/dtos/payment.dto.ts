import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { HotelPaymentMethodSetting } from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import {
  RequestBookingDto,
  RoomAvailabilityDto
} from 'src/modules/booking/dtos/request-booking.dto';

export class RequestPaymentDto {
  hotel: Hotel;
  booker: Guest;
  booking: Booking;
  paymentModeCode?: string;
  paymentProviderCode?: string;
  propertyPaymentMethodSetting: HotelPaymentMethodSetting | null;
  currencyCode: string;
  mappingHotel: MappingPmsHotel | null;
  bookingInput: RequestBookingDto;
  whitelabelUrl: string;
  totalPrepaidAmount?: number;
  connector: Connector | null;
  bookingTransaction: BookingTransaction;
  roomProductList: RoomAvailabilityDto[];
  isProposalBooking?: boolean;
}
