import { Injectable, Logger } from '@nestjs/common';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
    BasePriceMode,
    RatePlanStatusEnum,
    RoomProductPricingMethodEnum,
    RoomProductStatus,
    RoomProductType,
    RoundingModeEnum
} from '@src/core/enums/common';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { RoomProductRatePlanRepository } from '@src/modules/room-product-rate-plan/room-product-rate-plan.repository';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import Decimal from 'decimal.js';
import { GetDailyOrDefaultFeatureRateByProductResult } from '../../../../modules/feature-pricing/feature-pricing.service';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from '../rate-plan-adjustment/rate-plan-adjustment.service';
type RoomProductId = RoomProduct['id'];
type RoomUnitId = RoomUnit['id'];
type Date = string;
type RatePlanId = RatePlan['id'];

export type RfcFeatureBasePricing = {
  roomProductId: string;
  featureBasedRate: number;
  adjustmentRate: number;
  pricingMethodAdjustmentRate: number;
  accommodationRate: number;
};

export type RelatedRoomProductBasePricingWithUnit = {
  relatedRoomProductId: RoomProductId;
  isAvailability: boolean;
  availableUnitIds: string[];
  allUnitIds: string[];
  rfcFeatureBasePricing?: RfcFeatureBasePricing;
};

export type CalculateDailyFeatureBasePricingInput = {
  hotelId: string;
  roomProductIds: string[];
  ratePlanIds: string[];
  featureRates: GetDailyOrDefaultFeatureRateByProductResult[];
  ratePlanAdjustments: GetDailyOrDefaultRatePlanAdjustmentResult[];
  dates: string[];
  pricingMethodDetails: {
    pricingMethodAdjustmentValue?: number;
    pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    roomProductId: string;
    ratePlanId: string;
    pricingMethod?: RoomProductPricingMethodEnum;
  }[];
  dailySellingPrices?: RoomProductDailySellingPrice[];
  accommodationTaxes?: HotelTaxSetting[];
  roundingMode?: RoundingModeEnum;
};

export type BaseFeaturePricingDto = {
  date: string;
  roomProductId: string;
  ratePlanId: string;
  hotelId: string;
  featureBasedRate: number;
  adjustmentRate: number;
  accommodationRate: number;
  pricingMethodAdjustmentRate: number;
};

export interface CalculateDailyPricingDto {
  date: string;
  roomProductId: string;
  ratePlanId: string;
  hotelId: string;
  adjustmentRate: number;
  featureBasedRate: number;
  pricingMethodAdjustmentRate: number;
  extraServiceRate?: number;
  accommodationRate: number;
  netPrice?: number;
  grossPrice?: number;
  totalTaxAmount?: number;
  accommodationTaxAmount?: number;
  extrasTaxAmount?: number;
  accommodationTaxRate?: number;
  isOriginal?: boolean;
}

export interface CalculateAttributeBasedPricingDto extends CalculateDailyPricingDto {
  originalRate?: number;
  attributeBasedRate?: number;
}

@Injectable()
export class RoomProductPricingService {
  private readonly logger = new Logger(RoomProductPricingService.name);

  constructor(
    private readonly roomProductRepository: RoomProductRepository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository
  ) {}

  getDefaultRelatedRoomProductBasePricingWithUnit(input: {
    relatedRoomProductIds: string[];
    relatedRoomProductAssignedUnitsMap: Map<RoomProductId, RoomProductAssignedUnit[]>;
    rfcFeatureBasePricingMap: Map<`${RoomProductId}`, RfcFeatureBasePricing>;
  }) {
    const { relatedRoomProductIds, relatedRoomProductAssignedUnitsMap, rfcFeatureBasePricingMap } =
      input;

    const result: RelatedRoomProductBasePricingWithUnit[] = [];

    for (const relatedRoomProductId of relatedRoomProductIds) {
      const relatedRoomProductAssignedUnits =
        relatedRoomProductAssignedUnitsMap.get(relatedRoomProductId) || [];
      const unitIds = relatedRoomProductAssignedUnits.map((unit) => unit.roomUnitId);

      const rfcFeatureBasePricing = rfcFeatureBasePricingMap.get(`${relatedRoomProductId}`);

      result.push({
        relatedRoomProductId,
        isAvailability: true,
        availableUnitIds: unitIds,
        allUnitIds: unitIds,
        rfcFeatureBasePricing
      });
    }

    return result;
  }

  getRelatedRoomProductBasePricing(input: {
    date: string;
    relatedRoomProductIds: string[];
    rfcFeatureBasePricingMap: Map<`${RoomProductId}_${Date}`, RfcFeatureBasePricing>;
  }) {
    const { relatedRoomProductIds, date, rfcFeatureBasePricingMap } = input;

    const result: RelatedRoomProductBasePricingWithUnit[] = [];

    for (const relatedRoomProductId of relatedRoomProductIds) {
      const rfcFeatureBasePricing = rfcFeatureBasePricingMap.get(`${relatedRoomProductId}_${date}`);

      result.push({
        relatedRoomProductId,
        isAvailability: true,
        availableUnitIds: [],
        allUnitIds: [],
        rfcFeatureBasePricing
      });
    }

    return result;
  }

  isAllowPricingMethodPushToPms(pricingMethod: RoomProductPricingMethodEnum): boolean {
    return (
      pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING &&
      // pricingMethod !== RoomProductPricingMethodEnum.REVERSED_PRICING
      pricingMethod !== RoomProductPricingMethodEnum.DERIVED
    );
  }

  async getRelatedRoomProductIds(filter: {
    hotelId: string;
    roomProductId: string;
    roomProductType: RoomProductType;
  }) {
    const { hotelId, roomProductId, roomProductType } = filter;
    let relatedRoomProductIds: string[] = [];
    if (roomProductType === RoomProductType.MRFC) {
      const relatedRoomProductMappings = await this.getRelatedForMRFCRoomProduct({
        hotelId,
        roomProductIds: [roomProductId]
      });

      relatedRoomProductIds = Array.from(
        new Set(
          relatedRoomProductMappings
            .filter((mapping) => mapping.targetRoomProductId === roomProductId)
            .flatMap((mapping) => mapping.rfcRoomProductIds)
        )
      );
    } else if (roomProductType === RoomProductType.ERFC) {
      const relatedRoomProductMappings = await this.getRelatedForERFCRoomProduct({
        hotelId,
        roomProductIds: [roomProductId]
      });

      relatedRoomProductIds = Array.from(
        new Set(
          relatedRoomProductMappings
            .filter((mapping) => mapping.targetRoomProductId === roomProductId)
            .flatMap((mapping) => mapping.rfcRoomProductIds)
        )
      );
    }
    return relatedRoomProductIds;
  }

  async getRelatedForMRFCRoomProduct(filter: {
    hotelId: string;
    roomProductIds: string[];
  }): Promise<
    {
      targetRoomProductId: string;
      rfcRoomProductIds: string[];
    }[]
  > {
    try {
      const { hotelId, roomProductIds } = filter;
      const roomProductMappings = await this.roomProductRepository.findRoomProductMappings({
        hotelId,
        roomProductIds,
        relatedRoomProductTypes: [RoomProductType.RFC]
      });

      const group = groupByToMap(roomProductMappings, (mapping) => mapping.roomProductId);

      return roomProductIds.map((roomProductId) => ({
        targetRoomProductId: roomProductId,
        rfcRoomProductIds:
          group.get(roomProductId)?.map((mapping) => mapping.relatedRoomProductId) || []
      }));
    } catch (error) {
      this.logger.error(`Error fetching related room product IDs: ${error.message}`);
      return [];
    }
  }

  async getTargetForRFCRoomProduct(filter: {
    hotelId: string;
    rfcRoomProductIds: string[];
    targetRoomProductTypes?: RoomProductType[];
  }): Promise<
    {
      targetRoomProductId: string;
      rfcRoomProductId: string;
    }[]
  > {
    const { hotelId, rfcRoomProductIds, targetRoomProductTypes } = filter;
    const relatedAssignedUnits = await this.roomProductRepository.findAssignedUnits(
      {
        roomProductIds: rfcRoomProductIds,
        roomProductTypes: [RoomProductType.RFC],
        roomProductStatus: [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT]
      },
      { roomProductId: true, roomUnitId: true }
    );

    const unitIds = relatedAssignedUnits.map((unit) => unit.roomUnitId);

    const assignedUnits = await this.roomProductRepository.findAssignedUnits(
      {
        roomUnitIds: unitIds,
        roomProductStatus: [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT],
        roomProductTypes: targetRoomProductTypes || [RoomProductType.ERFC, RoomProductType.MRFC]
      },
      { roomProductId: true, roomUnitId: true }
    );

    const assignedUnitMapByRoomProductId = groupByToMap(
      assignedUnits,
      (unit) => unit.roomProductId
    );
    const relatedAssignedUnitMapByRoomUnitId = groupByToMap(
      relatedAssignedUnits,
      (unit) => unit.roomUnitId
    );

    const results: {
      targetRoomProductId: string;
      rfcRoomProductId: string;
    }[] = [];
    for (const roomProductId of assignedUnitMapByRoomProductId.keys()) {
      const relatedUnitIds =
        assignedUnitMapByRoomProductId.get(roomProductId)?.map((unit) => unit.roomUnitId) || [];

      const findRFCRoomProductIds = Array.from(
        new Set(
          relatedUnitIds
            .map(
              (unitId) =>
                relatedAssignedUnitMapByRoomUnitId.get(unitId)?.map((unit) => unit.roomProductId) ||
                []
            )
            .flat()
        )
      );

      for (const rfcRoomProductId of findRFCRoomProductIds) {
        results.push({
          targetRoomProductId: roomProductId,
          rfcRoomProductId: rfcRoomProductId
        });
      }
    }
    return results;
  }

  async getReversedRFCRoomProduct(filter: {
    hotelId: string;
    methodDetails: RoomProductPricingMethodDetail[];
  }): Promise<
    {
      ratePlanId: string;
      targetRoomProductId: string;
      rfcRoomProductId: string;
    }[]
  > {
    const { hotelId, methodDetails } = filter;

    const pmsMethodDetails = methodDetails.filter(
      (item) => item.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING
    );
    const ratePlanIds = Array.from(new Set(pmsMethodDetails.map((item) => item.ratePlanId)));
    const roomProductIds = Array.from(new Set(pmsMethodDetails.map((item) => item.roomProductId)));

    const [roomProductRatePlans, roomProducts] = await Promise.all([
      this.roomProductRatePlanRepository.findAll(
        {
          hotelId,
          ratePlanIds,
          roomProductIds: roomProductIds
        },
        {
          id: true,
          roomProductId: true,
          ratePlanId: true
        }
      ),
      this.roomProductRepository.find(
        {
          hotelId,
          roomProductIds: roomProductIds
        },
        ['roomProduct.id', 'roomProduct.type']
      )
    ]);

    const rfcRoomProductIds = roomProducts
      .filter((r) => r.type === RoomProductType.RFC)
      .map((r) => r.id);
    const mrfcRoomProductIds = roomProducts
      .filter((r) => r.type === RoomProductType.MRFC)
      .map((r) => r.id);

    const roomProductMappings = await this.getTargetForRFCRoomProduct({
      hotelId,
      rfcRoomProductIds: rfcRoomProductIds,
      targetRoomProductTypes: [RoomProductType.MRFC]
    });

    const roomProductMappingMap = groupByToMapSingle(
      roomProductMappings,
      (r) => r.rfcRoomProductId
    );
    const roomProductRatePlanMap = groupByToMapSingle(
      roomProductRatePlans,
      (r) => `${r.roomProductId}-${r.ratePlanId}`
    );

    const result: {
      ratePlanId: string;
      targetRoomProductId: string;
      rfcRoomProductId: string;
    }[] = [];
    for (const ratePlanId of ratePlanIds) {
      for (const rfcRoomProductId of rfcRoomProductIds) {
        const roomProductRatePlanRfc = roomProductRatePlanMap.get(
          `${rfcRoomProductId}-${ratePlanId}`
        );
        if (!roomProductRatePlanRfc) continue;

        const roomProductMapping = roomProductMappingMap.get(rfcRoomProductId);
        if (!roomProductMapping) continue;

        const roomProductRatePlanTarget = roomProductRatePlanMap.get(
          `${roomProductMapping.targetRoomProductId}-${ratePlanId}`
        );
        if (!roomProductRatePlanTarget) continue;

        result.push({
          ratePlanId,
          targetRoomProductId: roomProductMapping.targetRoomProductId,
          rfcRoomProductId: rfcRoomProductId
        });
      }
    }

    return result;
  }

  async getRelatedForERFCRoomProduct(filter: {
    hotelId: string;
    roomProductIds: string[];
  }): Promise<
    {
      targetRoomProductId: string;
      rfcRoomProductIds: string[];
    }[]
  > {
    try {
      const { hotelId, roomProductIds } = filter;
      // Get assigned units for the room product
      const assignedUnits = await this.roomProductRepository.findAssignedUnits(
        {
          roomProductIds
        },
        { roomProductId: true, roomUnitId: true }
      );

      if (assignedUnits.length === 0) {
        return [];
      }

      const unitIds = assignedUnits.map((unit) => unit.roomUnitId);

      // Get related assigned units
      let relatedAssignedUnits = await this.roomProductRepository.findAssignedUnits(
        {
          roomUnitIds: unitIds,
          roomProductTypes: [RoomProductType.RFC],
          roomProductStatus: [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT]
        },
        { roomProductId: true, roomUnitId: true }
      );

      const assignedUnitMapByRoomProductId = groupByToMap(
        assignedUnits,
        (unit) => unit.roomProductId
      );
      const relatedAssignedUnitMapByRoomUnitId = groupByToMap(
        relatedAssignedUnits,
        (unit) => unit.roomUnitId
      );

      const results: {
        targetRoomProductId: string;
        rfcRoomProductIds: string[];
      }[] = [];

      for (const roomProductId of roomProductIds) {
        const findRelatedAssignedUnits = assignedUnitMapByRoomProductId.get(roomProductId) || [];
        const findUnitIds = findRelatedAssignedUnits.map((unit) => unit.roomUnitId);

        const findRFCRoomProductIds = findUnitIds
          .map((unitId) => relatedAssignedUnitMapByRoomUnitId.get(unitId) || [])
          .flat()
          .map((unit) => unit.roomProductId)
          .filter((item) => item !== roomProductId);

        results.push({
          targetRoomProductId: roomProductId,
          rfcRoomProductIds: findRFCRoomProductIds
        });
      }

      return results;
    } catch (error) {
      this.logger.error(`Error fetching related room product IDs: ${error.message}`);
      return [];
    }
  }

  async getRoomProductPricingMethodDetails(input: {
    hotelId: string;
    roomProductIds: string[];
    ratePlanIds: string[];
  }) {
    const { hotelId, roomProductIds, ratePlanIds } = input;

    const [pricingMethodDetails, derivedPricingMethodDetails] = await Promise.all([
      this.roomProductRatePlanRepository.findRoomProductPricingMethodDetail({
        hotelId,
        roomProductIds,
        ratePlanIds,
        ratePlanStatusList: [RatePlanStatusEnum.ACTIVE],
        roomProductStatusList: [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT]
      }),
      this.roomProductRatePlanRepository.findRoomProductPricingMethodDetail({
        hotelId,
        roomProductIds,
        pricingMethods: [RoomProductPricingMethodEnum.DERIVED],
        targetRatePlanIds: ratePlanIds,
        ratePlanStatusList: [RatePlanStatusEnum.ACTIVE],
        roomProductStatusList: [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT]
      })
    ]);

    return [...pricingMethodDetails, ...derivedPricingMethodDetails];
  }

  //   calculateERFCDailyAveragePricing(input: {
  //     erfcRoomProductId: string;
  //     relatedRoomProductIds: string[];
  //     featureRates: GetDailyOrDefaultFeatureRateResult[];
  //   }

  filterRedundantInput(input: {
    newInputs: CalculateDailyPricingDto[];
    data: Partial<RoomProductDailySellingPrice>[];
  }) {
    const { newInputs, data } = input;

    const dataMap = groupByToMapSingle(
      data,
      (item) => `${item.roomProductId}_${item.ratePlanId}_${item.date}`
    );

    const filtered = newInputs.filter((newInput) => {
      const currentInput = dataMap.get(
        `${newInput.roomProductId}_${newInput.ratePlanId}_${newInput.date}`
      );
      if (!currentInput) {
        // not found in currentInputs → always new
        return true;
      }

      const newBasePrice = new Decimal(newInput.featureBasedRate ?? 0).plus(
        newInput.adjustmentRate ?? 0
      );
      const currentBasePrice = new Decimal(currentInput.basePrice ?? 0).plus(
        currentInput.ratePlanAdjustments ?? 0
      );

      return newBasePrice.toNumber() !== currentBasePrice.toNumber();
    });

    // const filtered = data.filter((newInput) => {
    //   const key = `${newInput.roomProductId}_${newInput.ratePlanId}_${newInput.date}`;

    //   const currentInput = currentInputs[key];
    //   if (!currentInput) {
    //     // not found in currentInputs → always new
    //     return true;
    //   }

    //   const newBasePrice = newInput.basePrice ?? 0;
    //   const currentBasePrice = currentInput.basePrice ?? 0;

    //   const basePriceChanged = newBasePrice !== currentBasePrice;

    //   return basePriceChanged;
    // });

    return filtered || [];
  }

  categorizePricingMethods(
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[],
    roomProductMap: Map<string, RoomProduct>
  ) {
    const featureBasedPricing: RoomProductPricingMethodDetail[] = [];
    const linkedPricing: RoomProductPricingMethodDetail[] = [];
    const derivedPricing: RoomProductPricingMethodDetail[] = [];
    const reversedPricing: RoomProductPricingMethodDetail[] = [];
    const rfcCombinedPricing: RoomProductPricingMethodDetail[] = [];
    const rfcAveragePricing: RoomProductPricingMethodDetail[] = [];
    const erfcCombinedPricing: RoomProductPricingMethodDetail[] = [];
    const erfcAveragePricing: RoomProductPricingMethodDetail[] = [];
    const pmsPricing: RoomProductPricingMethodDetail[] = [];

    for (const detail of roomProductPricingMethodDetails) {
      const roomProduct = roomProductMap.get(detail.roomProductId);
      if (!roomProduct) continue;

      const { type, basePriceMode } = roomProduct;
      const { pricingMethod } = detail;

      // Handle common pricing methods for all types
      if (pricingMethod === RoomProductPricingMethodEnum.LINK) {
        linkedPricing.push(detail);
        continue;
      }

      if (pricingMethod === RoomProductPricingMethodEnum.DERIVED) {
        derivedPricing.push(detail);
        continue;
      }

      // Handle type-specific pricing methods
      if (type === RoomProductType.RFC) {
        if (pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING) {
          pmsPricing.push(detail);
        } else if (pricingMethod === RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING) {
          featureBasedPricing.push(detail);
        }
      } else if (type === RoomProductType.MRFC) {
        if (pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING) {
          reversedPricing.push(detail);
          // Note: Don't push to pmsPricing to avoid duplicate processing
          // pmsPricing.push(detail);
        } else if (pricingMethod === RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING) {
          this.categorizeByBasePriceMode(
            detail,
            basePriceMode,
            featureBasedPricing,
            rfcAveragePricing,
            rfcCombinedPricing
          );
        }
      } else if (type === RoomProductType.ERFC) {
        if (pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING) {
          pmsPricing.push(detail);
        } else if (pricingMethod === RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING) {
          this.categorizeByBasePriceMode(
            detail,
            basePriceMode,
            featureBasedPricing,
            erfcAveragePricing,
            erfcCombinedPricing
          );
        }
      }
    }

    return {
      featureBasedPricing,
      linkedPricing,
      derivedPricing,
      reversedPricing,
      rfcCombinedPricing,
      rfcAveragePricing,
      erfcCombinedPricing,
      erfcAveragePricing,
      pmsPricing
    };
  }

  categorizeByBasePriceMode(
    detail: RoomProductPricingMethodDetail,
    basePriceMode: BasePriceMode,
    featureBasedPricing: RoomProductPricingMethodDetail[],
    averagePricing: RoomProductPricingMethodDetail[],
    combinedPricing: RoomProductPricingMethodDetail[]
  ) {
    if (basePriceMode === BasePriceMode.FEATURE_BASED) {
      featureBasedPricing.push(detail);
    } else if (basePriceMode === BasePriceMode.AVERAGE) {
      averagePricing.push(detail);
    } else if (basePriceMode === BasePriceMode.COMBINED) {
      combinedPricing.push(detail);
    }
  }
}
