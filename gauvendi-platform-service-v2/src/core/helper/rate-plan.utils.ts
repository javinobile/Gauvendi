import { addYears, eachDayOfInterval, format, subYears } from 'date-fns';
import Decimal from 'decimal.js';
import { GetDailyOrDefaultFeatureRateByProductResult } from '../../modules/feature-pricing/feature-pricing.service';
import { RoomProductDailyAvailability } from '../entities/availability-entities/room-product-daily-availability.entity';
import { HotelAmenity } from '../entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from '../entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '../entities/hotel-entities/hotel.entity';
import { RatePlanDailyAdjustment } from '../entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanExtraService } from '../entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '../entities/pricing-entities/rate-plan.entity';
import { RoomProductBasePriceSetting } from '../entities/room-product-base-price-setting.entity';
import { RoomProductDailySellingPrice } from '../entities/room-product-daily-selling-price.entity';
import { RoomProductExtraOccupancyRate } from '../entities/room-product-extra-occupancy-rate.entity';
import { RoomProductExtra } from '../entities/room-product-extra.entity';
import { RoomProductMapping } from '../entities/room-product-mapping.entity';
import { RoomProductPricingMethodDetail } from '../entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '../entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '../entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '../entities/room-product-retail-feature.entity';
import { RoomProduct } from '../entities/room-product.entity';
import { RoomUnit } from '../entities/room-unit.entity';
import {
  ConfiguratorTypeEnum,
  RatePlanAdjustmentType,
  RatePlanExtraServiceType,
  RatePlanPricingMethodologyEnum,
  RoomProductBasePriceSettingModeEnum,
  RoomProductExtraType,
  RoomProductPricingMethodAdjustmentUnitEnum,
  RoomProductPricingMethodEnum,
  RoomProductType,
  RoundingModeEnum,
  ServiceTypeEnum,
  TaxSettingEnum
} from '../enums/common';
import {
  HotelAmenityPriceCalculatedDto,
  PricingCalculateResult
} from '../modules/pricing-calculate/pricing-calculate.service';
import { groupByToMap, groupByToMapSingle } from '../utils/group-by.util';
import { DecimalRoundingHelper } from './decimal-rounding.helper';
// DTOs cần thiết
export interface AmentitiesPricesCalculated {
  roomProductDailySellingPriceId: string;
  hotelAmenityPrices: HotelAmenity[];
}
export interface ExtraOccupancyRate {
  extraPeople: number; // Số người thêm (1, 2, 3, ...)
  extraRate: number; // Phí thêm cho mỗi người
}

export interface DailyExtraOccupancyRate {
  rfcRatePlanId: string;
  date: string;
  extraOccupancyRateList: ExtraOccupancyRate[];
}

export interface DailySellingRate {
  ratePlanId: string;
  rfcRatePlanId: string;
  date: string; // YYYY-MM-DD
  isDerived: boolean;

  // Giá cơ sở
  originalSellingRate: number; // Giá gốc (base price)
  originalTotalSellingRate: number; // Tổng giá gốc (base + feature adjustment)

  // Điều chỉnh
  featureAdjustmentRate: number; // Điều chỉnh từ features
  ratePlanAdjustmentRate: number; // Điều chỉnh từ rate plan
  salesPlanAdjustmentValue: number; // Giá trị điều chỉnh
  salesPlanAdjustmentUnit: string; // Đơn vị điều chỉnh (PERCENTAGE/FIXED)

  // Phí thêm
  doubleOccupancyRate: number; // Phí cho 2 người
  extraOccupancySurchargeAmount: number; // Tổng phí thêm occupancy

  // Giá cuối cùng
  sellingRate: number; // Giá bán cuối cùng

  // Metadata
  isAdjusted: boolean; // Có được điều chỉnh không
  rateBeforeAdjustment: number; // Giá trước điều chỉnh
  rateAfterAdjustment: number; // Giá sau điều chỉnh
  adjustmentPercentage: number; // Phần trăm điều chỉnh

  // Automated pricing
  // automatedPricingDataList?: AutomatedPricingData[];
  // correlatedRateList?: AutomatedPricingData[];
  automatedPricingDataList?: any[];
  correlatedRateList?: any[];
}

export class RatePlanUtils {
  public static calculateIsPmsReversedRoomProduct(
    roomProductId: string,
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[],
    roomProductMappings: RoomProductMapping[],
    roomProductRatePlans: RoomProductRatePlan[]
  ): boolean {
    // STEP 1: Check if PMS pricing method is used
    const pricingMethodDetail = roomProductPricingMethodDetails.find(
      (detail) =>
        detail.roomProductId === roomProductId &&
        detail.pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING
    );

    if (!pricingMethodDetail) {
      return false; // Not PMS pricing
    }

    // STEP 2: Find mapping relationships
    const mappings = roomProductMappings.filter(
      (mapping) => mapping.relatedRoomProductId === roomProductId
    );

    // STEP 3: Check if the mapped room products have valid PMS pricing method
    const validMappings = roomProductMappings.filter((roomProductMapping) => {
      const relatedPricingMethod = roomProductPricingMethodDetails.find(
        (detail) =>
          detail.roomProductId === roomProductMapping.relatedRoomProductId &&
          roomProductRatePlans.some((rprp) =>
            mappings.some((mapping) => mapping.roomProductId === rprp.roomProductId)
          ) &&
          detail.pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING
      );
      return !!relatedPricingMethod;
    });

    // STEP 4: If at least one valid mapping exists → it is reversed
    return validMappings.length > 0;
  }

  /**
   * Tính toán daily extra occupancy rate list cho một room product rate plan
   */
  public static calculateDailyExtraOccupancyRateList(
    roomProductRatePlanId: string,
    dates: string[],
    baseExtraOccupancyRates: RoomProductExtraOccupancyRate[],
    dailyAdjustments: RoomProductRatePlanExtraOccupancyRateAdjustment[]
  ): DailyExtraOccupancyRate[] {
    return dates.map((date) => {
      // Lấy adjustments cho ngày này
      const adjustmentsForDate = dailyAdjustments.filter((adj) => adj.date === date);

      // Tạo map từ adjustments
      const adjustmentMap = new Map<number, number>();
      adjustmentsForDate.forEach((adj) => {
        adjustmentMap.set(adj.extraPeople, Number(adj.extraRate));
      });

      // Tạo extra occupancy rate list
      const extraOccupancyRateList: ExtraOccupancyRate[] = [];

      // Thêm các rates từ base rates
      baseExtraOccupancyRates.forEach((baseRate) => {
        const adjustedRate =
          adjustmentMap.get(Number(baseRate.extraPeople)) ?? Number(baseRate.extraRate);
        extraOccupancyRateList.push({
          extraPeople: Number(baseRate.extraPeople),
          extraRate: adjustedRate
        });
      });

      // Thêm các rates chỉ có trong adjustments (không có trong base)
      adjustmentsForDate.forEach((adj) => {
        const existsInBase = baseExtraOccupancyRates.some(
          (base) => base.extraPeople === adj.extraPeople
        );
        if (!existsInBase) {
          extraOccupancyRateList.push({
            extraPeople: adj.extraPeople,
            extraRate: Number(adj.extraRate)
          });
        }
      });

      // Đảm bảo có default rate (extraPeople = 0)
      const hasDefault = extraOccupancyRateList.some((rate) => rate.extraPeople === 0);
      if (!hasDefault) {
        extraOccupancyRateList.push({
          extraPeople: 0,
          extraRate: 0
        });
      }

      // Sắp xếp theo extraPeople
      extraOccupancyRateList.sort((a, b) => a.extraPeople - b.extraPeople);

      return {
        rfcRatePlanId: roomProductRatePlanId,
        date: date,
        extraOccupancyRateList: extraOccupancyRateList
      };
    });
  }

  public static getAutomatePricing(input: {
    roomProductId: string;
    ratePlanId: string;
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[];
    roomProductRatePlan: RoomProductRatePlan;
    roomProductBasePriceSettings: RoomProductBasePriceSetting[];
    relatedRoomProductList?: RoomProduct[];
    targetRoomProductList?: RoomProduct[];
  }): {
    destinationList?: string | null;
    id: string;
    isPush: boolean;
    productBasePricingCalculationMode?: RoomProductBasePriceSettingModeEnum;
    sourceList: string[];
    sourceRoomProductList: RoomProduct[];
    type: RoomProductPricingMethodEnum;
    unit: RoomProductPricingMethodAdjustmentUnitEnum;
    value: string | undefined;
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail;
    correlatedRoomProductList: {
      id: string;
      code: string;
      name: string;
      isCorrelatedProduct: boolean;
    }[];
  } {
    const {
      roomProductId,
      ratePlanId,
      roomProductPricingMethodDetails,
      roomProductRatePlan,
      roomProductBasePriceSettings,
      relatedRoomProductList,
      targetRoomProductList
    } = input;
    const methodDetail = roomProductPricingMethodDetails?.find(
      (i) => i.roomProductId === roomProductId && i.ratePlanId === ratePlanId
    );

    const configuratorSetting = roomProductRatePlan.configuratorSetting;

    const basePriceSetting = roomProductBasePriceSettings?.find(
      (i) => i.roomProductId === roomProductId
    );

    let sourceList: string[] = [];
    let sourceRoomProductList: RoomProduct[] = [];
    if (methodDetail?.pricingMethod !== RoomProductPricingMethodEnum.LINK) {
      sourceList =
        targetRoomProductList && targetRoomProductList.length > 0
          ? targetRoomProductList?.map((item) => `${item.code}-${item.name}`)
          : [];

      sourceRoomProductList = targetRoomProductList ?? [];
    } else if (methodDetail?.pricingMethod === RoomProductPricingMethodEnum.LINK) {
      sourceList =
        methodDetail && methodDetail?.targetRoomProduct
          ? [`${methodDetail?.targetRoomProduct?.code!}-${methodDetail?.targetRoomProduct?.name!}`]
          : [];

      sourceRoomProductList = methodDetail?.targetRoomProduct
        ? [methodDetail?.targetRoomProduct]
        : [];
    }

    return {
      destinationList: null,
      id: methodDetail!.id!,
      isPush: configuratorSetting?.type === ConfiguratorTypeEnum.PUSH_PMS,
      productBasePricingCalculationMode:
        basePriceSetting?.mode ?? RoomProductBasePriceSettingModeEnum.FEATURE_BASED,
      // sourceList: [
      //   `${methodDetail?.targetRoomProduct?.code!}-${methodDetail?.targetRoomProduct?.name!}`
      // ],
      sourceList: sourceList,
      sourceRoomProductList: sourceRoomProductList,
      type: methodDetail?.pricingMethod ?? RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING,
      unit:
        methodDetail?.pricingMethodAdjustmentUnit ??
        RoomProductPricingMethodAdjustmentUnitEnum.FIXED,
      value: methodDetail?.pricingMethodAdjustmentValue?.toString() ?? undefined,
      roomProductPricingMethodDetail: methodDetail!,
      correlatedRoomProductList:
        methodDetail?.pricingMethod !== RoomProductPricingMethodEnum.LINK
          ? relatedRoomProductList && relatedRoomProductList.length > 0
            ? relatedRoomProductList?.map((item) => {
                return {
                  id: item.id,
                  code: item.code,
                  name: item.name,
                  isCorrelatedProduct: true
                };
              })
            : []
          : []
    };
  }

  public static findHotelAmenitiesByType(input: {
    roomProductExtras: RoomProductExtra[];
    ratePlanExtras: RatePlanExtraService[];
    ratePlanIds: string[];
    roomProductIds: string[];
    hotelAmenities: HotelAmenity[];
    type?: RoomProductExtraType | RatePlanExtraServiceType;
  }) {
    const { roomProductExtras, ratePlanExtras, ratePlanIds, roomProductIds, hotelAmenities, type } =
      input;

    let roomProductExtraFiltered = roomProductExtras.filter((r) =>
      roomProductIds.includes(r.roomProductId)
    );

    let ratePlanExtraFiltered = ratePlanExtras.filter((r) => ratePlanIds.includes(r.ratePlanId));

    if (type) {
      roomProductExtraFiltered = roomProductExtraFiltered.filter((r) => r.type === type);
      ratePlanExtraFiltered = ratePlanExtraFiltered.filter((r) => r.type === type);
    }

    const ratePlanExtraIds = ratePlanExtraFiltered.map((r) => r.extrasId);
    const roomProductExtraIds = roomProductExtraFiltered.map((r) => r.extrasId);
    const hotelAmenityIds = [...roomProductExtraIds, ...ratePlanExtraIds];

    return hotelAmenities.filter((h) => hotelAmenityIds.includes(h.id));
  }

  public static flatAndGetPricingBreakdown(pricingData: any[], hotel: Hotel, dates: string[]) {
    // Flatten data structure more efficiently using flat(2)
    const flat = pricingData
      .map((roomProduct) =>
        roomProduct.rfcRatePlanList?.map((ratePlan) =>
          ratePlan.dailySellingRateList?.map((dailySellingRate) => ({
            ...dailySellingRate,
            salesPlanId: ratePlan.id,
            roomProductId: roomProduct.id,
            propertyId: hotel.id
          }))
        )
      )
      ?.flat(2);

    if (!flat || flat.length === 0) {
      return dates?.map((date) => ({ date, lowestPrice: undefined, highestPrice: undefined }));
    }

    // Group by date in a single pass - O(n) instead of O(n*m)
    const groupedByDateMap = new Map<string, any[]>();
    for (const item of flat) {
      if (!item?.date) continue;
      const group = groupedByDateMap.get(item.date);
      if (group) {
        group.push(item);
      } else {
        groupedByDateMap.set(item.date, [item]);
      }
    }

    // Find min/max in a single iteration per date group
    const priceInfoMap = new Map<string, { lowestItem: any; highestItem: any }>();
    for (const [date, group] of groupedByDateMap.entries()) {
      let lowestItem = group[0];
      let highestItem = group[0];

      for (let i = 1; i < group.length; i++) {
        const item = group[i];
        if (item.sellingRate < lowestItem.sellingRate) {
          lowestItem = item;
        }
        if (item.sellingRate > highestItem.sellingRate) {
          highestItem = item;
        }
      }

      priceInfoMap.set(date, { lowestItem, highestItem });
    }

    // Build final result array
    return dates?.map((date) => {
      const priceInfo = priceInfoMap.get(date);
      if (!priceInfo) {
        return { date, lowestPrice: undefined, highestPrice: undefined };
      }

      return {
        date,
        lowestPrice: priceInfo.lowestItem?.sellingRate,
        highestPrice: priceInfo.highestItem?.sellingRate,
        ...priceInfo.lowestItem
      };
    });
  }

  public static flatAndGetPricingBreakdownByRatePlanOnly(
    pricingData: any[],
    hotel: Hotel,
    dates: string[]
  ) {
    // Flatten data structure more efficiently using flat(2)
    const flat = pricingData
      .map((roomProduct) =>
        roomProduct.rfcRatePlanList?.map((roomProductRatePlan) =>
          roomProductRatePlan.dailySellingRateList?.map((dailySellingRate) => ({
            ...dailySellingRate,

            roomProductId: roomProduct.id,
            propertyId: hotel.id
          }))
        )
      )
      ?.flat(2);

    if (!flat || flat.length === 0) {
      return dates?.map((date) => ({ date, lowestPrice: undefined, highestPrice: undefined }));
    }

    // Group by date AND ratePlan in a single pass - O(n) instead of O(n*m)
    const groupedByDateAndRatePlanMap = new Map<string, any[]>();
    for (const item of flat) {
      if (!item?.date || !item?.ratePlanId) continue;
      const groupKey = `${item.date}_${item.ratePlanId}`;
      const group = groupedByDateAndRatePlanMap.get(groupKey);
      if (group) {
        group.push(item);
      } else {
        groupedByDateAndRatePlanMap.set(groupKey, [item]);
      }
    }

    // Find min/max in a single iteration per date+ratePlan group
    const priceInfoMap = new Map<string, { lowestItem: any; highestItem: any }>();
    for (const [groupKey, group] of groupedByDateAndRatePlanMap.entries()) {
      let lowestItem = group[0];
      let highestItem = group[0];

      for (let i = 1; i < group.length; i++) {
        const item = group[i];
        if (item.sellingRate < lowestItem.sellingRate) {
          lowestItem = item;
        }
        if (item.sellingRate > highestItem.sellingRate) {
          highestItem = item;
        }
      }

      priceInfoMap.set(groupKey, { lowestItem, highestItem });
    }

    // Build final result array grouped by date and ratePlan
    const result: any[] = [];

    for (const date of dates) {
      // Find all rate plans for this date
      const ratePlansForDate = new Set<string>();
      for (const [groupKey] of priceInfoMap.entries()) {
        if (groupKey.startsWith(`${date}_`)) {
          const ratePlanId = groupKey.split('_')[1];
          ratePlansForDate.add(ratePlanId);
        }
      }

      // For each rate plan on this date, find min/max
      for (const ratePlanId of ratePlansForDate) {
        const groupKey = `${date}_${ratePlanId}`;
        const priceInfo = priceInfoMap.get(groupKey);

        if (priceInfo) {
          result.push({
            date,
            ratePlanId: ratePlanId,
            basePrice: priceInfo.lowestItem?.basePrice,
            ratePlanAdjustments: priceInfo.lowestItem?.ratePlanAdjustments,
            lowestPrice: priceInfo.lowestItem?.sellingRate,
            highestPrice: priceInfo.highestItem?.sellingRate,
            roomProductId: priceInfo.lowestItem?.roomProductId,
            propertyId: priceInfo.lowestItem?.propertyId
            // Include additional info from lowest price item
          });
        }
      }

      // If no rate plans found for this date, add empty entry
      if (ratePlansForDate.size === 0) {
        result.push({
          date,
          lowestPrice: undefined,
          highestPrice: undefined
        });
      }
    }

    return result;
  }

  /**
   * Alternative method to get pricing breakdown grouped by date only (original behavior)
   * Use this if you want to maintain backward compatibility
   */
  public static flatAndGetPricingBreakdownByDateOnly(
    pricingData: any[],
    hotel: Hotel,
    dates: string[]
  ) {
    const flat = pricingData
      .map((roomProduct) =>
        roomProduct.rfcRatePlanList?.map((roomProductRatePlan) =>
          roomProductRatePlan.dailySellingRateList?.map((dailySellingRate) => ({
            ...dailySellingRate,
            roomProductId: roomProduct.id,
            propertyId: hotel.id
          }))
        )
      )
      ?.flat(2);

    if (!flat || flat.length === 0) {
      return dates?.map((date) => ({ date, lowestPrice: undefined, highestPrice: undefined }));
    }

    // Group by date only
    const groupedByDateMap = new Map<string, any[]>();
    for (const item of flat) {
      if (!item?.date) continue;
      const group = groupedByDateMap.get(item.date);
      if (group) {
        group.push(item);
      } else {
        groupedByDateMap.set(item.date, [item]);
      }
    }

    // Find min/max across all rate plans for each date
    const priceInfoMap = new Map<string, { lowestItem: any; highestItem: any }>();
    for (const [date, group] of groupedByDateMap.entries()) {
      let lowestItem = group[0];
      let highestItem = group[0];

      for (let i = 1; i < group.length; i++) {
        const item = group[i];
        if (item.sellingRate < lowestItem.sellingRate) {
          lowestItem = item;
        }
        if (item.sellingRate > highestItem.sellingRate) {
          highestItem = item;
        }
      }

      priceInfoMap.set(date, { lowestItem, highestItem });
    }

    // Build final result array
    return dates?.map((date) => {
      const priceInfo = priceInfoMap.get(date);
      if (!priceInfo) {
        return { date, lowestPrice: undefined, highestPrice: undefined };
      }

      return {
        date,
        lowestPrice: priceInfo.lowestItem?.sellingRate,
        highestPrice: priceInfo.highestItem?.sellingRate
      };
    });
  }

  /**
   * Get pricing breakdown grouped by rate plan only (across all dates)
   */
  // public static flatAndGetPricingBreakdownByRatePlanOnly(
  //   pricingData: any[],
  //   hotel: Hotel,
  //   dates: string[]
  // ) {
  //   const flat = pricingData
  //     .map((roomProduct) =>
  //       roomProduct.rfcRatePlanList?.map((roomProductRatePlan) =>
  //         roomProductRatePlan.dailySellingRateList?.map((dailySellingRate) => ({
  //           ...dailySellingRate,
  //           roomProductId: roomProduct.id,
  //           propertyId: hotel.id
  //         }))
  //       )
  //     )
  //     ?.flat(2);

  //   if (!flat || flat.length === 0) {
  //     return [];
  //   }

  //   // Group by rate plan only
  //   const groupedByRatePlanMap = new Map<string, any[]>();
  //   for (const item of flat) {
  //     if (!item?.ratePlanId) continue;
  //     const group = groupedByRatePlanMap.get(item.ratePlanId);
  //     if (group) {
  //       group.push(item);
  //     } else {
  //       groupedByRatePlanMap.set(item.ratePlanId, [item]);
  //     }
  //   }

  //   // Find min/max across all dates for each rate plan
  //   const result: any[] = [];
  //   for (const [ratePlanId, group] of groupedByRatePlanMap.entries()) {
  //     let lowestItem = group[0];
  //     let highestItem = group[0];

  //     for (let i = 1; i < group.length; i++) {
  //       const item = group[i];
  //       if (item.sellingRate < lowestItem.sellingRate) {
  //         lowestItem = item;
  //       }
  //       if (item.sellingRate > highestItem.sellingRate) {
  //         highestItem = item;
  //       }
  //     }

  //     result.push({
  //       ratePlanId: ratePlanId,
  //       lowestPrice: lowestItem?.sellingRate,
  //       highestPrice: highestItem?.sellingRate,
  //       roomProductId: lowestItem?.roomProductId,
  //       propertyId: lowestItem?.propertyId
  //       // Include additional info from lowest price item
  //     });
  //   }

  //   return result;
  // }

  public static recalculateAdjustmentRate(
    value: number,
    type: 'FIXED' | 'PERCENTAGE',
    price: number
  ) {
    // 263 - (263 * 5 / 100)
    if (type === 'FIXED') {
      return price - value;
    } else {
      // Reverse percentage adjustment
      // adjusted = original + (original * value / 100)
      // original = adjusted / (1 + value/100)
      return price / (1 + value / 100);
    }
  }

  public static calculateRatePlanAdjustmentRate(
    ratePlanAdjustment: RatePlanDailyAdjustment | undefined,
    price: number
  ) {
    if (!ratePlanAdjustment || isNaN(Number(ratePlanAdjustment.adjustmentValue))) {
      return 0;
    }
    const value = Number(ratePlanAdjustment.adjustmentValue);
    return ratePlanAdjustment.adjustmentType === RatePlanAdjustmentType.FIXED
      ? value
      : (value / 100) * price;
  }

  public static mappingRoomProductDailyRateDetails(input: {
    hotel: Hotel;
    roomProduct: RoomProduct;
    roomUnits: RoomUnit[];
    rateplans: RatePlan[];
    roomProductBasePriceSettings: RoomProductBasePriceSetting[];
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[];
    roomProductRatePlans: RoomProductRatePlan[];
    roomProductMappings: RoomProductMapping[];
    roomProductRetailFeatures: RoomProductRetailFeature[];
    featureDailyRates: GetDailyOrDefaultFeatureRateByProductResult[];
    roomProductDailySellingPrices: RoomProductDailySellingPrice[];
    relatedRoomProductDailySellingPrices: RoomProductDailySellingPrice[];
    relatedRoomProductDailyAvailabilities: RoomProductDailyAvailability[];
    ratePlanDailyAdjustments: RatePlanDailyAdjustment[];
    calculated: PricingCalculateResult;
    hotelTaxSettings: HotelTaxSetting[];
    decimalUnits?: number;
    relatedRoomProductList?: RoomProduct[];
  }) {
    const {
      hotel,
      roomProduct,
      roomUnits,
      rateplans,
      roomProductBasePriceSettings,
      roomProductPricingMethodDetails,
      roomProductRatePlans,
      roomProductMappings,
      roomProductRetailFeatures,
      featureDailyRates,
      roomProductDailySellingPrices,
      relatedRoomProductDailySellingPrices,
      ratePlanDailyAdjustments,
      calculated,
      hotelTaxSettings,
      decimalUnits = 2,
      relatedRoomProductList,
      relatedRoomProductDailyAvailabilities
    } = input;
    const relatedRoomProductDailySellingPricesMap = groupByToMap(
      relatedRoomProductDailySellingPrices,
      (item) => `${item.date}`
    );
    const { id, name, code, capacityDefault, capacityExtra, type, distributionChannel } =
      roomProduct;
    const isPmsReversedRoomProduct = RatePlanUtils.calculateIsPmsReversedRoomProduct(
      roomProduct.id,
      roomProductPricingMethodDetails,
      roomProductMappings,
      roomProductRatePlans
    );

    const featureDailyRatesMap = groupByToMap(featureDailyRates, (item) => `${item.featureId}`);
    const roomProductRetailFeatureMap = groupByToMapSingle(
      roomProductRetailFeatures,
      (item) => `${item.retailFeatureId}`
    );

    const relatedRoomProductDailyAvailabilitiesMap = groupByToMapSingle(
      relatedRoomProductDailyAvailabilities,
      (item) => `${item.roomProductId}_${item.date}`
    );

    return {
      id,
      name,
      code,
      capacityDefault,
      capacityExtra,
      type,
      distributionChannelList: distributionChannel || [],
      roomList: roomUnits.map((roomUnit) => ({
        id: roomUnit.id,
        roomNumber: roomUnit.roomNumber
      })),
      featureList: roomProductPricingMethodDetails.some(
        (item) => item.pricingMethod === RoomProductPricingMethodEnum.LINK
      )
        ? []
        : roomProductRetailFeatures?.map((i) => {
            const roomProductRetailFeature = roomProductRetailFeatureMap.get(i.retailFeatureId);
            const featureDailyRates = (featureDailyRatesMap.get(i.retailFeature.id) || []).map(
              (j) => ({
                date: j.date,
                originalSellingRate: roomProductRetailFeature?.retailFeature.baseRate,

                sellingRate: j.featureRate,
                quantity: j.quantity
              })
            );
            return {
              id: i.retailFeature.id,
              name: i.retailFeature.name,
              code: i.retailFeature.code,
              baseRate: i.retailFeature.baseRate,
              quantity: i.quantity,
              dailySellingRateList: featureDailyRates
            };
          }),
      rfcRatePlanList: rateplans?.map((rateplan) => {
        const { id, name, code } = rateplan;
        const roomProductRatePlan = roomProductRatePlans?.find(
          (roomProductRatePlan) =>
            roomProductRatePlan.ratePlanId === rateplan.id &&
            roomProductRatePlan.roomProductId === roomProduct.id
        );

        const automatePricing = RatePlanUtils.getAutomatePricing({
          roomProductId: roomProduct.id,
          ratePlanId: rateplan.id,
          roomProductPricingMethodDetails,
          roomProductRatePlan: roomProductRatePlan!,
          targetRoomProductList: roomProductMappings
            .filter((item) => item.roomProductId !== roomProduct.id)
            .map((item) => item.roomProduct),
          roomProductBasePriceSettings: roomProductBasePriceSettings,
          relatedRoomProductList: relatedRoomProductList
        });

        return {
          id,
          name,
          code,
          totalBaseRate: roomProductRatePlan?.totalBaseRate,
          isPmsReversedRoomProduct,
          isAutomatePricing: true,
          automatePricing: automatePricing,

          dailySellingRateList: roomProductDailySellingPrices.map(
            (roomProductDailySellingPrice) => {
              const {
                id,
                date,
                basePrice,
                featureAdjustments,
                ratePlanAdjustments,
                grossPrice,
                netPrice
              } = roomProductDailySellingPrice;
              const dailySellingRateCalculated = calculated?.roomProductDailySellingPrices?.find(
                (i) => i.id === roomProductDailySellingPrice.id
              );

              const extraOccupancySurchargePrices =
                calculated?.occupancySurcharges?.filter(
                  (i) =>
                    i.date === roomProductDailySellingPrice.date &&
                    i.roomProductId === roomProductDailySellingPrice.roomProductId &&
                    i.ratePlanId === roomProductDailySellingPrice.ratePlanId
                ) || [];

              const extraOccupancySurchargeAmount =
                extraOccupancySurchargePrices?.reduce(
                  (acc, curr) => acc + (curr.extraOccupancySurcharge ?? 0),
                  0
                ) || 0;

              const includedExtraServicesBreakdownWithTaxCalculated =
                dailySellingRateCalculated?.hotelAmenityPrices?.map((j) => ({
                  ...j,
                  id: j.id,
                  name: j.name,
                  code: j.code,
                  amenityPricingUnit: j.pricingUnit,
                  amount:
                    hotel.taxSetting === TaxSettingEnum.INCLUSIVE
                      ? j.totalGrossAmount
                      : Number(j.totalBaseAmount)
                }));
              const includedExtraServicesRate =
                includedExtraServicesBreakdownWithTaxCalculated?.reduce(
                  (acc, curr) => acc + Number(curr.amount),
                  0
                ) || 0;
              const ratePlanDailyAdjustment = ratePlanDailyAdjustments?.find(
                (i) =>
                  i.date === roomProductDailySellingPrice.date &&
                  i.ratePlanId === roomProductDailySellingPrice.ratePlanId
              );

              const recalculatedAdjustmentRate = RatePlanUtils.recalculateAdjustmentRate(
                automatePricing.value ? Number(automatePricing.value) : 0,
                automatePricing.unit,
                basePrice
              );

              const adjustment = ratePlanDailyAdjustment?.adjustmentValue
                ? Number(ratePlanDailyAdjustment.adjustmentValue)
                : 0;

              const sellingRateNoRounding =
                (grossPrice || 0) + includedExtraServicesRate + extraOccupancySurchargeAmount;
              const sellingRate =
                (grossPrice || 0) + includedExtraServicesRate + extraOccupancySurchargeAmount;

              const roundedSellingRate = DecimalRoundingHelper.conditionalRounding(
                sellingRateNoRounding,
                rateplan.roundingMode as RoundingModeEnum,
                decimalUnits
              );

              const roundingGap = new Decimal(sellingRate).minus(roundedSellingRate).toNumber();

              const findRelatedRoomProductDailySellingPrices =
                relatedRoomProductDailySellingPricesMap.get(
                  `${roomProductDailySellingPrice.date}`
                ) || [];

              let masterBaseRate = 0;
              let masterRoomProductId: string | undefined = undefined;
              if (
                roomProduct.type === RoomProductType.RFC &&
                findRelatedRoomProductDailySellingPrices.length > 0
              ) {
                masterBaseRate = findRelatedRoomProductDailySellingPrices[0].grossPrice;
                masterRoomProductId = findRelatedRoomProductDailySellingPrices[0].roomProductId;
              }

              return {
                id,
                date,
                basePrice,
                featureAdjustments,
                ratePlanAdjustments,
                grossPrice,
                netPrice,

                // mapping fields
                adjustedProductBasedPrice:
                  hotel.taxSetting === TaxSettingEnum.INCLUSIVE
                    ? grossPrice + extraOccupancySurchargeAmount
                    : netPrice + extraOccupancySurchargeAmount,
                ratePlanAdjustmentRate: ratePlanAdjustments,
                includedExtraServicesRate: includedExtraServicesRate,
                includedServicesSellingPrice: includedExtraServicesRate,
                sellingRate: sellingRate, // alway add includedExtraServicesRate

                originalSellingRate: basePrice,
                productBasedPrice: basePrice, // not using in FE
                isDerived:
                  rateplan.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING,
                featureAdjustmentRate: null, // hardcode null for now
                salesPlanAdjustmentValue: ratePlanDailyAdjustment?.adjustmentValue,
                salesPlanAdjustmentUnit: ratePlanDailyAdjustment?.adjustmentType,
                doubleOccupancyRate: dailySellingRateCalculated?.occupancySurcharge,
                roundingGap: roundingGap,
                automatedPricingDataList: [
                  {
                    roomProductId:
                      masterRoomProductId || roomProductDailySellingPrice.roomProductId,
                    automatedRate: basePrice,
                    masterBaseRate: masterBaseRate,
                    adjustmentRate: basePrice - recalculatedAdjustmentRate
                  }
                ],
                correlatedRateList: findRelatedRoomProductDailySellingPrices.map((item) => {
                  const findRelatedRoomProductDailyAvailability =
                    relatedRoomProductDailyAvailabilitiesMap.get(
                      `${item.roomProductId}_${item.date}`
                    );
                  const isSoldOut = findRelatedRoomProductDailyAvailability?.available === 0;
                  return {
                    roomProductId: item.roomProductId,
                    correlatedRate: item.grossPrice - (item.ratePlanAdjustments || 0),
                    isSoldOut: isSoldOut
                  };
                }),
                includedExtraServicesBreakdown: includedExtraServicesBreakdownWithTaxCalculated,
                cityTaxBreakdown: dailySellingRateCalculated?.cityTaxBreakdowns,
                propertyTaxBreakdown: this.mappingPropertyTaxBreakdown(
                  hotelTaxSettings,
                  rateplans,
                  roomProductDailySellingPrice,
                  dailySellingRateCalculated!.hotelAmenityPrices || []
                )
              };
            }
          )
        };
      })
    };
  }

  public static mappingPropertyTaxBreakdown(
    hotelTaxSettings: HotelTaxSetting[],
    ratePlans: RatePlan[],
    roomProductDailySellingPrice: RoomProductDailySellingPrice,
    hotelAmenityPrices: HotelAmenityPriceCalculatedDto[]
  ) {
    let hotelTaxSettingsExtras = hotelTaxSettings
      ?.filter((i) => i.serviceType === ServiceTypeEnum.EXTRAS)
      .map((i) => i.hotelTax);
    // remove duplicate hotelTaxSettingsExtras
    const hotelTaxSettingsExtrasUnique = hotelTaxSettingsExtras
      ?.filter((item, index, self) => index === self.findIndex((t) => t?.code === item?.code))
      ?.filter((i) => !!i);
    hotelTaxSettingsExtras = hotelTaxSettingsExtrasUnique;
    let hotelTaxSettingsAccommodation = hotelTaxSettings
      ?.filter(
        (i) =>
          i.serviceType === ServiceTypeEnum.ACCOMMODATION &&
          !!ratePlans?.map((j) => j?.code).includes(i.serviceCode)
      )
      .map((i) => i.hotelTax);
    const hotelTaxSettingsAccommodationUnique = hotelTaxSettingsAccommodation
      ?.filter((item, index, self) => index === self.findIndex((t) => t?.code === item?.code))
      ?.filter((i) => !!i);
    hotelTaxSettingsAccommodation = hotelTaxSettingsAccommodationUnique;

    return [
      ...(hotelTaxSettingsAccommodation || [])
        ?.filter((hotelTax) => {
          if (!hotelTax.validFrom && !hotelTax.validTo) {
            return true;
          }
          const validDates =
            eachDayOfInterval({
              start: new Date(hotelTax.validFrom || subYears(new Date(), 2)),
              end: new Date(hotelTax.validTo || addYears(new Date(), 2))
            }).map((j) => format(j, 'yyyy-MM-dd')) || [];
          if (validDates.includes(roomProductDailySellingPrice.date)) {
            return true;
          }
          return false;
        })
        ?.map((hotelTax) => ({
          id: hotelTax.id,
          code: hotelTax.code,
          name: hotelTax.name,
          amount: hotelTax.rate * roomProductDailySellingPrice.basePrice
        })),
      ...(hotelTaxSettingsExtras || [])
        .filter(
          (taxExtras) =>
            !!hotelAmenityPrices?.find(
              (item) =>
                item.includedDates?.includes(roomProductDailySellingPrice.date) &&
                Object.keys(item.taxDetailsMap || {}).includes(taxExtras.code)
            )
        )
        .map((taxExtras, index, array) => {
          const totalAmentitiesTaxAmount =
            hotelAmenityPrices?.reduce(
              (acc, curr) =>
                acc +
                (curr.includedDates?.includes(roomProductDailySellingPrice.date)
                  ? Number(curr.taxDetailsMap?.[taxExtras.code] || 0)
                  : 0),
              0
            ) || 0;
          return {
            id: taxExtras.id,
            code: taxExtras.code,
            name: taxExtras.name,
            amount: totalAmentitiesTaxAmount
          };
        })
    ];
  }

  public static mappingDailySellingRateList(
    roomProduct: RoomProduct,
    roomUnits: RoomUnit[],
    rateplans: RatePlan[],
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[],
    roomProductRatePlans: RoomProductRatePlan[],
    roomProductMappings: RoomProductMapping[]
  ) {
    const { id, name, code, capacityDefault, capacityExtra, type, distributionChannel } =
      roomProduct;
    const isPmsReversedRoomProduct = RatePlanUtils.calculateIsPmsReversedRoomProduct(
      roomProduct.id,
      roomProductPricingMethodDetails,
      roomProductMappings,
      roomProductRatePlans
    );
    return {
      id,
      name,
      code,
      capacityDefault,
      capacityExtra,
      type,
      distributionChannelList: distributionChannel || [],
      roomList: roomUnits.map((roomUnit) => ({
        id: roomUnit.id,
        roomNumber: roomUnit.roomNumber
      })),
      featureList: [],
      rfcRatePlanList: rateplans?.map((rateplan) => {
        const { id, name, code } = rateplan;
        const roomProductRatePlan = roomProductRatePlans?.find(
          (roomProductRatePlan) =>
            roomProductRatePlan.ratePlanId === rateplan.id &&
            roomProductRatePlan.roomProductId === roomProduct.id
        );
        return {
          id,
          name,
          code,
          totalBaseRate: roomProductRatePlan?.totalBaseRate,
          isPmsReversedRoomProduct,
          isAutomatePricing: true,
          automatePricing: RatePlanUtils.getAutomatePricing({
            roomProductId: roomProduct.id,
            ratePlanId: rateplan.id,
            roomProductPricingMethodDetails,
            roomProductRatePlan: roomProductRatePlan!,
            roomProductBasePriceSettings: roomProduct.roomProductBasePriceSettings
          }),
          dailySellingRateList: []
        };
      })
    };
  }
}
