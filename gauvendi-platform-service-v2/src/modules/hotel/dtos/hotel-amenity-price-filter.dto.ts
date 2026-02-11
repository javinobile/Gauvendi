import { Filter } from '@src/core/dtos/common.dto';

export class HotelAmenityPriceFilterDto extends Filter {
  hotelAmenityIds: string[];
}
