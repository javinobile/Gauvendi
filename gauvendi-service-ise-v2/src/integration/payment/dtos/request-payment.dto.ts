import { ApiResponseDto } from 'src/core/dtos/common.dto';
import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';

export class RequestPaymentResponseDto {
  bookingTransactionInput: Partial<BookingTransaction>;
  paymentInfo?: ApiResponseDto<{ [key: string]: any }> | null;
}
