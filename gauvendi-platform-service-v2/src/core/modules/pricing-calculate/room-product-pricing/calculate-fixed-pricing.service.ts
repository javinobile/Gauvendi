import { Injectable } from '@nestjs/common';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RoundingModeEnum } from '@src/core/enums/common';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import { PricingUtils } from '../pricing-utils';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from '../rate-plan-adjustment/rate-plan-adjustment.service';
import {
  CalculateDailyPricingDto,
  RoomProductPricingService
} from './room-product-pricing.service';

@Injectable()
export class CalculateFixedPricingService {
  constructor(private readonly roomProductPricingService: RoomProductPricingService) {}

  calculateDailyFixedPricePricing(input: {
    hotelId: string;
    roomProductIds: string[];
    ratePlanIds: string[];
    fixedPrice: number;
    ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
    dates: string[];
    accommodationTaxes?: HotelTaxSetting[];
    pricingMethodDetails: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
      roomProductId: string;
      ratePlanId: string;
    }[];
    roundingMode?: RoundingModeEnum;
  }): CalculateDailyPricingDto[] {
    const {
      hotelId,
      roomProductIds,
      ratePlanIds,
      fixedPrice,
      ratePlanAdjustments,
      dates,
      pricingMethodDetails,
      accommodationTaxes = [],
      roundingMode = RoundingModeEnum.NO_ROUNDING
    } = input;

    const ratePlanAdjustmentMap = groupByToMapSingle(
      ratePlanAdjustments,
      (ra) => `${ra.ratePlanId}-${ra.date}`
    );

    const pricingMethodDetailMap = groupByToMapSingle(
      pricingMethodDetails,
      (pd) => `${pd.roomProductId}_${pd.ratePlanId}`
    );

    const results: CalculateDailyPricingDto[] = [];

    for (const roomProductId of roomProductIds) {
      for (const date of dates) {
        for (const ratePlanId of ratePlanIds) {
          const pricingMethodDetail = pricingMethodDetailMap.get(`${roomProductId}_${ratePlanId}`);
          const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
            PricingUtils.calculateRatePlanAdjustment({
              basePrice: fixedPrice,
              pricingMethodAdjustmentValue: pricingMethodDetail?.pricingMethodAdjustmentValue,
              pricingMethodAdjustmentUnit: pricingMethodDetail?.pricingMethodAdjustmentUnit,
              ratePlanAdjustment: ratePlanAdjustmentMap.get(`${ratePlanId}-${date}`)
            });

          const calculateResult = PricingUtils.calculateHotelTax({
            date,
            basePrice: basePrice,
            ratePlanId,
            hotelId,
            roomProductId,
            ratePlanAdjustmentRate,
            pricingMethodAdjustmentRate,
            accommodationTaxes,
            roundingMode
          });

          if (calculateResult.accommodationRate > 0) {
            results.push({
              date,
              roomProductId,
              ratePlanId,
              hotelId,
              featureBasedRate: basePrice + pricingMethodAdjustmentRate,
              adjustmentRate: calculateResult.adjustmentRate,
              accommodationRate: calculateResult.accommodationRate,
              netPrice: calculateResult.netPrice,
              grossPrice: calculateResult.grossPrice,
              totalTaxAmount: calculateResult.totalTaxAmount,
              pricingMethodAdjustmentRate
            });
          }
        }
      }
    }

    return results;
  }
}
