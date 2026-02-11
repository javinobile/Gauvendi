import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import {
  FindOptionsSelect,
  In,
  Repository
} from 'typeorm';

@Injectable()
export class RoomProductExtraOccupancyRateRepository {
  constructor(
    @InjectRepository(RoomProductExtraOccupancyRate, DB_NAME.POSTGRES)
    private readonly roomProductExtraOccupancyRateRepository: Repository<RoomProductExtraOccupancyRate>
  ) {}

  findByRoomProductIds(
    roomProductIds: string[],
    select?: FindOptionsSelect<RoomProductExtraOccupancyRate>
  ): Promise<RoomProductExtraOccupancyRate[]> {
    return this.roomProductExtraOccupancyRateRepository.find({
      where: {
        roomProductId: In(roomProductIds)
      },
      select
    });
  }
}
