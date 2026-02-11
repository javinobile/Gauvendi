import { Injectable } from '@nestjs/common';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductType, RoundingModeEnum } from '@src/core/enums/common';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { Decimal } from 'decimal.js';
import { PricingUtils } from '../pricing-utils';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from '../rate-plan-adjustment/rate-plan-adjustment.service';
import {
  BaseFeaturePricingDto,
  CalculateDailyPricingDto,
  RelatedRoomProductBasePricingWithUnit,
  RfcFeatureBasePricing,
  RoomProductPricingService
} from './room-product-pricing.service';

@Injectable()
export class CalculateCombinedPricingService {
  constructor(private readonly roomProductPricingService: RoomProductPricingService) {}

  calculateDailyCombinedPricing(input: {
    hotelId: string;
    roomProducts: {
      roomProductId: string;
      relatedRoomProductIds: string[];
      roomProductType: RoomProductType;
    }[];
    rfcFeatureBasePricingResults: BaseFeaturePricingDto[];

    dates: string[];

    // relatedRoomProductAvailabilities: RoomProductDailyAvailability[];
    // relatedRoomProductAssignedUnits: RoomProductAssignedUnit[];
    // roomUnitAvailabilities: RoomUnitAvailability[];
    ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
    accommodationTaxes?: HotelTaxSetting[];
    pricingMethodDetails: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
      roomProductId: string;
      ratePlanId: string;
    }[];
    ratePlanIds: string[];
    roundingMode: RoundingModeEnum;
  }) {
    const {
      hotelId,
      roomProducts,
      rfcFeatureBasePricingResults,
      dates,
      // relatedRoomProductAvailabilities,
      // relatedRoomProductAssignedUnits,
      // roomUnitAvailabilities,
      pricingMethodDetails,
      ratePlanIds,
      ratePlanAdjustments,
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
    // const relatedRoomProductAvailabilityMap = groupByToMapSingle(
    //   relatedRoomProductAvailabilities,
    //   (roomProductAvailability) =>
    //     `${roomProductAvailability.roomProductId}_${roomProductAvailability.date}`
    // );

    // const relatedRoomProductAssignedUnitsMap = groupByToMap(
    //   relatedRoomProductAssignedUnits,
    //   (roomProductAssignedUnit) => `${roomProductAssignedUnit.roomProductId}`
    // );

    // const roomUnitAvailabilityMap = groupByToMapSingle(
    //   roomUnitAvailabilities,
    //   (roomUnitAvailability) => `${roomUnitAvailability.roomUnitId}_${roomUnitAvailability.date}`
    // );

    const rfcFeatureBasePricingMap = groupByToMapSingle(
      rfcFeatureBasePricingResults,
      (rfcFeatureBasePricing) =>
        `${rfcFeatureBasePricing.roomProductId}_${rfcFeatureBasePricing.date}`
    );

    const results: CalculateDailyPricingDto[] = [];
    for (const roomProduct of roomProducts) {
      for (const date of dates) {
        // const relatedRoomProductAvailabilityIds = this.getRelatedRoomProductAvailability({
        //   relatedRoomProductIds: roomProduct.relatedRoomProductIds,
        //   date,
        //   relatedRoomProductAvailabilityMap
        // });

        const relatedRoomProductBasePricing =
          this.roomProductPricingService.getRelatedRoomProductBasePricing({
            // relatedRoomProductIds: relatedRoomProductAvailabilityIds,
            relatedRoomProductIds: roomProduct.relatedRoomProductIds,
            date,
            rfcFeatureBasePricingMap
          });

        const combinedPrice = this.calculateCombinedPricing({
          relatedRoomProductBasePricing,
          roomProductType: roomProduct.roomProductType
        });

        if (combinedPrice > 0) {
          for (const ratePlanId of ratePlanIds) {
            const pricingMethodDetail = pricingMethodDetailMap.get(
              `${roomProduct.roomProductId}_${ratePlanId}`
            );
            const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
              PricingUtils.calculateRatePlanAdjustmentReversed({
                targetPrice: combinedPrice,
                pricingMethodAdjustmentValue: pricingMethodDetail?.pricingMethodAdjustmentValue,
                pricingMethodAdjustmentUnit: pricingMethodDetail?.pricingMethodAdjustmentUnit,
                ratePlanAdjustment: ratePlanAdjustmentMap.get(`${ratePlanId}-${date}`)
              });

            const calculateResult = PricingUtils.calculateHotelTax({
              date,
              basePrice: basePrice,
              ratePlanId,
              hotelId,
              roomProductId: roomProduct.roomProductId,
              ratePlanAdjustmentRate,
              pricingMethodAdjustmentRate,
              accommodationTaxes,
              roundingMode
            });

            results.push({
              date,
              roomProductId: roomProduct.roomProductId,
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

  calculateDefaultCombinedPricing(input: {
    hotelId: string;
    roomProducts: {
      roomProductId: string;
      relatedRoomProductIds: string[];
      roomProductType: RoomProductType;
    }[];
    rfcFeatureBasePricingResults: RfcFeatureBasePricing[];
    relatedRoomProductAssignedUnits: RoomProductAssignedUnit[];
  }) {
    const { hotelId, roomProducts, rfcFeatureBasePricingResults, relatedRoomProductAssignedUnits } =
      input;

    const relatedRoomProductAssignedUnitsMap = groupByToMap(
      relatedRoomProductAssignedUnits,
      (roomProductAssignedUnit) => `${roomProductAssignedUnit.roomProductId}`
    );

    const rfcFeatureBasePricingMap = groupByToMapSingle(
      rfcFeatureBasePricingResults,
      (rfcFeatureBasePricing) => `${rfcFeatureBasePricing.roomProductId}`
    );

    const results: { roomProductId: string; featureBasedRate: number }[] = [];
    for (const roomProduct of roomProducts) {
      const relatedRoomProductBasePricingWithUnits =
        this.roomProductPricingService.getDefaultRelatedRoomProductBasePricingWithUnit({
          relatedRoomProductIds: roomProduct.relatedRoomProductIds,
          relatedRoomProductAssignedUnitsMap,
          rfcFeatureBasePricingMap
        });

      const averagePrice = this.calculateCombinedPricing({
        relatedRoomProductBasePricing: relatedRoomProductBasePricingWithUnits,
        roomProductType: roomProduct.roomProductType
      });

      results.push({
        roomProductId: roomProduct.roomProductId,
        featureBasedRate: averagePrice
      });
    }

    return results;
  }

  calculateCombinedPricing(input: {
    relatedRoomProductBasePricing: RelatedRoomProductBasePricingWithUnit[];
    roomProductType: RoomProductType;
  }) {
    const { relatedRoomProductBasePricing, roomProductType } = input;

    let totalValue = new Decimal(0);
    for (const relatedRoomProductBasePricingItem of relatedRoomProductBasePricing) {
      const rfcFeatureBasePricing = relatedRoomProductBasePricingItem.rfcFeatureBasePricing;
      if (rfcFeatureBasePricing && rfcFeatureBasePricing.accommodationRate) {
        totalValue = totalValue.plus(rfcFeatureBasePricing.accommodationRate);
      }
    }

    return totalValue.toNumber();
  }
}
