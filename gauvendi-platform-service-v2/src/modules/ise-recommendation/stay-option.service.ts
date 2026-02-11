import { DATE_FORMAT } from '@constants/date.constant';
import { DbName } from '@constants/db-name.constant';
import { HotelAmenity, PricingUnitEnum } from '@entities/hotel-entities/hotel-amenity.entity';
import {
  HotelConfiguration,
  HotelOurTipAiRecommendationSettingConfigValue,
  HotelPopularAiRecommendationSettingConfigValue
} from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { RatePlanExtraService } from '@entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@entities/pricing-entities/rate-plan.entity';
import { RatePlanDailyExtraService } from '@entities/rate-plan-daily-extra-service.entity';
import { Restriction } from '@entities/restriction.entity';
import { RoomProductDailySellingPrice } from '@entities/room-product-daily-selling-price.entity';
import { RoomProductExtra } from '@entities/room-product-extra.entity';
import { RoomProductImage } from '@entities/room-product-image.entity';
import { RoomProductRatePlan } from '@entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@entities/room-product-standard-feature.entity';
import { RoomProduct } from '@entities/room-product.entity';
import {
  BookingFlow,
  CityTaxStatusEnum,
  DistributionChannel,
  HotelAgeCategoryCodeEnum,
  HotelAmenityCodeSurchargeEnum,
  HotelConfigurationTypeEnum,
  HotelRestrictionCodeEnum,
  HotelRetailFeatureStatusEnum,
  IsePricingDisplayModeEnum,
  LanguageCodeEnum,
  RatePlanExtraServiceType,
  RatePlanTypeEnum,
  RestrictionConditionType,
  RestrictionLevel,
  RoomProductExtraType,
  RoomProductStatus,
  RoomProductType,
  RoundingModeEnum
} from '@enums/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Reservation,
  ReservationStatusEnum
} from '@src/core/entities/booking-entities/reservation.entity';
import { Event } from '@src/core/entities/hotel-entities/event.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeature } from '@src/core/entities/hotel-standard-feature.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { BadRequestException } from '@src/core/exceptions';
import { S3Service } from '@src/core/s3/s3.service';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInDays,
  eachDayOfInterval,
  format,
  subDays,
  subMonths,
  subYears
} from 'date-fns';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper, splitArrayIntoChunks } from 'src/core/helper/utils';
import { parseStayDatesToUTC } from 'src/core/utils/datetime.util';
import { DataSource, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import {
  DirectFlowInput,
  DirectFlowResponse,
  DirectPipelineService
} from '../ai-recommendation/direct-pipeline.service';
import { BookingFlowResponse } from '../ai-recommendation/postprocessing.utils';
import {
  DirectBookingHistoryItem,
  DirectFeatureItem,
  DirectRoomProductAvailable
} from '../ai-recommendation/recommendation-algorithm.types';
import { CalculateAmenityPricingService } from '../hotel/services/calculate-amenity-pricing.service';
import { HotelService } from '../hotel/services/hotel.service';
import {
  AvailableRoomProductRatePlanListDto,
  DailySellability,
  PriorityCategoryCodeDto,
  RecommendationBookingHistoryDto,
  RecommendationFeatureHistoryDto,
  SellabilityCalendarZip,
  StayOptionDetailsDto,
  StayOptionsDto
} from './ise-recommendation.dto';
import { IseRecommendationService, ViolatedRestriction } from './ise-recommendation.service';
import { RoomRequestUtils } from './stay-option.util';

import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { AmenityDataProviderService } from '@src/core/modules/amenity-calculate/amenity-data-provider.service';
import { CityTaxCalculateService } from '@src/core/modules/pricing-calculate/city-tax/city-tax-calculate.service';
import { OccupancySurchargeCalculateService } from '@src/core/modules/pricing-calculate/services/occupancy-surcharge​-calculate.service';
import { groupByToMap } from '@src/core/utils/group-by.util';
import { Cache } from 'cache-manager';
import { HotelCityTaxRepository } from '../hotel-city-tax/hotel-city-tax.repository';
import {
  DateBookingStatus,
  LowestPriceResponseDto,
  RestrictionAnalysisResult,
  RestrictionDetails
} from './ise-recommendation.dto';
import { RestrictionService } from '../restriction/restriction.service';
import { RoomProductPricingRequestDto } from '../room-product-rate-plan/room-product-selling-price/room-product-selling-price.dto';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
@Injectable()
export class StayOptionService {
  logger = new Logger(StayOptionService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(Restriction, DbName.Postgres)
    private readonly restrictionRepository: Repository<Restriction>,

    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,

    @InjectRepository(RatePlanDailyExtraService, DbName.Postgres)
    private readonly ratePlanDailyExtraServiceRepository: Repository<RatePlanDailyExtraService>,

    @InjectRepository(RatePlanExtraService, DbName.Postgres)
    private readonly ratePlanExtraServiceRepository: Repository<RatePlanExtraService>,

    @InjectRepository(RoomProductExtra, DbName.Postgres)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,

    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Event, DbName.Postgres)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(RoomProductImage, DbName.Postgres)
    private readonly roomProductImageRepository: Repository<RoomProductImage>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductStandardFeature, DbName.Postgres)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(HotelStandardFeature, DbName.Postgres)
    private readonly hotelStandardFeatureRepository: Repository<HotelStandardFeature>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    private readonly calculateAmenityPricingService: CalculateAmenityPricingService,

    private readonly hotelService: HotelService,

    private readonly directPipelineService: DirectPipelineService,

    private readonly s3Service: S3Service,

    private readonly iseRecommendationService: IseRecommendationService,
    private readonly configService: ConfigService,
    private readonly occupancySurchargeCalculateService: OccupancySurchargeCalculateService,
    private readonly cityTaxCalculateService: CityTaxCalculateService,
    private readonly hotelCityTaxRepository: HotelCityTaxRepository,
    private readonly amenityDataProviderService: AmenityDataProviderService,
    private readonly restrictionService: RestrictionService,
    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  private readonly ONE_HOUR_TTL = 60 * 60 * 1000; // seconds

  async getCachedHotelRetailFeatures(hotelId: string): Promise<HotelRetailFeature[]> {
    const cacheKey = `hotel-retail-features:${hotelId}`;
    const cachedFeatures = await this.cacheManager.get<HotelRetailFeature[]>(cacheKey);
    if (cachedFeatures) {
      this.logger.log(`Cache hit for hotel retail features ${hotelId}`);
      return cachedFeatures;
    }

    this.logger.log(`Cache miss for hotel retail features ${hotelId} → Fetching from DB`);
    const features = await this.hotelRetailFeatureRepository.find({
      where: {
        hotelId: hotelId,
        status: HotelRetailFeatureStatusEnum.ACTIVE,
        isVisible: true
      },
      select: {
        code: true,
        name: true,
        baseWeight: true,
        description: true,
        measurementUnit: true,
        imageUrl: true,
        hotelRetailCategory: {
          code: true,
          name: true,
          displaySequence: true
        }
      },
      relations: ['hotelRetailCategory']
    });

    await this.cacheManager.set(cacheKey, features, this.ONE_HOUR_TTL);

    return features;
  }

  async getCachedHotelEvents(
    hotelId: string,
    arrivalUTC: Date,
    departureUTC: Date
  ): Promise<Event[]> {
    const cacheKey = `hotel-events:${hotelId}`;
    const cachedEvents = await this.cacheManager.get<Event[]>(cacheKey);
    if (cachedEvents) {
      this.logger.log(`Cache hit for hotel events ${hotelId}`);
      return cachedEvents;
    }

    this.logger.log(`Cache miss for hotel events ${hotelId} → Fetching from DB`);
    const events = await this.eventRepository.find({
      where: {
        hotelId: hotelId,
        startDate: LessThanOrEqual(arrivalUTC),
        endDate: MoreThanOrEqual(departureUTC),
        isVisible: true
      },
      select: {
        name: true,
        eventFeatures: {
          eventId: true,
          hotelRetailFeature: {
            code: true,
            name: true
          }
        }
      },
      relations: ['eventFeatures', 'eventFeatures.hotelRetailFeature']
    });

    await this.cacheManager.set(cacheKey, events, this.ONE_HOUR_TTL);

    return events;
  }

  async getIseRecommendationStayOptionDetails(payload: StayOptionDetailsDto) {
    const {
      hotelCode,
      dedicatedProductCode,
      arrival,
      departure,
      roomRequest,
      translateTo,
      priorityCategoryCodeList,
      promoCodeList
    } = payload;
    // validate input room request list
    if (!roomRequest || roomRequest.adult <= 0) {
      this.logger.error('Room request is required');
      return [];
    }

    // validate room request list has at least adult > 0
    if (!roomRequest.adult || roomRequest.adult <= 0) {
      this.logger.error('Adult is required');
      return [];
    }
    // step 1: get hotel first to get timezone
    const hotel = await this.iseRecommendationService.getCachedHotel(hotelCode);

    if (!hotel) {
      this.logger.error(`Hotel with code ${payload.hotelCode} not found`);
      return [];
    }

    // Parse dates with proper timezone handling
    let parsedDates;
    try {
      parsedDates = parseStayDatesToUTC(arrival, departure, undefined, hotel.timeZone);
    } catch (error) {
      this.logger.error(`Date parsing error: ${error.message}`);
      return [];
    }

    const { arrivalUTC, departureUTC, fromDateFormatted, toDateFormatted } = parsedDates;

    let cityTaxDisplayMode: IsePricingDisplayModeEnum | null = null;
    const hotelConfiguration = await this.iseRecommendationService.getCachedHotelConfig(hotel.id);
    hotelConfiguration.forEach((config) => {
      if (config.configType === HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY) {
        cityTaxDisplayMode = config.configValue?.metadata?.cityTaxMode as IsePricingDisplayModeEnum;
      }
    });
    const hotelConfigRoundingMode = {
      roundingMode: RoundingModeEnum.HALF_UP,
      decimalPlaces: 2
    };

    // Calculate guest counts from room requests
    const guestCounts = RoomRequestUtils.calculateGuestCounts([roomRequest]);
    const { totalAdults, totalChildren, requestedCapacity, totalPets, childrenAgeList } =
      guestCounts;

    // Use the properly parsed and formatted dates
    const fromDate = fromDateFormatted;
    const toDate = toDateFormatted;
    const requestLength = 1;

    let ratePlanPromoIds: string[] = [];
    let isRatePlanContract = false;
    // check if the promo code is corporate
    if (promoCodeList && promoCodeList.length > 0) {
      const ratePlanContracts = await this.checkCorporateFlow(hotel.id, promoCodeList);
      ratePlanPromoIds = ratePlanContracts.map((ratePlan) => ratePlan.id);
      isRatePlanContract = ratePlanContracts.some(
        (ratePlan) => ratePlan.type === RatePlanTypeEnum.GROUP
      );
    }

    let [hotelRetailFeatures, roomProductsWithCapacity] = await Promise.all([
      // get hotel retail features - optimized query
      this.getCachedHotelRetailFeatures(hotel.id),
      this.getRoomProductsWithCapacity(
        hotel.id,
        [RoomProductType.ERFC, RoomProductType.MRFC, RoomProductType.RFC], // assume all room products are available
        totalAdults,
        totalChildren,
        totalPets,
        requestedCapacity,
        requestLength,
        dedicatedProductCode,
        translateTo
      )
    ]);

    if (translateTo && roomProductsWithCapacity?.length > 0) {
      roomProductsWithCapacity = roomProductsWithCapacity?.map((p) => {
        if (!translateTo) {
          return p;
        }

        const translatedRoomProduct = p.translations?.find((t) => t.languageCode === translateTo);
        return {
          ...p,
          name: translatedRoomProduct?.name || p.name,
          description: translatedRoomProduct?.description || p.description,
          roomProductStandardFeatures: p.roomProductStandardFeatures?.map((sf) => {
            const translatedStandardFeature = sf.standardFeature.translations?.find(
              (t) => `${t.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
            );
            return {
              ...sf,
              standardFeature: {
                ...sf.standardFeature,
                name: translatedStandardFeature?.name || sf.standardFeature.name,
                description:
                  translatedStandardFeature?.description || sf.standardFeature.description
              }
            };
          }),
          roomProductRetailFeatures: p.roomProductRetailFeatures?.map((rf) => {
            const translatedRetailFeature = rf.retailFeature.translations?.find(
              (t) => `${t.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
            );
            return {
              ...rf,
              retailFeature: {
                ...rf.retailFeature,
                name: translatedRetailFeature?.name || rf.retailFeature.name,
                description: translatedRetailFeature?.description || rf.retailFeature.description
              }
            };
          })
        };
      });
    }

    if (roomProductsWithCapacity.length === 0) {
      this.logger.error('No room products with capacity found');
      return [];
    }

    // Fetch parallel data for room product rate plans, availability, and reservation counts
    const parallelData = await this.fetchParallelRecommendationData(
      hotel.id,
      roomProductsWithCapacity.map((rp) => rp.id),
      fromDate,
      toDate,
      ratePlanPromoIds
    );

    const { roomProductRatePlans, availabilityPerDate, restrictions, hotelAmenityMap } =
      parallelData;

    if (roomProductRatePlans.length === 0) {
      this.logger.error('No room product rate plans found');
      return [];
    }

    // filter restrictions by 3 levels
    // for hotel level -> room product ids null, rate plan ids null
    // for room product level -> room product ids not null, rate plan ids null
    // for rate plan level -> room product ids null, rate plan ids not null
    // for room product rate plan level -> room product ids not null, rate plan ids not null
    const dedicatedProductId = roomProductsWithCapacity.map((r) => r.id)[0];

    const restrictionsHotelLevel = [...restrictions].filter(
      (r) => !r.roomProductIds?.length && !r.ratePlanIds?.length
    );
    const restrictionsRoomProductLevel = [...restrictions].filter(
      (r) =>
        r.roomProductIds?.length &&
        !r.ratePlanIds?.length &&
        r.roomProductIds.includes(dedicatedProductId)
    );
    const restrictionsRatePlanLevel = [...restrictions].filter(
      (r) =>
        !r.roomProductIds?.length &&
        r.ratePlanIds?.length &&
        (ratePlanPromoIds?.length > 0 ? r.ratePlanIds.includes(ratePlanPromoIds[0]) : true)
    );

    const isValidHotelRestriction =
      restrictionsHotelLevel?.length > 0
        ? this.validateHotelRestriction(fromDate, toDate, restrictionsHotelLevel)
        : true;

    if (!isValidHotelRestriction) {
      this.logger.warn(`Hotel restriction is not valid for hotel ${hotel.id}`);
      return [];
    }

    // Process sellability and availability for room product rate plans
    const sellabilityData = this.processSellabilityAndAvailability(
      roomProductRatePlans,
      availabilityPerDate,
      fromDate,
      toDate,
      restrictionsRatePlanLevel,
      restrictionsRoomProductLevel
    );

    if (sellabilityData.roomProductIdsAvailable.length === 0) {
      this.logger.warn('No room product rate plans with sellability found');
      // return [];
    }

    // Process room product rate plan pricing (handles taxes, extra services, amenities)
    const processedPricingData = await this.processRoomProductRatePlanPricing(
      hotel,
      sellabilityData.roomProductRatePlanPricingAvailable,
      fromDate,
      toDate,
      totalAdults,
      childrenAgeList,
      totalPets,
      hotelConfigRoundingMode,
      hotelAmenityMap,
      cityTaxDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE
    );

    const featureRequestList: DirectFeatureItem[] = (priorityCategoryCodeList || [])?.flatMap(
      (codeList, idx) =>
        codeList.codeList.map((code) => ({
          code: code!,
          name: hotelRetailFeatures.find((feature) => feature.code === code)?.name!,
          popularity: hotelRetailFeatures.find((feature) => feature.code === code)?.baseWeight!,
          priority: idx
        }))
    );

    // Build available room product list with pricing and capacity data
    const availableRfcList = this.buildAvailableRoomProductList(
      roomProductsWithCapacity!,
      sellabilityData.roomProductRatePlanPricingAvailable,
      processedPricingData,
      guestCounts!,
      IsePricingDisplayModeEnum.INCLUSIVE,
      restrictionsRoomProductLevel,
      featureRequestList,
      hotelRetailFeatures,
      fromDate,
      toDate,
      translateTo || LanguageCodeEnum.EN
    );

    // process room product surcharge
    const roomProductSurcharge = await this.processAllSurcharges(
      [{ availableRfcList }],
      hotel,
      fromDate,
      toDate,
      childrenAgeList,
      hotelConfigRoundingMode,
      hotelAmenityMap
    );

    return this.processImageUrls(roomProductSurcharge);
  }

  async getIseRecommendationStayOptions(
    payload: StayOptionsDto,
    byPassRestriction: boolean = false
  ) {
    const performanceTimer = {
      total: performance.now(),
      hotel: 0,
      hotelConfig: 0,
      roomProducts: 0,
      parallelData: 0,
      gradedLabel: 0,
      dataTransformation: 0,
      responseBuilding: 0
    };

    const {
      arrival,
      departure,
      hotelCode,
      roomRequestList,
      translateTo,
      travelTagCodeList,
      occasionCodeList,
      promoCodeList,
      splitToDoubleRooms,
      priorityCategoryCodeList,
      spaceTypeRequestList
    } = payload;
    // validate input room request list
    if (!roomRequestList || roomRequestList.length === 0) {
      this.logger.error('Room request list is required');
      return [];
    }

    // validate room request list has at least adult > 0
    for (const roomRequest of payload.roomRequestList) {
      if (!roomRequest.adult || roomRequest.adult <= 0) {
        this.logger.error('Adult is required');
        return [];
      }
    }

    // step 1: get hotel first to get timezone
    const hotel = await this.iseRecommendationService.getCachedHotel(hotelCode);

    if (!hotel) {
      this.logger.error(`Hotel with code ${payload.hotelCode} not found`);
      return [];
    }

    // Parse dates with proper timezone handling
    let parsedDates;
    try {
      parsedDates = parseStayDatesToUTC(arrival, departure, undefined, hotel.timeZone);
    } catch (error) {
      this.logger.error(`Date parsing error: ${error.message}`);
      return [];
    }

    const { arrivalUTC, departureUTC } = parsedDates;

    const hotelId = hotel.id;

    const [hotelConfiguration, hotelRetailFeatures, hotelEvents] = await Promise.all([
      this.iseRecommendationService.getCachedHotelConfig(hotelId),

      // get hotel retail features - optimized query
      this.getCachedHotelRetailFeatures(hotelId),

      // get hotel events - optimized query
      this.getCachedHotelEvents(hotelId, arrivalUTC, departureUTC)
    ]);

    // Optimized Map creation with reduce for better memory efficiency
    const hotelRetailFeaturesMap: Map<string, HotelRetailFeature> = hotelRetailFeatures.reduce(
      (map, feature) => {
        map.set(feature.code, feature);
        return map;
      },
      new Map<string, HotelRetailFeature>()
    );

    let allowAllRoomProducts: Map<RoomProductType, boolean> = new Map();
    // Default to all types for lowest price, will be overridden by config if exists
    let lowestPriceRoomProductType: Map<RoomProductType, boolean> = new Map([
      [RoomProductType.RFC, true],
      [RoomProductType.MRFC, true],
      [RoomProductType.ERFC, true]
    ]);

    // sales strategy - default to all types, will be overridden by config if exists
    const salesStrategy = {
      mostPopular: [
        RoomProductType.RFC,
        RoomProductType.MRFC,
        RoomProductType.ERFC
      ] as RoomProductType[],
      ourTip: [
        RoomProductType.RFC,
        RoomProductType.MRFC,
        RoomProductType.ERFC
      ] as RoomProductType[],
      direct: [
        RoomProductType.RFC,
        RoomProductType.MRFC,
        RoomProductType.ERFC
      ] as RoomProductType[],
      match: [RoomProductType.RFC, RoomProductType.MRFC, RoomProductType.ERFC] as RoomProductType[]
    };

    let isIsePricingDisplay = IsePricingDisplayModeEnum.INCLUSIVE;
    let cityTaxDisplayMode: IsePricingDisplayModeEnum | null = null;
    let hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number } = {
      roundingMode: RoundingModeEnum.NO_ROUNDING,
      decimalPlaces: 2
    };

    let priceJump = true;

    let popularConfig: HotelPopularAiRecommendationSettingConfigValue | undefined = undefined;

    let ourTipConfig: HotelOurTipAiRecommendationSettingConfigValue | undefined = undefined;

    hotelConfiguration.forEach((config) => {
      switch (config.configType) {
        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING:
          const roomProductRecommendationDirectValues = config.configValue.metadata as Record<
            string,
            boolean
          >;
          // Clear default and set from config
          salesStrategy.direct = [];
          Object.keys(roomProductRecommendationDirectValues).forEach((key) => {
            if (roomProductRecommendationDirectValues[key]) {
              salesStrategy.direct.push(key as RoomProductType);
            }
          });

          break;

        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING:
          const roomProductRecommendationConfiguratorValues = config.configValue.metadata as Record<
            string,
            boolean
          >;
          // Clear default and set from config

          salesStrategy.match = [];
          Object.keys(roomProductRecommendationConfiguratorValues).forEach((key) => {
            if (roomProductRecommendationConfiguratorValues[key]) {
              salesStrategy.match.push(key as RoomProductType);
            }
          });

          break;

        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING:
          const roomRecommendationGradedLabelLowestPriceValues = config.configValue?.metadata
            ?.LOWEST_PRICE as Record<string, boolean>;

          if (roomRecommendationGradedLabelLowestPriceValues) {
            // Clear default and set from config
            lowestPriceRoomProductType.clear();
            Object.keys(roomRecommendationGradedLabelLowestPriceValues).forEach((key) => {
              lowestPriceRoomProductType.set(
                key as RoomProductType,
                roomRecommendationGradedLabelLowestPriceValues[key]
              );
            });
          }

          const roomRecommendationGradedLabelMostPopularValues = config.configValue.metadata
            ?.MOST_POPULAR as Record<string, boolean>;
          if (roomRecommendationGradedLabelMostPopularValues) {
            // Clear default and set from config
            salesStrategy.mostPopular = [];
            Object.keys(roomRecommendationGradedLabelMostPopularValues).forEach((key) => {
              if (roomRecommendationGradedLabelMostPopularValues[key]) {
                salesStrategy.mostPopular.push(key as RoomProductType);
              }
            });
          }

          const roomRecommendationGradedLabelDirectValues = config.configValue.metadata
            ?.OUR_TIP as Record<string, boolean>;
          if (roomRecommendationGradedLabelDirectValues) {
            // This will override OUR_TIP_SETTING if both exist
            // Clear and set from config
            salesStrategy.ourTip = [];
            Object.keys(roomRecommendationGradedLabelDirectValues).forEach((key) => {
              if (roomRecommendationGradedLabelDirectValues[key]) {
                salesStrategy.ourTip.push(key as RoomProductType);
              }
            });
          }

          const roomRecommendationGradedLabelMatchValues = config.configValue.metadata
            ?.MATCH as Record<string, boolean>;
          if (roomRecommendationGradedLabelMatchValues) {
            // Clear default and set from config
            salesStrategy.match = [];
            Object.keys(roomRecommendationGradedLabelMatchValues).forEach((key) => {
              if (roomRecommendationGradedLabelMatchValues[key]) {
                salesStrategy.match.push(key as RoomProductType);
              }
            });
          }

          break;
        case HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE:
          hotelConfigRoundingMode = {
            roundingMode: config.configValue?.metadata?.roundingMode,
            decimalPlaces: config.configValue?.metadata?.decimalUnits
          };
          break;
        case HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY:
          isIsePricingDisplay = config.configValue?.metadata?.mode as IsePricingDisplayModeEnum;
          cityTaxDisplayMode = config.configValue?.metadata
            ?.cityTaxMode as IsePricingDisplayModeEnum;
          break;

        case HotelConfigurationTypeEnum.DISABLE_STAY_OPTION_PRICE_CLUSTERING:
          priceJump = !(config.configValue?.value === 'true');
          break;

        case HotelConfigurationTypeEnum.POPULAR_AI_RECOMMENDATION_SETTING:
          popularConfig = config.configValue as HotelPopularAiRecommendationSettingConfigValue;
          break;
        case HotelConfigurationTypeEnum.OUR_TIP_AI_RECOMMENDATION_SETTING:
          ourTipConfig = config.configValue as HotelOurTipAiRecommendationSettingConfigValue;
          break;
      }
    });

    // Allow all room product types by default - filtering will be done per booking flow
    const types: RoomProductType[] = [
      RoomProductType.RFC,
      RoomProductType.MRFC,
      RoomProductType.ERFC
    ];

    this.logger.debug(`✅ Final Sales Strategy: ${JSON.stringify(salesStrategy)}`);

    const splitedRoomRequestList = splitToDoubleRooms
      ? RoomRequestUtils.split(roomRequestList)
      : roomRequestList;

    let ratePlanPromoIds: string[] = [];
    let isRatePlanContract = false;

    // check if the promo code is corporate
    if (promoCodeList && promoCodeList.length > 0) {
      const ratePlanContracts = await this.checkCorporateFlow(hotel.id, promoCodeList);
      ratePlanPromoIds = ratePlanContracts.map((ratePlan) => ratePlan.id);
      isRatePlanContract = ratePlanContracts.some(
        (ratePlan) => ratePlan.type === RatePlanTypeEnum.GROUP
      );
    }

    const featureRequestList: DirectFeatureItem[] = (priorityCategoryCodeList || [])?.flatMap(
      (codeList, idx) =>
        codeList.codeList.map((code) => ({
          code: code!,
          name: hotelRetailFeatures.find((feature) => feature.code === code)?.name!,
          popularity: hotelRetailFeatures.find((feature) => feature.code === code)?.baseWeight!,
          priority: idx
        }))
    );

    const inputDirect: DirectFlowInput = {
      featureList: hotelRetailFeatures.map((feature) => ({
        code: feature.code,
        name: feature.name,
        popularity: feature.baseWeight
      })),
      salesStrategy,
      roomRequestList: splitedRoomRequestList.map((roomRequest, idx) => ({
        index: idx,
        adults: roomRequest.adult,
        children: (roomRequest?.childrenAgeList || []).length,
        pets: roomRequest.pets
      })),
      eventFeatureList: hotelEvents
        .flatMap((eve) => eve.eventFeatures)
        .map((event) => ({
          featureList: [event.hotelRetailFeature.code]
        })),
      lowestPriceList: [],
      lowestPrice: 0,
      bookingHistoryList: [],
      stayOptionRecommendationNumber: 10,
      availableRoomProductList: [],
      priceJump: priceJump,
      mergedRequest: false,
      spaceTypeRequestList: spaceTypeRequestList,
      featureRequestList,
      popularConfig,
      ourTipConfig
    };

    try {
      const gradedLabelStart = performance.now();
      // Use split room request list if splitToDoubleRooms is enabled
      const payloadForGradedLabel = {
        ...payload,
        roomRequestList: splitedRoomRequestList
      };
      const result = await this.gradedLabelRecommendationList(
        payloadForGradedLabel,
        hotel,
        types,
        hotelConfigRoundingMode,
        isIsePricingDisplay,
        inputDirect,
        lowestPriceRoomProductType,
        ratePlanPromoIds,
        isRatePlanContract,
        hotelRetailFeaturesMap,
        byPassRestriction,
        featureRequestList,
        [],
        translateTo || LanguageCodeEnum.EN,
        cityTaxDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE ? true : false
      );
      performanceTimer.gradedLabel = performance.now() - gradedLabelStart;

      // Log final performance summary
      performanceTimer.total = performance.now() - performanceTimer.total;
      // this.logger.verbose(`⏱️ PERFORMANCE SUMMARY:
      //   🏨 Hotel Query: ${(performanceTimer.hotel / 1000).toFixed(3)}s
      //   ⚙️ Hotel Config: ${(performanceTimer.hotelConfig / 1000).toFixed(3)}s
      //   🏠 Room Products: ${(performanceTimer.roomProducts / 1000).toFixed(3)}s
      //   📊 Parallel Data: ${(performanceTimer.parallelData / 1000).toFixed(3)}s
      //   🎯 Graded Label: ${(performanceTimer.gradedLabel / 1000).toFixed(3)}s
      //   🔄 Data Transform: ${(performanceTimer.dataTransformation / 1000).toFixed(3)}s
      //   📦 Response Build: ${(performanceTimer.responseBuilding / 1000).toFixed(3)}s
      //   ⏱️ TOTAL: ${(performanceTimer.total / 1000).toFixed(3)}s`);

      return result;
    } catch (error) {
      this.logger.error('Error in graded label recommendation list', [error]);
      return [];
    }
  }

  async checkCorporateFlow(hotelId: string, promoCodeList: string[]): Promise<RatePlan[]> {
    const normalizedPromoCodes = promoCodeList.map((p) => p.toLowerCase());

    const ratePlan = await this.ratePlanRepository
      .createQueryBuilder('rp')
      .where('rp.hotel_id = :hotelId', { hotelId })
      .andWhere(
        `EXISTS (
        SELECT 1 FROM unnest(rp.promo_codes) pc 
        WHERE LOWER(pc) = ANY(:promoCodes)
      )`,
        {
          promoCodes: normalizedPromoCodes
        }
      )
      .select(['rp.id', 'rp.promo_codes', 'rp.type'])
      .getMany();

    return ratePlan;
  }

  private validateHotelRestriction(
    fromDate: string,
    toDate: string,
    restrictions: Restriction[]
  ): boolean {
    const checkOutDate = format(addDays(new Date(toDate), 1), DATE_FORMAT); // Last night of stay

    const searchDates = Helper.generateDateRange(fromDate, toDate);
    const dateRangeCheckRestriction = Helper.generateDateRange(fromDate, checkOutDate);

    for (const currentStayDate of dateRangeCheckRestriction) {
      const isFirstDay = currentStayDate === dateRangeCheckRestriction[0];
      const isLastDay =
        currentStayDate === dateRangeCheckRestriction[dateRangeCheckRestriction.length - 1];
      const violatingRestrictions = this.checkViolatingRestrictions(
        currentStayDate,
        restrictions,
        fromDate,
        checkOutDate,
        searchDates.length,
        isFirstDay,
        isLastDay
      );
      if (violatingRestrictions.length > 0) {
        return false;
      }
    }

    // const violatingRestrictions = this.checkViolatingRestrictions(
    //   fromDate,
    //   searchDates,
    //   restrictions
    // );
    // if (violatingRestrictions.length > 0) {
    //   return false;
    // }

    return true;
  }

  /**
   * Main method to generate graded label recommendations for room products
   * Handles both match flow and direct flow based on input parameters
   */
  async gradedLabelRecommendationList(
    inputStayOptions: StayOptionsDto,
    hotel: Hotel,
    types: RoomProductType[],
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    isIsePricingDisplay: IsePricingDisplayModeEnum,
    inputDirect: DirectFlowInput,
    allLowestPriceRoomProductType: Map<RoomProductType, boolean>,
    ratePlanPromoIdList: string[] = [],
    isRatePlanContract: boolean = false,
    hotelRetailFeaturesMap: Map<string, HotelRetailFeature>,
    byPassRestriction: boolean = false,
    featureRequestList: DirectFeatureItem[],
    hotelRetailFeatures: HotelRetailFeature[],
    translateTo: string,
    isIncludeCityTax?: boolean
  ) {
    // Extract and validate input parameters
    const validationResult = await this.validateAndExtractInputs(
      inputStayOptions,
      hotel.id,
      types,
      hotel.timeZone
    );
    if (!validationResult.isValid) {
      return [];
    }

    const { guestCounts, dateRange, roomProductsWithCapacity, roomProductIds } = validationResult;
    const { totalAdults, totalChildren, totalPets, childrenAgeList } = guestCounts!;
    const { fromDate, toDate } = dateRange!;

    // Fetch parallel data for room product rate plans, availability, and reservation counts
    const parallelData = await this.fetchParallelRecommendationData(
      hotel.id,
      roomProductIds!,
      fromDate,
      toDate,
      ratePlanPromoIdList
    );

    const {
      roomProductRatePlans,
      availabilityPerDate,
      samePeriodReservationCount,
      restrictions,
      hotelAmenityMap
    } = parallelData;

    if (roomProductRatePlans.length === 0) {
      return [];
    }

    // filter restrictions by 3 levels
    // for hotel level -> room product ids null, rate plan ids null
    // for room product level -> room product ids not null, rate plan ids null
    // for rate plan level -> room product ids null, rate plan ids not null
    // for room product rate plan level -> room product ids not null, rate plan ids not null
    const restrictionsHotelLevel = [...restrictions].filter(
      (r) => !r.roomProductIds?.length && !r.ratePlanIds?.length
    );

    const restrictionsRoomProductLevel = [...restrictions].filter(
      (r) => r.roomProductIds?.length && !r.ratePlanIds?.length
    );

    const restrictionsRatePlanLevel = [...restrictions].filter(
      (r) =>
        !r.roomProductIds?.length &&
        r.ratePlanIds?.length &&
        (ratePlanPromoIdList?.length > 0
          ? this.getArraysIntersection(r.ratePlanIds, ratePlanPromoIdList).length > 0
          : true)
    );

    const restrictionsRoomProductRatePlanLevel = [...restrictions].filter(
      (r) => r.roomProductIds?.length && r.ratePlanIds?.length
    );

    const isValidHotelRestriction =
      restrictionsHotelLevel?.length > 0
        ? this.validateHotelRestriction(fromDate, toDate, restrictionsHotelLevel)
        : true;

    if (!isValidHotelRestriction && !byPassRestriction) {
      this.logger.warn(`Hotel restriction is not valid for hotel ${hotel.id}`);
      return [];
    }

    // Process sellability and availability for room product rate plans
    const sellabilityData = this.processSellabilityAndAvailability(
      roomProductRatePlans,
      availabilityPerDate,
      fromDate,
      toDate,
      restrictionsRatePlanLevel,
      restrictionsRoomProductLevel
    );

    if (sellabilityData.roomProductIdsAvailable.length === 0) {
      return [];
    }

    // Process room product rate plan pricing (handles taxes, extra services, amenities)
    const processedPricingData = await this.processRoomProductRatePlanPricing(
      hotel,
      sellabilityData.roomProductRatePlanPricingAvailable,
      fromDate,
      toDate,
      totalAdults,
      childrenAgeList,
      totalPets,
      hotelConfigRoundingMode,
      hotelAmenityMap,
      isIncludeCityTax
    );

    // Build available room product list with pricing and capacity data
    const availableRfcList = this.buildAvailableRoomProductList(
      roomProductsWithCapacity!,
      sellabilityData.roomProductRatePlanPricingAvailable,
      processedPricingData,
      guestCounts!,
      isIsePricingDisplay,
      restrictionsRoomProductLevel,
      featureRequestList,
      hotelRetailFeatures,
      fromDate,
      toDate,
      translateTo
    );

    // filter availableRfcList no rfcRatePlanList
    const availableRfcListWithRfcRatePlanList = [...availableRfcList].filter(
      (p) => p.rfcRatePlanList.length > 0
    );

    // Determine flow type and process recommendations accordingly
    const isMatchFlow = inputDirect.featureRequestList && inputDirect.featureRequestList.length > 0;

    if (isMatchFlow) {
      return this.handleMatchFlow(
        availableRfcListWithRfcRatePlanList,
        inputDirect,
        hotel,
        fromDate,
        toDate,
        childrenAgeList,
        hotelConfigRoundingMode,
        hotelAmenityMap,
        hotelRetailFeaturesMap
      );
    } else {
      inputDirect.priceJump = true;
      return this.handleDirectFlow(
        roomProductsWithCapacity!,
        availableRfcListWithRfcRatePlanList,
        allLowestPriceRoomProductType,
        samePeriodReservationCount,
        inputDirect,
        totalAdults,
        totalChildren,
        totalPets,
        hotel,
        fromDate,
        toDate,
        childrenAgeList,
        hotelConfigRoundingMode,
        hotelAmenityMap,
        ratePlanPromoIdList,
        isRatePlanContract
      );
    }
  }

  /**
   * Validates input parameters and extracts necessary data for room recommendation processing
   * @private
   */
  private async validateAndExtractInputs(
    inputStayOptions: StayOptionsDto,
    hotelId: string,
    types: RoomProductType[],
    hotelTimezone?: string
  ): Promise<{
    isValid: boolean;
    guestCounts?: {
      totalAdults: number;
      totalChildren: number;
      requestedCapacity: number;
      totalPets: number;
      childrenAgeList: number[];
    };
    dateRange?: {
      fromDate: string;
      toDate: string;
    };
    roomProductsWithCapacity?: RoomProduct[];
    roomProductIds?: string[];
  }> {
    const {
      arrival,
      departure,
      roomRequestList,
      translateTo,
      travelTagCodeList,
      occasionCodeList,
      spaceTypeRequestList
    } = inputStayOptions;

    const requestLength = roomRequestList.length;

    // Calculate guest counts from room requests
    const guestCounts = RoomRequestUtils.calculateGuestCounts(roomRequestList);
    const { totalAdults, totalChildren, requestedCapacity, totalPets } = guestCounts;

    // Parse dates with proper timezone handling
    let parsedDates;
    try {
      parsedDates = parseStayDatesToUTC(arrival, departure, undefined, hotelTimezone);
    } catch (error) {
      this.logger.error(`Date parsing error in validateAndExtractInputs: ${error.message}`);
      return { isValid: false };
    }

    const { fromDateFormatted, toDateFormatted } = parsedDates;
    const fromDate = fromDateFormatted;
    const toDate = toDateFormatted;

    // Get room products that match capacity requirements
    const roomProductsWithCapacity = await this.getRoomProductsWithCapacity(
      hotelId,
      types,
      totalAdults,
      totalChildren,
      totalPets,
      requestedCapacity,
      requestLength,
      undefined,
      translateTo
    );

    // Early validation - check if we have available room products
    if (roomProductsWithCapacity.length === 0) {
      return { isValid: false };
    }

    const roomProductIds = roomProductsWithCapacity.map((p) => p.id);
    if (roomProductIds.length === 0) {
      return { isValid: false };
    }

    return {
      isValid: true,
      guestCounts,
      dateRange: { fromDate, toDate },
      roomProductsWithCapacity: roomProductsWithCapacity.map((p) => {
        if (!translateTo) {
          return p;
        }

        const translatedRoomProduct = p.translations?.find(
          (t) => `${t.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
        );

        return {
          ...p,
          name: translatedRoomProduct?.name || p.name,
          description: translatedRoomProduct?.description || p.description,
          roomProductStandardFeatures: p.roomProductStandardFeatures?.map((sf) => {
            const translatedStandardFeature = sf.standardFeature.translations?.find(
              (t) => `${t.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
            );
            return {
              ...sf,
              standardFeature: {
                ...sf.standardFeature,
                name: translatedStandardFeature?.name || sf.standardFeature.name,
                description:
                  translatedStandardFeature?.description || sf.standardFeature.description
              }
            };
          }),
          roomProductRetailFeatures: p.roomProductRetailFeatures?.map((rf) => {
            const translatedRetailFeature = rf.retailFeature.translations?.find(
              (t) => `${t.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
            );
            return {
              ...rf,
              retailFeature: {
                ...rf.retailFeature,
                name: translatedRetailFeature?.name || rf.retailFeature.name,
                description: translatedRetailFeature?.description || rf.retailFeature.description
              }
            };
          })
        };
      }),
      roomProductIds
    };
  }

  /**
   * Fetches parallel data needed for recommendation processing
   * @private
   */
  private async fetchParallelRecommendationData(
    hotelId: string,
    roomProductIds: string[],
    fromDate: string,
    toDate: string,
    ratePlanPromoIdList: string[]
  ) {
    const parallelDataStart = performance.now();

    const [
      roomProductRatePlans,
      availabilityPerDate,
      samePeriodReservationCount,
      restrictions,
      hotelAmenityMap
    ] = await Promise.all([
      // Get room product rate plans with sellability
      this.iseRecommendationService.getRoomProductRatePlansWithSellability(
        hotelId,
        roomProductIds,
        fromDate,
        toDate,
        ratePlanPromoIdList
      ),
      // Get availability per date
      this.calculateAvailabilityPerDateRaw(hotelId, fromDate, toDate, roomProductIds),

      // Get same period reservation count
      this.getSamePeriodReservationCount(hotelId, fromDate, toDate),

      // get restrictions
      this.iseRecommendationService.getRestrictions(hotelId, fromDate, toDate),

      // get hotel amenities
      this.getHotelAmenitiesMap(hotelId, true)
    ]);

    const parallelDataTime = performance.now() - parallelDataStart;
    this.logger.debug(`⏱️ Parallel Data Queries: ${(parallelDataTime / 1000).toFixed(3)}s`);

    return {
      roomProductRatePlans,
      availabilityPerDate,
      samePeriodReservationCount,
      restrictions,
      hotelAmenityMap
    };
  }

  /**
   * Processes sellability and availability for room product rate plans
   * @private
   */
  private processSellabilityAndAvailability(
    roomProductRatePlans: RoomProductRatePlan[],
    availabilityPerDate: { date: string; roomProductId: string | null; available: number }[],
    fromDate: string,
    toDate: string,
    restrictions: Restriction[],
    restrictionsRoomProductLevel: Restriction[]
  ) {
    // Create availability map for quick lookup - optimized with reduce
    const availabilityPerDateMap = new Map<string, number>();
    availabilityPerDate.forEach((p) => {
      availabilityPerDateMap.set(`${p.date};${p.roomProductId}`, p.available);
    });

    // Map to store sellability results
    const roomProductRatePlanSellabilityMap = new Map<string, boolean>();

    // Generate date range for checking sellability day by day
    const searchDates = Helper.generateDateRange(
      format(fromDate, DATE_FORMAT),
      format(toDate, DATE_FORMAT)
    );

    // Check sellability for each room product rate plan combination
    for (const p of roomProductRatePlans) {
      // filter restrictions has apply to rate plan
      const restrictionWithRatePlan = [...restrictions].filter((r) =>
        r.ratePlanIds?.includes(p.ratePlanId)
      );

      // filter restrictions has apply to this room product

      const restrictionWithRoomProduct = [...restrictionsRoomProductLevel].filter((r) =>
        r.roomProductIds?.includes(p.roomProductId)
      );

      const isSellableForAllDates = this.checkSellabilityForAllDates(
        p,
        searchDates,
        availabilityPerDateMap,
        restrictionWithRatePlan,
        restrictionWithRoomProduct
      );

      roomProductRatePlanSellabilityMap.set(
        `${p.roomProductId};${p.ratePlanId}`,
        isSellableForAllDates
      );
    }

    // Extract sellable room product rate plan combinations
    const roomProductRatePlanSellabilityList = Array.from(
      roomProductRatePlanSellabilityMap.entries()
    )
      .map(([key, value]) => {
        const [roomProductId, ratePlanId] = key.split(';');
        return { roomProductId, ratePlanId, isSellable: value };
      })
      .filter((p) => p.isSellable);

    // Filter rate plans available for ISE sales
    const roomProductRatePlanPricingAvailable = roomProductRatePlans.filter(
      (p) =>
        roomProductRatePlanSellabilityList.some(
          (rp) => rp.roomProductId === p.roomProductId && rp.ratePlanId === p.ratePlanId
        ) && p.ratePlan?.distributionChannel?.includes(DistributionChannel.GV_SALES_ENGINE)
    );

    const roomProductIdsAvailable = [
      ...new Set(roomProductRatePlanPricingAvailable.map((p) => p.roomProductId))
    ];

    return {
      roomProductRatePlanSellabilityList,
      roomProductRatePlanPricingAvailable,
      roomProductIdsAvailable
    };
  }

  /**
   * Checks if a room product rate plan is sellable for all dates in the stay period
   * @private
   */
  private checkSellabilityForAllDates(
    roomProductRatePlan: RoomProductRatePlan,
    searchDates: string[],
    availabilityPerDateMap: Map<string, number>,
    restrictionsRatePlanLevel: Restriction[],
    restrictionsRoomProductLevel: Restriction[]
  ): boolean {
    const { roomProductId, isSellable, ratePlan } = roomProductRatePlan;

    // ---------------------------------------------
    // PRE-INDEX DAILY SELLABILITY (Rate Plan)
    // ---------------------------------------------
    const dailyRpSellabilityMap = new Map<string, boolean>();
    for (const d of ratePlan.ratePlanDailySellabilities) {
      if (d.distributionChannel === DistributionChannel.GV_SALES_ENGINE) {
        dailyRpSellabilityMap.set(d.date, d.isSellable);
      }
    }

    // Default rate plan sellability for GV_SALES_ENGINE
    let defaultRatePlanSellable = false;
    const defaultRp = ratePlan.ratePlanSellabilities?.find((rps) =>
      rps.distributionChannel.includes(DistributionChannel.GV_SALES_ENGINE)
    );
    if (defaultRp?.id) {
      defaultRatePlanSellable = true;
    }

    // ---------------------------------------------
    // PRE-INDEX DAILY ROOM PRODUCT RATE PLAN SELLABILITY
    // ---------------------------------------------
    const dailyRprpSellabilityMap = new Map<string, boolean>();
    for (const adj of roomProductRatePlan.roomProductRatePlanAvailabilityAdjustments) {
      dailyRprpSellabilityMap.set(adj.date, adj.isSellable);
    }

    // ---------------------------------------------
    // LOOP THROUGH DATES
    // ---------------------------------------------

    // check sellability for each date in the stay period
    for (const currentStayDate of searchDates) {
      // ---------------------------------------------
      // AVAILABILITY (FAST)
      // ---------------------------------------------
      const availability = availabilityPerDateMap.get(currentStayDate + ';' + roomProductId);
      if (!availability || availability <= 0) return false;

      // ---------------------------------------------
      // RATE PLAN SELLABILITY (FAST)
      // ---------------------------------------------
      const ratePlanSellable =
        dailyRpSellabilityMap.get(currentStayDate) ?? defaultRatePlanSellable;

      // ---------------------------------------------
      // ROOM PRODUCT RATE PLAN SELLABILITY (FAST)
      // ---------------------------------------------
      const roomProductRatePlanSellable =
        dailyRprpSellabilityMap.get(currentStayDate) ?? isSellable;

      if (!(ratePlanSellable && roomProductRatePlanSellable)) {
        return false;
      }
    }

    // check restriction for each date in the stay period
    const firstDate = searchDates[0];
    const lastDate = format(addDays(new Date(searchDates[searchDates.length - 1]), 1), DATE_FORMAT); // Last night of stay
    const dateRangeCheckRestriction = Helper.generateDateRange(firstDate, lastDate);
    // check sellability for each date in the stay period
    for (const currentStayDate of dateRangeCheckRestriction) {
      const isFirstDay = currentStayDate === firstDate;
      const isLastDay = currentStayDate === lastDate;

      // ---------------------------------------------
      // RESTRICTIONS
      // ---------------------------------------------
      if (restrictionsRatePlanLevel?.length > 0) {
        const violating = this.checkViolatingRestrictions(
          currentStayDate,
          restrictionsRatePlanLevel,
          searchDates[0],
          lastDate,
          searchDates.length,
          isFirstDay,
          isLastDay
        );
        if (violating.length > 0) return false;
      }

      if (restrictionsRoomProductLevel?.length > 0) {
        const violating = this.checkViolatingRestrictions(
          currentStayDate,
          restrictionsRoomProductLevel,
          searchDates[0],
          lastDate,
          searchDates.length,
          isFirstDay,
          isLastDay
        );

        // 1. Closed To Stay → always hide
        if (violating.some((r) => r.code === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY)) {
          // this.logger.warn(
          //   `CTS violation for room product ${roomProductId} on date ${currentStayDate}`
          // );
          return false;
        }

        // 2. MinLOS → hide only if stay is shorter than minimum
        if (
          violating.some(
            (r) =>
              r.code === HotelRestrictionCodeEnum.RSTR_LOS_MIN &&
              searchDates.length < Number(r.value)
          )
        ) {
          // this.logger.warn(
          //   `MinLOS violation for room product ${roomProductId} on date ${currentStayDate}`
          // );
          return false;
        }

        // 3. MaxLOS → hide only if stay is longer than maximum
        if (
          violating.some(
            (r) =>
              r.code === HotelRestrictionCodeEnum.RSTR_LOS_MAX &&
              searchDates.length > Number(r.value)
          )
        ) {
          // this.logger.warn(
          //   `MaxLOS violation for room product ${roomProductId} on date ${currentStayDate}`
          // );
          return false;
        }
      }
    }

    return true;
  }

  private checkViolatingRestrictions(
    currentStayDate: string,
    restrictionList: Restriction[],
    checkInDate: string,
    checkOutDate: string,
    stayNights: number,
    isFirstDay: boolean,
    isLastDay: boolean
  ): ViolatedRestriction[] {
    const restrictions = [...restrictionList];

    if (isFirstDay) {
      // Check CTA and CTS for check-in day
      const arrivalViolations = this.iseRecommendationService.checkRestrictions(
        checkInDate,
        'arrival',
        stayNights,
        checkInDate,
        restrictions
      );
      if (arrivalViolations.length > 0) {
        return arrivalViolations;
      }
      const stayViolations = this.iseRecommendationService.checkRestrictions(
        currentStayDate,
        'stay',
        stayNights,
        checkInDate,
        restrictions
      );
      if (stayViolations.length > 0) {
        return stayViolations;
      }
    } else if (isLastDay) {
      // Check CTS for intermediate days and CTD for the last night
      const stayViolations = this.iseRecommendationService.checkRestrictions(
        checkOutDate,
        'departure',
        stayNights,
        checkInDate,
        restrictions,
        isLastDay
      );
      if (stayViolations.length > 0) {
        return stayViolations;
      }
      // Note: CTD is checked on checkout date, not the last night of stay
    } else {
      // Check CTS for intermediate days
      const stayViolations = this.iseRecommendationService.checkRestrictions(
        currentStayDate,
        'stay',
        stayNights,
        checkInDate,
        restrictions
      );
      if (stayViolations.length > 0) {
        return stayViolations;
      }
    }

    return [];
  }

  // =====================================================================
  // SMART RESTRICTION ANALYSIS - Multi-Level Restriction Checking
  // =====================================================================

  /**
   * Builds comprehensive restriction indexes for efficient lookup.
   * Combines HOUSE, ROOM_PRODUCT, and RATE_PLAN level restrictions.
   *
   * @returns Pre-computed restriction maps for O(1) lookups by date
   */
  private buildRestrictionIndexes(
    houseLevelRestrictions: Restriction[],
    ratePlanRestrictions: Restriction[],
    dates: string[],
    ratePlanIds: string[],
    roomProductIds: string[] = [],
    roomProductRestrictions: Restriction[] = []
  ): {
    houseLevelByDate: Map<string, Restriction[]>;
    ratePlanByDate: Map<string, Map<string, Restriction[]>>;
    roomProductByDate: Map<string, Map<string, Restriction[]>>;
  } {
    const houseLevelByDate = new Map<string, Restriction[]>();
    const ratePlanByDate = new Map<string, Map<string, Restriction[]>>();
    const roomProductByDate = new Map<string, Map<string, Restriction[]>>();

    const dateSet = new Set(dates);
    const ratePlanIdSet = new Set(ratePlanIds);
    const roomProductIdSet = new Set(roomProductIds);

    const addToNestedMap = (
      map: Map<string, Map<string, Restriction[]>>,
      date: string,
      id: string,
      restriction: Restriction
    ) => {
      let dateMap = map.get(date);
      if (!dateMap) {
        dateMap = new Map<string, Restriction[]>();
        map.set(date, dateMap);
      }

      let list = dateMap.get(id);
      if (!list) {
        list = [];
        dateMap.set(id, list);
      }

      list.push(restriction);
    };

    // -------- House level --------
    for (const r of houseLevelRestrictions) {
      if (!r.fromDate || !r.toDate) continue;

      for (const d of eachDayOfInterval({ start: r.fromDate, end: r.toDate })) {
        const date = format(d, DATE_FORMAT);
        if (!dateSet.has(date)) continue;

        if (!houseLevelByDate.has(date)) {
          houseLevelByDate.set(date, []);
        }
        houseLevelByDate.get(date)!.push(r);
      }
    }

    // -------- Rate plan level --------
    for (const r of ratePlanRestrictions) {
      if (!r.fromDate || !r.toDate || !r.ratePlanIds?.length) continue;

      for (const d of eachDayOfInterval({ start: r.fromDate, end: r.toDate })) {
        const date = format(d, DATE_FORMAT);
        if (!dateSet.has(date)) continue;

        for (const ratePlanId of r.ratePlanIds) {
          if (!ratePlanIdSet.has(ratePlanId)) continue;
          addToNestedMap(ratePlanByDate, date, ratePlanId, r);
        }
      }
    }

    // -------- Initialize empty ratePlan/date (optional but safer) --------
    for (const date of dates) {
      let dateMap = ratePlanByDate.get(date);
      if (!dateMap) {
        dateMap = new Map();
        ratePlanByDate.set(date, dateMap);
      }

      for (const ratePlanId of ratePlanIds) {
        if (!dateMap.has(ratePlanId)) {
          dateMap.set(ratePlanId, []);
        }
      }
    }

    // -------- Room product level --------
    for (const r of roomProductRestrictions) {
      if (!r.fromDate || !r.toDate || !r.roomProductIds?.length) continue;

      for (const d of eachDayOfInterval({ start: r.fromDate, end: r.toDate })) {
        const date = format(d, DATE_FORMAT);
        if (!dateSet.has(date)) continue;

        for (const roomProductId of r.roomProductIds) {
          if (!roomProductIdSet.has(roomProductId)) continue;
          addToNestedMap(roomProductByDate, date, roomProductId, r);
        }
      }
    }

    return {
      houseLevelByDate,
      ratePlanByDate,
      roomProductByDate
    };
  }

  /**
   * Analyzes a combined restriction and builds restriction details and status.
   *
   * @param combinedRestriction - The combined restriction to analyze
   * @param stayNights - Number of nights for the stay
   * @returns Object containing restriction details, blocking status, and booking status
   */
  private analyzeCombinedRestriction(
    combinedRestriction: RestrictionDetails,
    stayNights: number
  ): {
    restrictionDetails: RestrictionDetails;
    hasBlockingRestriction: boolean;
    status: DateBookingStatus;
  } {
    const restrictionDetails: RestrictionDetails = {};
    let hasBlockingRestriction = false;
    let status: DateBookingStatus = DateBookingStatus.BOOKABLE;

    // Check Min/Max Length of Stay
    if (combinedRestriction.minLength != null && combinedRestriction.minLength > 0) {
      restrictionDetails.minLength = combinedRestriction.minLength;
      if (stayNights < combinedRestriction.minLength) {
        hasBlockingRestriction = true;
        status = DateBookingStatus.MIN_LOS_VIOLATION;
      }
    }

    if (combinedRestriction.maxLength != null && combinedRestriction.maxLength > 0) {
      restrictionDetails.maxLength = combinedRestriction.maxLength;
      if (stayNights > combinedRestriction.maxLength) {
        hasBlockingRestriction = true;
        status = DateBookingStatus.RESTRICTED;
      }
    }

    // Check Min/Max Advance Booking
    if (combinedRestriction.minAdvance != null && combinedRestriction.minAdvance > 0) {
      restrictionDetails.minAdvance = combinedRestriction.minAdvance;
    }

    if (combinedRestriction.maxAdvance != null && combinedRestriction.maxAdvance > 0) {
      restrictionDetails.maxAdvance = combinedRestriction.maxAdvance;
    }

    if (combinedRestriction.minLosThrough != null && combinedRestriction.minLosThrough > 0) {
      restrictionDetails.minLosThrough = combinedRestriction.minLosThrough;
    }

    // If no min, max, adv -> check type
    if (
      combinedRestriction.minLength == null &&
      combinedRestriction.maxLength == null &&
      combinedRestriction.minAdvance == null &&
      combinedRestriction.maxAdvance == null &&
      combinedRestriction.minLosThrough == null
    ) {
      if (combinedRestriction.closedToStay) {
        hasBlockingRestriction = true;
        status = DateBookingStatus.NOT_SELLABLE;
        restrictionDetails.closedToStay = true;
      }
      if (combinedRestriction.closedToArrival) {
        hasBlockingRestriction = true;
        status = DateBookingStatus.RESTRICTED;
        restrictionDetails.closedToArrival = true;
      }
      if (combinedRestriction.closedToDeparture) {
        hasBlockingRestriction = true;
        status = DateBookingStatus.RESTRICTED;
        restrictionDetails.closedToDeparture = true;
      }
    }

    return { restrictionDetails, hasBlockingRestriction, status };
  }

  /**
   * Analyzes restrictions for a specific DATE by combining house-level and ALL rate plan restrictions.
   * Used for lowest price calendar where we care about date-level bookability.
   *
   * @param date - The date to analyze
   * @param restrictionIndexes - Contains houseLevelByDate and ratePlanByDateAndId maps
   * @param stayNights - Number of nights for the stay (default 1)
   * @param allDates - All dates in the range (for finding next bookable date)
   * @returns Restriction analysis with status
   */
  private analyzeRestrictionsForDateOnly(
    date: string,
    restrictionIndexes: {
      houseLevelByDate: Map<string, Restriction[]>;
      ratePlanByDate: Map<string, Map<string, Restriction[]>>;
      roomProductByDate: Map<string, Map<string, Restriction[]>>;
    },
    stayNights: number = 1,
    allDates: string[],
    roomProductRatePlanSellabilityMap: Map<string, boolean> = new Map()
  ): RestrictionAnalysisResult {
    const { houseLevelByDate, ratePlanByDate, roomProductByDate } = restrictionIndexes;

    // ---------- House level ----------
    const houseRestrictions = houseLevelByDate.get(date) ?? [];

    const ratePlanSellableIds: string[] = [];
    const allRatePlanRestrictions: Restriction[] = [];
    const allRoomProductRestrictions: Restriction[] = [];

    // ---------- Room product level ----------
    const roomProductMap = roomProductByDate.get(date);
    if (roomProductMap) {
      for (const restrictions of roomProductMap.values()) {
        allRoomProductRestrictions.push(...restrictions);
      }
    }

    // ---------- Rate plan level ----------
    const ratePlanMap = ratePlanByDate.get(date);
    if (ratePlanMap) {
      for (const [ratePlanId, restrictions] of ratePlanMap) {
        // ---- sellability check (LOGIC GIỮ NGUYÊN) ----
        let isSellable = false;

        // date-specific: date;roomProductId;ratePlanId
        for (const [key, sellable] of roomProductRatePlanSellabilityMap) {
          if (key.startsWith(`${date};`) && key.endsWith(`;${ratePlanId}`) && sellable) {
            isSellable = true;
            break;
          }
        }

        // date-agnostic: roomProductId;ratePlanId
        if (!isSellable) {
          for (const [key, sellable] of roomProductRatePlanSellabilityMap) {
            const parts = key.split(';');
            // Format: `${roomProductId};${ratePlanId}` (exactly 2 parts)
            if (parts.length === 2 && parts[1] === ratePlanId && sellable) {
              isSellable = true;
              break;
            }
          }
        }

        if (!isSellable) continue;

        allRatePlanRestrictions.push(...restrictions);
        ratePlanSellableIds.push(ratePlanId);
      }
    }

    // ---------- House restriction has highest priority ----------
    if (houseRestrictions.length > 0) {
      const combinedHouseRestriction = this.combineRestrictionGroup(houseRestrictions)?.result;

      if (!combinedHouseRestriction) {
        return {
          isBookable: true,
          status: DateBookingStatus.BOOKABLE
        };
      }

      const { restrictionDetails, hasBlockingRestriction, status } =
        this.analyzeCombinedRestriction(combinedHouseRestriction, stayNights);

      return {
        isBookable: !hasBlockingRestriction,
        status,
        restrictions: Object.keys(restrictionDetails).length ? restrictionDetails : undefined,
        appliedRestrictions: {
          houseLevel: houseRestrictions.map((r) => r.id)
        },
        normalized: []
      };
    }

    // ---------- No ratePlan restriction ----------
    const allRestrictions = [...allRatePlanRestrictions];
    if (allRestrictions.length === 0) {
      return {
        isBookable: true,
        status: DateBookingStatus.BOOKABLE
      };
    }

    // ---------- Combine logic (GIỮ NGUYÊN) ----------
    const combinedRestriction =
      allRoomProductRestrictions.length > 0
        ? this.combineRoomProductRestrictionGroup(
            allRoomProductRestrictions,
            allRatePlanRestrictions
          )
        : this.combineRestrictionGroup(allRestrictions, date)?.result;

    if (!combinedRestriction) {
      return {
        isBookable: true,
        status: DateBookingStatus.BOOKABLE
      };
    }

    const { restrictionDetails, hasBlockingRestriction, status } = this.analyzeCombinedRestriction(
      combinedRestriction,
      stayNights
    );

    const cleanArray = (arr: Record<string, any>[]) =>
      arr.map((item) =>
        Object.fromEntries(Object.entries(item).filter(([, v]) => v !== null && v !== false))
      );

    const { restrictionIdsViolateMinAdv, normalized } = this.combineRestrictionGroup(
      allRestrictions,
      date
    );

    return {
      isBookable: !hasBlockingRestriction,
      status,
      restrictions: Object.keys(restrictionDetails).length ? restrictionDetails : undefined,
      appliedRestrictions: {
        houseLevel: houseRestrictions.map((r) => r.id),
        ratePlanLevel: allRatePlanRestrictions.map((r) => r.id)
      },
      // normalized: cleanArray([...this.combineRestrictionGroup(allRestrictions, date)?.normalized]),
      // ratePlanSellableIds: ratePlanSellableIds
      normalized: cleanArray([...normalized]),
      ratePlanSellableIds: (ratePlanSellableIds || []).filter(
        (id) => !restrictionIdsViolateMinAdv.includes(id)
      )
    };
  }

  private hasRestrictionExceptions(restriction: Restriction): boolean {
    return [
      restriction.minLength,
      restriction.maxLength,
      restriction.minAdv,
      restriction.maxAdv,
      restriction.minLosThrough,
      restriction.maxReservationCount
    ].some((val) => val != null && val > 0);
  }

  private combineRestrictionGroup(
    restrictions: Restriction[],
    date?: string
  ): {
    result: RestrictionDetails | null;
    normalized: any;
    restrictionIdsViolateMinAdv: string[];
  } {
    const result: RestrictionDetails = {};

    if (!restrictions.length) {
      return {
        result: null,
        normalized: null,
        restrictionIdsViolateMinAdv: []
      };
    }

    const restrictionIdsViolateMinAdv = new Set<string>();

    const normalized = restrictions
      .map((r) => ({
        minLength: r.minLength ?? null,
        maxLength: r.maxLength ?? null,
        closedToArrival: this.hasRestrictionExceptions(r)
          ? false
          : r.type === RestrictionConditionType.ClosedToArrival,
        closedToDeparture: this.hasRestrictionExceptions(r)
          ? false
          : r.type === RestrictionConditionType.ClosedToDeparture,
        closedToStay: this.hasRestrictionExceptions(r)
          ? false
          : r.type === RestrictionConditionType.ClosedToStay,
        minAdvance: r.minAdv ?? null,
        maxAdvance: r.maxAdv ?? null,
        minLosThrough: r.minLosThrough ?? null,
        ratePlanId: r.ratePlanIds ?? null
      }))
      .filter((r) => {
        if (r.minAdvance != null && r.minAdvance > 0 && date) {
          const daysDiff = Math.floor(differenceInCalendarDays(new Date(date), new Date()));
          if (daysDiff < r.minAdvance) {
            for (const ratePlanId of r.ratePlanId) {
              restrictionIdsViolateMinAdv.add(ratePlanId);
            }
            return false;
          }
        }
        return true;
      });

    // ---------- helpers ----------
    const pickLeastRestrictedMin = (values: Array<number | null>) => {
      const defined = [...values].filter((v): v is number => v != null);
      const hasUnlimited = [...values].some((v) => v == null);
      // only apply for max los or max adv
      if (hasUnlimited) {
        return undefined;
      }
      return defined.length ? Math.max(...defined) : undefined;
    };

    const pickLeastRestrictedMax = (values: Array<number | null>) => {
      const defined = [...values].filter((v): v is number => v != null);
      return defined.length ? Math.min(...defined) : undefined;
    };

    // ---------- 1️⃣ CLOSE RESTRICTIONS ----------
    result.closedToArrival = normalized.some((r) => r.closedToArrival === true);
    result.closedToDeparture = normalized.some((r) => r.closedToDeparture === true);
    result.closedToStay = normalized.some((r) => r.closedToStay === true);

    const normalizedNoExceptions = [...normalized].filter(
      (r) =>
        r.closedToArrival === false && r.closedToDeparture === false && r.closedToStay === false
    );

    // ---------- 2️⃣ LENGTH OF STAY ----------
    result.minLength = pickLeastRestrictedMax(normalizedNoExceptions.map((r) => r.minLength));
    result.maxLength = pickLeastRestrictedMin(normalizedNoExceptions.map((r) => r.maxLength));

    // ---------- 3️⃣ ADVANCE BOOKING ----------
    result.minAdvance = pickLeastRestrictedMax(normalizedNoExceptions.map((r) => r.minAdvance));
    result.maxAdvance = pickLeastRestrictedMin(normalizedNoExceptions.map((r) => r.maxAdvance));

    // ---------- 4️⃣ MIN LOS THROUGH ----------
    result.minLosThrough = pickLeastRestrictedMax(
      normalizedNoExceptions.map((r) => r.minLosThrough)
    );

    return {
      result,
      normalized: normalized,
      restrictionIdsViolateMinAdv: Array.from(restrictionIdsViolateMinAdv)
    };
  }

  /**
   * Recursively finds bookable restrictions by checking values by score and less restrictive is better
   *
   * @param product - Product restriction with min/max values
   * @param salesPlans - Array of sales plan restrictions with min/max values
   * @param minProperty - Property name for min value (e.g., 'minLength', 'minAdvance', 'minLosThrough')
   * @param maxProperty - Property name for max value (e.g., 'maxLength', 'maxAdvance')
   * @returns Combined restriction with computed min and max values
   */
  private computeCombinedRestrictionRecursive<
    T extends { [key: string]: number | null | undefined }
  >(
    product: T,
    salesPlans: T[],
    minProperty: keyof T,
    maxProperty: keyof T
  ): { min: number | null; max: number | null } {
    // Helper function to calculate flexibility score for a restriction
    // Higher score = more flexible (less restrictive)
    const calculateFlexibilityScore = (
      minVal: number | null | undefined,
      maxVal: number | null | undefined
    ): number => {
      let score = 0;

      // Lower min is better (more flexible) - subtract value
      if (minVal !== null && minVal !== undefined) {
        score -= minVal * 1000;
      } else {
        score += 10000; // No minimum is most flexible
      }

      // Higher max is better (more flexible) - add value, null (unlimited) is best
      if (maxVal !== null && maxVal !== undefined) {
        score += maxVal * 1000;
      } else {
        score += 100000; // No maximum (unlimited) is most flexible
      }

      return score;
    };

    // Helper function to check if value is valid for product
    const isValidForProduct = (x: number): boolean => {
      const productMin = product[minProperty];
      const productMax = product[maxProperty];
      const productMinNum = typeof productMin === 'number' ? productMin : null;
      const productMaxNum = typeof productMax === 'number' ? productMax : null;
      return (
        (productMinNum == null || x >= productMinNum) &&
        (productMaxNum == null || x <= productMaxNum)
      );
    };

    // Helper function to check if value is valid for at least one sales plan
    const isValidForAnySalesPlan = (x: number): boolean => {
      return salesPlans.some((sp) => {
        const spMin = sp[minProperty];
        const spMax = sp[maxProperty];
        const spMinNum = typeof spMin === 'number' ? spMin : null;
        const spMaxNum = typeof spMax === 'number' ? spMax : null;
        return (spMinNum == null || x >= spMinNum) && (spMaxNum == null || x <= spMaxNum);
      });
    };

    // Check if any restriction has unlimited max (null)
    const productMaxValue = product[maxProperty];
    const hasUnlimitedMax =
      productMaxValue === null ||
      productMaxValue === undefined ||
      salesPlans.some((sp) => {
        const spMax = sp[maxProperty];
        return spMax === null || spMax === undefined;
      });

    // Build candidate arrays from all restrictions
    const minCandidates: number[] = [];
    const productMinValue = product[minProperty];
    if (productMinValue != null && typeof productMinValue === 'number') {
      minCandidates.push(productMinValue);
    }
    salesPlans.forEach((sp) => {
      const spMinValue = sp[minProperty];
      if (spMinValue != null && typeof spMinValue === 'number') {
        minCandidates.push(spMinValue);
      }
    });

    const maxCandidates: number[] = [];
    if (productMaxValue != null && typeof productMaxValue === 'number') {
      maxCandidates.push(productMaxValue);
    }
    salesPlans.forEach((sp) => {
      const spMaxValue = sp[maxProperty];
      if (spMaxValue != null && typeof spMaxValue === 'number') {
        maxCandidates.push(spMaxValue);
      }
    });

    // Determine search range for min: lowest min value
    const searchMin = minCandidates.length > 0 ? Math.min(...minCandidates) : 0;
    // For max: if we have candidates, use highest; otherwise use a reasonable upper bound
    // If hasUnlimitedMax is true, we need a higher bound to find valid values
    // Use the maximum of: maxCandidates OR the highest min candidate (to ensure we can find values >= product min)
    let searchMax: number;
    if (hasUnlimitedMax) {
      // When unlimited max exists, use a higher bound to allow finding valid min values
      // Use max of finite max candidates and highest min candidate, or default to 1000
      const maxFromCandidates = maxCandidates.length > 0 ? Math.max(...maxCandidates) : 0;
      const maxFromMinCandidates = minCandidates.length > 0 ? Math.max(...minCandidates) : 0;
      searchMax = Math.max(maxFromCandidates, maxFromMinCandidates, 1000);
    } else {
      searchMax = maxCandidates.length > 0 ? Math.max(...maxCandidates) : 1000;
    }

    // Find combined min: apply "less restrictive" rule
    // Rule: Find the LOWEST valid min value that satisfies both product and at least one sales plan
    // Lower min = more flexible = more bookable (less restrictive)
    // Start from smallest min candidate and check upward until we find a valid value
    let combinedMin: number | null = null;
    for (let x = searchMin; x <= searchMax; x++) {
      if (isValidForProduct(x) && isValidForAnySalesPlan(x)) {
        combinedMin = x;
        break;
      }
    }

    // Find combined max: apply "less restrictive" rule
    // Rule: If ANY restriction (product or rate plan) has unlimited max (null),
    //       then the combined max should be unlimited (null) - this is the most bookable option
    let combinedMax: number | null = null;

    if (hasUnlimitedMax) {
      // At least one restriction allows unlimited max → combined max is unlimited (most flexible)
      combinedMax = null;
    } else {
      // All restrictions have finite max values → find the highest valid max
      // This finds the highest (most flexible) valid maximum that satisfies both
      // product and at least one sales plan
      for (let x = searchMax; x >= searchMin; x--) {
        if (isValidForProduct(x) && isValidForAnySalesPlan(x)) {
          combinedMax = x;
          break;
        }
      }
    }

    return { min: combinedMin, max: combinedMax };
  }

  /**
   * Computes combined LOS (Length of Stay) restrictions recursively.
   * Finds the smallest minLOS and largest maxLOS that are valid for both product and at least one sales plan.
   * @param product - Product with minLOS and maxLOS properties
   * @param salesPlans - Array of sales plans with minLOS and maxLOS properties
   * @returns Combined LOS restrictions
   */
  private computeCombinedLOS(
    product: { minLOS?: number | null; maxLOS?: number | null },
    salesPlans: Array<{ minLOS?: number | null; maxLOS?: number | null }>
  ): RestrictionDetails {
    const restrictionDetails: RestrictionDetails = {};
    const result = this.computeCombinedRestrictionRecursive(
      product,
      salesPlans,
      'minLOS',
      'maxLOS'
    );

    restrictionDetails.minLength = result.min != null ? result.min : undefined;
    restrictionDetails.maxLength = result.max != null ? result.max : undefined;

    return restrictionDetails;
  }

  private combineRoomProductRestrictionGroup(
    productRestrictions: Restriction[],
    ratePlanRestrictions: Restriction[]
  ) {
    const minLOSProduct = productRestrictions
      .filter((r) => r.minLength !== null && r.minLength !== undefined)
      .map((r) => Number(r.minLength))
      .filter((v) => !Number.isNaN(v));

    const minLosRoomProduct = minLOSProduct.length > 0 ? Math.min(...minLOSProduct) : 0;

    const maxLOSProduct = productRestrictions
      .filter((r) => r.maxLength !== null && r.maxLength !== undefined)
      .map((r) => Number(r.maxLength))
      .filter((v) => !Number.isNaN(v));

    const maxLosRoomProduct = maxLOSProduct.length > 0 ? Math.max(...maxLOSProduct) : 0;

    const productRestriction: { minLOS?: number | null; maxLOS?: number | null } = {
      minLOS: minLosRoomProduct || null,
      maxLOS: maxLosRoomProduct || null
    };

    const ratePlanRestriction: { minLOS?: number | null; maxLOS?: number | null }[] =
      (ratePlanRestrictions || []).map((r) => ({
        minLOS: r.minLength ?? null,
        maxLOS: r.maxLength ?? null
      })) || [];

    // Handle CTA/CTD restrictions that have no LOS values (no exceptions)
    // Check if rate plan restrictions have CTA/CTD types but no exceptions
    const ratePlanRestrictionsWithExceptions = [...ratePlanRestriction].filter((item) => {
      const hasMin = item.minLOS !== null && item.minLOS !== undefined;
      const hasMax = item.maxLOS !== null && item.maxLOS !== undefined;

      return hasMin !== hasMax; // true only when exactly one is present
    });

    if (ratePlanRestrictionsWithExceptions.length > 0) {
      // if no CTA/CTD restrictions with no exceptions, return combined LOS restrictions
      return this.computeCombinedLOS(productRestriction, ratePlanRestriction);
    }

    const restrictionDetails: RestrictionDetails = {};

    // If there are rate plan restrictions with CTA/CTD types but no exceptions, preserve them
    if (ratePlanRestrictions.length > 0) {
      ratePlanRestrictions.forEach((r) => {
        switch (r.type) {
          case RestrictionConditionType.ClosedToStay:
            restrictionDetails.closedToStay = true;
            break;
          case RestrictionConditionType.ClosedToDeparture:
            restrictionDetails.closedToDeparture = true;
            break;
          case RestrictionConditionType.ClosedToArrival:
            restrictionDetails.closedToArrival = true;
            break;
          default:
            break;
        }
      });
    }

    return restrictionDetails;
  }

  /**
   * Fetches all restriction levels for a hotel in parallel.
   * Returns house, room product, and rate plan level restrictions.
   */
  private async fetchAllRestrictionLevels(
    hotelId: string,
    fromDate: string,
    toDate: string,
    roomProductIds: string[] = [],
    ratePlanPromoIdList: string[] = []
  ): Promise<{
    houseLevelRestrictions: Restriction[];
    ratePlanRestrictions: Restriction[];
    roomProductRestrictions: Restriction[];
  }> {
    let [houseLevelRestrictions, ratePlanRestrictions, roomProductRestrictions] = await Promise.all(
      [
        // House level restrictions (apply to entire hotel)
        this.iseRecommendationService.getRestrictions(
          hotelId,
          fromDate,
          toDate,
          RestrictionLevel.HOUSE_LEVEL
        ),
        // Rate plan level restrictions
        this.iseRecommendationService.getRestrictions(
          hotelId,
          fromDate,
          toDate,
          RestrictionLevel.RATE_PLAN
        ),
        // Room product level restrictions
        roomProductIds?.length > 0
          ? this.iseRecommendationService.getRestrictions(
              hotelId,
              fromDate,
              toDate,
              RestrictionLevel.ROOM_PRODUCT,
              roomProductIds
            )
          : Promise.resolve([])
      ]
    );

    if (ratePlanPromoIdList?.length) {
      ratePlanRestrictions = ratePlanRestrictions.filter((r) =>
        ratePlanPromoIdList?.length > 0 ? r.ratePlanIds.includes(ratePlanPromoIdList[0]) : true
      );
    }

    return {
      houseLevelRestrictions,
      ratePlanRestrictions,
      roomProductRestrictions
    };
  }

  // =====================================================================
  // END SMART RESTRICTION ANALYSIS
  // =====================================================================

  /**
   * Builds the available room product list with pricing and capacity data
   * @private
   */
  private buildAvailableRoomProductList(
    roomProductsWithCapacity: RoomProduct[],
    roomProductRatePlanPricingAvailable: RoomProductRatePlan[],
    processedPricingData: any[],
    guestCounts: {
      totalAdults: number;
      totalChildren: number;
      totalPets: number;
      childrenAgeList: number[];
    },
    isIsePricingDisplay: IsePricingDisplayModeEnum,
    restrictionsRoomProductLevel: Restriction[],
    featureRequestList: DirectFeatureItem[],
    hotelRetailFeatures: HotelRetailFeature[],
    fromDate: string,
    toDate: string,
    translateTo: string
  ): any[] {
    // Create pricing map for quick lookup
    const processedPricingMap = new Map<string, any>();
    processedPricingData.forEach((pricing) => {
      const key = `${pricing.roomProductId}_${pricing.ratePlanId}`;
      processedPricingMap.set(key, pricing);
    });

    return roomProductsWithCapacity.map((roomProduct) => {
      // Get rate plans for this room product
      const roomProductRatePlansForProduct = roomProductRatePlanPricingAvailable.filter(
        (rp) => rp.roomProductId === roomProduct.id
      );

      // Build rate plan list for this room product
      const rfcRatePlanList = this.buildRatePlanList(
        roomProductRatePlansForProduct,
        processedPricingMap,
        isIsePricingDisplay,
        translateTo
      );

      // Sort rate plans by price (lowest to highest)
      const sortedRfcRatePlanList = [...rfcRatePlanList].sort(
        (a, b) => (a?.totalGrossAmount || 0) - (b?.totalGrossAmount || 0)
      );

      // Calculate guest allocations
      const guestAllocations = this.calculateGuestAllocations(roomProduct, guestCounts);

      return {
        ...roomProduct,
        rfcRatePlanList: [...sortedRfcRatePlanList],
        ...guestAllocations,
        numberOfBedrooms: Number(roomProduct.numberOfBedrooms || 1),
        matchingPercentage: 100, // TODO: Calculate actual matching percentage
        isSpaceTypeSearchMatched: true, // TODO: Calculate actual space type matching
        rfcImageList: this.buildImageList(roomProduct.roomProductImages),
        mostPopularFeatureList: [], // TODO: Add most popular feature list
        retailFeatureList: this.buildRetailFeatureList(
          hotelRetailFeatures,
          roomProduct.roomProductRetailFeatures,
          featureRequestList,
          translateTo
        ),
        additionalFeatureList: [], // TODO: Add additional feature list
        layoutFeatureList: [], // TODO: Add layout feature list
        standardFeatureList: this.buildStandardFeatureList(roomProduct.roomProductStandardFeatures),
        travelTagList: [], // TODO: Add travel tag list
        occasionList: [], // TODO: Add occasion list,
        restrictionValidationList: this.buildRestrictionValidationList(
          restrictionsRoomProductLevel,
          roomProduct.id,
          fromDate,
          toDate
        )
      };
    });
  }

  /**
   * Builds the rate plan list for a room product
   * @private
   */
  private buildRatePlanList(
    roomProductRatePlans: RoomProductRatePlan[],
    processedPricingMap: Map<string, any>,
    isIsePricingDisplay: IsePricingDisplayModeEnum,
    translateTo: string
  ): AvailableRoomProductRatePlanListDto[] {
    return roomProductRatePlans
      .map((roomProductRatePlan) => {
        const key = `${roomProductRatePlan.roomProductId}_${roomProductRatePlan.ratePlanId}`;
        const processedPricing = processedPricingMap.get(key);

        if (!processedPricing) {
          return null;
        }

        // Extract pricing information
        const totalGrossAmount = Number(processedPricing.totalGrossPrice) || 0;
        const totalBaseAmount = Number(processedPricing.totalNetPrice) || 0;
        const ratePlanAverageDailyRate = Number(processedPricing.averageDailyRate) || 0;
        const totalGrossAmountBeforeAdjustment =
          Number(processedPricing.totalGrossPriceBeforeAdjustment) || 0;
        const totalBaseAmountBeforeAdjustment =
          Number(processedPricing.totalNetPriceBeforeAdjustment) || 0;

        // Calculate adjustment percentage
        const adjustmentPercentage = this.calculateAdjustmentPercentage(
          isIsePricingDisplay,
          totalBaseAmount,
          totalBaseAmountBeforeAdjustment,
          totalGrossAmount,
          totalGrossAmountBeforeAdjustment
        );

        let ratePlanName = roomProductRatePlan.ratePlan.name;
        let ratePlanDescription = roomProductRatePlan.ratePlan.description;
        if (translateTo) {
          const translation = roomProductRatePlan.ratePlan.translations?.find(
            (t) => t.languageCode === translateTo
          );
          ratePlanName = translation?.name || roomProductRatePlan.ratePlan.name;
          ratePlanDescription =
            translation?.description || roomProductRatePlan.ratePlan.description;
        }

        return {
          id: roomProductRatePlan.id,
          roomProductId: roomProductRatePlan.roomProductId,
          roomProductCode: roomProductRatePlan.roomProduct?.code || '',
          name: roomProductRatePlan.name,
          code: roomProductRatePlan.code,
          averageDailyRate: ratePlanAverageDailyRate,
          totalSellingRate: totalGrossAmount,
          totalGrossAmount,
          totalBaseAmount,
          ratePlan: {
            id: roomProductRatePlan.ratePlan.id,
            code: roomProductRatePlan.ratePlan.code,
            name: ratePlanName,
            description: ratePlanDescription,
            IsPromoted: roomProductRatePlan.ratePlan.type !== RatePlanTypeEnum.PUBLIC,
            // hotelPaymentTerm: {
            //   name: '', // TODO: Add payment term name
            //   code: '', // TODO: Add payment term code
            //   description: '' // TODO: Add payment term description
            // },
            // hotelCancellationPolicy: {
            //   name: '', // TODO: Add cancellation policy name
            //   description: '' // TODO: Add cancellation policy description
            // },
            includedHotelExtrasList: this.buildIncludedExtrasList(
              processedPricing.extraServiceDetails,
              translateTo
            ),
            mandatoryHotelExtrasList: this.buildIncludedExtrasList(
              processedPricing.extraServiceMandatoryDetails,
              translateTo
            )
          },
          totalCityTaxAmount: processedPricing.totalCityTaxAmount,
          totalBaseAmountBeforeAdjustment,
          totalGrossAmountBeforeAdjustment,
          adjustmentPercentage,
          shouldShowStrikeThrough: adjustmentPercentage < 0,
          restrictionValidationList: []
        };
      })
      .filter(Boolean) as AvailableRoomProductRatePlanListDto[];
  }

  private buildRestrictionValidationList(
    restrictionsRoomProductLevel: Restriction[],
    roomProductId: string,
    fromDate: string,
    toDate: string
  ) {
    const checkOutDate = format(addDays(new Date(toDate), 1), DATE_FORMAT); // Last night of stay
    const searchDates = Helper.generateDateRange(fromDate, toDate);
    const dateRangeCheckRestriction = Helper.generateDateRange(fromDate, checkOutDate);

    const roomProductRestrictions = restrictionsRoomProductLevel.filter((r) =>
      r.roomProductIds?.includes(roomProductId)
    );

    for (const currentStayDate of dateRangeCheckRestriction) {
      const isFirstDay = currentStayDate === dateRangeCheckRestriction[0];
      const isLastDay =
        currentStayDate === dateRangeCheckRestriction[dateRangeCheckRestriction.length - 1];
      const violatingRestrictions = this.checkViolatingRestrictions(
        currentStayDate,
        roomProductRestrictions,
        fromDate,
        checkOutDate,
        searchDates.length,
        isFirstDay,
        isLastDay
      );
      if (violatingRestrictions.length > 0) {
        return violatingRestrictions;
      }
    }
    return [];
  }

  /**
   * Calculates guest allocations based on room capacity and requested guests
   * @private
   */
  private calculateGuestAllocations(
    roomProduct: RoomProduct,
    guestCounts: { totalAdults: number; totalChildren: number; totalPets: number } // requested capacity
  ) {
    const { totalAdults, totalChildren, totalPets } = guestCounts;
    const reqAdults = totalAdults;
    const reqChildren = totalChildren;
    const reqPets = totalPets;

    // Retrieve capacity limits from the room
    const maxDefCap = roomProduct.maximumAdult + roomProduct.maximumKid;
    const maxExtCap = roomProduct.extraBedAdult + roomProduct.extraBedKid;

    const defAdultsCap = roomProduct.maximumAdult;
    const defChildrenCap = roomProduct.maximumKid;
    const defPetsCap = roomProduct.maximumPet;

    const extAdultsCap = roomProduct.extraBedAdult || 0;
    const extChildrenCap = roomProduct.extraBedKid || 0;

    // Initialize variables to track the best allocation
    let bestScore = [-1, -1, -1]; // [da + dc, da, dc]
    let bestCombination = [0, 0, 0, 0]; // [da, dc, la, lc]

    const isBetterScore = (a: number[], b: number[]): boolean => {
      for (let i = 0; i < a.length; i++) {
        if (a[i] > b[i]) return true;
        if (a[i] < b[i]) return false;
      }
      return false;
    };

    // Exhaustive search for the best allocation combination
    for (let da = 0; da <= reqAdults; da++) {
      for (let dc = 0; dc <= reqChildren; dc++) {
        // Check if this allocation is valid for default capacity
        if (da <= defAdultsCap && dc <= defChildrenCap && da + dc <= maxDefCap) {
          // Calculate remaining adults and children for extra capacity
          const la = reqAdults - da;
          const lc = reqChildren - dc;

          // Check if extra capacity allocation is also valid
          if (la <= extAdultsCap && lc <= extChildrenCap && la + lc <= maxExtCap) {
            // Compute score using array comparison for priority order
            const score = [da + dc, da, dc];

            // Compare scores (lexicographic order)
            if (isBetterScore(score, bestScore)) {
              bestScore = score;
              bestCombination = [da, dc, la, lc];
            }
          }
        }
      }
    }

    // Allocate pets: as many as possible go to default capacity
    const allocatedDefPets = Math.min(reqPets, defPetsCap);
    const allocatedExtraPets = reqPets - allocatedDefPets;

    return {
      allocatedAdultCount: bestCombination[0],
      allocatedChildCount: bestCombination[1],
      allocatedExtraBedAdultCount: bestCombination[2],
      allocatedExtraBedChildCount: bestCombination[3],
      allocatedPetCount: allocatedDefPets
    };

    // return {
    //   allocatedAdultCount,
    //   allocatedChildCount,
    //   allocatedPetCount,
    //   allocatedExtraBedAdultCount,
    //   allocatedExtraBedChildCount
    // };
  }

  /**
   * Calculates adjustment percentage for pricing
   * @private
   */
  private calculateAdjustmentPercentage(
    isIsePricingDisplay: IsePricingDisplayModeEnum,
    totalBaseAmount: number,
    totalBaseAmountBeforeAdjustment: number,
    totalGrossAmount: number,
    totalGrossAmountBeforeAdjustment: number
  ): number {
    if (totalBaseAmountBeforeAdjustment === 0) {
      return 0;
    }

    const adjustmentPercentage = RoomRequestUtils.calculateAdjustmentPercentage(
      isIsePricingDisplay,
      totalBaseAmount,
      totalBaseAmountBeforeAdjustment,
      totalGrossAmount,
      totalGrossAmountBeforeAdjustment
    );

    return Math.round(adjustmentPercentage);
  }

  /**
   * Builds image list from room product images
   * @private
   */
  private buildImageList(roomProductImages?: RoomProductImage[]) {
    return roomProductImages?.map((img) => ({ imageUrl: img.imageUrl })) || [];
  }

  /**
   * Builds and sorts retail feature list
   * @private
   */
  private buildRetailFeatureList(
    hotelRetailFeatures: HotelRetailFeature[],
    roomProductRetailFeatures?: RoomProductRetailFeature[],
    featureRequestList?: DirectFeatureItem[],
    translateTo?: string
  ) {
    if (!roomProductRetailFeatures?.length) return [];

    // Define sorting priority
    const sortOrder = [
      'retailFeature.hotelRetailCategory.displaySequence',
      'retailFeature.baseWeight',
      'retailFeature.name'
    ];

    // Helper to get nested value from string path
    const getValue = (obj: any, path: string) =>
      path.split('.').reduce((value, key) => value?.[key], obj);

    const featureRequestCodes = featureRequestList?.map((fr) => fr.code) || [];
    // Sort features
    const sortedFeatures =
      featureRequestCodes && featureRequestCodes.length > 0
        ? [...roomProductRetailFeatures].filter((feature) =>
            featureRequestCodes.includes(feature.retailFeature.code)
          )
        : [...roomProductRetailFeatures].sort((a, b) => {
            for (const key of sortOrder) {
              const aValue = getValue(a, key);
              const bValue = getValue(b, key);

              if (aValue !== bValue) {
                // Handle string vs number
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                  return aValue.localeCompare(bValue);
                }
                return (aValue ?? 0) - (bValue ?? 0);
              }
            }
            return 0;
          });

    const sortedFeatureCodes = sortedFeatures.map((feature) => feature.retailFeature.code);
    const requestRetailFeatures = hotelRetailFeatures.filter(
      (feature) =>
        featureRequestCodes.includes(feature.code) && !sortedFeatureCodes.includes(feature.code)
    );

    const requestRetailFeaturesDto = requestRetailFeatures.map((feature) => {
      const retailFeatureTranslation = feature.translations?.find(
        (t) => t.languageCode?.toLowerCase() === translateTo?.toLowerCase()
      );
      return {
        name: retailFeatureTranslation?.name ?? feature.name,
        code: feature.code,
        matched: 0,
        quantity: 0,
        description: retailFeatureTranslation?.description ?? feature.description,
        iconImageUrl: feature.imageUrl,
        popularity: feature.baseWeight,
        hotelRetailCategory: {
          code: feature.hotelRetailCategory.code,
          name: feature.hotelRetailCategory.name,
          sequence: feature.hotelRetailCategory.displaySequence
        },
        measurementUnit: retailFeatureTranslation?.measurementUnit ?? feature.measurementUnit
      };
    });

    // Map sorted data to retail feature DTO
    const sortedFeaturesDto = sortedFeatures.map((feature) => {
      const retailFeatureTranslation = feature.retailFeature.translations?.find(
        (t) => t.languageCode === translateTo
      );

      return {
        name: retailFeatureTranslation?.name ?? feature.retailFeature.name,
        code: feature.retailFeature.code,
        matched:
          featureRequestCodes && featureRequestCodes.length > 0
            ? featureRequestCodes.includes(feature.retailFeature.code)
            : 1,
        quantity: feature.quantity,
        description: retailFeatureTranslation?.description ?? feature.retailFeature.description,
        iconImageUrl: feature.retailFeature.imageUrl,
        popularity: feature.retailFeature.baseWeight,
        hotelRetailCategory: {
          code: feature.retailFeature.hotelRetailCategory.code,
          name: feature.retailFeature.hotelRetailCategory.name,
          sequence: feature.retailFeature.hotelRetailCategory.displaySequence
        },
        measurementUnit:
          retailFeatureTranslation?.measurementUnit ?? feature.retailFeature.measurementUnit
      };
    });

    return [...requestRetailFeaturesDto, ...sortedFeaturesDto];
  }

  /**
   * Builds standard feature list
   * @private
   */
  private buildStandardFeatureList(roomProductStandardFeatures?: RoomProductStandardFeature[]) {
    return (
      roomProductStandardFeatures?.map((feature) => ({
        name: feature.standardFeature.name,
        code: feature.standardFeature.code,
        description: feature.standardFeature.description,
        iconImageUrl: feature.standardFeature.imageUrl
      })) || []
    );
  }

  /**
   * Builds included extras list from service details
   * @private
   */
  private buildIncludedExtrasList(extraServiceDetails?: HotelAmenity[], translateTo?: string) {
    return (
      extraServiceDetails?.map((service) => {
        let name = service.name;
        let description = service.description;
        if (translateTo) {
          const translation = service.translations?.find((t) => t.languageCode === translateTo);
          name = translation?.name || service.name;
          description = translation?.description || service.description;
        }

        return {
          id: service.id,
          code: service.code,
          name: name,
          description: description,
          pricingUnit: service.pricingUnit,
          includedDates: service.includedDates || []
        };
      }) || []
    );
  }

  /**
   * Handles match flow processing for feature-based room recommendations
   * @private
   */
  private async handleMatchFlow(
    availableRfcList: any[],
    inputDirect: DirectFlowInput,
    hotel: Hotel,
    fromDate: string,
    toDate: string,
    childrenAgeList: number[],
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    hotelAmenityMap: { byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> },
    hotelRetailFeaturesMap: Map<string, HotelRetailFeature>
  ) {
    // Pre-filter availableRfcList by allowed MATCH types before passing to AI
    let filteredAvailableRfcList = availableRfcList;
    if (inputDirect.salesStrategy.match) {
      const allowedTypes = inputDirect.salesStrategy.match as RoomProductType[];
      if (allowedTypes !== undefined && allowedTypes.length > 0) {
        filteredAvailableRfcList = availableRfcList.filter((roomProduct) =>
          allowedTypes.includes(roomProduct.type)
        );
        this.logger.debug(
          `🔍 MATCH Flow Pre-filter: ${availableRfcList.length} → ${filteredAvailableRfcList.length} products (allowed types: ${allowedTypes.join(', ')})`
        );
      } else if (allowedTypes !== undefined && allowedTypes.length === 0) {
        // No types allowed for MATCH flow
        this.logger.warn('⚠️ MATCH Flow: No room product types allowed by config');
        return [];
      }
    }

    const aiMatchFlowResponse = await this.buildInputForMatchFlow(
      filteredAvailableRfcList,
      inputDirect
    );
    const matchRoomProducts: any[] = [];

    if (aiMatchFlowResponse && aiMatchFlowResponse.length > 0) {
      // Process AI match flow response - each item represents a combination
      aiMatchFlowResponse.forEach((response: any, index: number) => {
        const { recommendationList, averageMatchingScore, isMatched } = response;

        if (!recommendationList || recommendationList.length === 0) {
          return;
        }

        // Process all rooms in this combination
        const roomProducts: any[] = [];
        const combinationDetails: any[] = [];
        const allMatchFeatures = new Set<string>();
        const allNotMatchFeatures = new Set<string>();

        // Check if this combination has any room with zero allocation
        let hasInvalidAllocation = false;

        recommendationList.forEach((recommendation: any) => {
          const {
            code,
            matchingScore,
            matchFeatureList,
            notMatchFeatureList,
            allocatedCapacityDefault,
            allocatedCapacityExtra
          } = recommendation;

          // Check if this room has zero allocation (invalid)
          const totalAllocated =
            (allocatedCapacityDefault?.adults || 0) +
            (allocatedCapacityDefault?.children || 0) +
            (allocatedCapacityDefault?.pets || 0) +
            (allocatedCapacityExtra?.adults || 0) +
            (allocatedCapacityExtra?.children || 0) +
            (allocatedCapacityExtra?.pets || 0);

          if (totalAllocated === 0) {
            this.logger.warn(
              `Skipping combination with room ${code} - no guests allocated (invalid capacity allocation)`
            );
            hasInvalidAllocation = true;
            return;
          }

          const roomProduct = filteredAvailableRfcList.find((r) => r.code === code);

          // Note: Products are already pre-filtered by allowed types, so this check is redundant
          // but kept as a safety check in case of any edge cases
          if (!roomProduct) {
            this.logger.warn(
              `Room product ${code} not found in filtered list - this should not happen`
            );
            return;
          }

          if (roomProduct) {
            const notMatchFeatures = notMatchFeatureList
              ?.map((code: string) => hotelRetailFeaturesMap.get(code))
              ?.filter((feature: any) => !!feature);
            // Process match features
            const processedMatch = this.processMatchFlowRecommendation(
              roomProduct,
              matchingScore,
              matchFeatureList || [],
              notMatchFeatures || [],
              allocatedCapacityDefault,
              allocatedCapacityExtra
            );

            roomProducts.push(processedMatch.roomProduct);
            combinationDetails.push(recommendation);

            // Collect all match features
            if (matchFeatureList) {
              matchFeatureList.forEach((feature: string) => allMatchFeatures.add(feature));
            }
            if (notMatchFeatureList) {
              notMatchFeatureList.forEach((feature: string) => allNotMatchFeatures.add(feature));
            }
          }
        });

        // Skip this combination if it has invalid allocation
        if (hasInvalidAllocation) {
          return;
        }

        if (roomProducts.length === 0) {
          return;
        }

        // Sort room products by price
        const sortedRoomProducts = roomProducts.sort((a, b) => {
          const aLowestPrice = a?.rfcRatePlanList?.[0]?.totalSellingRate || Infinity;
          const bLowestPrice = b?.rfcRatePlanList?.[0]?.totalSellingRate || Infinity;
          return aLowestPrice - bLowestPrice;
        });

        // Get unique room codes for rate plan aggregation
        const uniqueCodes = [...new Set(roomProducts.map((rp) => rp.code))];

        // Get and sort all rate plans for this combination
        const allRatePlans = this.aggregateByCode(
          filteredAvailableRfcList
            .filter((r) => uniqueCodes.includes(r.code))
            .flatMap((r) => r.rfcRatePlanList || [])
        );

        const sortedRatePlans = allRatePlans.sort((a, b) => {
          const aPrice = a?.totalSellingRate || Infinity;
          const bPrice = b?.totalSellingRate || Infinity;
          return aPrice - bPrice;
        });

        // Create match combination
        matchRoomProducts.push({
          label: BookingFlow.MATCH,
          matchingScore: averageMatchingScore,
          isMatched,
          matchFeatureList: Array.from(allMatchFeatures),
          notMatchFeatureList: Array.from(allNotMatchFeatures),
          availableRfcList: sortedRoomProducts,
          availableRfcRatePlanList: sortedRatePlans,
          recommendationDetails: combinationDetails,
          restrictionValidationList: []
        });
      });

      // Sort by matching score (highest first)
      matchRoomProducts.sort((a, b) => (b.matchingScore || 0) - (a.matchingScore || 0));
    }

    const matchRoomProductsWithSurcharges = await this.processAllSurcharges(
      matchRoomProducts,
      hotel,
      fromDate,
      toDate,
      childrenAgeList,
      hotelConfigRoundingMode,
      hotelAmenityMap
    );

    return this.processImageUrls(matchRoomProductsWithSurcharges);
  }

  /**
   * Handles direct flow processing for standard room recommendations
   * @private
   */
  private async handleDirectFlow(
    roomProductsWithCapacity: RoomProduct[],
    availableRfcList: any[],
    allLowestPriceRoomProductType: Map<RoomProductType, boolean>,
    samePeriodReservationCount: any,
    inputDirect: DirectFlowInput,
    totalAdults: number,
    totalChildren: number,
    totalPets: number,
    hotel?: Hotel,
    fromDate?: string,
    toDate?: string,
    childrenAgeList?: number[],
    hotelConfigRoundingMode?: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    hotelAmenitiesMap?: { byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> },
    ratePlanPromoIdList?: string[],
    isRatePlanContract?: boolean
  ) {
    const hasRatePlanPromoId =
      ratePlanPromoIdList !== undefined &&
      ratePlanPromoIdList !== null &&
      ratePlanPromoIdList.length > 0;

    // Get lowest price product and create lowest price recommendation
    const lowestPriceData = this.createLowestPriceRecommendation(
      availableRfcList,
      hasRatePlanPromoId
        ? new Map<RoomProductType, boolean>([
            [RoomProductType.MRFC, true],
            [RoomProductType.ERFC, true],
            [RoomProductType.RFC, true]
          ])
        : allLowestPriceRoomProductType,
      totalAdults,
      totalChildren,
      totalPets,
      hasRatePlanPromoId
    );

    // Get AI recommendations for direct flow
    const aiDirectFlowResponse = await this.buildInputForAiRecommendation(
      roomProductsWithCapacity,
      availableRfcList,
      lowestPriceData.lowestPriceRoomProduct,
      samePeriodReservationCount,
      inputDirect,
      lowestPriceData.price ?? 0
    );

    // Process different recommendation types
    // Fix: stayOptionRecommendationList is already an array, not an object to flatten
    const recommendationItems: BookingFlowResponse[] =
      aiDirectFlowResponse.stayOptionRecommendationList || [];

    const mostPopularRoomProducts = this.extractRecommendationsByType(
      recommendationItems,
      'mostPopular',
      !hasRatePlanPromoId ? BookingFlow.MOST_POPULAR : BookingFlow.DIRECT,
      availableRfcList,
      hasRatePlanPromoId
        ? [RoomProductType.MRFC, RoomProductType.ERFC, RoomProductType.RFC]
        : (inputDirect.salesStrategy.mostPopular as RoomProductType[])
    );

    const ourTipRoomProducts = this.extractRecommendationsByType(
      recommendationItems,
      'ourTip',
      !hasRatePlanPromoId ? BookingFlow.RECOMMENDED : BookingFlow.DIRECT,
      availableRfcList,
      hasRatePlanPromoId
        ? [RoomProductType.MRFC, RoomProductType.ERFC, RoomProductType.RFC]
        : (inputDirect.salesStrategy.ourTip as RoomProductType[])
    );

    const directRoomProducts = this.processDirectRecommendations(
      recommendationItems,
      availableRfcList,
      hasRatePlanPromoId
        ? [RoomProductType.MRFC, RoomProductType.ERFC, RoomProductType.RFC]
        : (inputDirect.salesStrategy.direct as RoomProductType[])
    );

    // Build final result array
    const result = [
      lowestPriceData.lowestPrice,
      ...mostPopularRoomProducts,
      ...ourTipRoomProducts,
      ...directRoomProducts
    ].filter(Boolean);

    if (result.length === 0) {
      return [];
    }

    let sortedResult = [...result];
    // if hasRatePlanPromoId, sort the price from lowest to highest
    if (hasRatePlanPromoId) {
      sortedResult = [...result].sort((a, b) => {
        const aPrice = a?.availableRfcRatePlanList?.[0]?.totalSellingRate || Infinity;
        const bPrice = b?.availableRfcRatePlanList?.[0]?.totalSellingRate || Infinity;
        return aPrice - bPrice;
      });
    }

    // Process surcharge extras for all results at once
    const resultWithSurcharges = await this.processAllSurcharges(
      sortedResult,
      hotel,
      fromDate,
      toDate,
      childrenAgeList,
      hotelConfigRoundingMode,
      hotelAmenitiesMap
    );

    return this.processImageUrls(resultWithSurcharges);
  }

  /**
   * Processes match flow recommendation for a single room product
   * @private
   */
  private processMatchFlowRecommendation(
    roomProduct: any,
    matchingScore: number,
    matchFeatureList: string[],
    notMatchFeatureList: any[],
    allocatedCapacityDefault: { adults: number; children: number; pets: number },
    allocatedCapacityExtra: { adults: number; children: number; pets: number }
  ) {
    const additionalFeatureList = roomProduct?.roomProductRetailFeatures
      .filter((r: any) => !matchFeatureList.includes(r.retailFeature.code))
      .map((r: any) => ({ ...r.retailFeature, matched: true }));

    const filterMatchFeatureList: any[] = [];
    for (const feature of roomProduct?.roomProductRetailFeatures) {
      const isMatch = matchFeatureList.includes(feature.retailFeature.code);
      if (!isMatch) {
        continue;
      }
      filterMatchFeatureList.push({ ...feature.retailFeature, matched: isMatch });
    }
    for (const feature of notMatchFeatureList) {
      filterMatchFeatureList.push({ ...feature, matched: false });
    }

    const matchingPercentage = parseFloat(matchingScore.toFixed(2));

    return {
      roomProduct: {
        ...roomProduct,
        matchingPercentage,
        additionalFeatureList: additionalFeatureList,
        retailFeatureList: filterMatchFeatureList,
        allocatedExtraBedAdultCount: allocatedCapacityExtra.adults,
        allocatedExtraBedChildCount: allocatedCapacityExtra.children,
        allocatedAdultCount: allocatedCapacityDefault.adults,
        allocatedChildCount: allocatedCapacityDefault.children,
        allocatedPetCount: allocatedCapacityDefault.pets
      },
      matchingScore,
      matchFeatureList,
      notMatchFeatureList
    };
  }

  /**
   * Creates lowest price recommendation
   * @private
   */
  private createLowestPriceRecommendation(
    availableRfcList: any[],
    allLowestPriceRoomProductType: Map<RoomProductType, boolean>,
    totalAdults: number,
    totalChildren: number,
    totalPets: number,
    hasRatePlanPromoId: boolean
  ) {
    // for lowest price, filter availableRfcList no restriction validation
    const noViolatingRestriction = availableRfcList.filter(
      (r) => r.restrictionValidationList.length === 0 || !r.restrictionValidationList.length
    );

    const sortedAvailableRfcList = noViolatingRestriction.sort((a, b) => {
      const aLowestPrice = a.rfcRatePlanList?.[0]?.totalGrossAmount || Infinity;
      const bLowestPrice = b.rfcRatePlanList?.[0]?.totalGrossAmount || Infinity;
      return aLowestPrice - bLowestPrice;
    });

    const filteredAvailableRfcList = sortedAvailableRfcList.filter((r) =>
      RoomRequestUtils.canFulfillRequest(r, totalAdults, totalChildren, totalPets)
    );

    const lowestPriceProduct = RoomRequestUtils.getLowestPriceDetails(
      filteredAvailableRfcList,
      allLowestPriceRoomProductType
    );

    const lowestPriceRoomProduct = lowestPriceProduct?.roomProduct;

    const lowestPrice = {
      label: !hasRatePlanPromoId ? BookingFlow.LOWEST_PRICE : BookingFlow.DIRECT,
      availableRfcList: availableRfcList.filter((r) => r.id === lowestPriceRoomProduct?.id),
      availableRfcRatePlanList: [
        ...availableRfcList
          .filter((r) => r.id === lowestPriceRoomProduct?.id)
          .flatMap((r) => r.rfcRatePlanList || [])
      ]
    };

    return { lowestPrice, lowestPriceRoomProduct, price: lowestPriceProduct?.price };
  }

  /**
   * Extracts recommendations by booking flow type
   * @private
   */
  private extractRecommendationsByType(
    recommendationItems: BookingFlowResponse[],
    bookingFlowType: string,
    label: string,
    availableRfcList: any[],
    allowedTypes?: RoomProductType[]
  ) {
    const recommendation = recommendationItems.find((e) => e.bookingFlow === bookingFlowType);
    const items: { code: string; capacity: any }[] = [];
    const length = 1; // for most popular and recommended, we only need to return 1 recommendation

    if (recommendation?.recommendationList) {
      // Fix: Handle both object and array structures properly
      const recommendationList = recommendation.recommendationList;

      if (Array.isArray(recommendationList)) {
        // If it's directly an array
        recommendationList.forEach((item: any) => {
          if (item.code) {
            items.push({ code: item.code, capacity: item });
          }
        });
      } else if (typeof recommendationList === 'object' && recommendationList !== null) {
        // If it's an object with combination keys
        Object.values(recommendationList).forEach((recommendations: any) => {
          if (Array.isArray(recommendations)) {
            recommendations.forEach((item: any) => {
              if (item.code) {
                items.push({ code: item.code, capacity: item });
              }
            });
          }
        });
      }
    }

    // Fix: Return empty array if no items found
    if (items.length === 0) {
      return [];
    }

    const restrictionValidationList: any[] = [];

    const combinedRfcList: any[] = [];
    const combinedRatePlanList: any[] = [];

    items.forEach((item) => {
      const roomProduct = availableRfcList.find((r) => item.code === r.code);

      // Filter by allowed room product types if specified
      if (roomProduct && allowedTypes !== undefined) {
        // If allowedTypes is empty array, block all types (none allowed)
        if (allowedTypes.length === 0) {
          return;
        }
        // If allowedTypes has values, only allow types in the array
        if (!allowedTypes.includes(roomProduct.type)) {
          return;
        }
      }

      if (roomProduct) {
        const capacity = item.capacity;
        const allocatedAdultCount = capacity?.allocatedCapacityDefault?.adults || 0;
        const allocatedChildCount = capacity?.allocatedCapacityDefault?.children || 0;
        const allocatedPetCount = capacity?.allocatedCapacityDefault?.pets || 0;
        const allocatedExtraBedAdultCount = capacity?.allocatedCapacityExtra?.adults || 0;
        const allocatedExtraBedChildCount = capacity?.allocatedCapacityExtra?.children || 0;
        const allocatedPetCountExtra = capacity?.allocatedCapacityExtra?.pets || 0;

        // Add to combined lists (surcharge processing will be done centrally later)
        combinedRfcList.push({
          ...roomProduct,
          allocatedAdultCount,
          allocatedChildCount,
          allocatedPetCount,
          allocatedExtraBedAdultCount,
          allocatedExtraBedChildCount,
          allocatedPetCountExtra
        });

        combinedRatePlanList.push(...(roomProduct.rfcRatePlanList || []));

        // Collect restriction validations
        if (roomProduct.restrictionValidationList) {
          restrictionValidationList.push(...roomProduct.restrictionValidationList);
        }
      }
    });

    if (combinedRfcList.length === 0) {
      return [];
    }

    return [
      {
        label,
        availableRfcList: combinedRfcList,
        availableRfcRatePlanList: this.aggregateByCode(combinedRatePlanList),
        restrictionValidationList
      }
    ];
  }

  /**
   * Process surcharges for all recommendation results
   * Centralized processing to avoid duplication
   * @private
   */
  private async processAllSurcharges(
    results: any[],
    hotel?: Hotel,
    fromDate?: string,
    toDate?: string,
    childrenAgeList?: number[],
    hotelConfigRoundingMode?: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    hotelAmenitiesMap?: { byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> }
  ): Promise<any[]> {
    if (
      !hotel ||
      !fromDate ||
      !toDate ||
      !childrenAgeList ||
      !hotelConfigRoundingMode ||
      !hotelAmenitiesMap
    ) {
      return results;
    }

    return Promise.all(
      results.map(async (result) => {
        // Process each room product in the result
        const processedRfcList = await Promise.all(
          (result.availableRfcList || []).map(async (roomProduct: any) => {
            const allocatedAdultCountExtra =
              roomProduct.allocatedAdultCountExtra || roomProduct.allocatedExtraBedAdultCount || 0;
            const allocatedChildCountExtra =
              roomProduct.allocatedChildCountExtra || roomProduct.allocatedExtraBedChildCount || 0;
            const allocatedPetCount = roomProduct.allocatedPetCount || 0;

            // Skip if no surcharges needed
            if (
              allocatedAdultCountExtra === 0 &&
              allocatedChildCountExtra === 0 &&
              allocatedPetCount === 0
            ) {
              return roomProduct;
            }

            // Calculate surcharge extras
            const surchargeExtras = await this.processExtraServicesSurcharge(
              hotel,
              hotelAmenitiesMap,
              allocatedAdultCountExtra,
              allocatedChildCountExtra,
              allocatedPetCount,
              fromDate,
              toDate,
              childrenAgeList,
              hotelConfigRoundingMode
            );

            if (surchargeExtras.length === 0) {
              return roomProduct;
            }

            // Update rate plans with surcharge extras
            const updatedRatePlans = (roomProduct.rfcRatePlanList || []).map((ratePlan: any) => {
              const updatedRatePlan = { ...ratePlan };

              // Ensure ratePlan object exists
              if (!updatedRatePlan.ratePlan) {
                updatedRatePlan.ratePlan = {};
              }

              // Add surcharge extras to includedHotelExtrasList
              const existingExtras = updatedRatePlan.ratePlan.includedHotelExtrasList || [];
              updatedRatePlan.ratePlan.includedHotelExtrasList = [
                ...existingExtras,
                ...surchargeExtras
              ];

              // Update pricing totals
              const surchargeTotal = surchargeExtras.reduce((sum, extra) => sum + extra.amount, 0);
              updatedRatePlan.totalSellingRate =
                (updatedRatePlan.totalSellingRate || 0) + surchargeTotal;
              updatedRatePlan.totalGrossAmount =
                (updatedRatePlan.totalGrossAmount || 0) + surchargeTotal;
              updatedRatePlan.totalBaseAmount =
                (updatedRatePlan.totalBaseAmount || 0) + surchargeTotal;

              return updatedRatePlan;
            });

            return {
              ...roomProduct,
              rfcRatePlanList: updatedRatePlans,
              restrictionValidationList: roomProduct.restrictionValidationList || []
            };
          })
        );

        // Update the aggregated rate plan list as well
        const updatedRatePlanList = processedRfcList.flatMap((r) => r.rfcRatePlanList || []);

        return {
          ...result,
          availableRfcList: processedRfcList,
          availableRfcRatePlanList: this.aggregateByCode(updatedRatePlanList),
          restrictionValidationList: processedRfcList.flatMap(
            (r) => r.restrictionValidationList || []
          )
        };
      })
    );
  }

  /**
   * Process extra services surcharge (extra bed adult, extra bed kid, pet) based on allocated counts
   * Only includes amenities with INCLUSIVE display mode
   */
  async processExtraServicesSurcharge(
    hotel: Hotel,
    hotelAmenitiesMap: { byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> },
    allocatedAdultCountExtra: number,
    allocatedChildCountExtra: number,
    allocatedPetCount: number,
    fromDate: string,
    toDate: string,
    childrenAgeList: number[],
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number }
  ): Promise<
    Array<{
      id: string;
      code: string;
      name: string;
      amount: number;
      pricingUnit: PricingUnitEnum;
      includedDates: string[];
    }>
  > {
    const calculatedSurcharges: Array<{
      id: string;
      code: string;
      name: string;
      amount: number;
      pricingUnit: PricingUnitEnum;
      includedDates: string[];
    }> = [];

    // Get tax settings for surcharge codes
    const serviceCodes = [
      HotelAmenityCodeSurchargeEnum.EXTRA_BED_ADULT_AMENITY_CODE,
      HotelAmenityCodeSurchargeEnum.EXTRA_BED_KID_AMENITY_CODE,
      HotelAmenityCodeSurchargeEnum.PET_AMENITY_CODE
    ];

    const extraServices = Array.from(hotelAmenitiesMap.byCode.values()).filter((e) =>
      serviceCodes.includes(e.code as HotelAmenityCodeSurchargeEnum)
    );

    const taxSettingList = await this.hotelService.getHotelTaxSettings(
      hotel.id,
      serviceCodes,
      fromDate,
      toDate
    );

    // Process extra bed adult
    if (allocatedAdultCountExtra > 0) {
      const extraBedAdult = extraServices.find(
        (e) => e.code === HotelAmenityCodeSurchargeEnum.EXTRA_BED_ADULT_AMENITY_CODE
      );

      if (
        extraBedAdult &&
        extraBedAdult.isePricingDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE
      ) {
        const calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
          {
            hotel,
            hotelAmenity: {
              ...extraBedAdult,
              count: allocatedAdultCountExtra
            },
            fromDate,
            toDate,
            taxSettingList: taxSettingList.extrasTaxes.filter(
              (t) => t.serviceCode === extraBedAdult.code
            ),
            serviceChargeRate: 0,
            serviceChargeTaxRate: 0,
            adult: allocatedAdultCountExtra,
            childrenAgeList: [],
            allocatedPets: 0
          },
          hotelConfigRoundingMode
        );

        const amenityAmount = Number(calculatedAmenity.totalGrossAmount) || 0;
        calculatedSurcharges.push({
          id: extraBedAdult.id,
          code: extraBedAdult.code,
          name: extraBedAdult.name || 'Extra Bed Adult',
          amount: amenityAmount,
          pricingUnit: extraBedAdult.pricingUnit!,
          includedDates: calculatedAmenity.includedDates || []
        });
      }
    }

    // Process extra bed kid
    if (allocatedChildCountExtra > 0) {
      const extraBedKid = extraServices.find(
        (e) => e.code === HotelAmenityCodeSurchargeEnum.EXTRA_BED_KID_AMENITY_CODE
      );

      if (
        extraBedKid &&
        extraBedKid.isePricingDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE
      ) {
        extraBedKid.hotelAmenityPrices = extraBedKid.hotelAmenityPrices.filter(
          (p) => p.hotelAgeCategory.code !== HotelAgeCategoryCodeEnum.DEFAULT
        );
        const calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
          {
            hotel,
            hotelAmenity: {
              ...extraBedKid,
              count: allocatedChildCountExtra
            },
            fromDate,
            toDate,
            taxSettingList: taxSettingList.extrasTaxes.filter(
              (t) => t.serviceCode === extraBedKid.code
            ),
            serviceChargeRate: 0,
            serviceChargeTaxRate: 0,
            adult: 0,
            childrenAgeList: childrenAgeList.slice(0, allocatedChildCountExtra),
            allocatedPets: 0
          },
          hotelConfigRoundingMode
        );

        const amenityAmount = Number(calculatedAmenity.totalGrossAmount) || 0;
        calculatedSurcharges.push({
          id: extraBedKid.id,
          code: extraBedKid.code,
          name: extraBedKid.name || 'Extra Bed Kid',
          amount: amenityAmount,
          pricingUnit: extraBedKid.pricingUnit!,
          includedDates: calculatedAmenity.includedDates || []
        });
      }
    }

    // Process pet surcharge
    if (allocatedPetCount > 0) {
      const petSurcharge = extraServices.find(
        (e) => e.code === HotelAmenityCodeSurchargeEnum.PET_AMENITY_CODE
      );

      if (petSurcharge?.isePricingDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE) {
        const calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
          {
            hotel,
            hotelAmenity: {
              ...petSurcharge,
              count: allocatedPetCount
            },
            fromDate,
            toDate,
            taxSettingList: taxSettingList.extrasTaxes.filter(
              (t) => t.serviceCode === petSurcharge.code
            ),
            serviceChargeRate: 0,
            serviceChargeTaxRate: 0,
            adult: 0,
            childrenAgeList: [],
            allocatedPets: allocatedPetCount
          },
          hotelConfigRoundingMode
        );

        const amenityAmount = Number(calculatedAmenity.totalGrossAmount) || 0;
        calculatedSurcharges.push({
          id: petSurcharge.id,
          code: petSurcharge.code,
          name: petSurcharge.name || 'Pet Surcharge',
          amount: amenityAmount,
          pricingUnit: petSurcharge.pricingUnit!,
          includedDates: calculatedAmenity.includedDates || []
        });
      }
    }

    return calculatedSurcharges;
  }

  aggregateByCode(data: any[]) {
    const map = new Map<string, any>();

    for (const item of data) {
      if (!map.has(item.ratePlan.code)) {
        // clone object to avoid mutation
        map.set(item.ratePlan.code, { ...item });
      } else {
        const existing = map.get(item.ratePlan.code);

        // Add up totals
        existing.totalSellingRate += item.totalSellingRate;
        existing.totalGrossAmount += item.totalGrossAmount;
        existing.totalBaseAmount += item.totalBaseAmount;
        existing.totalBaseAmountBeforeAdjustment += item.totalBaseAmountBeforeAdjustment;
        existing.totalGrossAmountBeforeAdjustment += item.totalGrossAmountBeforeAdjustment;

        // If you want to average daily rate, recompute
        existing.averageDailyRate =
          existing.totalSellingRate /
          data.filter((d) => d.ratePlan.code === item.ratePlan.code).length;

        // Merge extras if needed (unique by id)
        const mergedExtras = [
          ...existing.ratePlan.includedHotelExtrasList,
          ...item.ratePlan.includedHotelExtrasList
        ];
        existing.ratePlan.includedHotelExtrasList = [
          ...new Map(mergedExtras.map((e) => [e.id, e])).values()
        ];
      }
    }

    return Array.from(map.values());
  }

  /**
   * Processes direct recommendations with combinations
   * @private
   */
  private processDirectRecommendations(
    recommendationItems: BookingFlowResponse[],
    availableRfcList: any[],
    allowedTypes?: RoomProductType[]
  ): any[] {
    const directRecommendation = recommendationItems.find((e) => e.bookingFlow === 'direct');
    const directRoomProducts: any[] = [];

    if (directRecommendation?.recommendationList) {
      Object.entries(directRecommendation.recommendationList).forEach(
        ([combinationKey, recommendations]: [string, any]) => {
          if (Array.isArray(recommendations) && recommendations.length > 0) {
            const combinationData = this.processCombinationRecommendation(
              combinationKey,
              recommendations,
              availableRfcList,
              allowedTypes
            );
            if (combinationData) {
              directRoomProducts.push(combinationData);
            }
          }
        }
      );
    }

    // Sort by combination total price
    return directRoomProducts.sort((a, b) => {
      return (a.combinationTotalPrice || Infinity) - (b.combinationTotalPrice || Infinity);
    });
  }

  /**
   * Processes a single combination recommendation
   * @private
   */
  private processCombinationRecommendation(
    combinationKey: string,
    recommendations: any[],
    availableRfcList: any[],
    allowedTypes?: RoomProductType[]
  ) {
    const combinationItems: { code: string; capacity: any }[] = [];
    const combinationDetails: any[] = [];

    // Check if any room in this combination has zero allocation
    for (const item of recommendations) {
      if (item.code) {
        const totalAllocated =
          (item.allocatedCapacityDefault?.adults || 0) +
          (item.allocatedCapacityDefault?.children || 0) +
          (item.allocatedCapacityDefault?.pets || 0) +
          (item.allocatedCapacityExtra?.adults || 0) +
          (item.allocatedCapacityExtra?.children || 0) +
          (item.allocatedCapacityExtra?.pets || 0);

        if (totalAllocated === 0) {
          this.logger.warn(
            `Skipping DIRECT combination ${combinationKey} - room ${item.code} has no guests allocated`
          );
          return null; // Skip this entire combination
        }

        combinationItems.push({ code: item.code, capacity: item });
        combinationDetails.push(item);
      }
    }

    if (combinationItems.length === 0) {
      return null;
    }

    const uniqueCodes = [...new Set(combinationItems.map((item) => item.code))];
    const roomProducts = Array.from({ length: combinationItems.length })
      .map((_, index) => {
        const roomProduct = availableRfcList.find((r) => r.code === combinationItems[index].code);

        // Filter by allowed room product types if specified
        if (roomProduct && allowedTypes !== undefined) {
          // If allowedTypes is empty array, block all types (none allowed)
          if (allowedTypes.length === 0) {
            return null;
          }
          // If allowedTypes has values, only allow types in the array
          if (!allowedTypes.includes(roomProduct.type)) {
            return null;
          }
        }

        if (roomProduct) {
          const details = combinationDetails.find((d) => d.code === combinationItems[index].code);
          const allocatedAdultCount = details.allocatedCapacityDefault?.adults || 0;
          const allocatedChildCount = details.allocatedCapacityDefault?.children || 0;
          const allocatedPetCount = details.allocatedCapacityDefault?.pets || 0;
          const allocatedExtraBedAdultCount = details.allocatedCapacityExtra?.adults || 0;
          const allocatedExtraBedChildCount = details.allocatedCapacityExtra?.children || 0;
          const allocatedPetCountExtra = details.allocatedCapacityExtra?.pets || 0;

          // Return product with allocated capacity (surcharge processing will be done centrally later)
          return {
            ...roomProduct,
            allocatedAdultCount,
            allocatedChildCount,
            allocatedPetCount,
            allocatedExtraBedAdultCount,
            allocatedExtraBedChildCount,
            allocatedPetCountExtra
          };
        }
        return null;
      })
      .filter(Boolean);

    // If all room products were filtered out, skip this combination
    if (roomProducts.length === 0) {
      return null;
    }

    // Sort room products by price
    const sortedRoomProducts = roomProducts.sort((a, b) => {
      const aLowestPrice = a?.rfcRatePlanList?.[0]?.totalSellingRate || Infinity;
      const bLowestPrice = b?.rfcRatePlanList?.[0]?.totalSellingRate || Infinity;
      return aLowestPrice - bLowestPrice;
    });

    // Get and sort all rate plans
    const allRatePlans = this.aggregateByCode(
      availableRfcList
        .filter((r) => uniqueCodes.includes(r.code))
        .flatMap((r) => r.rfcRatePlanList || [])
    );

    const sortedRatePlans = allRatePlans.sort((a, b) => {
      const aPrice = a?.totalSellingRate || Infinity;
      const bPrice = b?.totalSellingRate || Infinity;
      return aPrice - bPrice;
    });

    // Calculate total price for sorting
    const averageDailyRate = sortedRatePlans[0]?.averageDailyRate || Infinity;

    return {
      label: BookingFlow.DIRECT,
      combinationKey,
      combinationTotalPrice: averageDailyRate,
      availableRfcList: sortedRoomProducts,
      availableRfcRatePlanList: sortedRatePlans,
      recommendationDetails: combinationDetails,
      restrictionValidationList: []
    };
  }

  /**
   * Processes image URLs for all recommendations
   * @private
   */
  private async processImageUrls(recommendations: any[]) {
    return Promise.all(
      recommendations.map(async (recommendation) => ({
        ...recommendation,
        availableRfcList: await Promise.all(
          recommendation.availableRfcList.map(async (roomProduct: any) => {
            // Destructure to remove roomProductStandardFeatures
            const fieldsToRemove = [
              'roomProductStandardFeatures',
              'extraBedAdult',
              'extraBedKid',
              // 'id', don't remove id please !!!
              'capacityDefault',
              'capacityExtra',
              'maximumAdult',
              'maximumKid',
              'maximumPet',
              'extraAdult',
              'extraChildren',
              'roomProductImages',
              'roomProductAssignedUnits'
            ];
            const { ...restRoomProduct } = roomProduct;
            fieldsToRemove.forEach((field) => {
              delete restRoomProduct[field];
            });

            return {
              ...restRoomProduct,
              rfcImageList: await Promise.all(
                roomProduct.rfcImageList.map(async (img: any) => {
                  const url = img.imageUrl
                    ? await this.s3Service.getPreSignedUrl(img.imageUrl)
                    : '';
                  return { imageUrl: url };
                })
              )
            };
          })
        )
      }))
    );
  }

  private async buildInputForAiRecommendation(
    roomProductsWithCapacity: RoomProduct[],
    availableRfcList: any[],
    lowestPriceProduct: RoomProduct,
    samePeriodReservationCount: {
      roomProductId: string;
      numberOfReservations: number;
      features?: string | null;
    }[],
    inputDirect: DirectFlowInput,
    lowestPrice: number
  ): Promise<DirectFlowResponse> {
    const bookingHistoryList: DirectBookingHistoryItem[] = samePeriodReservationCount.map((p) => ({
      productCode: roomProductsWithCapacity.find((rp) => rp.id === p.roomProductId)?.code!,
      sameBookingPeriod: p.numberOfReservations,
      totalHistoryBookingTime: p.numberOfReservations,
      productPopularity: 0,
      featurePopularityList:
        p.features
          ?.split(',')
          .map((d) => inputDirect.featureList.find((f) => f.code === d)?.popularity || 0) || []
    }));

    const availableRoomProductList: DirectRoomProductAvailable[] = availableRfcList
      .filter((p) => p.id !== lowestPriceProduct?.id)
      .map((p) => ({
        id: p.id,
        code: p.code,
        description: p.description,
        name: p.name,
        basePrice: p.rfcRatePlanList[0]?.totalGrossAmount || 0,
        ratePlanCode: p.rfcRatePlanList[0]?.ratePlan?.code,
        type: p.type,
        availableRoomIds: p.roomProductAssignedUnits.map(
          (d: RoomProductAssignedUnit) => d.roomUnitId
        ),
        availableRoomDetails: p.roomProductAssignedUnits.map((d: RoomProductAssignedUnit) => ({
          roomUnitId: d.roomUnitId,
          roomNumber: d.roomUnit?.roomNumber || '',
          roomFloor: d.roomUnit?.roomFloor || '',
          space: d.roomUnit?.space || 0,
          building: d.roomUnit?.building || ''
        })),
        featureList: p.roomProductRetailFeatures.map(
          (d: RoomProductRetailFeature) => d.retailFeature.code
        ),
        isRestricted: p.restrictionValidationList?.length > 0,
        allocationType: p.rfcAllocationSetting,
        spaceTypeList: p.roomProductRetailFeatures
          .filter((d: RoomProductRetailFeature) => d.retailFeature.code.startsWith('SPT_'))
          .map((d: RoomProductRetailFeature) => d.retailFeature.code),
        availableToSell: p.roomProductAssignedUnits.length,
        capacity: {
          adults: p.maximumAdult || 0,
          children: p.maximumKid || 0,
          pets: p.maximumPet || 0,
          maximum: p.capacityDefault || 0
        },
        extraCapacity: {
          adults: p.extraBedAdult || 0,
          children: p.extraBedKid || 0,
          pets: 0,
          maximum: p.capacityExtra || 0
        },
        numberOfBedrooms: p.numberOfBedrooms
      }));

    const directFlowInput: DirectFlowInput = {
      ...inputDirect,
      availableRoomProductList: availableRoomProductList,
      bookingHistoryList,
      lowestPriceList: [lowestPriceProduct?.code!],
      lowestPrice: lowestPrice || 0,
      stayOptionRecommendationNumber:
        Number(this.configService.get(ENVIRONMENT.STAY_OPTION_RECOMMENDATION_NUMBER) || 12) -
        (lowestPriceProduct?.code! ? 1 : 0)
    };

    // call ai recommendation service for direct flow
    const aiDirectFlowResponse = await this.directPipelineService.directFlow(directFlowInput);

    return aiDirectFlowResponse;
  }

  private async buildInputForMatchFlow(
    availableRfcList: any[],
    inputDirect: DirectFlowInput
  ): Promise<any[]> {
    const availableRoomProductList: DirectRoomProductAvailable[] = availableRfcList.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      basePrice: p.rfcRatePlanList[0]?.totalGrossAmount || 0,
      ratePlanCode: p.rfcRatePlanList[0]?.ratePlan?.code,
      type: p.type,
      availableRoomIds: p.roomProductAssignedUnits.map(
        (d: RoomProductAssignedUnit) => d.roomUnitId
      ),
      availableRoomDetails: p.roomProductAssignedUnits.map((d: RoomProductAssignedUnit) => ({
        roomUnitId: d.roomUnitId,
        roomNumber: d.roomUnit?.roomNumber || '',
        roomFloor: d.roomUnit?.roomFloor || '',
        space: d.roomUnit?.space || 0,
        building: d.roomUnit?.building || '',
        featureString: d.roomUnit?.featureString || ''
      })),
      featureList: p.roomProductRetailFeatures.map(
        (d: RoomProductRetailFeature) => d.retailFeature.code
      ),
      isRestricted: false,
      allocationType: p.rfcAllocationSetting,
      spaceTypeList: p.roomProductRetailFeatures
        .filter((d: RoomProductRetailFeature) => d.retailFeature.code.startsWith('SPT_'))
        .map((d: RoomProductRetailFeature) => d.retailFeature.code),
      availableToSell: p.roomProductAssignedUnits.length,
      capacity: {
        adults: p.maximumAdult || 0,
        children: p.maximumKid || 0,
        pets: p.maximumPet || 0,
        maximum: p.capacityDefault
      },
      extraCapacity: {
        adults: p.extraBedAdult || 0,
        children: p.extraBedKid || 0,
        pets: 0,
        maximum: p.capacityExtra || 0
      },
      numberOfBedrooms: p.numberOfBedrooms
    }));

    const directFlowInput: DirectFlowInput = {
      ...inputDirect,
      availableRoomProductList: availableRoomProductList,
      bookingHistoryList: [],
      lowestPriceList: [],
      stayOptionRecommendationNumber: Number(
        this.configService.get(ENVIRONMENT.STAY_OPTION_RECOMMENDATION_NUMBER) || 12
      )
    };

    // call ai recommendation service for direct flow
    const aiMatchFlowResponse = await this.directPipelineService.matchFlow(directFlowInput);

    return aiMatchFlowResponse;
  }

  getLowestPriceRoomProduct(availableRfcList: any[]): any | null {
    if (!availableRfcList || availableRfcList.length === 0) {
      return null;
    }

    let lowestPriceRoomProduct = null;
    let lowestPrice = Infinity;

    for (const roomProduct of availableRfcList) {
      if (roomProduct.rfcRatePlanList && roomProduct.rfcRatePlanList.length > 0) {
        // Get the lowest price from this room product's rate plans
        // (they're already sorted by price in your code)
        const cheapestRatePlan = roomProduct.rfcRatePlanList[0];

        if (cheapestRatePlan && cheapestRatePlan.totalGrossAmount < lowestPrice) {
          lowestPrice = cheapestRatePlan.totalGrossAmount;
          lowestPriceRoomProduct = roomProduct;
        }
      }
    }

    return lowestPriceRoomProduct;
  }

  private async getRoomProductsWithCapacity(
    hotelId: string,
    types: string[],
    totalAdult: number,
    totalChildren: number,
    totalPets: number,
    requestedCapacity: number,
    requestLength: number,
    productCode?: string,
    languageCode?: string
  ): Promise<any[]> {
    // Execute the main room product query first to get room product IDs
    // Note: distributionChannel is an array field, so we need to use query builder for the array check
    const start0 = performance.now();

    // Optimized query with better indexing hints and reduced data transfer
    let query = this.roomProductRepository
      .createQueryBuilder('r')
      .where('r.hotelId = :hotelId', { hotelId })
      .andWhere('r.deletedAt IS NULL')
      .andWhere('r.type = ANY(:types)', { types })
      .andWhere('r.status = :status', { status: RoomProductStatus.ACTIVE })
      .andWhere(':distributionChannel = ANY(r.distributionChannel)', {
        distributionChannel: DistributionChannel.GV_SALES_ENGINE
      })
      .andWhere('COALESCE(r.numberOfBedrooms, 0) > 0')
      .select([
        'r.id',
        'r.capacityDefault',
        'r.capacityExtra',
        'r.maximumAdult',
        'r.maximumKid',
        'r.maximumPet',
        'r.extraBedAdult',
        'r.extraBedKid',
        'r.numberOfBedrooms',
        'r.type',
        'r.code',
        'r.name',
        'r.space',
        'r.description',
        'r.rfcAllocationSetting',
        'r.translations',
        'r.isLockedUnit'
      ]);
    // .orderBy('r.code', 'ASC');

    if (productCode) {
      query.andWhere('LOWER(r.code) = LOWER(:productCode)', {
        productCode: productCode?.toLowerCase()
      });
    }

    // if request length = 1, filter capacity
    // if request length > 1, no filter capacity
    if (requestLength === 1) {
      this.logger.debug(`Filtering capacity for request length 1`);
      query.andWhere('(r.capacityDefault + r.capacityExtra) >= :requestedCapacity', {
        requestedCapacity
      });
      query.andWhere('(r.maximumAdult + r.extraBedAdult) >= :totalAdult', { totalAdult });
      query.andWhere('(r.maximumKid + r.extraBedKid) >= :totalChildren', { totalChildren });
      query.andWhere('r.maximumPet >= :totalPets', { totalPets });
      query.andWhere('r.numberOfBedrooms >= :requestLength', { requestLength });
    }

    const roomProducts = await query.getMany();

    if (roomProducts.length === 0) {
      return [];
    }

    const roomProductIds = roomProducts.map((rp) => rp.id);

    // Now fetch all related data concurrently
    const relatedDataOperations = [
      // get room product images
      {
        type: 'roomProductImages',
        promise: this.roomProductImageRepository.find({
          where: { roomProductId: In(roomProductIds) },
          select: ['roomProductId', 'imageUrl', 'sequence'],
          order: { sequence: 'ASC' }
        })
      },

      // get room product retail features with retail feature details
      {
        type: 'roomProductRetailFeatures',
        promise: this.roomProductRetailFeatureRepository.find({
          where: {
            roomProductId: In(roomProductIds),
            quantity: MoreThanOrEqual(1)
          },
          relations: ['retailFeature', 'retailFeature.hotelRetailCategory'],
          select: {
            id: true,
            roomProductId: true,
            quantity: true,
            retailFeature: {
              name: true,
              description: true,
              code: true,
              measurementUnit: true,
              imageUrl: true,
              baseWeight: true,
              translations: true,
              hotelRetailCategory: {
                code: true,
                name: true,
                displaySequence: true
              }
            }
          }
        })
      },

      // get room product standard features with standard feature details
      {
        type: 'roomProductStandardFeatures',
        promise: this.roomProductStandardFeatureRepository.find({
          where: { roomProductId: In(roomProductIds) },
          relations: ['standardFeature'],
          select: {
            id: true,
            roomProductId: true,
            standardFeature: {
              name: true,
              code: true,
              description: true,
              imageUrl: true,
              translations: true
            }
          }
        })
      },

      // get room product assigned units
      {
        type: 'roomProductAssignedUnits',
        promise: this.roomProductAssignedUnitRepository.find({
          where: { roomProductId: In(roomProductIds) },
          relations: ['roomUnit'],
          select: {
            roomProductId: true,
            roomUnitId: true,
            roomUnit: {
              id: true,
              roomNumber: true,
              roomFloor: true,
              space: true,
              building: true,
              featureString: true
            }
          }
        })
      }
    ];

    // Execute all related data queries concurrently
    const relatedResults = await Promise.all(relatedDataOperations.map((op) => op.promise));
    const [
      roomProductImages,
      roomProductRetailFeatures,
      roomProductStandardFeatures,
      roomProductAssignedUnits
    ] = relatedResults;

    // Create lookup maps for efficient data mapping - optimized with reduce for better performance
    const imagesMap = roomProductImages.reduce((map, img) => {
      if (!map.has(img.roomProductId)) {
        map.set(img.roomProductId, []);
      }
      map.get(img.roomProductId)!.push(img);
      return map;
    }, new Map<string, any[]>());

    const retailFeaturesMap = roomProductRetailFeatures.reduce((map, feature) => {
      if (!map.has(feature.roomProductId)) {
        map.set(feature.roomProductId, []);
      }
      map.get(feature.roomProductId)!.push(feature);
      return map;
    }, new Map<string, any[]>());

    const standardFeaturesMap = roomProductStandardFeatures.reduce((map, feature) => {
      if (!map.has(feature.roomProductId)) {
        map.set(feature.roomProductId, []);
      }
      map.get(feature.roomProductId)!.push(feature);
      return map;
    }, new Map<string, any[]>());

    const assignedUnitsMap = roomProductAssignedUnits.reduce((map, unit) => {
      if (!map.has(unit.roomProductId)) {
        map.set(unit.roomProductId, []);
      }
      map.get(unit.roomProductId)!.push(unit);
      return map;
    }, new Map<string, any[]>());

    // Map related data to room products and sort by capacity
    const result = roomProducts
      .map((roomProduct: any) => {
        const images = imagesMap.get(roomProduct.id) || [];
        const retailFeatures = retailFeaturesMap.get(roomProduct.id) || [];
        const standardFeatures = standardFeaturesMap.get(roomProduct.id) || [];
        const assignedUnits = assignedUnitsMap.get(roomProduct.id) || [];

        for (const feature of retailFeatures) {
          const retailFeatureTranslation = feature.retailFeature.translations?.find(
            (t) => t.languageCode === languageCode
          );
          feature.retailFeature.name = retailFeatureTranslation?.name ?? feature.retailFeature.name;
          feature.retailFeature.description =
            retailFeatureTranslation?.description ?? feature.retailFeature.description;
          feature.retailFeature.measurementUnit =
            retailFeatureTranslation?.measurementUnit ?? feature.retailFeature.measurementUnit;
        }

        return {
          ...roomProduct,
          roomProductImages: images,
          roomProductRetailFeatures: retailFeatures,
          roomProductStandardFeatures: standardFeatures,
          roomProductAssignedUnits: assignedUnits
        };
      })
      .sort((a, b) => {
        // Sort by total capacity (capacityDefault + capacityExtra)
        const capacityA = (a.capacityDefault || 0) + (a.capacityExtra || 0);
        const capacityB = (b.capacityDefault || 0) + (b.capacityExtra || 0);
        return capacityA - capacityB;
      });

    const end0 = performance.now();
    this.logger.debug(
      `⏱️ Time taken to get room products with capacity: ${((end0 - start0) / 1000).toFixed(2)} seconds`
    );

    return result;
  }

  private async calculateAvailabilityPerDateRaw(
    hotelId: string,
    fromDate: string,
    toDate: string,
    roomProductIds: string[]
  ): Promise<{ date: string; roomProductId: string | null; available: number }[]> {
    if (roomProductIds.length === 0) {
      return [];
    }

    const query = `
      WITH date_series AS (
        SELECT generate_series($1::date, $2::date, '1 day'::interval)::date::text AS date
      ),
      availability_check AS (
        SELECT 
          ds.date,
          rda.room_product_id,
          CASE 
            WHEN (
              COALESCE(rda.available, 0) > 0
            )
            THEN 1
            ELSE 0
          END AS available
        FROM date_series ds
        LEFT JOIN room_product_daily_availability rda 
          ON rda.date = ds.date
          AND rda.hotel_id = $4
          AND rda.room_product_id = ANY($3::uuid[])
      )
      SELECT 
        date,
        room_product_id,
        available
      FROM availability_check
      ORDER BY date, room_product_id;
    `;

    const result = await this.roomProductRepository.query(query, [
      fromDate,
      toDate,
      roomProductIds,
      hotelId
    ]);

    return result.map((row) => ({
      date: row.date,
      roomProductId: row.room_product_id as string | null,
      available: Number(row.available) || 0
    }));
  }

  async calculateRoomProductRatePlanPricing(
    hotelId: string,
    roomProductRatePlanIds: string[],
    fromDate: string,
    toDate: string,
    totalAdult: number,
    childAgeList: number[],
    totalPet: number,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    isIsePricingDisplay: IsePricingDisplayModeEnum,
    isIncludeCityTax?: boolean
  ): Promise<any[]> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      select: {
        id: true
      }
    });

    // console.log('hotelId', hotelId);
    // console.log('roomProductRatePlanIds', roomProductRatePlanIds);
    // console.log('fromDate', fromDate);
    // console.log('toDate', toDate);
    // console.log('totalAdult', totalAdult);
    // console.log('childAgeList', childAgeList);
    // console.log('totalPet', totalPet);
    // console.log('hotelConfigRoundingMode', hotelConfigRoundingMode);
    // console.log('isIsePricingDisplay', isIsePricingDisplay);

    const roomProductRatePlans = await this.roomProductRatePlanRepository.find({
      where: { id: In(roomProductRatePlanIds) },
      select: {
        id: true,
        ratePlanId: true,
        roomProductId: true,
        ratePlan: {
          id: true,
          code: true
        }
      },
      relations: {
        ratePlan: true
      }
    });

    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    const hotelAmenitiesMap = await this.getHotelAmenitiesMap(hotel.id, true);

    return this.processRoomProductRatePlanPricing(
      hotel,
      roomProductRatePlans,
      fromDate,
      toDate,
      totalAdult,
      childAgeList,
      totalPet,
      hotelConfigRoundingMode,
      hotelAmenitiesMap,
      isIncludeCityTax
    );
  }

  async processRoomProductRatePlanPricing(
    hotel: Hotel,
    roomProductRatePlans: RoomProductRatePlan[],
    fromDate: string,
    toDate: string,
    totalAdult: number,
    childAgeList: number[],
    totalPet: number,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    hotelAmenitiesMap: {
      byId: Map<string, HotelAmenity>;
      byCode: Map<string, HotelAmenity>;
    },
    isIncludeCityTax?: boolean,
    roomProductRatePlanSellabilityMap: Map<string, boolean> = new Map<string, boolean>()
  ): Promise<any[]> {
    // Early exit if no room product rate plans
    if (!roomProductRatePlans || roomProductRatePlans.length === 0) {
      return [];
    }
    const start0 = performance.now();

    // ---------- normalize inputs ----------
    const from = format(fromDate, DATE_FORMAT);
    const to = format(toDate, DATE_FORMAT);
    const dates = Helper.generateDateRange(from, to);

    // Pre-compute unique IDs and codes for efficient querying
    const ratePlanIds = [...new Set(roomProductRatePlans.map((rp) => rp.ratePlanId))];
    const ratePlanCodes = [...new Set(roomProductRatePlans.map((rp) => rp.ratePlan.code))];
    const roomProductIds = [...new Set(roomProductRatePlans.map((rp) => rp.roomProductId))];

    const ratePlanDerivedSettings = await this.getRatePlanDerivedSettings(ratePlanIds);

    const masterRatePlanIds = ratePlanDerivedSettings
      .filter((setting) => setting.followDailyIncludedAmenity)
      .map((setting) => setting.derivedRatePlanId);

    const start1 = performance.now();

    // Optimized parallel data fetching with better query structure
    const [
      dailySellingPrices,
      dailyExtraServices,
      ratePlanExtraServices,

      roomProductExtraServices,
      ageCategories,
      dailyExtraOccupancyRates,
      hotelCityTaxes,
      hotelCityTaxAgeGroups,
      roomProductAssignedUnits
    ] = await Promise.all([
      this.getDailySellingPrices(hotel.id, ratePlanIds, roomProductIds, fromDate, toDate),
      this.getDailyExtraServices(hotel.id, [...ratePlanIds, ...masterRatePlanIds], dates),
      this.getRatePlanExtraServices([...ratePlanIds, ...masterRatePlanIds]),
      this.getRoomProductExtraServices(roomProductIds, hotel.id),
      this.occupancySurchargeCalculateService.getAgeCategories(hotel.id),
      this.occupancySurchargeCalculateService.getDailyOccupancySurchargeRate({
        fromDate: fromDate,
        toDate: toDate,
        roomProductRatePlans: roomProductRatePlans
      }),
      this.hotelCityTaxRepository.findAll({
        hotelId: hotel.id,
        statuses: [CityTaxStatusEnum.ACTIVE]
      }),
      this.hotelCityTaxRepository.findAllAgeGroups({
        hotelId: hotel.id
      }),
      this.roomProductAssignedUnitRepository.find({
        where: {
          roomProductId: In(roomProductIds)
        }
      })
    ]);

    const end1 = performance.now();
    this.logger.debug(`⏱️ fetch data: ${((end1 - start1) / 1000).toFixed(3)}s`);

    const start2 = performance.now();
    // ---------- pre-calc extra occupancy surcharge prices ----------
    const extraOccupancySurchargePrices =
      this.occupancySurchargeCalculateService.calculateExtraOccupancySurcharge({
        roomProductRatePlans,
        fromDate,
        toDate,
        adults: totalAdult,
        childrenAges: childAgeList,
        ageCategories,
        rates: dailyExtraOccupancyRates
      });

    const extraOccupancySurchargePriceMap = groupByToMap(
      extraOccupancySurchargePrices,
      (r) => `${r.roomProductId}-${r.ratePlanId}`
    );

    const extraOccupancySurchargePriceDailyMap = groupByToMap(
      extraOccupancySurchargePrices,
      (r) => `${r.date};${r.roomProductId};${r.ratePlanId}`
    );

    const end2 = performance.now();
    this.logger.debug(`⏱️ extra surcharge: ${((end2 - start2) / 1000).toFixed(3)}s`);

    const start3 = performance.now();
    // ---------- categorize services & build service maps once ----------
    const {
      includedRatePlanServices,
      includedRoomProductServices,
      mandatoryRatePlanServices,
      mandatoryRoomProductServices
    } = this.categorizeExtraServices({
      hotelAmenitiesMap,
      dailyExtraServices,
      ratePlanExtraServices,
      roomProductExtraServices
    });

    // Parallel service map creation
    const [includedServiceMap, mandatoryServiceMap] = await Promise.all([
      this.getAllUniqueExtraServicesOptimized(
        dailyExtraServices,
        includedRatePlanServices,
        includedRoomProductServices,
        hotelAmenitiesMap
      ),
      this.getAllUniqueExtraServicesOptimized(
        dailyExtraServices,
        mandatoryRatePlanServices,
        mandatoryRoomProductServices,
        hotelAmenitiesMap
      )
    ]);

    // Optimized service mapping with reduce for better performance
    const roomProductServiceMap = this.createServiceMap(
      includedRoomProductServices,
      'roomProductId',
      'extra.id'
    );
    const ratePlanServiceMap = this.createServiceMap(
      includedRatePlanServices,
      'ratePlanId',
      'extrasId'
    );
    const mandatoryRoomProductServiceMap = this.createServiceMap(
      mandatoryRoomProductServices,
      'roomProductId',
      'extra.id'
    );
    const mandatoryRatePlanServiceMap = this.createServiceMap(
      mandatoryRatePlanServices,
      'ratePlanId',
      'extrasId'
    );

    const serviceCodes = Array.from(includedServiceMap.values())
      .map((s) => s.code)
      .concat(ratePlanCodes);

    // ---------- tax settings ----------
    const taxSettingList = await this.hotelService.getHotelTaxSettings(
      hotel.id,
      serviceCodes,
      fromDate,
      toDate
    );

    // ---------- hotel amenities arrays and lookups (build once) ----------
    const hotelAmenities = Array.from(includedServiceMap.values()).map((s) => ({
      ...s,
      taxSettingList: taxSettingList.extrasTaxes.filter((t) => t.serviceCode === s.code)
    }));

    const mandatoryHotelAmenities = Array.from(mandatoryServiceMap.values()).map((s) => ({
      ...s,
      taxSettingList: taxSettingList.extrasTaxes.filter((t) => t.serviceCode === s.code)
    }));

    const hotelAmenitiesLookup = new Map(hotelAmenities.map((a) => [a.id, a]));
    const mandatoryAmenitiesLookup = new Map(mandatoryHotelAmenities.map((a) => [a.id, a]));

    const end3 = performance.now();
    this.logger.debug(`⏱️ amenities: ${((end3 - start3) / 1000).toFixed(3)}s`);

    const start4 = performance.now();
    // ---------- room product assigned unit ids map (normalized once) ----------
    const roomProductAssignedUnitsMap = groupByToMap(
      roomProductAssignedUnits,
      (r) => r.roomProductId
    );
    const roomProductAssignedUnitIdsMap = new Map<string, string[]>();
    for (const [rpId, units] of roomProductAssignedUnitsMap.entries()) {
      roomProductAssignedUnitIdsMap.set(rpId, Array.from(new Set(units.map((u) => u.roomUnitId))));
    }

    // ---------- daily prices: group by combination and also by date for fast daily-min lookup ----------
    const dailyPricesMap = new Map<string, RoomProductDailySellingPrice[]>(); // key: roomProductId_ratePlanId -> list
    for (const price of dailySellingPrices) {
      const comboKey = `${price.roomProductId}_${price.ratePlanId}`;
      if (!dailyPricesMap.has(comboKey)) dailyPricesMap.set(comboKey, []);
      dailyPricesMap.get(comboKey)!.push(price);
    }

    // ---------- small arrays cached once ----------
    const allIncludedServices = Array.from(includedServiceMap.values());
    const allMandatoryServices = Array.from(mandatoryServiceMap.values());

    // ---------- prepare results container ----------
    const roomProductRatePlanResults = new Map<string, any>();
    const processedKeys = new Set<string>();

    const end4 = performance.now();
    this.logger.debug(`⏱️ room product assigned units: ${((end4 - start4) / 1000).toFixed(3)}s`);

    if (roomProductRatePlanSellabilityMap.size > 0) {
      const start5 = performance.now();
      // ---------- Precompute Amenities & City Tax (async) ----------
      const amenityTasks: Promise<void>[] = [];
      const cityTaxCache = new Map<string, number>();

      let amenitiesResults: Map<
        string,
        {
          inc: { totalAmount: number; details: any[] };
        }
      > = new Map();

      // Compute amenity pricing ONCE globally
      amenityTasks.push(
        (async () => {
          amenitiesResults = await this.processAmenitiesInBatchBulkCombined(
            allIncludedServices, // GLOBAL INCLUDED list
            hotelAmenitiesLookup,
            hotel,
            dates,
            taxSettingList.extrasTaxes,
            totalAdult,
            childAgeList,
            totalPet,
            hotelConfigRoundingMode
          );
        })()
      );

      // Wait for all global tasks
      await Promise.all(amenityTasks);

      // ---------- Build RP → serviceId map (included) ----------
      const rpIncludedServiceIdMap = new Map<string, { includedIds: Set<string> }>();

      for (const rp of roomProductRatePlans) {
        const rpKey = `${rp.roomProductId}_${rp.ratePlanId}`;

        rpIncludedServiceIdMap.set(rpKey, {
          includedIds: new Set([
            ...(roomProductServiceMap.get(rp.roomProductId) ?? []),
            ...(ratePlanServiceMap.get(rp.ratePlanId) ?? [])
          ])
        });
      }

      // ---------- Assign amenity amounts to each RP ----------
      const rpAmenitiesByDate = new Map<
        string,
        {
          inc: { totalAmount: number; details: any[] };
        }
      >();

      const end5 = performance.now();
      this.logger.debug(`⏱️ amenities: ${((end5 - start5) / 1000).toFixed(3)}s`);

      for (const date of dates) {
        const globalResult = amenitiesResults.get(date);
        if (!globalResult) continue;

        const { inc: globalInc } = globalResult;

        for (const rp of roomProductRatePlans) {
          const rpKey = `${rp.roomProductId}_${rp.ratePlanId}`;
          const includedIds = rpIncludedServiceIdMap.get(rpKey)?.includedIds;
          if (!includedIds) continue;

          // Filter ONLY amenities that belong to this RP
          const incDetails = globalInc.details.filter((d) => includedIds.has(d.id));

          // Compute amounts for RP
          const totalInc = incDetails.reduce((sum, x) => sum + x.amount, 0);

          rpAmenitiesByDate.set(`${rpKey};${date}`, {
            inc: { totalAmount: totalInc, details: incDetails }
          });
        }
      }
      // -------------------------
      const dailyPriceByDate = new Map<string, Map<string, any[]>>();

      for (const [key, priceList] of dailyPricesMap.entries()) {
        if (!Array.isArray(priceList) || priceList.length === 0) continue;
        for (const raw of priceList) {
          const p = {
            ...raw,
            date: String(raw.date),
            netPrice: Number(raw.netPrice ?? 0),
            grossPrice: Number(raw.grossPrice ?? 0),
            ratePlanAdjustments: Number(raw.ratePlanAdjustments ?? 0)
          };
          if (!dailyPriceByDate.has(p.date)) dailyPriceByDate.set(p.date, new Map());
          const mp = dailyPriceByDate.get(p.date)!;
          if (!mp.has(key)) mp.set(key, []);
          mp.get(key)!.push(p);
        }
      }

      // -------------------------
      // 3) Caches for expensive computations (amenities and city tax)
      // -------------------------
      const start6 = performance.now();
      for (const date of dates) {
        const dpDateMap = dailyPriceByDate.get(date);
        if (!dpDateMap) continue; // no prices for date
        const minByDate = new Map<
          string,
          {
            totalGrossPrice: number;
            entry: LowestPriceResponseDto;
          }
        >();

        for (const roomProductRatePlan of roomProductRatePlans) {
          const key = `${roomProductRatePlan.roomProductId}_${roomProductRatePlan.ratePlanId}`;
          const key2 = `${date};${roomProductRatePlan.roomProductId};${roomProductRatePlan.ratePlanId}`;
          const isSellable = roomProductRatePlanSellabilityMap.get(key2);
          if (!isSellable) continue;

          const dailyPricesForThisCombination = dailyPricesMap.get(key) || [];
          if (dailyPricesForThisCombination.length === 0) continue;

          for (const p of dailyPricesForThisCombination) {
            if (p.date !== date) continue; // only consider current date

            // ---------- compute baseNet, baseGross and adjustments ----------
            let baseNetPrice = Number(p.netPrice ?? 0);
            let baseGrossPrice = Number(p.grossPrice ?? 0);
            let totalRatePlanAdjustments = Number(p.ratePlanAdjustments ?? 0);

            // ---------- assigned units ----------
            const assignedUnits =
              roomProductAssignedUnitIdsMap.get(roomProductRatePlan.roomProductId) || [];
            const cityTaxCacheKey = `${key}|units:${assignedUnits.length}|ad:${totalAdult}|ch:${childAgeList?.join(',') || ''}|pet:${totalPet}`;

            if (isIncludeCityTax) {
              // ---------- city tax (must run per combination because it uses dailySellingRateList) ----------
              const cityTaxCalculatedResult = this.cityTaxCalculateService.calculateBookingCityTax({
                adults: totalAdult,
                childrenAgeList: childAgeList,
                totalRooms: assignedUnits.length,
                hotelCityTaxList: hotelCityTaxes,
                pricingDecimalRoundingRule: {
                  roundingMode: hotelConfigRoundingMode.roundingMode,
                  decimalUnits: hotelConfigRoundingMode.decimalPlaces
                },
                hotelCityTaxAgeGroups: hotelCityTaxAgeGroups,
                dailySellingRateList: [p as any]
              });
              const cityTaxTotalAmount = cityTaxCalculatedResult.totalCityTaxAmount ?? 0;
              cityTaxCache.set(cityTaxCacheKey, cityTaxTotalAmount);
            }

            const cityTaxAmount = isIncludeCityTax ? (cityTaxCache.get(cityTaxCacheKey) ?? 0) : 0;
            baseNetPrice += cityTaxAmount;
            baseGrossPrice += cityTaxAmount;

            if (baseNetPrice <= 0) continue;

            // Amenities
            const { inc: amenityIncCalc } = rpAmenitiesByDate.get(`${key};${date}`)!;
            const totalExtraServiceAmount = Number(amenityIncCalc.totalAmount ?? 0);

            // Extra occupancy surcharge
            const extraOccPrices =
              extraOccupancySurchargePriceDailyMap.get(
                `${date};${roomProductRatePlan.roomProductId};${roomProductRatePlan.ratePlanId}`
              ) || [];
            const extraOccupancySurchargeAmount = extraOccPrices.reduce(
              (sum, pr) => sum + Number(pr.extraOccupancySurcharge ?? 0),
              0
            );

            // ---------- final totals with rounding ----------
            const totalNetPrice = DecimalRoundingHelper.sumWithRounding(
              [baseNetPrice, totalExtraServiceAmount, extraOccupancySurchargeAmount],
              hotelConfigRoundingMode.roundingMode,
              hotelConfigRoundingMode.decimalPlaces
            );

            const totalGrossPrice = DecimalRoundingHelper.sumWithRounding(
              [baseGrossPrice, totalExtraServiceAmount, extraOccupancySurchargeAmount],
              hotelConfigRoundingMode.roundingMode,
              hotelConfigRoundingMode.decimalPlaces
            );

            if (
              !minByDate.has(date) ||
              totalGrossPrice < (minByDate.get(date)!.totalGrossPrice ?? Infinity)
            ) {
              minByDate.set(date, {
                totalGrossPrice: totalGrossPrice,
                entry: {
                  roomProductId: roomProductRatePlan.roomProductId,
                  ratePlanId: roomProductRatePlan.ratePlanId,
                  netPrice: totalNetPrice,
                  grossPrice: totalGrossPrice,
                  adjustmentRate: totalRatePlanAdjustments,
                  price: totalGrossPrice,
                  date: date
                }
              });
            }
          }
        }

        // now we have the lowest price for this date
        let chosenDailyRate = minByDate.get(date)?.entry;
        if (!chosenDailyRate) {
          chosenDailyRate = {
            roomProductId: '',
            ratePlanId: '',
            netPrice: 0,
            grossPrice: 0,
            adjustmentRate: 0,
            price: 0,
            date: date,
            status: DateBookingStatus.SOLD_OUT
          };
        }

        // // ---------- assemble result ----------
        roomProductRatePlanResults.set(date, {
          ...chosenDailyRate
        });
      }

      const end6 = performance.now();
      this.logger.debug(`⏱️ process pricing: ${((end6 - start6) / 1000).toFixed(3)}s`);
    } else {
      // ---------- main loop ----------
      for (const roomProductRatePlan of roomProductRatePlans) {
        const key = `${roomProductRatePlan.roomProductId}_${roomProductRatePlan.ratePlanId}`;

        if (processedKeys.has(key)) {
          continue;
        }
        processedKeys.add(key);

        // Get daily selling prices for this specific combination using Map lookup
        const dailyPricesForThisCombination = dailyPricesMap.get(key) || [];
        if (dailyPricesForThisCombination.length === 0) continue;

        // If useDaily = true, for each calendar date pick the lowest price entry for that date
        let chosenDailyRates: any[] = dailyPricesForThisCombination;

        // ---------- compute baseNet, baseGross and adjustments in one pass ----------
        let baseNetPrice = 0;
        let baseGrossPrice = 0;
        let totalRatePlanAdjustments = 0;

        for (const p of chosenDailyRates) {
          baseNetPrice += Number(p.netPrice ?? p.net ?? 0);
          baseGrossPrice += Number(p.grossPrice ?? p.gross ?? 0);
          totalRatePlanAdjustments += Number(p.ratePlanAdjustments ?? 0);
        }

        // ---------- assigned units ----------
        const roomProductAssignedUnitIds =
          roomProductAssignedUnitIdsMap.get(roomProductRatePlan.roomProductId) || [];

        // ---------- city tax (must run per combination because it uses dailySellingRateList) ----------
        const cityTaxCalculatedResult = this.cityTaxCalculateService.calculateBookingCityTax({
          adults: totalAdult,
          childrenAgeList: childAgeList,
          totalRooms: roomProductAssignedUnitIds.length,
          hotelCityTaxList: hotelCityTaxes,
          hotelCityTaxAgeGroups: hotelCityTaxAgeGroups,
          pricingDecimalRoundingRule: {
            roundingMode: hotelConfigRoundingMode.roundingMode,
            decimalUnits: hotelConfigRoundingMode.decimalPlaces
          },
          dailySellingRateList: chosenDailyRates
        });
        const cityTaxTotalAmount = cityTaxCalculatedResult.totalCityTaxAmount ?? 0;

        if (isIncludeCityTax) {
          baseNetPrice += cityTaxTotalAmount;
          baseGrossPrice += cityTaxTotalAmount;
        }

        if (baseNetPrice <= 0) continue;

        // ---------- prepare included & mandatory service lists (use Set for O(1) membership) ----------

        let followRatePlanId = roomProductRatePlan.ratePlanId;
        const masterRatePlanId = ratePlanDerivedSettings.find(
          (setting) =>
            setting.ratePlanId === roomProductRatePlan.ratePlanId &&
            setting.followDailyIncludedAmenity
        )?.derivedRatePlanId;
        if (masterRatePlanId) {
          followRatePlanId = masterRatePlanId;
        }

        const { includedIdMap: ratePlanIncludedIdMap } =
          this.amenityDataProviderService.getRatePlanAmenityDailyOrDefault({
            ratePlanId: followRatePlanId,
            dates,
            ratePlanExtraServices: ratePlanExtraServices.filter(
              (s) => s.ratePlanId === followRatePlanId
            ),
            dailyExtraServices: dailyExtraServices.filter((s) => s.ratePlanId === followRatePlanId),
            hotelAmenities: Array.from(hotelAmenitiesMap.byId.values())
          });

        const includedIds = new Set<string>([
          ...(roomProductServiceMap.get(roomProductRatePlan.roomProductId) || []),
          ...ratePlanIncludedIdMap.keys()
        ]);

        const mandatoryIds = new Set<string>([
          ...(mandatoryRoomProductServiceMap.get(roomProductRatePlan.roomProductId) || []),
          ...(mandatoryRatePlanServiceMap.get(roomProductRatePlan.ratePlanId) || [])
        ]);

        const filteredIncludedServices = allIncludedServices
          .filter((s) => includedIds.has(s.id))
          .map((item) => ({
            ...item,
            includedDates: ratePlanIncludedIdMap.get(item.id)
          }));
        const filteredMandatoryServices = allMandatoryServices.filter((s) =>
          mandatoryIds.has(s.id)
        );

        // ---------- process amenities in parallel (included + mandatory) ----------
        const [amenityCalculations, mandatoryAmenityCalculations] = await Promise.all([
          this.processAmenitiesInBatch(
            filteredIncludedServices,
            hotelAmenitiesLookup,
            hotel,
            fromDate,
            toDate,
            taxSettingList.extrasTaxes,
            totalAdult,
            childAgeList,
            totalPet,
            hotelConfigRoundingMode
          ),
          this.processAmenitiesInBatch(
            filteredMandatoryServices,
            mandatoryAmenitiesLookup,
            hotel,
            fromDate,
            toDate,
            taxSettingList.extrasTaxes,
            totalAdult,
            childAgeList,
            totalPet,
            hotelConfigRoundingMode
          )
        ]);

        const totalExtraServiceAmount = amenityCalculations.totalAmount ?? 0;
        const extraServiceDetails = amenityCalculations.details ?? [];

        const totalMandatoryExtraServiceAmount = mandatoryAmenityCalculations.totalAmount ?? 0;
        const extraServiceMandatoryDetails = mandatoryAmenityCalculations.details ?? [];

        // ---------- extra occupancy surcharge ----------
        const extraOccupancySurchargePriceInRoomProductRatePlan =
          extraOccupancySurchargePriceMap.get(
            `${roomProductRatePlan.roomProductId}-${roomProductRatePlan.ratePlanId}`
          );
        const extraOccupancySurchargeAmount =
          (extraOccupancySurchargePriceInRoomProductRatePlan ?? []).reduce(
            (sum, price) => sum + (Number(price.extraOccupancySurcharge) || 0),
            0
          ) || 0;

        // ---------- final totals with rounding ----------
        const totalNetPrice = DecimalRoundingHelper.sumWithRounding(
          [baseNetPrice, totalExtraServiceAmount, extraOccupancySurchargeAmount],
          hotelConfigRoundingMode.roundingMode,
          hotelConfigRoundingMode.decimalPlaces
        );

        const totalGrossPrice = DecimalRoundingHelper.sumWithRounding(
          [baseGrossPrice, totalExtraServiceAmount, extraOccupancySurchargeAmount],
          hotelConfigRoundingMode.roundingMode,
          hotelConfigRoundingMode.decimalPlaces
        );

        const averageDailyRate =
          chosenDailyRates.length > 0
            ? DecimalRoundingHelper.conditionalRounding(
                totalGrossPrice / chosenDailyRates.length,
                hotelConfigRoundingMode.roundingMode,
                hotelConfigRoundingMode.decimalPlaces
              )
            : 0;

        // ---------- assemble result ----------
        roomProductRatePlanResults.set(key, {
          roomProductId: roomProductRatePlan.roomProductId,
          ratePlanId: roomProductRatePlan.ratePlanId,
          baseNetPrice,
          baseGrossPrice,
          totalCityTaxAmount: cityTaxTotalAmount,
          totalExtraServiceAmount,
          totalMandatoryExtraServiceAmount,
          totalNetPrice,
          totalNetPriceBeforeAdjustment: totalNetPrice - totalRatePlanAdjustments,
          totalGrossPrice,
          totalGrossPriceBeforeAdjustment: totalGrossPrice - totalRatePlanAdjustments,
          averageDailyRate,
          extraServiceDetails,
          extraServiceMandatoryDetails,
          dailyPricesCount: chosenDailyRates.length
        });
      }
    }

    const results = Array.from(roomProductRatePlanResults.values());

    const end0 = performance.now();
    this.logger.debug(
      `⏱️ Process Room Product Rate Plan Pricing: ${((end0 - start0) / 1000).toFixed(3)}s`
    );

    // NO CACHING for pricing/rate data as per requirement
    return results;
  }

  /**
   * Process room product rate plan pricing with booking status information
   * Returns results for all dates including non-bookable ones with their status
   * OPTIMIZED: Pre-builds indexes to avoid nested loops
   */
  async processRoomProductRatePlanPricingWithStatus(
    hotel: Hotel,
    roomProductRatePlans: RoomProductRatePlan[],
    fromDate: string,
    toDate: string,
    totalAdult: number,
    childAgeList: number[],
    totalPet: number,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number },
    hotelAmenitiesMap: {
      byId: Map<string, HotelAmenity>;
      byCode: Map<string, HotelAmenity>;
    },
    isIncludeCityTax?: boolean,
    roomProductRatePlanSellabilityMap: Map<string, boolean> = new Map<string, boolean>(),
    availabilityPerDateMap: Map<string, number> = new Map<string, number>(),
    restrictionIndexes?: {
      houseLevelByDate: Map<string, Restriction[]>;
      ratePlanByDate: Map<string, Map<string, Restriction[]>>;
      roomProductByDate: Map<string, Map<string, Restriction[]>>;
    }
  ): Promise<LowestPriceResponseDto[]> {
    // Early exit if no room product rate plans
    if (!roomProductRatePlans || roomProductRatePlans.length === 0) {
      return [];
    }

    // Generate all dates once
    const dates = Helper.generateDateRange(fromDate, toDate);

    const start1 = performance.now();
    // 1️⃣ Call the existing pricing method for dates with availability
    const sellableResults = await this.processRoomProductRatePlanPricing(
      hotel,
      roomProductRatePlans,
      fromDate,
      toDate,
      totalAdult,
      childAgeList,
      totalPet,
      hotelConfigRoundingMode,
      hotelAmenitiesMap,
      isIncludeCityTax,
      roomProductRatePlanSellabilityMap
    );

    const end1 = performance.now();
    this.logger.debug(
      `⏱️ Process Room Product Rate Plan Pricing: ${((end1 - start1) / 1000).toFixed(3)}s`
    );

    // 2️⃣ Build sellable results map (keep lowest price per date)
    const sellableResultsMap = new Map<string, any>();
    for (const result of sellableResults) {
      const existing = sellableResultsMap.get(result.date);
      if (!existing || result.grossPrice < existing.grossPrice) {
        sellableResultsMap.set(result.date, result);
      }
    }

    // 3️⃣ Build results with DATE-LEVEL restriction analysis
    const allResults: LowestPriceResponseDto[] = new Array(dates.length);

    const start2 = performance.now();
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const pricingResult = sellableResultsMap.get(date);
      const roomProductRatePlanSellabilities: {
        roomProductId: string;
        ratePlanId: string;
        isSellable: boolean;
      }[] = [];

      // get sellability for this date
      for (const [mapKey, sellable] of roomProductRatePlanSellabilityMap) {
        if (mapKey.startsWith(`${date};`)) {
          if (sellable) {
            roomProductRatePlanSellabilities.push({
              roomProductId: mapKey.split(';')[1],
              ratePlanId: mapKey.split(';')[2],
              isSellable: true
            });
          }
        }
      }

      if (pricingResult) {
        // 🎯 Date has pricing - apply restriction analysis at DATE level
        const availability =
          availabilityPerDateMap.get(`${date};${pricingResult.roomProductId}`) ?? 0;

        let restrictionAnalysis: RestrictionAnalysisResult | null = null;

        if (restrictionIndexes) {
          restrictionAnalysis = this.analyzeRestrictionsForDateOnly(
            date,
            restrictionIndexes,
            1,
            dates,
            roomProductRatePlanSellabilityMap
          );
        }

        // Determine final status: SOLD_OUT > restriction status > BOOKABLE
        let finalStatus = DateBookingStatus.BOOKABLE;
        let restrictions: RestrictionDetails | undefined;
        let nextBookableDate: string | undefined;

        if (availability <= 0) {
          finalStatus = DateBookingStatus.SOLD_OUT;
        } else if (restrictionAnalysis) {
          finalStatus = restrictionAnalysis.status;
          restrictions = restrictionAnalysis.restrictions;
          nextBookableDate = restrictionAnalysis.nextBookableDate;
        }

        allResults[i] = {
          ...pricingResult,
          status: finalStatus,
          availableRooms: availability >= 1 ? 1 : 0,
          restrictions,
          nextBookableDate,
          normalized: restrictionAnalysis?.normalized,
          ratePlanSellableIds: restrictionAnalysis?.ratePlanSellableIds || [],
          roomProductRatePlanSellabilities
        };
      } else {
        let maxAvailability = 0;
        let bestRoomProductId = '';
        let bestRatePlanId = '';

        for (const rp of roomProductRatePlans) {
          const avail = availabilityPerDateMap.get(`${date};${rp.roomProductId}`) ?? 0;
          if (avail > maxAvailability) {
            maxAvailability = avail;
            bestRoomProductId = rp.roomProductId;
            bestRatePlanId = rp.ratePlanId;
          }
        }

        if (maxAvailability > 0 && restrictionIndexes) {
          const restrictionAnalysis = this.analyzeRestrictionsForDateOnly(
            date,
            restrictionIndexes,
            1,
            dates
          );

          allResults[i] = {
            date,
            roomProductId: bestRoomProductId,
            ratePlanId: bestRatePlanId,
            price: null,
            netPrice: null,
            grossPrice: null,
            adjustmentRate: null,
            status: restrictionAnalysis.isBookable
              ? DateBookingStatus.NOT_SELLABLE
              : restrictionAnalysis.status,
            availableRooms: maxAvailability,
            restrictions: restrictionAnalysis.restrictions,
            nextBookableDate: restrictionAnalysis.nextBookableDate
          };
        } else {
          allResults[i] = {
            date,
            roomProductId: bestRoomProductId || '',
            ratePlanId: bestRatePlanId || '',
            price: null,
            netPrice: null,
            grossPrice: null,
            adjustmentRate: null,
            status: DateBookingStatus.SOLD_OUT,
            availableRooms: 0,
            restrictions: undefined,
            nextBookableDate: undefined
          };
        }
      }
    }

    const end2 = performance.now();
    this.logger.debug(
      `⏱️ Process Room Product Rate Plan Pricing With Status: ${((end2 - start2) / 1000).toFixed(3)}s`
    );

    return allResults;
  }

  /**
   * Optimized method to categorize extra services in a single pass
   */
  private categorizeExtraServices(params: {
    dailyExtraServices: RatePlanDailyExtraService[];
    ratePlanExtraServices: RatePlanExtraService[];
    roomProductExtraServices: RoomProductExtra[];
    hotelAmenitiesMap: { byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> };
  }) {
    const {
      dailyExtraServices,
      ratePlanExtraServices,
      roomProductExtraServices,
      hotelAmenitiesMap
    } = params;

    const includedRatePlanServices: RatePlanExtraService[] = [];
    const mandatoryRatePlanServices: RatePlanExtraService[] = [];
    const includedRoomProductServices: RoomProductExtra[] = [];
    const mandatoryRoomProductServices: RoomProductExtra[] = [];

    const dailyExtraServiceMap = groupByToMap(dailyExtraServices, (service) => service.ratePlanId);

    for (const [ratePlanId, dailyExtraServices] of dailyExtraServiceMap.entries()) {
      const dailyExtraCodes = Array.from(
        new Set(dailyExtraServices.map((service) => service.extraServiceCodeList).flat())
      );
      const dailyExtraAmenities = dailyExtraCodes
        .map((code) => hotelAmenitiesMap.byCode.get(code))
        .filter((i) => i !== undefined);

      if (dailyExtraAmenities.length > 0) {
        for (const amenity of dailyExtraAmenities) {
          includedRatePlanServices.push({
            ratePlanId,
            extra: amenity,
            type: RatePlanExtraServiceType.INCLUDED,
            extrasId: amenity.id
          } as RatePlanExtraService);
        }
      }
    }

    // Single pass through rate plan services
    for (const service of ratePlanExtraServices) {
      if (service.type === RatePlanExtraServiceType.INCLUDED) {
        includedRatePlanServices.push(service);
      } else if (service.type === RatePlanExtraServiceType.MANDATORY) {
        mandatoryRatePlanServices.push(service);
      }
    }

    // Single pass through room product services
    for (const service of roomProductExtraServices) {
      if (service.type === RoomProductExtraType.INCLUDED) {
        includedRoomProductServices.push(service);
      } else if (service.type === RoomProductExtraType.MANDATORY) {
        mandatoryRoomProductServices.push(service);
      }
    }

    return {
      includedRatePlanServices,
      mandatoryRatePlanServices,
      includedRoomProductServices,
      mandatoryRoomProductServices
    };
  }

  /**
   * Optimized service map creation using reduce
   */
  private createServiceMap(
    services: any[],
    keyField: string,
    valueField: string
  ): Map<string, string[]> {
    return services.reduce((map, service) => {
      const key = this.getNestedValue(service, keyField);
      const value = this.getNestedValue(service, valueField);

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(value);
      return map;
    }, new Map<string, string[]>());
  }

  /**
   * Helper to get nested object values (e.g., 'extra.id')
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Optimized version of getAllUniqueExtraServices
   */
  private async getAllUniqueExtraServicesOptimized(
    dailyExtraServices: RatePlanDailyExtraService[],
    ratePlanExtraServices: any[],
    roomProductExtraServices: any[],
    hotelAmenitiesMap: { byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> }
  ): Promise<Map<string, HotelAmenity>> {
    const serviceMap = new Map<string, HotelAmenity>();

    // Process daily extra services
    for (const dailyService of dailyExtraServices) {
      if (dailyService.extraServiceCodeList && dailyService.extraServiceCodeList.length > 0) {
        const amenities = dailyService.extraServiceCodeList
          .map((code) => hotelAmenitiesMap.byCode.get(code))
          .filter((i) => i !== undefined);
        if (amenities && amenities.length > 0) {
          for (const amenity of amenities) {
            serviceMap.set(amenity.id, amenity);
          }
        }
      }
    }

    // Process rate plan extra services
    for (const ratePlanService of ratePlanExtraServices) {
      if (ratePlanService.extrasId) {
        const amenity = hotelAmenitiesMap.byId.get(ratePlanService.extrasId);
        if (amenity) {
          serviceMap.set(ratePlanService.extrasId, amenity);
        }
      }
    }

    // Process room product extra services
    for (const roomProductService of roomProductExtraServices) {
      if (roomProductService.extra?.id) {
        const amenity = hotelAmenitiesMap.byId.get(roomProductService.extra.id);
        if (amenity) {
          serviceMap.set(roomProductService.extra.id, amenity);
        }
      }
    }

    return serviceMap;
  }

  /**
   * Batch process amenities to reduce function call overhead and improve performance
   */
  private async processAmenitiesInBatch(
    serviceMap: (HotelAmenity & { includedDates?: string[] })[],
    amenitiesLookup: Map<string, any>,
    hotel: Hotel,
    fromDate: string,
    toDate: string,
    taxSettingList: any[],
    totalAdult: number,
    childAgeList: number[],
    totalPet: number,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number }
  ): Promise<{ totalAmount: number; details: any[] }> {
    let totalAmount = 0;
    const details: any[] = [];

    // Create a local cache for this batch to avoid recalculating same amenities
    const batchCache = new Map<string, any>();

    for (const extraService of serviceMap) {
      const amenity = amenitiesLookup.get(extraService.id);
      if (!extraService.id || !amenity) {
        continue;
      }

      const cacheKey = `${amenity.id}_${fromDate}_${toDate}_${totalAdult}_${childAgeList.join(',')}_${totalPet}`;

      let calculatedAmenity = batchCache.get(cacheKey);
      if (!calculatedAmenity) {
        calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
          {
            hotel,
            hotelAmenity: { ...amenity },
            includedDates: extraService.includedDates,
            fromDate,
            toDate,
            taxSettingList: taxSettingList.filter((t) => t.serviceCode === amenity.code),
            serviceChargeRate: 0,
            serviceChargeTaxRate: 0,
            adult: totalAdult,
            childrenAgeList: childAgeList,
            allocatedPets: totalPet
          },
          hotelConfigRoundingMode
        );
        batchCache.set(cacheKey, calculatedAmenity);
      }

      const amenityAmount = Number(calculatedAmenity.totalGrossAmount) || 0;
      totalAmount += amenityAmount;
      details.push({
        id: amenity.id,
        code: amenity.code,
        name: amenity.name,
        amount: amenityAmount,
        pricingUnit: amenity.pricingUnit!,
        translations: amenity.translations,
        includedDates: calculatedAmenity.includedDates
      });
    }

    return { totalAmount, details };
  }

  private async processAmenitiesInBatchBulkCombined(
    includedServices: any[],
    includedLookup: Map<string, any>,
    hotel: Hotel,
    dates: string[],
    taxSettingList: any[],
    totalAdult: number,
    childAgeList: number[],
    totalPet: number,
    hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number }
  ): Promise<Map<string, { inc: { totalAmount: number; details: any[] } }>> {
    const results = new Map<string, { inc: { totalAmount: number; details: any[] } }>();

    for (const date of dates) {
      let totalInc = 0;
      const incDetails: any[] = [];

      const batchCache = new Map<string, any>();

      const processService = async (serviceList: any[], lookup: Map<string, any>) => {
        for (const extraService of serviceList) {
          const amenity = lookup.get(extraService.id);
          if (!extraService.id || !amenity) continue;

          const cacheKey = `${amenity.id}_${date}_${totalAdult}_${childAgeList.join(',')}_${totalPet}`;
          let calculatedAmenity = batchCache.get(cacheKey);

          if (!calculatedAmenity) {
            calculatedAmenity = await this.calculateAmenityPricingService.calculatePricingAmenity(
              {
                hotel,
                hotelAmenity: { ...amenity },
                fromDate: date,
                toDate: date,
                taxSettingList: taxSettingList.filter((t) => t.serviceCode === amenity.code),
                serviceChargeRate: 0,
                serviceChargeTaxRate: 0,
                adult: totalAdult,
                childrenAgeList: childAgeList,
                allocatedPets: totalPet
              },
              hotelConfigRoundingMode
            );
            batchCache.set(cacheKey, calculatedAmenity);
          }

          const amenityAmount = Number(calculatedAmenity.totalGrossAmount) || 0;
          const detailsObj = {
            id: amenity.id,
            code: amenity.code,
            name: amenity.name,
            amount: amenityAmount,
            pricingUnit: amenity.pricingUnit!,
            translations: amenity.translations,
            includedDates: calculatedAmenity.includedDates
          };

          totalInc += amenityAmount;
          incDetails.push(detailsObj);
        }
      };

      await processService(includedServices, includedLookup);

      results.set(date, {
        inc: { totalAmount: totalInc, details: incDetails }
      });
    }

    return results;
  }

  /**
   * Get hotel amenities map to avoid N+1 queries
   * Creates maps for both ID-based and code-based lookups
   */
  private async getHotelAmenitiesMap(
    hotelId: string,
    isIse: boolean = false
  ): Promise<{ byId: Map<string, HotelAmenity>; byCode: Map<string, HotelAmenity> }> {
    // Combine all identifiers for the query
    const hotelAmenities = await this.hotelService.getHotelAmenities(hotelId, isIse);

    const byIdMap = new Map();
    const byCodeMap = new Map();

    for (const amenity of hotelAmenities) {
      byIdMap.set(amenity.id, amenity);
      byCodeMap.set(amenity.code, amenity);
    }

    return { byId: byIdMap, byCode: byCodeMap };
  }
  /**
   * Get daily selling prices for rate plans and room products
   * Query executed using raw SQL on a separate connection to avoid transaction locking
   * This ensures the query never waits for locks from other transactions
   */
  private async getDailySellingPrices(
    hotelId: string,
    ratePlanIds: string[],
    roomProductIds: string[],
    fromDate: string,
    toDate: string
  ): Promise<RoomProductDailySellingPrice[]> {
    const start = performance.now();

    // Use a query runner with a separate connection that's not in any transaction
    // This ensures the query executes in autocommit mode and never waits for locks
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Execute raw SQL on a connection outside any transaction
      // PostgreSQL reads committed data immediately without waiting for locks
      const queryResult = await queryRunner.query(
        `
        SELECT 
          d.id,
          d.date,
          d.net_price as "netPrice",
          d.gross_price as "grossPrice",
          d.rate_plan_adjustments as "ratePlanAdjustments",
          d.rate_plan_id as "ratePlanId",
          d.room_product_id as "roomProductId"
        FROM room_product_daily_selling_price d
        WHERE d.hotel_id = $1
          AND d.rate_plan_id = ANY($2::uuid[])
          AND d.date BETWEEN $3 AND $4
          AND d.room_product_id = ANY($5::uuid[])
          AND d.gross_price > 0
        ORDER BY d.date ASC, d.gross_price ASC
        `,
        [hotelId, ratePlanIds, fromDate, toDate, roomProductIds]
      );

      // Map raw results to entity instances
      const result = queryResult.map((row: any) => {
        const entity = new RoomProductDailySellingPrice();
        entity.id = row.id;
        entity.date = row.date;
        entity.netPrice = row.netPrice;
        entity.grossPrice = row.grossPrice;
        entity.ratePlanAdjustments = row.ratePlanAdjustments;
        entity.ratePlanId = row.ratePlanId;
        entity.roomProductId = row.roomProductId;
        return entity;
      });

      const end = performance.now();
      this.logger.debug(
        `⏱️ getDailySellingPrices ${fromDate} - ${toDate} : ${((end - start) / 1000).toFixed(3)}s`
      );

      return result;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get daily extra services for rate plans
   */
  private async getDailyExtraServices(
    hotelId: string,
    ratePlanIds: string[],
    dates: string[]
  ): Promise<RatePlanDailyExtraService[]> {
    // cache 1h
    return this.ratePlanDailyExtraServiceRepository.find({
      where: {
        hotelId,
        ratePlanId: In(ratePlanIds),
        date: In(dates)
      },
      select: {
        date: true,
        extraServiceCodeList: true,
        ratePlanId: true
      }
    });
  }

  private async getRatePlanDerivedSettings(
    ratePlanIds: string[]
  ): Promise<RatePlanDerivedSetting[]> {
    return this.ratePlanDerivedSettingRepository.find({
      where: {
        ratePlanId: In(ratePlanIds)
      },
      select: {
        id: true,
        ratePlanId: true,
        derivedRatePlanId: true,
        followDailyCxlPolicy: true,
        followDailyPaymentTerm: true,
        followDailyRestriction: true,
        followDailyIncludedAmenity: true,
        followDailyRoomProductAvailability: true
      }
    });
  }

  /**
   * Get rate plan fallback extra services
   */
  private async getRatePlanExtraServices(ratePlanIds: string[]): Promise<RatePlanExtraService[]> {
    return this.ratePlanExtraServiceRepository.find({
      where: {
        ratePlanId: In(ratePlanIds)
      },
      select: {
        extrasId: true,
        ratePlanId: true,
        type: true
      }
    });
  }

  /**
   * Get room product extra services
   */
  private async getRoomProductExtraServices(
    roomProductIds: string[],
    hotelId: string
  ): Promise<RoomProductExtra[]> {
    return this.roomProductExtraRepository.find({
      where: {
        roomProductId: In(roomProductIds),
        hotelId
      },
      relations: ['extra'],
      select: {
        roomProductId: true,
        type: true,
        extra: {
          id: true,
          code: true
        }
      }
    });
  }

  async getSamePeriodReservationCount(
    hotelId: string,
    fromDate: string,
    toDate: string
  ): Promise<{ roomProductId: string; numberOfReservations: number; features?: string | null }[]> {
    // Calculate the date range: past 6 months → next 6 months
    const today = new Date(fromDate);
    const startDate = subMonths(today, 6); // 6 months ago
    const endDate = addMonths(today, 6); // 6 months ahead

    const sql = `
    SELECT 
      r.room_product_id AS "roomProductId",
      r.matched_feature AS "features",
      COUNT(*) AS "reservationCount"
    FROM reservation r
    WHERE r.hotel_id = $1
      AND r.arrival >= $2
      AND r.arrival <= $3
    GROUP BY r.room_product_id, r.matched_feature
  `;

    const params = [
      hotelId,
      format(startDate, DATE_FORMAT),
      format(endDate, DATE_FORMAT)
      // DistributionChannel.GV_SALES_ENGINE
    ];

    const result = await this.reservationRepository.query(sql, params);

    return result.map((row) => ({
      roomProductId: row.roomProductId,
      numberOfReservations: parseInt(row.reservationCount, 10),
      features: row.features
    }));
  }

  async getSamePeriodReservationCountWithoutFeatures(
    hotelId: string,
    fromDate: string,
    toDate: string
  ): Promise<any[]> {
    const dayOffset = 7;

    // Assume start and end are Date objects
    const adjustedStartDate = subDays(subYears(new Date(fromDate), 1), dayOffset);
    const adjustedEndDate = addDays(subYears(new Date(toDate), 1), dayOffset);
    const sql = `
      SELECT 
        r.room_product_id AS "roomProductId",
        COUNT(*) AS "reservationCount"
      FROM reservation r
      WHERE r.hotel_id = $1
        AND r.arrival >= $2
        AND r.departure <= $3
        AND r.channel = $4
        AND r.status IN ($5, $6, $7, $8)
      GROUP BY r.room_product_id
    `;

    const params = [
      hotelId,
      Helper.parseDateToUTC(format(adjustedStartDate, DATE_FORMAT)),
      Helper.parseDateToUTC(format(adjustedEndDate, DATE_FORMAT)),
      DistributionChannel.GV_SALES_ENGINE,
      ReservationStatusEnum.CONFIRMED,
      ReservationStatusEnum.COMPLETED,
      ReservationStatusEnum.RESERVED,
      ReservationStatusEnum.CANCELLED
    ];

    return this.reservationRepository.query(sql, params);
  }

  buildRecommendationHistory(
    samePeriodReservationCountByProductCode: {
      roomProductId: string;
      numberOfReservations: number;
    }[],
    totalBookingHistorySamePeriods: {
      roomProductId: string;
      numberOfReservations: number;
      features?: string | null;
    }[]
  ): {
    bookingHistory: RecommendationBookingHistoryDto[];
    featureHistory: RecommendationFeatureHistoryDto[];
  } {
    const bookingHistory: RecommendationBookingHistoryDto[] = [];

    // First loop
    for (const report of samePeriodReservationCountByProductCode) {
      bookingHistory.push({
        roomProductId: report.roomProductId,
        sameBookingPeriod: report.numberOfReservations,
        totalBookingHistoryTime: 0
      });
    }

    // Second loop
    for (const report of totalBookingHistorySamePeriods) {
      let recommendationBookingHistory: RecommendationBookingHistoryDto = {
        roomProductId: report.roomProductId,
        sameBookingPeriod: 0,
        totalBookingHistoryTime: report.numberOfReservations
      };

      const existed = bookingHistory.find((b) => b.roomProductId === report.roomProductId);

      if (existed) {
        recommendationBookingHistory = {
          roomProductId: report.roomProductId,
          sameBookingPeriod: existed.sameBookingPeriod,
          totalBookingHistoryTime: report.numberOfReservations
        };

        // Replace existed
        const idx = bookingHistory.indexOf(existed);
        if (idx !== -1) bookingHistory.splice(idx, 1);
      }

      bookingHistory.push(recommendationBookingHistory);
    }

    // Feature aggregation
    const featureSumAggregatedByCode: Record<string, number> = {};

    totalBookingHistorySamePeriods
      .filter((r) => r.features && r.features.trim() !== '')
      .flatMap((r) => r.features!.split(','))
      .forEach((feature) => {
        featureSumAggregatedByCode[feature] = (featureSumAggregatedByCode[feature] || 0) + 1;
      });

    const featureHistory: RecommendationFeatureHistoryDto[] = Object.entries(
      featureSumAggregatedByCode
    ).map(([code, count]) => ({ code, count }));

    return {
      bookingHistory,
      featureHistory
    };
  }

  async getNearestBookableDate(payload: { hotelCode: string; fromDate: string }) {
    const { hotelCode, fromDate } = payload;

    if (!hotelCode || !fromDate) {
      return {
        checkIn: format(new Date(fromDate), DATE_FORMAT),
        checkOut: format(addDays(new Date(fromDate), 1), DATE_FORMAT),
        stayNights: 1
      };
    }

    const hotel = await this.iseRecommendationService.getCachedHotel(hotelCode);
    if (!hotel) {
      return {
        checkIn: format(new Date(fromDate), DATE_FORMAT),
        checkOut: format(addDays(new Date(fromDate), 1), DATE_FORMAT),
        stayNights: 1
      };
    }

    const hotelConfiguration = await this.iseRecommendationService.getCachedHotelConfig(hotel.id);

    // Allowed list
    const allowedRoomProductTypeList = new Set();
    let defaultPax = 1;
    let defaultStayNight = 1;

    if (hotelConfiguration.length > 0) {
      hotelConfiguration.forEach((config) => {
        switch (config.configType) {
          case HotelConfigurationTypeEnum.DEFAULT_PAX:
            defaultPax = config.configValue?.value;
            break;
          case HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT:
            defaultStayNight = Number(config.configValue?.value);
            break;

          case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING:
            const metadata = config.configValue?.metadata as Record<string, any>;
            if (!metadata) return [];

            if (metadata['MOST_POPULAR']) {
              Object.keys(metadata['MOST_POPULAR']).forEach((key) => {
                if (metadata['MOST_POPULAR'][key] === true) {
                  allowedRoomProductTypeList.add(key as RoomProductType);
                }
              });
            }
            if (metadata['LOWEST_PRICE']) {
              Object.keys(metadata['LOWEST_PRICE']).forEach((key) => {
                if (metadata['LOWEST_PRICE'][key] === true) {
                  allowedRoomProductTypeList.add(key as RoomProductType);
                }
              });
            }
            break;

          case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING:
            const directListConfig = config.configValue?.metadata as Record<string, any>;

            Object.keys(directListConfig).forEach((key) => {
              if (directListConfig[key] === true) {
                allowedRoomProductTypeList.add(key as RoomProductType);
              }
            });
            break;
        }
      });
    }

    try {
      const totalAdult = Number(defaultPax);
      const childAgeList = [];
      const totalPet = 0;

      const qb = this.roomProductRepository
        .createQueryBuilder('r')
        .select('r.id', 'id') // ONLY SELECT ID (fastest)
        .where('r.hotelId = :hotelId', { hotelId: hotel.id })
        .andWhere('r.deletedAt IS NULL')
        .andWhere('r.status = :status', { status: RoomProductStatus.ACTIVE })
        .andWhere(':distributionChannel = ANY(r.distributionChannel)', {
          distributionChannel: DistributionChannel.GV_SALES_ENGINE
        });

      qb.andWhere('COALESCE(r.numberOfBedrooms, 0) > 0')
        .andWhere('(r.capacityDefault + r.capacityExtra) >= :requestedCapacity', {
          requestedCapacity: totalAdult + (childAgeList?.length || 0)
        })
        .andWhere('(r.maximumAdult + r.extraBedAdult) >= :totalAdult', { totalAdult })
        .andWhere('(r.maximumKid + r.extraBedKid) >= :totalChildren', {
          totalChildren: childAgeList?.length || 0
        })
        .andWhere('r.maximumPet >= :totalPets', { totalPets: totalPet })
        .andWhere('r.numberOfBedrooms >= :requestLength', { requestLength: 1 })
        .andWhere('r.type = ANY(:types)', {
          types: Array.from(allowedRoomProductTypeList)
        });

      // returns plain rows — no entity hydration (FASTEST)
      const roomProducts = await qb.getRawMany();

      const roomProductIds = roomProducts.map((p) => p.id);

      if (roomProductIds.length === 0) {
        return {
          checkIn: format(new Date(fromDate), DATE_FORMAT),
          checkOut: format(addDays(new Date(fromDate), 1), DATE_FORMAT),
          stayNights: 1
        };
      }

      const hotelId = hotel.id;

      /**
       * Recursively search for the nearest bookable date starting from a given check-in date
       * @param currentCheckIn - The current check-in date to check
       * @param maxSearchDays - Maximum number of days to search forward (default: 365 days)
       * @returns Object with checkIn, checkOut, and stayNights if found, null otherwise
       */
      const findNearestBookableDate = async (
        currentCheckIn: string,
        maxSearchDays: number = 365
      ): Promise<{
        checkIn: string;
        checkOut: string;
        stayNights: number;
      } | null> => {
        // Base case: if we've searched too far ahead, return null
        const currentDate = new Date(currentCheckIn);
        const maxDate = addDays(new Date(fromDate), maxSearchDays);
        if (currentDate > maxDate) {
          return null;
        }

        // Check availability for the current check-in date with default stay nights
        const checkInDateStr = format(currentDate, DATE_FORMAT);
        // for check sellability, we need to subtract 1 day from the default stay night
        const checkOutDateStr = format(addDays(currentDate, defaultStayNight - 1), DATE_FORMAT);
        // for restriction validation, we need to add 1 day to the default stay night
        const lastDate = format(addDays(currentDate, defaultStayNight), DATE_FORMAT);

        const [roomProductRatePlans, availabilityPerDate, restrictions] = await Promise.all([
          // Get room product rate plans with sellability
          this.iseRecommendationService.getRoomProductRatePlansWithSellability(
            hotelId,
            roomProductIds,
            checkInDateStr,
            checkOutDateStr,
            []
          ),
          // Get availability per date
          this.calculateAvailabilityPerDateRaw(
            hotelId,
            checkInDateStr,
            checkOutDateStr,
            roomProductIds
          ),

          // get restrictions
          this.iseRecommendationService.getRestrictions(hotelId, checkInDateStr, checkOutDateStr)
        ]);

        if (roomProductRatePlans.length === 0) {
          // No rate plans available, try next day
          const nextCheckIn = format(addDays(currentDate, 1), DATE_FORMAT);
          return findNearestBookableDate(nextCheckIn, maxSearchDays);
        }

        // filter restrictions by 3 levels
        // for hotel level -> room product ids null, rate plan ids null
        // for room product level -> room product ids not null, rate plan ids null
        // for rate plan level -> room product ids null, rate plan ids not null
        // for room product rate plan level -> room product ids not null, rate plan ids not null
        const restrictionsHotelLevel = [...restrictions].filter(
          (r) => !r.roomProductIds?.length && !r.ratePlanIds?.length
        );

        const restrictionsRoomProductLevel = [...restrictions].filter(
          (r) => r.roomProductIds?.length && !r.ratePlanIds?.length
        );

        const restrictionsRatePlanLevel = [...restrictions].filter(
          (r) => !r.roomProductIds?.length && r.ratePlanIds?.length
        );

        const isValidHotelRestriction =
          restrictionsHotelLevel?.length > 0
            ? this.validateHotelRestriction(checkInDateStr, checkOutDateStr, restrictionsHotelLevel)
            : true;

        if (!isValidHotelRestriction) {
          // Hotel restriction not valid, try next day
          const nextCheckIn = format(addDays(currentDate, 1), DATE_FORMAT);
          return findNearestBookableDate(nextCheckIn, maxSearchDays);
        }

        // Process sellability and availability for room product rate plans
        const sellabilityData = this.processSellabilityAndAvailability(
          roomProductRatePlans,
          availabilityPerDate,
          checkInDateStr,
          checkOutDateStr,
          restrictionsRatePlanLevel,
          restrictionsRoomProductLevel
        );

        // If we found available room products, return the result
        if (sellabilityData.roomProductIdsAvailable.length > 0) {
          return {
            checkIn: checkInDateStr,
            checkOut: lastDate,
            stayNights: defaultStayNight
          };
        }

        // No availability found, recursively check the next day
        const nextCheckIn = format(addDays(currentDate, 1), DATE_FORMAT);
        return findNearestBookableDate(nextCheckIn, maxSearchDays);
      };

      // Start recursive search from the fromDate
      const result = await findNearestBookableDate(fromDate);

      if (result) {
        return result;
      }

      // No bookable date found within the search range
      return {
        checkIn: format(new Date(fromDate), DATE_FORMAT),
        checkOut: format(addDays(new Date(fromDate), 1), DATE_FORMAT),
        stayNights: 1
      };
    } catch (error) {
      this.logger.error(`Error getting nearest bookable date: ${error.message}`, error.stack);
      return null;
    }
  }

  async getLowestPriceCalendarV2(request: RoomProductPricingRequestDto): Promise<{
    items: LowestPriceResponseDto[];
    sellabilityCalendarZip?: SellabilityCalendarZip;
  }> {
    const {
      propertyCode,
      fromDate,
      toDate,
      totalAdult,
      childAgeList = [],
      totalPet = 0,
      roomProductCodes = [],
      promoCodeList = []
    } = request;

    const start = performance.now();
    const hotel = await this.iseRecommendationService.getCachedHotel(propertyCode);

    // 4. Allowed list
    const allowedRoomProductTypeList = new Set();

    let cityTaxDisplayMode: IsePricingDisplayModeEnum | null = null;
    let hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number } = {
      roundingMode: RoundingModeEnum.NO_ROUNDING,
      decimalPlaces: 2
    };

    const hotelConfiguration = await this.iseRecommendationService.getCachedHotelConfig(hotel.id);

    let ratePlanPromoIds: string[] = [];
    let isRatePlanContract = false;

    if (promoCodeList && promoCodeList.length > 0) {
      const ratePlanContracts = await this.checkCorporateFlow(hotel.id, promoCodeList);
      ratePlanPromoIds = ratePlanContracts.map((ratePlan) => ratePlan.id);
      isRatePlanContract = ratePlanContracts.some(
        (ratePlan) => ratePlan.type === RatePlanTypeEnum.GROUP
      );
    }

    if (hotelConfiguration.length > 0) {
      hotelConfiguration.forEach((config) => {
        switch (config.configType) {
          case HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY:
            cityTaxDisplayMode = config.configValue?.metadata
              ?.cityTaxMode as IsePricingDisplayModeEnum;
            break;

          case HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE:
            hotelConfigRoundingMode = {
              roundingMode: config.configValue?.metadata?.roundingMode,
              decimalPlaces: config.configValue?.metadata?.decimalUnits
            };
            break;

          case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING:
            const metadata = config.configValue?.metadata as Record<string, any>;
            if (!metadata) return [];

            if (metadata['MOST_POPULAR']) {
              Object.keys(metadata['MOST_POPULAR']).forEach((key) => {
                if (metadata['MOST_POPULAR'][key] === true) {
                  allowedRoomProductTypeList.add(key as RoomProductType);
                }
              });
            }
            if (metadata['LOWEST_PRICE']) {
              Object.keys(metadata['LOWEST_PRICE']).forEach((key) => {
                if (metadata['LOWEST_PRICE'][key] === true) {
                  allowedRoomProductTypeList.add(key as RoomProductType);
                }
              });
            }
            break;

          case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING:
            const directListConfig = config.configValue?.metadata as Record<string, any>;

            Object.keys(directListConfig).forEach((key) => {
              if (directListConfig[key] === true) {
                allowedRoomProductTypeList.add(key as RoomProductType);
              }
            });
            break;
        }
      });
    }

    const end = performance.now();

    try {
      const start2 = performance.now();
      const qb = this.roomProductRepository
        .createQueryBuilder('r')
        .select('r.id', 'id') // ONLY SELECT ID (fastest)
        .where('r.hotelId = :hotelId', { hotelId: hotel.id })
        .andWhere('r.deletedAt IS NULL')
        .andWhere('r.status = :status', { status: RoomProductStatus.ACTIVE })
        .andWhere(':distributionChannel = ANY(r.distributionChannel)', {
          distributionChannel: DistributionChannel.GV_SALES_ENGINE
        });

      if (roomProductCodes.length > 0) {
        // support only one room product code
        const normalizedRoomProductCodes = roomProductCodes.map((code) => code.toLowerCase()).at(0);
        qb.andWhere('LOWER(r.code) = LOWER(:normalizedRoomProductCodes)', {
          normalizedRoomProductCodes
        });
        qb.andWhere('r.type = ANY(:types)', {
          types: [RoomProductType.RFC, RoomProductType.ERFC, RoomProductType.MRFC]
        });
      } else {
        qb.andWhere('COALESCE(r.numberOfBedrooms, 0) > 0')
          .andWhere('(r.capacityDefault + r.capacityExtra) >= :requestedCapacity', {
            requestedCapacity: totalAdult + (childAgeList?.length || 0)
          })
          .andWhere('(r.maximumAdult + r.extraBedAdult) >= :totalAdult', { totalAdult })
          .andWhere('(r.maximumKid + r.extraBedKid) >= :totalChildren', {
            totalChildren: childAgeList?.length || 0
          })
          .andWhere('r.maximumPet >= :totalPets', { totalPets: totalPet })
          .andWhere('r.numberOfBedrooms >= :requestLength', { requestLength: 1 })
          .andWhere('r.type = ANY(:types)', {
            types: Array.from(allowedRoomProductTypeList)
          });
      }

      // returns plain rows — no entity hydration (FASTEST)
      const roomProducts = await qb.getRawMany();
      const end2 = performance.now();
      this.logger.debug(`⏱️ Room Products: ${((end2 - start2) / 1000).toFixed(3)}s`);
      const roomProductIds = roomProducts.map((p) => p.id);

      const dates = Helper.generateDateRange(fromDate, toDate);
      if (roomProductIds.length === 0) {
        return {
          items: dates.map((date) => ({
            date,
            roomProductId: '',
            ratePlanId: '',
            price: null,
            netPrice: null,
            grossPrice: null,
            adjustmentRate: null,
            status: DateBookingStatus.SOLD_OUT,
            availableRooms: 0,
            restrictions: undefined
          }))
        };
      }

      // 🔥 SMART RESTRICTION ANALYSIS: Fetch ALL restriction levels in parallel
      const start3 = performance.now();
      const [
        roomProductRatePlans,
        availabilityPerDate,
        { houseLevelRestrictions, ratePlanRestrictions, roomProductRestrictions },
        hotelAmenityMap
      ] = await Promise.all([
        this.iseRecommendationService.getRoomProductRatePlansWithSellability(
          hotel.id,
          roomProductIds,
          fromDate,
          toDate,
          ratePlanPromoIds
        ),

        // Get availability per date
        this.calculateAvailabilityPerDateRaw(hotel.id, fromDate, toDate, roomProductIds),

        // 🔥 Fetch ALL restriction levels (house, room product, rate plan)
        this.fetchAllRestrictionLevels(
          hotel.id,
          fromDate,
          toDate,
          roomProductCodes.length > 0 ? roomProductIds : [],
          ratePlanPromoIds
        ),

        // get hotel amenities
        this.getHotelAmenitiesMap(hotel.id, true)
      ]);

      if (roomProductRatePlans.length === 0) {
        return {
          items: dates.map((date) => ({
            date,
            roomProductId: '',
            ratePlanId: '',
            price: null,
            netPrice: null,
            grossPrice: null,
            adjustmentRate: null,
            status: DateBookingStatus.SOLD_OUT,
            availableRooms: 0,
            restrictions: undefined
          }))
        };
      }
      const end3 = performance.now();
      this.logger.debug(`⏱️ Restriction Levels: ${((end3 - start3) / 1000).toFixed(3)}s`);

      // 1️⃣ Generate all dates

      const rpRatePlanIds = [...new Set(roomProductRatePlans.map((r) => r.ratePlanId))];

      // 2️⃣ Map availability by date and room product
      const availabilityPerDateMap = new Map<string, number>(
        availabilityPerDate.map((p) => [`${p.date};${p.roomProductId}`, p.available])
      );
      const start4 = performance.now();

      // 3️⃣ Build restriction indexes for DATE-LEVEL analysis (done in processRoomProductRatePlanPricingWithStatus)
      const restrictionIndexes = this.buildRestrictionIndexes(
        houseLevelRestrictions,
        ratePlanRestrictions,
        dates,
        rpRatePlanIds,
        roomProductIds,
        roomProductRestrictions
      );
      // 4️⃣ Precompute sellability (availability + sellability flags only, NO restriction check here)
      // Restriction analysis is done at DATE level in processRoomProductRatePlanPricingWithStatus
      const sellabilityMap = new Map<string, boolean>();

      for (const rp of roomProductRatePlans) {
        // Daily rate plan sellability
        const dailyRpMap = new Map<string, boolean>();
        for (const d of rp.ratePlan.ratePlanDailySellabilities) {
          if (d.distributionChannel === DistributionChannel.GV_SALES_ENGINE) {
            dailyRpMap.set(d.date, d.isSellable);
          }
        }

        const defaultRp = rp.ratePlan.ratePlanSellabilities?.find((rps) =>
          rps.distributionChannel.includes(DistributionChannel.GV_SALES_ENGINE)
        );

        const defaultRatePlanSellable = !!defaultRp?.id;
        // const defaultRatePlanSellable = rp.ratePlan.distributionChannel?.includes(
        //   DistributionChannel.GV_SALES_ENGINE
        // );

        // Daily room product rate plan sellability
        const dailyRprpMap = new Map<string, boolean>();
        for (const adj of rp.roomProductRatePlanAvailabilityAdjustments) {
          dailyRprpMap.set(adj.date, adj.isSellable);
        }

        // Compute sellability per date (availability + sellability flags)
        for (const date of dates) {
          const key = `${date};${rp.roomProductId};${rp.ratePlanId}`;
          const availability = availabilityPerDateMap.get(`${date};${rp.roomProductId}`) ?? 0;

          // No availability = not sellable
          if (!availability || availability <= 0) {
            sellabilityMap.set(key, false);
            continue;
          }

          const ratePlanSellable = dailyRpMap.get(date) ?? defaultRatePlanSellable;
          const roomProductSellable = dailyRprpMap.get(date) ?? rp.isSellable;

          // Sellable if has availability AND both rate plan and room product are sellable
          sellabilityMap.set(key, ratePlanSellable && roomProductSellable);
        }
      }

      // 5️⃣ Check if any sellable dates exist
      const hasSellableDates = Array.from(sellabilityMap.values()).some((v) => v);
      if (!hasSellableDates) {
        // No sellable dates - return all dates with SOLD_OUT status
        return {
          items: dates.map((date) => ({
            date,
            roomProductId: '',
            ratePlanId: '',
            price: null,
            netPrice: null,
            grossPrice: null,
            adjustmentRate: null,
            status: DateBookingStatus.SOLD_OUT,
            availableRooms: 0,
            restrictions: undefined
          }))
        };
      }

      // 6️⃣ Split room product rate plans into chunks
      const roomProductRatePlansChunks = splitArrayIntoChunks(roomProductRatePlans, 50000);

      const start5 = performance.now();

      // 7️⃣ Chunk processor - passes restrictionIndexes for DATE-LEVEL restriction analysis
      const processRoomProductRatePlansChunk = async (
        chunk: RoomProductRatePlan[]
      ): Promise<LowestPriceResponseDto[]> => {
        return this.processRoomProductRatePlanPricingWithStatus(
          hotel,
          chunk,
          fromDate,
          toDate,
          totalAdult,
          childAgeList,
          totalPet,
          hotelConfigRoundingMode,
          hotelAmenityMap,
          cityTaxDisplayMode === IsePricingDisplayModeEnum.INCLUSIVE,
          sellabilityMap,
          availabilityPerDateMap,
          restrictionIndexes
        );
      };

      // 8️⃣ Execute chunks concurrently & safely
      const chunkResults = await Promise.all(
        roomProductRatePlansChunks.map((chunk) => processRoomProductRatePlansChunk(chunk))
      );

      const start6 = performance.now();
      // 9️⃣ Flatten and return all dates (with restriction analysis applied per DATE)
      const results = chunkResults.flat();
      const sellabilityCalendarZip = this.zipSellabilitiesCalendar(
        results.map((item) => ({
          date: item.date,
          roomProductRatePlanSellabilities: item.roomProductRatePlanSellabilities
        }))
      );

      const end6 = performance.now();
      this.logger.debug(`⏱️ Chunk Results: ${((end6 - start6) / 1000).toFixed(3)}s`);
      for (const item of results) {
        item.roomProductRatePlanSellabilities = [];
      }
      return {
        items: results,
        sellabilityCalendarZip: sellabilityCalendarZip
      };
    } catch (error) {
      this.logger.error(`Error getting lowest price calendar: ${error.message}`, error.stack);
      return {
        items: [],
        sellabilityCalendarZip: undefined
      };
    }
  }

  zipSellabilitiesCalendar(days: DailySellability[]): SellabilityCalendarZip {
    if (!days.length) {
      throw new Error('Empty input');
    }

    const baseDate = days[0].date;

    const roomProductDict = new Map<string, number>();
    const ratePlanDict = new Map<string, number>();

    const roomProducts: string[] = [];
    const ratePlans: string[] = [];

    // key = `${rpIndex}:${planIndex}`
    const seriesMap = new Map<
      string,
      {
        rp: number;
        plan: number;
        timeline: Array<[number, number, 0 | 1]>;
      }
    >();

    const getRpIndex = (id: string) => {
      let idx = roomProductDict.get(id);
      if (idx === undefined) {
        idx = roomProducts.length;
        roomProductDict.set(id, idx);
        roomProducts.push(id);
      }
      return idx;
    };

    const getPlanIndex = (id: string) => {
      let idx = ratePlanDict.get(id);
      if (idx === undefined) {
        idx = ratePlans.length;
        ratePlanDict.set(id, idx);
        ratePlans.push(id);
      }
      return idx;
    };

    days.forEach((day, dayIndex) => {
      for (const item of day?.roomProductRatePlanSellabilities || []) {
        const rp = getRpIndex(item.roomProductId);
        const plan = getPlanIndex(item.ratePlanId);
        const key = `${rp}:${plan}`;

        const value: 0 | 1 = item.isSellable ? 1 : 0;

        let series = seriesMap.get(key);
        if (!series) {
          series = { rp, plan, timeline: [] };
          seriesMap.set(key, series);
        }

        const timeline = series.timeline;
        const last = timeline[timeline.length - 1];

        if (last && last[2] === value && last[1] === dayIndex - 1) {
          // extend candle
          last[1] = dayIndex;
        } else {
          // new candle
          timeline.push([dayIndex, dayIndex, value]);
        }
      }
    });

    return {
      baseDate,
      dict: {
        roomProducts,
        ratePlans
      },
      series: Array.from(seriesMap.values())
    };
  }

  unzipSellabilitiesCalendar(zip: SellabilityCalendarZip): DailySellability[] {
    if (!zip.series?.length) {
      return [
        {
          date: zip.baseDate,
          roomProductRatePlanSellabilities: []
        }
      ];
    }

    const daysCount = Math.max(...zip.series.flatMap((s) => s.timeline.map((t) => t[1]))) + 1;

    const result: DailySellability[] = Array.from({ length: daysCount }, (_, dayIndex) => ({
      date: format(addDays(zip.baseDate, dayIndex), 'yyyy-MM-dd'),
      roomProductRatePlanSellabilities: []
    }));

    for (const s of zip.series) {
      const roomProductId = zip.dict.roomProducts[s.rp];
      const ratePlanId = zip.dict.ratePlans[s.plan];

      for (const [from, to, value] of s.timeline) {
        for (let d = from; d <= to; d++) {
          result[d].roomProductRatePlanSellabilities?.push({
            roomProductId,
            ratePlanId,
            isSellable: Boolean(value)
          });
        }
      }
    }

    return result;
  }

  /**
   * Helper function to find intersection of two arrays
   */
  private getArraysIntersection<T>(arr1: T[], arr2: T[]): T[] {
    if (!arr1 || !arr2) return [];
    const set2 = new Set(arr2);
    return arr1.filter((value) => set2.has(value));
  }
}
