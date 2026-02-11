import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Filter } from 'src/core/dtos/common.dto';
import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { PaymentProviderCodeEnum } from 'src/core/enums/payment';

export class BookingSummaryFilterDto extends Filter {
  @IsString()
  @IsUUID('4')
  bookingId: string;
}

export class BookingStatusFilterDto extends Filter {
  @IsString()
  @IsUUID('4')
  bookingId: string;

  @IsString()
  @IsOptional()
  paymentReferenceId?: string;
}

export interface BookingPaymentAction {
  data?: any;
  id?: string;
  method?: string;
  paymentData?: any;
  paymentMethodId?: string;
  paymentProviderCode?: PaymentProviderCodeEnum;
  type?: string;
  url?: string;
}

export class BookingStatusResponseDto {
  action?: BookingPaymentAction;
  booking?: Booking;
  bookingInformation?: any;
  bookingTransaction?: BookingTransaction;
}
