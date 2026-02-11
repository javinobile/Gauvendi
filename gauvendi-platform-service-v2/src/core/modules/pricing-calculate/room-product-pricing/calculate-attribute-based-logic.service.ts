import { Injectable } from '@nestjs/common';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import {
  CalculateAttributeBasedPricingDto,
  CalculateDailyPricingDto,
  RoomProductPricingService
} from './room-product-pricing.service';

@Injectable()
export class CalculateAttributeBasedLogicService {
  constructor(private readonly roomProductPricingService: RoomProductPricingService) {}

  calculateRFPAttributeBased(input: {
    rfcFeatureBasePricingResults: CalculateDailyPricingDto[];
    mrfcAveragePricingResults: CalculateDailyPricingDto[];
    isOnlyChange?: boolean;
  }) {
    const {
      rfcFeatureBasePricingResults,
      mrfcAveragePricingResults,
      isOnlyChange
    } = input;
    const mrfcValueMap = groupByToMapSingle(
      mrfcAveragePricingResults,
      (mrfcAveragePricing) => `${mrfcAveragePricing.date}`
    );

    const results: CalculateAttributeBasedPricingDto[] = [];
    for (const rfcFeatureBasePricing of rfcFeatureBasePricingResults) {
      const mrfcValue = mrfcValueMap.get(`${rfcFeatureBasePricing.date}`);

      if (rfcFeatureBasePricing.isOriginal) {
        results.push({
          ...rfcFeatureBasePricing
        });
      } else {
        if (!mrfcValue || mrfcValue.accommodationRate <= rfcFeatureBasePricing.accommodationRate) {
          if (!isOnlyChange) {
            results.push({
              ...rfcFeatureBasePricing,
              originalRate: rfcFeatureBasePricing.accommodationRate,
              attributeBasedRate: rfcFeatureBasePricing.accommodationRate
            });
          }
          continue;
        }

        results.push({
          ...mrfcValue,
          originalRate: rfcFeatureBasePricing.accommodationRate,
          attributeBasedRate: mrfcValue.accommodationRate,
          roomProductId: rfcFeatureBasePricing.roomProductId
        });
      }
    }

    return results;
  }
}
