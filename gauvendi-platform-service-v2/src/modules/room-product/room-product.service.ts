import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { GOOGLE_INTERFACE_SERVICE } from '@src/core/client/google-interface-client.module';
import { ResponseContentStatusEnum } from '@src/core/dtos/common.dto';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelStandardFeature } from '@src/core/entities/hotel-standard-feature.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RestrictionAutomationSetting } from '@src/core/entities/restriction-automation-setting.entity';
import { RoomProductDailyBasePrice } from '@src/core/entities/room-product-daily-base-price.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from '@src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import { RoomProductTypeMapping } from '@src/core/entities/room-product-type-mapping.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  BadRequestException,
  InternalServerErrorException,
  ValidationException
} from '@src/core/exceptions';
import { PricingCalculateService } from '@src/core/modules/pricing-calculate/pricing-calculate.service';
import { CalculateAveragePricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-average-pricing.service';
import { CalculateCombinedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-combined-pricing.service';
import { CalculateFeatureBasePricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-feature-base-pricing.service';
import { CalculateFixedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-fixed-pricing.service';
import { CalculateReversedPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/calculate-reversed-pricing.service';
import { RoomProductPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.service';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { FeaturePricingService } from '@src/modules/feature-pricing/feature-pricing.service';
import { Queue } from 'bullmq';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { Restriction } from 'src/core/entities/restriction.entity';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from 'src/core/entities/room-product-base-price-setting.entity';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { RoomProductImage } from 'src/core/entities/room-product-image.entity';
import { RoomProductMapping } from 'src/core/entities/room-product-mapping.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import {
  DistributionChannel,
  HotelRetailFeatureStatusEnum,
  RatePlanPricingMethodologyEnum,
  ResponseStatusEnum,
  RoomProductBasePriceSettingModeEnum,
  RoomProductPricingMethodEnum,
  RoomProductStatus,
  RoomProductType
} from 'src/core/enums/common';
import { JOB_NAMES, QUEUE_NAMES } from 'src/core/queue/queue.constant';
import { S3Service } from 'src/core/s3/s3.service';
import {
  DataSource,
  FindOptionsSelect,
  ILike,
  In,
  IsNull,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Raw,
  Repository
} from 'typeorm';
import { PmsService } from '../pms/pms.service';
import { RatePlanSellabilityService } from '../rate-plan-sellability/services/rate-plan-sellability.service';
import { RoomProductAvailabilityService } from '../room-product-availability/room-product-availability.service';
import { RoomProductPricingMethodDetailService } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { FeatureCalculationService } from '../room-product-rate-plan/room-product-selling-price/feature-calculation.service';
import { RoomProductSellingPriceService } from '../room-product-rate-plan/room-product-selling-price/room-product-selling-price.service';
import { RoomUnitUtil } from '../room-unit/room-unit.util';
import { TranslationService } from '../translation';
import { RoomProductRfcService } from './room-product-rfc.service';
import {
  AssignRoomProductToRatePlanDto,
  BulkUpsertRoomProductRetailFeaturesDto,
  CloneRoomProductInput,
  CppProductCartListFilterDto,
  CreateRoomProductBasePriceSettingDto,
  CreateRoomProductDto,
  CreateRoomProductExtraOccupancyRatesDto,
  CreateRoomProductExtrasDto,
  CreateRoomProductRoomMappingDto,
  DeleteRoomProductDto,
  DeleteRoomProductExtrasDto,
  GetRatePlanRfcAssignmentListDto,
  ReorderRoomProductImageDto,
  RoomProductItemDto,
  RoomProductListQueryDto,
  RoomProductQueryDto,
  RoomProductRelation,
  SHOW_MODE_ENUM,
  UnassignAllRoomProductFromRatePlanDto,
  UnassignRoomProductFromRatePlanDto,
  UpdateRoomProductDto,
  UpdateRoomProductExtrasDto,
  UpdateRoomProductImageDto,
  UploadRoomProductImagesFromGalleryDto
} from './room-product.dto';
import { RoomProductRepository } from './room-product.repository';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomProductService {
  private readonly logger = new Logger(RoomProductService.name);

  constructor(
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    private readonly roomProductCustomRepository: RoomProductRepository,

    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(Restriction, DbName.Postgres)
    private readonly restrictionRepository: Repository<Restriction>,

    @InjectRepository(RoomProductDailyAvailability, DbName.Postgres)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(RoomProductExtra, DbName.Postgres)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,

    @InjectRepository(RoomProductImage, DbName.Postgres)
    private readonly roomProductImageRepository: Repository<RoomProductImage>,

    @InjectRepository(RoomProductBasePriceSetting, DbName.Postgres)
    private readonly roomProductBasePriceSettingRepository: Repository<RoomProductBasePriceSetting>,

    @InjectRepository(RoomProductExtraOccupancyRate, DbName.Postgres)
    private readonly roomProductExtraOccupancyRateRepository: Repository<RoomProductExtraOccupancyRate>,

    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,

    @InjectRepository(RoomProductStandardFeature, DbName.Postgres)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    @InjectRepository(RoomProductMappingPms, DbName.Postgres)
    private readonly roomProductMappingPmsRepository: Repository<RoomProductMappingPms>,

    private readonly pmsService: PmsService,

    private readonly s3Service: S3Service,

    private readonly configService: ConfigService,

    private readonly featureCalculationService: FeatureCalculationService,

    private readonly roomProductSellingPriceService: RoomProductSellingPriceService,

    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,

    @InjectQueue(QUEUE_NAMES.ROOM_PRODUCT_PRICING)
    private readonly roomProductPricingQueue: Queue,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly roomProductRfcService: RoomProductRfcService,
    private readonly translationService: TranslationService,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RoomProductRatePlanAvailabilityAdjustment, DbName.Postgres)
    private readonly roomProductRatePlanAvailabilityAdjustmentRepository: Repository<RoomProductRatePlanAvailabilityAdjustment>,

    @InjectRepository(HotelTaxSetting, DbName.Postgres)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>,
    private readonly ratePlanSellabilityService: RatePlanSellabilityService,

    @InjectRepository(HotelStandardFeature, DbName.Postgres)
    private readonly hotelStandardFeatureRepository: Repository<HotelStandardFeature>,

    private readonly pricingCalculateService: PricingCalculateService,

    private readonly roomProductAvailabilityService: RoomProductAvailabilityService,

    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,

    @Inject(GOOGLE_INTERFACE_SERVICE) private readonly googleService: ClientProxy,

    private readonly featurePricingService: FeaturePricingService,
    private readonly roomProductPricingService: RoomProductPricingService,
    private readonly calculateFeatureBasePricingService: CalculateFeatureBasePricingService,
    private readonly calculateCombinedPricingService: CalculateCombinedPricingService,
    private readonly calculateAveragePricingService: CalculateAveragePricingService,
    private readonly calculateReversedPricingService: CalculateReversedPricingService,
    private readonly calculateFixedPricingService: CalculateFixedPricingService
  ) {
    // this.migrateMissingStandardFeature();
  }

  async migrateMissingStandardFeature() {
    const roomProducts = await this.roomProductRepository.find();
    const roomProductStandardFeatures = await this.roomProductStandardFeatureRepository.find({
      where: { roomProductId: In(roomProducts.map((roomProduct) => roomProduct.id)) }
    });
    const roomProductStandardFeaturesMap = new Map<string, RoomProductStandardFeature[]>();
    for (const roomProductStandardFeature of roomProductStandardFeatures) {
      roomProductStandardFeaturesMap.set(roomProductStandardFeature.roomProductId, [
        ...(roomProductStandardFeaturesMap.get(roomProductStandardFeature.roomProductId) || []),
        roomProductStandardFeature
      ]);
    }

    for (let roomProduct of roomProducts) {
      const roomProductStandardFeatures = roomProductStandardFeaturesMap.get(roomProduct.id) || [];
      if (!roomProductStandardFeatures?.length) {
        const hotelStandardFeatures = await this.hotelStandardFeatureRepository.find({
          where: { hotelId: roomProduct.hotelId }
        });
        // missing standard features
        const newRoomProductStandardFeatures = hotelStandardFeatures.map((feature) =>
          this.roomProductStandardFeatureRepository.create({
            hotelId: roomProduct.hotelId,
            roomProductId: roomProduct.id,
            standardFeatureId: feature.id
          })
        );
        console.log('MISSING - ', roomProduct.name);
        console.log('CREATING: ', newRoomProductStandardFeatures.length);
        if (newRoomProductStandardFeatures.length) {
          await this.roomProductStandardFeatureRepository.save(newRoomProductStandardFeatures);
          console.log('DONE - ' + roomProduct.name);
        } else {
          console.log('NOT FOUND any Hotel standard features for hotelID: ', roomProduct.hotelId);
        }
      }
    }
    return {
      status: ResponseStatusEnum.SUCCESS,
      message: 'Missing standard features migrated successfully',
      data: null
    };
  }

  async unassignAllRoomProductFromRatePlan(payload: UnassignAllRoomProductFromRatePlanDto) {
    const { hotelId, ratePlanId, allowUnassignedAllDerived, roomProductIds } = payload;
    try {
      const roomProducts = await this.roomProductRatePlanRepository.find({
        where: {
          hotelId,
          ratePlanId: ratePlanId,
          roomProductId:
            roomProductIds && roomProductIds?.length > 0 ? In(roomProductIds) : undefined
        },
        select: {
          roomProductId: true
        }
      });
      const result = await this.unassignRoomProductFromRatePlan({
        hotelId,
        ratePlanId,
        rfcIdList: roomProducts.map((roomProduct) => roomProduct.roomProductId),
        allowUnassignedAllDerived
      });

      const roomProductIdSet = [
        ...new Set(roomProducts.map((roomProduct) => roomProduct.roomProductId))
      ];

      // trigger update whip room product
      this.triggerUpdateWhipRoomProduct(hotelId, roomProductIdSet);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to unassign all room product from rate plan',
        error.message
      );
    }
  }

  async unassignRoomProductFromRatePlan(payload: UnassignRoomProductFromRatePlanDto) {
    const { hotelId, ratePlanId, rfcIdList } = payload;
    const allowUnassignedAllDerived = payload.allowUnassignedAllDerived;
    const transaction = this.dataSource.createQueryRunner();
    await transaction.connect();
    await transaction.startTransaction();
    try {
      const manager = transaction.manager;

      // Check if rate plan exists
      const ratePlan = await manager
        .createQueryBuilder(RatePlan, 'rp')
        .leftJoinAndSelect('rp.derivedSetting', 'ds')
        .leftJoinAndSelect('rp.baseSetting', 'bs')
        .where('rp.hotelId = :hotelId', { hotelId })
        .andWhere('rp.id = :ratePlanId', { ratePlanId })
        .select(['rp.id', 'ds.ratePlanId', 'bs.derivedRatePlanId'])
        .getOne();

      if (!ratePlan) {
        throw new BadRequestException('Rate plan not found');
      }

      // Delete room product rate plan and room product pricing method detail atomically
      const ratePlanIds = [
        ratePlanId,
        ...(allowUnassignedAllDerived
          ? ratePlan.derivedSetting?.map((ds) => ds.ratePlanId) || []
          : []),
        ...(allowUnassignedAllDerived ? [ratePlan.baseSetting?.derivedRatePlanId] : [])
      ].filter((id) => !!id);

      // find all derived rate plan ids
      if (allowUnassignedAllDerived && ratePlan.baseSetting?.derivedRatePlanId) {
        const derivedRatePlans = await manager.find(RatePlanDerivedSetting, {
          where: {
            hotelId,
            derivedRatePlanId: ratePlan.baseSetting.derivedRatePlanId,
            ratePlanId: Not(ratePlanId)
          }
        });
        for (const derivedRatePlan of derivedRatePlans || []) {
          if (ratePlanIds.includes(derivedRatePlan.ratePlanId)) {
            continue;
          }

          ratePlanIds.push(derivedRatePlan.ratePlanId);
        }
      }

      if (ratePlan.derivedSetting?.length) {
        for (const derivedSetting of ratePlan.derivedSetting) {
          ratePlanIds.push(derivedSetting.ratePlanId);
        }
      }

      if (!ratePlanIds?.length) {
        throw new BadRequestException('Rate plan ids not found');
      }

      const roomProductRatePlans = await manager.find(RoomProductRatePlan, {
        where: {
          hotelId,
          ratePlanId: In(ratePlanIds),
          roomProductId: In(rfcIdList)
        },
        select: {
          id: true
        }
      });

      const roomProductRatePlanIds = roomProductRatePlans.map(
        (roomProductRatePlan) => roomProductRatePlan.id
      );

      const [deleteResultPricingMethodDetail, deleteResultExtraOccupancyRateAdjustment] =
        await Promise.all([
          manager.delete(RoomProductPricingMethodDetail, {
            hotelId,
            ratePlanId: In(ratePlanIds),
            roomProductId: In(rfcIdList)
          }),
          manager.delete(RoomProductRatePlanExtraOccupancyRateAdjustment, {
            hotelId,
            roomProductRatePlanId: In(roomProductRatePlanIds)
          }),
          // delete room product rate plan availability adjustments
          manager.delete(RoomProductRatePlanAvailabilityAdjustment, {
            hotelId,
            roomProductRatePlanId: In(roomProductRatePlanIds),
            ratePlanId: In(ratePlanIds)
          })
        ]);

      const deleteResult = manager.delete(RoomProductRatePlan, {
        hotelId,
        ratePlanId: In(ratePlanIds),
        roomProductId: In(rfcIdList)
      });

      await transaction.commitTransaction();

      // trigger update whip room product
      if (rfcIdList.length > 0) {
        this.triggerUpdateWhipRoomProduct(hotelId, rfcIdList);
      }

      return deleteResult;
    } catch (error) {
      await transaction.rollbackTransaction();
      this.logger.error('unassign room product from rate plan error: ' + error.message);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'unassign room product from rate plan error: ' + error.message
      );
    } finally {
      await transaction.release();
    }
  }

  async assignRoomProductToRatePlan(payload: AssignRoomProductToRatePlanDto) {
    const { hotelId, ratePlanId, rfcIdList } = payload;
    const transaction = this.dataSource.createQueryRunner();
    await transaction.connect();
    await transaction.startTransaction();

    try {
      const manager = transaction.manager;
      const [
        ratePlan,
        roomProductList,
        pricingModeList,
        roomProductMappings,
        roomProductRatePlanList,
        ratePlanDerivedSetting,
        derivedRatePlanList,
        roomProductPricingMethodDetailsWithPmsPricing
      ] = await Promise.all([
        manager.findOne(RatePlan, {
          where: {
            hotelId,
            id: ratePlanId
          },
          select: {
            id: true,
            name: true,
            code: true,
            pricingMethodology: true
          }
        }),

        manager.find(RoomProduct, {
          where: {
            hotelId,
            id: In(rfcIdList)
          },
          select: {
            id: true,
            code: true,
            name: true
          }
        }),

        this.roomProductSellingPriceService.getPricingMode({
          hotelId,
          roomProductIds: rfcIdList
        }),

        // find room product mapping for reversed product
        manager.find(RoomProductMapping, {
          where: {
            relatedRoomProductId: In(rfcIdList),
            hotelId
          }
        }),

        // find room product rate plan for reversed product
        manager.find(RoomProductRatePlan, {
          where: {
            ratePlanId: ratePlanId,
            hotelId
          }
        }),

        // find rate plan derived setting
        manager.findOne(RatePlanDerivedSetting, {
          where: {
            hotelId,
            ratePlanId
          },
          relations: ['derivedRatePlan']
        }),

        // find all rate plan by derived rate plan id
        manager.find(RatePlanDerivedSetting, {
          where: {
            hotelId,
            derivedRatePlanId: ratePlanId
          },
          relations: ['ratePlan']
        }),

        // find room product pricing method details
        manager.find(RoomProductPricingMethodDetail, {
          where: {
            hotelId,
            ratePlanId: ratePlanId,
            pricingMethod: RoomProductPricingMethodEnum.PMS_PRICING
          }
        })
      ]);

      if (!ratePlan) {
        throw new BadRequestException('Rate plan not found');
      }

      // find target room product mrfc id list
      const mrfcRoomProductIds = roomProductMappings.map((mapping) => mapping.roomProductId);
      const isPmsReversedRoomProduct = roomProductRatePlanList.some(
        (rprp: RoomProductRatePlan) =>
          rprp.roomProductId === mrfcRoomProductIds[0] &&
          roomProductPricingMethodDetailsWithPmsPricing.some(
            (detail) => detail.roomProductId === rprp.roomProductId
          )
      );
      const isDerivedRatePlan = !ratePlanDerivedSetting;

      const existsRoomProductPricingMethodDetails = ratePlanDerivedSetting
        ? await manager.find(RoomProductPricingMethodDetail, {
            where: {
              hotelId,
              roomProductId: In(rfcIdList),
              ratePlanId: ratePlanDerivedSetting.derivedRatePlanId
            }
          })
        : [];

      const existsRoomProductPricingMethodDetailMaps = groupByToMapSingle(
        existsRoomProductPricingMethodDetails,
        (detail) => `${detail.roomProductId}-${detail.ratePlanId}`
      );

      const roomProductRatePlanCreateList: RoomProductRatePlan[] = [];
      for (const rfcId of rfcIdList) {
        const foundRoomProduct = roomProductList.find((roomProduct) => roomProduct.id === rfcId);
        let foundPricingMode;

        if (pricingModeList && pricingModeList?.some((pricingMode) => pricingMode !== null)) {
          foundPricingMode = pricingModeList.find(
            (pricingMode) => pricingMode?.roomProductId === rfcId
          );
        }

        // create room product rate plan for base rate plan
        const roomProductRatePlan = manager.create(RoomProductRatePlan, {
          hotelId,
          ratePlanId,
          roomProductId: rfcId,
          // combine room product code - rate plan code
          name: `${foundRoomProduct?.code || ''} - ${ratePlan.code}`?.trim(),
          code: `${foundRoomProduct?.code || ''} - ${ratePlan.code}`?.trim(),
          totalBaseRate: foundPricingMode?.rate || 0
        });
        roomProductRatePlanCreateList.push(roomProductRatePlan);

        if (!isDerivedRatePlan) {
          const currentRatePlan = ratePlanDerivedSetting?.derivedRatePlan;
          const existingRoomProductRatePlan = await manager.findOne(RoomProductRatePlan, {
            where: {
              hotelId,
              ratePlanId: currentRatePlan.id,
              roomProductId: rfcId
            }
          });
          if (existingRoomProductRatePlan) {
            continue;
          }
          const roomProductRatePlanForDerivedRatePlan = manager.create(RoomProductRatePlan, {
            hotelId,
            ratePlanId: currentRatePlan.id,
            roomProductId: rfcId,
            // combine room product code - rate plan code
            name: `${foundRoomProduct?.code || ''} - ${currentRatePlan.code}`?.trim(),
            code: `${foundRoomProduct?.code || ''} - ${currentRatePlan.code}`?.trim(),
            totalBaseRate: foundPricingMode?.rate || 0,
            isSellable: false
          });
          roomProductRatePlanCreateList.push(roomProductRatePlanForDerivedRatePlan);
          continue;
        }
        // create room product rate plan for derived rate plan
        for (const derivedRatePlan of derivedRatePlanList) {
          const currentRatePlan = derivedRatePlan.ratePlan;
          const roomProductRatePlanForDerivedRatePlan = manager.create(RoomProductRatePlan, {
            hotelId,
            ratePlanId: derivedRatePlan.ratePlanId,
            roomProductId: rfcId,
            // combine room product code - rate plan code
            name: `${foundRoomProduct?.code || ''} - ${currentRatePlan.code}`?.trim(),
            code: `${foundRoomProduct?.code || ''} - ${currentRatePlan.code}`?.trim(),
            totalBaseRate: foundPricingMode?.rate || 0,
            isSellable: true
          });
          roomProductRatePlanCreateList.push(roomProductRatePlanForDerivedRatePlan);
        }
      }
      // create room product pricing method details list based on pricing methodology
      // meed to fix -> for derived pricing, we need to find target rate plan id from rate plan base setting

      const baseSetting = ratePlanDerivedSetting?.id ? ratePlanDerivedSetting : null;
      const targetRatePlanId =
        ratePlan.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING
          ? baseSetting?.derivedRatePlanId
          : null;

      const roomProductPricingMethodDetailsList: RoomProductPricingMethodDetail[] = [];
      const pricingMethodFunc = (r: RatePlan) => {
        return r.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING
          ? RoomProductPricingMethodEnum.DERIVED
          : RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING;
      };
      for (const rfcId of rfcIdList) {
        const roomProductPricingMethodDetail = manager.create(RoomProductPricingMethodDetail, {
          hotelId,
          roomProductId: rfcId,
          ratePlanId: ratePlanId,
          targetRatePlanId: targetRatePlanId || undefined,
          pricingMethod: pricingMethodFunc(ratePlan)
        });
        roomProductPricingMethodDetailsList.push(roomProductPricingMethodDetail);

        // create room product pricing method detail for base rate plan
        if (!isDerivedRatePlan) {
          const currentRatePlan = ratePlanDerivedSetting?.derivedRatePlan;

          const existsRoomProductPricingMethodDetail = existsRoomProductPricingMethodDetailMaps.get(
            `${rfcId}-${currentRatePlan.id}`
          );

          if (!existsRoomProductPricingMethodDetail) {
            const roomProductPricingMethodDetail = manager.create(RoomProductPricingMethodDetail, {
              hotelId,
              roomProductId: rfcId,
              ratePlanId: currentRatePlan.id,
              targetRatePlanId: undefined,
              pricingMethod: pricingMethodFunc(currentRatePlan)
            });
            roomProductPricingMethodDetailsList.push(roomProductPricingMethodDetail);
          }

          continue;
        }

        // create room product pricing method detail for derived rate plan
        for (const derivedRatePlan of derivedRatePlanList) {
          const currentRatePlan = derivedRatePlan.ratePlan;
          const roomProductPricingMethodDetailForDerivedRatePlan = manager.create(
            RoomProductPricingMethodDetail,
            {
              hotelId,
              roomProductId: rfcId,
              ratePlanId: derivedRatePlan.ratePlanId,
              targetRatePlanId: derivedRatePlan.derivedRatePlanId,
              pricingMethod: pricingMethodFunc(currentRatePlan)
            }
          );
          roomProductPricingMethodDetailsList.push(
            roomProductPricingMethodDetailForDerivedRatePlan
          );
        }
      }

      const pricingRatePlans = derivedRatePlanList
        .filter(
          (derivedRatePlan) =>
            derivedRatePlan.ratePlan.pricingMethodology ===
            RatePlanPricingMethodologyEnum.FEATURE_BASED_PRICING
        )
        .map((derivedRatePlan) => derivedRatePlan.ratePlan);

      if (ratePlan.pricingMethodology === RatePlanPricingMethodologyEnum.FEATURE_BASED_PRICING) {
        pricingRatePlans.push(ratePlan);
      }

      if (ratePlan.pricingMethodology === RatePlanPricingMethodologyEnum.FEATURE_BASED_PRICING) {
        const relatedRoomProductIds = roomProductMappings.map(
          (mapping) => mapping.relatedRoomProductId
        );

        const roomProductMappingMapByRelatedRoomProductId = groupByToMapSingle(
          roomProductMappings,
          (mapping) => mapping.relatedRoomProductId
        );
        for (const rfcId of rfcIdList) {
          for (const pricingRatePlan of pricingRatePlans) {
            if (relatedRoomProductIds.includes(rfcId)) {
              const targetRoomProductId =
                roomProductMappingMapByRelatedRoomProductId.get(rfcId)?.roomProductId;

              if (targetRoomProductId) {
                const isPmsPricing = roomProductPricingMethodDetailsWithPmsPricing.some(
                  (item) => item.roomProductId === targetRoomProductId
                );
                if (isPmsPricing) {
                  const findRoomProductPricingMethodDetailsList =
                    roomProductPricingMethodDetailsList.filter(
                      (detail) =>
                        detail.roomProductId === rfcId && detail.ratePlanId === pricingRatePlan.id
                    );

                  for (const findRoomProductPricingMethodDetail of findRoomProductPricingMethodDetailsList) {
                    findRoomProductPricingMethodDetail.pricingMethod =
                      RoomProductPricingMethodEnum.REVERSED_PRICING;
                  }
                }
              }
            }
          }
        }
      }

      const [resultRoomProductRatePlan, resultRoomProductPricingMethodDetail] = await Promise.all([
        manager.upsert(RoomProductRatePlan, roomProductRatePlanCreateList, {
          conflictPaths: ['hotelId', 'roomProductId', 'ratePlanId']
        }),
        manager.upsert(RoomProductPricingMethodDetail, roomProductPricingMethodDetailsList, {
          conflictPaths: ['hotelId', 'roomProductId', 'ratePlanId']
        })
      ]);

      // TODO: Push to metasearch queue
      // Logic at RfcRatePlanServiceImpl.java line 382 Service Platform v1
      await transaction.commitTransaction();

      // find room product rate plan to trigger pricing
      let raplanIds: string[] = [
        ratePlanId,
        ...(isDerivedRatePlan
          ? derivedRatePlanList.map((r) => r.ratePlanId)
          : [ratePlanDerivedSetting?.derivedRatePlanId])
      ];
      raplanIds = [...new Set(raplanIds)];
      const roomProductMethodDetails = await this.roomProductPricingMethodDetailRepository.find({
        where: {
          hotelId,
          ratePlanId: In(raplanIds),
          roomProductId: In(rfcIdList)
        }
      });
      // trigger pricing
      await Promise.all(
        roomProductMethodDetails.map((roomProductMethodDetail) => {
          const {
            hotelId,
            roomProductId,
            ratePlanId,
            pricingMethod,
            targetRoomProductId,
            targetRatePlanId,
            pricingMethodAdjustmentValue,
            pricingMethodAdjustmentUnit
          } = roomProductMethodDetail;

          switch (pricingMethod) {
            case RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING:
              return this.roomProductPricingMethodDetailService.calculateFeatureBasedPricing({
                hotelId,
                roomProductId,
                type: RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING,
                ratePlanId,
                unit: pricingMethodAdjustmentUnit,
                value: pricingMethodAdjustmentValue?.toString()
              });

            case RoomProductPricingMethodEnum.DERIVED:
              return this.roomProductPricingMethodDetailService.derivedProduct({
                hotelId,
                roomProductId,
                targetRatePlanId,
                ratePlanId,
                type: RoomProductPricingMethodEnum.DERIVED,
                value: pricingMethodAdjustmentValue?.toString(),
                unit: pricingMethodAdjustmentUnit
              });
            case RoomProductPricingMethodEnum.PMS_PRICING:
              return this.roomProductPricingMethodDetailService.bulkReversedProduct(hotelId);
          }
        })
      );

      return resultRoomProductRatePlan;
    } catch (error) {
      await transaction.rollbackTransaction();
      this.logger.error('assign room product to rate plan error: ' + error.message);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'assign room product to rate plan error: ' + error.message
      );
    } finally {
      await transaction.release();
    }
  }

  async getRatePlanRfcAssignmentList(payload: GetRatePlanRfcAssignmentListDto) {
    try {
      const { hotelId, ratePlanIdList, showMode, sort, pageIndex, pageSize, type } = payload;

      const queryBuilder = this.roomProductRepository
        .createQueryBuilder('roomProduct')
        .select([
          'roomProduct.id',
          'roomProduct.name',
          'roomProduct.code',
          'roomProduct.type',
          'roomProduct.status',
          'roomProductRatePlans.ratePlanId',
          'roomProductRatePlans.code',
          'ratePlan.id',
          'ratePlan.name',
          'ratePlan.code'
        ])
        .where('roomProduct.hotelId = :hotelId', { hotelId })
        .andWhere('roomProduct.deletedAt IS NULL')
        .leftJoin('roomProduct.roomProductRatePlans', 'roomProductRatePlans')
        .leftJoin('roomProductRatePlans.ratePlan', 'ratePlan');

      if (showMode === SHOW_MODE_ENUM.ASSIGNED) {
        queryBuilder.andWhere('roomProductRatePlans.ratePlanId IN (:...ratePlanIdList)', {
          ratePlanIdList
        });
      } else if (showMode === SHOW_MODE_ENUM.ALL) {
        queryBuilder.andWhere('roomProductRatePlans.ratePlanId IS NOT NULL');
      } else if (showMode === SHOW_MODE_ENUM.UNASSIGNED) {
        // Simple NOT IN query for unassigned room products
        queryBuilder.andWhere(
          'roomProduct.id NOT IN (' +
            'SELECT room_product_id FROM room_product_rate_plan ' +
            'WHERE hotel_id = :hotelId AND rate_plan_id IN (:...ratePlanIdList)' +
            ')',
          {
            ratePlanIdList,
            hotelId
          }
        );
      }

      if (type) {
        queryBuilder.andWhere('roomProduct.type = :type', { type: type });
      }

      if (sort && Array.isArray(sort)) {
        sort.forEach((item) => {
          const [field, direction] = item.split(':');

          if (field in RoomProduct) {
            queryBuilder.addOrderBy(
              `roomProduct.${field}`,
              direction.toUpperCase() as 'ASC' | 'DESC'
            );
          }
        });
      }

      if (pageIndex && pageSize) {
        queryBuilder.skip(pageIndex * pageSize).take(pageSize);
      }

      const [roomProducts, total] = await queryBuilder.getManyAndCount();

      // transform DTO
      const data = roomProducts.map((roomProduct) => {
        const foundRatePlanList = roomProduct?.roomProductRatePlans?.filter((ratePlan) =>
          ratePlanIdList.includes(ratePlan.ratePlanId)
        );

        return {
          id: roomProduct.id,
          name: roomProduct.name,
          code: roomProduct.code,
          type: roomProduct.type,
          status: roomProduct.status,
          rfcRatePlanList:
            foundRatePlanList?.length > 0
              ? foundRatePlanList?.map((ratePlan) => ({
                  ratePlanId: ratePlan.ratePlanId,
                  code: ratePlan.code
                }))
              : null
        };
      });

      // Sort by type priority (MRFCs, ERFCs, RFCs), then by name
      const typeOrder = {
        [RoomProductType.MRFC]: 1,
        [RoomProductType.ERFC]: 2,
        [RoomProductType.RFC]: 3
      };

      const sortedData = data.sort((a, b) => {
        const typeComparison = (typeOrder[a.type] || 999) - (typeOrder[b.type] || 999);
        if (typeComparison !== 0) {
          return typeComparison;
        }
        return a.name.localeCompare(b.name);
      });

      return {
        data: sortedData,
        total: total
      };
    } catch (error) {
      this.logger.error('get rate plan rfc assignment list error: ' + error.message);
      throw new InternalServerErrorException(
        'get rate plan rfc assignment list error: ' + error.message
      );
    }
  }

  async migrateTranslation() {
    try {
      // Get all translation data in a single optimized query
      const allTranslationData = await this.roomProductRepository.manager
        .createQueryBuilder()
        .select([
          'rp.id as room_product_id',
          'rp.code as room_product_code',
          'tdc.attribute as attribute',
          'til.code as locale_code',
          'tec.available_attribute_key'
        ])
        .from('room_product', 'rp')
        .innerJoin('translation_dynamic_content', 'tdc', 'tdc.entity_id = rp.id')
        .leftJoin('translation_hotel_language_bundle', 'thlb', 'tdc.hlb_id = thlb.id')
        .leftJoin('translation_i18n_locale', 'til', 'thlb.i18n_locale_id = til.id')
        .leftJoin('translation_entity_config', 'tec', 'tdc.etc_id = tec.id')
        .where('rp.translations = :emptyArray', { emptyArray: '[]' })
        .andWhere('tec.code = :configCode', { configCode: 'RFC' }) // Assuming RFC is for room products
        .andWhere('tdc.deleted_at IS NULL')
        .andWhere('thlb.deleted_at IS NULL')
        .andWhere('til.deleted_at IS NULL')
        .getRawMany();

      this.logger.log(`Found ${allTranslationData.length} translation records to process`);

      // Group translation data by room product ID to preserve original logic
      const translationsByRoomProduct = new Map<
        string,
        {
          roomProductCode: string;
          translationData: any[];
        }
      >();

      for (const data of allTranslationData) {
        if (!data.room_product_id) {
          continue;
        }

        if (!translationsByRoomProduct.has(data.room_product_id)) {
          translationsByRoomProduct.set(data.room_product_id, {
            roomProductCode: data.room_product_code,
            translationData: []
          });
        }

        translationsByRoomProduct.get(data.room_product_id)!.translationData.push(data);
      }

      this.logger.log(
        `Found ${translationsByRoomProduct.size} room products to migrate translations`
      );

      // Process each room product with the exact same logic as before
      for (const [
        roomProductId,
        { roomProductCode, translationData }
      ] of translationsByRoomProduct) {
        if (translationData.length === 0) {
          continue;
        }

        // Build translations array - keeping exact same logic
        const translations: any[] = [];

        for (const data of translationData) {
          if (!data.attribute || !data.locale_code) {
            continue;
          }

          // Convert locale code (e.g., "es-ES") to language code (e.g., "ES")
          const languageCode = this.extractLanguageCode(data.locale_code);

          if (!languageCode) {
            continue;
          }

          // Parse the attribute JSON and build translation object
          const translationObj: any = {
            languageCode: languageCode
          };

          // Parse available attribute keys to know what fields to extract
          const availableKeys = data.available_attribute_key
            ? data.available_attribute_key.split(';').map((key) => key.trim()?.toLowerCase())
            : ['name', 'description'];
          // Extract translation data from attribute JSON
          const attributeObject = JSON.parse(data.attribute);
          if (Array.isArray(attributeObject)) {
            for (const attr of attributeObject) {
              if (attr && typeof attr === 'object') {
                for (const key of availableKeys) {
                  if (attr[key] || attr[`${key}`.toLowerCase()] || attr[key.toUpperCase()]) {
                    const value =
                      attr[key] || attr[`${key}`.toLowerCase()] || attr[key.toUpperCase()];
                    translationObj[`${key}`.toLowerCase()] = value;
                  } else if (attr['key']) {
                    translationObj[`${attr['key']}`.toLowerCase()] = attr['value'] || '';
                  }
                }
              }
            }
          } else if (attributeObject && typeof attributeObject === 'object') {
            for (const key of availableKeys) {
              if (
                attributeObject[key] ||
                attributeObject[`${key}`.toLowerCase()] ||
                attributeObject[key.toUpperCase()]
              ) {
                translationObj[`${key}`.toLowerCase()] = attributeObject[`${key}`.toLowerCase()];
              }
            }
          }

          // Only add translation if it has content beyond just languageCode
          if (Object.keys(translationObj).length > 1) {
            translations.push(translationObj);
          }
        }

        // Update room product with translations
        if (translations.length > 0) {
          await this.roomProductRepository
            .createQueryBuilder()
            .update(RoomProduct)
            .set({ translations: translations })
            .where('id = :id', { id: roomProductId })
            .execute();

          this.logger.log(
            `Migrated ${translations.length} translations for room product ${roomProductCode}`
          );
        }
      }

      this.logger.log('Translation migration completed successfully');
      return true;
    } catch (error) {
      this.logger.error('migrate translation error: ' + error.message);
      throw new InternalServerErrorException('migrate translation error: ' + error.message);
    }
  }

  private extractLanguageCode(localeCode: string): string | null {
    if (!localeCode) return null;

    // Convert locale codes like "es-ES", "en-US", "fr-FR" to language codes like "ES", "EN", "FR"
    const parts = localeCode.split('-');
    if (parts.length >= 2) {
      const languageCode = parts[1].toUpperCase();

      // Validate against LanguageCodeEnum
      const validLanguageCodes = ['EN', 'FR', 'DE', 'IT', 'ES', 'NL', 'AR'];
      if (validLanguageCodes.includes(languageCode)) {
        return languageCode;
      }
    }

    // Fallback: try first part if it matches valid language codes
    const firstPart = parts[0].toUpperCase();
    const validLanguageCodes = ['EN', 'FR', 'DE', 'IT', 'ES', 'NL', 'AR'];
    if (validLanguageCodes.includes(firstPart)) {
      return firstPart;
    }

    return null;
  }

  async getRoomProducts(filter: RoomProductListQueryDto) {
    const {
      hotelId,
      status,
      distributionChannel,
      type,
      code,
      ids,
      relations,
      limit,
      offset,
      isPresignedUrl,
      roomUnitIds,
      retailFeatureIds,
      name,
      isGroupByMrfcCluster,
      isGetAllRoomProductRetailFeatures
    } = filter;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      let where: any = {
        hotelId,
        deletedAt: IsNull()
      };

      if (status) {
        where.status = In(status);
      }

      if (type) {
        // because type separate type and rfcAllocationSetting by _
        const typesPattern = type?.map((type) => type.split('-'));
        const types = Array.from(new Set(typesPattern?.map((type) => type[0]))).filter(Boolean);
        const rfcAllocationSettings = Array.from(
          new Set(typesPattern?.map((type) => type[1]))
        ).filter(Boolean);

        if (types?.length > 0) {
          where.type = In(types);
        }

        if (rfcAllocationSettings?.length > 0) {
          where.rfcAllocationSetting = In(rfcAllocationSettings);
        }
      }

      if (code?.length) {
        where.code = In(code);
      }

      if (ids) {
        where.id = In(ids);
      }

      if (name) {
        // Convert to OR conditions
        where = name.map((n) => ({
          ...where,
          name: ILike(`%${n}%`)
        }));
      }

      // Note: Relations filtering should not be done in where clause for TypeORM
      // This was causing empty results - relations should be handled in the relations array

      // Build dynamic select based on relations
      const select: FindOptionsSelect<RoomProduct> = {
        id: true,
        hotelId: true,
        status: true,
        type: true,
        code: true,
        name: true,
        distributionChannel: true,
        description: true,
        numberOfBedrooms: true,
        extraAdult: true,
        extraChildren: true,
        space: true,
        featureString: true,
        capacityDefault: true,
        maximumAdult: true,
        maximumKid: true,
        maximumPet: true,
        capacityExtra: true,
        extraBedAdult: true,
        extraBedKid: true,
        travelTag: true,
        occasion: true,
        createdAt: true,
        updatedAt: true,
        rfcAllocationSetting: true,
        isLockedUnit: true
      };

      let roomProducts: RoomProductItemDto[];
      let count = 0;

      // Handle distributionChannel array filtering separately due to PostgreSQL array column
      if (distributionChannel?.length) {
        const queryBuilder = this.roomProductRepository.createQueryBuilder('roomProduct');

        // Apply all where conditions except distributionChannel
        Object.keys(where).forEach((key) => {
          if (where[key] !== undefined) {
            if (key === 'deletedAt') {
              queryBuilder.andWhere(`roomProduct.${key} IS NULL`);
            } else if (typeof where[key] === 'object' && where[key]._type === 'ilike') {
              queryBuilder.andWhere(`roomProduct.${key} ILIKE :${key}`, {
                [key]: where[key]._value
              });
            } else if (typeof where[key] === 'object' && where[key]._type === 'in') {
              queryBuilder.andWhere(`roomProduct.${key} IN (:...${key})`, {
                [key]: where[key]._value
              });
            } else if (Array.isArray(where[key])) {
              queryBuilder.andWhere(`roomProduct.${key} IN (:...${key})`, { [key]: where[key] });
            } else {
              queryBuilder.andWhere(`roomProduct.${key} = :${key}`, { [key]: where[key] });
            }
          }
        });

        // Handle distributionChannel with overlap operator
        queryBuilder.andWhere('roomProduct.distributionChannel && :distributionChannel', {
          distributionChannel
        });

        queryBuilder
          .select(Object.keys(select).map((key) => `roomProduct.${key}`))
          .orderBy('roomProduct.createdAt', 'DESC');

        count = await queryBuilder.getCount();

        if (limit) {
          queryBuilder.take(limit);
        }

        if (offset) {
          queryBuilder.skip(offset);
        }

        roomProducts = await queryBuilder.getMany();
      } else {
        // Use regular find when no distributionChannel filtering needed
        const findOptions: any = {
          where,
          select,
          order: { createdAt: 'DESC' }
        };

        count = await this.roomProductRepository.count(findOptions);
        if (limit) {
          findOptions.take = limit;
        }

        if (offset) {
          findOptions.skip = offset;
        }

        roomProducts = await this.roomProductRepository.find(findOptions);
      }

      if (roomProducts.length === 0) {
        this.logger.warn(`No room products found for hotel ${hotelId} with given criteria`);
        return {
          data: [],
          total: 0
        };
      }

      const roomProductIds = roomProducts.map((roomProduct) => roomProduct.id);
      const noRfcRoomProductIds =
        type && type.includes(RoomProductType.RFC)
          ? (
              await this.roomProductRepository.find({
                where: {
                  hotelId,
                  type: Not(RoomProductType.RFC),
                  deletedAt: IsNull()
                },
                select: {
                  id: true
                }
              })
            ).map((roomProduct) => roomProduct.id)
          : [];

      // Prepare concurrent operations
      const concurrentOperations: Array<{
        type: string;
        promise: Promise<any>;
      }> = [];

      concurrentOperations.push({
        type: 'pricingMode',
        promise: this.roomProductSellingPriceService.getPricingMode({
          hotelId,
          roomProductIds
        })
      });

      // Add all relation queries to concurrent operations
      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_IMAGES)) {
        concurrentOperations.push({
          type: 'images',
          promise: this.roomProductImageRepository.find({
            where: { roomProductId: In(roomProductIds) },
            select: {
              id: true,
              roomProductId: true,
              imageUrl: true,
              description: true,
              sequence: true
            }
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_EXTRAS)) {
        concurrentOperations.push({
          type: 'extras',
          promise: this.roomProductExtraRepository.find({
            where: { roomProductId: In(roomProductIds) },
            select: {
              id: true,
              type: true,
              roomProductId: true,
              extrasId: true,
              extra: {
                id: true,
                name: true,
                code: true
              }
            },
            relations: ['extra']
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_ASSIGNED_UNITS)) {
        concurrentOperations.push({
          type: 'assignedUnits',
          promise: this.roomProductAssignedUnitRepository.find({
            where: {
              roomProductId: In(roomProductIds),
              ...(roomUnitIds && roomUnitIds.length > 0 ? { roomUnitId: In(roomUnitIds) } : {})
            },
            select: {
              id: true,
              roomProductId: true,
              roomUnitId: true,
              roomUnit: {
                id: true,
                roomNumber: true
              }
            },
            relations: ['roomUnit']
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_RETAIL_FEATURES)) {
        concurrentOperations.push({
          type: 'retailFeatures',
          promise: this.roomProductRetailFeatureRepository.find({
            where: {
              retailFeature: {
                status: HotelRetailFeatureStatusEnum.ACTIVE
              },
              roomProductId: In(roomProductIds),
              ...(isGetAllRoomProductRetailFeatures ? {} : { quantity: MoreThanOrEqual(1) }),
              ...(retailFeatureIds && retailFeatureIds.length > 0
                ? { retailFeatureId: In(retailFeatureIds) }
                : {})
            },
            select: {
              id: true,
              roomProductId: true,
              retailFeatureId: true,
              quantity: true
            }
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_RETAIL_FEATURES_RETAIL_FEATURE)) {
        concurrentOperations.push({
          type: 'retailFeaturesWithDetails',
          promise: this.roomProductRetailFeatureRepository.find({
            where: {
              retailFeature: {
                status: HotelRetailFeatureStatusEnum.ACTIVE
              },
              roomProductId: In(roomProductIds),
              ...(isGetAllRoomProductRetailFeatures ? {} : { quantity: MoreThanOrEqual(1) }),
              ...(retailFeatureIds && retailFeatureIds.length > 0
                ? { retailFeatureId: In(retailFeatureIds) }
                : {})
            },
            select: {
              id: true,
              roomProductId: true,
              retailFeatureId: true,
              quantity: true,
              retailFeature: {
                id: true,
                imageUrl: true,
                code: true,
                name: true,
                baseRate: true,
                hotelRetailCategoryId: true,
                measurementUnit: true,
                hotelRetailCategory: {
                  code: true,
                  name: true,
                  displaySequence: true
                }
              }
            },
            relations: ['retailFeature', 'retailFeature.hotelRetailCategory']
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_RATE_PLANS)) {
        concurrentOperations.push({
          type: 'ratePlans',
          promise: this.roomProductRatePlanRepository.find({
            where: { roomProductId: In(roomProductIds) },
            select: {
              id: true,
              roomProductId: true,
              ratePlanId: true,
              ratePlan: {
                id: true,
                name: true,
                code: true
              }
            },
            relations: ['ratePlan']
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_MAPPINGS)) {
        concurrentOperations.push({
          type: 'mappings',
          promise: this.roomProductMappingRepository.find({
            where: { roomProductId: In([...roomProductIds, ...noRfcRoomProductIds]) },
            select: {
              id: true,
              roomProductId: true,
              relatedRoomProductId: true,
              roomProduct: {
                id: true,
                name: true,
                code: true
              },
              relatedRoomProduct: {
                id: true,
                name: true,
                code: true
              }
            },
            relations: ['relatedRoomProduct', 'roomProduct']
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_EXTRA_OCCUPANCY_RATES)) {
        concurrentOperations.push({
          type: 'extraOccupancyRates',
          promise: this.roomProductExtraOccupancyRateRepository.find({
            where: { roomProductId: In(roomProductIds) },
            select: {
              id: true,
              roomProductId: true,
              extraPeople: true,
              extraRate: true
            }
          })
        });
      }

      if (relations?.includes(RoomProductRelation.ROOM_PRODUCT_STANDARD_FEATURES)) {
        concurrentOperations.push({
          type: 'standardFeatures',
          promise: this.roomProductStandardFeatureRepository.find({
            where: { roomProductId: In(roomProductIds) },
            select: {
              id: true,
              roomProductId: true,
              standardFeatureId: true,
              standardFeature: {
                id: true,
                name: true,
                code: true,
                imageUrl: true
              }
            },
            relations: ['standardFeature']
          })
        });
      }

      // Execute all concurrent operations
      if (concurrentOperations.length > 0) {
        const results = await Promise.all(concurrentOperations.map((op) => op.promise));

        // Map results back to room products
        for (const [index, operation] of concurrentOperations.entries()) {
          const result = results[index];
          if (!result) continue;

          switch (operation.type) {
            case 'images':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductImages = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'extras':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductExtras = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'assignedUnits':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductAssignedUnits = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'retailFeatures':
            case 'retailFeaturesWithDetails':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductRetailFeatures = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id && !!item.quantity
                );
              });
              continue;

            case 'standardFeatures':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductStandardFeatures = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'ratePlans':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductRatePlans = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'mappings':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductMappings = result.filter(
                  (item: any) => item.relatedRoomProductId === roomProduct.id
                );
              });
              continue;

            case 'extraOccupancyRates':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductExtraOccupancyRates = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'standardFeatures':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductStandardFeatures = result.filter(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;

            case 'restrictions':
              roomProducts.forEach((roomProduct) => {
                roomProduct.roomProductRestrictions = result.filter((restriction: any) =>
                  restriction.roomProductIds.includes(roomProduct.id)
                );
              });
              continue;

            case 'pricingMode':
              roomProducts.forEach((roomProduct) => {
                roomProduct['roomProductPricingMode'] = result.find(
                  (item: any) => item.roomProductId === roomProduct.id
                );
              });
              continue;
          }
        }
      }
      // Handle presigned URLs (synchronous operation)
      if (isPresignedUrl) {
        roomProducts.forEach((roomProduct) => {
          if (roomProduct.roomProductImages?.length > 0) {
            roomProduct.roomProductImages.forEach((image) => {
              if (image.imageUrl) {
                const cdnUrl = this.configService.get<string>('S3_CDN_URL');
                if (cdnUrl) {
                  image.imageUrl = `${cdnUrl.replace(/\/$/, '')}/${image.imageUrl.replace(/^\//, '')}`;
                }
              }
            });
          }
        });
      }

      // Filter out room products with empty relations when specific filters are applied
      let filteredRoomProducts = roomProducts;

      // Filter by roomUnitIds - exclude room products with empty assignedUnits
      if (
        roomUnitIds &&
        roomUnitIds.length > 0 &&
        relations?.includes(RoomProductRelation.ROOM_PRODUCT_ASSIGNED_UNITS)
      ) {
        filteredRoomProducts = filteredRoomProducts.filter(
          (roomProduct) =>
            roomProduct.roomProductAssignedUnits && roomProduct.roomProductAssignedUnits.length > 0
        );
      }

      // Filter by retailFeatureIds - exclude room products with empty retailFeatures
      if (
        retailFeatureIds &&
        retailFeatureIds.length > 0 &&
        (relations?.includes(RoomProductRelation.ROOM_PRODUCT_RETAIL_FEATURES) ||
          relations?.includes(RoomProductRelation.ROOM_PRODUCT_RETAIL_FEATURES_RETAIL_FEATURE))
      ) {
        filteredRoomProducts = filteredRoomProducts.filter(
          (roomProduct) =>
            roomProduct.roomProductRetailFeatures &&
            roomProduct.roomProductRetailFeatures.length > 0
        );
      }

      if (isGroupByMrfcCluster) {
        const newFilteredRoomProducts: Map<string, RoomProductItemDto> = new Map();

        for (const roomProduct of filteredRoomProducts.filter(
          (rp) => rp.type !== RoomProductType.RFC
        )) {
          roomProduct.roomProductRfcs = [];
          newFilteredRoomProducts.set(roomProduct.id, roomProduct);
        }

        for (const roomProduct of filteredRoomProducts.filter(
          (rp) => rp.type === RoomProductType.RFC
        )) {
          for (const mapping of roomProduct.roomProductMappings) {
            const mrfcRoomProduct = newFilteredRoomProducts.get(mapping.roomProductId);
            if (mrfcRoomProduct) {
              mrfcRoomProduct.roomProductRfcs?.push(roomProduct);
            }
          }
        }

        filteredRoomProducts = Array.from(newFilteredRoomProducts.values());
        count = filteredRoomProducts.length;
      }

      return {
        data: filteredRoomProducts,
        total: count
      };
    } catch (error) {
      this.logger.error(`Error fetching room products: ${error.message}`, {
        hotelId,
        status,
        distributionChannel,
        type,
        relations,
        stack: error.stack
      });
      throw new InternalServerErrorException(`Failed to fetch room products: ${error.message}`);
    }
  }

  async createRoomProduct(dto: CreateRoomProductDto) {
    try {
      const { hotelId, name, type, productCode } = dto;
      if (!hotelId) {
        throw new BadRequestException('Hotel ID is required');
      }

      if (!type) {
        throw new BadRequestException('Type is required');
      }

      if (type === RoomProductType.RFC) {
        return await this.roomProductRfcService.generateRoomProductRfc(hotelId);
      }

      if (!name) {
        throw new BadRequestException('Name is required');
      }

      const savedRoomProduct = await this.dataSource.manager.transaction(async (manager) => {
        const prefix = type === RoomProductType.MRFC ? 'MRFC' : 'ERFC';

        let newCode = productCode;
        if (!newCode) {
          // get latest code
          const latestRoomProduct = await manager
            .getRepository(RoomProduct)
            .createQueryBuilder('r')
            .where('r.hotelId = :hotelId', { hotelId })
            .andWhere('r.type = :type', { type })
            .orderBy('r.code', 'DESC')
            .getOne();

          const latestCode = latestRoomProduct
            ? parseInt(latestRoomProduct.code.replace(`${prefix}`, ''))
            : 0;
          newCode = `${prefix}${(latestCode + 1).toString().padStart(3, '0')}`;
        }

        const roomProduct = manager.create(RoomProduct, {
          hotelId,
          name,
          type,
          status: RoomProductStatus.DRAFT,
          code: newCode,
          numberOfBedrooms: 1, // default number of bedrooms is 1
          distributionChannel: [DistributionChannel.GV_SALES_ENGINE, DistributionChannel.GV_VOICE], // TODO: get from config
          ...(dto.additionalData || {})
        });

        const savedRoomProduct = await manager.getRepository(RoomProduct).save(roomProduct);

        const roomProductBasePriceSetting = manager.create(RoomProductBasePriceSetting, {
          hotelId,
          roomProductId: savedRoomProduct.id,
          mode: RoomProductBasePriceSettingModeEnum.FEATURE_BASED
        });
        await manager.getRepository(RoomProductBasePriceSetting).save(roomProductBasePriceSetting);

        // add default room product standard features
        const hotelStandardFeatures = await manager.getRepository(HotelStandardFeature).find({
          where: { hotelId }
        });
        const newRoomProductStandardFeatures = hotelStandardFeatures.map((feature) =>
          manager.create(RoomProductStandardFeature, {
            hotelId,
            roomProductId: savedRoomProduct.id,
            standardFeatureId: feature.id
          })
        );
        await manager
          .getRepository(RoomProductStandardFeature)
          .save(newRoomProductStandardFeatures);

        return savedRoomProduct;
      });
      return savedRoomProduct;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRoomProduct(id: string, dto: UpdateRoomProductDto) {
    const {
      hotelId,
      retailFeaturesAdded,
      retailFeaturesUpdated,
      retailFeaturesRemoved,
      roomUnitIds,
      ...rest
    } = dto;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!id) {
      throw new BadRequestException('ID is required');
    }

    try {
      const roomProduct = await this.roomProductRepository.findOne({
        where: { id, hotelId },
        relations: ['roomProductAssignedUnits']
      });

      let isChanged = false;

      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      const savedRoomProduct = await this.roomProductRepository.update(id, rest);

      // add product retail features
      if (retailFeaturesAdded?.length) {
        const hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
          where: { hotelId, code: In(retailFeaturesAdded.map((feature) => feature.code)) }
        });
        const missingRetailFeatures = retailFeaturesAdded.filter(
          (feature) => !hotelRetailFeatures.some((i) => i.code === feature.code)
        );
        if (missingRetailFeatures.length) {
          throw new BadRequestException(
            'Retail features not assigned to the hotel yet: ' +
              missingRetailFeatures.map((feature) => feature.code).join(', ')
          );
        }

        const roomProductRetailFeaturesAdded = await this.roomProductRetailFeatureRepository.insert(
          retailFeaturesAdded.map((feature) => ({
            hotelId,
            roomProductId: id,
            retailFeatureId: hotelRetailFeatures.find((i) => i.code === feature.code)?.id,
            quantity: feature.quantity
          }))
        );
      }

      //  Update product retail features
      if (retailFeaturesUpdated?.length) {
        const hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
          where: { hotelId, code: In(retailFeaturesUpdated.map((feature) => feature.code)) }
        });
        const missingRetailFeatures = retailFeaturesUpdated.filter(
          (feature) => !hotelRetailFeatures.some((i) => i.code === feature.code)
        );
        if (missingRetailFeatures.length) {
          throw new BadRequestException(
            'Retail features not assigned to the hotel yet: ' +
              missingRetailFeatures.map((feature) => feature.code).join(', ')
          );
        }

        const roomProductRetailFeaturesExisting =
          await this.roomProductRetailFeatureRepository.find({
            where: {
              roomProductId: id,
              retailFeatureId: In(
                retailFeaturesUpdated.map(
                  (feature) => hotelRetailFeatures.find((i) => i.code === feature.code)?.id
                )
              )
            },
            relations: ['retailFeature']
          });

        roomProductRetailFeaturesExisting.forEach((feature) => {
          const updatedFeature = retailFeaturesUpdated.find(
            (i) => i.code === feature.retailFeature.code
          );
          if (updatedFeature) {
            feature.quantity = updatedFeature.quantity;
          }
        });
        const savedRoomProductRetailFeatures = await this.roomProductRetailFeatureRepository.save(
          roomProductRetailFeaturesExisting
        );
      }

      // Remove product retail features
      if (retailFeaturesRemoved?.length) {
        const hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
          where: { hotelId, code: In(retailFeaturesRemoved.map((feature) => feature.code)) }
        });
        const missingRetailFeatures = retailFeaturesRemoved.filter(
          (feature) => !hotelRetailFeatures.some((i) => i.code === feature.code)
        );
        if (missingRetailFeatures.length) {
          throw new BadRequestException(
            'Retail features not assigned to the hotel yet: ' +
              missingRetailFeatures.map((feature) => feature.code).join(', ')
          );
        }
        const roomProductRetailFeaturesRemoved =
          await this.roomProductRetailFeatureRepository.delete({
            roomProductId: id,
            retailFeatureId: In(
              retailFeaturesRemoved.map(
                (feature) => hotelRetailFeatures.find((i) => i.code === feature.code)?.id
              )
            )
          });
      }

      // Add standard features
      const [roomProductStandardFeaturesExisting, hotelStandardFeatures] = await Promise.all([
        await this.roomProductStandardFeatureRepository.find({
          where: { roomProductId: id }
        }),
        await this.hotelStandardFeatureRepository.find({
          where: { hotelId },
          select: { id: true }
        })
      ]);
      const roomProductStandardFeaturesExistingMap = new Map(
        roomProductStandardFeaturesExisting.map((feature) => [feature.standardFeatureId, feature])
      );
      const newRoomProductStandardFeatures: Partial<RoomProductStandardFeature>[] = [];
      for (const hotelStandardFeature of hotelStandardFeatures) {
        const hasFeature = roomProductStandardFeaturesExistingMap.has(hotelStandardFeature.id);
        if (hasFeature) {
          roomProductStandardFeaturesExistingMap.delete(hotelStandardFeature.id);
          continue;
        }

        newRoomProductStandardFeatures.push({
          id: uuidv4(),
          hotelId,
          standardFeatureId: hotelStandardFeature.id,
          roomProductId: id
        });
      }
      if (newRoomProductStandardFeatures.length) {
        await this.roomProductStandardFeatureRepository.insert(newRoomProductStandardFeatures);
      }
      // Remove standard features
      if (roomProductStandardFeaturesExistingMap.size) {
        await this.roomProductStandardFeatureRepository.delete({
          id: In(
            Array.from(roomProductStandardFeaturesExistingMap.values()).map((feature) => feature.id)
          )
        });
      }

      // updateRoomProductAssignedUnits
      if (roomUnitIds?.length) {
        isChanged = await this.roomProductCustomRepository.updateRoomProductAssignedUnits(
          roomProduct,
          roomUnitIds
        );
      }

      // trigger room product feature based pricing if has action in feature
      if (
        (retailFeaturesAdded?.length && retailFeaturesAdded?.length > 0) ||
        (retailFeaturesUpdated?.length && retailFeaturesUpdated?.length > 0) ||
        (retailFeaturesRemoved?.length && retailFeaturesRemoved?.length > 0)
      ) {
        await this.roomProductPricingQueue.add(
          JOB_NAMES.ROOM_PRODUCT_PRICING.PROCESS_ROOM_PRODUCT_SETTING_BASED_PRICING,
          {
            roomProductId: id,
            hotelId
          }
        );
      }

      // find all room product retail features and generate feature string using new V2 format
      const roomProductRetailFeatures = await this.roomProductRetailFeatureRepository.find({
        where: {
          roomProductId: id,
          quantity: MoreThanOrEqual(1)
        }
      });

      // Get hotel retail features sorted by createdAt ASC, code ASC for proper feature string generation
      const hotelRetailFeatures = await this.hotelRetailFeatureRepository.find({
        select: {
          id: true,
          code: true
        },
        where: {
          hotelId,
          status: HotelRetailFeatureStatusEnum.ACTIVE
        },
        order: {
          createdAt: 'ASC',
          code: 'ASC'
        }
      });

      const featureString = RoomUnitUtil.generateFeatureStringV2(
        roomProductRetailFeatures,
        hotelRetailFeatures
      );
      const updatedRoomProduct = await this.roomProductRepository.update(id, { featureString });

      // if is changed, generate room product availability
      if (isChanged) {
        await this.roomProductAvailabilityService.generateRoomProductAvailability({
          hotelId,
          roomProductIds: [id]
        });
      }

      // trigger update whip room product
      this.triggerUpdateWhipRoomProduct(hotelId, [id]);

      return updatedRoomProduct;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateRoomProductExtras(id: string, dto: UpdateRoomProductExtrasDto[]) {
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    if (!dto?.length || dto.length === 0) {
      throw new BadRequestException('DTO is required');
    }

    try {
      const roomProduct = await this.roomProductRepository.findOne({ where: { id } });
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Create multiple room product extras for one room product
  async createRoomProductExtras(id: string, dto: CreateRoomProductExtrasDto) {
    this.logger.log(`Creating ${dto.extras.length} room product extras for room product: ${id}`);

    const existingExtras = await this.roomProductExtraRepository.find({
      where: {
        roomProductId: id,
        hotelId: dto.hotelId,
        type: In(dto.extras.map((extra) => extra.type))
      }
    });
    // update existing extras
    existingExtras.forEach((extra) => {
      const updatedExtra = dto.extras.find((i) => i.extrasId === extra.extrasId);
      if (updatedExtra) {
        extra.type = updatedExtra.type;
      }
    });
    await this.roomProductExtraRepository.save(existingExtras);

    // create new extras
    const newExtras = dto.extras.filter(
      (extra) => !existingExtras.some((i) => i.extrasId === extra.extrasId)
    );
    const savedNewExtras = await this.roomProductExtraRepository.insert(
      newExtras.map((extra) => ({
        roomProductId: id,
        hotelId: dto.hotelId,
        extrasId: extra.extrasId,
        type: extra.type
      }))
    );
    return { existingExtras, savedNewExtras };
  }

  // Delete multiple room product extras from one room product
  async deleteRoomProductExtras(id: string, dto: DeleteRoomProductExtrasDto) {
    this.logger.log(`Deleting ${dto.extraIds.length} room product extras from room product: ${id}`);
    try {
      await this.roomProductExtraRepository.delete({
        extrasId: In(dto.extraIds),
        roomProductId: id,
        hotelId: dto.hotelId
      });
      return dto.extraIds;
    } catch (error) {
      this.logger.error(`Error deleting room product extras: ${error.message}`, error.stack);
      throw new BadRequestException(error.message);
    }
  }

  async uploadRoomProductImagesFromGallery(payload: UploadRoomProductImagesFromGalleryDto) {
    try {
      const { id, imageKeys } = payload;
      if (!id) {
        throw new BadRequestException('ID is required');
      }

      const roomProduct = await this.roomProductRepository.findOne({ where: { id } });
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      const maxSequenceResult = await this.roomProductImageRepository
        .createQueryBuilder('rpi')
        .select('MAX(rpi.sequence)', 'maxSequence')
        .where('rpi.roomProductId = :roomProductId', { roomProductId: id })
        .andWhere('rpi.hotelId = :hotelId', { hotelId: roomProduct.hotelId })
        .getRawOne();

      const nextSequence = (maxSequenceResult?.maxSequence || 0) + 1;

      const roomProductImages = imageKeys.map((imageKey, index) => {
        return this.roomProductImageRepository.create({
          roomProductId: id,
          imageUrl: imageKey,
          hotelId: roomProduct.hotelId,
          sequence: nextSequence + index,
          description: imageKey
        });
      });
      await this.roomProductImageRepository.save(roomProductImages);
      return roomProductImages;
    } catch (error) {
      this.logger.error(
        `Error uploading room product images from gallery: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(error.message);
    }
  }

  async uploadRoomProductImages(id: string, file: Express.Multer.File, hotelCode: string) {
    try {
      if (!id) {
        throw new BadRequestException('ID is required');
      }

      const roomProduct = await this.roomProductRepository.findOne({ where: { id } });
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      const originalFileName = file?.originalname?.replace(/\s+/g, '_');
      const key = `hotel/${hotelCode}/${originalFileName}`;
      await this.s3Service.uploadFile(file, key);
      // const imageUrl = this.configService.get<string>('S3_CDN_URL') + '/' + key;

      const maxSequenceResult = await this.roomProductImageRepository
        .createQueryBuilder('rpi')
        .select('MAX(rpi.sequence)', 'maxSequence')
        .where('rpi.roomProductId = :roomProductId', { roomProductId: id })
        .andWhere('rpi.hotelId = :hotelId', { hotelId: roomProduct.hotelId })
        .getRawOne();

      const nextSequence = (maxSequenceResult?.maxSequence || 0) + 1;
      const roomProductImage = this.roomProductImageRepository.create({
        roomProductId: id,
        imageUrl: key,
        hotelId: roomProduct.hotelId,
        description: originalFileName,
        sequence: nextSequence
      });
      await this.roomProductImageRepository.save(roomProductImage);
      return roomProductImage;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteRoomProductImage(imageId: string) {
    try {
      if (!imageId) {
        throw new BadRequestException('Image ID is required');
      }

      const roomProductImage = await this.roomProductImageRepository.findOne({
        where: { id: imageId }
      });
      if (!roomProductImage) {
        throw new BadRequestException('Room product image not found');
      }

      // delete image from s3
      await this.s3Service.deleteFile(roomProductImage.imageUrl);

      // delete image from room product image
      await this.roomProductImageRepository.delete({ id: imageId });

      return imageId;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHouseLevelAvailability(filter: RoomProductQueryDto) {
    const { hotelId, startDate, endDate } = filter;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    try {
      const roomProducts = await this.roomProductRepository
        .createQueryBuilder('r')
        .leftJoinAndSelect('r.roomProductDailyAvailabilities', 'rDa')
        .where('r.hotelId = :hotelId', { hotelId })
        .andWhere('r.deletedAt IS NULL')
        .andWhere('r.type = :type', { type: RoomProductType.MRFC })
        .andWhere('r.status = :status', { status: RoomProductStatus.ACTIVE })
        .andWhere('rDa.date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany();

      // Calculate total daily availability aggregated by date
      const totalDailyAvailability = await this.calculateTotalDailyAvailability(
        hotelId,
        startDate,
        endDate
      );

      return {
        roomProducts,
        totalDailyAvailability,
        summary: {
          totalRoomProducts: roomProducts.length,
          dateRange: { startDate, endDate },
          hotelId
        }
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Calculate total daily availability from all room products for a hotel
   * Aggregates available, sold, sellLimit, and adjustment values by date
   */
  async calculateTotalDailyAvailability(hotelId: string, startDate: string, endDate: string) {
    if (!hotelId || !startDate || !endDate) {
      throw new BadRequestException('Hotel ID, start date, and end date are required');
    }

    try {
      // Get raw aggregated data using SQL query for better performance
      const result = await this.roomProductDailyAvailabilityRepository
        .createQueryBuilder('rda')
        .select([
          'rda.date as date',
          'CAST(SUM(COALESCE(rda.available, 0)) as INTEGER) as "available"',
          'CAST(SUM(COALESCE(rda.sold, 0)) as INTEGER) as "sold"',
          'CAST(SUM(COALESCE(rda.sellLimit, 0)) as INTEGER) as "sellLimit"',
          'CAST(SUM(COALESCE(rda.adjustment, 0)) as INTEGER) as "adjustment"'
        ])
        .innerJoin('room_product', 'rp', 'rp.id = rda.roomProductId')
        .where('rda.hotelId = :hotelId', { hotelId })
        .andWhere('rda.date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('rp.status = :status', { status: RoomProductStatus.ACTIVE })
        .andWhere('rp.type = :type', { type: RoomProductType.MRFC })
        .andWhere('rp.deletedAt IS NULL')
        .groupBy('rda.date')
        .orderBy('rda.date', 'ASC')
        .getRawMany();

      return result;
    } catch (error) {
      this.logger.error(`Error calculating total daily availability: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to calculate total daily availability: ${error.message}`
      );
    }
  }

  /**
   * Get total availability summary for a date range
   */
  async getTotalAvailabilitySummary(hotelId: string, startDate: string, endDate: string) {
    const dailyAvailability = await this.calculateTotalDailyAvailability(
      hotelId,
      startDate,
      endDate
    );

    if (dailyAvailability.length === 0) {
      return {
        totalDays: 0,
        totalAvailable: 0,
        totalSold: 0,
        totalSellLimit: 0,
        averageOccupancyRate: '0.00',
        peakAvailabilityDate: null,
        lowestAvailabilityDate: null
      };
    }

    const summary = dailyAvailability.reduce(
      (acc, day) => {
        acc.totalAvailable += day.totalAvailable;
        acc.totalSold += day.totalSold;
        acc.totalSellLimit += day.totalSellLimit;

        // Track peak and lowest availability dates
        if (!acc.peakAvailabilityDate || day.effectiveAvailability > acc.peakAvailability) {
          acc.peakAvailabilityDate = day.date;
          acc.peakAvailability = day.effectiveAvailability;
        }

        if (!acc.lowestAvailabilityDate || day.effectiveAvailability < acc.lowestAvailability) {
          acc.lowestAvailabilityDate = day.date;
          acc.lowestAvailability = day.effectiveAvailability;
        }

        return acc;
      },
      {
        totalAvailable: 0,
        totalSold: 0,
        totalSellLimit: 0,
        peakAvailabilityDate: null as string | null,
        lowestAvailabilityDate: null as string | null,
        peakAvailability: -1,
        lowestAvailability: Number.MAX_SAFE_INTEGER
      }
    );

    const averageOccupancyRate =
      summary.totalSellLimit > 0
        ? ((summary.totalSold / summary.totalSellLimit) * 100).toFixed(2)
        : '0.00';

    return {
      totalDays: dailyAvailability.length,
      totalAvailable: summary.totalAvailable,
      totalSold: summary.totalSold,
      totalSellLimit: summary.totalSellLimit,
      averageOccupancyRate,
      peakAvailabilityDate: summary.peakAvailabilityDate,
      lowestAvailabilityDate: summary.lowestAvailabilityDate,
      dailyBreakdown: dailyAvailability
    };
  }

  async getPmsRoomProducts(hotelId: string) {
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      const pmsRoomProducts = await this.pmsService.getPmsRoomProducts(hotelId);
      if (pmsRoomProducts.length === 0) {
        return [];
      }
      return pmsRoomProducts;
    } catch (error) {
      console.log(error);
      // throw new InternalServerErrorException(error.message);

      return [];
    }
  }

  async getPmsRoomProductsAssignment(hotelId: string) {
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      const pmsRoomProductsAssignment = await this.pmsService.getPmsRoomProductsAssignment(hotelId);
      return pmsRoomProductsAssignment;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateRoomProductImage(imageId: string, dto: UpdateRoomProductImageDto) {
    if (!imageId) {
      throw new BadRequestException('Image ID is required');
    }
    try {
      const roomProductImage = await this.roomProductImageRepository.update(imageId, dto);
      return roomProductImage;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async reorderRoomProductImages(roomProductId: string, body: ReorderRoomProductImageDto) {
    const productImages = await this.roomProductImageRepository.find({
      where: { roomProductId, id: In(body.ids) }
    });
    if (!productImages?.length) {
      throw new BadRequestException('Room product images not found');
    }
    try {
      const updatedProductImages = body.ids
        .map((id, index) => {
          const image = productImages.find((i) => i.id === id);
          if (image) {
            image.sequence = index + 1;
            return image;
          }
          return null;
        })
        .filter((image) => !!image);
      const roomProductImages = await this.roomProductImageRepository.save(updatedProductImages);
      return roomProductImages;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getRoomProductDetail(roomProductId: string) {
    if (!roomProductId) {
      throw new BadRequestException('Room Product ID is required');
    }

    try {
      // Get base room product without relations
      const roomProduct = await this.roomProductRepository.findOne({
        where: { id: roomProductId },
        select: {
          id: true,
          hotelId: true,
          status: true,
          type: true,
          code: true,
          name: true,
          distributionChannel: true,
          description: true,
          numberOfBedrooms: true,
          extraAdult: true,
          extraChildren: true,
          space: true,
          featureString: true,
          capacityDefault: true,
          maximumAdult: true,
          maximumKid: true,
          maximumPet: true,
          capacityExtra: true,
          extraBedAdult: true,
          extraBedKid: true,
          travelTag: true,
          occasion: true,
          createdAt: true,
          updatedAt: true,
          rfcAllocationSetting: true,
          translations: true,
          isLockedUnit: true,
          // Geo fields (for RFCs with custom location)
          latitude: true,
          longitude: true,
          address: true,
          city: true
        }
      });

      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      // Prepare concurrent operations for all related data
      const concurrentOperations: Array<{
        type: string;
        promise: Promise<any>;
      }> = [
        // Room Product Images
        {
          type: 'images',
          promise: this.roomProductImageRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              imageUrl: true,
              sequence: true
            }
          })
        },
        // Room Product Extras
        {
          type: 'extras',
          promise: this.roomProductExtraRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              type: true,
              extrasId: true
            }
          })
        },
        // Room Product Assigned Units with Room Unit details
        {
          type: 'assignedUnits',
          promise: this.roomProductAssignedUnitRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              roomUnitId: true,
              roomUnit: {
                id: true,
                roomNumber: true
              }
            },
            relations: ['roomUnit']
          })
        },
        // Room Product Retail Features with full details
        {
          type: 'retailFeatures',
          promise: this.roomProductRetailFeatureRepository.find({
            where: {
              roomProductId,
              quantity: MoreThanOrEqual(1)
            },
            select: {
              id: true,
              roomProductId: true,
              retailFeatureId: true,
              quantity: true,
              retailFeature: {
                id: true,
                imageUrl: true,
                code: true,
                baseRate: true,
                name: true,
                displaySequence: true,
                measurementUnit: true,
                hotelRetailCategoryId: true,
                hotelRetailCategory: {
                  id: true,
                  code: true,
                  name: true,
                  displaySequence: true
                }
              }
            },
            relations: ['retailFeature', 'retailFeature.hotelRetailCategory']
          })
        },
        // Room Product Standard Features with full details
        {
          type: 'standardFeatures',
          promise: this.roomProductStandardFeatureRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              standardFeatureId: true,
              standardFeature: {
                id: true,
                imageUrl: true,
                code: true,
                name: true,
                displaySequence: true
              }
            },
            relations: ['standardFeature']
          })
        },
        // Room Product Extra Occupancy Rates
        {
          type: 'extraOccupancyRates',
          promise: this.roomProductExtraOccupancyRateRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              extraPeople: true,
              extraRate: true
            }
          })
        },
        // Room Product Mappings with related room products
        {
          type: 'mappings',
          promise: this.roomProductMappingRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              relatedRoomProductId: true,
              relatedRoomProduct: {
                id: true,
                code: true,
                type: true
              }
            },
            relations: ['relatedRoomProduct']
          })
        },
        // Room Product Rate Plans
        {
          type: 'ratePlans',
          promise: this.roomProductRatePlanRepository.find({
            where: { roomProductId },
            select: {
              id: true,
              roomProductId: true,
              ratePlanId: true,
              code: true,
              isSellable: true
            }
          })
        },

        // Room Product Pricing Method Details
        {
          type: 'pricingMethodDetails',
          promise: this.roomProductPricingMethodDetailRepository.find({
            where: { roomProductId },
            select: {
              targetRoomProductId: true,
              roomProductId: true,
              ratePlanId: true,
              pricingMethod: true,
              pricingMethodAdjustmentValue: true,
              pricingMethodAdjustmentUnit: true,
              mappingRoomProductId: true,
              targetRatePlanId: true,
              pmsRatePlanCode: true,
              id: true,
              targetRoomProduct: {
                name: true,
                code: true
              }
            },
            relations: ['targetRoomProduct']
          })
        },

        {
          type: 'roomProductMappingPms',
          promise: this.roomProductMappingPmsRepository.find({
            where: { roomProductId }
          })
        }
      ];

      // Add base price settings (repository is available)
      concurrentOperations.push({
        type: 'basePriceSettings',
        promise: this.roomProductBasePriceSettingRepository.find({
          where: { roomProductId },
          select: {
            id: true,
            roomProductId: true,
            mode: true,
            fixedPrice: true
          }
        })
      });

      // Execute all concurrent operations
      const results = await Promise.all(concurrentOperations.map((op) => op.promise));

      // Map results back to room product
      concurrentOperations.forEach((operation, index) => {
        const result = results[index];

        switch (operation.type) {
          case 'images':
            roomProduct.roomProductImages = result;
            break;
          case 'extras':
            roomProduct.roomProductExtras = result;
            break;
          case 'assignedUnits':
            roomProduct.roomProductAssignedUnits = result;
            break;
          case 'retailFeatures':
            roomProduct.roomProductRetailFeatures = result;
            break;
          case 'standardFeatures':
            roomProduct.roomProductStandardFeatures = result;
            break;
          case 'extraOccupancyRates':
            roomProduct.roomProductExtraOccupancyRates = result;
            break;
          case 'mappings':
            roomProduct.roomProductMappings = result;
            break;
          case 'ratePlans':
            roomProduct.roomProductRatePlans = result;
            break;
          case 'basePriceSettings':
            roomProduct.roomProductBasePriceSettings = result;
            break;
          case 'pricingMethodDetails':
            roomProduct.roomProductPricingMethodDetails = result;
            break;
          case 'roomProductMappingPms':
            roomProduct.roomProductMappingPms = result;
            break;
        }
      });

      const pmsPricingMethodDetails = roomProduct.roomProductPricingMethodDetails.filter(
        (pricingMethodDetail) =>
          pricingMethodDetail.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING
      );

      if (pmsPricingMethodDetails && pmsPricingMethodDetails.length > 0) {
        const ratePlanIds = Array.from(
          new Set(pmsPricingMethodDetails.map((item) => item.ratePlanId))
        );
        const targetRoomProduct = await this.roomProductPricingService.getTargetForRFCRoomProduct({
          hotelId: roomProduct.hotelId,
          rfcRoomProductIds: [roomProductId],
          targetRoomProductTypes: [RoomProductType.MRFC]
        });
        const targetRoomProductIds = Array.from(
          new Set(targetRoomProduct.map((item) => item.targetRoomProductId))
        );

        const targetMethodDetails = await this.roomProductPricingMethodDetailRepository.find({
          where: {
            roomProductId: In(targetRoomProductIds),
            ratePlanId: In(ratePlanIds)
          }
        });
        const targetMethodDetailMap = groupByToMap(targetMethodDetails, (item) => item.ratePlanId);

        for (const pmsPricingMethodDetail of pmsPricingMethodDetails) {
          const findTargetMethodDetails = targetMethodDetailMap.get(
            pmsPricingMethodDetail.ratePlanId
          );
          if (findTargetMethodDetails && findTargetMethodDetails.length > 0) {
            pmsPricingMethodDetail['isReversedPricing'] = true;
          }
        }
      }

      const pricingModes = await Promise.all([
        // FEATURE_BASED mode
        this.calculateModeDirectly(
          roomProductId,
          roomProduct.type,
          roomProduct.hotelId,
          RoomProductBasePriceSettingModeEnum.FEATURE_BASED
        ),
        // AVERAGE mode
        this.calculateModeDirectly(
          roomProductId,
          roomProduct.type,
          roomProduct.hotelId,
          RoomProductBasePriceSettingModeEnum.AVERAGE
        ),
        // COMBINED mode
        this.calculateModeDirectly(
          roomProductId,
          roomProduct.type,
          roomProduct.hotelId,
          RoomProductBasePriceSettingModeEnum.COMBINED
        )
      ]);

      return {
        ...roomProduct,
        roomProductImages: roomProduct.roomProductImages.map((image) => ({
          ...image,
          imageUrl: image.imageUrl
            ? `${this.configService.get<string>('S3_CDN_URL')}/${image.imageUrl}`
            : null
        })),
        pricingModes: pricingModes.filter((mode) => mode !== null)
      };
    } catch (error) {
      this.logger.error(`Error fetching room product detail: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to fetch room product detail: ${error.message}`
      );
    }
  }

  private async calculateModeDirectly(
    roomProductId: string,
    roomProductType: RoomProductType,
    hotelId: string,
    mode: RoomProductBasePriceSettingModeEnum
  ) {
    try {
      switch (mode) {
        case RoomProductBasePriceSettingModeEnum.FEATURE_BASED: {
          const featureRates = await this.featurePricingService.getDefaultFeatureRate({
            roomProductIds: [roomProductId],
            hotelId
          });

          const featureBasePricing =
            this.calculateFeatureBasePricingService.calculateDefaultFeatureBasePricing({
              hotelId,
              roomProductIds: [roomProductId],
              featureRates
            });

          return {
            mode,
            roomProductId,
            rate: featureBasePricing[0]?.featureBasedRate || 0,
            linkedRoomProducts: []
          };
        }
        case RoomProductBasePriceSettingModeEnum.AVERAGE: {
          const relatedRoomProductIds =
            await this.roomProductPricingService.getRelatedRoomProductIds({
              hotelId,
              roomProductId,
              roomProductType
            });

          const [retailRoomProducts, featureRates, relatedRoomProductAssignedUnits] =
            await Promise.all([
              this.roomProductRepository.find({
                where: {
                  id: In(relatedRoomProductIds)
                },
                select: {
                  id: true,
                  type: true,
                  name: true,
                  code: true
                }
              }),
              this.featurePricingService.getDefaultFeatureRate({
                roomProductIds: [...relatedRoomProductIds],
                hotelId
              }),
              this.roomProductCustomRepository.findAssignedUnits({
                roomProductIds: [...relatedRoomProductIds]
              })
            ]);

          const featureBasePricingList =
            this.calculateFeatureBasePricingService.calculateDefaultFeatureBasePricing({
              hotelId,
              roomProductIds: relatedRoomProductIds,
              featureRates
            });

          const averagePricing = this.calculateAveragePricingService.calculateDefaultAveragePricing(
            {
              hotelId,
              roomProducts: [
                {
                  roomProductId,
                  relatedRoomProductIds,
                  roomProductType
                }
              ],
              rfcFeatureBasePricingResults: featureBasePricingList,
              relatedRoomProductAssignedUnits: relatedRoomProductAssignedUnits
            }
          );

          const retailRoomProductsMap = groupByToMapSingle(
            retailRoomProducts,
            (roomProduct) => roomProduct.id
          );

          return {
            mode,
            roomProductId,
            rate: averagePricing[0]?.featureBasedRate || 0,
            linkedRoomProducts: featureBasePricingList.map((featureBasePricing) => {
              const retailRoomProduct = retailRoomProductsMap.get(featureBasePricing.roomProductId);
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
              roomProductId,
              roomProductType
            });

          const [retailRoomProducts, featureRates, relatedRoomProductAssignedUnits] =
            await Promise.all([
              this.roomProductRepository.find({
                where: {
                  id: In(relatedRoomProductIds)
                },
                select: {
                  id: true,
                  type: true,
                  name: true,
                  code: true
                }
              }),
              this.featurePricingService.getDefaultFeatureRate({
                roomProductIds: [...relatedRoomProductIds],
                hotelId
              }),
              this.roomProductCustomRepository.findAssignedUnits({
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
                  roomProductId,
                  relatedRoomProductIds,
                  roomProductType
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
            roomProductId,
            rate: averagePricing[0]?.featureBasedRate || 0,
            linkedRoomProducts: featureBasePricingList.map((featureBasePricing) => {
              const retailRoomProduct = retailRoomProductsMap.get(featureBasePricing.roomProductId);
              return {
                roomProductId: featureBasePricing.roomProductId,
                featureBasedRate: featureBasePricing.featureBasedRate,
                roomProductCode: retailRoomProduct?.code || '',
                roomProductName: retailRoomProduct?.name || ''
              };
            })
          };
        }
      }

      // switch (mode) {
      //   case RoomProductBasePriceSettingModeEnum.FEATURE_BASED: {
      //     const featureBasedRate = await this.featureCalculationService.calculateFeatureBasedPrice({
      //       roomProductId,
      //       roomProductType,
      //       hotelId,
      //       useDaily: false
      //     });
      //     return {
      //       mode,
      //       roomProductId,
      //       rate: featureBasedRate[0]?.featureBasedRate || 0,
      //       linkedRoomProducts: []
      //     };
      //   }

      //   case RoomProductBasePriceSettingModeEnum.AVERAGE: {
      //     const averageRate = await this.featureCalculationService.calculateCombinedFeaturePrice({
      //       roomProductId,
      //       roomProductType,
      //       hotelId,
      //       useDaily: false,
      //       isAverage: true
      //     });
      //     return {
      //       mode,
      //       roomProductId,
      //       rate: averageRate[0]?.featureBasedRate || 0,
      //       linkedRoomProducts: averageRate[0]?.linkedRoomProducts || []
      //     };
      //   }

      //   case RoomProductBasePriceSettingModeEnum.COMBINED: {
      //     const combinedRate = await this.featureCalculationService.calculateCombinedFeaturePrice({
      //       roomProductId,
      //       roomProductType,
      //       hotelId,
      //       useDaily: false
      //     });
      //     return {
      //       mode,
      //       roomProductId,
      //       rate: combinedRate[0]?.featureBasedRate || 0,
      //       linkedRoomProducts: combinedRate[0]?.linkedRoomProducts || []
      //     };
      //   }

      //   default:
      //     return null;
      // }
    } catch (error) {
      this.logger.error(`Error in calculateModeDirectly for mode ${mode}: ${error.message}`);
      return {
        mode,
        roomProductId,
        rate: 0,
        linkedRoomProducts: []
      };
    }
  }

  async createRoomProductExtraOccupancyRates(
    id: string,
    dto: CreateRoomProductExtraOccupancyRatesDto
  ) {
    const roomProduct = await this.roomProductRepository.findOne({ where: { id } });

    if (!roomProduct) {
      throw new BadRequestException('Room product not found');
    }

    const result = this.roomProductExtraOccupancyRateRepository
      .createQueryBuilder()
      .insert()
      .into(RoomProductExtraOccupancyRate)
      .values(
        dto.extraOccupancyRates.map((rate) => ({
          ...rate,
          roomProductId: id,
          hotelId: roomProduct.hotelId
        }))
      )
      .orUpdate(['extra_rate'], ['hotel_id', 'room_product_id', 'extra_people'])
      .execute();

    return result;
  }

  async createRoomProductBasePriceSetting(id: string, dto: CreateRoomProductBasePriceSettingDto) {
    const roomProduct = await this.roomProductRepository.findOne({
      where: { id },
      relations: ['roomProductBasePriceSettings']
    });

    if (!roomProduct) {
      throw new BadRequestException('Room product not found');
    }

    // get current base price setting
    const currentBasePriceSetting = roomProduct.roomProductBasePriceSettings[0];

    const currentFixedPrice = currentBasePriceSetting?.fixedPrice;
    const mode = currentBasePriceSetting?.mode;

    const result = this.roomProductBasePriceSettingRepository
      .createQueryBuilder()
      .insert()
      .into(RoomProductBasePriceSetting)
      .values({
        ...dto,
        roomProductId: id,
        hotelId: roomProduct.hotelId,
        fixedPrice: dto?.fixedPrice ?? currentFixedPrice ?? null // if fixed price is not provided, use the current fixed price
      })
      .orUpdate(['mode', 'fixed_price'], ['hotel_id', 'room_product_id'])
      .execute();

    // check if current base price setting mode is different from the new mode
    if (mode !== dto.mode || dto.mode === RoomProductBasePriceSettingModeEnum.FIXED_PRICE) {
      // add job to queue
      const job = await this.roomProductPricingQueue.add(
        JOB_NAMES.ROOM_PRODUCT_PRICING.PROCESS_ROOM_PRODUCT_SETTING_BASED_PRICING,
        {
          roomProductId: id,
          hotelId: roomProduct.hotelId
        }
      );

      console.log('✅ Job added successfully with ID:', job.id);
    }

    return result;
  }

  async createRoomProductRoomMapping(id: string, dto: CreateRoomProductRoomMappingDto) {
    const roomProduct = await this.roomProductRepository.findOne({ where: { id } });

    if (!roomProduct) {
      throw new BadRequestException('Room product not found');
    }

    const result = this.roomProductMappingRepository.create({
      roomProductId: id,
      relatedRoomProductId: dto.relatedRoomProductId,
      hotelId: roomProduct.hotelId
    });

    return this.roomProductMappingRepository.save(result);
  }

  async deleteRoomProductRoomMapping(id: string) {
    const roomProductMapping = await this.roomProductMappingRepository.findOne({ where: { id } });

    if (!roomProductMapping) {
      throw new BadRequestException('Room product mapping not found');
    }

    return this.roomProductMappingRepository.delete({ id });
  }

  /**
   * Clone Room Product
   * Migrated from Java: RfcServiceImpl.cloneRoomProduct()
   * @param input CloneRoomProductInput
   * @returns Cloned RoomProduct
   */
  async cloneRoomProduct(input: CloneRoomProductInput): Promise<RoomProduct> {
    const { roomProductId, hotelId, roomProductType } = input;

    if (!roomProductId) {
      throw new BadRequestException('Room product ID is required');
    }

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Step 1: Find room product to clone
      const roomProductToClone = await manager.findOne(RoomProduct, {
        where: {
          id: roomProductId,
          hotelId: hotelId
        }
      });

      if (!roomProductToClone) {
        throw new BadRequestException('Room product not found to clone');
      }

      // Step 2: Prepare clone input
      const newRoomProductType = roomProductType || RoomProductType.ERFC;
      const roomProductName = `${roomProductToClone.name} Clone`;
      const roomProductDescription = roomProductToClone.description;

      // Step 3: Get all related data to clone
      const [
        roomProductImageList,
        roomProductAssignedUnitList,
        roomProductRetailFeatureList,
        roomProductExtraOccupancyRateList,
        roomProductRestrictionList,
        roomProductRestrictionAutomationSettingList,
        roomProductStandardFeatureList
      ] = await Promise.all([
        manager.find(RoomProductImage, {
          where: { roomProductId: roomProductToClone.id }
        }),
        manager.find(RoomProductAssignedUnit, {
          where: { roomProductId: roomProductToClone.id }
        }),
        manager.find(RoomProductRetailFeature, {
          where: { roomProductId: roomProductToClone.id, hotelId: hotelId }
        }),
        manager.find(RoomProductExtraOccupancyRate, {
          where: { roomProductId: roomProductToClone.id, hotelId: hotelId }
        }),
        manager.find(Restriction, {
          where: {
            roomProductIds: Raw((alias) => `room_product_ids  && :roomProductIds`, {
              roomProductIds: [roomProductToClone.id]
            }),
            ratePlanIds: IsNull(),
            hotelId: hotelId
          }
        }),
        manager.find(RestrictionAutomationSetting, {
          where: { referenceId: roomProductToClone.id, hotelId: hotelId }
        }),
        manager.find(RoomProductStandardFeature, {
          where: { roomProductId: roomProductToClone.id, hotelId: hotelId }
        })
      ]);

      // Step 4: Generate new code
      const newCode = await this.generateRoomProductCode(newRoomProductType, hotelId, manager);

      // Step 5: Create new room product entity
      const newRoomProduct = manager.create(RoomProduct, {
        code: newCode,
        type: newRoomProductType,
        rfcAllocationSetting: roomProductToClone.rfcAllocationSetting,
        hotelId: hotelId,
        name: roomProductName,
        description: roomProductDescription,
        space: roomProductToClone.space,
        numberOfBedrooms: roomProductToClone.numberOfBedrooms,
        capacityDefault: roomProductToClone.capacityDefault,
        maximumAdult: roomProductToClone.maximumAdult,
        maximumKid: roomProductToClone.maximumKid,
        maximumPet: roomProductToClone.maximumPet,
        capacityExtra: roomProductToClone.capacityExtra,
        extraBedAdult: roomProductToClone.extraBedAdult,
        extraBedKid: roomProductToClone.extraBedKid,
        basePriceMode: roomProductToClone.basePriceMode,
        distributionChannel: [], // Default off all channels
        status: RoomProductStatus.DRAFT, // Status DRAFT
        translations: roomProductToClone.translations || []
      });

      // Save new room product
      const savedRoomProduct = await manager.save(RoomProduct, newRoomProduct);
      const newRoomProductId = savedRoomProduct.id;

      // Step 6: Clone Room Product Images
      if (roomProductImageList?.length > 0) {
        // TODO: Clone images using CORE SERVICE REMOTE
        // Java code:
        // FileLibraryInput fileLibraryInput = new FileLibraryInput();
        // fileLibraryInput.setIdList(currentRoomProductImageIdlist);
        // List<FileLibraryDto> clonedImages = this.coreServiceRemote.cloneFile(fileLibraryInput).getDataList();

        // For now, copy image URLs directly without cloning files
        const newRoomProductImageList = roomProductImageList.map((rfcImage) =>
          manager.create(RoomProductImage, {
            roomProductId: newRoomProductId,
            hotelId: hotelId,
            imageUrl: rfcImage.imageUrl, // TODO: Should be cloned image URL from coreServiceRemote
            description: rfcImage.description,
            sequence: rfcImage.sequence
          })
        );
        await manager.save(RoomProductImage, newRoomProductImageList);
      }

      // Step 7: Clone Room Product Assigned Units (Room Assigned Room)
      if (roomProductAssignedUnitList?.length > 0) {
        const newRoomProductAssignedUnitList = roomProductAssignedUnitList.map((assignedUnit) =>
          manager.create(RoomProductAssignedUnit, {
            roomProductId: newRoomProductId,
            roomUnitId: assignedUnit.roomUnitId
          })
        );
        await manager.save(RoomProductAssignedUnit, newRoomProductAssignedUnitList);
      }

      if (roomProductStandardFeatureList?.length > 0) {
        const newRoomProductStandardFeatureList = roomProductStandardFeatureList.map(
          (standardFeature) =>
            manager.create(RoomProductStandardFeature, {
              roomProductId: newRoomProductId,
              hotelId: hotelId,
              standardFeatureId: standardFeature.standardFeatureId
            })
        );
        await manager.save(RoomProductStandardFeature, newRoomProductStandardFeatureList);
      }

      // Step 10: Clone Room Product Retail Features
      if (roomProductRetailFeatureList?.length > 0) {
        // For now, clone locally
        const newRoomProductRetailFeatureList = roomProductRetailFeatureList.map((retailFeature) =>
          manager.create(RoomProductRetailFeature, {
            roomProductId: newRoomProductId,
            hotelId: hotelId,
            retailFeatureId: retailFeature.retailFeatureId,
            quantity: retailFeature.quantity
          })
        );
        await manager.save(RoomProductRetailFeature, newRoomProductRetailFeatureList);
      }

      // Step 11: Clone Room Product Multi Occupancy Surcharge
      if (roomProductExtraOccupancyRateList?.length > 0) {
        // For now, clone locally
        const newRoomProductExtraOccupancyRateList = roomProductExtraOccupancyRateList.map(
          (occupancyRate) =>
            manager.create(RoomProductExtraOccupancyRate, {
              roomProductId: newRoomProductId,
              hotelId: hotelId,
              extraPeople: occupancyRate.extraPeople,
              extraRate: occupancyRate.extraRate
            })
        );
        await manager.save(RoomProductExtraOccupancyRate, newRoomProductExtraOccupancyRateList);
      }

      // Step 12: Clone Room Product Restrictions
      if (roomProductRestrictionList?.length > 0) {
        const newRoomProductRestrictionList = roomProductRestrictionList.map((restriction) =>
          manager.create(Restriction, {
            roomProductId: newRoomProductId,
            hotelId: hotelId,
            type: restriction.type,
            weekdays: restriction.weekdays,
            fromDate: restriction.fromDate,
            toDate: restriction.toDate,
            minLength: restriction.minLength,
            maxLength: restriction.maxLength,
            minAdv: restriction.minAdv,
            maxAdv: restriction.maxAdv,
            minLosThrough: restriction.minLosThrough,
            maxReservationCount: restriction.maxReservationCount,
            metadata: restriction.metadata,
            restrictionSource: restriction.restrictionSource
          })
        );

        await manager.save(Restriction, newRoomProductRestrictionList);

        // Note: Restrictions are complex - need to be handled by availability service
        this.logger.warn(
          `Room product restrictions cloning not implemented - requires availability service`
        );
      }

      if (roomProductRestrictionAutomationSettingList?.length > 0) {
        const newRoomProductRestrictionAutomationSettingList =
          roomProductRestrictionAutomationSettingList.map((automationSetting) =>
            manager.create(RestrictionAutomationSetting, {
              referenceId: newRoomProductId,
              hotelId: hotelId,
              settings: automationSetting.settings,
              rules: automationSetting.rules,
              type: automationSetting.type,
              isEnabled: automationSetting.isEnabled
            })
          );
        await manager.save(
          RestrictionAutomationSetting,
          newRoomProductRestrictionAutomationSettingList
        );
      }

      this.logger.log(`Successfully cloned room product ${roomProductId} to ${newRoomProductId}`);
      return savedRoomProduct;
    });
  }

  /**
   * Generate room product code
   * Migrated from Java: RfcServiceImpl.generateERFCCode()
   */
  private async generateRoomProductCode(
    type: RoomProductType,
    hotelId: string,
    manager: any
  ): Promise<string> {
    // Get all existing codes for this hotel
    const existingRoomProducts = await manager.find(RoomProduct, {
      where: { hotelId },
      select: ['code']
    });

    const existingCodes = new Set(existingRoomProducts.map((rp) => rp.code));

    // Generate new code
    let newCode: string | null = null;
    let counter = existingCodes.size + 1;

    while (newCode === null) {
      const tempCode = `${type}${counter.toString().padStart(3, '0')}`;
      if (!existingCodes.has(tempCode)) {
        newCode = tempCode;
      }
      counter++;
    }

    return newCode;
  }

  async getCPPProductCartList(filter: CppProductCartListFilterDto) {
    try {
      const { hotelId, productCartDetailsList } = filter;

      const [
        roomProductsDetails,
        roomProductRetailFeatures,
        roomProductStandardFeatures,
        ratePlansDetails
      ] = await Promise.all([
        this.roomProductRepository.find({
          where: {
            id: In(productCartDetailsList.map((item) => item.roomProductId)),
            hotelId: hotelId
          },
          relations: {
            roomProductImages: true
          },
          select: {
            id: true,
            name: true,
            code: true,
            numberOfBedrooms: true,
            rfcAllocationSetting: true,
            extraAdult: true,
            extraChildren: true,
            space: true,
            capacityDefault: true,
            maximumAdult: true,
            maximumKid: true,
            capacityExtra: true,
            extraBedAdult: true,
            extraBedKid: true,
            status: true,
            isSellable: true,
            isLockedUnit: true,
            roomProductImages: true,
            roomProductRetailFeatures: {
              retailFeature: {
                measurementUnit: true,
                hotelRetailCategory: true
              }
            },
            roomProductStandardFeatures: {
              standardFeature: {
                id: true,
                name: true,
                code: true,
                description: true
              }
            }
          }
        }),
        this.roomProductRetailFeatureRepository.find({
          where: {
            roomProductId: In(productCartDetailsList.map((item) => item.roomProductId)),
            quantity: MoreThanOrEqual(1)
          },
          relations: {
            retailFeature: {
              hotelRetailCategory: true
            }
          }
        }),
        this.roomProductStandardFeatureRepository.find({
          where: {
            roomProductId: In(productCartDetailsList.map((item) => item.roomProductId))
          },
          select: {
            id: true,
            roomProductId: true,
            standardFeatureId: true,
            standardFeature: {
              id: true,
              name: true,
              code: true,
              description: true
            }
          },
          relations: {
            standardFeature: true
          }
        }),
        this.ratePlanRepository.find({
          where: {
            id: In(productCartDetailsList.map((item) => item.salesPlanId)),
            hotelId: hotelId
          },
          select: {
            id: true,
            hotelId: true,
            description: true,
            code: true,
            name: true,
            paymentTermCode: true,
            pmsMappingRatePlanCode: true,
            payAtHotel: true,
            payOnConfirmation: true,
            hotelCxlPolicyCode: true,
            hourPrior: true,
            displayUnit: true,
            cancellationFeeValue: true,
            cancellationFeeUnit: true,
            roundingMode: true,
            status: true,
            promoCodes: true,
            type: true,
            isPrimary: true,
            distributionChannel: true,
            sellingStrategyType: true
          }
        })
      ]);

      // Map response
      return [
        {
          propertyId: hotelId,
          cppProductCartDetailsList: await Promise.all(
            productCartDetailsList.map(async (item) => {
              const foundRoomProduct = roomProductsDetails.find(
                (product) => product.id === item.roomProductId
              );
              const foundRatePlan = ratePlansDetails.find(
                (ratePlan) => ratePlan.id === item.salesPlanId
              );

              const response = {
                roomProduct: !foundRoomProduct
                  ? null
                  : {
                      ...foundRoomProduct,
                      roomProductImages: undefined,
                      capacityAdult: foundRoomProduct.maximumAdult,
                      capacityChildren: foundRoomProduct.maximumKid,
                      maxChild: foundRoomProduct.maximumKid,
                      maximumPet: foundRoomProduct.maximumPet,
                      rfcImageList: await Promise.all(
                        foundRoomProduct.roomProductImages?.map(async (image) => ({
                          id: image.id,
                          imageUrl: await this.s3Service.getPreSignedUrl(image.imageUrl),
                          description: image.description,
                          displaySequence: image.sequence
                        })) || []
                      ),
                      retailFeatureList: roomProductRetailFeatures.map((feature) => ({
                        id: feature.retailFeature.id,
                        name: feature.retailFeature.name,
                        code: feature.retailFeature.code,
                        description: feature.retailFeature.description,
                        displaySequence: feature.retailFeature.displaySequence,
                        quantity: feature.quantity,
                        hotelRetailCategory: {
                          id: feature.retailFeature.hotelRetailCategory.id,
                          code: feature.retailFeature.hotelRetailCategory.code,
                          name: feature.retailFeature.hotelRetailCategory.name,
                          categoryType: feature.retailFeature.hotelRetailCategory.categoryType,
                          displaySequence: feature.retailFeature.hotelRetailCategory.displaySequence
                        }
                      })),
                      standardFeatureList: roomProductStandardFeatures.map((feature) => ({
                        id: feature.standardFeature.id,
                        name: feature.standardFeature.name,
                        code: feature.standardFeature.code,
                        description: feature.standardFeature.description,
                        displaySequence: feature.standardFeature.displaySequence
                      }))
                    },
                salesPlan: !foundRatePlan
                  ? null
                  : {
                      ...foundRatePlan,
                      promoCodeList: foundRatePlan.promoCodes,
                      mappingRatePlanCode: foundRatePlan.pmsMappingRatePlanCode,
                      distributionChannelList: foundRatePlan.distributionChannel
                    }
              };
              return response;
            })
          )
        }
      ];
    } catch (error) {
      this.logger.error(`Error fetching CPP product cart list: `, JSON.stringify(error));

      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      throw new BadRequestException(`Failed to fetch CPP product cart list: ${error.message}`);
    }
  }

  async deleteRoomProducts(payload: DeleteRoomProductDto) {
    try {
      const { hotelId, ids } = payload;

      //Check room product was booked in any reservation
      const reservations =
        (await this.reservationRepository.find({
          where: {
            roomProductId: In(ids),
            hotelId: hotelId
          }
        })) || [];

      const roomProductBookedIds = reservations.map((reservation) => reservation.roomProductId);
      const roomProductIdsToDelete = ids.filter((id) => !roomProductBookedIds.includes(id));

      // check room product was assigned to any rate plan
      const roomProductAssignedToRatePlan =
        (await this.roomProductRatePlanRepository.find({
          where: {
            roomProductId: In(ids),
            hotelId: hotelId
          }
        })) || [];

      if (roomProductAssignedToRatePlan?.length) {
        throw new ValidationException('Room product was assigned to rate plan');
      }

      //Delete room product
      await this.dataSource.transaction(async (manager) => {
        // Delete room product if it was not booked in any reservation
        if (roomProductIdsToDelete?.length) {
          // delete feature base price setting
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductBasePriceSetting)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product daily availability
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductDailyAvailability)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product daily selling price
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductDailySellingPrice)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product assigned units
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductAssignedUnit)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product retail features
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductRetailFeature)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product mapping
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductMapping)
            .where('room_product_id IN (:...ids) OR related_room_product_id IN (:...ids)', {
              ids: roomProductIdsToDelete
            })
            .execute();

          // delete room product rate plan
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductRatePlan)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product pricing method detail
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductPricingMethodDetail)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product standard features
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductStandardFeature)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product images
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductImage)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product extras
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductExtra)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product Mapping Pms
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductMappingPms)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product Type Mapping
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductTypeMapping)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product Extra Occupancy Rates
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductExtraOccupancyRate)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product Feature Rate Adjustments
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductFeatureRateAdjustment)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product Daily Base Prices
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductDailyBasePrice)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product Base Price Settings
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProductBasePriceSetting)
            .where('room_product_id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();

          // delete room product
          await manager
            .createQueryBuilder()
            .delete()
            .from(RoomProduct)
            .where('id IN (:...ids)', { ids: roomProductIdsToDelete })
            .execute();
        }

        // Delete room product if it was booked in any reservation
        if (roomProductBookedIds?.length || roomProductAssignedToRatePlan?.length > 0) {
          // update room product status to inactive
          await manager
            .createQueryBuilder()
            .update(RoomProduct)
            .set({
              status: RoomProductStatus.INACTIVE
            })
            .where('id IN (:...ids)', { ids: roomProductBookedIds })
            .execute();
        }
      });

      // trigger update whip room product
      this.triggerUpdateWhipRoomProduct(hotelId, roomProductIdsToDelete);

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Room products have been deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Error deleting room products: `, JSON.stringify(error));
      throw new BadRequestException(`Failed to delete room products: ${error.message}`);
    }
  }

  async bulkUpsertRoomProductRetailFeatures(payload: BulkUpsertRoomProductRetailFeaturesDto) {
    const { items, hotelId } = payload;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('Items array is required and cannot be empty');
    }

    try {
      const productIds = Array.from(new Set(items.map((item) => item.productId)));
      const hotelRetailFeatureIds = Array.from(
        new Set(items.flatMap((item) => item.retailFeatures.map((rf) => rf.hotelRetailFeatureId)))
      );

      // ------------- UPSERT -----------------
      // Build list of all room product retail features to upsert
      const allFeaturesToUpsert: Array<{
        roomProductId: string;
        retailFeatureId: string;
        quantity: number;
      }> = [];

      items.forEach((item) => {
        item.retailFeatures.forEach((rf) => {
          allFeaturesToUpsert.push({
            roomProductId: item.productId,
            retailFeatureId: rf.hotelRetailFeatureId,
            quantity: rf.quantity
          });
        });
      });

      // Find existing room product retail features for all room products
      const existingRoomProductRetailFeatures = await this.roomProductRetailFeatureRepository.find({
        where: {
          roomProductId: In(productIds),
          retailFeatureId: In(hotelRetailFeatureIds),
          quantity: MoreThanOrEqual(1)
        }
      });

      // Create a map for quick lookup: key = `${roomProductId}-${retailFeatureId}`
      const existingRoomProductRetailFeaturesMap = new Map<string, RoomProductRetailFeature>();
      existingRoomProductRetailFeatures.forEach((ef) => {
        const key = `${ef.roomProductId}-${ef.retailFeatureId}`;
        existingRoomProductRetailFeaturesMap.set(key, ef);
      });

      // Separate into updates and inserts
      const featuresToUpdate: RoomProductRetailFeature[] = [];
      const featuresToInsert: Array<{
        roomProductId: string;
        retailFeatureId: string;
        quantity: number;
      }> = [];

      allFeaturesToUpsert.forEach((feature) => {
        const key = `${feature.roomProductId}-${feature.retailFeatureId}`;
        const existing = existingRoomProductRetailFeaturesMap.get(key);

        if (existing) {
          existing.quantity = feature.quantity;
          featuresToUpdate.push(existing);
        } else {
          featuresToInsert.push(feature);
        }
      });

      // Execute updates and inserts in a transaction
      await this.dataSource.transaction(async (manager) => {
        // Update existing features
        if (featuresToUpdate.length > 0) {
          await manager.save(RoomProductRetailFeature, featuresToUpdate);
        }

        // Insert new features
        if (featuresToInsert.length > 0) {
          await manager.insert(
            RoomProductRetailFeature,
            featuresToInsert.map((f) => ({
              roomProductId: f.roomProductId,
              retailFeatureId: f.retailFeatureId,
              hotelId: hotelId,
              quantity: f.quantity
            }))
          );
        }

        // const foundQuantityZero = await manager.find(RoomProductRetailFeature, {
        //   where: {
        //     quantity: 0
        //   },
        //   select: { id: true, quantity: true }
        // });

        // if (foundQuantityZero.length > 0) {
        //   await manager
        //     .getRepository(RoomProductRetailFeature)
        //     .delete(foundQuantityZero.map((f) => f.id));
        // }
      });

      // ------------- UPDATE FEATURE STRING -----------------
      await this.syncFeatureStringByProductIds(hotelId, productIds);
      return {
        status: ResponseContentStatusEnum.SUCCESS,
        message: 'Room product retail features have been upserted successfully',
        updated: featuresToUpdate.length,
        created: featuresToInsert.length
      };
    } catch (error) {
      this.logger.error(
        `Error bulk upserting room product retail features: `,
        JSON.stringify(error)
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to bulk upsert room product retail features: ${error.message}`
      );
    }
  }

  // let productIds null to sync all products by hotelId
  async syncFeatureStringByProductIds(hotelId: string, productIds?: string[]) {
    // All hotel retail features to map new feature string.
    const hotelRetailFeaturesSorted = await this.hotelRetailFeatureRepository.find({
      where: {
        hotelId,
        status: HotelRetailFeatureStatusEnum.ACTIVE
      },
      order: {
        createdAt: 'ASC',
        code: 'ASC'
      }
    });
    const roomProductRetailFeatures = await this.roomProductRetailFeatureRepository.find({
      where: {
        hotelId,
        quantity: MoreThanOrEqual(1),
        ...(productIds ? { roomProductId: In(productIds) } : {})
      },
      order: {
        retailFeature: {
          createdAt: 'ASC',
          code: 'ASC'
        }
      },
      relations: {
        retailFeature: true
      }
    });
    const products = await this.roomProductRepository.find({
      where: { ...(productIds ? { id: In(productIds) } : {}) }
    });
    for (let product of products) {
      const roomProductRetailFeaturesByProduct = roomProductRetailFeatures.filter(
        (roomProductRetailFeature) => roomProductRetailFeature.roomProductId === product.id
      );
      const sortedHotelFeatures = hotelRetailFeaturesSorted.filter((i) =>
        roomProductRetailFeaturesByProduct.some((j) => j.retailFeatureId === i.id)
      );
      const featureString = RoomUnitUtil.generateFeatureStringV2(
        roomProductRetailFeaturesByProduct,
        sortedHotelFeatures
      );
      product.featureString = featureString;
    }
    await this.roomProductRepository.save(products);
    return products;
  }

  async onboardWhipRoomProduct(hotelId: string) {
    if (!hotelId) {
      return false;
    }

    const roomProducts = await this.roomProductRepository.find({
      where: {
        hotelId,
        deletedAt: IsNull(),
        status: RoomProductStatus.ACTIVE,
        distributionChannel: Raw((alias) => `${alias} && ARRAY[:...channels]`, {
          channels: [DistributionChannel.GV_SALES_ENGINE]
        })
      },
      select: ['id']
    });

    if (!roomProducts || roomProducts.length == 0) {
      return false;
    }

    await this.triggerUpdateWhipRoomProduct(
      hotelId,
      roomProducts.map((x) => x.id)
    );

    return true;
  }

  async triggerUpdateWhipRoomProduct(hotelId: string, roomProductIds: string[]) {
    this.googleService.emit({ cmd: 'google.property.room' }, { hotelId, roomProductIds });
  }
}
