import { Injectable, Logger } from '@nestjs/common';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import { HotelService } from '@src/modules/hotel/services/hotel.service';
import { RatePlanV2Repository } from '@src/modules/rate-plan/repositories/rate-plan-v2.repository';
import { RoomProductRatePlanRepository } from '@src/modules/room-product-rate-plan/room-product-rate-plan.repository';

@Injectable()
export class CalculateDerivedPricingService {
  private readonly logger = new Logger(CalculateDerivedPricingService.name);
  constructor(
    private readonly ratePlanV2Repository: RatePlanV2Repository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly hotelService: HotelService
  ) {}

  async calculateDerivedPricing(
    hotelId: string,
    targetRatePlanId: string,
    fromDate: string,
    toDate: string
  ) {
    const ratePlanDerivedSettings = await this.ratePlanV2Repository.findDerivedSettings(
      {
        hotelId,
        derivedRatePlanId: targetRatePlanId
      },
      {
        ratePlanId: true
      }
    );

    const focusRatePlanIds = ratePlanDerivedSettings.map((setting) => setting.ratePlanId);

    if (focusRatePlanIds.length === 0) {
      this.logger.warn(
        ' Focus rate plan IDs are not found with target rate plan ID: ' + targetRatePlanId
      );
      return [];
    }

    const [ratePlans, roomProductPricingMethodDetails] = await Promise.all([
      this.ratePlanV2Repository.findAll({
        hotelId,
        ratePlanIds: [targetRatePlanId, ...focusRatePlanIds]
      }),
      this.roomProductRatePlanRepository.findRoomProductPricingMethodDetail({
        hotelId,
        ratePlanIds: focusRatePlanIds
      })
    ]);

    const ratePlanMap = groupByToMapSingle(ratePlans, (ratePlan) => ratePlan.id);
    const roomProductPricingMethodDetailMap = groupByToMapSingle(
      roomProductPricingMethodDetails,
      (detail) => `${detail.ratePlanId}-${detail.roomProductId}`
    );

    const roomProductPricingMethodDetailTargets = roomProductPricingMethodDetails.filter(
      (detail) => detail.ratePlanId === targetRatePlanId
    );

    await Promise.all(
      roomProductPricingMethodDetailTargets.map(async (detail) => {
        const ratePlan = ratePlanMap.get(detail.ratePlanId);
        if (!ratePlan) {
          this.logger.warn('Rate plan not found with rate plan ID: ' + detail.ratePlanId);
          return;
        }
        const dailySellingPrices = await this.roomProductRatePlanRepository.findDailySellingPrices({
          hotelId,
          ratePlanIds: [targetRatePlanId],
          roomProductIds: [detail.roomProductId],
          fromDate,
          toDate
        });
        const taxSettings = await this.hotelService.getHotelTaxSettings(
          hotelId,
          [ratePlan.code],
          fromDate,
          toDate
        );
        
      })
    );
  }
}
