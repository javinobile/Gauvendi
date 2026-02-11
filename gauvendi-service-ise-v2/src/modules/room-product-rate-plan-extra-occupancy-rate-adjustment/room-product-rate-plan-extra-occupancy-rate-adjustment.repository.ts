import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from 'src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import {
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';
import { DailyRfcRatePlanExtraOccupancyRateFilterDto } from './dtos/room-product-rate-plan-extra-occupancy.dto';

@Injectable()
export class RoomProductRatePlanExtraOccupancyRateAdjustmentRepository {
  constructor(
    @InjectRepository(RoomProductRatePlanExtraOccupancyRateAdjustment, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanExtraOccupancyRateAdjustmentRepository: Repository<RoomProductRatePlanExtraOccupancyRateAdjustment>
  ) {}

  findAll(
    filter: DailyRfcRatePlanExtraOccupancyRateFilterDto,
    select?: FindOptionsSelect<RoomProductRatePlanExtraOccupancyRateAdjustment>
  ): Promise<RoomProductRatePlanExtraOccupancyRateAdjustment[]> {
    if ((!filter.fromDate && !filter.toDate) || filter.fromDate > filter.toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const where: FindOptionsWhere<RoomProductRatePlanExtraOccupancyRateAdjustment> = {};

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


    if (filter.rfcRatePlanIdList && filter.rfcRatePlanIdList.length > 0) {
      where.roomProductRatePlanId = In(filter.rfcRatePlanIdList);
    }

    return this.roomProductRatePlanExtraOccupancyRateAdjustmentRepository.find({
      where,
      select,
      relations: {
        roomProductRatePlan: true
      }
    });
  }
}
