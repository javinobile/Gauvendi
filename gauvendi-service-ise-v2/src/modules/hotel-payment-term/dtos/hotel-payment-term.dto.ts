import { Filter } from 'src/core/dtos/common.dto';

export class HotelPaymentTermsFilterDto extends Filter {
  hotelId: string;
  codes: string[];
}
