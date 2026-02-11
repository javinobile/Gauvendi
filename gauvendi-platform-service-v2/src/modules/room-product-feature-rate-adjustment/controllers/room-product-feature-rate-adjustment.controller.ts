import { Controller, Get, Post, Put, Delete, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RoomProductFeatureRateAdjustmentInputDto,
  RoomProductFeatureRateAdjustmentFilterDto,
  DynamicRoomProductFeatureRateAdjustmentInputDto,
  RoomProductRatePlanInputDto,
  RoomProductFeatureRateAdjustmentDeleteFilterDto
} from '../dto';
import { RoomProductFeatureRateAdjustmentRepository } from '../repositories/room-product-feature-rate-adjustment.repository';
import { RoomProductFeatureRateAdjustment } from 'src/core/entities/room-product-feature-rate-adjustment.entity';

@ApiTags('room-product-feature-rate-adjustments')
@Controller('room-product-feature-rate-adjustments')
export class RoomProductFeatureRateAdjustmentController {
  constructor(
    private readonly roomProductFeatureRateAdjustmentService: RoomProductFeatureRateAdjustmentRepository
  ) {}

  @Post()
  async createOrUpdate(
    @Body() inputDto: RoomProductFeatureRateAdjustmentInputDto
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.roomProductFeatureRateAdjustmentService.createOrUpdate(inputDto);
  }

  @Get()
  async findAll(@Query() filterDto: RoomProductFeatureRateAdjustmentFilterDto): Promise<{
    data: RoomProductFeatureRateAdjustment[];
    totalCount: number;
  }> {
    return await this.roomProductFeatureRateAdjustmentService.findAll(filterDto);
  }

  @Put()
  async update(
    @Body() inputDtos: RoomProductFeatureRateAdjustmentInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.roomProductFeatureRateAdjustmentService.update(inputDtos);
  }

  @Delete()
  async delete(
    @Query() inputDto: RoomProductFeatureRateAdjustmentDeleteFilterDto
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.roomProductFeatureRateAdjustmentService.delete(inputDto);
  }

  @Post('batch')
  async createOrUpdateBatch(
    @Body() inputDtos: RoomProductFeatureRateAdjustmentInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.roomProductFeatureRateAdjustmentService.createOrUpdateList(inputDtos);
  }

  @Delete('purge')
  async purge(
    @Body() inputDtos: RoomProductRatePlanInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.roomProductFeatureRateAdjustmentService.purge(inputDtos);
  }

  @Post('dynamic-adjust')
  async dynamicAdjust(
    @Body() inputDtos: DynamicRoomProductFeatureRateAdjustmentInputDto[]
  ): Promise<RoomProductFeatureRateAdjustment[]> {
    return await this.roomProductFeatureRateAdjustmentService.dynamicAdjust(inputDtos);
  }
}
