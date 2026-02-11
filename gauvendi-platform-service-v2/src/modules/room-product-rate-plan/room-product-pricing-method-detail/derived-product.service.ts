import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductDailySellingPrice } from 'src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductPricingMethodDetail } from 'src/core/entities/room-product-pricing-method-detail.entity';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { Between, In, Repository } from 'typeorm';
import { PricingDataSourceEnum } from '../room-product-selling-price/room-product-selling-price.dto';
import { RoomProductSellingPriceService } from '../room-product-selling-price/room-product-selling-price.service';
import { RoomProductPricingUtils } from './room-product-pricing.utils';

@Injectable()
export class DerivedProductService {
  private readonly logger = new Logger(DerivedProductService.name);

  constructor(
    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    private readonly roomProductSellingPriceService: RoomProductSellingPriceService
  ) {}

  private derivedProductVisitedSet = new Set();
  private derivedProductDepth = 0;

  async derivedProduct(input: {
    roomProductPricingMethodDetail: RoomProductPricingMethodDetail;
    fromDate: string;
    toDate: string;
  }) {
    const { roomProductPricingMethodDetail, fromDate, toDate } = input;


    // Prevent infinite loops: max depth of 10 levels
    const MAX_DEPTH = 10;
    if (this.derivedProductDepth > MAX_DEPTH) {
      this.logger.warn(
        `derivedProduct: Max depth (${MAX_DEPTH}) reached for ratePlanId: ${roomProductPricingMethodDetail.ratePlanId}, roomProductId: ${roomProductPricingMethodDetail.roomProductId}. Stopping to prevent infinite loop.`
      );
      return;
    }

    // Create unique key for this rate plan + room product combination
    const visitKey = `${roomProductPricingMethodDetail.hotelId}-${roomProductPricingMethodDetail.ratePlanId}-${roomProductPricingMethodDetail.roomProductId}-${roomProductPricingMethodDetail.pricingMethod}-${fromDate}-${toDate}`;

    // Prevent circular dependencies: if we've already processed this combination in this call chain
    if (this.derivedProductVisitedSet.has(visitKey)) {
      this.logger.warn(
        `derivedProduct: Circular dependency detected for ratePlanId: ${roomProductPricingMethodDetail.ratePlanId}, roomProductId: ${roomProductPricingMethodDetail.roomProductId}. Skipping to prevent infinite loop.`
      );
      return;
    }

    // Mark this combination as visited
    this.derivedProductVisitedSet.add(visitKey);
    try {
      const roomProduct = await this.roomProductRepository.findOne({
        where: { id: roomProductPricingMethodDetail.roomProductId },
        select: ['type']
      });
      if (!roomProduct) {
        this.logger.warn(
          `Room product not found for id ${roomProductPricingMethodDetail.roomProductId}`
        );
        return;
      }
      const { hotelId, roomProductId, ratePlanId: baseRatePlanId } = roomProductPricingMethodDetail;

      if (!hotelId) {
        this.logger.warn('Hotel ID is not found');
        return;
      }

      if (!roomProductPricingMethodDetail) {
        this.logger.warn('No pricing method found');
        return;
      }

      const targetBasePriceMap: Record<string, RoomProductDailySellingPrice[]> = {};

      const dates = Helper.generateDateRange(fromDate, toDate);

      let targetRatePlanIds: string[] = [];
      let currentRatePlanIds: string[] = [];

      // find base setting derived rate plan ids
      const baseSettingDerivedRatePlanId = await this.ratePlanDerivedSettingRepository.findOne({
        where: {
          hotelId,
          ratePlanId: baseRatePlanId
        }
      });

      if (baseSettingDerivedRatePlanId?.ratePlanId) {
        // it means this rate plan is derived rate plan
        // need to update this rate plan derived pricing
        targetRatePlanIds = [baseSettingDerivedRatePlanId.derivedRatePlanId];
        currentRatePlanIds.push(baseRatePlanId);
      } else {
        // it means this rate plan is base rate plan
        // find all derived rate plan ids
        // need to update all derived rate plan pricing
        const derivedRatePlanIds = await this.ratePlanDerivedSettingRepository.find({
          where: {
            hotelId,
            derivedRatePlanId: baseRatePlanId
          }
        });
        derivedRatePlanIds.forEach((derivedRatePlanId) => {
          currentRatePlanIds.push(derivedRatePlanId.ratePlanId);
        });
        targetRatePlanIds = [baseRatePlanId];
      }

      if (targetRatePlanIds.length === 0) {
        this.logger.warn('Target rate plan IDs are not found');
        return;
      }

      if (currentRatePlanIds.length === 0) {
        this.logger.warn('Current rate plan IDs are not found');
        return;
      }

      // find room product pricing method details
      const roomProductPricingMethodDetails =
        await this.roomProductPricingMethodDetailRepository.find({
          where: {
            hotelId,
            roomProductId: roomProductId,
            ratePlanId: In(currentRatePlanIds)
          }
        });

      if (roomProductPricingMethodDetails.length === 0) {
        this.logger.warn('Room product pricing method details are not found');
        return;
      }

      // create map for lookup room product pricing method details
      const roomProductPricingMethodDetailsMap = new Map<string, RoomProductPricingMethodDetail>();
      roomProductPricingMethodDetails.forEach((roomProductPricingMethodDetail) => {
        roomProductPricingMethodDetailsMap.set(
          roomProductPricingMethodDetail.ratePlanId,
          roomProductPricingMethodDetail
        );
      });

      // start get base price from primary rate plan
      const basePrices = await this.roomProductDailySellingPriceRepository.find({
        where: {
          hotelId,
          ratePlanId: In(targetRatePlanIds),
          roomProductId: roomProductId,
          date: Between(fromDate, toDate)
        },
        select: {
          roomProductId: true,
          date: true,
          ratePlanAdjustments: true,
          basePrice: true,
          ratePlanId: true
        },
        order: {
          date: 'ASC'
        }
      });

      basePrices.forEach((basePrice) => {
        const dto: any = {
          roomProductId: basePrice.roomProductId,
          date: basePrice.date,
          ratePlanAdjustments: basePrice.ratePlanAdjustments,
          basePrice: basePrice.basePrice
        };

        if (!targetBasePriceMap[basePrice.date]) {
          targetBasePriceMap[basePrice.date] = [];
        }
        targetBasePriceMap[basePrice.date].push(dto);
      });

      // Process each target rate plan separately
      const results: any[] = [];

      // find rate plan derived setting
      const ratePlanDerivedSettings = await this.ratePlanDerivedSettingRepository.find({
        where: {
          hotelId,
          derivedRatePlanId: In(targetRatePlanIds),
          ratePlanId: In(currentRatePlanIds)
        },
        select: {
          ratePlanId: true
        }
      });

      const derivedRatePlanIds = ratePlanDerivedSettings.map(
        (ratePlanDerivedSetting) => ratePlanDerivedSetting.ratePlanId
      );

      for (const derivedRatePlanId of derivedRatePlanIds) {
        const targetInputs: any[] = [];

        const roomProductPricingMethodDetail =
          roomProductPricingMethodDetailsMap.get(derivedRatePlanId);
        const adjustmentValue = roomProductPricingMethodDetail?.pricingMethodAdjustmentValue;
        const adjustmentUnit = roomProductPricingMethodDetail?.pricingMethodAdjustmentUnit;

        for (const date of dates) {
          const targetBasePrice = targetBasePriceMap[date]?.find(
            (price) => price.roomProductId === roomProductId && price.date === date
          );

          let relatedPrices =
            (targetBasePrice?.basePrice || 0) + (targetBasePrice?.ratePlanAdjustments || 0);
          if (!relatedPrices) {
            relatedPrices = 0;
          }

          const basePrice = DecimalRoundingHelper.calculatePriceAdjustment(
            relatedPrices,
            adjustmentValue || 0,
            adjustmentUnit || 'FIXED'
          );

          targetInputs.push({
            hotelId,
            roomProductId,
            ratePlanId: derivedRatePlanId,
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
          this.logger.debug(`No filtered inputs found for room product`);
          continue;
        }

        const result = await this.roomProductSellingPriceService.calculateSellingPrice({
          hotelId,
          roomProductId,
          roomProductType: roomProduct.type,
          ratePlanId: derivedRatePlanId, // Use rate plan ID for calculate
          fromDate,
          toDate,
          pricingDataSource: PricingDataSourceEnum.DERIVED,
          derivedBasePrices: filteredInputs
        });

        const response = await this.roomProductSellingPriceService.insertSellingPrices(result, {
          hotelId,
          roomProductId,
          ratePlanId: derivedRatePlanId, // Use rate plan ID for insert
          fromDate,
          toDate
        });

        results.push(result);
      }

      if (results.length === 0) {
        this.logger.debug(
          `No results generated for room product ${roomProductPricingMethodDetail.roomProductId}, base rate plan ${roomProductPricingMethodDetail.ratePlanId}, dates ${fromDate} to ${toDate}`
        );
        return;
      }

      this.logger.log(
        `Derived product for room product ${roomProductPricingMethodDetail.roomProductId}, base rate plan ${roomProductPricingMethodDetail.ratePlanId} → ${targetRatePlanIds.length} target rate plans, dates ${fromDate} to ${toDate} completed`
      );
      return results;
    } catch (error) {
      this.logger.error('Error in derived product', error);
      throw error;
    } finally {
      // Remove from visited set when done (allows processing in different call chains)
      this.derivedProductVisitedSet.delete(visitKey);
    }
  }
}
