import { Injectable } from '@nestjs/common';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RoundingModeEnum } from '@src/core/enums/common';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import { PricingUtils } from '../pricing-utils';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from '../rate-plan-adjustment/rate-plan-adjustment.service';
import { CalculateDailyPricingDto } from './room-product-pricing.service';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';

@Injectable()
export class CalculateLinkedPricingService {
  constructor() {}

  calculateLinkedPricePricing(input: {
    hotelId: string;
    dailySellingPrices: RoomProductDailySellingPrice[];
    ratePlanId: string;
    dates: string[];
    ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
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
      dailySellingPrices,
      ratePlanId,
      dates,
      ratePlanAdjustments,
      pricingMethodDetails,
      accommodationTaxes = [],
      roundingMode = RoundingModeEnum.NO_ROUNDING
    } = input;

    const ratePlanAdjustmentMap = groupByToMapSingle(
      ratePlanAdjustments,
      (ra) => `${ra.ratePlanId}-${ra.date}`
    );

    const results: CalculateDailyPricingDto[] = [];

    for (const pricingMethodDetail of pricingMethodDetails) {
      for (const dailySellingPrice of dailySellingPrices) {
        const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
          PricingUtils.calculateRatePlanAdjustment({
            basePrice: dailySellingPrice.basePrice,
            pricingMethodAdjustmentValue: pricingMethodDetail?.pricingMethodAdjustmentValue,
            pricingMethodAdjustmentUnit: pricingMethodDetail?.pricingMethodAdjustmentUnit,
            ratePlanAdjustment: ratePlanAdjustmentMap.get(`${ratePlanId}-${dailySellingPrice.date}`)
          });

        const calculateResult = PricingUtils.calculateHotelTax({
          date: dailySellingPrice.date,
          basePrice: basePrice,
          ratePlanId,
          hotelId,
          roomProductId: pricingMethodDetail.roomProductId,
          ratePlanAdjustmentRate,
          pricingMethodAdjustmentRate,
          accommodationTaxes,
          roundingMode
        });

        results.push({
          date: dailySellingPrice.date,
          roomProductId: pricingMethodDetail.roomProductId,
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

    return results;
  }
}
