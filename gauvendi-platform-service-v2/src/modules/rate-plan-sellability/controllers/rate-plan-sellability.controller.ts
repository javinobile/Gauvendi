import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CMD } from '@src/core/constants/cmd.const';
import { ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanSellabilityDeleteDto,
  RatePlanSellabilityDto,
  RatePlanSellabilityFilterDto,
  RatePlanSellabilityInputDto
} from '../dtos';
import { DailyRatePlanSellabilityFilterDto } from '../dtos/daily-rate-plan-sellability.dto';
import { DeleteRatePlanDailySellabilityInputDto } from '../dtos/delete-rate-plan-daily-sellability-input.dto';
import { RatePlanSellabilityService } from '../services/rate-plan-sellability.service';

@ApiTags('Rate Plan Sellability')
@Controller('rate-plan-sellability')
export class RatePlanSellabilityController {
  constructor(private readonly ratePlanSellabilityService: RatePlanSellabilityService) {}

  @Get('list')
  @ApiOperation({
    summary: 'Get rate plan sellability list',
    description: 'Retrieve a filtered list of rate plan sellability settings'
  })
  @ApiQuery({
    name: 'hotelId',
    required: false,
    type: String,
    description: 'Filter by hotel ID'
  })
  @ApiQuery({
    name: 'idList',
    required: false,
    type: [String],
    description: 'Filter by sellability IDs'
  })
  @ApiQuery({
    name: 'ratePlanIdList',
    required: false,
    type: [String],
    description: 'Filter by rate plan IDs'
  })
  @ApiQuery({
    name: 'distributionChannelList',
    required: false,
    type: [String],
    description: 'Filter by distribution channels'
  })
  @ApiQuery({
    name: 'isSellable',
    required: false,
    type: Boolean,
    description: 'Filter by sellability status'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved rate plan sellability list',
    type: ResponseData<RatePlanSellabilityDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid filter parameters'
  })
  async ratePlanSellabilityList(
    @Query() filter: RatePlanSellabilityFilterDto
  ): Promise<ResponseData<RatePlanSellabilityDto>> {
    return await this.ratePlanSellabilityService.ratePlanSellabilityList(filter);
  }

  @Post('create-or-update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or update rate plan sellability',
    description: 'Create or update sellability settings for rate plans across distribution channels'
  })
  @ApiBody({
    type: [RatePlanSellabilityInputDto],
    description: 'Array of rate plan sellability data'
  })
  @ApiResponse({
    status: 201,
    description: 'Rate plan sellability created/updated successfully',
    type: ResponseContent<RatePlanSellabilityDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async createOrUpdateRatePlanSellability(
    @Body() inputs: RatePlanSellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanSellabilityDto | null>> {
    return await this.ratePlanSellabilityService.createOrUpdateRatePlanSellability(inputs);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete rate plan sellability',
    description: 'Delete sellability settings for rate plans across distribution channels'
  })
  @ApiBody({
    type: [RatePlanSellabilityDeleteDto],
    description: 'Array of rate plan sellability data to delete'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate plan sellability deleted successfully',
    type: ResponseContent<null>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async deleteRatePlanSellability(
    @Body() inputs: RatePlanSellabilityDeleteDto[]
  ): Promise<ResponseContent<null>> {
    return await this.ratePlanSellabilityService.deleteRatePlanSellability(inputs);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_SELLABILITY.GET_DAILY_LIST })
  async getSalesPlanSellabilityList(@Payload() queryPayload: DailyRatePlanSellabilityFilterDto) {
    return this.ratePlanSellabilityService.getDailyRatePlanSellability(queryPayload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_SELLABILITY.DELETE_DAILY })
  async deleteRatePlanDailySellability(@Payload() payload: DeleteRatePlanDailySellabilityInputDto) {
    return this.ratePlanSellabilityService.deleteDailyRatePlanSellability(payload);
  }
}
