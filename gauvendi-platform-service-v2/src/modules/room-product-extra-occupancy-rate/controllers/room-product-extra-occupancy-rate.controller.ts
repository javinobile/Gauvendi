import { Controller, Get, Post, Delete, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoomProductExtraOccupancyRateRepository } from '../repositories/room-product-extra-occupancy-rate.repository';
import { RoomProductExtraOccupancyRateFilterDto } from '../dto/room-product-extra-occupancy-rate-filter.dto';
import { RoomProductExtraOccupancyRateInputDto } from '../dto/room-product-extra-occupancy-rate-input.dto';
import { RoomProductExtraOccupancyRate } from '../../../core/entities/room-product-extra-occupancy-rate.entity';

@ApiTags('room-product-extra-occupancy-rates')
@Controller('room-product-extra-occupancy-rates')
export class RoomProductExtraOccupancyRateController {
  constructor(
    private readonly roomProductExtraOccupancyRateRepository: RoomProductExtraOccupancyRateRepository
  ) {}

  @Get()
  async findAll(@Query() filterDto: RoomProductExtraOccupancyRateFilterDto): Promise<{
    data: RoomProductExtraOccupancyRate[];
    count: number;
    pageSize?: number;
  }> {
    return await this.roomProductExtraOccupancyRateRepository.findAll(filterDto);
  }

  @Post()
  async createOrUpdate(
    @Body() inputDto: RoomProductExtraOccupancyRateInputDto
  ): Promise<RoomProductExtraOccupancyRate> {
    return await this.roomProductExtraOccupancyRateRepository.createOrUpdate(inputDto);
  }

  @Delete()
  async delete(
    @Query() inputDto: RoomProductExtraOccupancyRateInputDto
  ): Promise<RoomProductExtraOccupancyRate[]> {
    return await this.roomProductExtraOccupancyRateRepository.delete(inputDto);
  }
}
