import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  RoomProductPricingMethodEnum,
  RoomProductType,
  RoundingModeEnum
} from '@src/core/enums/common';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { Helper } from '@src/core/helper/utils';
import { RatePlanAdjustmentService } from '@src/core/modules/pricing-calculate/rate-plan-adjustment/rate-plan-adjustment.service';
import { CalculateAttributeBasedLogicService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-attribute-based-logic.service';
import { CalculateAveragePricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-average-pricing.service';
import { CalculateFeatureBasePricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-feature-base-pricing.service';
import { CalculateReversedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-reversed-pricing.service';
import {
  CalculateDailyPricingDto,
  RoomProductPricingService
} from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.service';
import { groupByToMap } from '@src/core/utils/group-by.util';
import { FeaturePricingService } from '@src/modules/feature-pricing/feature-pricing.service';
import { HotelService } from '@src/modules/hotel/services/hotel.service';
import { In, Repository } from 'typeorm';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan.repository';
import { PricingDataSourceEnum } from '../room-product-selling-price/room-product-selling-price.dto';
import { RoomProductSellingPriceService } from '../room-product-selling-price/room-product-selling-price.service';
import { RoomProductPricingUtils } from './room-product-pricing.utils';

@Injectable()
export class ReversedProductService {
  private readonly logger = new Logger(ReversedProductService.name);
  constructor(
    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,

    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly roomProductSellingPriceService: RoomProductSellingPriceService,
    private readonly roomProductPricingService: RoomProductPricingService,

    @Inject(forwardRef(() => FeaturePricingService))
    private readonly featurePricingService: FeaturePricingService,
    private readonly ratePlanAdjustmentService: RatePlanAdjustmentService,
    private readonly hotelService: HotelService,
    private readonly calculateFeatureBasePricingService: CalculateFeatureBasePricingService,

    private readonly calculateAveragePricingService: CalculateAveragePricingService,
    private readonly calculateReversedPricingService: CalculateReversedPricingService,
    private readonly calculateAttributeBasedLogicService: CalculateAttributeBasedLogicService
  ) {}

  onModuleInit() {}

  async bulkReversedProduct(hotelId: string, fromDate: string, toDate: string) {
    const roomProductMethodDetails = await this.roomProductPricingMethodDetailRepository.find({
      where: { hotelId, pricingMethod: RoomProductPricingMethodEnum.PMS_PRICING }
    });

    if (roomProductMethodDetails.length === 0) {
      this.logger.debug(
        `No room product method details found for hotel ${hotelId}, dates ${fromDate} to ${toDate}`
      );
      return;
    }

    // for(const methodDetail of roomProductMethodDetails) {
    //   await this.reversedProductV2(methodDetail, fromDate, toDate);
    // }

    const reversedPricingResults = await Promise.all(
      roomProductMethodDetails.map((methodDetail) =>
        this.reversedProductV2(methodDetail, fromDate, toDate)
      )
    );

    await this.roomProductSellingPriceService.calculateAfterRFCPricingChange({
      hotelId,
      reversedPricingResults: reversedPricingResults.filter((result) => result !== undefined),
      fromDate,
      toDate,
      roomProductTypes: [RoomProductType.ERFC]
    });

    return true;
  }

  async reversedProductV2(
    methodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string
  ) {
    try {
      const { hotelId, roomProductId, ratePlanId: currentRatePlanId } = methodDetail;

      if (methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING) {
        return {
          ratePlanId: currentRatePlanId,
          relatedRoomProductIds: []
        };
      }

      const dates = Helper.generateDateRange(fromDate, toDate);

      const [ratePlan, roomProduct] = await Promise.all([
        this.ratePlanRepository.findOne({
          where: {
            hotelId,
            id: currentRatePlanId
          },
          select: {
            id: true,
            code: true,
            roundingMode: true,
            rfcAttributeMode: true,
            mrfcPositioningMode: true
          }
        }),
        this.roomProductRepository.findOne({
          where: {
            id: roomProductId
          },
          select: ['id', 'type']
        })
      ]);

      if (!roomProduct) {
        this.logger.warn(`Room product not found for id ${roomProductId}`);
        return {
          ratePlanId: currentRatePlanId,
          relatedRoomProductIds: []
        };
      }

      if (roomProduct.type !== RoomProductType.MRFC) {
        return {
          ratePlanId: currentRatePlanId,
          relatedRoomProductIds: []
        };
      }

      let accommodationTaxes: HotelTaxSetting[] = [];
      if (ratePlan) {
        const taxSettings = await this.hotelService.getHotelTaxSettings(
          hotelId,
          [ratePlan.code],
          fromDate,
          toDate
        );
        accommodationTaxes = taxSettings.accommodationTaxes;
      }

      let relatedRoomProductIds: string[] =
        await this.roomProductPricingService.getRelatedRoomProductIds({
          hotelId,
          roomProductId,
          roomProductType: roomProduct.type
        });

      if (relatedRoomProductIds.length === 0) {
        this.logger.warn(
          `No related room product mappings found for room product ${roomProductId}`
        );
        return;
      }

      const [
        featureDailyRates,
        ratePlanAdjustments,
        roomProductDailySellingPrices,
        relatedRoomProductPricingMethodDetails
      ] = await Promise.all([
        this.featurePricingService.getDailyOrDefaultFeatureRate({
          hotelId,
          roomProductIds: [...relatedRoomProductIds, roomProductId],
          dates
        }),
        this.ratePlanAdjustmentService.getDailyOrDefaultRatePlanAdjustment({
          hotelId,
          ratePlanIds: [currentRatePlanId],
          dates
        }),
        this.roomProductRatePlanRepository.findDailySellingPrices({
          roomProductIds: [roomProductId],
          ratePlanIds: [currentRatePlanId],
          dates
        }),
        this.roomProductRatePlanRepository.findRoomProductPricingMethodDetail({
          hotelId,
          roomProductIds: [...relatedRoomProductIds],
          ratePlanIds: [currentRatePlanId]
        })
      ]);

      const targetPmsPrices = roomProductDailySellingPrices.map((price) => ({
        roomProductId: price.roomProductId,
        date: price.date,
        price: price.basePrice + price.ratePlanAdjustments
      }));

      const rfcFeatureBasePricingResults =
        this.calculateFeatureBasePricingService.calculateDailyFeatureBasePricing({
          hotelId,
          dates,
          featureRates: featureDailyRates,
          ratePlanAdjustments: ratePlanAdjustments,
          ratePlanIds: [currentRatePlanId],
          roomProductIds: [...relatedRoomProductIds],
          accommodationTaxes,
          pricingMethodDetails: relatedRoomProductPricingMethodDetails,
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
          isExcludeCalculateTax: true
        });

      let reversedPricingResults: CalculateDailyPricingDto[] = [];
      if (ratePlan?.rfcAttributeMode) {
        const {
          relatedRoomProductAvailabilities,
          relatedRoomProductAssignedUnits,
          roomUnitAvailabilities
        } = await this.calculateAveragePricingService.getRelatedRoomProductAvailabilitiesData({
          hotelId,
          relatedRoomProductIds,
          dates
        });

        const mrfcAveragePricingResults =
          this.calculateAveragePricingService.calculateDailyAveragePricing({
            hotelId,
            roomProducts: [
              {
                roomProductId: roomProduct.id,
                relatedRoomProductIds,
                roomProductType: RoomProductType.MRFC
              }
            ],
            relatedRoomProductAvailabilities,
            relatedRoomProductAssignedUnits,
            roomUnitAvailabilities,
            ratePlanAdjustments: ratePlanAdjustments,
            accommodationTaxes,
            rfcFeatureBasePricingResults,
            dates,
            ratePlanIds: [currentRatePlanId],
            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
            isOccupancyBased: ratePlan?.mrfcPositioningMode,
            pricingMethodDetails: [] // TODO Room Product Pricing
          });

        const rfpAttributeBasedPricingResults =
          this.calculateAttributeBasedLogicService.calculateRFPAttributeBased({
            rfcFeatureBasePricingResults,
            mrfcAveragePricingResults: mrfcAveragePricingResults
          });

        reversedPricingResults = this.calculateReversedPricingService.calculateDailyReversedPricing(
          {
            hotelId,
            roomProducts: [
              {
                roomProductId: roomProductId,
                relatedRoomProductIds,
                roomProductType: roomProduct.type
              }
            ],
            targetPmsPrices,
            ratePlanAdjustments: ratePlanAdjustments,
            accommodationTaxes,
            rfcFeatureBasePricingResults: rfpAttributeBasedPricingResults,
            dates,
            ratePlans: [{ id: currentRatePlanId, rfcAttributeMode: ratePlan?.rfcAttributeMode }],
            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
          }
        );
      } else {
        reversedPricingResults = this.calculateReversedPricingService.calculateDailyReversedPricing(
          {
            hotelId,
            roomProducts: [
              {
                roomProductId: roomProductId,
                relatedRoomProductIds,
                roomProductType: roomProduct.type
              }
            ],
            targetPmsPrices,
            ratePlanAdjustments: ratePlanAdjustments,
            accommodationTaxes,
            rfcFeatureBasePricingResults,
            dates,
            ratePlans: [{ id: currentRatePlanId, rfcAttributeMode: ratePlan?.rfcAttributeMode }],
            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
          }
        );
      }

      const reversedPricingResultMap = groupByToMap(
        reversedPricingResults,
        (result) => `${result.roomProductId}`
      );

      for (const key of reversedPricingResultMap.keys()) {
        const results = reversedPricingResultMap.get(key);
        if (results && results.length > 0) {
          await this.roomProductSellingPriceService.insertSellingPrices(results, {
            hotelId,
            roomProductId: key,
            ratePlanId: currentRatePlanId,
            fromDate,
            toDate
          });
        }
      }

      return {
        pricingMethodDetails: relatedRoomProductPricingMethodDetails,
        ratePlanId: currentRatePlanId,
        relatedRoomProductIds
      };
    } catch (error) {
      this.logger.error(`Error in reversed product: ${error.message}`, methodDetail);
      return;
    }
  }

  async reversedProduct(
    methodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string
  ) {
    const roomProduct = await this.roomProductRepository.findOne({
      where: { id: methodDetail.roomProductId },
      select: ['type']
    });

    if (!roomProduct) {
      this.logger.warn(`Room product not found for id ${methodDetail.roomProductId}`);
      return;
    }

    const { hotelId, roomProductId, ratePlanId: currentRatePlanId } = methodDetail;

    // for reserved product, we need to find pricing method is PMS_PRICING
    if (methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING) {
      return;
    }

    // find related room product mappings for mrfcs
    const roomProductMappings = await this.roomProductMappingRepository.find({
      where: { roomProductId },
      select: ['relatedRoomProductId']
    });

    const relatedRoomProductIds = new Set(
      roomProductMappings.map((mapping) => mapping.relatedRoomProductId)
    );

    if (relatedRoomProductIds.size === 0) {
      this.logger.warn(`No related room product mappings found for room product ${roomProductId}`);
      return;
    }

    // find daily selling price from current product, and rate plan id
    const dates = Helper.generateDateRange(fromDate, toDate);
    const targetBasePriceMap: Record<string, RoomProductDailySellingPrice[]> = {};
    const relatedRoomProductIdsArray = Array.from(relatedRoomProductIds);

    const [roomProductMethodDetails, basePrices] = await Promise.all([
      // find room product method detail
      this.roomProductPricingMethodDetailRepository.find({
        where: {
          roomProductId: In(relatedRoomProductIdsArray),
          ratePlanId: currentRatePlanId,
          pricingMethod: RoomProductPricingMethodEnum.PMS_PRICING
        }
      }),

      // find base prices
      this.roomProductDailySellingPriceRepository.find({
        where: {
          hotelId,
          ratePlanId: currentRatePlanId,
          roomProductId: roomProductId,
          date: In(dates)
        },
        select: {
          roomProductId: true,
          date: true,
          basePrice: true,
          ratePlanId: true
        },
        order: {
          date: 'ASC'
        }
      })
    ]);

    basePrices.forEach((basePrice) => {
      const dto: any = {
        roomProductId: basePrice.roomProductId,
        date: basePrice.date,
        basePrice: basePrice.basePrice,
        ratePlanId: basePrice.ratePlanId
      };

      if (!targetBasePriceMap[basePrice.date]) {
        targetBasePriceMap[basePrice.date] = [];
      }
      targetBasePriceMap[basePrice.date].push(dto);
    });

    // Process each target rate plan separately
    const results: any[] = [];

    if (roomProductMethodDetails.length === 0) {
      this.logger.debug(
        `No room product method details found for room products ${relatedRoomProductIdsArray.join(', ')}, rate plan ${currentRatePlanId}`
      );
      return results;
    }

    for (const reversedRoomProduct of roomProductMethodDetails) {
      const targetInputs: any[] = [];
      const {
        roomProductId,
        ratePlanId,
        pricingMethodAdjustmentValue,
        pricingMethodAdjustmentUnit
      } = reversedRoomProduct;

      for (const date of dates) {
        let relatedPrices = targetBasePriceMap[date]?.find(
          (price) => price.date === date && price.ratePlanId === ratePlanId
        )?.basePrice;

        if (!relatedPrices) {
          relatedPrices = 0;
        }

        const basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
          relatedPrices,
          pricingMethodAdjustmentValue,
          pricingMethodAdjustmentUnit
        );

        targetInputs.push({
          hotelId,
          roomProductId,
          ratePlanId: ratePlanId,
          date,
          basePrice
        });
      }

      if (targetInputs.length === 0) {
        continue;
      }

      const filteredInputs = RoomProductPricingUtils.filterRedundantInput(
        targetBasePriceMap,
        targetInputs
      );

      if (filteredInputs.length === 0) {
        this.logger.debug(
          `No filtered inputs found for room products ${relatedRoomProductIdsArray.join(', ')}, rate plan ${ratePlanId}`
        );
        continue;
      }

      const result = await this.roomProductSellingPriceService.calculateSellingPrice({
        hotelId,
        roomProductId,
        roomProductType: roomProduct.type,
        ratePlanId, // Use rate plan ID for calculate
        fromDate,
        toDate,
        pricingDataSource: PricingDataSourceEnum.REVERSED,
        reversedBasePrices: filteredInputs
      });

      const response = await this.roomProductSellingPriceService.insertSellingPrices(result, {
        hotelId,
        roomProductId,
        ratePlanId, // Use rate plan ID for insert
        fromDate,
        toDate
      });

      results.push(result);
    }

    this.logger.log(
      `Reversed product for room products ${relatedRoomProductIdsArray.join(', ')}, rate plan ${currentRatePlanId} → ${roomProductMethodDetails.length} target rate plans, dates ${fromDate} to ${toDate} completed`
    );

    return results;
  }
}
