import { Filter } from 'src/core/dtos/common.dto';

export class HotelTaxDto {
  hotelId: string;
}

export class HotelTaxFilterDto extends Filter {
  ids?: string[];
}
