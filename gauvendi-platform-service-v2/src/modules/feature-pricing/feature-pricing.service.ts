import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { HotelRetailFeatureStatusEnum } from '@src/core/entities/hotel-retail-feature.entity';
import {
  FeatureDailyAdjustment,
  FeatureDailyAdjustmentType
} from '@src/core/entities/pricing-entities/feature-daily-adjustment.entity';
import { RatePlanFeatureDailyRate } from '@src/core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import {
  RatePlanStatusEnum,
  RoomProductPricingMethodEnum,
  RoomProductStatus
} from '@src/core/enums/common';
import { Helper } from '@src/core/helper/utils';
import {
  getAllowedDateByDayOfWeek,
  getAllowedDateBySessionOfYear
} from '@src/core/utils/datetime.util';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import { DeleteResult, FindOptionsRelations, FindOptionsSelect, InsertResult } from 'typeorm';
import { FeatureRepository } from '../feature/feature.repository';
import { RoomProductPricingMethodDetailService } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan/room-product-rate-plan.repository';
import { CreateOrUpdateFeatureDailyAdjustmentsDto } from './dtos/create-or-update-feature-daily-adjustment.dto';
import { RemoveFeatureDailyAdjustmentsDto } from './dtos/remove-feature-daily-adjustment.dto';
import Decimal from 'decimal.js';

export interface GetDailyOrDefaultFeatureRateFilter {
  roomProductIds: string[];
  hotelId: string;
  fromDate: string;
  toDate: string;
}

export interface GetDailyOrDefaultFeatureRateByProductResult {
  date: string;
  featureId: string;
  quantity: number;
  featureRate: number;
  roomProductId: string;
}

export interface GetDailyOrDefaultFeatureRateByRatePlanResult {
  date: string;
  featureId: string;
  featureRate: number;
  code: string;
  name: string;
  ratePlanId: string;
}

export interface GetDefaultFeatureRateFilter {
  roomProductIds: string[];
  hotelId: string;
}

export interface GetDefaultFeatureRateResult {
  featureId: string;
  quantity: number;
  featureRate: number;
  roomProductId: string;
}

export type FeatureDailyAdjustmentRateListDto = {
  id: string;
  displaySequence: number;
  name: string;
  code: string;
  hotelRetailCategory: {
    id: string;
    code: string;
    name: string;
  };
  baseRate: number;
  roomProducts: {
    id: string;
    code: string;
    name: string;
  }[];
  dailyRateUnitList: {
    date: string;
    rate: number | null;
  }[];
};

@Injectable()
export class FeaturePricingService {
  private readonly logger = new Logger(FeaturePricingService.name);
  constructor(
    private readonly featureRepository: FeatureRepository,
    private readonly roomProductRepository: RoomProductRepository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,

    @Inject(forwardRef(() => RoomProductPricingMethodDetailService))
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService
  ) {}

  async getFeatureDailyAdjustments(filter: {
    hotelId: string;

    fromDate: string;
    toDate: string;
  }): Promise<FeatureDailyAdjustmentRateListDto[]> {
    const { hotelId, fromDate, toDate } = filter;

    const dates = Helper.generateDateRange(fromDate, toDate);
    const [hotelRetailFeatures, roomProductRetailFeatures, featureDailyAdjustments] =
      await Promise.all([
        this.featureRepository.findFeatures(
          {
            hotelId,
            status: HotelRetailFeatureStatusEnum.ACTIVE,
            relations: {
              hotelRetailCategory: true
            }
          },
          {
            id: true,
            name: true,
            code: true,
            baseRate: true,
            displaySequence: true,
            hotelRetailCategory: {
              id: true,
              code: true,
              name: true
            }
          }
        ),
        this.roomProductRepository.findRetailFeatures(
          {
            hotelId,
            relations: {
              roomProduct: true
            },
            isHasBaseRate: true
          },
          {
            id: true,
            retailFeatureId: true,
            roomProductId: true,
            quantity: true,
            roomProduct: {
              id: true,
              code: true,
              name: true
            }
          }
        ),
        this.featureRepository.findFeatureDailyAdjustments({
          hotelId,
          dates
        })
      ]);

    const roomProductRetailFeatureMap = groupByToMap(
      roomProductRetailFeatures,
      (r) => r.retailFeatureId
    );
    const featureDailyAdjustmentMap = groupByToMapSingle(
      featureDailyAdjustments,
      (f) => `${f.featureId}_${f.date}`
    );

    const result: FeatureDailyAdjustmentRateListDto[] = [];

    for (const hotelRetailFeature of hotelRetailFeatures) {
      const findRoomProductRetailFeature = roomProductRetailFeatureMap.get(hotelRetailFeature.id);

      result.push({
        id: hotelRetailFeature.id,
        name: hotelRetailFeature.name,
        code: hotelRetailFeature.code,
        displaySequence: hotelRetailFeature.displaySequence,
        roomProducts:
          findRoomProductRetailFeature?.map((r) => ({
            id: r.roomProductId,
            code: r.roomProduct.code,
            name: r.roomProduct.name
          })) || [],
        baseRate: hotelRetailFeature.baseRate,
        hotelRetailCategory: hotelRetailFeature.hotelRetailCategory,
        dailyRateUnitList: dates.map((date) => {
          const featureDailyAdjustment = featureDailyAdjustmentMap.get(
            `${hotelRetailFeature.id}_${date}`
          );
          return {
            date: date,
            type: featureDailyAdjustment?.adjustmentType,
            rate: featureDailyAdjustment ? Number(featureDailyAdjustment.adjustmentValue) : null
          };
        })
      });
    }
    return result.sort((a, b) => a.displaySequence - b.displaySequence);
  }

  async getDailyOrDefaultFeatureRate(filter: {
    roomProductIds: string[];
    hotelId: string;
    dates: string[];
  }): Promise<GetDailyOrDefaultFeatureRateByProductResult[]> {
    const { roomProductIds, hotelId, dates } = filter;
    // return this.calculateDailyFeaturePrice({ roomProductId, hotelId, fromDate, toDate });

    const [roomProductRetailFeatures] = await Promise.all([
      this.getRoomProductRetailFeatures({
        roomProductIds,
        hotelId
      })
    ]);

    const featureIds = [...new Set(roomProductRetailFeatures.map((fa) => fa.retailFeatureId))];

    const featureAdjustments = await this.featureRepository.findFeatureDailyAdjustments({
      hotelId,
      featureIds,
      dates: dates.filter((date) => date)
    });

    // const roomProductFeatureAdjustmentMap = groupByToMapSingle(
    //   roomProductFeatureAdjustments,
    //   (fa) => `${fa.featureId}_${fa.roomProductId}_${fa.date}`
    // );
    const featureAdjustmentMap = groupByToMapSingle(
      featureAdjustments,
      (fa) => `${fa.featureId}_${fa.date}`
    );

    const result: {
      date: string;
      featureId: string;
      quantity: number;
      featureRate: number;
      roomProductId: string;
    }[] = [];

    for (const roomProductRetailFeature of roomProductRetailFeatures) {
      const feature = roomProductRetailFeature.retailFeature;
      for (const date of dates) {
        let featureRate = Number(feature.baseRate) || 0;
        const featureAdjustment = featureAdjustmentMap.get(`${feature.id}_${date}`);
        if (featureAdjustment) {
          if (featureAdjustment.adjustmentType === FeatureDailyAdjustmentType.Fixed) {
            featureRate =
              featureRate +
              (featureAdjustment.adjustmentValue ? Number(featureAdjustment.adjustmentValue) : 0);
          } else if (
            featureAdjustment.adjustmentType === FeatureDailyAdjustmentType.PricePercentage
          ) {
            featureRate =
              featureRate *
              (1 +
                (featureAdjustment.adjustmentValue
                  ? Number(featureAdjustment.adjustmentValue) / 100
                  : 0));
          }
        }
        // const roomProductFeatureAdjustment = roomProductFeatureAdjustmentMap.get(
        //   `${roomProductRetailFeature.retailFeatureId}_${roomProductRetailFeature.roomProductId}_${date}`
        // );
        // if (roomProductFeatureAdjustment) {
        //   featureRate =
        //     featureRate +
        //     (roomProductFeatureAdjustment.rateAdjustment
        //       ? Number(roomProductFeatureAdjustment.rateAdjustment)
        //       : 0);
        // }
        result.push({
          date,
          featureId: feature.id,
          quantity: roomProductRetailFeature.quantity || 1,
          featureRate,
          roomProductId: roomProductRetailFeature.roomProductId
        });
      }
    }
    return result;
  }

  async getDailyOrDefaultFeatureRateByRatePlan(filter: {
    ratePlanIds?: string[];
    hotelId: string;
    dates: string[];
  }): Promise<GetDailyOrDefaultFeatureRateByRatePlanResult[]> {
    const { ratePlanIds = [], hotelId, dates } = filter;
    const [featureAdjustments, hotelRetailFeatures] = await Promise.all([
      this.getRatePlanFeatureDailyRates({
        ratePlanIds,
        dates
      }),
      this.featureRepository.findFeatures(
        {
          hotelId,
          status: HotelRetailFeatureStatusEnum.ACTIVE
        },
        {
          id: true,
          code: true,
          baseRate: true,
          name: true
        }
      )
    ]);

    const ratePlanFeatureAdjustmentMap = groupByToMapSingle(
      featureAdjustments,
      (fa) => `${fa.featureId}_${fa.ratePlanId}_${fa.date}`
    );

    const result: GetDailyOrDefaultFeatureRateByRatePlanResult[] = [];
    for (const ratePlanId of ratePlanIds) {
      for (const date of dates) {
        for (const hotelRetailFeature of hotelRetailFeatures) {
          const dailyRateAdjustment = ratePlanFeatureAdjustmentMap.get(
            `${hotelRetailFeature.id}_${ratePlanId}_${date}`
          );

          let featureRate = hotelRetailFeature.baseRate;
          if (dailyRateAdjustment) {
            featureRate = dailyRateAdjustment.rate ? Number(dailyRateAdjustment.rate) : 0;
          }

          result.push({
            date,
            code: hotelRetailFeature.code,
            name: hotelRetailFeature.name,
            featureId: hotelRetailFeature.id,
            featureRate: featureRate,
            ratePlanId: ratePlanId
          });
        }
      }
    }
    return result;
  }

  async createOrUpdateFeatureDailyAdjustments(
    payload: CreateOrUpdateFeatureDailyAdjustmentsDto
  ): Promise<InsertResult | boolean> {
    const {
      dayList,
      sessionOfYearList,
      featureId,
      fromDate,
      hotelId,
      adjustmentValue,
      adjustmentType,
      toDate
    } = payload;

    let allowedDays: string[] = [];
    if (dayList && dayList.length > 0) {
      allowedDays = getAllowedDateByDayOfWeek(fromDate, toDate, dayList);
    }

    if (sessionOfYearList && sessionOfYearList.length > 0) {
      allowedDays = getAllowedDateBySessionOfYear(fromDate, toDate, sessionOfYearList);
    }

    if (allowedDays.length === 0) {
      return false;
    }

    const newFeatureDailyAdjustments: FeatureDailyAdjustment[] = [];
    for (const date of allowedDays) {
      const featureDailyAdjustment = new FeatureDailyAdjustment();
      featureDailyAdjustment.hotelId = hotelId;
      featureDailyAdjustment.featureId = featureId;
      featureDailyAdjustment.adjustmentValue = adjustmentValue.toString();
      featureDailyAdjustment.adjustmentType = adjustmentType;
      featureDailyAdjustment.date = date;
      newFeatureDailyAdjustments.push(featureDailyAdjustment);
    }

    const result = await this.featureRepository.upsertFeatureDailyAdjustments(
      newFeatureDailyAdjustments
    );
    this.triggerPricingAfterFeatureAdjustmentChange({
      hotelId,
      featureIds: [featureId],
      fromDate,
      toDate
    });
    return result;
  }

  async removeFeatureDailyAdjustments(
    payload: RemoveFeatureDailyAdjustmentsDto
  ): Promise<DeleteResult | boolean> {
    const { hotelId, featureId, fromDate, toDate } = payload;
    const dates = Helper.generateDateRange(fromDate, toDate);
    const result = await this.featureRepository.removeFeatureDailyAdjustments({
      hotelId,
      featureId,
      dates
    });

    this.triggerPricingAfterFeatureAdjustmentChange({
      hotelId,
      featureIds: [featureId],
      fromDate,
      toDate
    });

    return result;
  }

  async getDefaultFeatureRate(filter: { roomProductIds: string[]; hotelId: string }) {
    const { roomProductIds, hotelId } = filter;
    const roomProductRetailFeatures = await this.getRoomProductRetailFeatures({
      roomProductIds,
      hotelId
    });

    const result: {
      featureId: string;
      quantity: number;
      featureRate: number;
      roomProductId: string;
    }[] = [];

    for (const roomProductRetailFeature of roomProductRetailFeatures) {
      const feature = roomProductRetailFeature.retailFeature;

      let featureRate = Number(feature.baseRate) || 0;
      result.push({
        featureId: feature.id,
        quantity: roomProductRetailFeature.quantity || 1,
        featureRate,
        roomProductId: roomProductRetailFeature.roomProductId
      });
    }
    return result;
  }

  async getRoomProductFeatureRateAdjustments(input: {
    hotelId: string;
    roomProductIds?: string[];
    dates: string[];
  }): Promise<RoomProductFeatureRateAdjustment[]> {
    const { hotelId, roomProductIds, dates } = input;
    return await this.featureRepository.findRoomProductFeatureRateAdjustments({
      hotelId,
      roomProductIds,
      dates
    });
  }

  async getRatePlanFeatureDailyRates(input: {
    ratePlanIds: string[];
    dates: string[];
  }): Promise<RatePlanFeatureDailyRate[]> {
    const { ratePlanIds, dates } = input;
    return await this.featureRepository.findRatePlanFeatureDailyRates({
      ratePlanIds,
      dates
    });
  }

  async getRoomProductRetailFeatures(
    input: {
      roomProductIds?: string[];
      hotelId: string;
      relations?: FindOptionsRelations<RoomProductRetailFeature>;
    },
    select?: FindOptionsSelect<RoomProductRetailFeature>
  ): Promise<RoomProductRetailFeature[]> {
    const { roomProductIds, hotelId, relations } = input;

    return await this.roomProductRepository.findRetailFeatures(
      {
        roomProductIds,
        hotelId,
        isHasBaseRate: true,
        relations
      },
      {
        id: true,
        retailFeatureId: true,
        roomProductId: true,
        quantity: true,
        roomProduct: {
          id: true,
          code: true,
          name: true
        },
        retailFeature: {
          id: true,
          baseRate: true,
          name: true
        }
      }
    );
  }

  async getMethodDetailByFeature(input: {
    featureIds: string[];
    hotelId: string;
  }): Promise<RoomProductPricingMethodDetail[]> {
    const { featureIds, hotelId } = input;
    const roomProductRetailFeatures = await this.roomProductRepository.findRetailFeatures({
      hotelId,
      retailFeatureIds: featureIds
    });

    const roomProductIds = Array.from(
      new Set(roomProductRetailFeatures.map((item) => item.roomProductId))
    );

    const methodDetails =
      await this.roomProductRatePlanRepository.findRoomProductPricingMethodDetail({
        hotelId,
        roomProductIds,
        pricingMethods: [RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING],
        ratePlanStatusList: [RatePlanStatusEnum.ACTIVE],
        roomProductStatusList: [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT]
      });
    return methodDetails;
  }

  async triggerPricingAfterFeatureAdjustmentChange(input: {
    hotelId: string;
    featureIds: string[];
    fromDate: string;
    toDate: string;
  }): Promise<void> {
    const { hotelId, featureIds, fromDate, toDate } = input;
    const methodDetails = await this.getMethodDetailByFeature({
      featureIds,
      hotelId
    });

    const roomProductIds = Array.from(new Set(methodDetails.map((item) => item.roomProductId)));
    const roomProducts = await this.roomProductRepository.find(
      {
        hotelId,
        roomProductIds
      },
      ['roomProduct.id', 'roomProduct.type']
    );

    const roomProductMap = groupByToMapSingle(roomProducts, (item) => item.id);

    await Promise.all(
      methodDetails.map((item) => {
        const roomProduct = roomProductMap.get(item.roomProductId);

        if (!roomProduct) {
          return;
        }

        return this.roomProductPricingMethodDetailService.triggerFeatureBasedPricing({
          methodDetail: item,
          isPushToPms: true,
          fromDate,
          toDate
        });
      })
    );
  }

  async migrateFeatureDailyAdjustment(input: { hotelId: string }) {
    const { hotelId } = input;
    const BATCH_SIZE = 1000;
    let skip = 0;
    let hasMore = true;
    let total = 0;

    while (hasMore) {
      const roomProductFeatureRateAdjustments =
        await this.featureRepository.findRoomProductFeatureRateAdjustments({
          hotelId,
          take: BATCH_SIZE,
          skip
        });

      const roomProductRetailFeatureIds = Array.from(
        new Set(roomProductFeatureRateAdjustments.map((item) => item.featureId))
      );
      const roomProductRetailFeatures = await this.roomProductRepository.findRetailFeatures({
        ids: roomProductRetailFeatureIds
      });
      const roomProductRetailFeatureMap = groupByToMapSingle(
        roomProductRetailFeatures,
        (item) => item.id
      );

      if (roomProductFeatureRateAdjustments.length === 0) {
        hasMore = false;
        break;
      }

      const groupedMap = new Map<string, RoomProductFeatureRateAdjustment[]>();

      for (const item of roomProductFeatureRateAdjustments) {
        const retailFeatureId = roomProductRetailFeatureMap.get(item.featureId)?.retailFeatureId;

        if (!retailFeatureId) continue;

        const key = `${hotelId}_${retailFeatureId}_${item.date}`;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, []);
        }
        groupedMap.get(key)!.push(item);
      }

      const featureDailyAdjustments: FeatureDailyAdjustment[] = [];

      for (const [key, items] of groupedMap) {
        const firstItem = items[0];
        const {
          featureId,
          date,
          rateAdjustment: firstRateAdjustment,
          rateOriginal: firstRateOriginal
        } = firstItem;

        const isConsistent = items.every(
          (item) =>
            Number(item.rateAdjustment) === Number(firstRateAdjustment) &&
            Number(item.rateOriginal) === Number(firstRateOriginal)
        );

        if (!isConsistent) {
          this.logger.warn(
            `Migration conflict for feature ${featureId} on ${date}: Inconsistent rateAdjustment or rateOriginal.`
          );
        }

        let adjustmentValue = Decimal(firstRateAdjustment).sub(firstRateOriginal);

        const roomProductRetailFeature = roomProductRetailFeatureMap.get(featureId);
        if (!roomProductRetailFeature) {
          continue;
        }

        if (roomProductRetailFeature.quantity) {
          adjustmentValue = adjustmentValue.div(roomProductRetailFeature.quantity);
        }

        const featureDailyAdjustment = new FeatureDailyAdjustment();
        featureDailyAdjustment.hotelId = hotelId;
        featureDailyAdjustment.featureId = roomProductRetailFeature.retailFeatureId;
        featureDailyAdjustment.date = date;
        featureDailyAdjustment.adjustmentValue = adjustmentValue.toString();
        featureDailyAdjustment.adjustmentType = FeatureDailyAdjustmentType.Fixed;

        featureDailyAdjustments.push(featureDailyAdjustment);
      }

      if (featureDailyAdjustments.length > 0) {
        await this.featureRepository.upsertFeatureDailyAdjustments(featureDailyAdjustments);
        total += featureDailyAdjustments.length;
        this.logger.log(`Migrated ${featureDailyAdjustments.length} feature daily adjustments`);
      }

      if (roomProductFeatureRateAdjustments.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        skip += BATCH_SIZE;
      }
    }

    this.logger.log(
      `Migrated ${skip} room product feature rate adjustments to ${total} feature daily adjustments`
    );

    return { total };
  }
}
