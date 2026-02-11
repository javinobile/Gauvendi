import { Filter } from 'src/core/dtos/common.dto';

export class RoomProductRetailFeatureFilterDto extends Filter {
  hotelId: string;
  roomProductIds: string[];
}
