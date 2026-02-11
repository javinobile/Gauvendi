import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanExtraServiceDto,
  RatePlanExtraServiceFilterDto,
  RatePlanExtraServiceInputDto
} from '../dtos';
import { RatePlanExtraServiceService } from '../services/rate-plan-extra-service.service';
@ApiTags('Rate Plan Extra Service')
@Controller('rate-plan-extra-service')
export class RatePlanExtraServiceController {
  constructor(private readonly ratePlanExtraServiceService: RatePlanExtraServiceService) {}

  @Get('list')
  @ApiOperation({
    summary: 'Get rate plan extra services list',
    description: 'Retrieve a filtered list of rate plan extra services'
  })
  @ApiQuery({
    name: 'ratePlanIdList',
    required: false,
    type: [String],
    description: 'Filter by rate plan IDs'
  })
  @ApiQuery({
    name: 'serviceIdList',
    required: false,
    type: [String],
    description: 'Filter by extra service IDs'
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
    description: 'Successfully retrieved sales plan services list',
    type: ResponseData<RatePlanExtraServiceDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid filter parameters'
  })
  async salesPlanServicesList(
    @Query() filter: RatePlanExtraServiceFilterDto
  ): Promise<RatePlanExtraServiceDto[]> {
    return await this.ratePlanExtraServiceService.ratePlanExtraServiceList(filter);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create sales plan services',
    description:
      'Create or update services associated with a sales plan. This operation replaces all existing services for the given sales plan.'
  })
  @ApiBody({
    type: RatePlanExtraServiceInputDto,
    description: 'Sales plan services data to create'
  })
  @ApiResponse({
    status: 201,
    description: 'Sales plan services created successfully',
    type: ResponseContent<RatePlanExtraServiceDto>
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid input data'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async createRatePlanExtraServices(
    @Body() input: RatePlanExtraServiceInputDto,
  ): Promise<any> {
    return await this.ratePlanExtraServiceService.createRatePlanExtraService(input);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete sales plan services',
    description: 'Delete specific services from a sales plan'
  })
  @ApiBody({
    type: RatePlanExtraServiceInputDto,
    description: 'Sales plan services data to delete'
  })
  @ApiResponse({
    status: 200,
    description: 'Rate plan extra services deleted successfully',
    type: ResponseContent<RatePlanExtraServiceDto>
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - no services found in sales plan for deleting'
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - inconsistency error'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - delete failure'
  })
  async deleteRatePlanExtraServices(
    @Body() input: RatePlanExtraServiceInputDto,
  ): Promise<any> {
    return await this.ratePlanExtraServiceService.deleteRatePlanExtraService(input);
  }
}
