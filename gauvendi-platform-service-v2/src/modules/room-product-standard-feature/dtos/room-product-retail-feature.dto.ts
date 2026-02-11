import { Filter } from 'src/core/dtos/common.dto';

export class RoomProductStandardFeatureFilterDto extends Filter {
  hotelId: string;
  roomProductIds: string[];
}
