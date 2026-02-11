import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CMD } from '@src/core/constants/cmd.const';
import { ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanDailySellabilityDto,
  RatePlanDailySellabilityFilterDto,
  RatePlanDailySellabilityInputDto
} from '../dtos';
import { RatePlanDailySellabilityService } from '../services/rate-plan-daily-sellability.service';

@ApiTags('Rate Plan Daily Sellability')
@Controller('rate-plan-daily-sellability')
export class RatePlanDailySellabilityController {
  constructor(private readonly ratePlanDailySellabilityService: RatePlanDailySellabilityService) {}

  @Get('list')
  @ApiOperation({
    summary: 'Get rate plan daily sellability adjustments list',
    description: 'Retrieve a filtered list of rate plan daily sellability adjustments'
  })
  @ApiQuery({
    name: 'hotelId',
    required: false,
    type: String,
    description: 'Filter by hotel ID'
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
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter from date (YYYY-MM-DD)'
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter to date (YYYY-MM-DD)'
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of items per page'
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved rate plan daily sellability adjustments list',
    type: ResponseData<RatePlanDailySellabilityDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid filter parameters'
  })
  async salesPlanSellabilityAdjustmentList(
    @Query() filter: RatePlanDailySellabilityFilterDto
  ): Promise<ResponseData<RatePlanDailySellabilityDto>> {
    return await this.ratePlanDailySellabilityService.ratePlanDailySellabilityList(filter);
  }

  @Post('create-or-update')

  @MessagePattern({ cmd: CMD.RATE_PLAN_SELLABILITY.CREATE_OR_UPDATE })
  async createOrUpdateSalesPlanSellabilityAdjustment(
    @Payload() input: RatePlanDailySellabilityInputDto
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityService.createOrUpdateRatePlanDailySellability(input);
  }

  @Post('bulk-create-or-update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk create or update rate plan daily sellability adjustments',
    description: 'Create or update multiple sellability adjustments in a single operation'
  })
  @ApiBody({
    type: [RatePlanDailySellabilityInputDto],
    description: 'Array of rate plan daily sellability adjustment data'
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk rate plan daily sellability adjustments created/updated successfully',
    type: ResponseContent<RatePlanDailySellabilityDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async bulkCreateOrUpdateSalesPlanSellabilityAdjustment(
    @Body() inputList: RatePlanDailySellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityService.bulkCreateOrUpdateRatePlanDailySellability(
      inputList
    );
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete rate plan daily sellability adjustment',
    description: 'Delete sellability adjustments for a rate plan across specified date range'
  })
  @ApiBody({
    type: RatePlanDailySellabilityInputDto,
    description: 'Rate plan daily sellability adjustment data to delete'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate plan daily sellability adjustment deleted successfully',
    type: ResponseContent<RatePlanDailySellabilityDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async deleteSalesPlanSellabilityAdjustment(
    @Body() input: RatePlanDailySellabilityInputDto
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityService.deleteRatePlanDailySellability(input);
  }

  @Delete('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete rate plan daily sellability adjustments',
    description: 'Delete multiple sellability adjustments in a single operation'
  })
  @ApiBody({
    type: [RatePlanDailySellabilityInputDto],
    description: 'Array of rate plan daily sellability adjustment data to delete'
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk rate plan daily sellability adjustments deleted successfully',
    type: ResponseContent<RatePlanDailySellabilityDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async bulkDeleteSalesPlanSellabilityAdjustment(
    @Body() inputList: RatePlanDailySellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityService.bulkDeleteRatePlanDailySellability(inputList);
  }
}
