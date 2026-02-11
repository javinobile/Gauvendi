import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  PmsEventPricingUpdateDto,
  PushPmsRatePlanPricingDto,
  UpdateRoomProductPricingMethodDetailDto
} from './room-product-pricing-method-detail.dto';
import { RoomProductPricingMethodDetailService } from './room-product-pricing-method-detail.service';
import { CRON_JOB_CMD } from '@src/core/constants/cmd.const';
import { Logger } from '@nestjs/common';

@Controller('room-product-rate-plan')
export class RoomProductPricingMethodDetailController {
  private readonly logger = new Logger(RoomProductPricingMethodDetailController.name);
  constructor(
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService
  ) {}

  @MessagePattern({ cmd: 'feature_based_pricing' })
  async calculateFeatureBasedPricing(@Payload() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.calculateFeatureBasedPricing(body);
  }

  @MessagePattern({ cmd: 'feature_based_pms_pricing' })
  async calculatePmsPricing(@Payload() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.calculatePmsPricing(body);
  }

  @MessagePattern({ cmd: 'link_product' })
  async calculateLinkedPricing(@Payload() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.calculateLinkedPricing(body);
  }

  @MessagePattern({ cmd: 'trigger_all_room_product_pricing_method_detail' })
  async triggerAllRoomProductPricingMethodDetail(
    @Payload() body: { hotelId: string; ratePlanIds?: string[]; from?: string; to?: string }
  ) {
    return this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail({
      hotelId: body.hotelId,
      ratePlanIds: body.ratePlanIds
    });
  }

  @MessagePattern({ cmd: 'push_pms_rate_plan_pricing' })
  async pushPmsRatePlanPricing(@Payload() body: PushPmsRatePlanPricingDto) {
    return this.roomProductPricingMethodDetailService.pushPmsRatePlanPricing(body);
  }

  @MessagePattern({ cmd: 'mrfc_positioning' })
  async mrfcPositioning(@Payload() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.mrfcPositioning(body);
  }

  @MessagePattern({ cmd: 'derived_product' })
  async derivedProduct(@Payload() body: UpdateRoomProductPricingMethodDetailDto) {
    return this.roomProductPricingMethodDetailService.derivedProduct(body);
  }

  @MessagePattern({ cmd: 'job_pull_pms_rate_plan_pricing' })
  async jobPullPmsRatePlanPricing() {
    return this.roomProductPricingMethodDetailService.jobPullPmsRatePlanPricing();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PULL_PMS_RATE_PLAN_PRICING })
  async jobPullPmsRatePlanPricingEvent() {
    this.logger.debug('Cron job: pull pms rate plan pricing event');
    return this.roomProductPricingMethodDetailService.jobPullPmsRatePlanPricing();
  }

  @MessagePattern({ cmd: 'pms_event_pricing_update' })
  async pmsEventPricingUpdate(@Payload() body: PmsEventPricingUpdateDto) {
    return this.roomProductPricingMethodDetailService.pmsEventPricingUpdate(body);
  }

  @MessagePattern({ cmd: 'job_push_rate_to_pms' })
  async getPushToPmsTasks() {
    return this.roomProductPricingMethodDetailService.jobPushPmsRatePlanPricing();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PUSH_RATE_TO_PMS })
  async jobPushPmsRatePlanPricingEvent() {
    this.logger.debug('Cron job: push rate to pms event');
    return this.roomProductPricingMethodDetailService.jobPushPmsRatePlanPricing();
  }

  @MessagePattern({ cmd: 'bulk_trigger_all_pricing' })
  async bulkTriggerAllPricing(
    @Payload() body: { hotelId: string; fromDate: string; toDate: string }
  ) {
    return this.roomProductPricingMethodDetailService.triggerAllPricing({
      hotelId: body.hotelId,
      fromDate: body.fromDate,
      toDate: body.toDate
    });
  }

  @MessagePattern({ cmd: 'pull_all_pricing_from_pms' })
  async pullAllPricingFromPms(
    @Payload() body: { hotelId: string; fromDate: string; toDate: string }
  ) {
    return this.roomProductPricingMethodDetailService.pullAllPricingFromPms({
      hotelId: body.hotelId,
      fromDate: body.fromDate,
      toDate: body.toDate
    });
  }
}
