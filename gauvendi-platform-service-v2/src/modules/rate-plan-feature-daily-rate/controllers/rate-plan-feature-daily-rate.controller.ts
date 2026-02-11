import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RatePlanFeatureDailyRate } from 'src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanFeatureDailyRateDto,
  RatePlanFeatureDailyRateFilterDto,
  RatePlanFeatureDailyRateInputDto
} from '../dto';
import { RatePlanFeatureDailyRateDeleteFilterDto } from '../dto/rate-plan-feature-daily-rate-delete-filter.dto';
import { RatePlanFeatureDailyRateRepository } from '../repositories/rate-plan-feature-daily-rate.repository';

@ApiTags('rate-plan-feature-daily-rates')
@Controller('rate-plan-feature-daily-rates')
export class RatePlanFeatureDailyRateController {
  constructor(
    private readonly ratePlanFeatureDailyRateRepository: RatePlanFeatureDailyRateRepository
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get rate plan feature daily rates',
    description: 'Retrieves rate plan feature daily rates based on filter criteria'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate plan feature daily rates retrieved successfully',
    type: ResponseData<RatePlanFeatureDailyRateDto>
  })
  async ratePlanFeatureDailyRateList(
    @Query() filterDto: RatePlanFeatureDailyRateFilterDto
  ): Promise<{ entities: RatePlanFeatureDailyRate[]; totalCount: number }> {
    return await this.ratePlanFeatureDailyRateRepository.findAll(filterDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create or update rate plan feature daily rates',
    description:
      'Creates or updates rate plan feature daily rates for specified date range and days'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate plan feature daily rates created/updated successfully',
    type: ResponseContent<RatePlanFeatureDailyRateDto[]>
  })
  async createOrUpdateRatePlanFeatureDailyRate(
    @Body() inputDto: RatePlanFeatureDailyRateInputDto
  ): Promise<RatePlanFeatureDailyRateDto[]> {
    return await this.ratePlanFeatureDailyRateRepository.createOrUpdate(inputDto);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete rate plan feature daily rates',
    description: 'Delete rate plan feature daily rates based on specified criteria'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate plan feature daily rates deleted successfully',
    type: ResponseContent<RatePlanFeatureDailyRateDto[]>
  })
  async deleteRatePlanFeatureDailyRate(
    @Query() inputDto: RatePlanFeatureDailyRateDeleteFilterDto
  ): Promise<RatePlanFeatureDailyRateDto[]> {
    return await this.ratePlanFeatureDailyRateRepository.delete(inputDto);
  }
}
