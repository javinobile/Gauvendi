import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import {
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';

export class RoomProductDailySellingPriceFilter {
  hotelId: string;
  roomProductIds: string[];
  ratePlanIds: string[];
  fromDate?: string;
  toDate?: string;
}


@Injectable()
export class RoomProductDailySellingPriceRepository {
  constructor(
    @InjectRepository(RoomProductDailySellingPrice, DB_NAME.POSTGRES)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>
  ) {}

  findAll(
    filter: RoomProductDailySellingPriceFilter,
    select?: FindOptionsSelect<RoomProductDailySellingPrice>
  ): Promise<RoomProductDailySellingPrice[]> {
    const where: FindOptionsWhere<RoomProductDailySellingPrice> = {
      hotelId: filter.hotelId
    };
    if (filter.roomProductIds && filter.roomProductIds.length > 0) {
      where.roomProductId = In(filter.roomProductIds);
    }
    if (filter.ratePlanIds && filter.ratePlanIds.length > 0) {
      where.ratePlanId = In(filter.ratePlanIds);
    }


    if (filter.fromDate && filter.toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: filter.fromDate,
        toDate: filter.toDate
      });
    } else if (filter.fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: filter.fromDate });
    } else if (filter.toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: filter.toDate });
    }



    return this.roomProductDailySellingPriceRepository.find({
      where,
      select
    });
  }
}
