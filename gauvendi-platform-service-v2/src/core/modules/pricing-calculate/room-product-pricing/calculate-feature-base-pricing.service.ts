import { Injectable } from '@nestjs/common';
import { RoomProductPricingMethodEnum, RoundingModeEnum } from '@src/core/enums/common';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { GetDefaultFeatureRateResult } from '../../../../modules/feature-pricing/feature-pricing.service';
import { PricingUtils } from '../pricing-utils';
import {
  BaseFeaturePricingDto,
  CalculateDailyFeatureBasePricingInput,
  CalculateDailyPricingDto,
  RfcFeatureBasePricing
} from './room-product-pricing.service';

@Injectable()
export class CalculateFeatureBasePricingService {
  calculateDailyFeatureBasePricing(
    input: CalculateDailyFeatureBasePricingInput
  ): CalculateDailyPricingDto[];
  calculateDailyFeatureBasePricing(
    input: CalculateDailyFeatureBasePricingInput & { isExcludeCalculateTax: true }
  ): BaseFeaturePricingDto[];
  calculateDailyFeatureBasePricing(
    input: CalculateDailyFeatureBasePricingInput & { isExcludeCalculateTax?: boolean }
  ): CalculateDailyPricingDto[] | BaseFeaturePricingDto[] {
    const {
      hotelId,
      roomProductIds,
      ratePlanIds,
      featureRates,
      ratePlanAdjustments,
      dates,
      accommodationTaxes = [],
      roundingMode = RoundingModeEnum.NO_ROUNDING,
      isExcludeCalculateTax = false,
      pricingMethodDetails,
      dailySellingPrices = []
    } = input;

    const dailySellingPriceMap = groupByToMapSingle(
      dailySellingPrices,
      (ds) => `${ds.ratePlanId}-${ds.roomProductId}_${ds.date}`
    );
    const featureRateMap = groupByToMap(featureRates, (fr) => `${fr.roomProductId}_${fr.date}`);
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
        const findFeatureRates = featureRateMap.get(`${roomProductId}_${date}`) || [];

        const featureDailyPrice = this.sumFeatureRates({
          featureRates: findFeatureRates
        });

        for (const ratePlanId of ratePlanIds) {
          const dailySellingPrice = dailySellingPriceMap.get(
            `${ratePlanId}-${roomProductId}_${date}`
          );
          const pricingMethodDetail = pricingMethodDetailMap.get(`${roomProductId}_${ratePlanId}`);

          let price = featureDailyPrice;
          if (dailySellingPrice && dailySellingPrice.basePrice) {
            if (pricingMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.DERIVED) {
              const adjustmentRate = PricingUtils.calculateAdjustment({
                basePrice: dailySellingPrice.basePrice,
                adjustmentValue: pricingMethodDetail?.pricingMethodAdjustmentValue,
                adjustmentUnit: pricingMethodDetail?.pricingMethodAdjustmentUnit
              });
              price = dailySellingPrice.basePrice + adjustmentRate;
            }

            if (
              pricingMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.LINK ||
              pricingMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING
            ) {
              price = dailySellingPrice.basePrice;
            }
          }

          const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
            PricingUtils.calculateRatePlanAdjustment({
              basePrice: price,
              pricingMethodAdjustmentValue: pricingMethodDetail?.pricingMethodAdjustmentValue,
              pricingMethodAdjustmentUnit: pricingMethodDetail?.pricingMethodAdjustmentUnit,
              ratePlanAdjustment: ratePlanAdjustmentMap.get(`${ratePlanId}-${date}`)
            });

          const calculateResult = !isExcludeCalculateTax
            ? PricingUtils.calculateHotelTax({
                date,
                basePrice: basePrice,
                ratePlanAdjustmentRate,
                pricingMethodAdjustmentRate,
                ratePlanId,
                hotelId,
                roomProductId,
                accommodationTaxes,
                roundingMode
              })
            : null;

          if (isExcludeCalculateTax) {
            if (ratePlanAdjustmentRate + pricingMethodAdjustmentRate + basePrice > 0) {
              results.push({
                date,
                roomProductId,
                ratePlanId,
                hotelId,
                featureBasedRate: basePrice + pricingMethodAdjustmentRate,
                adjustmentRate: ratePlanAdjustmentRate,
                pricingMethodAdjustmentRate,
                accommodationRate: !isExcludeCalculateTax
                  ? calculateResult?.accommodationRate || 0
                  : ratePlanAdjustmentRate + pricingMethodAdjustmentRate + basePrice,
                netPrice: calculateResult?.netPrice,
                grossPrice: calculateResult?.grossPrice,
                totalTaxAmount: calculateResult?.totalTaxAmount,
                isOriginal: dailySellingPrice ? true : false
              });
            }
          } else {
            if (calculateResult && calculateResult.accommodationRate > 0) {
              results.push({
                date,
                roomProductId,
                ratePlanId,
                hotelId,
                featureBasedRate: basePrice + pricingMethodAdjustmentRate,
                adjustmentRate: ratePlanAdjustmentRate,
                pricingMethodAdjustmentRate,
                accommodationRate: !isExcludeCalculateTax
                  ? calculateResult?.accommodationRate || 0
                  : ratePlanAdjustmentRate + pricingMethodAdjustmentRate + basePrice,
                netPrice: calculateResult?.netPrice,
                grossPrice: calculateResult?.grossPrice,
                totalTaxAmount: calculateResult?.totalTaxAmount,
                isOriginal: dailySellingPrice ? true : false
              });
            }
          }
        }
      }
    }

    return results;
  }

  calculateDefaultFeatureBasePricing(input: {
    hotelId: string;
    roomProductIds: string[];
    featureRates: GetDefaultFeatureRateResult[];
    pricingMethodAdjustmentValue?: number;
    pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    roundingMode?: RoundingModeEnum;
  }) {
    const {
      roomProductIds,
      featureRates,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit
    } = input;

    const results: RfcFeatureBasePricing[] = [];

    const featureRateMap = groupByToMap(featureRates, (fr) => `${fr.roomProductId}`);

    for (const roomProductId of roomProductIds) {
      const findFeatureRates = featureRateMap.get(`${roomProductId}`) || [];
      const featureDailyPrice = this.sumFeatureRates({
        featureRates: findFeatureRates
      });

      const pricingMethodAdjustmentRate = PricingUtils.calculateAdjustment({
        basePrice: featureDailyPrice,
        adjustmentValue: pricingMethodAdjustmentValue,
        adjustmentUnit: pricingMethodAdjustmentUnit
      });

      results.push({
        roomProductId,
        featureBasedRate: featureDailyPrice,
        adjustmentRate: 0,
        pricingMethodAdjustmentRate,
        accommodationRate: featureDailyPrice + pricingMethodAdjustmentRate
      });
    }

    return results;
  }

  private sumFeatureRates(input: { featureRates: GetDefaultFeatureRateResult[] }) {
    const { featureRates } = input;

    const totalFeatureRate = featureRates
      .map((fr) => {
        return fr.featureRate * (fr.quantity || 1);
      })
      .reduce((acc, curr) => acc + (curr || 0), 0);

    return totalFeatureRate;
  }
}
