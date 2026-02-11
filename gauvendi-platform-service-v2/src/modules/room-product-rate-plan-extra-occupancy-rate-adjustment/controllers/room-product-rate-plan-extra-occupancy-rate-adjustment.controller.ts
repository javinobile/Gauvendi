import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from 'src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { ResponseData } from '../../../core/dtos/common.dto';
import {
  DailyExtraOccupancyRateDto,
  DailyRoomProductRatePlanExtraOccupancyRateFilterDto,
  RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto,
  RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
} from '../dto';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentDeleteFilterDto } from '../dto/room-product-rate-plan-extra-occupancy-rate-adjustment-delete-filter.dto';
import { RoomProductRatePlanExtraOccupancyRateAdjustmentRepository } from '../repositories/room-product-rate-plan-extra-occupancy-rate-adjustment.repository';

@Controller('room-product-rate-plan-extra-occupancy-rate-adjustment')
@ApiTags('room-product-rate-plan-extra-occupancy-rate-adjustment')
export class RoomProductRatePlanExtraOccupancyRateAdjustmentController {
  constructor(
    private readonly adjustmentService: RoomProductRatePlanExtraOccupancyRateAdjustmentRepository
  ) {}

  @Get()
  async roomProductRatePlanExtraOccupancyRateAdjustmentList(
    @Query() filter: RoomProductRatePlanExtraOccupancyRateAdjustmentFilterDto
  ): Promise<{
    data: RoomProductRatePlanExtraOccupancyRateAdjustment[];
    count: number;
    totalPage: number;
  }> {
    return await this.adjustmentService.findAll(filter);
  }

  @Post()
  async createOrUpdateRoomProductRatePlanExtraOccupancyRateAdjustment(
    @Body() input: RoomProductRatePlanExtraOccupancyRateAdjustmentInputDto
  ): Promise<RoomProductRatePlanExtraOccupancyRateAdjustment[]> {
    return await this.adjustmentService.createOrUpdate(
      input
    );
  }

  @Delete()
  async deleteRoomProductRatePlanExtraOccupancyRateAdjustment(
    @Query() input: RoomProductRatePlanExtraOccupancyRateAdjustmentDeleteFilterDto
  ): Promise<RoomProductRatePlanExtraOccupancyRateAdjustment[]> {
    return await this.adjustmentService.delete(
      input
    );
  }

  @Get('daily')
  async dailyRoomProductRatePlanExtraOccupancyRateList(
    @Query() filter: DailyRoomProductRatePlanExtraOccupancyRateFilterDto
  ): Promise<ResponseData<DailyExtraOccupancyRateDto>> {
    return await this.adjustmentService.findDaily(filter);
  }
}
