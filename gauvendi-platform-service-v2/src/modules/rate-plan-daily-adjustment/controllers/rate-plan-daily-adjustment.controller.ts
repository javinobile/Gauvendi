import { Controller, Get, Query } from '@nestjs/common';

import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import {
  DeleteAdjustmentDto,
  RatePlanDailyAdjustmentFilter,
  UpsertAdjustmentDto
} from '../models/rate-plan-daily-adjustment.dto';
import { RatePlanDailyAdjustmentRepository } from '../repositories/rate-plan-adjustment.repository';

@Controller('rate-plan-daily-adjustment')
export class RatePlanDailyAdjustmentController {
  constructor(
    private readonly ratePlanDailyAdjustmentRepository: RatePlanDailyAdjustmentRepository
  ) {}

  @Get()
  async findAll(
    @Query() filter: RatePlanDailyAdjustmentFilter
  ): Promise<RatePlanDailyAdjustment[]> {
    return this.ratePlanDailyAdjustmentRepository.findAll(filter);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.UPSERT_RATE_PLAN_ADJUSTMENT })
  async createOrUpdate(@Payload() payload: UpsertAdjustmentDto) {
    return this.ratePlanDailyAdjustmentRepository.createOrUpdateForRatePlanAdjustment(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN_ADJUSTMENT })
  async delete(@Payload() payload: DeleteAdjustmentDto): Promise<RatePlanDailyAdjustment[]> {
    return this.ratePlanDailyAdjustmentRepository.deleteByFilter(payload);
  }
}
