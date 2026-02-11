import { Filter } from '@src/core/dtos/common.dto';
import { IsUUID } from 'class-validator';

export class BookingTransactionFilterDto extends Filter {
  @IsUUID()
  bookingIds: string[];
}
