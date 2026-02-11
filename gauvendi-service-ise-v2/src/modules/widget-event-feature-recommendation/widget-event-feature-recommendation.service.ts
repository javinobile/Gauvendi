import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, differenceInDays, formatDate, subDays, subYears } from 'date-fns';
import { HttpClientService } from 'src/core/clients/http-client/http-client.service';
import { API_ENDPOINTS } from 'src/core/constants/apis.const';
import { DB_NAME } from 'src/core/constants/db.const';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { EventFeature } from 'src/core/entities/hotel-entities/event-feature.entity';
import { Event } from 'src/core/entities/hotel-entities/event.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from 'src/core/entities/hotel-retail-feature.entity';
import { RedisService } from 'src/core/modules/redis/redis.service';
import { S3Service } from 'src/core/s3/s3.service';
import { Brackets, In, Repository } from 'typeorm';
import { CalendarService } from '../calendar/calendar.service';
import {
  AnalysisPayload,
  getAIFeatureRecommendations
} from './widget-event-feature-recommendation-ai.util';
import {
  ADULTS_CATEGORY_GROUP,
  FEATURE_CACHE_KEYS,
  FEATURE_EVENT_CACHE_KEYS,
  FOR_TRANSLATION_MESSAGE,
  PETS_CATEGORY_GROUP,
  PICKED_TRANSLATION_MESSAGE,
  ROOMS_CATEGORY_GROUP,
  TRAVEL_SEGMENT_TRANSLATION_MESSAGE,
  createEventMessage,
  createLosMessage,
  createLosText,
  getTranslationText
} from './widget-event-feature-recommendation.const';
import {
  EventFeatureRequest,
  EventMessageResult,
  FeatureRecommendationRequest,
  IFeatureRecommendationRequest,
  RecommendationHistoryDto,
  WidgetEventFeatureRecommendationDto
} from './widget-event-feature-recommendation.dto';
import {
  featureListWithScore,
  validateEventFeatureList,
  validateFeatureList
} from './widget-event-feature-recommendation.util';
import { HotelRetailFeaturesService } from '../hotel-retail-features/hotel-retail-features.service';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';

@Injectable()
export class WidgetEventFeatureRecommendationService {
  private readonly logger = new Logger(WidgetEventFeatureRecommendationService.name);

  constructor(
    private readonly calendarService: CalendarService,

    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(Event, DB_NAME.POSTGRES)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(Reservation, DB_NAME.POSTGRES)
    private reservationRepository: Repository<Reservation>,

    private readonly configService: ConfigService,

    private readonly s3Service: S3Service,

    private readonly httpClientService: HttpClientService,

    private readonly redisService: RedisService,

    @InjectRepository(RoomProductRetailFeature, DB_NAME.POSTGRES)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>
  ) {}

  async getWidgetEventFeatureRecommendation(query: WidgetEventFeatureRecommendationDto) {
    try {
      const { hotelCode, fromDate, toDate, numberOfFeatures, translateTo } = query;

      // #region Phase 1: Run hotel lookup and availability concurrently
      const [hotel, availabilityData] = await Promise.all([
        this.getHotelByCode(hotelCode),
        this.getAvailabilityData(query)
      ]);

      const hotelId = hotel.id;
      const { availableRoomProductIdList } = availabilityData;

      // find all room-product-features to get the retail feature codes which are assigned to the room products
      const roomProductRetailFeatures = await this.roomProductRetailFeatureRepository
        .createQueryBuilder('roomProductRetailFeature')
        .where('roomProductRetailFeature.hotelId = :hotelId', { hotelId: hotelId })
        .andWhere('roomProductRetailFeature.quantity IS NOT NULL')
        .andWhere('roomProductRetailFeature.quantity >= :minQuantity', { minQuantity: 1 })
        .leftJoinAndSelect('roomProductRetailFeature.retailFeature', 'retailFeature')
        .select([
          'roomProductRetailFeature.id',
          'roomProductRetailFeature.retailFeatureId',
          'retailFeature.id',
          'retailFeature.code',
          'retailFeature.name'
        ])
        .getMany();
      let retailFeatureCodes = roomProductRetailFeatures.map((item) => item.retailFeature.code);
      retailFeatureCodes = [...new Set(retailFeatureCodes)];

      // #region Phase 2: Run dependent queries concurrently
      const [recommendationHistory, hotelRetailFeatureList, eventListData] = await Promise.all([
        this.getRecommendationHistory(
          hotelId,
          fromDate,
          toDate,
          Array.from(availableRoomProductIdList)
        ),
        this.getHotelRetailFeatures(hotelId, retailFeatureCodes, translateTo),
        this.getEventListWithMessage(hotelId, fromDate, toDate, query)
      ]);

      // Early return if no retail features
      if (hotelRetailFeatureList?.length === 0) {
        return {
          event: '',
          travelProfile: '',
          popularRetailFeatureList: []
        };
      }

      const { eventList, eventMessage, travelSegmentMessage } = eventListData;

      // #region Phase 3: Process feature recommendations
      const popularRetailFeatureList = this.processFeatureRecommendations(
        recommendationHistory,
        hotelRetailFeatureList,
        eventList,
        numberOfFeatures
      );

      // #region Phase 4: Get AI recommendations
      const recommendedFeatureCodes = await this.processAIRecommendations(
        query,
        popularRetailFeatureList,
        eventList,
        hotelRetailFeatureList,
        recommendationHistory,
        numberOfFeatures
      );

      // #region Phase 5: Build final recommendations
      const finalRecommendations = await this.buildPopularRetailFeatureList(
        recommendedFeatureCodes,
        hotelRetailFeatureList,
        translateTo
      );

      return {
        event: eventMessage,
        travelProfile: travelSegmentMessage,
        popularRetailFeatureList: finalRecommendations
      };
    } catch (error) {
      this.logger.error('getWidgetEventFeatureRecommendation: ', JSON.stringify(error));

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Get hotel by code
   * @param hotelCode Hotel code to lookup
   * @returns Hotel entity with id
   */
  private async getHotelByCode(hotelCode: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      },
      select: {
        id: true
      }
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found with code: ' + hotelCode);
    }

    return hotel;
  }

  /**
   * Get availability data for the query
   * @param query Widget event feature recommendation query
   * @returns Availability data with room products and available room product IDs
   */
  private async getAvailabilityData(query: WidgetEventFeatureRecommendationDto): Promise<{
    roomProductsWithCapacity: any[];
    availableRoomProductIdList: any;
  }> {
    const { hotelCode, fromDate, toDate, totalAdults, totalPets, childAgeList } = query;

    const { roomProductsWithCapacity } = await this.calendarService.getAvailability({
      childAgeList: childAgeList ? childAgeList.map((e) => +e) : [],
      fromDate,
      toDate,
      totalAdult: totalAdults,
      totalPet: totalPets,
      propertyCode: hotelCode
    });

    const availableRoomProductIdList = new Set(
      roomProductsWithCapacity.map((roomProduct) => roomProduct.id)
    );

    return {
      roomProductsWithCapacity,
      availableRoomProductIdList
    };
  }

  /**
   * Get hotel retail features for the hotel
   * @param hotelId Hotel ID
   * @param translateTo Translation language code
   * @returns List of hotel retail features
   */
  private async getHotelRetailFeatures(
    hotelId: string,
    retailFeatureCodes: string[],
    translateTo?: string
  ): Promise<HotelRetailFeature[]> {
    return await this.hotelRetailFeatureRepository.find({
      where: {
        hotelId: hotelId,
        status: HotelRetailFeatureStatusEnum.ACTIVE,
        isVisible: true,
        code: In(retailFeatureCodes)
      },
      relations: {
        hotelRetailFeatureTranslations: translateTo
          ? {
              hotelRetailFeature: true
            }
          : false,
        hotelRetailCategory: true
      }
    });
  }

  /**
   * Get event list with generated messages
   * @param hotelId Hotel ID
   * @param fromDate From date
   * @param toDate To date
   * @param query Original query for message generation
   * @returns Event list with event and travel segment messages
   */
  private async getEventListWithMessage(
    hotelId: string,
    fromDate: string,
    toDate: string,
    query: WidgetEventFeatureRecommendationDto
  ): Promise<{
    eventList: Event[];
    eventMessage: string;
    travelSegmentMessage: string;
  }> {
    const fromDateFormatted = formatDate(new Date(fromDate), 'yyyy-MM-dd');
    const toDateFormatted = formatDate(new Date(toDate), 'yyyy-MM-dd');

    const startDateCondition = `
      DATE(event.startDate) <= :fromDate
      OR :fromDate BETWEEN DATE(event.startDate) AND DATE(event.endDate)
    `;
    const endDateCondition = `
      DATE(event.endDate) BETWEEN :fromDate AND :toDate
      OR DATE(event.endDate) > :toDate
    `;
    const eventList = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.eventFeatureList', 'eventFeature')
      .where('event.hotelId = :hotelId', {
        hotelId: hotelId
      })
      .andWhere('event.isVisible = :isVisible', { isVisible: true })
      .andWhere(`(${startDateCondition}) AND (${endDateCondition})`, {
        fromDate: fromDateFormatted,
        toDate: toDateFormatted
      })
      .orderBy('event.startDate', 'ASC')
      .getMany();

    const { eventMessage, travelSegmentMessage } = this.generateEventMessage(eventList, query);

    return {
      eventList,
      eventMessage,
      travelSegmentMessage
    };
  }

  /**
   * Process feature recommendations using utility functions
   * @param recommendationHistory Recommendation history data
   * @param hotelRetailFeatureList Hotel retail features
   * @param eventList Event list
   * @param numberOfFeatures Number of features to return
   * @returns Popular retail feature list with scores
   */
  private processFeatureRecommendations(
    recommendationHistory: RecommendationHistoryDto,
    hotelRetailFeatureList: HotelRetailFeature[],
    eventList: Event[],
    numberOfFeatures?: number
  ): Array<{
    featureCode: string;
    featureName: string;
    popularityScore: number;
  }> {
    const featureList = this.buildFeatureList(recommendationHistory, hotelRetailFeatureList);
    const eventFeatureList = this.buildEventFeatureList(eventList, hotelRetailFeatureList);

    let popularRetailFeatureList: Array<{
      featureCode: string;
      featureName: string;
      popularityScore: number;
    }> = [];

    if (validateFeatureList(featureList) && validateEventFeatureList(eventFeatureList)) {
      try {
        const { listFeatHighPop } = featureListWithScore(
          featureList,
          eventFeatureList,
          numberOfFeatures || 3,
          25
        );
        popularRetailFeatureList = listFeatHighPop.map((feature) => ({
          featureCode: feature.code,
          featureName: feature.name,
          popularityScore: Math.round(feature.score * 100) / 100 // Round to 2 decimal places
        }));
      } catch (error) {
        this.logger.warn(`Failed to calculate feature recommendations: ${error.message}`);
        // Continue with empty array if feature calculation fails
      }
    }

    return popularRetailFeatureList;
  }

  /**
   * Process AI recommendations with fallback to popularity-based recommendations
   * @param query Original query
   * @param popularRetailFeatureList Popular features with scores
   * @param eventList Event list
   * @param hotelRetailFeatureList Hotel retail features
   * @param recommendationHistory Recommendation history data
   * @param numberOfFeatures Number of features to return
   * @returns Array of recommended feature codes
   */
  private async processAIRecommendations(
    query: WidgetEventFeatureRecommendationDto,
    popularRetailFeatureList: Array<{
      featureCode: string;
      featureName: string;
      popularityScore: number;
    }>,
    eventList: Event[],
    hotelRetailFeatureList: HotelRetailFeature[],
    recommendationHistory: RecommendationHistoryDto,
    numberOfFeatures?: number
  ): Promise<string[]> {
    const { fromDate, toDate, totalAdults, totalPets, childAgeList } = query;

    const eventFeatureList = this.buildEventFeatureList(eventList, hotelRetailFeatureList);

    const analysisPayload: AnalysisPayload = {
      roomRequestList: [
        {
          adult: totalAdults,
          pets: totalPets,
          children: childAgeList || []
        }
      ],
      featureList: popularRetailFeatureList,
      numberOfFeatures: numberOfFeatures || 3,
      bookingPeriod: {
        arrival: fromDate,
        departure: toDate
      },
      eventFeatureList
    };

    // Get AI feature recommendations
    let recommendedFeatureCodes: string[] = [];
    try {
      const { featureRecommendations, cacheKey } = await this.getFeatureRecommendationsCache(
        analysisPayload,
        query.hotelCode
      );
      this.logger.debug(`Feature recommendations cache key: ${cacheKey}`);
      if (featureRecommendations?.length) {
        this.logger.debug(
          `AI cache recommended features: ${JSON.stringify(featureRecommendations)}`
        );
        return featureRecommendations;
      }
      const aiFeatureRecommendationUrl = this.configService.get(
        ENVIRONMENT.AI_FEATURE_RECOMMENDATION_URL
      );
      if (!aiFeatureRecommendationUrl) {
        this.logger.warn('Not using AI feature recommendation');
        recommendedFeatureCodes = getAIFeatureRecommendations(analysisPayload);
        return recommendedFeatureCodes;
      }
      // Build full feature list with selection counts for API request
      const fullFeatureList = this.buildFeatureList(recommendationHistory, hotelRetailFeatureList);

      const featureRecommendationRequest = this.mapAnalysisPayloadToFeatureRecommendationRequest(
        analysisPayload,
        fullFeatureList,
        hotelRetailFeatureList
      );

      const apiUrl = `${aiFeatureRecommendationUrl}${API_ENDPOINTS.AI_FEATURE_RECOMMENDATION}`;
      const res = await this.httpClientService.post<any>(apiUrl, featureRecommendationRequest);
      recommendedFeatureCodes = res?.data || [];
      if (recommendedFeatureCodes?.length) {
        this.logger.debug(`AI recommended features: ${JSON.stringify(recommendedFeatureCodes)}`);
        await this.setAIRecommendationsToRedis(cacheKey, recommendedFeatureCodes);
        return recommendedFeatureCodes;
      }

      recommendedFeatureCodes = getAIFeatureRecommendations(analysisPayload);
    } catch (error) {
      this.logger.warn(`Failed to get AI recommendations: ${error.message}`);
      // Fallback to top features by popularity score
      recommendedFeatureCodes = popularRetailFeatureList
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, numberOfFeatures || 3)
        .map((feature) => feature.featureCode);
    }

    return recommendedFeatureCodes;
  }

  /**
   * Map AnalysisPayload to IFeatureRecommendationRequest format
   * @param analysisPayload Analysis payload from internal processing
   * @param fullFeatureList Full feature list with selection counts from recommendation history
   * @param hotelRetailFeatureList Hotel retail features for name lookup
   * @returns Mapped feature recommendation request for AI API
   */
  private mapAnalysisPayloadToFeatureRecommendationRequest(
    analysisPayload: AnalysisPayload,
    fullFeatureList: FeatureRecommendationRequest[],
    hotelRetailFeatureList: HotelRetailFeature[]
  ): IFeatureRecommendationRequest {
    // Create a map for quick feature lookup by code
    const featureMap = new Map(fullFeatureList.map((feature) => [feature.code, feature]));

    // Create a map for hotel retail features by code for name lookup
    const hotelFeatureMap = new Map(
      hotelRetailFeatureList.map((feature) => [feature.code, feature])
    );

    return {
      roomRequestList: analysisPayload.roomRequestList.map((room, index) => ({
        index: index.toString(),
        adults: room.adult,
        children: room.children?.length || 0,
        pets: room.pets
      })),
      bookingPeriod: {
        arrival: analysisPayload.bookingPeriod.arrival,
        departure: analysisPayload.bookingPeriod.departure
      },
      featureRecommendationNumber: analysisPayload.numberOfFeatures,
      eventFeatureList: analysisPayload.eventFeatureList.map((event) => ({
        name: event.name,
        from: event.from,
        to: event.to,
        featureList: event.featureList.map((featureCode) => {
          const feature = featureMap.get(featureCode);
          const hotelFeature = hotelFeatureMap.get(featureCode);
          return {
            name: feature?.name || hotelFeature?.name || featureCode,
            code: featureCode,
            type: feature?.type || 'Retail',
            popularity: feature?.popularity || hotelFeature?.baseWeight || 0,
            selection: feature?.selection || 0
          };
        })
      })),
      featureList: fullFeatureList.map((feature) => ({
        name: feature.name,
        code: feature.code,
        type: feature.type,
        popularity: feature.popularity,
        selection: feature.selection
      }))
    };
  }

  /**
   * Generate comprehensive cache keys for feature recommendations
   * @param payload Analysis payload containing room requests and booking info
   * @param hotelCode Hotel code for cache namespacing
   * @returns Object containing all cache keys for different cache layers
   */
  private async getFeatureRecommendationsCache(payload: AnalysisPayload, hotelCode: string) {
    let isNewFeatureCache = true;
    let isNewEventCache = true;
    let featureRecommendations: string[] = [];

    // Legacy cache keys (kept for backward compatibility)
    const featureCacheKey = `${hotelCode}_${FEATURE_CACHE_KEYS}`;
    const eventCacheKey = `${hotelCode}_${FEATURE_EVENT_CACHE_KEYS}`;

    // Build group cache key based on room composition (12 possible groups)
    const groupCacheKeyValue = this.buildGroupCacheKey(payload.roomRequestList);
    const groupCacheKey = `ai_recommendations_${hotelCode}_${groupCacheKeyValue}`;

    const [featureCache, eventCache] = await Promise.all([
      this.redisService.get(featureCacheKey),
      this.redisService.get(eventCacheKey)
    ]);
    const currentFeatures = JSON.stringify(payload.featureList);
    const currentEvents = JSON.stringify(payload.eventFeatureList);
    if (featureCache === currentFeatures) {
      isNewFeatureCache = false;
    } else {
      this.redisService.set(featureCacheKey, currentFeatures, 60 * 60 * 24 * 15); // 15 days
    }
    if (eventCache === currentEvents) {
      isNewEventCache = false;
    } else {
      this.redisService.set(eventCacheKey, currentEvents, 60 * 60 * 24 * 15); // 15 days
    }
    if (!isNewFeatureCache && !isNewEventCache) {
      const groupCache = await this.redisService.get(groupCacheKey);
      featureRecommendations = JSON.parse(groupCache || '[]');
      return {
        featureRecommendations,
        cacheKey: groupCacheKey
      };
    }

    return {
      featureRecommendations: [],
      cacheKey: groupCacheKey
    };
  }

  /**
   * Build cache key based on room request list following the cache group logic:
   * - ADULTS CATEGORY: solo_no_kids (adults=1 AND children=0) | small (adults=1+kids OR adults=2) | large (adults>=3)
   * - PETS: no_pets (total=0) | pets (total>=1)
   * - ROOMS: 1 (single room) | multi (2+ rooms)
   *
   * Returns the corresponding key from GROUP_CACHE_KEYS constant
   * This creates 12 distinct cache groups (3 × 2 × 2 = 12) to segment guest types
   */
  private buildGroupCacheKey(roomRequestList: AnalysisPayload['roomRequestList']): string {
    // Calculate totals across all rooms
    const totalRooms = roomRequestList.length;
    const totalAdults = roomRequestList.reduce((sum, room) => sum + room.adult, 0);
    const totalChildren = roomRequestList.reduce((sum, room) => sum + room.children.length, 0);
    const totalPets = roomRequestList.reduce((sum, room) => sum + room.pets, 0);

    // Determine ADULTS category based on specific combinations
    let adultsCategory: string;
    const configKey = `${totalAdults}_${totalChildren}`;

    switch (configKey) {
      // Rank 1: 2 Adults (32%)
      case '2_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.TWO_ADULTS;
        break;
      // Rank 2: 2 Adults + 1 Child (18%)
      case '2_1':
        adultsCategory = ADULTS_CATEGORY_GROUP.TWO_ADULTS_ONE_CHILD;
        break;
      // Rank 3: 2 Adults + 2 Children (12%)
      case '2_2':
        adultsCategory = ADULTS_CATEGORY_GROUP.TWO_ADULTS_TWO_CHILDREN;
        break;
      // Rank 4: 1 Adult (8%)
      case '1_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.ONE_ADULT;
        break;
      // Rank 5: 3 Adults (7%)
      case '3_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.THREE_ADULTS;
        break;
      // Rank 6: 4 Adults (6%)
      case '4_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.FOUR_ADULTS;
        break;
      // Rank 7: 2 Adults + 3 Children (4%)
      case '2_3':
        adultsCategory = ADULTS_CATEGORY_GROUP.TWO_ADULTS_THREE_CHILDREN;
        break;
      // Rank 8: 1 Adult + 1 Child (3%)
      case '1_1':
        adultsCategory = ADULTS_CATEGORY_GROUP.ONE_ADULT_ONE_CHILD;
        break;
      // Rank 9: 5 Adults (3%)
      case '5_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.FIVE_ADULTS;
        break;
      // Rank 10: 3 Adults + 1 Child (3%)
      case '3_1':
        adultsCategory = ADULTS_CATEGORY_GROUP.THREE_ADULTS_ONE_CHILD;
        break;
      // Rank 11: 6 Adults (2%)
      case '6_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.SIX_ADULTS;
        break;
      // Rank 12: 4 Adults + 2 Children (2%)
      case '4_2':
        adultsCategory = ADULTS_CATEGORY_GROUP.FOUR_ADULTS_TWO_CHILDREN;
        break;
      // Rank 13: 3 Adults + 2 Children (~1.5%)
      case '3_2':
        adultsCategory = ADULTS_CATEGORY_GROUP.THREE_ADULTS_TWO_CHILDREN;
        break;
      // Rank 14: 1 Adult + 2 Children (~1.2%)
      case '1_2':
        adultsCategory = ADULTS_CATEGORY_GROUP.ONE_ADULT_TWO_CHILDREN;
        break;
      // Rank 15: 2 Adults + 4 Children (~1.1%)
      case '2_4':
        adultsCategory = ADULTS_CATEGORY_GROUP.TWO_ADULTS_FOUR_CHILDREN;
        break;
      // Rank 16: 7 Adults (~0.9%)
      case '7_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.SEVEN_ADULTS;
        break;
      // Rank 17: 5 Adults + 1 Child (~0.8%)
      case '5_1':
        adultsCategory = ADULTS_CATEGORY_GROUP.FIVE_ADULTS_ONE_CHILD;
        break;
      // Rank 18: 8 Adults (~0.7%)
      case '8_0':
        adultsCategory = ADULTS_CATEGORY_GROUP.EIGHT_ADULTS;
        break;
      // Rank 19: 6 Adults + 2 Children (~0.6%)
      case '6_2':
        adultsCategory = ADULTS_CATEGORY_GROUP.SIX_ADULTS_TWO_CHILDREN;
        break;
      // Rank 20: 4 Adults + 3 Children (~0.5%)
      case '4_3':
        adultsCategory = ADULTS_CATEGORY_GROUP.FOUR_ADULTS_THREE_CHILDREN;
        break;
      // Fallback for other combinations
      default:
        adultsCategory = ADULTS_CATEGORY_GROUP.OTHER;
        break;
    }

    // Determine PETS category
    const petsCategory = totalPets === 0 ? PETS_CATEGORY_GROUP.NO_PETS : PETS_CATEGORY_GROUP.PETS;

    // Determine ROOMS category
    const roomsCategory = totalRooms === 1 ? ROOMS_CATEGORY_GROUP.ONE : ROOMS_CATEGORY_GROUP.MULTI;

    // Map to GROUP_CACHE_KEYS
    const groupCacheKey = `${adultsCategory}_${petsCategory}_${roomsCategory}`;
    return groupCacheKey;
  }

  private async setAIRecommendationsToRedis(key: string, recommendations: string[]): Promise<void> {
    await this.redisService.set(key, JSON.stringify(recommendations), 60 * 60 * 24 * 15); // 15 days
  }

  private generateEventMessage(
    eventList: Event[],
    filter: WidgetEventFeatureRecommendationDto
  ): EventMessageResult {
    const { totalAdults, childAgeList, translateTo, fromDate, toDate } = filter;
    const translateKey = translateTo || 'null';

    let maybeEvent = eventList.sort((a, b) => {
      const aDays = differenceInDays(new Date(a.endDate), new Date(a.startDate));
      const bDays = differenceInDays(new Date(b.endDate), new Date(b.startDate));
      return aDays - bDays;
    })[0];

    if (filter?.translateTo && maybeEvent) {
      const translation = maybeEvent.translations.find(
        (t) => `${t.languageCode}`.toUpperCase() === `${translateKey}`.toUpperCase()
      );
      maybeEvent.name = translation?.name || maybeEvent.name;
    }

    // Get translation texts using helper function
    const forText = getTranslationText(FOR_TRANSLATION_MESSAGE, translateKey);
    const pickedText = getTranslationText(PICKED_TRANSLATION_MESSAGE, translateKey);

    let eventMessage: string;

    if (maybeEvent) {
      // Generate event-based message using template literal
      eventMessage = createEventMessage(
        maybeEvent.name,
        '', // travelSegment will be added later
        pickedText
      );
    } else {
      // Calculate LOS (Length of Stay) and generate LOS-based message
      const los = differenceInDays(new Date(toDate), new Date(fromDate));
      const losText = createLosText(los, translateKey);

      eventMessage = createLosMessage(
        '', // travelSegment will be added later
        forText,
        losText,
        pickedText
      );
    }

    // Calculate travel segment message based on adults and children
    const totalChildren = childAgeList?.length || 0;
    const atLeastOneChildrenHasAgeLowerThan3 = childAgeList?.some((age) => age <= 3) || false;

    // Get travel segment messages for the language
    const travelSegmentByRoomRequestSize =
      TRAVEL_SEGMENT_TRANSLATION_MESSAGE[translateKey] ||
      TRAVEL_SEGMENT_TRANSLATION_MESSAGE['null'];

    let travelSegmentMessage: string;

    switch (totalAdults) {
      case 1: {
        if (totalChildren !== 0) {
          if (atLeastOneChildrenHasAgeLowerThan3) {
            travelSegmentMessage = travelSegmentByRoomRequestSize[3];
          } else {
            travelSegmentMessage = travelSegmentByRoomRequestSize[4];
          }
        } else {
          travelSegmentMessage = travelSegmentByRoomRequestSize[1];
        }
        break;
      }
      case 2: {
        if (totalChildren !== 0) {
          if (atLeastOneChildrenHasAgeLowerThan3) {
            travelSegmentMessage = travelSegmentByRoomRequestSize[3];
          } else {
            travelSegmentMessage = travelSegmentByRoomRequestSize[4];
          }
        } else {
          travelSegmentMessage = travelSegmentByRoomRequestSize[2];
        }
        break;
      }
      case 3: {
        if (totalChildren !== 0) {
          if (atLeastOneChildrenHasAgeLowerThan3) {
            travelSegmentMessage = travelSegmentByRoomRequestSize[3];
          } else {
            travelSegmentMessage = travelSegmentByRoomRequestSize[4];
          }
        } else {
          travelSegmentMessage = travelSegmentByRoomRequestSize[6];
        }
        break;
      }
      case 4:
        travelSegmentMessage = travelSegmentByRoomRequestSize[8];
        break;
      default:
        travelSegmentMessage = travelSegmentByRoomRequestSize[9];
        break;
    }

    // Recreate message with travel segment included
    if (maybeEvent) {
      eventMessage = createEventMessage(maybeEvent.name, travelSegmentMessage, pickedText);
    } else {
      const los = differenceInDays(new Date(toDate), new Date(fromDate));
      const losText = createLosText(los, translateKey);

      eventMessage = createLosMessage(travelSegmentMessage, forText, losText, pickedText);
    }

    return {
      eventMessage,
      travelSegmentMessage
    };
  }

  /**
   * Build feature list for AI recommendation based on Java logic
   * Converts hotel retail features to recommendation request format
   */
  private buildFeatureList(
    featureHistory: RecommendationHistoryDto,
    propertyRetailFeatureList: HotelRetailFeature[]
  ): FeatureRecommendationRequest[] {
    if (!propertyRetailFeatureList || propertyRetailFeatureList.length === 0) {
      return [];
    }

    // Create feature selection history map from feature history array
    const featureSelectionHistory = new Map<string, number>();
    if (featureHistory && Array.isArray(featureHistory)) {
      featureHistory.forEach((item) => {
        featureSelectionHistory.set(item.code, item.count || 0);
      });
    }

    // Map hotel retail features to recommendation request format
    return propertyRetailFeatureList.map((item) => ({
      code: item.code,
      name: item.name,
      type: 'RETAIL',
      popularity: item.baseWeight || 0,
      selection: featureSelectionHistory.get(item.code) || 0
    }));
  }

  private async getRecommendationHistory(
    hotelId: string,
    fromDate: string,
    toDate: string,
    availableRoomProductIdList: Array<string>
  ) {
    const dayOffset = 7;
    const adjustedStartDate = subDays(subYears(new Date(fromDate), 1), dayOffset);
    const adjustedEndDate = addDays(subYears(new Date(toDate), 1), dayOffset);

    const queryBuilder = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select([
        'reservation.roomProductId',
        'reservation.matchedFeature',
        'COUNT(*) as numberOfReservations'
      ])
      .where('reservation.hotelId = :hotelId', { hotelId })
      .andWhere('reservation.deletedAt = :deletedAt', { deletedAt: null })
      .andWhere('reservation.channel = :channel', { channel: 'GV SALES ENGINE' })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: ['RESERVED', 'COMPLETED', 'CONFIRMED', 'CANCELLED']
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('(reservation.arrival <= :startDate AND reservation.departure >= :startDate)', {
            startDate: adjustedStartDate
          })
            .orWhere('(reservation.arrival <= :endDate AND reservation.departure >= :endDate)', {
              endDate: adjustedEndDate
            })
            .orWhere('(reservation.arrival >= :startDate AND reservation.departure <= :endDate)', {
              startDate: adjustedStartDate,
              endDate: adjustedEndDate
            });
        })
      )
      .groupBy('reservation.roomProductId, reservation.matchedFeature');

    if (availableRoomProductIdList?.length > 0) {
      queryBuilder.andWhere('reservation.roomProductId IN (:...roomProductIds)', {
        roomProductIds: availableRoomProductIdList
      });
    }

    const reservationHistory = await queryBuilder.getRawMany();

    const featureSumAggregatedByCode = new Map<string, number>();

    reservationHistory.forEach((record) => {
      if (record.matchedFeature && record.matchedFeature.trim()) {
        const features = record.matchedFeature
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f.length > 0);

        features.forEach((feature) => {
          const currentCount = featureSumAggregatedByCode.get(feature) || 0;
          featureSumAggregatedByCode.set(feature, currentCount + 1);
        });
      }
    });

    const featureHistory: Array<{ code: string; count: number }> = [];
    featureSumAggregatedByCode.forEach((count, code) => {
      featureHistory.push({ code, count });
    });

    return featureHistory;
  }

  /**
   * Build event feature list for AI recommendation based on Java logic
   * Converts events to event feature request format with associated retail features
   */
  private buildEventFeatureList(
    eventList: Event[],
    propertyRetailFeatureList: HotelRetailFeature[]
  ): EventFeatureRequest[] {
    if (!eventList || eventList.length === 0) {
      return [];
    }

    // Create a map of hotel retail features by ID for quick lookup
    const propertyRetailFeatureMap = new Map<string, HotelRetailFeature>();
    propertyRetailFeatureList.forEach((feature) => {
      propertyRetailFeatureMap.set(feature.id, feature);
    });

    // Process events and build event feature requests
    const eventFeatureRequests = eventList.map((event) => {
      const featureNames = this.getFeatureNameList(
        event.eventFeatureList || [],
        propertyRetailFeatureMap
      );

      return {
        name: event.name,
        from: formatDate(new Date(event.startDate), 'yyyy-MM-dd'),
        to: formatDate(new Date(event.endDate), 'yyyy-MM-dd'),
        featureList: featureNames
      };
    });

    return eventFeatureRequests;
  }

  /**
   * Get feature names from event feature list following Java logic
   * Maps event features to hotel retail feature names using the feature map
   */
  private getFeatureNameList(
    eventFeatureList: EventFeature[],
    propertyRetailFeatureMap: Map<string, HotelRetailFeature>
  ): string[] {
    // Return empty array if no event features (equivalent to Java CollectionUtils.isEmpty check)
    if (!eventFeatureList || eventFeatureList.length === 0) {
      return [];
    }

    // Extract feature IDs and filter out null values (equivalent to Java parallelStream with filter)
    const featureIdSet = new Set<string>();
    eventFeatureList.forEach((eventFeature) => {
      if (eventFeature.hotelRetailFeatureId) {
        featureIdSet.add(eventFeature.hotelRetailFeatureId);
      }
    });

    // Return empty array if no valid feature IDs
    if (featureIdSet.size === 0) {
      return [];
    }

    // Map feature IDs to feature names (equivalent to Java parallelStream mapping)
    const featureNames: string[] = [];
    featureIdSet.forEach((featureId) => {
      const retailFeature = propertyRetailFeatureMap.get(featureId);
      if (retailFeature && retailFeature.name) {
        featureNames.push(retailFeature.name);
      }
    });

    return featureNames;
  }

  /**
   * Build popular retail feature list based on recommended feature codes
   * Maps data similar to getAllHotelRetailFeatures but filtered by recommended codes
   */
  private async buildPopularRetailFeatureList(
    recommendedFeatureCodes: string[],
    hotelRetailFeatureList: HotelRetailFeature[],
    translateTo?: string
  ): Promise<
    Array<{
      name: string;
      code: string;
      description: string;
      shortDescription: string;
      displaySequence: number;
      measurementUnit: string;
      hotelRetailCategory: {
        name: string;
        code: string;
      };
      retailFeatureImageList: Array<{
        imageUrl: string;
        description: string;
      }>;
    }>
  > {
    try {
      // Filter features by recommended codes
      const filteredFeatures = hotelRetailFeatureList.filter((feature) =>
        recommendedFeatureCodes.includes(feature.code)
      );

      if (filteredFeatures.length === 0) {
        this.logger.warn('No features found matching recommended codes');
        return [];
      }

      // Map data similar to getAllHotelRetailFeatures
      const data = await Promise.all(
        filteredFeatures.map(async (hotelRetailFeature) => {
          const foundTranslation = hotelRetailFeature?.translations?.find(
            (translation) => translation.languageCode === translateTo
          );
          const foundHotelRetailCategoryTranslation =
            hotelRetailFeature?.hotelRetailCategory?.translations?.find(
              (translation) => translation.languageCode === translateTo
            );

          return {
            name: foundTranslation ? foundTranslation.name : hotelRetailFeature.name,
            code: hotelRetailFeature.code,
            description: foundTranslation
              ? foundTranslation.description
              : hotelRetailFeature.description,
            shortDescription: foundTranslation
              ? foundTranslation.description
              : hotelRetailFeature.shortDescription,
            displaySequence: hotelRetailFeature.displaySequence,
            measurementUnit: hotelRetailFeature?.measurementUnit,
            hotelRetailCategory: {
              name: foundHotelRetailCategoryTranslation
                ? foundHotelRetailCategoryTranslation.name
                : hotelRetailFeature.hotelRetailCategory?.name,
              code: hotelRetailFeature.hotelRetailCategory?.code
            },
            retailFeatureImageList: hotelRetailFeature.imageUrl
              ? [
                  {
                    imageUrl: await this.s3Service.getPreSignedUrl(hotelRetailFeature.imageUrl),
                    description: hotelRetailFeature.description
                  }
                ]
              : []
          };
        })
      );

      // Sort by recommended order (maintain order from AI recommendations)
      const sortedData = data.sort((a, b) => {
        const indexA = recommendedFeatureCodes.indexOf(a.code);
        const indexB = recommendedFeatureCodes.indexOf(b.code);
        return indexA - indexB;
      });

      return sortedData;
    } catch (error) {
      this.logger.error(
        `Failed to build popular retail feature list: ${error.message}`,
        error.stack
      );
      return [];
    }
  }
}
