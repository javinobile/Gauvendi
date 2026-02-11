import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  CreateRatePlanDto,
  DeleteRatePlanPayloadDto,
  MonthlyRatePlanOverviewFilterDto,
  RatePlanFilterDto,
  SmartFindingPromoCodeDto,
  SmartFindingPromoCodeFilterDto,
  UpdateRatePlanPayloadDto,
  UpsertSalesPlanSellAbilityDto
} from '../dto';
import {
  RoomProductAssignToRatePlanDto,
  RoomProductAssignToRatePlanFilterDto
} from '../dto/room-product-assign-to-rate-plan';
import { RatePlanRepository } from '../repositories/rate-plan.repository';
import { RatePlanOverviewRepository } from '../repositories/rate-plan-overview.repository';

@Controller('rate-plans')
export class RatePlanController {
  constructor(
    private readonly ratePlanRepository: RatePlanRepository,
    private readonly ratePlanOverviewRepository: RatePlanOverviewRepository
  ) {}

  @MessagePattern({ cmd: 'get_rate_plan_for_product' })
  async getRatePlanForProduct(@Payload() filterDto: RatePlanFilterDto) {
    return await this.ratePlanRepository.getList(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CREATE_RATE_PLAN })
  async create(@Payload() createDto: CreateRatePlanDto): Promise<any> {
    return this.ratePlanRepository.create(createDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.UPDATE_RATE_PLAN })
  async update(@Payload() payload: UpdateRatePlanPayloadDto): Promise<any> {
    return this.ratePlanRepository.update(payload.id, payload.body);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.UPSERT_SALES_PLAN_SELL_ABILITY })
  async upsertSalesPlanSellAbility(
    @Payload() payload: UpsertSalesPlanSellAbilityDto
  ): Promise<any> {
    return this.ratePlanRepository.upsertSalesPlanSellAbility(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.DELETE_RATE_PLAN })
  async deleteRatePlan(@Payload() payload: DeleteRatePlanPayloadDto): Promise<any> {
    return this.ratePlanRepository.delete(payload);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_ROOM_PRODUCT_ASSIGN_TO_RATE_PLAN })
  async getRoomProductAssignToRatePlan(
    @Payload() filterDto: RoomProductAssignToRatePlanFilterDto
  ): Promise<RoomProductAssignToRatePlanDto[]> {
    return this.ratePlanRepository.findRoomProductAssignToRatePlan(filterDto);
  }

  @Get('smart-finding/promo-code')
  smartFindingPromoCode(
    @Query() filterDto: SmartFindingPromoCodeFilterDto
  ): Promise<SmartFindingPromoCodeDto[]> {
    return this.ratePlanRepository.smartFindingPromoCode(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.MONTHLY_RATE_PLAN_OVERVIEW })
  async monthlyRatePlanOverview(@Payload() filterDto: MonthlyRatePlanOverviewFilterDto) {
    return this.ratePlanOverviewRepository.monthlyRatePlanOverview(filterDto);
  }

  @MessagePattern({ cmd: 'onboard_whip_rate_plan' })
  async onboardWhipRatePlan(@Payload() payload: { hotelId: string }) {
    return this.ratePlanRepository.onboardWhipRatePlan(payload.hotelId);
  }
}
