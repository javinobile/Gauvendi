import { RoomProductStatus, RoomProductType } from 'src/core/entities/room-product.entity';

export class AvailableRoomCapacityFilterDto {
  hotelId: string;
  ids: string[];
  codes: string[];
  typeList?: RoomProductType[];
  status: RoomProductStatus;
  adult?: number;
  childrenAges?: number[];
  pets?: number;
}
