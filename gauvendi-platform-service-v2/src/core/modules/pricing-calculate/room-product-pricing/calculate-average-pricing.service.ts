import { Injectable } from '@nestjs/common';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  RoomProductType,
  RoomUnitAvailabilityStatus,
  RoundingModeEnum
} from '@src/core/enums/common';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import { RoomUnitRepository } from '@src/modules/room-unit/room-unit.repository';
import Decimal from 'decimal.js';
import { PricingUtils } from '../pricing-utils';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from '../rate-plan-adjustment/rate-plan-adjustment.service';
import {
  BaseFeaturePricingDto,
  CalculateDailyPricingDto,
  RelatedRoomProductBasePricingWithUnit,
  RfcFeatureBasePricing,
  RoomProductPricingService
} from './room-product-pricing.service';

type RoomProductId = RoomProduct['id'];
type RoomUnitId = RoomUnit['id'];
type Date = string;
type RatePlanId = RatePlan['id'];

@Injectable()
export class CalculateAveragePricingService {
  constructor(
    private readonly roomProductRepository: RoomProductRepository,
    private readonly roomUnitRepository: RoomUnitRepository,
    private readonly roomProductPricingService: RoomProductPricingService
  ) {}

  async getRelatedRoomProductAvailabilitiesData(input: {
    hotelId: string;
    relatedRoomProductIds: string[];
    dates: string[];
  }) {
    const { hotelId, relatedRoomProductIds, dates } = input;
    const [relatedRoomProductAvailabilities, relatedRoomProductAssignedUnits] = await Promise.all([
      this.roomProductRepository.findAvailabilities({
        hotelId,
        roomProductIds: relatedRoomProductIds
      }),
      this.roomProductRepository.findAssignedUnits({
        roomProductIds: relatedRoomProductIds
      })
    ]);

    const roomUnitIds = relatedRoomProductAssignedUnits.map(
      (roomProductAssignedUnit) => roomProductAssignedUnit.roomUnitId
    );
    const roomUnitAvailabilities = await this.roomUnitRepository.findAvailabilities({
      hotelId,
      roomUnitIds,
      dates,
      statusList: [RoomUnitAvailabilityStatus.AVAILABLE, RoomUnitAvailabilityStatus.ASSIGNED]
    });

    return {
      relatedRoomProductAvailabilities,
      relatedRoomProductAssignedUnits,
      roomUnitAvailabilities
    };
  }

  calculateDailyAveragePricing(input: {
    hotelId: string;
    roomProducts: {
      roomProductId: string;
      relatedRoomProductIds: string[];
      roomProductType: RoomProductType;
    }[];
    rfcFeatureBasePricingResults: BaseFeaturePricingDto[];

    dates: string[];

    relatedRoomProductAvailabilities: RoomProductDailyAvailability[];
    relatedRoomProductAssignedUnits: RoomProductAssignedUnit[];
    roomUnitAvailabilities: RoomUnitAvailability[];
    ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
    accommodationTaxes?: HotelTaxSetting[];
    pricingMethodDetails: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
      roomProductId: string;
      ratePlanId: string;
    }[];
    ratePlanIds: string[];
    isOccupancyBased?: boolean;
    roundingMode: RoundingModeEnum;
  }) {
    const {
      hotelId,
      roomProducts,
      rfcFeatureBasePricingResults,

      dates,
      relatedRoomProductAvailabilities,
      relatedRoomProductAssignedUnits,
      roomUnitAvailabilities,
      ratePlanIds,
      ratePlanAdjustments,
      accommodationTaxes = [],
      pricingMethodDetails,
      roundingMode = RoundingModeEnum.NO_ROUNDING,
      isOccupancyBased = false
    } = input;

    const ratePlanAdjustmentMap = groupByToMapSingle(
      ratePlanAdjustments,
      (ra) => `${ra.ratePlanId}-${ra.date}`
    );
    const pricingMethodDetailMap = groupByToMapSingle(
      pricingMethodDetails,
      (pd) => `${pd.roomProductId}_${pd.ratePlanId}`
    );
    const relatedRoomProductAvailabilityMap = groupByToMapSingle(
      relatedRoomProductAvailabilities,
      (roomProductAvailability) =>
        `${roomProductAvailability.roomProductId}_${roomProductAvailability.date}`
    );

    const relatedRoomProductAssignedUnitsMap = groupByToMap(
      relatedRoomProductAssignedUnits,
      (roomProductAssignedUnit) => `${roomProductAssignedUnit.roomProductId}`
    );

    const roomUnitAvailabilityMap = groupByToMapSingle(
      roomUnitAvailabilities,
      (roomUnitAvailability) => `${roomUnitAvailability.roomUnitId}_${roomUnitAvailability.date}`
    );

    const rfcFeatureBasePricingMap = groupByToMapSingle(
      rfcFeatureBasePricingResults,
      (rfcFeatureBasePricing) =>
        `${rfcFeatureBasePricing.roomProductId}_${rfcFeatureBasePricing.date}`
    );

    const results: CalculateDailyPricingDto[] = [];
    for (const roomProduct of roomProducts) {
      for (const date of dates) {
        const relatedRoomProductAvailability = this.getRelatedRoomProductAvailability({
          relatedRoomProductIds: roomProduct.relatedRoomProductIds,
          date,
          relatedRoomProductAvailabilityMap
        });

        const relatedRoomProductBasePricingWithUnits =
          this.getDailyRelatedRoomProductBasePricingWithUnit({
            relatedRoomProducts: relatedRoomProductAvailability,
            date,
            relatedRoomProductAssignedUnitsMap,
            roomUnitAvailabilityMap,
            rfcFeatureBasePricingMap
          });

        const totalAvailableUnitCount = relatedRoomProductBasePricingWithUnits.reduce(
          (acc, curr) => acc + curr.availableUnitIds.length || 0,
          0
        );

        if (totalAvailableUnitCount > 0) {
          let averagePrice = 0;
          if (isOccupancyBased) {
            averagePrice = this.calculateOccupancyBasedAveragePricing({
              relatedRoomProductBasePricingWithUnits,
              roomProductType: roomProduct.roomProductType
            });
          } else {
            averagePrice = this.calculateMidPointAveragePricing({
              relatedRoomProductBasePricingWithUnits,
              roomProductType: roomProduct.roomProductType
            });
          }

          if (averagePrice > 0) {
            for (const ratePlanId of ratePlanIds) {
              const pricingMethodDetail = pricingMethodDetailMap.get(
                `${roomProduct.roomProductId}_${ratePlanId}`
              );
              const { ratePlanAdjustmentRate, pricingMethodAdjustmentRate, basePrice } =
                PricingUtils.calculateRatePlanAdjustmentReversed({
                  targetPrice: averagePrice,
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
                pricingMethodAdjustmentRate,
                accommodationRate: calculateResult.accommodationRate,
                netPrice: calculateResult.netPrice,
                grossPrice: calculateResult.grossPrice,
                totalTaxAmount: calculateResult.totalTaxAmount
              });
            }
          }
        }
      }
    }

    return results;
  }

  calculateDefaultAveragePricing(input: {
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

      const averagePrice = this.calculateMidPointAveragePricing({
        relatedRoomProductBasePricingWithUnits: relatedRoomProductBasePricingWithUnits,
        roomProductType: roomProduct.roomProductType
      });

      results.push({
        roomProductId: roomProduct.roomProductId,
        featureBasedRate: averagePrice
      });
    }

    return results;
  }

  getDailyRelatedRoomProductBasePricingWithUnit(input: {
    relatedRoomProducts: {
      roomProductId: string;
      isAvailability: boolean;
    }[];
    relatedRoomProductAssignedUnitsMap: Map<RoomProductId, RoomProductAssignedUnit[]>;
    date?: string;
    roomUnitAvailabilityMap: Map<`${RoomUnitId}_${Date}`, RoomUnitAvailability>;
    rfcFeatureBasePricingMap: Map<`${RoomProductId}_${Date}`, RfcFeatureBasePricing>;
  }) {
    const {
      relatedRoomProducts,
      date,
      relatedRoomProductAssignedUnitsMap,
      roomUnitAvailabilityMap,
      rfcFeatureBasePricingMap
    } = input;

    const result: RelatedRoomProductBasePricingWithUnit[] = [];

    for (const relatedRoomProduct of relatedRoomProducts) {
      const relatedRoomProductAssignedUnits =
        relatedRoomProductAssignedUnitsMap.get(relatedRoomProduct.roomProductId) || [];
      const availableUnitIds = relatedRoomProductAssignedUnits
        .map((unit) => unit.roomUnitId)
        .filter((id) => {
          return (
            roomUnitAvailabilityMap.get(`${id}_${date}`)?.status ===
            RoomUnitAvailabilityStatus.AVAILABLE
          );
        });
      const allUnitIds = relatedRoomProductAssignedUnits.map((unit) => unit.roomUnitId);

      const rfcFeatureBasePricing = rfcFeatureBasePricingMap.get(
        `${relatedRoomProduct.roomProductId}_${date}`
      );

      result.push({
        relatedRoomProductId: relatedRoomProduct.roomProductId,
        isAvailability: relatedRoomProduct.isAvailability,
        availableUnitIds,
        allUnitIds,
        rfcFeatureBasePricing
      });
    }

    return result;
  }

  getRelatedRoomProductAvailability(input: {
    relatedRoomProductIds: string[];
    date: string;
    relatedRoomProductAvailabilityMap: Map<
      `${RoomProductId}_${Date}`,
      RoomProductDailyAvailability
    >;
  }): {
    roomProductId: string;
    isAvailability: boolean;
  }[] {
    const { relatedRoomProductIds, date, relatedRoomProductAvailabilityMap } = input;

    const result: {
      roomProductId: string;
      isAvailability: boolean;
    }[] = [];

    for (const relatedRoomProductId of relatedRoomProductIds) {
      const relatedRoomProductAvailability = relatedRoomProductAvailabilityMap.get(
        `${relatedRoomProductId}_${date}`
      );
      if (relatedRoomProductAvailability && relatedRoomProductAvailability.available > 0) {
        result.push({
          roomProductId: relatedRoomProductId,
          isAvailability: true
        });
      } else {
        result.push({
          roomProductId: relatedRoomProductId,
          isAvailability: false
        });
      }
    }
    return result;
  }

  calculateMidPointAveragePricing(input: {
    relatedRoomProductBasePricingWithUnits: RelatedRoomProductBasePricingWithUnit[];
    roomProductType: RoomProductType;
  }) {
    const { relatedRoomProductBasePricingWithUnits, roomProductType } = input;

    let totalValue = new Decimal(0);
    let totalUnitCount = 0;
    let rfcDailyRates: number[] = [];

    for (const relatedRoomProductBasePricingWithUnit of relatedRoomProductBasePricingWithUnits) {
      const rfcFeatureBasePricing = relatedRoomProductBasePricingWithUnit.rfcFeatureBasePricing;

      if (
        rfcFeatureBasePricing &&
        rfcFeatureBasePricing.accommodationRate &&
        new Decimal(rfcFeatureBasePricing.accommodationRate)
          .sub(rfcFeatureBasePricing.adjustmentRate)
          .gt(0)
      ) {
        const price = new Decimal(rfcFeatureBasePricing.accommodationRate);

        // if(relatedRoomProductBasePricingWithUnit.isAvailability) {
        //   if (roomProductType === RoomProductType.MRFC) {
        //     totalValue = totalValue.plus(
        //       price.mul(relatedRoomProductBasePricingWithUnit.availableUnitIds.length)
        //     );

        //     totalUnitCount += relatedRoomProductBasePricingWithUnit.availableUnitIds.length;
        //   } else if (roomProductType === RoomProductType.ERFC) {
        //     totalValue = totalValue.plus(price);

        //     totalUnitCount += 1;
        //   }
        // }

        if (roomProductType === RoomProductType.MRFC) {
          totalValue = totalValue.plus(
            price.mul(relatedRoomProductBasePricingWithUnit.availableUnitIds.length)
          );

          totalUnitCount += relatedRoomProductBasePricingWithUnit.availableUnitIds.length;
        } else if (roomProductType === RoomProductType.ERFC) {
          if (
            relatedRoomProductBasePricingWithUnit.isAvailability === true &&
            relatedRoomProductBasePricingWithUnit.availableUnitIds.length > 0
          ) {
            totalValue = totalValue.plus(price);

            totalUnitCount += 1;
          }
        }

        rfcDailyRates.push(price.toNumber());
      }
    }

    const midPoint = this.calculateMidPointFloor(rfcDailyRates);

    const realValue = totalUnitCount ? totalValue.div(totalUnitCount).toNumber() : 0;
    return Math.max(midPoint, realValue);
  }

  calculateOccupancyBasedAveragePricing(input: {
    relatedRoomProductBasePricingWithUnits: RelatedRoomProductBasePricingWithUnit[];
    roomProductType: RoomProductType;
  }) {
    const { relatedRoomProductBasePricingWithUnits, roomProductType } = input;

    const filterdRelatedRoomProductBasePricingWithUnits =
      relatedRoomProductBasePricingWithUnits.filter(
        (relatedRoomProductBasePricingWithUnit) =>
          relatedRoomProductBasePricingWithUnit.isAvailability === true &&
          relatedRoomProductBasePricingWithUnit.rfcFeatureBasePricing &&
          relatedRoomProductBasePricingWithUnit.rfcFeatureBasePricing.accommodationRate &&
          new Decimal(relatedRoomProductBasePricingWithUnit.rfcFeatureBasePricing.accommodationRate)
            .sub(relatedRoomProductBasePricingWithUnit.rfcFeatureBasePricing.adjustmentRate)
            .gt(0)
      );

    const rfcPrices = filterdRelatedRoomProductBasePricingWithUnits
      .filter(
        (relatedRoomProductBasePricingWithUnit) =>
          relatedRoomProductBasePricingWithUnit.isAvailability === true
      )
      .map((relatedRoomProductBasePricingWithUnit) => {
        return relatedRoomProductBasePricingWithUnit.rfcFeatureBasePricing?.accommodationRate || 0;
      })
      .filter((x) => x !== undefined);

    const totalAvailableUnitCount = relatedRoomProductBasePricingWithUnits.reduce(
      (acc, curr) => acc + curr.availableUnitIds.length,
      0
    );
    const totalAllUnitCount = relatedRoomProductBasePricingWithUnits.reduce(
      (acc, curr) => acc + curr.allUnitIds.length,
      0
    );
    const occupancy = totalAllUnitCount > 0 ? 1 - totalAvailableUnitCount / totalAllUnitCount : 0;

    const floorRFCPrice = Math.min(...rfcPrices);
    const ceilingRFCPrice = Math.max(...rfcPrices);

    if (occupancy < 0.5) {
      return floorRFCPrice + (((ceilingRFCPrice - floorRFCPrice) * occupancy) / 0.5) * 0.5;
    }

    return (
      floorRFCPrice +
      (ceilingRFCPrice - floorRFCPrice) * (0.5 + Math.pow((occupancy - 0.5) / 0.5, 0.2) * 0.5)
    );
  }

  calculateMidPointFloor(rfcDailyRates: number[]) {
    if (rfcDailyRates.length === 0) {
      return 0;
    }
    const values = rfcDailyRates.map((rate) => new Decimal(rate));
    const min = Decimal.min(...values);
    const max = Decimal.max(...values);
    return min.plus(max).div(2).toNumber();
  }
}
