import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import {
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Repository
} from 'typeorm';
import {
  RatePlanDailyAdjustmentFilter
} from './dtos/room-product-daily-selling-price-filter';

@Injectable()
export class RatePlanDailyAdjustmentRepository {
  constructor(
    @InjectRepository(RatePlanDailyAdjustment, DB_NAME.POSTGRES)
    private readonly ratePlanDailyAdjustmentRepository: Repository<RatePlanDailyAdjustment>
  ) {}

  findAll(
    filter: RatePlanDailyAdjustmentFilter,
    select?: FindOptionsSelect<RatePlanDailyAdjustment>
  ): Promise<RatePlanDailyAdjustment[]> {
    const where: FindOptionsWhere<RatePlanDailyAdjustment> = {
      hotelId: filter.hotelId
    };
    if (filter.ratePlanIds && filter.ratePlanIds.length > 0) {
      where.ratePlanId = In(filter.ratePlanIds);
    }

    return this.ratePlanDailyAdjustmentRepository.find({
      where,
      select
    });
  }
}
