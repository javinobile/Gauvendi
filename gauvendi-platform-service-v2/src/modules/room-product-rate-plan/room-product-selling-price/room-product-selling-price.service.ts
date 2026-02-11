import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { BadRequestException } from '@src/core/exceptions';
import { PricingUtils } from '@src/core/modules/pricing-calculate/pricing-utils';
import { RatePlanAdjustmentService } from '@src/core/modules/pricing-calculate/rate-plan-adjustment/rate-plan-adjustment.service';
import { CalculateAttributeBasedLogicService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-attribute-based-logic.service';
import { CalculateAveragePricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-average-pricing.service';
import { CalculateCombinedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-combined-pricing.service';
import { CalculateFeatureBasePricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-feature-base-pricing.service';
import { CalculateFixedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-fixed-pricing.service';
import { CalculateReversedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-reversed-pricing.service';
import {
  CalculateDailyPricingDto,
  RoomProductPricingService
} from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.service';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { TaxInclusiveUtils } from '@src/core/utils/tax-inclusive.utils';
import { FeaturePricingService } from '@src/modules/feature-pricing/feature-pricing.service';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import Decimal from 'decimal.js';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductBasePriceSetting } from 'src/core/entities/room-product-base-price-setting.entity';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import {
  HotelAgeCategoryCodeEnum,
  RatePlanAdjustmentType,
  RoomProductBasePriceSettingModeEnum,
  RoomProductPricingMethodEnum,
  RoomProductType,
  RoundingMode,
  RoundingModeEnum
} from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { HotelService } from 'src/modules/hotel/services/hotel.service';
import { RatePlanPricingMappingDto } from 'src/modules/pms/pms.dto';
import { Between, In, Repository } from 'typeorm';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan.repository';
import {
  DailyFeatureCalculationResult,
  FeatureCalculationService
} from './feature-calculation.service';
import {
  CalculateSellingPriceDto,
  CalculateSellingPriceResponseDto,
  CalculateSellingPriceWithSourceDto,
  DailyFeatureBasePriceDto,
  GetRoomProductPricingModeDto,
  PricingDataSourceEnum,
  SellingPriceQuery
} from './room-product-selling-price.dto';
import { CalculateLinkedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-linked-pricing.service';
import { PricingCacheService, RateEntity } from '@src/core/modules/pricing-cache.service';

@Injectable()
export class RoomProductSellingPriceService {
  private readonly logger = new Logger(RoomProductSellingPriceService.name);

  constructor(
    private readonly featureCalculationService: FeatureCalculationService,

    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly sellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RatePlanDailyAdjustment, DbName.Postgres)
    private readonly ratePlanDailyAdjustmentRepository: Repository<RatePlanDailyAdjustment>,

    @InjectRepository(RatePlanExtraService, DbName.Postgres)
    private readonly ratePlanExtraServiceRepository: Repository<RatePlanExtraService>,

    @InjectRepository(RatePlanDailyExtraService, DbName.Postgres)
    private readonly ratePlanDailyExtraServiceRepository: Repository<RatePlanDailyExtraService>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RoomProductBasePriceSetting, DbName.Postgres)
    private readonly roomProductBasePriceSettingRepository: Repository<RoomProductBasePriceSetting>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly hotelService: HotelService,

    private readonly roomProductRepository: RoomProductRepository,
    private readonly roomProductPricingService: RoomProductPricingService,
    private readonly ratePlanAdjustmentService: RatePlanAdjustmentService,
    private readonly featurePricingService: FeaturePricingService,
    private readonly calculateFeatureBasePricingService: CalculateFeatureBasePricingService,
    private readonly calculateCombinedPricingService: CalculateCombinedPricingService,
    private readonly calculateAveragePricingService: CalculateAveragePricingService,
    private readonly calculateReversedPricingService: CalculateReversedPricingService,
    private readonly calculateFixedPricingService: CalculateFixedPricingService,
    private readonly calculateAttributeBasedLogicService: CalculateAttributeBasedLogicService,
    private readonly calculateLinkedPricingService: CalculateLinkedPricingService,
    private readonly roomProductRatePlanRepositoryCustom: RoomProductRatePlanRepository,
    private readonly pricingCacheService: PricingCacheService
  ) {}

  /**
   * Ultra-fast price lookup (1-2ms)
   */
  async getSellingPrice(query: SellingPriceQuery) {
    const { hotelId, ratePlanId, fromDate, toDate, roomProductIds } = query;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!ratePlanId) {
      throw new BadRequestException('Rate Plan ID is required');
    }

    const where: any = {
      hotelId,
      ratePlanId,
      date: Between(fromDate, toDate)
    };

    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }

    try {
      const result = await this.sellingPriceRepository.find({
        where,
        order: {
          date: 'ASC'
        },
        select: {
          id: true,
          roomProductId: true,
          date: true,
          basePrice: true,
          netPrice: true,
          grossPrice: true,
          ratePlanId: true,
          taxAmount: true,
          ratePlanAdjustments: true
        }
      });

      return result;
    } catch (error) {
      this.logger.error(`Error getting selling price: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Compute and persist selling prices to database
   * @param body - Calculation parameters
   * @returns Array of saved selling price records
   */
  async computeSellingPrice(body: CalculateSellingPriceDto) {
    try {
      const { hotelId, roomProductId, ratePlanId, fromDate, toDate } = body;

      // validate fromdate < todate
      if (!fromDate || !toDate) {
        throw new BadRequestException('From Date and To Date are required');
      }

      if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
        throw new BadRequestException('From Date must be before To Date');
      }

      if (!hotelId) {
        throw new BadRequestException('Hotel ID is required');
      }

      if (!roomProductId) {
        throw new BadRequestException('Room Product ID is required');
      }

      if (!ratePlanId) {
        throw new BadRequestException('Rate Plan ID is required');
      }

      // Calculate selling prices
      const calculatedSellingPrices = await this.calculateSellingPrice(body);

      if (!calculatedSellingPrices || calculatedSellingPrices.length === 0) {
        this.logger.warn('No calculated selling prices to persist');
        return [];
      }

      // Insert calculated prices into database
      const result = await this.insertSellingPrices(calculatedSellingPrices, body);

      // this.logger.log(`Successfully computed and saved ${result} selling price records`);
      return calculatedSellingPrices;
    } catch (error) {
      this.logger.error(`Error computing selling price: ${error.message}`, error.stack);
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Insert or update selling prices in the database
   * @param calculatedPrices - Array of calculated price data
   * @param requestBody - Original request parameters
   * @returns Array of saved entities
   */
  async insertSellingPrices(
    calculatedPrices: CalculateSellingPriceResponseDto[],
    requestBody: {
      hotelId: string;
      roomProductId: string;
      ratePlanId: string;
      fromDate: string;
      toDate: string;
    }
  ): Promise<string> {
    const { hotelId, roomProductId, ratePlanId } = requestBody;
    const calculationVersion = `v${Date.now()}`; // Simple versioning
    const currentTimestamp = new Date();

    try {
      // Prepare entities for bulk insert/update
      const entitiesToSave = calculatedPrices.map((priceData) => {
        const entity = new RoomProductDailySellingPrice();

        // Basic identifiers
        entity.hotelId = hotelId;
        entity.roomProductId = roomProductId;
        entity.ratePlanId = ratePlanId;
        entity.date = priceData.date;

        // Pricing breakdown for transparency
        entity.basePrice = DecimalRoundingHelper.conditionalRounding(
          priceData.featureBasedRate || 0,
          RoundingModeEnum.HALF_UP,
          4
        ); // round to 4 decimal places
        entity.featureAdjustments = DecimalRoundingHelper.conditionalRounding(
          priceData.featureBasedRate || 0,
          RoundingModeEnum.HALF_UP,
          4
        ); // round to 4 decimal places
        entity.ratePlanAdjustments = DecimalRoundingHelper.conditionalRounding(
          priceData.adjustmentRate || 0,
          RoundingModeEnum.HALF_UP,
          4
        ); // round to 4 decimal places
        // entity.occupancySurcharges = 0; // Not currently calculated (depend on request allocated adult and child)
        // entity.extraServiceCharges = 0; // Not currently calculated (depend on request allocated adult and child)

        // Final computed prices
        entity.netPrice = DecimalRoundingHelper.conditionalRounding(
          priceData.netPrice || 0,
          RoundingModeEnum.HALF_UP,
          4
        ); // round to 4 decimal places
        entity.grossPrice = DecimalRoundingHelper.conditionalRounding(
          priceData.grossPrice || 0,
          RoundingModeEnum.HALF_UP,
          4
        ); // round to 4 decimal places

        // Tax information
        entity.taxAmount = DecimalRoundingHelper.conditionalRounding(
          priceData.totalTaxAmount || 0,
          RoundingModeEnum.HALF_UP,
          4
        ); // round to 4 decimal places

        // Metadata
        // do not update // important
        entity.metadata = {};

        return entity;
      });

      // Filter to only entities that have changed (compare with Redis cache)
      const rateEntities: RateEntity[] = entitiesToSave.map((e) => ({
        hotelId: e.hotelId,
        roomProductId: e.roomProductId,
        ratePlanId: e.ratePlanId,
        date: e.date,
        basePrice: e.basePrice,
        featureAdjustments: e.featureAdjustments,
        ratePlanAdjustments: e.ratePlanAdjustments,
        netPrice: e.netPrice,
        grossPrice: e.grossPrice,
        taxAmount: e.taxAmount
      }));
      const changedEntities = await this.pricingCacheService.filterChanged('rate', rateEntities);
      const changedSet = new Set(
        changedEntities.map((c) => `${c.hotelId}:${c.roomProductId}:${c.ratePlanId}:${c.date}`)
      );
      const entitiesToUpsert = entitiesToSave.filter((e) =>
        changedSet.has(`${e.hotelId}:${e.roomProductId}:${e.ratePlanId}:${e.date}`)
      );
      const skippedCount = entitiesToSave.length - entitiesToUpsert.length;
      this.logger.log(
        `[PricingCache] hotel=${hotelId} roomProduct=${roomProductId} ratePlan=${ratePlanId} | ` +
          `total=${entitiesToSave.length} changed=${entitiesToUpsert.length} skipped=${skippedCount}`
      );

      // Use upsert to handle existing records (only for changed entities)
      const result = await this.upsertSellingPrices(entitiesToUpsert);

      // Update Redis cache after successful upsert
      if (entitiesToUpsert.length > 0) {
        const changedRateEntities = entitiesToUpsert.map((e) => ({
          hotelId: e.hotelId,
          roomProductId: e.roomProductId,
          ratePlanId: e.ratePlanId,
          date: e.date,
          basePrice: e.basePrice,
          featureAdjustments: e.featureAdjustments,
          ratePlanAdjustments: e.ratePlanAdjustments,
          netPrice: e.netPrice,
          grossPrice: e.grossPrice,
          taxAmount: e.taxAmount
        }));
        await this.pricingCacheService.setHashes('rate', changedRateEntities);
      }

      // this.logger.log(
      //   `Successfully inserted/updated ${result} selling price records for room product ${roomProductId}`
      // );

      return result;
    } catch (error) {
      this.logger.error(`Error inserting selling prices: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to save selling prices: ${error.message}`);
    }
  }

  /**
   * Upsert selling prices using ON CONFLICT resolution
   * @param entities - Array of entities to save
   * @returns Array of saved entities
   */
  async upsertSellingPrices(entities: RoomProductDailySellingPrice[]): Promise<string> {
    if (entities.length === 0) {
      return 'success';
    }

    try {
      // Use PostgreSQL's ON CONFLICT for efficient upsert
      this.logger.debug(`Upserting ${entities.length} selling price records`);
      const chunk = 100;
      for (let i = 0; i < entities.length; i += chunk) {
        const chunkEntities = entities.slice(i, i + chunk);
        await this.sellingPriceRepository.upsert(chunkEntities, {
          conflictPaths: ['hotelId', 'roomProductId', 'ratePlanId', 'date'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      // const result = await this.sellingPriceRepository.save(entities, {
      //   chunk: 1000
      // });
      // const result = await this.sellingPriceRepository
      //   .createQueryBuilder()
      //   .insert()
      //   .into(RoomProductDailySellingPrice)
      //   .values(entities)
      //   .orUpdate(
      //     [
      //       'base_price',
      //       'feature_adjustments',
      //       'rate_plan_adjustments',
      //       'net_price',
      //       'gross_price',
      //       'tax_amount'
      //     ],
      //     ['hotel_id', 'room_product_id', 'rate_plan_id', 'date']
      //   )
      //   .execute();
      return 'success';
    } catch (error) {
      this.logger.error(`Error in upsert operation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Convert generic pricing data to daily feature base prices format
   * @param dailySellingPrices - Pricing data
   * @returns DailyFeatureBasePriceDto[]
   */
  private convertToFeatureBasePrices(
    dailySellingPrices: Partial<RoomProductDailySellingPrice>[]
  ): DailyFeatureBasePriceDto[] {
    return dailySellingPrices.map((price) => ({
      date: price.date!,
      featureBasedRate: price.basePrice!
    }));
  }

  /**
   * Get daily feature base prices from different sources
   * @param body - The calculation parameters
   * @returns Promise<DailyFeatureBasePriceDto[]>
   */
  private async getDailyFeatureBasePrices(
    body: CalculateSellingPriceWithSourceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    }
  ): Promise<DailyFeatureBasePriceDto[] | undefined> {
    const {
      pricingDataSource = PricingDataSourceEnum.INTERNAL,
      pmsBasePrices,
      positioningBasePrices,
      linkBasePrices,
      derivedBasePrices,
      attributeBasePrices,
      fixedBasePrices,
      reversedBasePrices
    } = body;

    // Map sources to corresponding datasets
    const sourceMap: Record<
      PricingDataSourceEnum,
      Partial<RoomProductDailySellingPrice>[] | undefined
    > = {
      [PricingDataSourceEnum.PMS]: pmsBasePrices,
      [PricingDataSourceEnum.POSITIONING]: positioningBasePrices,
      [PricingDataSourceEnum.LINK]: linkBasePrices,
      [PricingDataSourceEnum.DERIVED]: derivedBasePrices,
      [PricingDataSourceEnum.ATTRIBUTE]: attributeBasePrices,
      [PricingDataSourceEnum.FIXED]: fixedBasePrices,
      [PricingDataSourceEnum.INTERNAL]: undefined, // handled separately
      [PricingDataSourceEnum.REVERSED]: reversedBasePrices
    };

    switch (pricingDataSource) {
      case PricingDataSourceEnum.INTERNAL:
        return this.calculateSellingPriceBySetting(body, options);

      case PricingDataSourceEnum.PMS:
        if (!pmsBasePrices || pmsBasePrices.length === 0) {
          this.logger.warn('PMS pricing data source selected but no base prices provided');
          return [];
        }
        return this.convertPmsPricingToFeatureBasePrices(pmsBasePrices);

      default: {
        const basePrices = sourceMap[pricingDataSource];
        if (!basePrices || basePrices.length === 0) {
          this.logger.warn(
            `${pricingDataSource} pricing data source selected but no base prices provided`
          );
          return [];
        }
        return this.convertToFeatureBasePrices(basePrices);
      }
    }
  }

  /**
   * Convert PMS pricing data to daily feature base prices format
   * @param pmsBasePrices - PMS pricing data
   * @param roomProductId - Room product ID to filter by
   * @returns DailyFeatureBasePriceDto[]
   */
  private convertPmsPricingToFeatureBasePrices(
    pmsBasePrices: RatePlanPricingMappingDto[]
  ): DailyFeatureBasePriceDto[] {
    return pmsBasePrices.map((price) => ({
      date: price.date,
      featureBasedRate: price.pricingMode === 'Gross' ? price.grossPrice : price.netPrice
    }));
  }

  // Overloaded method signatures
  async calculateSellingPrice(
    body: CalculateSellingPriceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    }
  ): Promise<CalculateSellingPriceResponseDto[]>;
  async calculateSellingPrice(
    body: CalculateSellingPriceWithSourceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    }
  ): Promise<CalculateSellingPriceResponseDto[]>;
  async calculateSellingPrice(
    body: CalculateSellingPriceDto | CalculateSellingPriceWithSourceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    }
  ): Promise<CalculateSellingPriceResponseDto[]> {
    const startTime = Date.now();
    const { hotelId, roomProductId, fromDate, toDate, ratePlanId } = body;
    const { pricingDataSource } = body as CalculateSellingPriceWithSourceDto;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomProductId) {
      throw new BadRequestException('Room Product ID is required');
    }

    if (!ratePlanId) {
      throw new BadRequestException('Rate Plan ID is required');
    }

    // Generate date range for processing
    const dates = Helper.generateDateRange(fromDate, toDate);
    // this.logger.log(`Processing ${dates.length} dates from ${fromDate} to ${toDate}`);

    try {
      // Step 1: Batch fetch all data for the date range to optimize performance
      const [hotel, dailyFeatureBasePrices, dailyAdjustments, ratePlanInfo] = await Promise.all([
        // Get hotel
        this.hotelRepository.findOne({
          where: {
            id: hotelId
          },
          select: {
            taxSetting: true
          }
        }),

        // Get room product price setting (dynamic based on source)
        this.getDailyFeatureBasePrices(body as CalculateSellingPriceWithSourceDto, options),

        // Get daily adjustments for all dates
        this.ratePlanDailyAdjustmentRepository.find({
          where: {
            hotelId,
            ratePlanId,
            date: In(dates)
          },
          select: {
            date: true,
            adjustmentValue: true,
            adjustmentType: true
          }
        }),

        // Get rate plan fallback adjustment
        this.ratePlanRepository.findOne({
          where: {
            hotelId,
            id: ratePlanId
          },
          select: {
            adjustmentValue: true,
            adjustmentUnit: true,
            roundingMode: true,
            code: true
          }
        })
      ]);

      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      if (!dailyFeatureBasePrices) {
        this.logger.warn('Daily feature base prices not found');
        return [];
      }

      // Create lookup maps for performance
      const dailyAdjustmentMap: Map<string, RatePlanDailyAdjustment> = new Map(
        dailyAdjustments.map((adj) => [adj.date, adj])
      );

      const dailyFeatureBasePriceMap: Map<string, number> = new Map(
        dailyFeatureBasePrices.map((fa) => [fa.date, Number(fa.featureBasedRate)])
      );

      // Get comprehensive tax settings for both accommodation and extras
      let taxSettings = {
        accommodationTaxes: [] as HotelTaxSetting[],
        extrasTaxes: [] as HotelTaxSetting[]
      };

      if (ratePlanInfo) {
        taxSettings = await this.hotelService.getHotelTaxSettings(
          hotelId,
          [ratePlanInfo.code],
          fromDate,
          toDate
        );
      }

      // Step 4: Process each date and build result array (now synchronous)
      const results = dates.map((date) => {
        // Calculate adjustment rate for this date
        let adjustmentRate = 0;
        const dailyAdjustment: RatePlanDailyAdjustment | undefined = dailyAdjustmentMap.get(date);

        const featureBasedRate = dailyFeatureBasePriceMap.get(date) || 0;
        const roundingMode = ratePlanInfo?.roundingMode || RoundingModeEnum.NO_ROUNDING;

        // if no daily feature is adjustment, fallback to default feature adjustment
        if (dailyAdjustment?.adjustmentValue) {
          if (dailyAdjustment.adjustmentType === RatePlanAdjustmentType.FIXED) {
            adjustmentRate = Number(dailyAdjustment.adjustmentValue);
          } else {
            // Fix the recursive calculation bug
            adjustmentRate = featureBasedRate * (Number(dailyAdjustment.adjustmentValue) / 100);
          }
        } else if (ratePlanInfo?.adjustmentValue) {
          // Fallback to rate plan adjustment
          if (ratePlanInfo.adjustmentUnit === RatePlanAdjustmentType.FIXED) {
            adjustmentRate = Number(ratePlanInfo.adjustmentValue);
          } else {
            // Fix the recursive calculation bug
            adjustmentRate = featureBasedRate * (Number(ratePlanInfo.adjustmentValue) / 100);
          }
        }

        const accommodationRate =
          pricingDataSource === PricingDataSourceEnum.PMS // TODO: Need to clarify with dev
            ? featureBasedRate + adjustmentRate
            : featureBasedRate + adjustmentRate;

        // Apply rounding to accommodation rate if needed
        const roundedAccommodationRate = DecimalRoundingHelper.conditionalRounding(
          accommodationRate,
          roundingMode,
          0
        );

        const calculateResult = TaxInclusiveUtils.calculateWithMultipleTaxRates(
          new Decimal(roundedAccommodationRate),
          0, // service charge rate
          0, // service charge tax rate
          taxSettings.accommodationTaxes.map((tax) => ({
            code: tax.hotelTax?.code || '',
            rate: tax.hotelTax?.rate || 0
          })),
          2,
          RoundingMode[roundingMode]
        );

        const grossPrice = Number(calculateResult.grossAmount);
        const totalTaxAmount = Number(calculateResult.totalTaxAmount);

        const netPrice = grossPrice - totalTaxAmount;

        return {
          date,
          roomProductId,

          ratePlanId,
          hotelId,
          adjustmentRate,
          featureBasedRate,
          accommodationRate: roundedAccommodationRate,
          netPrice,
          grossPrice,
          totalTaxAmount
        };
      });

      // const endTime = Date.now();
      // const executionTime = endTime - startTime;
      // this.logger.log(`Calculation completed in ${executionTime}ms for ${dates.length} dates`);

      return results;
    } catch (error) {
      this.logger.error(`Error calculating selling price: ${error.message}`, error.stack);
      return [];
    }
  }

  // {
  //   hotelId,
  //   roomProductId,
  //   roomProductType: roomProduct.type,
  //   ratePlanId,
  //   fromDate,
  //   toDate,
  //   pmsBasePrices: filterRoomProductPricing,
  //   pricingDataSource: PricingDataSourceEnum.PMS
  // }

  async calculateSellingPriceFromPms(body: {
    hotelId: string;
    roomProductId: string;
    ratePlanId: string;
    fromDate: string;
    toDate: string;
    isFetchPmsBasePrices?: boolean;
    pmsBasePrices: RatePlanPricingMappingDto[];
  }) {
    const {
      hotelId,
      roomProductId,
      ratePlanId,
      fromDate,
      toDate,
      pmsBasePrices,
      isFetchPmsBasePrices
    } = body;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }
    if (!roomProductId) {
      throw new BadRequestException('Room Product ID is required');
    }
    if (!ratePlanId) {
      throw new BadRequestException('Rate Plan ID is required');
    }

    const [roomProduct, ratePlan] = await Promise.all([
      this.roomProductRepository.findOne(
        {
          hotelId,
          roomProductId
        },
        {
          id: true,
          type: true
        }
      ),
      this.ratePlanRepository.findOne({
        where: {
          hotelId,
          id: ratePlanId
        },
        select: {
          code: true,
          roundingMode: true
        }
      })
    ]);

    if (!roomProduct) {
      throw new BadRequestException('Room Product not found');
    }
    if (!ratePlan) {
      throw new BadRequestException('Rate Plan not found');
    }

    const dates = Helper.generateDateRange(fromDate, toDate);

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

    let pmsBasePricesFinal: RatePlanPricingMappingDto[] = pmsBasePrices;
    const [ratePlanAdjustments, roomProductDailySellingPrices, roomProductPricingMethodDetails] =
      await Promise.all([
        this.ratePlanAdjustmentService.getDailyOrDefaultRatePlanAdjustment({
          hotelId,
          ratePlanIds: [ratePlanId],
          dates
        }),
        !isFetchPmsBasePrices
          ? Promise.resolve([])
          : this.roomProductRatePlanRepositoryCustom.findDailySellingPrices({
              roomProductIds: [roomProductId],
              ratePlanIds: [ratePlanId],
              dates
            }),
        !isFetchPmsBasePrices
          ? Promise.resolve([])
          : this.roomProductRatePlanRepositoryCustom.findRoomProductPricingMethodDetail({
              hotelId,
              roomProductIds: [roomProductId],
              ratePlanIds: [ratePlanId]
            })
      ]);

    if (isFetchPmsBasePrices) {
      const roomProductPricingMethodDetailMap = groupByToMapSingle(
        roomProductPricingMethodDetails,
        (detail) => `${detail.roomProductId}-${detail.ratePlanId}`
      );

      for (const price of roomProductDailySellingPrices) {
        const roomProductPricingMethodDetail = roomProductPricingMethodDetailMap.get(
          `${price.roomProductId}-${price.ratePlanId}`
        );

        const adjustment = PricingUtils.calculateAdjustment({
          basePrice: price.basePrice,
          adjustmentValue: roomProductPricingMethodDetail?.pricingMethodAdjustmentValue || 0,
          adjustmentUnit: roomProductPricingMethodDetail?.pricingMethodAdjustmentUnit || 'FIXED'
        });

        pmsBasePricesFinal.push({
          date: price.date,
          pricingMode: 'Gross',
          roomProductMappingPmsCode: '',
          ratePlanMappingPmsCode: '',
          grossPrice: new Decimal(price.basePrice).plus(adjustment).toNumber(),
          netPrice: new Decimal(price.basePrice).plus(adjustment).toNumber()
        });
      }
    }

    const results = this.calculateReversedPricingService.calculatePmsPricing({
      hotelId,
      dates,
      ratePlanAdjustments,
      accommodationTaxes,
      roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
      roomProductRatePlans: [
        {
          roomProductId,
          ratePlanId,
          roomProductType: roomProduct.type,
          pmsBasePrices
        }
      ]
    });

    return results;
  }

  async calculateSellingPriceV2(
    body: {
      hotelId: string;
      roomProductId: string;
      ratePlanId: string;
      fromDate: string;
      toDate: string;
    },
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
      pricingMethod?: RoomProductPricingMethodEnum;
    }
  ): Promise<{
    sellingPriceList: CalculateSellingPriceResponseDto[];
    relatedSellingPriceList: CalculateSellingPriceResponseDto[];
  }> {
    const { hotelId, roomProductId, ratePlanId, fromDate, toDate } = body;
    const { pricingMethodAdjustmentValue, pricingMethodAdjustmentUnit, pricingMethod } =
      options || {};
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!roomProductId) {
      throw new BadRequestException('Room Product ID is required');
    }

    if (!ratePlanId) {
      throw new BadRequestException('Rate Plan ID is required');
    }

    const [roomProduct, ratePlan, roomProductBasePriceSetting] = await Promise.all([
      this.roomProductRepository.findOne(
        {
          hotelId,
          roomProductId
        },
        {
          id: true,
          type: true
        }
      ),
      this.ratePlanRepository.findOne({
        where: {
          hotelId,
          id: ratePlanId
        },
        select: {
          code: true,
          roundingMode: true,
          rfcAttributeMode: true,
          mrfcPositioningMode: true
        }
      }),
      this.roomProductRepository.findRoomProductBasePriceSetting({
        hotelId,
        roomProductIds: [roomProductId]
      })
    ]);

    if (!roomProduct) {
      throw new BadRequestException('Room Product not found');
    }

    const dates = Helper.generateDateRange(fromDate, toDate);
    let pricingMode: RoomProductBasePriceSettingModeEnum | null = null;

    if (roomProduct?.type === RoomProductType.RFC) {
      pricingMode = RoomProductBasePriceSettingModeEnum.FEATURE_BASED;
    } else {
      const finalRoomProductBasePriceSetting = roomProductBasePriceSetting.find(
        (setting) => setting.roomProductId === roomProductId
      );

      if (finalRoomProductBasePriceSetting) {
        pricingMode = finalRoomProductBasePriceSetting.mode;
      }
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

    const sellingPriceList: CalculateSellingPriceResponseDto[] = [];
    const relatedSellingPriceList: CalculateSellingPriceResponseDto[] = [];

    let relatedRoomProductIds: string[] = [];
    if (
      pricingMode === RoomProductBasePriceSettingModeEnum.AVERAGE ||
      pricingMode === RoomProductBasePriceSettingModeEnum.COMBINED
    ) {
      relatedRoomProductIds = await this.roomProductPricingService.getRelatedRoomProductIds({
        hotelId,
        roomProductId,
        roomProductType: roomProduct.type
      });
    }

    const [featureDailyRates, ratePlanAdjustments, relatedRoomProductPricingMethodDetails] =
      await Promise.all([
        this.featurePricingService.getDailyOrDefaultFeatureRate({
          hotelId,
          roomProductIds: [...relatedRoomProductIds, roomProductId],
          dates
        }),
        this.ratePlanAdjustmentService.getDailyOrDefaultRatePlanAdjustment({
          hotelId,
          ratePlanIds: [ratePlanId],
          dates
        }),
        relatedRoomProductIds
          ? this.roomProductRatePlanRepositoryCustom.findRoomProductPricingMethodDetail(
              {
                hotelId,
                roomProductIds: [...relatedRoomProductIds],
                ratePlanIds: [ratePlanId]
              },
              {
                id: true,
                roomProductId: true,
                ratePlanId: true,
                pricingMethod: true,
                pricingMethodAdjustmentValue: true,
                pricingMethodAdjustmentUnit: true
              }
            )
          : Promise.resolve([])
      ]);

    if (pricingMode === RoomProductBasePriceSettingModeEnum.FEATURE_BASED) {
      const rfcFeatureBasePricingResults =
        this.calculateFeatureBasePricingService.calculateDailyFeatureBasePricing({
          hotelId,
          dates,
          featureRates: featureDailyRates,
          ratePlanAdjustments: ratePlanAdjustments,
          ratePlanIds: [ratePlanId],
          roomProductIds: [roomProductId],
          accommodationTaxes,
          dailySellingPrices: [],
          pricingMethodDetails: [
            {
              roomProductId,
              ratePlanId,
              pricingMethodAdjustmentValue,
              pricingMethodAdjustmentUnit,
              pricingMethod
            }
          ],
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
        });

      sellingPriceList.push(...rfcFeatureBasePricingResults);
    }

    if (pricingMode === RoomProductBasePriceSettingModeEnum.AVERAGE) {
      const rfcFetchIds = relatedRoomProductPricingMethodDetails
        .filter(
          (detail) =>
            detail.pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING ||
            detail.pricingMethod === RoomProductPricingMethodEnum.DERIVED
        )
        .map((detail) => detail.roomProductId);

      const rfcSellingPriceList =
        rfcFetchIds.length > 0
          ? await this.roomProductRatePlanRepositoryCustom.findDailySellingPrices({
              roomProductIds: rfcFetchIds,
              ratePlanIds: [ratePlanId],
              dates
            })
          : [];

      let rfcPricingResults =
        this.calculateFeatureBasePricingService.calculateDailyFeatureBasePricing({
          hotelId,
          dates,
          featureRates: featureDailyRates,
          ratePlanAdjustments: ratePlanAdjustments,
          ratePlanIds: [ratePlanId],
          roomProductIds: [...relatedRoomProductIds],
          dailySellingPrices: rfcSellingPriceList,
          accommodationTaxes,
          pricingMethodDetails: relatedRoomProductPricingMethodDetails,
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
        });

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
          pricingMethodDetails: [
            {
              roomProductId,
              ratePlanId,
              pricingMethodAdjustmentValue,
              pricingMethodAdjustmentUnit
            }
          ],
          rfcFeatureBasePricingResults: rfcPricingResults,
          dates,
          ratePlanIds: [ratePlanId],
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
          isOccupancyBased: ratePlan?.mrfcPositioningMode
        });

      if (ratePlan?.rfcAttributeMode) {
        const rfpAttributeBasedPricingResults =
          this.calculateAttributeBasedLogicService.calculateRFPAttributeBased({
            rfcFeatureBasePricingResults: rfcPricingResults,
            mrfcAveragePricingResults: mrfcAveragePricingResults
          });
        rfcPricingResults = rfpAttributeBasedPricingResults;
      }

      if (roomProduct.type === RoomProductType.MRFC) {
        relatedSellingPriceList.push(...rfcPricingResults);
        sellingPriceList.push(...mrfcAveragePricingResults);
      } else if (roomProduct.type === RoomProductType.ERFC) {
        const erfcAveragePricingResults =
          this.calculateAveragePricingService.calculateDailyAveragePricing({
            hotelId,
            roomProducts: [
              {
                roomProductId: roomProduct.id,
                relatedRoomProductIds,
                roomProductType: RoomProductType.ERFC
              }
            ],
            relatedRoomProductAvailabilities,
            relatedRoomProductAssignedUnits,
            roomUnitAvailabilities,
            ratePlanAdjustments: ratePlanAdjustments,
            accommodationTaxes,
            pricingMethodDetails: [
              {
                roomProductId,
                ratePlanId,
                pricingMethodAdjustmentValue,
                pricingMethodAdjustmentUnit
              }
            ],
            rfcFeatureBasePricingResults: rfcPricingResults,
            dates,
            ratePlanIds: [ratePlanId],
            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
            isOccupancyBased: ratePlan?.mrfcPositioningMode
          });

        sellingPriceList.push(...erfcAveragePricingResults);
      }
    }

    if (pricingMode === RoomProductBasePriceSettingModeEnum.COMBINED) {
      const rfcFetchIds = relatedRoomProductPricingMethodDetails
        .filter(
          (detail) =>
            detail.pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING ||
            detail.pricingMethod === RoomProductPricingMethodEnum.LINK ||
            detail.pricingMethod === RoomProductPricingMethodEnum.DERIVED
        )
        .map((detail) => detail.roomProductId);

      const rfcSellingPriceList =
        rfcFetchIds.length > 0
          ? await this.roomProductRatePlanRepositoryCustom.findDailySellingPrices({
              roomProductIds: rfcFetchIds,
              ratePlanIds: [ratePlanId],
              dates
            })
          : [];

      const rfcFeatureBasePricingResults =
        this.calculateFeatureBasePricingService.calculateDailyFeatureBasePricing({
          hotelId,
          dates,
          featureRates: featureDailyRates,
          ratePlanAdjustments: ratePlanAdjustments,
          ratePlanIds: [ratePlanId],
          roomProductIds: [...relatedRoomProductIds],
          dailySellingPrices: rfcSellingPriceList,
          accommodationTaxes,
          pricingMethodDetails: relatedRoomProductPricingMethodDetails,
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
        });

      const averageBasePricingRoomProductInputs = [
        {
          roomProductId: roomProduct.id,
          relatedRoomProductIds,
          roomProductType: roomProduct.type
        }
      ];

      if (ratePlan?.rfcAttributeMode && roomProduct.type === RoomProductType.ERFC) {
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
            pricingMethodDetails: [
              {
                roomProductId,
                ratePlanId,
                pricingMethodAdjustmentValue,
                pricingMethodAdjustmentUnit
              }
            ],
            rfcFeatureBasePricingResults,
            dates,
            ratePlanIds: [ratePlanId],
            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
            isOccupancyBased: ratePlan?.mrfcPositioningMode
            // isExcludeCalculateTax: true,
          });

        const rfpAttributeBasedPricingResults =
          this.calculateAttributeBasedLogicService.calculateRFPAttributeBased({
            rfcFeatureBasePricingResults,

            mrfcAveragePricingResults: mrfcAveragePricingResults
          });

        const combinedPricingResults =
          this.calculateCombinedPricingService.calculateDailyCombinedPricing({
            hotelId,
            roomProducts: averageBasePricingRoomProductInputs,
            // relatedRoomProductAvailabilities,
            // relatedRoomProductAssignedUnits,
            // roomUnitAvailabilities,
            ratePlanAdjustments: ratePlanAdjustments,
            accommodationTaxes,
            pricingMethodDetails: [
              {
                roomProductId,
                ratePlanId,
                pricingMethodAdjustmentValue,
                pricingMethodAdjustmentUnit
              }
            ],
            rfcFeatureBasePricingResults: rfpAttributeBasedPricingResults,
            dates,
            ratePlanIds: [ratePlanId],

            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
          });

        sellingPriceList.push(...combinedPricingResults);
      } else {
        const combinedPricingResults =
          this.calculateCombinedPricingService.calculateDailyCombinedPricing({
            hotelId,
            roomProducts: averageBasePricingRoomProductInputs,
            // relatedRoomProductAvailabilities,
            // relatedRoomProductAssignedUnits,
            // roomUnitAvailabilities,
            ratePlanAdjustments: ratePlanAdjustments,
            accommodationTaxes,
            pricingMethodDetails: [
              {
                roomProductId,
                ratePlanId,
                pricingMethodAdjustmentValue,
                pricingMethodAdjustmentUnit
              }
            ],
            rfcFeatureBasePricingResults,
            dates,
            ratePlanIds: [ratePlanId],
            roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
          });

        sellingPriceList.push(...combinedPricingResults);
      }
    }

    if (pricingMode === RoomProductBasePriceSettingModeEnum.FIXED_PRICE) {
      const fixedPrice =
        roomProductBasePriceSetting.find((rps) => rps.roomProductId === roomProduct.id)
          ?.fixedPrice || 0;

      const fixedPricingResults = this.calculateFixedPricingService.calculateDailyFixedPricePricing(
        {
          hotelId,
          dates,
          fixedPrice,
          ratePlanAdjustments: ratePlanAdjustments,
          accommodationTaxes,
          pricingMethodDetails: [
            {
              roomProductId,
              ratePlanId,
              pricingMethodAdjustmentValue,
              pricingMethodAdjustmentUnit
            }
          ],
          ratePlanIds: [ratePlanId],
          roomProductIds: [roomProductId],
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
        }
      );

      sellingPriceList.push(...fixedPricingResults);
    }

    return {
      sellingPriceList,
      relatedSellingPriceList
    };
  }

  async calculateLinkedPriceV2(input: {
    hotelId: string;
    ratePlanId: string;
    targetRoomProductId: string;
    methodDetails: RoomProductPricingMethodDetail[];
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, ratePlanId, targetRoomProductId, methodDetails, fromDate, toDate } = input;

    const [ratePlan] = await Promise.all([
      this.ratePlanRepository.findOne({
        where: {
          hotelId,
          id: ratePlanId
        },
        select: {
          code: true,
          roundingMode: true,
          rfcAttributeMode: true,
          mrfcPositioningMode: true
        }
      })
    ]);

    if (!ratePlan) {
      this.logger.error('Rate Plan not found');
      return [];
    }

    const dates = Helper.generateDateRange(fromDate, toDate);

    const ratePlanAdjustments =
      await this.ratePlanAdjustmentService.getDailyOrDefaultRatePlanAdjustment({
        hotelId,
        ratePlanIds: [ratePlan.id],
        dates
      });

    let accommodationTaxes: HotelTaxSetting[] = [];

    const taxSettings = await this.hotelService.getHotelTaxSettings(
      hotelId,
      [ratePlan.code],
      fromDate,
      toDate
    );
    accommodationTaxes = taxSettings.accommodationTaxes;

    let result: {
      methodDetail: RoomProductPricingMethodDetail;
      dailySellingList: CalculateDailyPricingDto[];
    }[] = [];
    for (const methodDetail of methodDetails.filter(
      (item) =>
        item.pricingMethod === RoomProductPricingMethodEnum.LINK &&
        item.targetRoomProductId !== undefined &&
        item.targetRoomProduct !== null &&
        item.targetRoomProductId === targetRoomProductId &&
        item.ratePlanId === ratePlanId
    )) {
      const targetDailySellingPrices =
        await this.roomProductRatePlanRepositoryCustom.findDailySellingPrices({
          hotelId: methodDetail.hotelId,
          roomProductIds: [targetRoomProductId],
          ratePlanIds: [ratePlanId],
          dates
        });

      const dailySellingList = await this.calculateLinkedPricingService.calculateLinkedPricePricing(
        {
          dailySellingPrices: targetDailySellingPrices,
          dates,
          hotelId,
          pricingMethodDetails: [
            {
              roomProductId: methodDetail.targetRoomProductId,
              ratePlanId: methodDetail.ratePlanId,
              pricingMethodAdjustmentValue: methodDetail.pricingMethodAdjustmentValue,
              pricingMethodAdjustmentUnit: methodDetail.pricingMethodAdjustmentUnit
            }
          ],
          ratePlanId: methodDetail.ratePlanId,
          ratePlanAdjustments: ratePlanAdjustments,
          accommodationTaxes,

          roundingMode: ratePlan.roundingMode || RoundingModeEnum.NO_ROUNDING
        }
      );

      result.push({
        methodDetail,
        dailySellingList
      });
    }

    return result;
  }

  async calculateAndInsertRFCSellingPrice(input: {
    hotelId: string;
    methodDetail: RoomProductPricingMethodDetail;
    relatedRoomProductIds: string[];
    ratePlanId: string;
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, methodDetail, relatedRoomProductIds, ratePlanId, fromDate, toDate } = input;

    const dates = Helper.generateDateRange(fromDate, toDate);

    if (relatedRoomProductIds.length === 0) {
      return [];
    }

    const [roomProducts, ratePlan] = await Promise.all([
      this.roomProductRepository.find(
        {
          hotelId,
          roomProductIds: relatedRoomProductIds
        },
        ['roomProduct.id', 'roomProduct.type']
      ),
      this.ratePlanRepository.findOne({
        where: {
          hotelId,
          id: ratePlanId
        },
        select: {
          code: true,
          roundingMode: true
        }
      })
    ]);

    if (!roomProducts || roomProducts.length === 0) {
      throw new BadRequestException('Room Product not found');
    }
    if (!ratePlan) {
      throw new BadRequestException('Rate Plan not found');
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

    const [featureDailyRates, ratePlanAdjustments, relatedRoomProductPricingMethodDetails] =
      await Promise.all([
        this.featurePricingService.getDailyOrDefaultFeatureRate({
          hotelId,
          roomProductIds: [...relatedRoomProductIds],
          dates
        }),
        this.ratePlanAdjustmentService.getDailyOrDefaultRatePlanAdjustment({
          hotelId,
          ratePlanIds: [ratePlanId],
          dates
        }),
        this.roomProductRatePlanRepositoryCustom.findRoomProductPricingMethodDetail({
          hotelId,
          roomProductIds: [...relatedRoomProductIds],
          ratePlanIds: [ratePlanId]
        })
      ]);

    let rfcFeatureBasePricingResults =
      this.calculateFeatureBasePricingService.calculateDailyFeatureBasePricing({
        hotelId,
        dates,
        featureRates: featureDailyRates,
        ratePlanAdjustments: ratePlanAdjustments,
        ratePlanIds: [ratePlanId],
        roomProductIds: [...relatedRoomProductIds],
        accommodationTaxes,
        pricingMethodDetails: relatedRoomProductPricingMethodDetails,
        roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
      });

    if (ratePlan?.rfcAttributeMode) {
      const {
        relatedRoomProductAvailabilities,
        relatedRoomProductAssignedUnits,
        roomUnitAvailabilities
      } = await this.calculateAveragePricingService.getRelatedRoomProductAvailabilitiesData({
        hotelId,
        relatedRoomProductIds: roomProducts.map((roomProduct) => roomProduct.id),
        dates
      });

      const mrfcAveragePricingResults =
        this.calculateAveragePricingService.calculateDailyAveragePricing({
          hotelId,
          roomProducts: [
            {
              roomProductId: methodDetail.roomProductId,
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
          ratePlanIds: [ratePlanId],
          roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING,
          isOccupancyBased: ratePlan?.mrfcPositioningMode,
          pricingMethodDetails: [] // TODO Room Product Pricing
        });

      rfcFeatureBasePricingResults =
        this.calculateAttributeBasedLogicService.calculateRFPAttributeBased({
          rfcFeatureBasePricingResults,
          mrfcAveragePricingResults: mrfcAveragePricingResults
        });
    }

    const rfcFeatureBasePricingResultMap = groupByToMap(
      rfcFeatureBasePricingResults,
      (result) => `${result.roomProductId}`
    );

    await Promise.all(
      Array(...rfcFeatureBasePricingResultMap.keys()).map((key) => {
        const results = rfcFeatureBasePricingResultMap.get(key);
        if (results && results.length > 0) {
          return this.insertSellingPrices(results, {
            hotelId,
            roomProductId: key,
            ratePlanId: ratePlanId,
            fromDate,
            toDate
          });
        }
      })
    );

    return relatedRoomProductPricingMethodDetails;
  }

  async calculateAfterRFCPricingChange(input: {
    hotelId: string;
    reversedPricingResults: {
      ratePlanId: string;
      relatedRoomProductIds: string[];
    }[];
    roomProductTypes?: RoomProductType[];
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, reversedPricingResults, roomProductTypes, fromDate, toDate } = input;
    const allRatePlanIds = reversedPricingResults
      .map((item) => item?.ratePlanId)
      .filter((item) => item !== undefined)
      .flat();
    const allRelatedRoomProductIds = reversedPricingResults
      .map((item) => item?.relatedRoomProductIds)
      .filter((item) => item !== undefined)
      .flat();

    const uniqueRatePlanIds = [...new Set(allRatePlanIds)];
    const uniqueRelatedRoomProductIds = [...new Set(allRelatedRoomProductIds)];

    const erfcRelatedRoomProducts = await this.roomProductPricingService.getTargetForRFCRoomProduct(
      {
        hotelId,
        rfcRoomProductIds: uniqueRelatedRoomProductIds,
        targetRoomProductTypes: roomProductTypes || [RoomProductType.ERFC, RoomProductType.MRFC]
      }
    );
    const erfcRelatedRoomProductMap = groupByToMapSingle(
      erfcRelatedRoomProducts,
      (item) => item.rfcRoomProductId
    );
    let methodDetails: RoomProductPricingMethodDetail[] = [];
    if (erfcRelatedRoomProducts && erfcRelatedRoomProducts.length > 0) {
      const erfcRoomProductIds = erfcRelatedRoomProducts.map((item) => item.targetRoomProductId);
      const erfcRoomProductMethodDetails =
        await this.roomProductRatePlanRepositoryCustom.findRoomProductPricingMethodDetail({
          hotelId,
          ratePlanIds: uniqueRatePlanIds,
          roomProductIds: erfcRoomProductIds,
          pricingMethods: [RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING]
        });
      const erfcRoomProductMethodDetailsMap = groupByToMapSingle(
        erfcRoomProductMethodDetails,
        (item) => `${item.roomProductId}-${item.ratePlanId}`
      );

      await Promise.all(
        reversedPricingResults
          .filter((reversedPricingResult) => reversedPricingResult !== undefined)
          .map((reversedPricingResult) => {
            const targetRoomProductIds = Array.from(
              new Set(
                reversedPricingResult.relatedRoomProductIds
                  .map((id) => erfcRelatedRoomProductMap.get(id))
                  .filter((item) => item !== undefined)
                  .map((item) => item.targetRoomProductId)
              )
            );
            if (targetRoomProductIds.length === 0) {
              return;
            }

            const findErfcRoomProductMethodDetails = targetRoomProductIds
              .map((id) =>
                erfcRoomProductMethodDetailsMap.get(`${id}-${reversedPricingResult.ratePlanId}`)
              )
              .filter((item) => item !== undefined);

            methodDetails.push(...findErfcRoomProductMethodDetails);

            return Promise.all(
              findErfcRoomProductMethodDetails.map(async (methodDetail) => {
                const result = await this.calculateSellingPriceV2(
                  {
                    hotelId,
                    roomProductId: methodDetail.roomProductId,
                    ratePlanId: methodDetail.ratePlanId,
                    fromDate,
                    toDate
                  },
                  {
                    pricingMethodAdjustmentValue: methodDetail.pricingMethodAdjustmentValue,
                    pricingMethodAdjustmentUnit: methodDetail.pricingMethodAdjustmentUnit,
                    pricingMethod: methodDetail.pricingMethod
                  }
                );
                return this.insertSellingPrices(result.sellingPriceList, {
                  hotelId,
                  roomProductId: methodDetail.roomProductId,
                  ratePlanId: methodDetail.ratePlanId,
                  fromDate,
                  toDate
                });
              })
            );
          })
      );
    }
    return methodDetails;
  }

  // async calculateSellingPriceMultiRoomProduct(
  //   body: {
  //     hotelId: string;
  //     roomProductIds: string[];
  //     ratePlanId: string;
  //     fromDate: string;
  //     toDate: string;
  //   },
  //   options?: {
  //     pricingMethodAdjustmentValue?: number;
  //     pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
  //   }
  // ): Promise<CalculateSellingPriceResponseDto[]> {
  //   const { hotelId, roomProductIds, ratePlanId, fromDate, toDate } = body;
  //   const { pricingMethodAdjustmentValue, pricingMethodAdjustmentUnit } = options || {};
  //   if (!hotelId) {
  //     throw new BadRequestException('Hotel ID is required');
  //   }

  //   if (!roomProductIds || roomProductIds.length === 0) {
  //     throw new BadRequestException('Room Product ID is required');
  //   }

  //   if (!ratePlanId) {
  //     throw new BadRequestException('Rate Plan ID is required');
  //   }

  //   const [roomProducts, ratePlan] = await Promise.all([
  //     this.roomProductRepository.find(
  //       {
  //         hotelId,
  //         roomProductIds,
  //         status: [RoomProductStatus.ACTIVE] // TODO Room Product Pricing: Need to clarify with dev
  //       },
  //       ['roomProduct.id', 'roomProduct.type']
  //     ),
  //     this.ratePlanRepository.findOne({
  //       where: {
  //         hotelId,
  //         id: ratePlanId
  //       },
  //       select: {
  //         code: true,
  //         roundingMode: true
  //       }
  //     })
  //   ]);

  //   const dates = Helper.generateDateRange(fromDate, toDate);
  //   const mrfcs = roomProducts.filter((roomProduct) => roomProduct.type === RoomProductType.MRFC);
  //   const erfcs = roomProducts.filter((roomProduct) => roomProduct.type === RoomProductType.ERFC);
  //   const rfcs = roomProducts.filter((roomProduct) => roomProduct.type === RoomProductType.RFC);

  //   const mrfcIds = mrfcs.map((roomProduct) => roomProduct.id);
  //   const erfcIds = erfcs.map((roomProduct) => roomProduct.id);
  //   const rfcIds = rfcs.map((roomProduct) => roomProduct.id);

  //   let accommodationTaxes: HotelTaxSetting[] = [];
  //   if (ratePlan) {
  //     const taxSettings = await this.hotelService.getHotelTaxSettings(
  //       hotelId,
  //       [ratePlan.code],
  //       fromDate,
  //       toDate
  //     );
  //     accommodationTaxes = taxSettings.accommodationTaxes;
  //   }

  //   const [featureDailyRates, ratePlanAdjustments, roomProductBasePriceSetting] = await Promise.all(
  //     [
  //       this.featurePricingService.getDailyOrDefaultFeatureRate({
  //         hotelId,
  //         roomProductIds: rfcIds,
  //         dates
  //       }),
  //       this.ratePlanAdjustmentService.getDailyOrDefaultRatePlanAdjustment({
  //         hotelId,
  //         ratePlanIds: [ratePlanId],
  //         dates
  //       }),
  //       this.roomProductRepository.findRoomProductBasePriceSetting({
  //         hotelId,
  //         roomProductIds: [...mrfcIds, ...erfcIds]
  //       })
  //     ]
  //   );

  //   const roomProductBasePriceSettingMap = groupByToMap(
  //     roomProductBasePriceSetting,
  //     (roomProduct) => roomProduct.mode
  //   );

  //   const featureBaseRoomProductIds = [
  //     ...(roomProductBasePriceSettingMap
  //       .get(RoomProductBasePriceSettingModeEnum.FEATURE_BASED)
  //       ?.map((roomProduct) => roomProduct.roomProductId) || []),
  //     ...rfcIds
  //   ];

  //   const averageRoomProductIds =
  //     roomProductBasePriceSettingMap
  //       .get(RoomProductBasePriceSettingModeEnum.AVERAGE)
  //       ?.map((roomProduct) => roomProduct.roomProductId) || [];

  //   const combinedRoomProductIds =
  //     roomProductBasePriceSettingMap
  //       .get(RoomProductBasePriceSettingModeEnum.COMBINED)
  //       ?.map((roomProduct) => roomProduct.roomProductId) || [];

  //   const results: CalculateSellingPriceResponseDto[] = [];

  //   const rfcFeatureBasePricingResults =
  //     this.roomProductPricingService.calculateDailyFeatureBasePricing({
  //       hotelId,
  //       dates,
  //       featureRates: featureDailyRates,
  //       ratePlanAdjustments: ratePlanAdjustments,
  //       ratePlanId,
  //       roomProductIds: featureBaseRoomProductIds,
  //       accommodationTaxes,
  //       pricingMethodAdjustmentUnit,
  //       pricingMethodAdjustmentValue,
  //       roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
  //     });

  //   results.push(...rfcFeatureBasePricingResults);

  //   let relatedRoomProductMappingMap: Map<string, string[]> = new Map();
  //   if (averageRoomProductIds.length > 0 || combinedRoomProductIds.length > 0) {
  //     const roomProductMappings = await this.roomProductRepository.findRoomProductMappings({
  //       hotelId,
  //       roomProductIds: [...averageRoomProductIds, ...combinedRoomProductIds]
  //     });

  //     for (const roomProductMapping of roomProductMappings) {
  //       const currentIds = relatedRoomProductMappingMap.get(roomProductMapping.roomProductId) || [];
  //       relatedRoomProductMappingMap.set(roomProductMapping.roomProductId, [
  //         ...currentIds,
  //         roomProductMapping.relatedRoomProductId
  //       ]);
  //     }
  //   }

  //   if (averageRoomProductIds && averageRoomProductIds.length > 0) {
  //     const allMrfcRelatedRoomProductIds = averageRoomProductIds
  //       .map(
  //         (roomProductId) =>
  //           roomProductMappingMap
  //             .get(roomProductId)
  //             ?.map((roomProductMapping) => roomProductMapping.relatedRoomProductId) || []
  //       )
  //       .flat();

  //     const [relatedRoomProductAvailabilities, relatedRoomProductAssignedUnits] = await Promise.all(
  //       [
  //         this.roomProductRepository.findAvailabilities({
  //           hotelId,
  //           roomProductIds: allMrfcRelatedRoomProductIds
  //         }),
  //         this.roomProductRepository.findAssignedUnits({
  //           roomProductIds: allMrfcRelatedRoomProductIds
  //         })
  //       ]
  //     );

  //     const roomUnitIds = relatedRoomProductAssignedUnits.map(
  //       (roomProductAssignedUnit) => roomProductAssignedUnit.roomUnitId
  //     );
  //     const roomUnitAvailabilities = await this.roomUnitRepository.findAvailabilities({
  //       hotelId,
  //       roomUnitIds,
  //       dates,
  //       statusList: [RoomUnitAvailabilityStatus.AVAILABLE, RoomUnitAvailabilityStatus.ASSIGNED]
  //     });

  //     const averageBasePricingRoomProductInputs = roomProducts
  //       .filter((roomProduct) => averageRoomProductIds.includes(roomProduct.id))
  //       .map((roomProduct) => {
  //         return {
  //           roomProductId: roomProduct.id,
  //           relatedRoomProductIds:
  //             roomProductMappingMap
  //               .get(roomProduct.id)
  //               ?.map((roomProductMapping) => roomProductMapping.relatedRoomProductId) || [],
  //           roomProductType: roomProduct.type
  //         };
  //       });

  //     const averagePricingResults = this.roomProductPricingService.calculateDailyAveragePricing({
  //       hotelId,
  //       roomProducts: averageBasePricingRoomProductInputs,
  //       relatedRoomProductAvailabilities,
  //       relatedRoomProductAssignedUnits,
  //       roomUnitAvailabilities,
  //       mrfcFeatureBasePricingResults: [],
  //       ratePlanAdjustments: ratePlanAdjustments,
  //       accommodationTaxes,
  //       pricingMethodAdjustmentUnit,
  //       pricingMethodAdjustmentValue,
  //       rfcFeatureBasePricingResults,
  //       dates,
  //       ratePlanId,
  //       roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
  //     });

  //     results.push(...averagePricingResults);
  //   }

  //   if (combinedRoomProductIds && combinedRoomProductIds.length > 0) {
  //     // const relatedRoomProductIds = averageRoomProductIds
  //     // .map(
  //     //   (roomProductId) =>
  //     //     roomProductMappingMap
  //     //       .get(roomProductId)
  //     //       ?.map((roomProductMapping) => roomProductMapping.relatedRoomProductId) || []
  //     // )
  //     // .flat();

  //     const averageBasePricingRoomProductInputs = roomProducts
  //       .filter((roomProduct) => averageRoomProductIds.includes(roomProduct.id))
  //       .map((roomProduct) => {
  //         return {
  //           roomProductId: roomProduct.id,
  //           relatedRoomProductIds:
  //             roomProductMappingMap
  //               .get(roomProduct.id)
  //               ?.map((roomProductMapping) => roomProductMapping.relatedRoomProductId) || [],
  //           roomProductType: roomProduct.type
  //         };
  //       });
  //     const combinedPricingResults = this.roomProductPricingService.calculateDailyCombinedPricing({
  //       hotelId,
  //       roomProducts: averageBasePricingRoomProductInputs,
  //       // relatedRoomProductAvailabilities,
  //       // relatedRoomProductAssignedUnits,
  //       // roomUnitAvailabilities,
  //       mrfcFeatureBasePricingResults: [],
  //       ratePlanAdjustments: ratePlanAdjustments,
  //       accommodationTaxes,
  //       pricingMethodAdjustmentUnit,
  //       pricingMethodAdjustmentValue,
  //       rfcFeatureBasePricingResults,
  //       dates,
  //       ratePlanId,
  //       roundingMode: ratePlan?.roundingMode || RoundingModeEnum.NO_ROUNDING
  //     });

  //     results.push(...combinedPricingResults);
  //   }

  //   const roomProductPriceSetting = await this.roomProductBasePriceSettingRepository.findOne({
  //     where: {
  //       hotelId: body.hotelId,
  //       roomProductId: body.roomProductId
  //     },
  //     select: {
  //       mode: true
  //     }
  //   });

  //   if (!roomProductPriceSetting) {
  //     throw new BadRequestException('Room Product Price Setting not found');
  //   }

  //   const { mode } = roomProductPriceSetting;

  //   switch (mode) {
  //     case RoomProductBasePriceSettingModeEnum.FEATURE_BASED:
  //       return this.calculateSellingPriceByFeature(body, options);
  //     case RoomProductBasePriceSettingModeEnum.AVERAGE:
  //       return this.calculateSellingPriceByCombined(body, options, true);
  //     case RoomProductBasePriceSettingModeEnum.COMBINED:
  //       return this.calculateSellingPriceByCombined(body, options);
  //   }
  // }

  async getExtraServiceRate(hotelId: string, extrasIds: string[]) {
    if (!extrasIds || extrasIds.length === 0) {
      return 0;
    }

    const hotelExtras = await this.hotelService.getHotelAmenities(hotelId);

    return hotelExtras.reduce((acc, curr) => {
      const amenityPrice =
        curr.hotelAmenityPrices?.find(
          (hap) => hap.hotelAgeCategory.code === HotelAgeCategoryCodeEnum.DEFAULT
        )?.price || 0;
      return acc + Number(amenityPrice);
    }, 0);
  }

  async calculateSellingPriceBySetting(
    body: CalculateSellingPriceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    }
  ): Promise<DailyFeatureCalculationResult[] | undefined> {
    const roomProductPriceSetting = await this.roomProductBasePriceSettingRepository.findOne({
      where: {
        hotelId: body.hotelId,
        roomProductId: body.roomProductId
      },
      select: {
        mode: true
      }
    });

    if (!roomProductPriceSetting) {
      throw new BadRequestException('Room Product Price Setting not found');
    }

    const { mode } = roomProductPriceSetting;

    switch (mode) {
      case RoomProductBasePriceSettingModeEnum.FEATURE_BASED:
        return this.calculateSellingPriceByFeature(body, options);
      case RoomProductBasePriceSettingModeEnum.AVERAGE:
        return this.calculateSellingPriceByCombined(body, options, true);
      case RoomProductBasePriceSettingModeEnum.COMBINED:
        return this.calculateSellingPriceByCombined(body, options);
    }
  }

  async calculateSellingPriceByFeature(
    body: CalculateSellingPriceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    }
  ): Promise<DailyFeatureCalculationResult[]> {
    try {
      const { roomProductId, fromDate, toDate, hotelId, roomProductType } = body;

      const results = await this.featureCalculationService.calculateFeatureBasedPrice({
        roomProductId,
        roomProductType,
        hotelId,
        fromDate,
        toDate,
        useDaily: true
      });

      // Ensure all results have dates (filter out base calculations)
      return results
        .filter((r) => !!r.date)
        .map((r) => ({
          date: r.date!,
          featureBasedRate: DecimalRoundingHelper.calculatePriceAdjustment(
            r.featureBasedRate,
            options?.pricingMethodAdjustmentValue || 0,
            options?.pricingMethodAdjustmentUnit || 'FIXED'
          ),
          roomProductCode: r.roomProductCode,
          roomProductName: r.roomProductName
        }));
    } catch (error) {
      this.logger.error(`Error in calculateSellingPriceByFeature: ${error.message}`, { body });
      throw error;
    }
  }

  async calculateSellingPriceByAverage(
    body: CalculateSellingPriceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    },
    isAverage: boolean = false
  ): Promise<DailyFeatureCalculationResult[]> {
    try {
      const { roomProductId, fromDate, toDate, hotelId, roomProductType } = body;

      const results = await this.featureCalculationService.calculateCombinedFeaturePrice({
        roomProductId,
        roomProductType,
        hotelId,
        fromDate,
        toDate,
        useDaily: true,
        isAverage
      });

      // Ensure all results have dates (filter out base calculations)
      return results
        .filter((r) => !!r.date)
        .map((r) => ({
          date: r.date!,
          featureBasedRate: DecimalRoundingHelper.calculatePriceAdjustment(
            r.featureBasedRate,
            options?.pricingMethodAdjustmentValue || 0,
            options?.pricingMethodAdjustmentUnit || 'FIXED'
          ),
          roomProductCode: r.roomProductCode,
          roomProductName: r.roomProductName
        }));
    } catch (error) {
      this.logger.error(`Error in calculateSellingPriceByCombined: ${error.message}`, {
        body,
        isAverage
      });
      throw error;
    }
  }

  async calculateSellingPriceByCombined(
    body: CalculateSellingPriceDto,
    options?: {
      pricingMethodAdjustmentValue?: number;
      pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
    },
    isAverage: boolean = false
  ): Promise<DailyFeatureCalculationResult[]> {
    try {
      const { roomProductId, fromDate, toDate, hotelId, roomProductType } = body;

      const results = await this.featureCalculationService.calculateCombinedFeaturePrice({
        roomProductId,
        roomProductType,
        hotelId,
        fromDate,
        toDate,
        useDaily: true,
        isAverage
      });

      // Ensure all results have dates (filter out base calculations)
      return results
        .filter((r) => !!r.date)
        .map((r) => ({
          date: r.date!,
          featureBasedRate: DecimalRoundingHelper.calculatePriceAdjustment(
            r.featureBasedRate,
            options?.pricingMethodAdjustmentValue || 0,
            options?.pricingMethodAdjustmentUnit || 'FIXED'
          ),
          roomProductCode: r.roomProductCode,
          roomProductName: r.roomProductName
        }));
    } catch (error) {
      this.logger.error(`Error in calculateSellingPriceByCombined: ${error.message}`, {
        body,
        isAverage
      });
      throw error;
    }
  }

  async getRoomProductRetailFeatures(roomProductId: string, hotelId: string) {
    try {
      return await this.featureCalculationService.getRoomProductRetailFeatures(
        roomProductId,
        hotelId
      );
    } catch (error) {
      this.logger.error(`Error in getRoomProductRetailFeatures: ${error.message}`, {
        roomProductId,
        hotelId
      });
      throw error;
    }
  }

  async calculateBaseSellingPriceByCombined(
    body: CalculateSellingPriceDto,
    isAverage: boolean = false
  ) {
    try {
      const { roomProductId, hotelId, roomProductType } = body;

      const results = await this.featureCalculationService.calculateCombinedFeaturePrice({
        roomProductId,
        roomProductType,
        hotelId,
        useDaily: false,
        isAverage
      });

      return results.length > 0 ? results[0] : { featureBasedRate: 0 };
    } catch (error) {
      this.logger.error(`Error in calculateBaseSellingPriceByCombined: ${error.message}`, {
        body,
        isAverage
      });
      throw error;
    }
  }

  async calculateBaseSellingPrice(body: CalculateSellingPriceDto) {
    try {
      const { roomProductId, hotelId, roomProductType } = body;

      const results = await this.featureCalculationService.calculateFeatureBasedPrice({
        roomProductId,
        roomProductType,
        hotelId,
        useDaily: false
      });

      return results.length > 0 ? results[0] : { featureBasedRate: 0 };
    } catch (error) {
      this.logger.error(`Error in calculateBaseSellingPrice: ${error.message}`, { body });
      throw error;
    }
  }

  async getPricingMode(query: GetRoomProductPricingModeDto) {
    const { hotelId, roomProductIds } = query;
    try {
      const roomProductBasePriceSetting = await this.roomProductBasePriceSettingRepository.find({
        where: {
          hotelId,
          roomProductId: In(roomProductIds)
        },
        select: {
          mode: true,
          fixedPrice: true,
          roomProductId: true,
          roomProduct: {
            code: true,
            type: true,
            id: true
          }
        },
        relations: ['roomProduct']
      });

      if (roomProductBasePriceSetting.length === 0) {
        return [];
      }

      // const roomProductIds = roomProductBasePriceSetting
      //   .filter((item) => item.mode === RoomProductBasePriceSettingModeEnum.FEATURE_BASED)
      //   .map((item) => item.roomProductId);

      const basePriceRates = await Promise.all(
        roomProductBasePriceSetting.map(async (item) => {
          const { mode } = item;
          switch (mode) {
            case RoomProductBasePriceSettingModeEnum.FEATURE_BASED: {
              const featureRates = await this.featurePricingService.getDefaultFeatureRate({
                roomProductIds: [item.roomProductId],
                hotelId
              });

              const featureBasePricing =
                this.calculateFeatureBasePricingService.calculateDefaultFeatureBasePricing({
                  hotelId,
                  roomProductIds: [item.roomProductId],
                  featureRates
                });

              return {
                mode,
                roomProductId: item.roomProductId,
                rate: featureBasePricing[0]?.featureBasedRate || 0,
                linkedRoomProducts: []
              };
            }
            case RoomProductBasePriceSettingModeEnum.AVERAGE: {
              const relatedRoomProductIds =
                await this.roomProductPricingService.getRelatedRoomProductIds({
                  hotelId,
                  roomProductId: item.roomProductId,
                  roomProductType: item.roomProduct.type
                });

              const [retailRoomProducts, featureRates, relatedRoomProductAssignedUnits] =
                await Promise.all([
                  this.roomProductRepository.find(
                    {
                      roomProductIds: relatedRoomProductIds
                    },
                    ['roomProduct.id', 'roomProduct.code', 'roomProduct.name', 'roomProduct.type']
                  ),
                  this.featurePricingService.getDefaultFeatureRate({
                    roomProductIds: [...relatedRoomProductIds],
                    hotelId
                  }),
                  this.roomProductRepository.findAssignedUnits({
                    roomProductIds: [...relatedRoomProductIds]
                  })
                ]);

              const featureBasePricingList =
                this.calculateFeatureBasePricingService.calculateDefaultFeatureBasePricing({
                  hotelId,
                  roomProductIds: relatedRoomProductIds,
                  featureRates
                });

              const averagePricing =
                this.calculateAveragePricingService.calculateDefaultAveragePricing({
                  hotelId,
                  roomProducts: [
                    {
                      roomProductId: item.roomProductId,
                      relatedRoomProductIds,
                      roomProductType: item.roomProduct.type
                    }
                  ],
                  rfcFeatureBasePricingResults: featureBasePricingList,
                  relatedRoomProductAssignedUnits: relatedRoomProductAssignedUnits
                });

              const retailRoomProductsMap = groupByToMapSingle(
                retailRoomProducts,
                (roomProduct) => roomProduct.id
              );

              return {
                mode,
                roomProductId: item.roomProductId,
                rate: averagePricing[0]?.featureBasedRate || 0,
                linkedRoomProducts: featureBasePricingList.map((featureBasePricing) => {
                  const retailRoomProduct = retailRoomProductsMap.get(
                    featureBasePricing.roomProductId
                  );
                  return {
                    roomProductId: featureBasePricing.roomProductId,
                    featureBasedRate: featureBasePricing.featureBasedRate,
                    roomProductCode: retailRoomProduct?.code || '',
                    roomProductName: retailRoomProduct?.name || ''
                  };
                })
              };
            }
            case RoomProductBasePriceSettingModeEnum.COMBINED: {
              const relatedRoomProductIds =
                await this.roomProductPricingService.getRelatedRoomProductIds({
                  hotelId,
                  roomProductId: item.roomProductId,
                  roomProductType: item.roomProduct.type
                });

              const [retailRoomProducts, featureRates, relatedRoomProductAssignedUnits] =
                await Promise.all([
                  this.roomProductRepository.find(
                    {
                      roomProductIds: relatedRoomProductIds
                    },
                    ['roomProduct.id', 'roomProduct.code', 'roomProduct.name', 'roomProduct.type']
                  ),
                  this.featurePricingService.getDefaultFeatureRate({
                    roomProductIds: [...relatedRoomProductIds],
                    hotelId
                  }),
                  this.roomProductRepository.findAssignedUnits({
                    roomProductIds: [...relatedRoomProductIds]
                  })
                ]);

              const featureBasePricingList =
                this.calculateFeatureBasePricingService.calculateDefaultFeatureBasePricing({
                  hotelId,
                  roomProductIds: relatedRoomProductIds,
                  featureRates
                });

              const averagePricing =
                this.calculateCombinedPricingService.calculateDefaultCombinedPricing({
                  hotelId,
                  roomProducts: [
                    {
                      roomProductId: item.roomProductId,
                      relatedRoomProductIds,
                      roomProductType: item.roomProduct.type
                    }
                  ],
                  rfcFeatureBasePricingResults: featureBasePricingList,
                  relatedRoomProductAssignedUnits: relatedRoomProductAssignedUnits
                });

              const retailRoomProductsMap = groupByToMapSingle(
                retailRoomProducts,
                (roomProduct) => roomProduct.id
              );

              return {
                mode,
                roomProductId: item.roomProductId,
                rate: averagePricing[0]?.featureBasedRate || 0,
                linkedRoomProducts: featureBasePricingList.map((featureBasePricing) => {
                  const retailRoomProduct = retailRoomProductsMap.get(
                    featureBasePricing.roomProductId
                  );
                  return {
                    roomProductId: featureBasePricing.roomProductId,
                    featureBasedRate: featureBasePricing.featureBasedRate,
                    roomProductCode: retailRoomProduct?.code || '',
                    roomProductName: retailRoomProduct?.name || ''
                  };
                })
              };
            }

            default:
              return {
                mode,
                roomProductId: item.roomProductId,
                rate: item?.fixedPrice || 0,
                linkedRoomProducts: []
              };
          }
        })
      );

      return basePriceRates || [];
    } catch (error) {
      this.logger.error(`Error getting pricing mode: ${error.message}`, error.stack);
      return [];
    }
  }
}
