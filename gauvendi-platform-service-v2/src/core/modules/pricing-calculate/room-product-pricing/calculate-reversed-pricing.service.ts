import { Injectable } from '@nestjs/common';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RoomProductType, RoundingModeEnum } from '@src/core/enums/common';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import { RatePlanPricingMappingDto } from '@src/modules/pms/pms.dto';
import { RoomProductRatePlanRepository } from '@src/modules/room-product-rate-plan/room-product-rate-plan.repository';
import Decimal from 'decimal.js';
import { PricingUtils } from '../pricing-utils';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from '../rate-plan-adjustment/rate-plan-adjustment.service';
import {
  CalculateAttributeBasedPricingDto,
  CalculateDailyPricingDto,
  RoomProductPricingService
} from './room-product-pricing.service';

@Injectable()
export class CalculateReversedPricingService {
  constructor(
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly roomProductPricingService: RoomProductPricingService
  ) {}

  calculatePmsPricing(input: {
    hotelId: string;
    roomProductRatePlans: {
      roomProductId: string;
      ratePlanId: string;
      roomProductType: RoomProductType;
      pmsBasePrices: RatePlanPricingMappingDto[];
    }[];
    dates: string[];
    ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
    accommodationTaxes?: HotelTaxSetting[];
    roundingMode: RoundingModeEnum;
  }) {
    const {
      hotelId,
      roomProductRatePlans,
      dates,
      ratePlanAdjustments,
      accommodationTaxes = [],
      roundingMode
    } = input;
    const results: CalculateDailyPricingDto[] = [];
    const ratePlanAdjustmentMap = groupByToMapSingle(
      ratePlanAdjustments,
      (ra) => `${ra.ratePlanId}-${ra.date}`
    );
    for (const roomProductRatePlan of roomProductRatePlans) {
      const pmsBasePricesMap = groupByToMapSingle(
        roomProductRatePlan.pmsBasePrices,
        (pmsBasePrice) => `${pmsBasePrice.date}`
      );

      for (const date of dates) {
        const targetPmsPrice = pmsBasePricesMap.get(`${date}`);
        if (!targetPmsPrice) {
          continue;
        }

        const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
          PricingUtils.calculateRatePlanAdjustment({
            basePrice: targetPmsPrice.grossPrice,
            ratePlanAdjustment: ratePlanAdjustmentMap.get(
              `${roomProductRatePlan.ratePlanId}-${date}`
            )
          });

        const calculateResult = PricingUtils.calculateHotelTax({
          date,
          basePrice: basePrice,
          ratePlanId: roomProductRatePlan.ratePlanId,
          hotelId,
          roomProductId: roomProductRatePlan.roomProductId,
          ratePlanAdjustmentRate,
          pricingMethodAdjustmentRate,
          accommodationTaxes,
          roundingMode
        });

        if (calculateResult.accommodationRate > 0) {
          results.push({
            date,
            roomProductId: roomProductRatePlan.roomProductId,
            ratePlanId: roomProductRatePlan.ratePlanId,
            hotelId,
            featureBasedRate: basePrice,
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

    return results;
  }

  calculateDailyReversedPricing(input: {
    hotelId: string;
    roomProducts: {
      roomProductId: string;
      relatedRoomProductIds: string[];
      roomProductType: RoomProductType;
    }[];
    rfcFeatureBasePricingResults: CalculateAttributeBasedPricingDto[];
    targetPmsPrices: {
      roomProductId: string;
      date: string;
      price: number;
    }[];

    dates: string[];
    ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
    accommodationTaxes?: HotelTaxSetting[];
    pricingMethodAdjustmentValue?: number;
    pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    ratePlans: {
      id: string;
      rfcAttributeMode?: boolean;
    }[];
    roundingMode: RoundingModeEnum;
  }) {
    const {
      hotelId,
      roomProducts,
      rfcFeatureBasePricingResults,
      targetPmsPrices,
      ratePlans,
      dates,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit,
      ratePlanAdjustments,
      accommodationTaxes = [],
      roundingMode
    } = input;
    const results: CalculateDailyPricingDto[] = [];
    const targetPmsPriceMap = groupByToMapSingle(
      targetPmsPrices,
      (targetPmsPrice) => `${targetPmsPrice.roomProductId}-${targetPmsPrice.date}`
    );
    const rfcFeatureBasePricingMap = groupByToMapSingle(
      rfcFeatureBasePricingResults,
      (rfcFeatureBasePricing) =>
        `${rfcFeatureBasePricing.roomProductId}-${rfcFeatureBasePricing.date}`
    );
    const ratePlanAdjustmentMap = groupByToMapSingle(
      ratePlanAdjustments,
      (ra) => `${ra.ratePlanId}-${ra.date}`
    );
    for (const roomProduct of roomProducts) {
      for (const date of dates) {
        const targetPmsPrice = targetPmsPriceMap.get(`${roomProduct.roomProductId}-${date}`);
        if (!targetPmsPrice) {
          continue;
        }
        const rfcFeatureBasePricingList = roomProduct.relatedRoomProductIds
          .map((relatedRoomProductId) =>
            rfcFeatureBasePricingMap.get(`${relatedRoomProductId}-${date}`)
          )
          .filter((x) => x !== undefined);

        const featureBasedPrices = rfcFeatureBasePricingList
          .map((x) => x?.originalRate || x?.accommodationRate || 0)
          .filter((x) => x !== undefined);

        const averagePrice =
          featureBasedPrices.length > 0
            ? new Decimal(featureBasedPrices.reduce((acc, curr) => acc + curr, 0))
                .div(featureBasedPrices.length)
                .toNumber()
            : 0;

        for (const rfcFeatureBasePricing of rfcFeatureBasePricingList) {
          const dailyPrice =
            rfcFeatureBasePricing.attributeBasedRate ||
            rfcFeatureBasePricing.accommodationRate ||
            0;

          const reversedPricing = averagePrice
            ? new Decimal(targetPmsPrice.price).mul(dailyPrice).div(averagePrice).toNumber()
            : 0;

          if (reversedPricing > 0) {
            for (const ratePlan of ratePlans) {
              let attributeReversedPricing = reversedPricing;
              if (ratePlan.rfcAttributeMode && attributeReversedPricing < targetPmsPrice.price) {
                attributeReversedPricing = targetPmsPrice.price;
              }

              const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
                PricingUtils.calculateRatePlanAdjustmentReversed({
                  targetPrice: attributeReversedPricing,
                  pricingMethodAdjustmentValue,
                  pricingMethodAdjustmentUnit,
                  ratePlanAdjustment: ratePlanAdjustmentMap.get(`${ratePlan.id}-${date}`)
                });

              const calculateResult = PricingUtils.calculateHotelTax({
                date,
                basePrice: basePrice,
                ratePlanId: ratePlan.id,
                hotelId,
                roomProductId: rfcFeatureBasePricing.roomProductId,
                ratePlanAdjustmentRate,
                pricingMethodAdjustmentRate,
                accommodationTaxes,
                roundingMode
              });

              results.push({
                date,
                roomProductId: rfcFeatureBasePricing.roomProductId,
                ratePlanId: ratePlan.id,
                hotelId,
                featureBasedRate: basePrice,
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
    }

    return results;
  }
}
