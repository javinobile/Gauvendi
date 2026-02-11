import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { BadRequestException, InternalServerErrorException } from '@src/core/exceptions';
import { Helper } from '@src/core/helper/utils';
import { RedisTaskContext, RedisTaskNamespace, RedisTaskService } from '@src/core/redis';
import { HotelConfigurationRepository } from '@src/modules/hotel-configuration/hotel-configuration.repository';
import { HotelRepository } from '@src/modules/hotel/repositories/hotel.repository';
import { Mutex } from 'async-mutex';
import { addDays, format } from 'date-fns';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductPricingMethodDetail } from 'src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import {
  ConfiguratorModeEnum,
  ConfiguratorTypeEnum,
  ConnectorTypeEnum,
  HotelAgeCategoryCodeEnum,
  HotelConfigurationTypeEnum,
  RatePlanStatusEnum,
  RoomProductBasePriceSettingModeEnum,
  RoomProductPricingMethodAdjustmentUnitEnum,
  RoomProductPricingMethodEnum,
  RoomProductStatus,
  RoomProductType
} from 'src/core/enums/common';
import { RatePlanPricingMappingDto } from 'src/modules/pms/pms.dto';
import { PmsService } from 'src/modules/pms/pms.service';
import { In, IsNull, Repository } from 'typeorm';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan.repository';
import { RoomProductSellingPriceService } from '../room-product-selling-price/room-product-selling-price.service';
import { AttributeLogicService } from './attribute-logic.service';
import { DerivedProductService } from './derived-product.service';
import { HandlePositioningService } from './handle-positioning.service';
import { LinkProductService } from './link-product.service';
import { ReversedProductService } from './reversed-product.service';
import {
  PmsEventPricingUpdateDto,
  PushPmsRatePlanPricingDto,
  UpdateRoomProductPricingMethodDetailDto
} from './room-product-pricing-method-detail.dto';

import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { ConfiguratorSetting } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { RoomProductPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.service';
import { PushToPmsTaskKeyComponents } from '@src/core/redis';
import { PushToPmsTaskData } from '@src/core/redis/redis-task.interface';
import { processInBatches } from '@src/core/utils/batch-processor.util';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { isAxiosError } from 'axios';
import { RoomProductFeatureRateAdjustment } from '@src/core/entities/room-product-feature-rate-adjustment.entity';
import { HotelConfigurationsService } from '@src/modules/hotel-configurations/hotel-configurations.service';
import { HotelPriceSettingsConfigValue } from '@src/core/entities/hotel-entities/hotel-configuration.entity';

@Injectable()
export class RoomProductPricingMethodDetailService {
  private readonly logger = new Logger(RoomProductPricingMethodDetailService.name);
  private readonly pmsPricingMutex = new Mutex();
  constructor(
    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(Connector, DbName.Postgres)
    private readonly connectorRepository: Repository<Connector>,
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,
    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    private readonly roomProductSellingPriceService: RoomProductSellingPriceService,

    private readonly pmsService: PmsService,

    private readonly handlePositioningService: HandlePositioningService,

    private readonly linkProductService: LinkProductService,

    private readonly derivedProductService: DerivedProductService,

    private readonly attributeLogicService: AttributeLogicService,

    private readonly reversedProductService: ReversedProductService,
    private readonly roomProductPricingService: RoomProductPricingService,
    private readonly hotelConfigurationRepository: HotelConfigurationRepository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly hotelRepository: HotelRepository,
    private readonly redisTaskService: RedisTaskService
  ) {}

  async triggerAllRoomProductPricingMethodDetail(input: {
    hotelId: string;
    ratePlanIds?: string[];
    from?: string;
    to?: string;
    isPushToPms?: boolean;
  }) {
    const { hotelId, ratePlanIds, from, to, isPushToPms = true } = input;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }
    const where: any = {
      hotelId
    };
    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    const roomProductPricingMethodDetail = await this.roomProductPricingMethodDetailRepository.find(
      {
        where: {
          ...where
        }
      }
    );

    const roomProductIds = Array.from(
      new Set(roomProductPricingMethodDetail.map((item) => item.roomProductId))
    );

    const [roomProducts, ratePlans] = await Promise.all([
      roomProductIds.length > 0
        ? await this.roomProductRepository.find({
            where: {
              hotelId,
              id: In(roomProductPricingMethodDetail.map((item) => item.roomProductId))
            },
            select: {
              id: true,
              type: true
            }
          })
        : Promise.resolve([]),
      ratePlanIds && ratePlanIds.length > 0
        ? this.ratePlanRepository.find({
            where: {
              hotelId,
              id: In(ratePlanIds)
            },
            select: {
              id: true,
              rfcAttributeMode: true
            }
          })
        : Promise.resolve([])
    ]);

    if (roomProductPricingMethodDetail.length === 0) {
      this.logger.debug(
        `No room product pricing method detail found for hotel ${hotelId} and rate plan ids ${ratePlanIds?.join(', ')}`
      );
      return [];
    }

    // Separate PMS_PRICING items from other pricing methods
    const pmsItems = roomProductPricingMethodDetail.filter(
      (item) => item.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING
    );
    const nonPmsItems = roomProductPricingMethodDetail.filter(
      (item) => item.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING
    );

    // Process non-PMS items in parallel (existing behavior)
    const nonPmsPromises = nonPmsItems.map((item) => {
      const {
        hotelId,
        roomProductId,
        ratePlanId,
        pricingMethod,
        targetRoomProductId,
        targetRatePlanId,
        pricingMethodAdjustmentValue,
        pricingMethodAdjustmentUnit
      } = item;

      const ratePlan = ratePlans.find((item) => item.id === ratePlanId);

      switch (pricingMethod) {
        case RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING:
          return this.calculateFeatureBasedPricing({
            from,
            to,
            hotelId,
            roomProductId,
            type: RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING,
            ratePlanId,
            unit: pricingMethodAdjustmentUnit,
            value: pricingMethodAdjustmentValue?.toString(),
            isPush: isPushToPms
          });

        case RoomProductPricingMethodEnum.LINK:
          return this.calculateLinkedPricing({
            from,
            to,
            hotelId,
            roomProductId,
            ratePlanId,
            type: RoomProductPricingMethodEnum.LINK,
            targetRoomProductId,
            value: pricingMethodAdjustmentValue?.toString(),
            unit: pricingMethodAdjustmentUnit,
            isPush: isPushToPms
          });

        case RoomProductPricingMethodEnum.DERIVED:
          return this.derivedProduct({
            from,
            to,
            hotelId,
            roomProductId,
            targetRatePlanId,
            ratePlanId,
            type: RoomProductPricingMethodEnum.DERIVED,
            value: pricingMethodAdjustmentValue?.toString(),
            unit: pricingMethodAdjustmentUnit,
            isPush: isPushToPms
          });
        default:
          return Promise.resolve(null);
      }
    });

    // Process PMS items sequentially
    try {
      await this.triggerPmsPricingAfterRatePlanAdjustmentChangeV2({
        hotelId,
        roomProducts: roomProducts,
        roomProductPricingMethodDetails: pmsItems,
        fromDate: from,
        toDate: to
      });
    } catch (error) {
      this.logger.error(`Error processing PMS pricing for hotel ${hotelId}:`, error);
    }

    // Run both parallel and sequential processing
    await Promise.allSettled(nonPmsPromises);

    const fromDate = from || format(new Date(), DATE_FORMAT);
    const toDate = to || format(addDays(new Date(), 365), DATE_FORMAT);

    // Process derived products in batches of 50 to avoid overload (fire and forget)
    this.processDerivedProductsInBatches(roomProductPricingMethodDetail, fromDate, toDate);

    return roomProductPricingMethodDetail;
  }

  /**
   * Process derived products in batches (fire and forget)
   * @param items List of pricing method details to process
   * @param fromDate Start date
   * @param toDate End date
   */
  private async processDerivedProductsInBatches(
    items: RoomProductPricingMethodDetail[],
    fromDate: string,
    toDate: string
  ): Promise<void> {
    const BATCH_SIZE = 50;
    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((item) =>
          this.derivedProductService.derivedProduct({
            roomProductPricingMethodDetail: item,
            fromDate,
            toDate
          })
        );
        await Promise.allSettled(batchPromises);
      }
    } catch (error) {
      this.logger.error('Error processing derived products in batches:', error);
    }
  }

  async triggerPricingAfterTaxChange(input: {
    hotelId: string;
    ratePlanIds?: string[];
    from?: string;
    to?: string;
  }) {
    const { hotelId, ratePlanIds, from, to } = input;
  }

  async triggerPmsPricingAfterRatePlanAdjustmentChangeV2(input: {
    hotelId: string;
    roomProducts: {
      id: string;
      type: RoomProductType;
    }[];
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[];
    fromDate?: string;
    toDate?: string;
  }) {
    const { hotelId, roomProductPricingMethodDetails, roomProducts } = input;

    const fromDate = input.fromDate || format(new Date(), DATE_FORMAT);
    const toDate = input.toDate || format(addDays(new Date(), 365), DATE_FORMAT);
    const pmsRoomProductPricingMethodDetails = roomProductPricingMethodDetails.filter(
      (item) => item.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING
    );

    const reversedRFCRoomProducts = await this.roomProductPricingService.getReversedRFCRoomProduct({
      hotelId: input.hotelId,
      methodDetails: pmsRoomProductPricingMethodDetails
    });

    const roomProductMap = groupByToMapSingle(roomProducts, (item) => item.id);
    const roomProductPricingMethodMap = groupByToMap(
      pmsRoomProductPricingMethodDetails,
      (item) => item.ratePlanId
    );
    const reversedRFCRoomProductMap = groupByToMap(
      reversedRFCRoomProducts,
      (item) => item.ratePlanId
    );

    const ratePlanIds = Array.from(roomProductPricingMethodMap.keys());

    await Promise.all(
      ratePlanIds.map(async (ratePlanId) => {
        const findRoomProductPricingMethodDetails =
          roomProductPricingMethodMap.get(ratePlanId) || [];
        const findRoomProductIds = findRoomProductPricingMethodDetails.map(
          (item) => item.roomProductId
        );
        const findReversedRFCRoomProductIds =
          reversedRFCRoomProductMap.get(ratePlanId)?.map((item) => item.rfcRoomProductId) || [];
        const findRoomProducts = findRoomProductIds
          .map((item) => roomProductMap.get(item))
          .filter((item) => item !== undefined);

        const rfcRoomProductIds = findRoomProducts
          .filter((item) => item.type === RoomProductType.RFC)
          .map((item) => item.id);
        const mrfcRoomProductIds = findRoomProducts
          .filter((item) => item.type === RoomProductType.MRFC)
          .map((item) => item.id);
        const erfcRoomProductIds = findRoomProducts
          .filter((item) => item.type === RoomProductType.ERFC)
          .map((item) => item.id);

        const pmsRfcRoomProductIds = rfcRoomProductIds.filter(
          (item) => !findReversedRFCRoomProductIds.includes(item)
        );

        await Promise.all(
          [...pmsRfcRoomProductIds, ...mrfcRoomProductIds, ...erfcRoomProductIds].map(
            async (roomProductId) => {
              const results =
                await this.roomProductSellingPriceService.calculateSellingPriceFromPms({
                  hotelId: input.hotelId,
                  roomProductId,
                  ratePlanId: ratePlanId,
                  fromDate: fromDate,
                  toDate: toDate,
                  pmsBasePrices: [],
                  isFetchPmsBasePrices: true
                });

              await this.roomProductSellingPriceService.insertSellingPrices(results, {
                hotelId: input.hotelId,
                roomProductId,
                ratePlanId: ratePlanId,
                fromDate: fromDate,
                toDate: toDate
              });
            }
          )
        );

        await Promise.all(
          mrfcRoomProductIds.map(async (roomProductId) => {
            const roomProductPricingMethodDetail = input.roomProductPricingMethodDetails.find(
              (item) =>
                item.roomProductId === roomProductId &&
                item.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING
            );
            if (!roomProductPricingMethodDetail) {
              return;
            }
            await this.reversedProductService.reversedProductV2(
              roomProductPricingMethodDetail,
              fromDate,
              toDate
            );
          })
        );
      })
    );
  }

  async createPricingMethodDetail(body: UpdateRoomProductPricingMethodDetailDto) {
    const {
      hotelId,
      ratePlanId,
      roomProductId,
      type,
      value,
      unit,
      targetRatePlanId,
      targetRoomProductId,
      pmsRatePlanCode,
      mappingRoomProductId
    } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }
    if (!ratePlanId) {
      throw new BadRequestException('Rate Plan ID is required');
    }
    if (!roomProductId) {
      throw new BadRequestException('Room Product ID is required');
    }

    if (type === RoomProductPricingMethodEnum.PMS_PRICING && !pmsRatePlanCode) {
      return null;
      throw new BadRequestException('Pms Rate Plan Code is required for type PMS_PRICING');
    }

    if (type === RoomProductPricingMethodEnum.LINK && !targetRoomProductId) {
      throw new BadRequestException('Target Room Product ID is required for type LINK');
    }

    if (type === RoomProductPricingMethodEnum.DERIVED && !targetRatePlanId) {
      throw new BadRequestException('Target Rate Plan ID is required for type DERIVED');
    }

    try {
      const pricingMethodDetail: Partial<RoomProductPricingMethodDetail> = {
        hotelId,
        ratePlanId,
        roomProductId,
        pricingMethodAdjustmentValue: value ? +value : undefined,
        pricingMethodAdjustmentUnit: unit || undefined,
        pricingMethod: type
      };

      switch (type) {
        case RoomProductPricingMethodEnum.PMS_PRICING:
          if (pmsRatePlanCode) {
            pricingMethodDetail.pmsRatePlanCode = pmsRatePlanCode;
            // for apaleo pms, mapping 1:1 rateplanCode and roomProductCode, so no need to mapping room product id
            pricingMethodDetail.mappingRoomProductId = mappingRoomProductId || '';
          }
          break;

        case RoomProductPricingMethodEnum.DERIVED:
          if (targetRatePlanId) {
            pricingMethodDetail.targetRatePlanId = targetRatePlanId;
          } else {
            throw new BadRequestException('Target Rate Plan ID is required for DERIVED');
          }
          break;

        case RoomProductPricingMethodEnum.LINK:
          if (targetRoomProductId) {
            pricingMethodDetail.targetRoomProductId = targetRoomProductId;
          } else {
            throw new BadRequestException('Target Room Product ID is required for LINK');
          }
          break;

        case RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING:
          break;

        default:
          throw new BadRequestException(`Unsupported pricing method type: ${type}`);
      }

      // use upsert to update the pricing method detail
      const result = await this.roomProductPricingMethodDetailRepository
        .createQueryBuilder()
        .insert()
        .into(RoomProductPricingMethodDetail)
        .values(pricingMethodDetail)
        .orUpdate(
          [
            'pricing_method_adjustment_value',
            'pricing_method_adjustment_unit',
            'pricing_method',
            'mapping_room_product_id',
            'target_rate_plan_id',
            'target_room_product_id',
            'pms_rate_plan_code'
          ],
          ['hotel_id', 'rate_plan_id', 'room_product_id']
        )
        .execute();

      const roomProductPricingMethodDetail =
        await this.roomProductPricingMethodDetailRepository.findOne({
          where: {
            hotelId,
            roomProductId,
            ratePlanId
          },
          ...this.methodDetailSelectOptions
        });

      return roomProductPricingMethodDetail;
    } catch (error) {
      throw new BadRequestException('Error creating pricing method detail' + error.message);
    }
  }

  private get methodDetailSelectOptions(): any {
    return {
      relations: [
        'ratePlan',
        'ratePlan.baseSetting',
        'roomProduct.roomProductBasePriceSettings',
        'roomProduct'
      ],
      select: {
        id: true,
        hotelId: true,
        roomProductId: true,
        ratePlanId: true,
        pricingMethod: true,
        pricingMethodAdjustmentValue: true,
        pricingMethodAdjustmentUnit: true,
        mappingRoomProductId: true,
        targetRatePlanId: true,
        targetRoomProductId: true,
        pmsRatePlanCode: true,
        ratePlan: {
          id: true,
          code: true,
          name: true,
          mrfcPositioningMode: true,
          rfcAttributeMode: true,
          baseSetting: {
            id: true,
            ratePlanId: true,
            derivedRatePlanId: true
          }
        },
        roomProduct: {
          id: true,
          type: true,
          roomProductBasePriceSettings: {
            id: true,
            mode: true,
            fixedPrice: true
          }
        }
      }
    } as const;
  }

  /**
   * Removes duplicate method details based on hotelId, roomProductId, and ratePlanId
   * @param methodDetails Array of RoomProductPricingMethodDetail to deduplicate
   * @returns Unique array of RoomProductPricingMethodDetail
   */
  private uniqueMethodDetails(
    methodDetails: RoomProductPricingMethodDetail[]
  ): RoomProductPricingMethodDetail[] {
    const seen = new Map<string, RoomProductPricingMethodDetail>();

    for (const methodDetail of methodDetails) {
      const key = `${methodDetail.hotelId}-${methodDetail.roomProductId}-${methodDetail.ratePlanId}`;
      if (!seen.has(key)) {
        seen.set(key, methodDetail);
      }
    }

    return Array.from(seen.values());
  }

  async syncPmsRatePlanPricingDetail(
    hotelId: string,
    pmsMappingRatePlanCode: string,
    fromDate: string,
    toDate: string
  ): Promise<RatePlanPricingMappingDto[]> {
    // Use mutex to ensure sequential calls to external PMS system
    this.logger.log(
      `Acquiring mutex for PMS pricing sync - Hotel: ${hotelId}, RatePlan: ${pmsMappingRatePlanCode}`
    );

    const ratePlanPricing: RatePlanPricingMappingDto[] =
      await this.pmsService.getPmsRatePlanPricing({
        hotelId,
        ratePlanMappingPmsCode: pmsMappingRatePlanCode,
        startDate: fromDate,
        endDate: toDate
      });

    this.logger.log(
      `Released mutex for PMS pricing sync - Hotel: ${hotelId}, RatePlan: ${pmsMappingRatePlanCode}`
    );
    return ratePlanPricing;
  }

  async calculatePmsPricing(
    body: UpdateRoomProductPricingMethodDetailDto,
    isReversedProduct: boolean = false
  ) {
    try {
      const { hotelId, from, to } = body;

      const config = await this.hotelConfigurationRepository.findOneByConfigType({
        hotelId,
        configType: HotelConfigurationTypeEnum.PRICE_SETTINGS
      });

      const priceSetting = config?.configValue as HotelPriceSettingsConfigValue;

      let pullPriceDate = 365;
      if (priceSetting) {
        pullPriceDate = priceSetting.metadata?.pullPriceDate || 365;
      }

      const fromDate = from || format(new Date(), DATE_FORMAT);
      const toDate = to || format(addDays(new Date(), Number(pullPriceDate)), DATE_FORMAT);

      const methodDetail = await this.createPricingMethodDetail(body);

      if (!methodDetail) {
        this.logger.warn('Pricing method detail not found');
        return;
      }

      if (methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING) {
        this.logger.warn('Pricing method is not PMS_PRICING');
        return;
      }

      const { pmsRatePlanCode } = methodDetail;

      // get hotel connector pms
      // for apaleo pms, mapping 1:1 rateplanCode and roomProductCode
      const hotelConnectorPms = await this.connectorRepository.findOne({
        where: {
          hotelId,
          connectorType: ConnectorTypeEnum.APALEO
        },
        select: {
          connectorType: true
        }
      });

      const isApaleoPms = hotelConnectorPms?.connectorType === ConnectorTypeEnum.APALEO;

      // flow pms pricing to selling price
      const ratePlanMappingPmsCode = pmsRatePlanCode;
      const ratePlanPricing = await this.syncPmsRatePlanPricingDetail(
        hotelId,
        ratePlanMappingPmsCode,
        fromDate,
        toDate
      );

      const result = await this.distributePmsRatePlanPricing(
        methodDetail,
        ratePlanPricing,
        fromDate,
        toDate,
        isApaleoPms
      );

      const pushToPmsTaskKeyComponents = new PushToPmsTaskKeyComponents();
      pushToPmsTaskKeyComponents.setIdentifier({
        hotelId: body.hotelId,
        ratePlanId: body.ratePlanId,
        roomProductId: body.roomProductId
      });

      const task = await this.redisTaskService.getPushToPmsTask(pushToPmsTaskKeyComponents);

      this.logger.log(
        `Push to PMS task deleted for hotel ${body.hotelId} and room product ${body.roomProductId} and rate plan ${body.ratePlanId}`
      );

      await this.redisTaskService.deletePushToPmsTask(pushToPmsTaskKeyComponents);

      return result;
    } catch (error) {
      throw new BadRequestException('Error in sync PMS rate plan pricing' + error.message);
    }
  }

  async updateConfiguratorSetting(
    roomProductRatePlanId: string,
    setting: {
      type: ConfiguratorTypeEnum;
      connectorType: ConnectorTypeEnum;
      pmsRatePlanCode?: string;
      pmsRoomProductCode?: string;
      lastPushedAt?: string;
      mode: ConfiguratorModeEnum;
    }
  ) {
    return this.roomProductRatePlanRepository.updateConfiguratorSetting(
      roomProductRatePlanId,
      setting
    );
  }

  async pushPmsRatePlanPricing(
    body: PushPmsRatePlanPricingDto
  ): Promise<false | { fromDate: string; toDate: string }> {
    try {
      const {
        hotelId,
        from,
        to,
        connectorType,
        ratePlanId,
        roomProductId,
        pmsRatePlanCode,
        pmsRoomProductCode
      } = body;

      const [hotel, roomProductRatePlan] = await Promise.all([
        this.hotelRepository.findHotelById(hotelId, ['baseCurrency']),
        this.roomProductRatePlanRepository.findOne({
          ratePlanId,
          roomProductId,
          hotelId
        })
      ]);
      if (!roomProductRatePlan) {
        throw new BadRequestException('Room product rate plan not found');
      }
      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }
      const currency = hotel.baseCurrency.code;

      let roomProductMappingPmsCode = pmsRoomProductCode;
      let ratePlanMappingPmsCode = pmsRatePlanCode;
      let configuratorSetting: ConfiguratorSetting | null = null;

      const pmsCode = this.roomProductRatePlanRepository.getPmsCodeFromConfiguratorSetting(
        roomProductRatePlan.configuratorSetting,
        connectorType || ConnectorTypeEnum.APALEO
      );

      roomProductMappingPmsCode = pmsCode?.pmsRoomProductCode;
      ratePlanMappingPmsCode = pmsCode?.pmsRatePlanCode;
      configuratorSetting = roomProductRatePlan.configuratorSetting;

      if (
        configuratorSetting?.type !== ConfiguratorTypeEnum.PUSH_PMS ||
        configuratorSetting?.mode !== ConfiguratorModeEnum.ENABLE
      ) {
        this.logger.warn(
          'Configurator setting type is not PUSH_PMS or mode is not ENABLE, rate plan id: ' +
            ratePlanId +
            ' room product id: ' +
            roomProductId
        );
        return false;
      }

      if (!roomProductMappingPmsCode || !ratePlanMappingPmsCode) {
        this.logger.warn(
          'Cannot push PMS pricing, PMS code not found rate plan id: ' +
            ratePlanId +
            ' room product id: ' +
            roomProductId
        );
        return false;
      }

      const fromDate = from || format(new Date(), DATE_FORMAT);
      const toDate = await this.hotelConfigurationRepository.getLastSellableDate(hotelId, from, to);

      const ranges = Helper.generateDateRange(fromDate, toDate);
      const dailySellingPrices = await this.roomProductRatePlanRepository.findDailySellingPrices({
        hotelId,
        ratePlanIds: [ratePlanId],
        roomProductIds: [roomProductId],
        dates: ranges,
        order: {
          date: 'ASC'
        }
      });

      if (dailySellingPrices && dailySellingPrices.length > 0) {
        try {
          await this.pmsService.pushPmsRatePlanPricing(
            hotelId,
            dailySellingPrices.map((dailySellingPrice) => ({
              roomProductMappingPmsCode: roomProductMappingPmsCode!,
              ratePlanMappingPmsCode: ratePlanMappingPmsCode!,
              date: dailySellingPrice.date,
              price: dailySellingPrice.grossPrice,
              currency: currency
            }))
          );

          if (configuratorSetting) {
            await this.roomProductRatePlanRepository.update(roomProductRatePlan.id, {
              configuratorSetting: {
                ...configuratorSetting,
                lastPushedAt: new Date().toISOString()
              }
            });
          }

          const components = new PushToPmsTaskKeyComponents();
          components.setIdentifier({
            hotelId,
            ratePlanId,
            roomProductId
          });
          await this.redisTaskService.deletePushToPmsTask(components);
        } catch (error) {
          if (isAxiosError(error)) {
            if (error.response?.status === 429) {
              const methodDetail = await this.roomProductPricingMethodDetailRepository.findOne({
                where: {
                  hotelId,
                  ratePlanId,
                  roomProductId
                }
              });

              if (methodDetail) {
                await this.triggerPushToPms({
                  hotelId: body.hotelId,
                  items: [methodDetail],
                  fromDate,
                  toDate
                });
              }

              return { fromDate, toDate };
            }
          } else {
            throw new InternalServerErrorException(
              'Error in push PMS rate plan pricing' + error.message
            );
          }
        }
      }

      return { fromDate, toDate };
    } catch (error) {
      throw new BadRequestException('Error in push PMS rate plan pricing' + error.message);
    }
  }

  async distributePmsRatePlanPricing(
    methodDetail: RoomProductPricingMethodDetail,
    ratePlanPricing: RatePlanPricingMappingDto[],
    fromDate: string,
    toDate: string,
    isApaleoPms: boolean = false
  ) {
    const {
      hotelId,
      roomProductId,
      ratePlanId,
      mappingRoomProductId,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit
    } = methodDetail;
    try {
      let filterRoomProductPricing: RatePlanPricingMappingDto[] = [];

      if (isApaleoPms) {
        filterRoomProductPricing = ratePlanPricing.map((pricing) => ({
          ...pricing,
          roomProductMappingPmsCode: methodDetail.mappingRoomProductId!
        }));
      } else {
        filterRoomProductPricing = ratePlanPricing.filter(
          (pricing) => pricing.roomProductMappingPmsCode === mappingRoomProductId
        );
      }

      if (filterRoomProductPricing.length === 0) {
        this.logger.warn('No room product pricing found');
        return [];
      }

      // apply adjustment if have
      if (pricingMethodAdjustmentValue && pricingMethodAdjustmentUnit) {
        filterRoomProductPricing.forEach((pricing) => {
          if (
            pricingMethodAdjustmentUnit === RoomProductPricingMethodAdjustmentUnitEnum.PERCENTAGE
          ) {
            pricing.grossPrice = pricing.grossPrice * (1 + pricingMethodAdjustmentValue / 100);
            pricing.netPrice = pricing.netPrice * (1 + pricingMethodAdjustmentValue / 100);
          } else {
            pricing.grossPrice = pricing.grossPrice + pricingMethodAdjustmentValue;
            pricing.netPrice = pricing.netPrice + pricingMethodAdjustmentValue;
          }
        });
      }

      // const result = await this.roomProductSellingPriceService.calculateSellingPrice({
      //   hotelId,
      //   roomProductId,
      //   roomProductType: roomProduct.type,
      //   ratePlanId,
      //   fromDate,
      //   toDate,
      //   pmsBasePrices: filterRoomProductPricing,
      //   pricingDataSource: PricingDataSourceEnum.PMS
      // });

      const results = await this.roomProductSellingPriceService.calculateSellingPriceFromPms({
        hotelId,
        roomProductId,
        ratePlanId,
        fromDate,
        toDate,
        pmsBasePrices: filterRoomProductPricing
      });

      const response = await this.roomProductSellingPriceService.insertSellingPrices(results, {
        hotelId,
        roomProductId,
        ratePlanId,
        fromDate,
        toDate
      });

      const relatedRoomProductIds = await this.roomProductPricingService.getRelatedRoomProductIds({
        hotelId,
        roomProductId,
        roomProductType: RoomProductType.MRFC
      });
      if (relatedRoomProductIds.length > 0) {
        await this.roomProductPricingMethodDetailRepository
          .createQueryBuilder()
          .insert()
          .into(RoomProductPricingMethodDetail)
          .values(
            relatedRoomProductIds.map((id) => ({
              hotelId,
              roomProductId: id,
              ratePlanId,
              targetRoomProductId: roomProductId,
              pricingMethod: RoomProductPricingMethodEnum.REVERSED_PRICING
            }))
          )
          .orUpdate(['pricing_method'], ['hotel_id', 'room_product_id', 'rate_plan_id'])
          .execute();
      }

      const roomProduct = await this.roomProductRepository.findOne({
        where: {
          hotelId,
          id: roomProductId
        },
        select: {
          type: true
        }
      });

      if (roomProduct) {
        await this.triggerDerivedPricingV2({
          hotelId,
          roomProductType: roomProduct.type,
          methodDetail,
          fromDate,
          toDate
        });
      }

      return results;
    } catch (error) {
      throw new BadRequestException('Error in distribute PMS rate plan pricing' + error.message);
    }
  }

  async pullAllPricingFromPms(input: {
    hotelId: string;
    ratePlanIds?: string[];
    fromDate?: string;
    toDate?: string;
  }) {
    const { hotelId, ratePlanIds } = input;

    const startTime = Date.now();
    const fromDate = input.fromDate || format(new Date(), DATE_FORMAT);
    const toDate = input.toDate || format(addDays(new Date(), 365), DATE_FORMAT);

    this.logger.log(`[pullAllPricingFromPms] Started for hotel ${hotelId}}`);

    // Fetch rate plans and room products
    const [ratePlans, roomProducts] = await Promise.all([
      this.ratePlanRepository.find({
        where: {
          hotelId,
          id: ratePlanIds && ratePlanIds.length > 0 ? In(ratePlanIds) : undefined,
          status: In([RatePlanStatusEnum.ACTIVE])
        }
      }),
      this.roomProductRepository.find({
        where: {
          hotelId,
          deletedAt: IsNull(),
          status: In([RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT])
        }
      })
    ]);

    const findRoomProductIds = roomProducts.map((roomProduct) => roomProduct.id);
    const findRatePlanIds = ratePlans.map((ratePlan) => ratePlan.id);
    const roomProductMap = groupByToMapSingle(roomProducts, (item) => item.id);
    const roomProductPricingMethodDetails =
      await this.roomProductPricingService.getRoomProductPricingMethodDetails({
        hotelId,
        roomProductIds: findRoomProductIds,
        ratePlanIds: findRatePlanIds
      });

    // Categorize pricing methods
    const categorizedPricing = this.roomProductPricingService.categorizePricingMethods(
      roomProductPricingMethodDetails,
      roomProductMap
    );

    const hotelConnectorPms = await this.connectorRepository.findOne({
      where: {
        hotelId,
        connectorType: ConnectorTypeEnum.APALEO
      },
      select: {
        connectorType: true
      }
    });

    const isApaleoPms = hotelConnectorPms?.connectorType === ConnectorTypeEnum.APALEO;

    await processInBatches(
      [...categorizedPricing.pmsPricing, ...categorizedPricing.reversedPricing].filter(
        (item) => item.pmsRatePlanCode
      ),
      10,
      50,
      async (methodDetail: RoomProductPricingMethodDetail) => {
        try {
          const ratePlanPricing = await this.syncPmsRatePlanPricingDetail(
            hotelId,
            methodDetail.pmsRatePlanCode,
            fromDate,
            toDate
          );

          const result = await this.distributePmsRatePlanPricing(
            methodDetail,
            ratePlanPricing,
            fromDate,
            toDate,
            isApaleoPms
          );
        } catch (error) {
          this.logger.error(`Error distributing PMS rate plan pricing: ${error.message}`);
        }
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`[pullAllPricingFromPms] Completed for hotel ${hotelId} in ${duration}s`);

    return 'Success';
  }

  async triggerAllPricing(input: {
    hotelId: string;
    ratePlanIds?: string[];
    fromDate?: string;
    toDate?: string;
    isPushToPms?: boolean;
  }) {
    const { hotelId, ratePlanIds, isPushToPms } = input;
    const startTime = Date.now();
    const fromDate = input.fromDate || format(new Date(), DATE_FORMAT);
    const toDate = input.toDate || format(addDays(new Date(), 365), DATE_FORMAT);

    this.logger.log(
      `[triggerAllPricing] Started for hotel ${hotelId} and rate plan ids ${ratePlanIds?.join(', ')}`
    );

    // Fetch rate plans and room products
    const [ratePlans, roomProducts] = await Promise.all([
      this.ratePlanRepository.find({
        where: {
          hotelId,
          id: ratePlanIds && ratePlanIds.length > 0 ? In(ratePlanIds) : undefined,
          status: In([RatePlanStatusEnum.ACTIVE])
        }
      }),
      this.roomProductRepository.find({
        where: {
          hotelId,
          deletedAt: IsNull(),
          status: In([RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT])
        }
      })
    ]);

    const findRoomProductIds = roomProducts.map((roomProduct) => roomProduct.id);
    const findRatePlanIds = ratePlans.map((ratePlan) => ratePlan.id);
    const roomProductMap = groupByToMapSingle(roomProducts, (item) => item.id);
    const roomProductPricingMethodDetails =
      await this.roomProductPricingService.getRoomProductPricingMethodDetails({
        hotelId,
        roomProductIds: findRoomProductIds,
        ratePlanIds: findRatePlanIds
      });

    // Categorize pricing methods
    const categorizedPricing = this.roomProductPricingService.categorizePricingMethods(
      roomProductPricingMethodDetails,
      roomProductMap
    );

    const totalItems =
      categorizedPricing.featureBasedPricing.length +
      categorizedPricing.reversedPricing.length +
      categorizedPricing.rfcCombinedPricing.length +
      categorizedPricing.rfcAveragePricing.length +
      categorizedPricing.erfcAveragePricing.length +
      categorizedPricing.erfcCombinedPricing.length +
      categorizedPricing.linkedPricing.length +
      categorizedPricing.derivedPricing.length +
      categorizedPricing.pmsPricing.length;

    this.logger.log(
      `[triggerAllPricing] Hotel ${hotelId}: ${totalItems} items to process (${ratePlans.length} rate plans × ${roomProducts.length} products)`
    );

    // Handle reversed pricing for MRFC products
    await this.handleReversedPricing(
      categorizedPricing.reversedPricing,
      roomProductPricingMethodDetails,
      hotelId
    );

    // Process all pricing types sequentially to avoid memory overload
    await Promise.all([
      this.processPricingBatch(categorizedPricing.featureBasedPricing, hotelId, fromDate, toDate),
      this.processPmsPricing(
        [...categorizedPricing.pmsPricing, ...categorizedPricing.reversedPricing],
        hotelId,
        fromDate,
        toDate
      )
    ]);

    await this.processPricingBatch(
      categorizedPricing.reversedPricing,
      hotelId,
      fromDate,
      toDate,
      async (item) => {
        await this.reversedProductService.reversedProductV2(item, fromDate, toDate);
      }
    );

    await Promise.all([
      this.processPricingBatch(
        [...categorizedPricing.rfcCombinedPricing, ...categorizedPricing.rfcAveragePricing],
        hotelId,
        fromDate,
        toDate
      ),
      this.processPricingBatch(
        [...categorizedPricing.erfcAveragePricing, ...categorizedPricing.erfcCombinedPricing],
        hotelId,
        fromDate,
        toDate
      )
    ]);
    await this.processLinkedPricing(categorizedPricing.linkedPricing, fromDate, toDate);
    await this.processDerivedPricing(categorizedPricing.derivedPricing, fromDate, toDate).then(
      () => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        this.logger.log(`[triggerAllPricing] Completed for hotel ${hotelId} in ${duration}s`);
      }
    );

    return {};
  }

  /**
   * Helper: Handle reversed pricing for MRFC products
   */
  private async handleReversedPricing(
    reversedPricing: RoomProductPricingMethodDetail[],
    roomProductPricingMethodDetails: RoomProductPricingMethodDetail[],
    hotelId: string
  ) {
    if (reversedPricing.length === 0) return;

    const reversedMRFCRoomProductIds = reversedPricing.map((item) => item.roomProductId);

    const relatedRoomProductMappings =
      await this.roomProductPricingService.getRelatedForMRFCRoomProduct({
        hotelId,
        roomProductIds: reversedMRFCRoomProductIds
      });

    const relatedRoomProductMappingMap = groupByToMapSingle(
      relatedRoomProductMappings,
      (item) => item.targetRoomProductId
    );

    const updatedPricingMethodDetails: RoomProductPricingMethodDetail[] = [];

    for (const reversedItem of reversedPricing) {
      const relatedRoomProductMapping = relatedRoomProductMappingMap.get(
        reversedItem.roomProductId
      );
      if (!relatedRoomProductMapping) continue;

      const relatedRoomProductPricingMethodDetails = roomProductPricingMethodDetails.filter(
        (item) =>
          relatedRoomProductMapping.rfcRoomProductIds.includes(item.roomProductId) &&
          item.ratePlanId === reversedItem.ratePlanId
      );

      if (relatedRoomProductPricingMethodDetails.length === 0) continue;

      for (const relatedDetail of relatedRoomProductPricingMethodDetails) {
        relatedDetail.pricingMethod = RoomProductPricingMethodEnum.REVERSED_PRICING;
        relatedDetail.ratePlanId = reversedItem.ratePlanId;
        updatedPricingMethodDetails.push(relatedDetail);
      }
    }

    await this.roomProductPricingMethodDetailRepository.save(updatedPricingMethodDetails);
  }

  /**
   * Helper: Process a batch of pricing items with optional callback
   * Process in chunks to avoid memory issues
   */
  private async processPricingBatch(
    items: RoomProductPricingMethodDetail[],
    hotelId: string,
    formDate: string,
    toDate: string,
    additionalCallback?: (item: RoomProductPricingMethodDetail) => Promise<void>
  ) {
    if (items.length === 0) return;

    // Process in chunks to avoid memory overflow
    const CHUNK_SIZE = 20; // Process 5 items at a time
    const chunks: RoomProductPricingMethodDetail[][] = [];

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    this.logger.log(
      `[processPricingBatch] Processing ${items.length} items in ${chunks.length} chunks of ${CHUNK_SIZE}`
    );

    // Process chunks sequentially to control memory usage
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      await Promise.all(
        chunk.map(async (item) => {
          try {
            if (additionalCallback) {
              await additionalCallback(item);
            } else {
              const { sellingPriceList } =
                await this.roomProductSellingPriceService.calculateSellingPriceV2(
                  {
                    hotelId,
                    roomProductId: item.roomProductId,
                    ratePlanId: item.ratePlanId,
                    fromDate: formDate,
                    toDate
                  },
                  {
                    pricingMethodAdjustmentValue: item.pricingMethodAdjustmentValue,
                    pricingMethodAdjustmentUnit: item.pricingMethodAdjustmentUnit,
                    pricingMethod: item.pricingMethod
                  }
                );

              await this.roomProductSellingPriceService.insertSellingPrices(sellingPriceList, {
                hotelId,
                roomProductId: item.roomProductId,
                ratePlanId: item.ratePlanId,
                fromDate: formDate,
                toDate
              });
            }
          } catch (error) {
            this.logger.error(
              `[processPricingBatch] Failed for room ${item.roomProductId}, rate plan ${item.ratePlanId}: ${error.message}`
            );
            throw error;
          }
        })
      );

      // Log progress every 10 chunks
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
        this.logger.log(
          `[processPricingBatch] Progress: ${Math.min((i + 1) * CHUNK_SIZE, items.length)}/${items.length} items processed`
        );
      }

      // Allow garbage collection between chunks
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Helper: Process linked pricing in chunks
   */
  private async processLinkedPricing(
    linkedPricing: RoomProductPricingMethodDetail[],
    formDate: string,
    toDate: string
  ) {
    if (linkedPricing.length === 0) return;

    const CHUNK_SIZE = 20;
    for (let i = 0; i < linkedPricing.length; i += CHUNK_SIZE) {
      const chunk = linkedPricing.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) => this.linkProductService.linkProduct(item, formDate, toDate))
      );

      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Helper: Process derived pricing in chunks
   */
  private async processDerivedPricing(
    derivedPricing: RoomProductPricingMethodDetail[],
    fromDate: string,
    toDate: string
  ) {
    if (derivedPricing.length === 0) return;

    const CHUNK_SIZE = 20;
    for (let i = 0; i < derivedPricing.length; i += CHUNK_SIZE) {
      const chunk = derivedPricing.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) =>
          this.derivedProductService.derivedProduct({
            roomProductPricingMethodDetail: item,
            fromDate,
            toDate
          })
        )
      );

      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Helper: Process PMS pricing
   * Process in chunks to avoid memory issues
   */
  private async processPmsPricing(
    pmsPricing: RoomProductPricingMethodDetail[],
    hotelId: string,
    formDate: string,
    toDate: string
  ) {
    if (pmsPricing.length === 0) return;

    // Process in chunks to avoid memory overflow
    const CHUNK_SIZE = 20;
    const chunks: RoomProductPricingMethodDetail[][] = [];

    for (let i = 0; i < pmsPricing.length; i += CHUNK_SIZE) {
      chunks.push(pmsPricing.slice(i, i + CHUNK_SIZE));
    }

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      await Promise.all(
        chunk.map(async (item) => {
          const dailySellingPrices =
            await this.roomProductRatePlanRepository.findDailySellingPrices(
              {
                hotelId,
                roomProductIds: [item.roomProductId],
                ratePlanIds: [item.ratePlanId],
                fromDate: formDate,
                toDate
              },
              {
                id: true,
                roomProductId: true,
                ratePlanId: true,
                date: true,
                grossPrice: true,
                netPrice: true,
                featureAdjustments: true,
                ratePlanAdjustments: true,
                taxAmount: true,
                basePrice: true
              }
            );

          await this.roomProductSellingPriceService.calculateSellingPriceFromPms({
            hotelId,
            roomProductId: item.roomProductId,
            ratePlanId: item.ratePlanId,
            fromDate: formDate,
            toDate,
            pmsBasePrices: dailySellingPrices.map((dailySellingPrice) => ({
              date: dailySellingPrice.date,
              grossPrice: DecimalRoundingHelper.calculatePriceAdjustment(
                dailySellingPrice.basePrice,
                item.pricingMethodAdjustmentValue || 0,
                item.pricingMethodAdjustmentUnit || 'FIXED'
              ),
              netPrice: DecimalRoundingHelper.calculatePriceAdjustment(
                dailySellingPrice.basePrice,
                item.pricingMethodAdjustmentValue || 0,
                item.pricingMethodAdjustmentUnit || 'FIXED'
              ),
              roomProductMappingPmsCode: item.roomProductId,
              ratePlanMappingPmsCode: item.ratePlanId,
              pricingMode: 'Gross'
            }))
          });
        })
      );

      // Allow garbage collection between chunks
      if (global.gc) {
        global.gc();
      }
    }
  }

  async triggerDerivedPricingV2(input: {
    hotelId: string;
    roomProductType: RoomProductType;
    oldMethodDetail?: RoomProductPricingMethodDetail;
    methodDetail: RoomProductPricingMethodDetail;
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, roomProductType, oldMethodDetail, methodDetail, fromDate, toDate } = input;

    try {
      // trigger room product reserved pricing with mrfc
      let reversedPricingMethodDetails: RoomProductPricingMethodDetail[] = [];
      let noRfcPricingMethodDetails: RoomProductPricingMethodDetail[] = [];

      if (
        roomProductType === RoomProductType.MRFC &&
        methodDetail.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING
      ) {
        const reversedProductResult = await this.reversedProductService.reversedProductV2(
          methodDetail,
          fromDate,
          toDate
        );
        reversedPricingMethodDetails = reversedProductResult?.pricingMethodDetails || [];

        if (reversedProductResult) {
          noRfcPricingMethodDetails =
            await this.roomProductSellingPriceService.calculateAfterRFCPricingChange({
              hotelId,
              reversedPricingResults: [reversedProductResult],
              fromDate,
              toDate,
              roomProductTypes: [RoomProductType.ERFC]
            });
        }
      }

      // trigger erfc pricing and rfc pricing when rfc pricing is changed
      if (roomProductType === RoomProductType.RFC) {
        noRfcPricingMethodDetails =
          await this.roomProductSellingPriceService.calculateAfterRFCPricingChange({
            hotelId,
            reversedPricingResults: [
              {
                ratePlanId: methodDetail.ratePlanId,
                relatedRoomProductIds: [methodDetail.roomProductId]
              }
            ],
            fromDate,
            toDate
          });
      }

      // trigger linked product if this rate plan has linked product
      const linkedProductPricingMethodDetails = await this.triggerLinkedProductV2({
        hotelId,
        ratePlanId: methodDetail.ratePlanId,
        methodDetailChanges: this.uniqueMethodDetails([
          methodDetail,
          ...reversedPricingMethodDetails,
          ...noRfcPricingMethodDetails
        ]),
        fromDate,
        toDate
      });

      // trigger derived pricing if this rate plan has other rate plan derived
      for (const methodDetailItem of this.uniqueMethodDetails([
        methodDetail,
        ...linkedProductPricingMethodDetails,
        ...reversedPricingMethodDetails,
        ...noRfcPricingMethodDetails
      ])) {
        await this.derivedProductService.derivedProduct({
          roomProductPricingMethodDetail: methodDetailItem,
          fromDate,
          toDate
        });
      }

      await this.triggerPushToPms({
        hotelId,
        items: this.uniqueMethodDetails([
          ...linkedProductPricingMethodDetails,
          ...noRfcPricingMethodDetails
        ]),
        fromDate,
        toDate
      });
    } catch (error) {
      this.logger.error(`Error in triggerDerivedPricingV2: ${error.message}`);
      return;
    }
  }

  async triggerPushToPms(input: {
    hotelId: string;
    items: RoomProductPricingMethodDetail[];
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, items, fromDate, toDate } = input;
    const allowMethodDetails = items.filter((item) =>
      this.roomProductPricingService.isAllowPricingMethodPushToPms(item.pricingMethod)
    );

    const allowRoomProductIds = allowMethodDetails.map((item) => item.roomProductId);

    const allowRatePlanIds = allowMethodDetails.map((item) => item.ratePlanId);
    const roomProductRatePlans = await this.roomProductRatePlanRepository.findAll({
      ratePlanIds: allowRatePlanIds,
      roomProductIds: allowRoomProductIds.filter((item) => item !== undefined),
      hotelId: hotelId
    });

    const methodDetailMap = groupByToMapSingle(
      allowMethodDetails,
      (item) => `${item.ratePlanId}-${item.roomProductId}`
    );

    for (const roomProductRatePlan of roomProductRatePlans) {
      const pmsCode = this.roomProductRatePlanRepository.getPmsCodeFromConfiguratorSetting(
        roomProductRatePlan?.configuratorSetting,
        ConnectorTypeEnum.APALEO
      );

      const methodDetail = methodDetailMap.get(
        `${roomProductRatePlan.ratePlanId}-${roomProductRatePlan.roomProductId}`
      );

      if (
        roomProductRatePlan.configuratorSetting?.type !== ConfiguratorTypeEnum.PUSH_PMS ||
        roomProductRatePlan.configuratorSetting?.mode !== ConfiguratorModeEnum.ENABLE
      ) {
        continue;
      }

      if (!pmsCode) {
        continue;
      }
      if (!methodDetail || !methodDetail.pmsRatePlanCode) {
        continue;
      }

      const pushToPmsTaskKeyComponents = new PushToPmsTaskKeyComponents();
      pushToPmsTaskKeyComponents.setIdentifier({
        hotelId: hotelId,
        ratePlanId: methodDetail.ratePlanId,
        roomProductId: methodDetail.roomProductId
      });

      await this.redisTaskService.setPushToPmsTask(pushToPmsTaskKeyComponents, {
        fromDate: fromDate,
        toDate: toDate,
        pmsRatePlanCode: methodDetail.pmsRatePlanCode!,
        pmsRoomProductCode: methodDetail.mappingRoomProductId!,
        connectorType: ConnectorTypeEnum.APALEO
      });
    }
  }

  async triggerDerivedPricing(input: {
    methodDetail: RoomProductPricingMethodDetail;
    fromDate: string;
    toDate: string;
    isPushToPms?: boolean;
    visitedSet?: Set<string>;
    depth?: number;
  }) {
    const {
      methodDetail,
      fromDate,
      toDate,
      isPushToPms = true,
      visitedSet = new Set(),
      depth = 0
    } = input;

    // Prevent infinite loops: max depth of 10 levels
    const MAX_DEPTH = 10;
    if (depth > MAX_DEPTH) {
      this.logger.warn(
        `triggerDerivedPricing: Max depth (${MAX_DEPTH}) reached for ratePlanId: ${methodDetail.ratePlanId}, roomProductId: ${methodDetail.roomProductId}. Stopping to prevent infinite loop.`
      );
      return;
    }

    // Create unique key for this rate plan + room product combination
    const visitKey = `${methodDetail.hotelId}-${methodDetail.ratePlanId}-${methodDetail.roomProductId}`;

    // Prevent circular dependencies: if we've already processed this combination in this call chain
    if (visitedSet.has(visitKey)) {
      this.logger.warn(
        `triggerDerivedPricing: Circular dependency detected for ratePlanId: ${methodDetail.ratePlanId}, roomProductId: ${methodDetail.roomProductId}. Skipping to prevent infinite loop.`
      );
      return;
    }

    // Mark this combination as visited
    visitedSet.add(visitKey);

    try {
      // trigger derived pricing if this rate plan has other rate plan derived
      await this.derivedProductService.derivedProduct({
        roomProductPricingMethodDetail: methodDetail,
        fromDate,
        toDate
      });

      // if (methodDetail.ratePlan.rfcAttributeMode) {
      //   await this.attributeLogicService.executeAttributeLogic(methodDetail, fromDate, toDate);
      // }

      // trigger linked product if this rate plan has linked product
      await this.triggerLinkedProduct(methodDetail, fromDate, toDate);

      // trigger room product reserved pricing
      await this.reversedProductService.bulkReversedProduct(methodDetail.hotelId, fromDate, toDate);

      // TODO Push rate to PMS: not await, just push to pms

      const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne({
        ratePlanId: methodDetail.ratePlanId,
        roomProductId: methodDetail.roomProductId,
        hotelId: methodDetail.hotelId
      });

      const pmsCode = this.roomProductRatePlanRepository.getPmsCodeFromConfiguratorSetting(
        roomProductRatePlan?.configuratorSetting,
        ConnectorTypeEnum.APALEO
      );
      if (!pmsCode) {
        return;
      }

      const pushToPmsTaskKeyComponents = new PushToPmsTaskKeyComponents();
      pushToPmsTaskKeyComponents.setIdentifier({
        hotelId: methodDetail.hotelId,
        ratePlanId: methodDetail.ratePlanId,
        roomProductId: methodDetail.roomProductId
      });

      if (isPushToPms) {
        await this.redisTaskService.setPushToPmsTask(pushToPmsTaskKeyComponents, {
          fromDate: fromDate,
          toDate: toDate,
          pmsRatePlanCode: methodDetail.pmsRatePlanCode!,
          pmsRoomProductCode: methodDetail.mappingRoomProductId!,
          connectorType: ConnectorTypeEnum.APALEO
        });
      }
    } finally {
      // Remove from visited set when done (allows processing in different call chains)
      visitedSet.delete(visitKey);
    }
  }

  public async bulkReversedProduct(hotelId: string, fromDate?: string, toDate?: string) {
    const startDate = fromDate || format(new Date(), DATE_FORMAT);
    const endDate = toDate || format(addDays(new Date(), 365), DATE_FORMAT);
    await this.reversedProductService.bulkReversedProduct(hotelId, startDate, endDate);
  }

  async calculateFeatureBasedPricing(body: UpdateRoomProductPricingMethodDetailDto) {
    try {
      const { from, to } = body;
      const fromDate = from || format(new Date(), DATE_FORMAT);
      const toDate = to || format(addDays(new Date(), 365), DATE_FORMAT);

      const oldMethodDetail = await this.roomProductPricingMethodDetailRepository.findOne({
        where: {
          hotelId: body.hotelId,
          roomProductId: body.roomProductId,
          ratePlanId: body.ratePlanId
        }
      });

      const methodDetail = await this.createPricingMethodDetail(body);

      if (!methodDetail) {
        throw new BadRequestException('Pricing method detail not found');
      }

      if (methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING) {
        throw new BadRequestException('Pricing method is not PRODUCT_BASED_PRICING');
      }

      const roomProductFixedPrice =
        methodDetail.roomProduct.roomProductBasePriceSettings?.[0]?.mode ===
        RoomProductBasePriceSettingModeEnum.FIXED_PRICE;
      const roomProductFeatureBasedPrice =
        methodDetail.roomProduct.roomProductBasePriceSettings?.[0]?.mode !==
        RoomProductBasePriceSettingModeEnum.FIXED_PRICE;

      if (roomProductFixedPrice) {
        await this.triggerFixedPricePricing({
          methodDetail,
          fromDate,
          toDate,
          pmsRatePlanCode: body.pmsRatePlanCode,
          mappingRoomProductId: body.mappingRoomProductId,
          isPushToPms: body.isPush
        });
      }

      if (roomProductFeatureBasedPrice) {
        await this.triggerFeatureBasedPricing({
          oldMethodDetail: oldMethodDetail || undefined,
          methodDetail,
          fromDate,
          toDate,
          pmsRatePlanCode: body.pmsRatePlanCode,
          mappingRoomProductId: body.mappingRoomProductId,
          isPushToPms: body.isPush
        });
      }

      return true;
    } catch (error) {
      throw new BadRequestException('Error in feature based pricing' + error.message);
    }
  }

  async triggerFeatureBasedPricing(input: {
    oldMethodDetail?: RoomProductPricingMethodDetail;
    methodDetail: RoomProductPricingMethodDetail;
    fromDate: string;
    toDate: string;
    pmsRatePlanCode?: string;
    mappingRoomProductId?: string;
    isPushToPms?: boolean;
  }) {
    const { oldMethodDetail, methodDetail, fromDate, toDate, isPushToPms } = input;
    const {
      hotelId,
      roomProductId,
      ratePlanId,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit
    } = methodDetail;
    try {
      const [roomProduct, ratePlan] = await Promise.all([
        this.roomProductRepository.findOne({
          where: {
            id: roomProductId,
            hotelId
          },
          select: {
            id: true,
            type: true
          }
        }),
        this.ratePlanRepository.findOne({
          where: {
            id: ratePlanId,
            hotelId
          },
          select: {
            id: true,
            roundingMode: true,
            rfcAttributeMode: true,
            mrfcPositioningMode: true
          }
        })
      ]);
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      // flow feature base price to selling price
      // const result = await this.roomProductSellingPriceService.calculateSellingPrice(
      //   {
      //     hotelId,
      //     roomProductType: roomProduct.type,
      //     roomProductId,
      //     ratePlanId,
      //     fromDate,
      //     toDate
      //   },
      //   { pricingMethodAdjustmentValue, pricingMethodAdjustmentUnit }
      // );

      if (
        roomProduct.type === RoomProductType.MRFC &&
        (ratePlan?.rfcAttributeMode ||
          (oldMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING &&
            methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING))
      ) {
        const relatedRoomProductIds = await this.roomProductPricingService.getRelatedRoomProductIds(
          {
            hotelId,
            roomProductId,
            roomProductType: RoomProductType.MRFC
          }
        );
        if (relatedRoomProductIds.length > 0) {
          await this.roomProductPricingMethodDetailRepository
            .createQueryBuilder()
            .insert()
            .into(RoomProductPricingMethodDetail)
            .values(
              relatedRoomProductIds.map((id) => ({
                hotelId,
                roomProductId: id,
                ratePlanId,
                targetRatePlanId: undefined,
                pricingMethod: RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING
              }))
            )
            .orUpdate(['pricing_method'], ['hotel_id', 'room_product_id', 'rate_plan_id'])
            .execute();
        }
      }

      const { sellingPriceList, relatedSellingPriceList } =
        await this.roomProductSellingPriceService.calculateSellingPriceV2(
          {
            hotelId,
            roomProductId,
            ratePlanId,
            fromDate,
            toDate
          },
          {
            pricingMethodAdjustmentValue,
            pricingMethodAdjustmentUnit,
            pricingMethod: methodDetail.pricingMethod
          }
        );

      await this.roomProductSellingPriceService.insertSellingPrices(sellingPriceList, {
        hotelId,
        roomProductId,
        ratePlanId,
        fromDate,
        toDate
      });

      if (
        roomProduct.type === RoomProductType.MRFC &&
        (ratePlan?.rfcAttributeMode ||
          (oldMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING &&
            methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING))
      ) {
        const relatedSellingPriceMap = groupByToMap(
          relatedSellingPriceList,
          (item) => item.roomProductId
        );

        // ---------------- can remove this part ----------------
        await Promise.all(
          Array(...relatedSellingPriceMap.keys())
            .map((relatedRoomProductId) => ({
              relatedRoomProductId,
              relatedSellingPrices: relatedSellingPriceMap.get(relatedRoomProductId) || []
            }))
            .filter(
              (item) => item && item.relatedSellingPrices && item.relatedSellingPrices.length > 0
            )
            .map(({ relatedRoomProductId, relatedSellingPrices }) => {
              this.roomProductSellingPriceService.insertSellingPrices(relatedSellingPrices, {
                hotelId,
                roomProductId: relatedRoomProductId,
                ratePlanId,
                fromDate,
                toDate
              });
            })
        );

        // ---------------- can remove this part ----------------
        const relatedRoomProductIds = [...relatedSellingPriceMap.keys()];

        let rfcRoomProductMethodDetails: RoomProductPricingMethodDetail[] = [];
        if (relatedRoomProductIds.length > 0) {
          rfcRoomProductMethodDetails =
            await this.roomProductSellingPriceService.calculateAndInsertRFCSellingPrice({
              hotelId,
              methodDetail,
              relatedRoomProductIds,
              ratePlanId,
              fromDate,
              toDate
            });
        }

        const erfcRoomProductMethodDetails =
          await this.roomProductSellingPriceService.calculateAfterRFCPricingChange({
            hotelId,
            reversedPricingResults: [
              {
                ratePlanId,
                relatedRoomProductIds
              }
            ],
            fromDate,
            toDate
          });

        await Promise.all(
          [...rfcRoomProductMethodDetails, ...erfcRoomProductMethodDetails].map((item) => {
            return this.derivedProductService.derivedProduct({
              roomProductPricingMethodDetail: item,
              fromDate,
              toDate
            });
          })
        );
      }

      const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne(
        {
          hotelId,
          ratePlanId,
          roomProductId
        },
        { id: true }
      );
      if (roomProductRatePlan) {
        await this.updateConfiguratorSetting(roomProductRatePlan.id, {
          type: ConfiguratorTypeEnum.PUSH_PMS,
          mode: isPushToPms ? ConfiguratorModeEnum.ENABLE : ConfiguratorModeEnum.DISABLE,
          connectorType: ConnectorTypeEnum.APALEO,
          pmsRatePlanCode: input.pmsRatePlanCode,
          pmsRoomProductCode: input.mappingRoomProductId
        });

        await this.pushPmsRatePlanPricing({
          hotelId,
          ratePlanId,
          roomProductId,
          from: fromDate,
          to: toDate,
          connectorType: ConnectorTypeEnum.APALEO
        });
      }

      await this.triggerDerivedPricingV2({
        hotelId,
        methodDetail,
        roomProductType: roomProduct.type,
        fromDate,
        toDate
      });

      return {
        sellingPriceList,
        relatedSellingPriceList
      };
    } catch (error) {
      this.logger.error(`Error in trigger feature based pricing: ${error.message}`);
      return null;
    }
  }

  private async triggerLinkedProductV2(input: {
    hotelId: string;
    ratePlanId: string;
    methodDetailChanges: RoomProductPricingMethodDetail[];
    fromDate: string;
    toDate: string;
  }) {
    const { hotelId, ratePlanId, methodDetailChanges, fromDate, toDate } = input;

    const roomProductIds = Array.from(
      new Set(methodDetailChanges.map((item) => item.roomProductId))
    );

    if (!roomProductIds || roomProductIds.length === 0) {
      return [];
    }

    const linkedProducts = await this.roomProductPricingMethodDetailRepository.find({
      where: {
        hotelId,
        roomProduct: {
          deletedAt: IsNull()
        },
        pricingMethod: RoomProductPricingMethodEnum.LINK,
        targetRoomProduct: In(roomProductIds), // find all linked product by room product id
        ratePlanId: ratePlanId
      },
      ...this.methodDetailSelectOptions
    });

    const groups = groupByToMap(linkedProducts, (item) => item.targetRoomProductId);

    for (const [targetRoomProductId, pricingMethodDetails] of groups.entries()) {
      const result = await this.roomProductSellingPriceService.calculateLinkedPriceV2({
        hotelId,
        ratePlanId: ratePlanId,
        targetRoomProductId: targetRoomProductId,
        methodDetails: pricingMethodDetails,
        fromDate,
        toDate
      });

      await Promise.all(
        result.map((item) => {
          this.roomProductSellingPriceService.insertSellingPrices(item.dailySellingList, {
            hotelId,
            roomProductId: item.methodDetail.roomProductId,
            ratePlanId,
            fromDate,
            toDate
          });
        })
      );
    }

    return linkedProducts;
  }

  private async triggerLinkedProduct(
    methodDetail: RoomProductPricingMethodDetail,
    fromDate: string,
    toDate: string,
    pricingMethods?: RoomProductPricingMethodEnum[]
  ) {
    const { hotelId, targetRoomProductId } = methodDetail;
    const linkedProduct = await this.roomProductPricingMethodDetailRepository.find({
      where: {
        hotelId,
        roomProduct: {
          deletedAt: IsNull()
        },
        pricingMethod: pricingMethods && pricingMethods.length > 0 ? In(pricingMethods) : undefined,
        roomProductId: targetRoomProductId, // find all linked product by room product id
        ratePlanId: methodDetail.ratePlanId
      },
      ...this.methodDetailSelectOptions
    });

    if (linkedProduct.length > 0) {
      await Promise.all(
        linkedProduct.map((item) => this.linkProductService.linkProduct(item, fromDate, toDate))
      );
    }

    return linkedProduct;
  }

  async mrfcPositioning(body: UpdateRoomProductPricingMethodDetailDto) {
    try {
      const { hotelId, ratePlanId, roomProductId } = body;
      const fromDate = format(new Date(), DATE_FORMAT);
      const toDate = format(addDays(new Date(), 365), DATE_FORMAT);

      const methodDetail = await this.createPricingMethodDetail(body);

      if (!methodDetail) {
        throw new BadRequestException('Pricing method detail not found');
      }

      const result = await this.handlePositioningService.handlePositioning(
        methodDetail,
        fromDate,
        toDate
      );

      await this.triggerDerivedPricing({
        methodDetail,
        fromDate,
        toDate
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Error in mrfc positioning' + error.message);
    }
  }

  async calculateLinkedPricing(body: UpdateRoomProductPricingMethodDetailDto) {
    try {
      const { hotelId, ratePlanId, roomProductId, from, to } = body;
      const fromDate = from || format(new Date(), DATE_FORMAT);
      const toDate = to || format(addDays(new Date(), 365), DATE_FORMAT);

      const oldMethodDetail = await this.roomProductPricingMethodDetailRepository.findOne({
        where: {
          hotelId: body.hotelId,
          roomProductId: body.roomProductId,
          ratePlanId: body.ratePlanId
        }
      });

      const methodDetail = await this.createPricingMethodDetail(body);

      if (!methodDetail) {
        throw new BadRequestException('Pricing method detail not found');
      }

      if (methodDetail.pricingMethod !== RoomProductPricingMethodEnum.LINK) {
        throw new BadRequestException('Pricing method is not LINK');
      }

      const [roomProduct, ratePlan] = await Promise.all([
        this.roomProductRepository.findOne({
          where: {
            id: roomProductId,
            hotelId
          },
          select: {
            id: true,
            type: true
          }
        }),
        this.ratePlanRepository.findOne({
          where: {
            id: ratePlanId,
            hotelId
          },
          select: {
            id: true,
            roundingMode: true,
            rfcAttributeMode: true,
            mrfcPositioningMode: true
          }
        })
      ]);
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }

      if (
        roomProduct.type === RoomProductType.MRFC &&
        (ratePlan?.rfcAttributeMode ||
          oldMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.PMS_PRICING)
      ) {
        const relatedRoomProductIds = await this.roomProductPricingService.getRelatedRoomProductIds(
          {
            hotelId,
            roomProductId,
            roomProductType: RoomProductType.MRFC
          }
        );

        await this.roomProductPricingMethodDetailRepository
          .createQueryBuilder()
          .insert()
          .into(RoomProductPricingMethodDetail)
          .values(
            relatedRoomProductIds.map((id) => ({
              hotelId,
              roomProductId: id,
              ratePlanId,
              targetRatePlanId: undefined,
              pricingMethod: RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING
            }))
          )
          .orUpdate(['pricing_method'], ['hotel_id', 'room_product_id', 'rate_plan_id'])
          .execute();

        let rfcRoomProductMethodDetails: RoomProductPricingMethodDetail[] = [];
        if (relatedRoomProductIds.length > 0) {
          rfcRoomProductMethodDetails =
            await this.roomProductSellingPriceService.calculateAndInsertRFCSellingPrice({
              hotelId,
              methodDetail,
              relatedRoomProductIds,
              ratePlanId,
              fromDate,
              toDate
            });
        }

        const erfcRoomProductMethodDetails =
          await this.roomProductSellingPriceService.calculateAfterRFCPricingChange({
            hotelId,
            reversedPricingResults: [
              {
                ratePlanId,
                relatedRoomProductIds
              }
            ],
            fromDate,
            toDate
          });

        await Promise.all(
          [...rfcRoomProductMethodDetails, ...erfcRoomProductMethodDetails].map((item) => {
            return this.derivedProductService.derivedProduct({
              roomProductPricingMethodDetail: item,
              fromDate,
              toDate
            });
          })
        );
      }

      const result = await this.roomProductSellingPriceService.calculateLinkedPriceV2({
        hotelId,
        ratePlanId: methodDetail.ratePlanId,
        targetRoomProductId: methodDetail.targetRoomProductId,
        methodDetails: [methodDetail],
        fromDate,
        toDate
      });

      for (const { dailySellingList, methodDetail } of result) {
        await this.roomProductSellingPriceService.insertSellingPrices(dailySellingList, {
          hotelId,
          roomProductId,
          ratePlanId,
          fromDate,
          toDate
        });
      }

      const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne(
        {
          hotelId,
          ratePlanId,
          roomProductId
        },
        { id: true }
      );
      if (roomProductRatePlan) {
        await this.updateConfiguratorSetting(roomProductRatePlan.id, {
          type: ConfiguratorTypeEnum.PUSH_PMS,
          mode: body.isPush ? ConfiguratorModeEnum.ENABLE : ConfiguratorModeEnum.DISABLE,
          connectorType: ConnectorTypeEnum.APALEO,
          pmsRatePlanCode: body.pmsRatePlanCode,
          pmsRoomProductCode: body.mappingRoomProductId
        });

        await this.pushPmsRatePlanPricing({
          hotelId,
          ratePlanId,
          roomProductId,
          from: fromDate,
          to: toDate,
          connectorType: ConnectorTypeEnum.APALEO
        });
      }

      await this.triggerDerivedPricingV2({
        hotelId,
        roomProductType: roomProduct.type,
        methodDetail,
        fromDate,
        toDate
      });

      return methodDetail;
    } catch (error) {
      throw new BadRequestException('Error in link product' + error.message);
    }
  }

  async derivedProduct(body: UpdateRoomProductPricingMethodDetailDto) {
    const { hotelId, ratePlanId, roomProductId, from, to } = body;
    const fromDate = from ? format(new Date(from), DATE_FORMAT) : format(new Date(), DATE_FORMAT);
    const toDate = to
      ? format(new Date(to), DATE_FORMAT)
      : format(addDays(new Date(), 365), DATE_FORMAT);

    try {
      const response = await this.createPricingMethodDetail(body);
      if (!response) {
        throw new BadRequestException('Pricing method detail not found');
      }

      await this.triggerDerivedPricing({
        methodDetail: response,
        fromDate,
        toDate
      });

      return response;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async pmsEventPricingUpdate(body: PmsEventPricingUpdateDto) {
    try {
      const { hotelId, RateId, ResourceCategoryId, StartUtc, EndUtc } = body;

      const fromDate = format(new Date(StartUtc!), DATE_FORMAT);
      const toDate = format(addDays(new Date(EndUtc!), 1), DATE_FORMAT);

      const ratePlanPricing = await this.pmsService.getPmsRatePlanPricing({
        hotelId,
        ratePlanMappingPmsCode: RateId!,
        startDate: fromDate,
        endDate: toDate
      });

      const methodDetails = ResourceCategoryId
        ? await this.findSingleRoomProductMethodDetail(hotelId, RateId!, ResourceCategoryId)
        : await this.findAllRoomProductMethodDetails(hotelId, RateId!);

      if (!methodDetails || (Array.isArray(methodDetails) && methodDetails.length === 0)) {
        this.logger.warn(
          ResourceCategoryId
            ? 'Room product method detail not found for ResourceCategoryId'
            : 'No room product method details found for rate plan'
        );
        return {
          success: false,
          message: ResourceCategoryId
            ? 'Room product method detail not found for ResourceCategoryId'
            : 'No room product method details found for rate plan'
        };
      }

      return Array.isArray(methodDetails)
        ? await this.processMultipleMethodDetails(methodDetails, ratePlanPricing, fromDate, toDate)
        : this.distributePmsRatePlanPricing(methodDetails, ratePlanPricing, fromDate, toDate);
    } catch (error) {
      throw new BadRequestException('Error in pms event pricing update: ' + error.message);
    }
  }

  /**
   * Find single room product method detail
   */
  private async findSingleRoomProductMethodDetail(
    hotelId: string,
    ratePlanCode: string,
    resourceCategoryId: string
  ): Promise<RoomProductPricingMethodDetail | null> {
    return this.roomProductPricingMethodDetailRepository.findOne({
      where: {
        hotelId,
        pmsRatePlanCode: ratePlanCode,
        mappingRoomProductId: resourceCategoryId,
        pricingMethod: RoomProductPricingMethodEnum.PMS_PRICING
      },
      ...this.methodDetailSelectOptions
    });
  }

  /**
   * Find all room product method details for rate plan
   */
  private async findAllRoomProductMethodDetails(
    hotelId: string,
    ratePlanCode: string
  ): Promise<RoomProductPricingMethodDetail[]> {
    return this.roomProductPricingMethodDetailRepository.find({
      where: {
        hotelId,
        pmsRatePlanCode: ratePlanCode,
        pricingMethod: RoomProductPricingMethodEnum.PMS_PRICING
      },
      ...this.methodDetailSelectOptions
    });
  }

  private async processMultipleMethodDetails(
    details: RoomProductPricingMethodDetail[],
    ratePlanPricing: RatePlanPricingMappingDto[],
    fromDate: string,
    toDate: string
  ) {
    type ProcessResult =
      | { success: true; roomProductMethodDetailId: string }
      | { success: false; roomProductMethodDetailId: string; error: any };

    const results: ProcessResult[] = await Promise.all(
      details.map(async (detail) => {
        try {
          const data = await this.distributePmsRatePlanPricing(
            detail,
            ratePlanPricing,
            fromDate,
            toDate
          );
          return { success: true, roomProductMethodDetailId: detail.id, data };
        } catch (error) {
          console.error(`Error processing room product method detail ${detail.id}:`, error.message);
          return { success: false, roomProductMethodDetailId: detail.id, error: error.message };
        }
      })
    );

    const successfulResults = results.filter(
      (r): r is Extract<ProcessResult, { success: true }> => r.success
    );

    if (successfulResults.length === 0) {
      throw new BadRequestException('All room product method detail processing failed');
    }

    return {
      success: true,
      processedCount: successfulResults.length,
      totalCount: details.length,
      results
    };
  }

  private async triggerFixedPricePricing(input: {
    methodDetail: RoomProductPricingMethodDetail;
    fromDate: string;
    toDate: string;
    pmsRatePlanCode?: string;
    mappingRoomProductId?: string;
    isPushToPms?: boolean;
  }) {
    const { methodDetail, fromDate, toDate, isPushToPms } = input;
    const {
      hotelId,
      roomProductId,
      ratePlanId,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit
    } = methodDetail;

    const roomProduct = await this.roomProductRepository.findOne({
      where: {
        id: roomProductId,
        hotelId
      },
      select: {
        type: true
      }
    });
    if (!roomProduct) {
      throw new BadRequestException('Room product not found');
    }

    // const fixedPrice = methodDetail.roomProduct.roomProductBasePriceSettings[0].fixedPrice;

    const dates = Helper.generateDateRange(fromDate, toDate);

    // const fixedBasePrices = dates.map((date) => ({
    //   hotelId,
    //   roomProductId,
    //   ratePlanId,
    //   date,
    //   basePrice: DecimalRoundingHelper.calculatePriceAdjustment(
    //     fixedPrice,
    //     pricingMethodAdjustmentValue,
    //     pricingMethodAdjustmentUnit
    //   )
    // }));

    // const result = await this.roomProductSellingPriceService.calculateSellingPrice({
    //   hotelId,
    //   roomProductId,
    //   ratePlanId,
    //   roomProductType: roomProduct.type,
    //   fromDate,
    //   toDate,
    //   fixedBasePrices: fixedBasePrices,
    //   pricingDataSource: PricingDataSourceEnum.FIXED
    // });

    const { relatedSellingPriceList, sellingPriceList } =
      await this.roomProductSellingPriceService.calculateSellingPriceV2(
        {
          hotelId,
          roomProductId,
          ratePlanId,
          fromDate,
          toDate
        },
        {
          pricingMethodAdjustmentValue,
          pricingMethodAdjustmentUnit,
          pricingMethod: methodDetail.pricingMethod
        }
      );

    await this.roomProductSellingPriceService.insertSellingPrices(sellingPriceList, {
      hotelId,
      roomProductId,
      ratePlanId,
      fromDate,
      toDate
    });

    const roomProductRatePlan = await this.roomProductRatePlanRepository.findOne(
      {
        hotelId,
        ratePlanId,
        roomProductId
      },
      { id: true }
    );
    if (roomProductRatePlan) {
      await this.updateConfiguratorSetting(roomProductRatePlan.id, {
        type: ConfiguratorTypeEnum.PUSH_PMS,
        mode: isPushToPms ? ConfiguratorModeEnum.ENABLE : ConfiguratorModeEnum.DISABLE,
        connectorType: ConnectorTypeEnum.APALEO,
        pmsRatePlanCode: input.pmsRatePlanCode,
        pmsRoomProductCode: input.mappingRoomProductId
      });

      await this.pushPmsRatePlanPricing({
        hotelId,
        ratePlanId,
        roomProductId,
        from: fromDate,
        to: toDate,
        connectorType: ConnectorTypeEnum.APALEO
      });
    }

    await this.triggerDerivedPricingV2({
      hotelId,
      methodDetail,
      roomProductType: roomProduct.type,
      fromDate,
      toDate
    });

    return {
      sellingPriceList,
      relatedSellingPriceList
    };
  }

  async jobPullPmsRatePlanPricing() {
    // find hotel has connector pms
    // first, only support apaleo pms
    const connectors = await this.connectorRepository.find({
      where: {
        connectorType: ConnectorTypeEnum.APALEO
      }
    });

    this.logger.log(`Found ${connectors.length} APALEO connectors`);

    if (connectors.length === 0) {
      this.logger.warn('No connector pms found');
      return;
    }

    const fromDate = format(new Date(), DATE_FORMAT);
    const toDate = format(addDays(new Date(), 365), DATE_FORMAT);

    let processedHotels = 0;
    let failedHotels = 0;

    for (const connector of connectors) {
      const hotelId = connector.hotelId;

      if (!hotelId) {
        this.logger.warn(`Connector ${connector.id} has no hotelId, skipping`);
        continue;
      }

      this.logger.log(
        `Processing hotel ${hotelId} (${processedHotels + failedHotels + 1}/${connectors.length})`
      );

      try {
        const methodDetails = await this.roomProductPricingMethodDetailRepository.find({
          where: {
            hotelId,
            pricingMethod: RoomProductPricingMethodEnum.PMS_PRICING
          },
          ...this.methodDetailSelectOptions
        });

        if (methodDetails.length === 0) {
          this.logger.warn(`No method details found for hotel ${hotelId}`);
          continue;
        }

        this.logger.log(`Found ${methodDetails.length} method details for hotel ${hotelId}`);

        const batchSize = 10;

        for (let i = 0; i < methodDetails.length; i += batchSize) {
          const batch = methodDetails.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (methodDetail) => {
              try {
                if (methodDetail.pricingMethod !== RoomProductPricingMethodEnum.PMS_PRICING) {
                  this.logger.warn(
                    `Pricing method is not PMS_PRICING for method detail ${methodDetail.id}`
                  );
                  return;
                }

                const { pmsRatePlanCode } = methodDetail;

                if (
                  !pmsRatePlanCode ||
                  ['null', 'undefined', 'NULL'].includes(pmsRatePlanCode.trim())
                ) {
                  // handle invalid case
                  this.logger.warn(
                    `PMS rate plan code is invalid for method detail ${methodDetail.id}`
                  );
                  return;
                }

                const isApaleoPms = connector.connectorType === ConnectorTypeEnum.APALEO;

                const ratePlanPricing = await this.syncPmsRatePlanPricingDetail(
                  hotelId,
                  pmsRatePlanCode,
                  fromDate,
                  toDate
                );

                await this.distributePmsRatePlanPricing(
                  methodDetail,
                  ratePlanPricing,
                  fromDate,
                  toDate,
                  isApaleoPms
                );

                this.logger.log(`Pricing method detail ${pmsRatePlanCode} processed successfully`);
              } catch (error) {
                this.logger.error(
                  `Error processing method detail ${methodDetail.id}: ${error.message}`
                );
                // Continue processing other method details
              }
            })
          );
        }

        this.logger.log(`Hotel ${hotelId} processed successfully`);
        processedHotels++;
      } catch (error) {
        this.logger.error(`Error processing hotel ${hotelId}: ${error.message}`);
        failedHotels++;
        // Continue processing other hotels
      }
    }

    this.logger.log(
      `Job completed. Processed: ${processedHotels} hotels, Failed: ${failedHotels} hotels`
    );
    return true;
  }

  async jobPushPmsRatePlanPricing() {
    // find hotel has connector pms
    // first, only support apaleo pms
    const connectors = await this.connectorRepository.find({
      where: {
        connectorType: ConnectorTypeEnum.APALEO
      }
    });

    this.logger.log(`Found ${connectors.length} APALEO connectors`);

    if (connectors.length === 0) {
      this.logger.warn('No connector pms found');
      return;
    }

    let processedHotels = 0;
    let failedHotels = 0;

    for (const connector of connectors) {
      const hotelId = connector.hotelId;

      if (!hotelId) {
        this.logger.warn(`Connector ${connector.id} has no hotelId, skipping`);
        continue;
      }

      this.logger.log(
        `Processing hotel ${hotelId} (${processedHotels + failedHotels + 1}/${connectors.length})`
      );

      try {
        const tasks = await this.redisTaskService.getTasksByIdentifier<PushToPmsTaskData>(
          RedisTaskNamespace.PMS,
          RedisTaskContext.PUSH_RATE_PLAN_PRICING,
          hotelId,
          {
            sortBy: 'updatedAt',
            sortOrder: 'asc',
            limit: 8
          }
        );

        for (const task of tasks) {
          const { fromDate, toDate, pmsRatePlanCode, pmsRoomProductCode, connectorType } =
            task.data;
          const components = new PushToPmsTaskKeyComponents();
          components.setIdentifierFromKey(task.key);
          const result = await this.pushPmsRatePlanPricing({
            hotelId,
            from: fromDate,
            to: toDate,
            connectorType,
            ratePlanId: components.identifier.ratePlanId,
            roomProductId: components.identifier.roomProductId,
            pmsRatePlanCode,
            pmsRoomProductCode
          })
            .then(() => {
              this.redisTaskService.deletePushToPmsTask(components);
            })
            .catch((error) => {
              this.logger.error(`Error pushing pms rate plan pricing: ${error.message}`);
            });
        }

        this.logger.log(`Hotel ${hotelId} processed successfully`);
        processedHotels++;
      } catch (error) {
        this.logger.error(`Error processing hotel ${hotelId}: ${error.message}`);
        failedHotels++;
        // Continue processing other hotels
      }
    }

    this.logger.log(
      `Job completed. Processed: ${processedHotels} hotels, Failed: ${failedHotels} hotels`
    );
    return true;
  }
}
