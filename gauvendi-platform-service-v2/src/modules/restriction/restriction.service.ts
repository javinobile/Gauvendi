import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRestrictionIntegrationSetting } from '@src/core/entities/hotel-restriction-integration-setting.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { BadRequestException } from '@src/core/exceptions';
import { Helper } from '@src/core/helper/utils';
import { eachDayOfInterval, format, getHours, getMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelRestrictionSetting } from 'src/core/entities/hotel-restriction-setting.entity';
import {
  Restriction,
  RestrictionMetadata,
  RestrictionSourceMap,
  RestrictionSourceType
} from 'src/core/entities/restriction.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import {
  DistributionChannel,
  HotelConfigurationTypeEnum,
  HotelRestrictionCodeEnum,
  HotelRestrictionSettingMode,
  RatePlanDerivedSettingInheritedFields,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RestrictionConditionType,
  RestrictionLevel,
  Weekday
} from 'src/core/enums/common';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';
import { RestrictionMappingDto, RestrictionQueryDto } from '../pms/pms.dto';
import { PmsService } from '../pms/pms.service';
import { RoomProductRestrictionService } from '../room-product-restriction/room-product-restriction.service';
import {
  BulkDeleteRestrictionDto,
  BulkRestrictionOperationDto,
  BulkRestrictionResponse,
  CalendarRestrictionDirectDto,
  CalendarRestrictionDto,
  CreatePmsRestrictionDto,
  CreateRestrictionDto,
  GetHotelRestrictionsDto,
  GetRatePlanRestrictionsDto,
  GetRestrictionsDto,
  GetRoomProductRestrictionsDto,
  HotelRestrictionsDailyList,
  PmsRestrictionQueryDto,
  RatePlanRestrictionsDailyList,
  RoomProductRestrictionsDailyList,
  UpsertRestrictionDto
} from './restriction.dto';

@Injectable()
export class RestrictionService {
  logger = new Logger(RestrictionService.name);

  constructor(
    @InjectRepository(Restriction, DbName.Postgres)
    private readonly restrictionRepository: Repository<Restriction>,

    @InjectRepository(RoomProductMappingPms, DbName.Postgres)
    private readonly roomProductMappingPmsRepository: Repository<RoomProductMappingPms>,

    @InjectRepository(HotelRestrictionSetting, DbName.Postgres)
    private readonly hotelRestrictionSettingRepository: Repository<HotelRestrictionSetting>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(HotelRestrictionIntegrationSetting, DbName.Postgres)
    private readonly hotelRestrictionIntegrationSettingRepository: Repository<HotelRestrictionIntegrationSetting>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly pmsService: PmsService,

    @Inject(forwardRef(() => RoomProductRestrictionService))
    private readonly roomProductRestrictionService: RoomProductRestrictionService
  ) {}

  async onModuleInit() {}

  async getRestrictions(query: GetRestrictionsDto) {
    const {
      hotelId,
      type,
      roomProductIds,
      ratePlanIds,
      fromDate,
      toDate,
      limit,
      offset,
      level,
      hasMinLength,
      hasMaxLength,
      hasMinAdv,
      hasMaxAdv,
      hasMinLosThrough,
      hasMaxReservationCount
    } = query;

    const queryBuilder = this.restrictionRepository
      .createQueryBuilder('r')
      .select([
        'r.hotelId',
        'r.id',
        'r.type',
        'r.fromDate',
        'r.toDate',
        'r.weekdays',
        'r.roomProductIds',
        'r.ratePlanIds',
        'r.minLength',
        'r.maxLength',
        'r.minAdv',
        'r.maxAdv',
        'r.minLosThrough',
        'r.maxReservationCount',
        'r.createdAt',
        'r.updatedAt',
        'r.restrictionSource'
      ])
      .orderBy('r.createdAt', 'DESC')
      .addOrderBy('r.fromDate', 'ASC')
      .addOrderBy('r.updatedAt', 'DESC')
      .where('r.hotelId = :hotelId', { hotelId });

    if (type) {
      queryBuilder.andWhere('r.type IN (:...type)', { type: type });
    }

    // filter by level
    if (level) {
      switch (level) {
        case RestrictionLevel.ROOM_PRODUCT:
          if (roomProductIds?.length) {
            queryBuilder.andWhere('r.roomProductIds && :roomProductIds', { roomProductIds });
          }
          queryBuilder.andWhere('r.roomProductIds IS NOT NULL');
          queryBuilder.andWhere('r.ratePlanIds IS NULL');
          break;

        case RestrictionLevel.RATE_PLAN:
          if (ratePlanIds?.length) {
            queryBuilder.andWhere('r.ratePlanIds && :ratePlanIds', { ratePlanIds });
          }
          queryBuilder.andWhere('r.ratePlanIds IS NOT NULL');
          queryBuilder.andWhere('r.roomProductIds IS NULL');
          break;

        case RestrictionLevel.ROOM_PRODUCT_RATE_PLAN:
          if (roomProductIds?.length) {
            queryBuilder.andWhere('r.roomProductIds && :roomProductIds', { roomProductIds });
          }
          if (ratePlanIds?.length) {
            queryBuilder.andWhere('r.ratePlanIds && :ratePlanIds', { ratePlanIds });
          }
          queryBuilder.andWhere('r.ratePlanIds IS NOT NULL');
          queryBuilder.andWhere('r.roomProductIds IS NOT NULL');
          break;

        case RestrictionLevel.HOUSE_LEVEL:
          queryBuilder.andWhere('r.roomProductIds IS NULL');
          queryBuilder.andWhere('r.ratePlanIds IS NULL');
          break;
      }
    }

    if (roomProductIds?.length) {
      queryBuilder.andWhere('r.roomProductIds && :roomProductIds', { roomProductIds });
    }

    if (ratePlanIds?.length) {
      queryBuilder.andWhere('r.ratePlanIds && :ratePlanIds', { ratePlanIds });
    }

    if (fromDate && toDate) {
      queryBuilder
        .andWhere('r.fromDate <= :endDate', {
          endDate: format(new Date(toDate), DATE_FORMAT)
        })
        .andWhere('r.toDate >= :startDate', {
          startDate: format(new Date(fromDate), DATE_FORMAT)
        });
    }

    // Filter by presence/absence of restriction values
    if (hasMinLength !== undefined) {
      if (hasMinLength) {
        queryBuilder.andWhere('r.minLength IS NOT NULL');
      } else {
        queryBuilder.andWhere('r.minLength IS NULL');
      }
    }

    if (hasMaxLength !== undefined) {
      if (hasMaxLength) {
        queryBuilder.andWhere('r.maxLength IS NOT NULL');
      } else {
        queryBuilder.andWhere('r.maxLength IS NULL');
      }
    }

    if (hasMinAdv !== undefined) {
      if (hasMinAdv) {
        queryBuilder.andWhere('r.minAdv IS NOT NULL');
      } else {
        queryBuilder.andWhere('r.minAdv IS NULL');
      }
    }

    if (hasMaxAdv !== undefined) {
      if (hasMaxAdv) {
        queryBuilder.andWhere('r.maxAdv IS NOT NULL');
      } else {
        queryBuilder.andWhere('r.maxAdv IS NULL');
      }
    }

    if (hasMinLosThrough !== undefined) {
      if (hasMinLosThrough) {
        queryBuilder.andWhere('r.minLosThrough IS NOT NULL');
      } else {
        queryBuilder.andWhere('r.minLosThrough IS NULL');
      }
    }

    if (hasMaxReservationCount !== undefined) {
      if (hasMaxReservationCount) {
        queryBuilder.andWhere('r.maxReservationCount IS NOT NULL');
      } else {
        queryBuilder.andWhere('r.maxReservationCount IS NULL');
      }
    }

    if (limit) {
      queryBuilder.limit(limit);
    }

    if (offset) {
      queryBuilder.offset(offset);
    }

    try {
      const [results, totalCount] = await queryBuilder.getManyAndCount();

      const totalPages = Math.ceil(limit ? totalCount / limit : 0);

      return {
        data: results,
        totalCount,
        totalPages
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to get restrictions' + error.message);
    }
  }

  async getRatePlanRestrictions(
    query: GetRatePlanRestrictionsDto
  ): Promise<RatePlanRestrictionsDailyList[]> {
    const { hotelId, ratePlanIds, fromDate, toDate } = query;

    if (!hotelId || !ratePlanIds || !fromDate || !toDate || ratePlanIds.length === 0) {
      throw new BadRequestException(
        'hotelId, ratePlanIds, fromDate and toDate are required and ratePlanIds must be an array'
      );
    }

    const queryBuilder = this.buildRestrictionQuery(
      hotelId,
      fromDate,
      toDate,
      RestrictionLevel.RATE_PLAN,
      undefined,
      ratePlanIds // Query restrictions for the actual rate plan IDs (original or derived)
    );

    const restrictions = await queryBuilder.getMany();

    // Group restrictions by the rate plan ID we queried for (could be original or derived)
    const restrictionsByQueryRatePlan = new Map<string, any[]>();

    // Initialize map with all query rate plan IDs
    ratePlanIds.forEach((ratePlanId) => {
      restrictionsByQueryRatePlan.set(ratePlanId, []);
    });

    // Group restrictions by the rate plan IDs in the restriction data
    restrictions.forEach((restriction) => {
      if (restriction.ratePlanIds && restriction.ratePlanIds.length > 0) {
        restriction.ratePlanIds.forEach((restrictionRatePlanId) => {
          if (restrictionsByQueryRatePlan.has(restrictionRatePlanId)) {
            restrictionsByQueryRatePlan.get(restrictionRatePlanId)!.push(restriction);
          }
        });
      }
    });

    const ratePlans = await this.ratePlanRepository.find({ where: { id: In(ratePlanIds) } });
    // Process restrictions for each originally requested rate plan
    return ratePlanIds.map((originalRatePlanId) => {
      // Get restrictions for the query rate plan ID
      const ratePlanRestrictions = restrictionsByQueryRatePlan.get(originalRatePlanId) || [];

      const dailyRestrictionList = this.processRestrictionsForDateRange(
        ratePlanRestrictions,
        fromDate,
        toDate
      );

      const dates = Helper.generateDateRange(fromDate, toDate);

      // Return with the original rate plan ID (not the derived one)
      return {
        dailyRestrictionList: dates.map((date) => ({
          date,
          restrictionList: dailyRestrictionList.find((i) => i.date === date)?.restrictionList || [],
          dailyRestrictions:
            dailyRestrictionList.find((i) => i.date === date)?.dailyRestrictions || []
        })),
        hotelId,
        ratePlanId: originalRatePlanId,
        ratePlan: ratePlans.find((i) => i.id === originalRatePlanId),
        fromDate,
        toDate
      };
    });
  }

  async getHotelRestrictions(
    query: GetHotelRestrictionsDto
  ): Promise<HotelRestrictionsDailyList[]> {
    const { hotelId, fromDate, toDate } = query;

    if (!hotelId || !fromDate || !toDate) {
      throw new BadRequestException('hotelId, fromDate and toDate are required');
    }

    const queryBuilder = this.buildRestrictionQuery(
      hotelId,
      fromDate,
      toDate,
      RestrictionLevel.HOUSE_LEVEL
    );

    const restrictions = await queryBuilder.getMany();
    const dailyRestrictionList = this.processRestrictionsForDateRange(
      restrictions,
      fromDate,
      toDate
    );

    const dates = Helper.generateDateRange(fromDate, toDate);

    return dates.map((date) => ({
      date,
      restrictionList: dailyRestrictionList.find((i) => i.date === date)?.restrictionList || [],
      dailyRestrictions: dailyRestrictionList.find((i) => i.date === date)?.dailyRestrictions || [],
      hotelId,
      fromDate,
      toDate
    }));
  }

  async getRoomProductRestrictions(
    query: GetRoomProductRestrictionsDto
  ): Promise<RoomProductRestrictionsDailyList[]> {
    const { hotelId, fromDate, toDate, roomProductIds, roomProductTypes } = query;

    if (!hotelId || !fromDate || !toDate) {
      throw new BadRequestException(
        'hotelId, roomProductIds, fromDate and toDate are required and roomProductIds must be an array'
      );
    }

    let currentRoomProductIds: string[] = [];

    if (roomProductIds?.length && roomProductIds.length > 0) {
      currentRoomProductIds = roomProductIds;
    }

    if (roomProductTypes?.length && roomProductTypes.length > 0) {
      const roomProducts = await this.roomProductRepository.find({
        where: { type: In(roomProductTypes) },
        select: {
          id: true
        }
      });
      currentRoomProductIds = roomProducts.map((roomProduct) => roomProduct.id);
    }

    const queryBuilder = this.buildRestrictionQuery(
      hotelId,
      fromDate,
      toDate,
      RestrictionLevel.ROOM_PRODUCT,
      currentRoomProductIds
    );

    const restrictions = await queryBuilder.getMany();

    // Group restrictions by room product ID
    const restrictionsByRoomProduct = new Map<string, any[]>();

    // Initialize map with all requested room product IDs
    currentRoomProductIds.forEach((roomProductId) => {
      restrictionsByRoomProduct.set(roomProductId, []);
    });

    // Group restrictions by room product ID
    restrictions.forEach((restriction) => {
      // Check if any of the restriction's roomProductIds match our requested room product IDs
      if (restriction.roomProductIds && restriction.roomProductIds.length > 0) {
        restriction.roomProductIds.forEach((roomProductId) => {
          if (restrictionsByRoomProduct.has(roomProductId)) {
            restrictionsByRoomProduct.get(roomProductId)!.push(restriction);
          }
        });
      }
    });

    const dates = Helper.generateDateRange(fromDate, toDate);

    // Process restrictions for each room product
    return currentRoomProductIds.map((roomProductId) => {
      const roomProductRestrictions = restrictionsByRoomProduct.get(roomProductId) || [];
      const dailyRestrictionList = this.processRestrictionsForDateRange(
        roomProductRestrictions,
        fromDate,
        toDate
      );

      return {
        dailyRestrictionList: dates.map((date) => ({
          date,
          restrictionList: dailyRestrictionList.find((i) => i.date === date)?.restrictionList || [],
          dailyRestrictions:
            dailyRestrictionList.find((i) => i.date === date)?.dailyRestrictions || []
        })),
        hotelId,
        rfcId: roomProductId,
        fromDate,
        toDate
      };
    });
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

  private parseRestrictionExceptions(restriction: Restriction):
    | {
        code: HotelRestrictionCodeEnum;
        value: number | null;
        weekdays?: Weekday[];
        isAdjusted: boolean;
      }[]
    | [] {
    const restrictionExceptions: {
      code: HotelRestrictionCodeEnum;
      value: number | null;
      weekdays?: Weekday[];
      isAdjusted: boolean;
    }[] = [];
    if (!this.hasRestrictionExceptions(restriction)) {
      // If no restriction exceptions, return based on restriction type
      switch (restriction.type) {
        case RestrictionConditionType.ClosedToArrival:
          restrictionExceptions.push({
            code: HotelRestrictionCodeEnum.RSTR_CLOSE_TO_ARRIVAL,
            value: null,
            isAdjusted: false // hard code
          });

          break;

        case RestrictionConditionType.ClosedToDeparture:
          restrictionExceptions.push({
            code: HotelRestrictionCodeEnum.RSTR_CLOSE_TO_DEPARTURE,
            value: null,
            isAdjusted: false // hard code
          });
          break;

        case RestrictionConditionType.ClosedToStay:
          restrictionExceptions.push({
            code: HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY,
            value: null,
            isAdjusted: false // hard code
          });

          break;
        default:
          return [];
      }
    }

    // Check advance booking restrictions first (priority order)
    if (restriction.minAdv != null && restriction.minAdv > 0) {
      restrictionExceptions.push({
        code: HotelRestrictionCodeEnum.RSTR_MIN_ADVANCE_BOOKING,
        value: restriction.minAdv,
        isAdjusted: restriction.restrictionSource?.minAdv === RestrictionSourceType.MANUAL
      });
    }

    if (restriction.maxAdv != null && restriction.maxAdv > 0) {
      restrictionExceptions.push({
        code: HotelRestrictionCodeEnum.RSTR_MAX_ADVANCE_BOOKING,
        value: restriction.maxAdv,
        isAdjusted: restriction.restrictionSource?.maxAdv === RestrictionSourceType.MANUAL
      });
    }

    // Check length of stay restrictions
    if (restriction.minLength != null && restriction.minLength > 0) {
      restrictionExceptions.push({
        code: HotelRestrictionCodeEnum.RSTR_LOS_MIN,
        value: restriction.minLength,
        isAdjusted: restriction.restrictionSource?.minLength === RestrictionSourceType.MANUAL
      });
    }

    if (restriction.maxLength != null && restriction.maxLength > 0) {
      restrictionExceptions.push({
        code: HotelRestrictionCodeEnum.RSTR_LOS_MAX,
        value: restriction.maxLength,
        isAdjusted: restriction.restrictionSource?.maxLength === RestrictionSourceType.MANUAL
      });
    }

    // Check minimum LOS through restriction
    if (restriction.minLosThrough != null && restriction.minLosThrough > 0) {
      restrictionExceptions.push({
        code: HotelRestrictionCodeEnum.RSTR_MIN_LOS_THROUGH,
        value: restriction.minLosThrough,
        weekdays: restriction.weekdays,
        isAdjusted: restriction.restrictionSource?.minLosThrough === RestrictionSourceType.MANUAL
      });
    }

    // Check max reservation count
    if (restriction.maxReservationCount != null && restriction.maxReservationCount > 0) {
      restrictionExceptions.push({
        code: HotelRestrictionCodeEnum.RSTR_LOS_MAX, // Using LOS_MAX as closest match for reservation count
        value: restriction.maxReservationCount,
        isAdjusted:
          restriction.restrictionSource?.maxReservationCount === RestrictionSourceType.MANUAL
      });
    }

    return restrictionExceptions;
  }

  /**
   * Common helper to process restrictions for a date range
   */
  private processRestrictionsForDateRange(
    restrictions: Restriction[],
    fromDate: string,
    toDate: string
  ): {
    date: string;
    restrictionList: {
      code: HotelRestrictionCodeEnum;
      value: number | null;
      weekdays?: Weekday[];
      isAdjusted: boolean;
    }[];
    dailyRestrictions: Restriction[];
  }[] {
    const datesRange = Helper.generateDateRange(fromDate, toDate);
    const dailyRestrictionMap = new Map<
      string,
      {
        restrictionList: {
          code: HotelRestrictionCodeEnum;
          value: number | null;
          weekdays?: Weekday[];
          isAdjusted: boolean;
        }[];
        dailyRestrictions: Restriction[];
      }
    >();

    for (const date of datesRange) {
      const dailyRestrictions = restrictions.filter((restriction) => {
        const restrictionDates = eachDayOfInterval({
          start: restriction.fromDate,
          end: restriction.toDate
        }).map((date) => format(date, DATE_FORMAT));
        return restrictionDates?.includes(date);
      });

      if (dailyRestrictions.length > 0) {
        const restrictionList: {
          code: HotelRestrictionCodeEnum;
          value: number | null;
          weekdays?: Weekday[];
          isAdjusted: boolean;
        }[] = [];

        // Process each restriction for this date
        for (const restriction of dailyRestrictions) {
          const restrictionDetails = this.parseRestrictionExceptions(restriction);
          if (restrictionDetails.length > 0) {
            for (const restrictionDetail of restrictionDetails) {
              restrictionList.push({
                code: restrictionDetail.code,
                value: restrictionDetail.value,
                weekdays: restrictionDetail.weekdays,
                isAdjusted: restrictionDetail.isAdjusted
              });
            }
          }
        }

        // Only add dates that have restrictions
        if (restrictionList.length > 0) {
          dailyRestrictionMap.set(date, {
            restrictionList,
            dailyRestrictions
          });
        }
      }
    }

    // Convert map to array format required by interface
    return Array.from(dailyRestrictionMap.entries()).map(
      ([date, { restrictionList, dailyRestrictions }]) => ({
        date,
        restrictionList,
        dailyRestrictions
      })
    );
  }

  /**
   * Common helper to build restriction query with level filtering
   */
  private buildRestrictionQuery(
    hotelId: string,
    fromDate: string,
    toDate: string,
    level?: RestrictionLevel,
    roomProductIds?: string[],
    ratePlanIds?: string[]
  ) {
    const queryBuilder = this.restrictionRepository
      .createQueryBuilder('r')
      .select([
        'r.hotelId',
        'r.id',
        'r.type',
        'r.fromDate',
        'r.toDate',
        'r.ratePlanIds',
        'r.roomProductIds',
        'r.minLength',
        'r.maxLength',
        'r.minAdv',
        'r.maxAdv',
        'r.minLosThrough',
        'r.metadata',
        'r.weekdays',
        'r.restrictionSource'
      ])
      .orderBy('r.fromDate', 'ASC')
      .where('r.hotelId = :hotelId', { hotelId })
      .andWhere('r.fromDate <= :endDate', {
        endDate: toDate
      })
      .andWhere('r.toDate >= :startDate', {
        startDate: fromDate
      });

    // Apply level-based filtering (line 99 logic)
    if (level) {
      switch (level) {
        case RestrictionLevel.ROOM_PRODUCT:
          if (roomProductIds?.length) {
            queryBuilder.andWhere('r.roomProductIds && :roomProductIds', { roomProductIds });
          }
          queryBuilder.andWhere('r.ratePlanIds IS NULL');
          break;

        case RestrictionLevel.RATE_PLAN:
          if (ratePlanIds?.length) {
            queryBuilder.andWhere('r.ratePlanIds && :ratePlanIds', { ratePlanIds });
          }
          queryBuilder.andWhere('r.roomProductIds IS NULL');
          break;

        case RestrictionLevel.ROOM_PRODUCT_RATE_PLAN:
          if (roomProductIds?.length) {
            queryBuilder.andWhere('r.roomProductIds && :roomProductIds', { roomProductIds });
          }
          if (ratePlanIds?.length) {
            queryBuilder.andWhere('r.ratePlanIds && :ratePlanIds', { ratePlanIds });
          }
          break;

        case RestrictionLevel.HOUSE_LEVEL:
          queryBuilder.andWhere('r.roomProductIds IS NULL');
          queryBuilder.andWhere('r.ratePlanIds IS NULL');
          break;
      }
    }

    return queryBuilder;
  }

  async mergeRestrictions(body: CreateRestrictionDto) {
    // Validate dates are provided for merging logic
    if (!body.fromDate || !body.toDate) {
      throw new BadRequestException('fromDate and toDate are required for restriction merging');
    }

    // Validate date objects
    if (isNaN(new Date(body.fromDate).getTime()) || isNaN(new Date(body.toDate).getTime())) {
      throw new BadRequestException('Invalid date format provided');
    }

    const dateRange = Helper.generateDateRange(body.fromDate, body.toDate);

    // filter date range by week days
    const weekdayMap: Weekday[] = [
      Weekday.Sunday,
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
      Weekday.Saturday
    ];

    const filteredDateRange = dateRange.filter((date) => {
      const dateObj = new Date(date);
      const weekday = weekdayMap[dateObj.getDay()];
      return body.weekdays?.includes(weekday);
    });

    const restrictionsToCreateDto: CreateRestrictionDto[] = [];

    filteredDateRange.forEach((date) => {
      const newRestriction: Partial<Restriction> = {
        ...this.mapDtoToEntity(body),
        fromDate: new Date(date),
        toDate: new Date(date)
      };
      restrictionsToCreateDto.push(newRestriction as CreateRestrictionDto);
    });

    const { restrictionsToCreate, restrictionsToRemove } = await this.bulkMergeRestrictions(
      restrictionsToCreateDto,
      true
    );

    return {
      restrictionsToCreate: restrictionsToCreate,
      restrictionsToRemove: restrictionsToRemove
    };
  }

  /**
   * Deduplicates and merges restrictions that have the same key properties
   * but different restriction values (like minLength, maxLength, etc.)
   */
  private deduplicateAndMergeRestrictions(restrictions: Restriction[]): Restriction[] {
    const restrictionMap = new Map<string, Restriction>();

    for (const restriction of restrictions) {
      // Create a key based on properties that should be unique together
      const key = this.createRestrictionKey(restriction);

      if (restrictionMap.has(key)) {
        // Merge with existing restriction
        const existing = restrictionMap.get(key);
        const merged = this.mergeRestrictionValues(existing, restriction);
        restrictionMap.set(key, merged);
      } else {
        // Add new restriction
        restrictionMap.set(key, { ...restriction });
      }
    }

    return Array.from(restrictionMap.values());
  }

  /**
   * Creates a unique key for a restriction based on properties that should be unique together
   */
  private createRestrictionKey(restriction: any): string {
    const roomProductIds = restriction.roomProductIds
      ? JSON.stringify(restriction.roomProductIds.sort())
      : 'null';
    const ratePlanIds = restriction.ratePlanIds
      ? JSON.stringify(restriction.ratePlanIds.sort())
      : 'null';
    const weekdays = restriction.weekdays ? JSON.stringify(restriction.weekdays.sort()) : 'null';

    return `${restriction.hotelId}|${restriction.type}|${restriction.fromDate}|${restriction.toDate}|${roomProductIds}|${ratePlanIds}|${weekdays}`;
  }

  /**
   * Merges two restrictions with the same key properties
   * Takes the most restrictive values for each field and handles source tracking
   */
  private mergeRestrictionValues(existing: any, incoming: any): any {
    return {
      ...existing,
      // For length restrictions, take the most restrictive (higher min, lower max)
      minLength: this.getMostRestrictiveMin(existing.minLength, incoming.minLength),
      maxLength: this.getMostRestrictiveMax(existing.maxLength, incoming.maxLength),

      // For advance booking restrictions, take the most restrictive
      minAdv: this.getMostRestrictiveMin(existing.minAdv, incoming.minAdv),
      maxAdv: this.getMostRestrictiveMax(existing.maxAdv, incoming.maxAdv),

      // For LOS through restrictions, take the most restrictive
      minLosThrough: this.getMostRestrictiveMin(existing.minLosThrough, incoming.minLosThrough),

      // For reservation count, take the most restrictive (lower value)
      maxReservationCount: this.getMostRestrictiveMax(
        existing.maxReservationCount,
        incoming.maxReservationCount
      ),

      // Merge restriction sources
      restrictionSource: existing?.restrictionSource
    };
  }

  /**
   * Gets the most restrictive minimum value (higher value)
   */
  private getMostRestrictiveMin(existing: number | null, incoming: number | null): number | null {
    if (existing === null && incoming === null) return null;
    if (existing === null) return incoming;
    if (incoming === null) return existing;
    return Math.max(existing, incoming);
  }

  /**
   * Gets the most restrictive maximum value (lower value)
   */
  private getMostRestrictiveMax(existing: number | null, incoming: number | null): number | null {
    if (existing === null && incoming === null) return null;
    if (existing === null) return incoming;
    if (incoming === null) return existing;
    return Math.min(existing, incoming);
  }

  async upsertRestrictions(body: UpsertRestrictionDto) {
    try {
      const { restrictionsToCreate, restrictionsToRemove } = body;

      if (!restrictionsToCreate || restrictionsToCreate.length === 0) {
        throw new BadRequestException('No restrictions to create');
      }

      // Remove old restrictions
      if (restrictionsToRemove && restrictionsToRemove.length > 0) {
        const ids = restrictionsToRemove.map((restriction) => restriction.id);

        if (ids.length > 0) {
          await this.restrictionRepository.delete({
            id: In(ids)
          });
        }
        this.logger.log(`Removed ${restrictionsToRemove.length} old restrictions`);
      }

      // Create new restrictions
      const savedRestrictions = await this.restrictionRepository.save(restrictionsToCreate);

      this.logger.log(`Successfully created ${restrictionsToCreate.length} restrictions`);

      if (savedRestrictions.length > 0) {
        // this.queuePmsRestriction(restrictionsToCreate[0].hotelId, restrictionsToCreate);
        const roomProductIds =
          savedRestrictions.map((restriction) => restriction.roomProductIds ?? []).flat() ?? [];
        const ratePlanIds =
          savedRestrictions.map((restriction) => restriction.ratePlanIds ?? []).flat() ?? [];

        const fromDate = new Date(
          Math.min(
            ...savedRestrictions.map((restriction) => new Date(restriction.fromDate).getTime())
          )
        );
        const toDate = new Date(
          Math.max(
            ...savedRestrictions.map((restriction) => new Date(restriction.toDate).getTime())
          )
        );
        this.pushPmsRestriction(
          savedRestrictions[0].hotelId,
          format(fromDate, DATE_FORMAT),
          format(toDate, DATE_FORMAT),
          roomProductIds,
          ratePlanIds
        );
      }

      // handle derived rate plan restriction - optimized to avoid N+1 queries
      if (savedRestrictions.length > 0) {
        await this.bulkHandleCreateDerivedRestrictions(savedRestrictions);
      }

      // check if have CTS restriction manually, if have, run automate CTS restriction
      const ctsRestrictions = savedRestrictions.filter(
        (restriction) =>
          restriction.type === RestrictionConditionType.ClosedToStay &&
          !this.hasRestrictionExceptions(restriction)
      );
      if (ctsRestrictions.length > 0) {
        this.logger.log(`Found ${ctsRestrictions.length} CTS restrictions to process`);
        const roomProductIds =
          ctsRestrictions.map((restriction) => restriction.roomProductIds ?? []).flat() ?? [];

        const fromDate = new Date(
          Math.min(
            ...ctsRestrictions.map((restriction) => new Date(restriction.fromDate).getTime())
          )
        );
        await this.roomProductRestrictionService.processAutomateLos({
          hotelId: savedRestrictions[0].hotelId,
          roomProductIds,
          fromDate: format(fromDate, DATE_FORMAT)
        });
      }

      // Return detailed result
      return {
        removedRestrictions: restrictionsToRemove,
        createdRestrictions: restrictionsToCreate
      };
    } catch (error) {
      this.logger.error('Error creating/merging restriction:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create restriction: ' + error.message);
    }
  }

  /**
   * Validates a single restriction DTO
   */
  private validateRestriction(restriction: CreateRestrictionDto): string | null {
    // Validate hotelId
    if (!restriction.hotelId) {
      return 'hotelId is required';
    }

    // Validate type
    if (!restriction.type || !Object.values(RestrictionConditionType).includes(restriction.type)) {
      return 'type must be a valid RestrictionConditionType';
    }

    // Validate date range
    if (restriction.fromDate && restriction.toDate) {
      const fromDate = new Date(restriction.fromDate);
      const toDate = new Date(restriction.toDate);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return 'fromDate and toDate must be valid dates';
      }

      if (fromDate > toDate) {
        return 'fromDate must be less than or equal to toDate';
      }
    }

    // Validate weekdays
    if (restriction.weekdays) {
      if (!Array.isArray(restriction.weekdays) || restriction.weekdays.length === 0) {
        return 'weekdays must be a non-empty array';
      }

      for (const weekday of restriction.weekdays) {
        if (!Object.values(Weekday).includes(weekday)) {
          return `Invalid weekday: ${weekday}. Must be one of: ${Object.values(Weekday).join(', ')}`;
        }
      }
    }

    // Validate roomProductIds (should be UUID array if provided)
    if (restriction.roomProductIds) {
      if (!Array.isArray(restriction.roomProductIds)) {
        return 'roomProductIds must be an array';
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const id of restriction.roomProductIds) {
        if (typeof id !== 'string' || !uuidRegex.test(id)) {
          return `Invalid roomProductId: ${id}. Must be a valid UUID`;
        }
      }
    }

    // Validate ratePlanIds (should be text array if provided)
    if (restriction.ratePlanIds) {
      if (!Array.isArray(restriction.ratePlanIds)) {
        return 'ratePlanIds must be an array';
      }

      for (const id of restriction.ratePlanIds) {
        if (typeof id !== 'string' || id.trim().length === 0) {
          return `Invalid ratePlanId: ${id}. Must be a non-empty string`;
        }
      }
    }

    return null; // No validation errors
  }

  /**
   * Comprehensive bulk restriction operation handler
   * Supports all scenarios: duplicate handling, override handling, and mixed cases
   */
  async handleBulkRestrictionOperation(
    body: BulkRestrictionOperationDto,
    isCallDerived: boolean = true
  ): Promise<BulkRestrictionResponse> {
    if (!body.restrictionsToAdd?.length) {
      this.logger.warn('No restrictions to add');
      return {
        newRestrictionsToAdd: []
      };
    }

    try {
      const { restrictionsToAdd } = body;

      // step 1: Validate all restrictions to add
      const invalidRestrictions: CreateRestrictionDto[] = [];
      const validRestrictionsToAdd: CreateRestrictionDto[] = [];

      for (const restriction of restrictionsToAdd) {
        const validationError = this.validateRestriction(restriction);
        if (validationError) {
          invalidRestrictions.push(restriction);
        } else {
          validRestrictionsToAdd.push(restriction);
        }
      }

      if (invalidRestrictions.length > 0) {
      }

      const { restrictionsToCreate, restrictionsToRemove } = await this.bulkMergeRestrictions(
        validRestrictionsToAdd,
        true
      );

      // step 5: remove restrictionsToRemove
      if (restrictionsToRemove?.length > 0) {
        const BATCH_SIZE = 500;
        for (let i = 0; i < restrictionsToRemove.length; i += BATCH_SIZE) {
          const batch = restrictionsToRemove.slice(i, i + BATCH_SIZE);
          await this.restrictionRepository.remove(batch);
        }
      }

      // step 6: create restrictionsToCreate
      if (restrictionsToCreate?.length > 0) {
        const BATCH_SIZE = 500;
        for (let i = 0; i < restrictionsToCreate.length; i += BATCH_SIZE) {
          const batch = restrictionsToCreate.slice(i, i + BATCH_SIZE);
          await this.restrictionRepository.save(batch);
        }
      }

      this.logger.log(
        `Bulk operation completed: Merged ${restrictionsToCreate.length} restrictions at: ${new Date().toISOString()}`
      );

      // step 7: queue pms restriction
      if (restrictionsToCreate.length > 0) {
        // await this.queuePmsRestriction(restrictionsToCreate[0].hotelId, restrictionsToCreate);

        const roomProductIds =
          restrictionsToCreate.map((restriction) => restriction.roomProductIds ?? []).flat() ?? [];
        const ratePlanIds =
          restrictionsToCreate.map((restriction) => restriction.ratePlanIds ?? []).flat() ?? [];

        const fromDate = new Date(
          Math.min(
            ...restrictionsToCreate.map((restriction) => new Date(restriction.fromDate).getTime())
          )
        );
        const toDate = new Date(
          Math.max(
            ...restrictionsToCreate.map((restriction) => new Date(restriction.toDate).getTime())
          )
        );

        this.pushPmsRestriction(
          restrictionsToCreate[0].hotelId,
          format(fromDate, DATE_FORMAT),
          format(toDate, DATE_FORMAT),
          roomProductIds,
          ratePlanIds
        );
      }

      // step 8: handle derived rate plan restriction
      if (restrictionsToCreate.length > 0 && isCallDerived) {
        const ratePlanIds = this.extractRatePlanIdsFromRestrictions(restrictionsToCreate);
        if (ratePlanIds.length > 0) {
          await this.bulkHandleCreateDerivedRestrictions(restrictionsToCreate);
        }
      }

      return {
        newRestrictionsToAdd: restrictionsToCreate.length > 0 ? restrictionsToCreate : []
      };
    } catch (error) {
      this.logger.error('Error in bulk restriction operation:', error);
      throw new BadRequestException(
        'Failed to handle bulk restriction operation: ' + error.message
      );
    }
  }

  /**
   * Handle derived restrictions when creating a restriction on a parent rate plan
   * Automatically creates corresponding restrictions for derived rate plans
   */
  async handleCreateDerivedRestrictions(
    parentRestriction: Restriction,
    hotelId: string,
    ratePlanId: string
  ): Promise<Restriction[]> {
    if (!parentRestriction || !ratePlanId) {
      return [];
    }

    try {
      const derivedRestrictions: Partial<Restriction>[] = [];

      // Fetch derived rate plans that follow restrictions
      const derivedRatePlans = await this.findDerivedRatePlansWithRestrictionFollowing([
        ratePlanId
      ]);

      if (derivedRatePlans.length === 0) {
        return [];
      }

      // create lookup map and run in parallel
      const derivedRestrictionsMap = new Map<string, Restriction[]>();
      const derivedRatePlanIds = derivedRatePlans.map(
        (derivedRatePlan) => derivedRatePlan.ratePlanId
      );
      const derivedRatePlanSet = new Set(derivedRatePlanIds);
      const ratePlanRestrictions: Restriction[] | null =
        (
          await this.findExistingRestriction(
            hotelId,
            derivedRatePlanIds,
            parentRestriction.type,
            parentRestriction.fromDate,
            parentRestriction.toDate
          )
        )?.filter((restriction) => restriction.ratePlanIds.length > 0) || [];

      if (ratePlanRestrictions.length > 0) {
        for (const restriction of ratePlanRestrictions) {
          for (const ratePlanId of restriction.ratePlanIds) {
            // Only group if this ratePlanId is one of the derivedRatePlanIds
            if (derivedRatePlanSet.has(ratePlanId)) {
              const current = derivedRestrictionsMap.get(ratePlanId) || [];
              current.push(restriction);
              derivedRestrictionsMap.set(ratePlanId, current);
            }
          }
        }
      }

      await Promise.allSettled(
        derivedRatePlans.map(async (derivedRatePlan) => {
          // Check if derived rate plan already has a restriction for the same period
          const id = derivedRatePlan.ratePlanId;
          const existingRestrictions = derivedRestrictionsMap.get(id);
          if (existingRestrictions) {
            // Merge with existing restriction using strongest wins logic
            for (const existingRestriction of existingRestrictions) {
              const mergedRestriction = this.mergeDerivedRestrictions(
                parentRestriction,
                existingRestriction,
                derivedRatePlan.inheritedRestrictionFields
              );

              derivedRestrictions.push({ ...existingRestriction, ...mergedRestriction });
            }
          } else {
            // Create new derived restriction
            const newRestriction = this.createDerivedRestriction(
              parentRestriction,
              derivedRatePlan,
              derivedRatePlan.inheritedRestrictionFields
            );
            derivedRestrictions.push(newRestriction);
          }
        })
      );

      if (derivedRestrictions.length > 0) {
        // use merge to avoid duplicates
        const createdRestrictions: any = (derivedRestrictions || []).map((restriction) => ({
          hotelId: restriction.hotelId!,
          type: restriction.type!,
          weekdays: restriction.weekdays!,
          fromDate: restriction.fromDate!,
          toDate: restriction.toDate!,
          roomProductIds: restriction.roomProductIds || undefined,
          ratePlanIds: restriction.ratePlanIds || undefined,
          minLength: restriction.minLength! || undefined,
          maxLength: restriction.maxLength! || undefined,
          minAdv: restriction.minAdv! || undefined,
          maxAdv: restriction.maxAdv! || undefined,
          minLosThrough: restriction.minLosThrough! || undefined,
          maxReservationCount: restriction.maxReservationCount! || undefined,
          metadata: restriction.metadata! || undefined,
          restrictionSource: restriction.restrictionSource! || undefined
        }));

        const mergedRestrictions = await this.handleBulkRestrictionOperation(
          {
            restrictionsToAdd: createdRestrictions
          },
          false
        );

        this.logger.log(
          `Created/updated ${derivedRestrictions.length} derived restrictions for parent restriction ${parentRestriction.id}`
        );

        // Queue PMS updates
        if (derivedRestrictions.length > 0) {
          // await this.queuePmsRestriction(parentRestriction.hotelId, savedRestrictions);
        }

        return mergedRestrictions.newRestrictionsToAdd || [];
      }

      return [];
    } catch (error) {
      this.logger.error('Error handling create derived restrictions:', error);
      throw new BadRequestException('Failed to handle derived restrictions: ' + error.message);
    }
  }

  async copyRestriction(hotelId: string, derivedRatePlanId: string): Promise<void> {
    // copy restriction from ratePlanId to derivedRatePlanId from today onwards
    const restrictions = await this.restrictionRepository.find({
      where: {
        hotelId,
        ratePlanIds: Raw((alias) => `${alias} && ARRAY[:...ratePlanIds]::text[]`, {
          ratePlanIds: [derivedRatePlanId]
        })
      }
    });

    if (restrictions.length === 0) {
      return;
    }

    await this.bulkHandleCreateDerivedRestrictions(restrictions);
  }

  /**
   * Handle derived restrictions when deleting a restriction from a parent rate plan
   * Only removes inherited fields, preserves custom fields
   * OPTIMIZED: Single bulk query to avoid N+1 issues
   */
  async handleDeleteDerivedRestrictions(deletedRestriction: Restriction): Promise<void> {
    if (!deletedRestriction.ratePlanIds || deletedRestriction.ratePlanIds.length === 0) {
      return;
    }

    try {
      // Single optimized query to get all derived restrictions with their settings
      const derivedRestrictionsWithSettings = await this.restrictionRepository
        .createQueryBuilder('restriction')
        .leftJoin('rate_plan', 'rp', 'restriction.rate_plan_ids && ARRAY[rp.id]::text[]')
        .leftJoin('rate_plan_derived_setting', 'rpds', 'rpds.rate_plan_id = rp.id')
        .select([
          'restriction.id as "restrictionId"',
          'restriction.hotel_id as "hotelId"',
          'restriction.rate_plan_ids as "ratePlanIds"',
          'restriction.min_length as "minLength"',
          'restriction.max_length as "maxLength"',
          'restriction.min_adv as "minAdv"',
          'restriction.max_adv as "maxAdv"',
          'restriction.min_los_through as "minLosThrough"',
          'restriction.restriction_source as "restrictionSource"',
          'restriction.max_reservation_count as "maxReservationCount"',
          'restriction.metadata as "metadata"',
          'rpds.inherited_restriction_fields as "inheritedFields"',
          'rpds.derived_rate_plan_id as "parentRatePlanId"'
        ])
        .where('rpds.follow_daily_restriction = true')
        .andWhere('rpds.derived_rate_plan_id IN (:...parentRatePlanIds)', {
          parentRatePlanIds: deletedRestriction.ratePlanIds
        })
        .andWhere('restriction.type = :type', { type: deletedRestriction.type })
        .andWhere('restriction.from_date = :fromDate', { fromDate: deletedRestriction.fromDate })
        .andWhere('restriction.to_date = :toDate', { toDate: deletedRestriction.toDate })
        .getRawMany();

      if (derivedRestrictionsWithSettings.length === 0) {
        return;
      }

      // Process restrictions in batches to avoid memory issues
      const BATCH_SIZE = 100;
      const restrictionsToDelete: string[] = [];
      const restrictionsToUpdate: Array<{ id: string; updates: any }> = [];

      for (let i = 0; i < derivedRestrictionsWithSettings.length; i += BATCH_SIZE) {
        const batch = derivedRestrictionsWithSettings.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
          const inheritedFields = item.inheritedFields || [];

          // Create restriction object for processing
          const restriction = {
            id: item.restrictionId,
            hotelId: item.hotelId,
            ratePlanIds: item.ratePlanIds,
            minLength: item.minLength,
            maxLength: item.maxLength,
            minAdv: item.minAdv,
            maxAdv: item.maxAdv,
            minLosThrough: item.minLosThrough,
            maxReservationCount: item.maxReservationCount,
            metadata: item.metadata
          } as Restriction;

          // Remove only inherited fields, keep custom fields
          const updatedRestriction = this.removeInheritedFields(restriction, inheritedFields);

          // If no fields remain, mark for deletion
          if (this.hasNoRestrictionFields(updatedRestriction)) {
            restrictionsToDelete.push(item.restrictionId);
          } else {
            // Mark for update with remaining custom fields
            const sanitizedUpdate = Object.fromEntries(
              Object.entries(updatedRestriction).map(([key, value]) => [
                key,
                value === undefined ? null : value
              ])
            );
            restrictionsToUpdate.push({
              id: item.restrictionId,
              updates: sanitizedUpdate
            });
          }
        }
      }

      // Execute bulk operations
      if (restrictionsToDelete.length > 0) {
        await this.restrictionRepository.delete({
          id: In(restrictionsToDelete)
        });
        this.logger.log(
          `Bulk deleted ${restrictionsToDelete.length} derived restrictions as no custom fields remain`
        );
      }

      if (restrictionsToUpdate.length > 0) {
        // Use transaction for bulk updates
        await this.restrictionRepository.manager.transaction(async (manager) => {
          for (const { id, updates } of restrictionsToUpdate) {
            await manager.update(Restriction, id, updates);
          }
        });
        this.logger.log(
          `Bulk updated ${restrictionsToUpdate.length} derived restrictions, removed inherited fields`
        );
      }
    } catch (error) {
      this.logger.error('Error handling delete derived restrictions:', error);
      throw new BadRequestException(
        'Failed to handle derived restriction deletion: ' + error.message
      );
    }
  }

  /**
   * Find derived rate plans that have followDailyRestriction enabled
   */
  private async findDerivedRatePlansWithRestrictionFollowing(
    parentRatePlanIds: string[]
  ): Promise<RatePlanDerivedSetting[]> {
    return await this.ratePlanDerivedSettingRepository.find({
      where: {
        derivedRatePlanId: In(parentRatePlanIds),
        followDailyRestriction: true
      },
      select: {
        followDailyRestriction: true,
        derivedRatePlanId: true,
        inheritedRestrictionFields: true,
        hotelId: true,
        ratePlanId: true
      }
    });
  }

  /**
   * Find existing restriction for a rate plan in a specific period
   */
  private async findExistingRestriction(
    hotelId: string,
    ratePlanIds: string[],
    type: RestrictionConditionType,
    fromDate: Date,
    toDate: Date
  ): Promise<Restriction[] | null> {
    return await this.restrictionRepository.find({
      where: {
        hotelId,
        ratePlanIds: Raw((alias) => `${alias} && ARRAY[:...ratePlanIds]::text[]`, {
          ratePlanIds
        }),
        roomProductIds: IsNull(),
        type,
        fromDate,
        toDate
      }
    });
  }

  /**
   * Find derived restriction that was created from a parent restriction
   */
  private async findDerivedRestriction(
    hotelId: string,
    ratePlanIds: string[],
    type: RestrictionConditionType,
    fromDate: Date,
    toDate: Date,
    parentRestrictionId: string
  ): Promise<Restriction | null> {
    return await this.restrictionRepository.findOne({
      where: {
        hotelId,
        ratePlanIds: Raw((alias) => `${alias} && ARRAY[:...ratePlanIds]::text[]`, {
          ratePlanIds
        }),
        type,
        fromDate,
        toDate,
        metadata: Raw((alias) => `${alias}->>'parentRestrictionId' = :parentId`, {
          parentId: parentRestrictionId
        })
      }
    });
  }

  /**
   * Create a new derived restriction from a parent restriction
   */
  private createDerivedRestriction(
    parentRestriction: Restriction,
    derivedRatePlan: RatePlanDerivedSetting,
    inheritedFields: RatePlanDerivedSettingInheritedFields[]
  ): Partial<Restriction> {
    const inheritedFieldsArray = inheritedFields || [];

    const metadata: RestrictionMetadata = {
      isAdjusted: false,
      inheritedFields: inheritedFieldsArray,
      parentRestrictionId: parentRestriction.id,
      isDerived: true
    };

    return {
      hotelId: derivedRatePlan.hotelId,
      type: parentRestriction.type,
      fromDate: parentRestriction.fromDate,
      toDate: parentRestriction.toDate,
      weekdays: parentRestriction.weekdays,
      roomProductIds: parentRestriction.roomProductIds,
      ratePlanIds: [derivedRatePlan.ratePlanId],
      minLength: inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minLength)
        ? parentRestriction.minLength
        : undefined,
      maxLength: inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxLength)
        ? parentRestriction.maxLength
        : undefined,
      minAdv: inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minAdv)
        ? parentRestriction.minAdv
        : undefined,
      maxAdv: inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxAdv)
        ? parentRestriction.maxAdv
        : undefined,
      minLosThrough: inheritedFieldsArray.includes(
        RatePlanDerivedSettingInheritedFields.minLosThrough
      )
        ? parentRestriction.minLosThrough
        : undefined,
      maxReservationCount: inheritedFieldsArray.includes(
        RatePlanDerivedSettingInheritedFields.maxReservationCount
      )
        ? parentRestriction.maxReservationCount
        : undefined,
      metadata: metadata,
      restrictionSource: parentRestriction.restrictionSource || undefined
    };
  }

  /**
   * Merge parent and child restrictions -> get data from parent restriction
   */
  private mergeDerivedRestrictions(
    parentRestriction: Restriction,
    childRestriction: Restriction,
    inheritedFields: RatePlanDerivedSettingInheritedFields[]
  ): Partial<Restriction> {
    const merged: Partial<Restriction> = {};

    const inheritedFieldsArray = inheritedFields || [];

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minLength)) {
      merged.minLength = parentRestriction.minLength;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxLength)) {
      merged.maxLength = parentRestriction.maxLength;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minAdv)) {
      merged.minAdv = parentRestriction.minAdv;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxAdv)) {
      merged.maxAdv = parentRestriction.maxAdv;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minLosThrough)) {
      merged.minLosThrough = parentRestriction.minLosThrough;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxReservationCount)) {
      merged.maxReservationCount = parentRestriction.maxReservationCount;
    }

    // Update metadata to track inheritance
    merged.metadata = {
      ...childRestriction.metadata,
      inheritedFields: inheritedFieldsArray,
      parentRestrictionId: parentRestriction.id,
      isDerived: true
    };

    merged.updatedAt = new Date();

    return merged;
  }

  /**
   * Remove inherited fields from a restriction, keeping only custom fields
   */
  private removeInheritedFields(
    restriction: Restriction,
    inheritedFields: RatePlanDerivedSettingInheritedFields[]
  ): Partial<Restriction> {
    const updates: Partial<Restriction> = {};
    const metadata = (restriction.metadata as RestrictionMetadata) || {};
    const inheritedFieldsArray = inheritedFields || [];

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minLength)) {
      updates.minLength = undefined;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxLength)) {
      updates.maxLength = undefined;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minAdv)) {
      updates.minAdv = undefined;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxAdv)) {
      updates.maxAdv = undefined;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.minLosThrough)) {
      updates.minLosThrough = undefined;
    }

    if (inheritedFieldsArray.includes(RatePlanDerivedSettingInheritedFields.maxReservationCount)) {
      updates.maxReservationCount = undefined;
    }

    // Update metadata to remove inheritance tracking
    updates.metadata = {
      ...metadata,
      inheritedFields: [],
      parentRestrictionId: null,
      isDerived: false
    };

    updates.updatedAt = new Date();

    return updates;
  }

  /**
   * Check if a restriction has any meaningful restriction fields
   */
  private hasNoRestrictionFields(r: Partial<Restriction>): boolean {
    const fieldNames = [
      'minLength',
      'maxLength',
      'minAdv',
      'maxAdv',
      'minLosThrough',
      'maxReservationCount'
    ];

    // false if any field is missing
    if (!fieldNames.every((key) => key in r)) {
      return false;
    }

    // true only if all are null or undefined
    return fieldNames.every((key) => {
      const value = (r as any)[key];
      return value === null || value === undefined;
    });
  }

  /**
   * Strongest wins logic for minLength (higher value wins)
   */
  private getStrongestMinLength(parentValue: number, childValue: number): number {
    if (parentValue === null || parentValue === undefined) return childValue;
    if (childValue === null || childValue === undefined) return parentValue;
    return Math.max(parentValue, childValue);
  }

  /**
   * Strongest wins logic for maxLength (lower value wins)
   */
  private getStrongestMaxLength(parentValue: number, childValue: number): number {
    if (parentValue === null || parentValue === undefined) return childValue;
    if (childValue === null || childValue === undefined) return parentValue;
    return Math.min(parentValue, childValue);
  }

  /**
   * Strongest wins logic for minAdv (higher value wins)
   */
  private getStrongestMinAdv(parentValue: number, childValue: number): number {
    if (parentValue === null || parentValue === undefined) return childValue;
    if (childValue === null || childValue === undefined) return parentValue;
    return Math.max(parentValue, childValue);
  }

  /**
   * Strongest wins logic for maxAdv (lower value wins)
   */
  private getStrongestMaxAdv(parentValue: number, childValue: number): number {
    if (parentValue === null || parentValue === undefined) return childValue;
    if (childValue === null || childValue === undefined) return parentValue;
    return Math.min(parentValue, childValue);
  }

  /**
   * Strongest wins logic for minLosThrough (higher value wins)
   */
  private getStrongestMinLosThrough(parentValue: number, childValue: number): number {
    if (parentValue === null || parentValue === undefined) return childValue;
    if (childValue === null || childValue === undefined) return parentValue;
    return Math.max(parentValue, childValue);
  }

  /**
   * Strongest wins logic for maxReservationCount (lower value wins)
   */
  private getStrongestMaxReservationCount(parentValue: number, childValue: number): number {
    if (parentValue === null || parentValue === undefined) return childValue;
    if (childValue === null || childValue === undefined) return parentValue;
    return Math.min(parentValue, childValue);
  }

  /**
   * Extract unique rate plan IDs from an array of restrictions
   */
  private extractRatePlanIdsFromRestrictions(restrictions: Partial<Restriction>[]): string[] {
    const ratePlanIds = restrictions
      .flatMap((restriction) => restriction.ratePlanIds || [])
      .filter((id) => id); // Remove null/undefined values

    return [...new Set(ratePlanIds)]; // Return unique IDs
  }

  /**
   * Map DTO to entity for database operations with source tracking
   */
  private mapDtoToEntity(dto: CreateRestrictionDto): Partial<Restriction> {
    // Create restriction source map if not provided in DTO
    const restrictionSource = dto.restrictionSource || this.createRestrictionSourceMap(dto);

    return {
      hotelId: dto.hotelId,
      type: dto.type,
      fromDate: dto.fromDate ? new Date(dto.fromDate) : null,
      toDate: dto.toDate ? new Date(dto.toDate) : null,
      weekdays: Object.values(Weekday) || null,
      roomProductIds: dto.roomProductIds || null,
      ratePlanIds: dto.ratePlanIds || null,
      minLength: dto.minLength ?? null,
      maxLength: dto.maxLength ?? null,
      minAdv: dto.minAdv ?? null,
      maxAdv: dto.maxAdv ?? null,
      minLosThrough: dto.minLosThrough ?? null,
      maxReservationCount: dto.maxReservationCount ?? null,
      metadata: dto.metadata ?? null,
      restrictionSource
    } as Restriction;
  }

  // private async queuePmsRestriction(hotelId: string, restrictions: Restriction[]) {
  //   if (!restrictions || restrictions.length === 0) {
  //     throw new BadRequestException('No restrictions provided');
  //   }

  //   // find lowest fromDate & highest toDate
  //   const fromDates = restrictions.map((r) => new Date(r.fromDate));
  //   const toDates = restrictions.map((r) => new Date(r.toDate));

  //   const lowestFromDate = new Date(Math.min(...fromDates.map((d) => d.getTime())));
  //   const highestToDate = new Date(Math.max(...toDates.map((d) => d.getTime())));

  //   let startDate = format(lowestFromDate, DATE_FORMAT);
  //   let endDate = format(highestToDate, DATE_FORMAT);

  //   // if startDate is in the past, set it to today
  //   if (isBefore(new Date(startDate), new Date())) {
  //     startDate = format(new Date(), DATE_FORMAT);
  //   }

  //   // if endDate is in the past, set it to today
  //   if (isBefore(new Date(endDate), new Date())) {
  //     endDate = format(new Date(), DATE_FORMAT);
  //   }

  //   // if startDate is after endDate, throw error
  //   if (isAfter(new Date(startDate), new Date(endDate))) {
  //     throw new BadRequestException('Start date must be before end date');
  //   }

  //   // if no startDate or endDate (edge case), set default 365 days
  //   if (!startDate || !endDate) {
  //     startDate = format(new Date(), DATE_FORMAT);
  //     endDate = format(addDays(new Date(), 365), DATE_FORMAT);
  //   }

  //   // safely flatten roomProductIds (handle nulls)
  //   const roomProductIds = restrictions.map((r) => r.roomProductIds ?? []).flat();

  //   await this.queue.add(JOB_NAMES.RESTRICTION.PROCESS_PMS_RESTRICTION, {
  //     hotelId,
  //     startDate,
  //     endDate,
  //     roomProductIds
  //   });
  // }

  /**
   * Delete a restriction
   */
  async deleteRestriction(id: string) {
    try {
      const restriction = await this.restrictionRepository.findOne({
        where: { id }
      });

      if (!restriction) {
        throw new BadRequestException(`Restriction with ID ${id} not found`);
      }

      // Handle derived restrictions before deleting the parent
      await this.handleDeleteDerivedRestrictions(restriction);

      await this.restrictionRepository.remove(restriction);

      this.pushPmsRestriction(
        restriction.hotelId,
        format(restriction.fromDate, DATE_FORMAT),
        format(restriction.toDate, DATE_FORMAT),
        restriction.roomProductIds ?? [],
        restriction.ratePlanIds ?? []
      );

      return { id };
    } catch (error) {
      this.logger.error('Error deleting restriction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete restriction: ' + error.message);
    }
  }

  async deleteBulkRestriction(body: BulkDeleteRestrictionDto) {
    const { hotelId, fromDate, toDate, ratePlanIds, roomProductIds, level, restrictionSource } =
      body;
    if (!hotelId || !fromDate || !toDate) {
      throw new BadRequestException('Hotel ID, from date and to date are required');
    }

    // handle fromDate < toDate
    if (new Date(fromDate) > new Date(toDate)) {
      throw new BadRequestException('From date must be less than to date');
    }

    try {
      const query = this.buildRestrictionQuery(
        hotelId,
        fromDate,
        toDate,
        level,
        roomProductIds || undefined,
        ratePlanIds || undefined
      );

      let restrictions = await query.getMany();

      if (restrictionSource) {
        restrictions = restrictions.filter((r) => {
          const source = r.restrictionSource || {};

          // Check if ANY field has the restrictionSource value
          const matched = Object.values(source).some((val) => val === restrictionSource);

          return !matched; // EXCLUDE matched items
        });
      }

      await this.restrictionRepository.remove(restrictions);

      return restrictions;
    } catch (error) {
      this.logger.error('Error deleting restriction:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete restriction: ' + error.message);
    }
  }

  async syncPmsRestriction(query: PmsRestrictionQueryDto) {
    const { hotelId, startDate, endDate, mode } = query;
    if (!hotelId || !startDate || !endDate) {
      throw new BadRequestException('Hotel ID, start date and end date are required');
    }

    // handle startDate < endDate
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date must be less than end date');
    }

    const roomProductMappingPms = await this.roomProductMappingPmsRepository.find({
      where: {
        hotelId
      }
    });

    if (roomProductMappingPms.length === 0) {
      this.logger.warn(`No room product mapping pms found for hotel ${hotelId}`);
      return [];
    }

    try {
      const query: RestrictionQueryDto = {
        hotelId,
        startDate,
        endDate,
        mode
      };

      const restrictions = await this.pmsService.getPmsRestriction(query);

      const roomProductDailyRestrictions: CreateRestrictionDto[] = restrictions.map(
        (restriction) => {
          const roomProductIds =
            roomProductMappingPms
              .filter(
                (mapping) =>
                  mapping.roomProductMappingPmsCode === restriction.roomProductMappingPmsCode
              )
              .map((mapping) => mapping.roomProductId) || null;

          // TODO: wait rate_plan table
          // const ratePlanIds =
          //   roomProductMappingPms
          //     .filter((mapping) => mapping.roomProductMappingPmsCode === restriction.ratePlanMappingPmsCode)
          //     .map((mapping) => mapping.roomProductId) || null;

          return {
            roomProductIds: roomProductIds.length > 0 ? roomProductIds : undefined,
            hotelId,
            ratePlanIds: undefined,
            fromDate: restriction.fromDate,
            toDate: restriction.toDate,
            type: restriction.type || RestrictionConditionType.ClosedToArrival,
            weekdays: restriction.weekdays,
            minLength: restriction.minLength ?? undefined,
            maxLength: restriction.maxLength ?? undefined,
            minAdv: restriction.minAdv ?? undefined,
            maxAdv: restriction.maxAdv ?? undefined,
            minLosThrough: restriction.minLosThrough ?? undefined
          };
        }
      );

      const bulkRestrictionOperation: BulkRestrictionOperationDto = {
        restrictionsToAdd: roomProductDailyRestrictions
      };

      await this.handleBulkRestrictionOperation(bulkRestrictionOperation);

      return roomProductDailyRestrictions;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async handlePushPmsRestriction(body: CreatePmsRestrictionDto) {
    const { startDate, endDate, hotelId, roomProductIds } = body;

    if (!startDate || !endDate || !hotelId) {
      throw new BadRequestException('Start date, end date and hotel id are required');
    }

    // handle startDate < endDate
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Start date must be less than end date');
    }

    const hotelRestrictionSettings = await this.hotelRestrictionSettingRepository.find({
      where: {
        hotelId,
        mode: HotelRestrictionSettingMode.PUSH
      }
    });

    if (hotelRestrictionSettings.length === 0) {
      this.logger.warn(`No push restriction settings found for hotel ${hotelId}`);
      return [];
    }

    const roomProductMappingPms = await this.roomProductMappingPmsRepository.find({
      where: {
        hotelId
      }
    });

    if (roomProductMappingPms.length === 0) {
      this.logger.warn(`No room product mapping pms found for hotel ${hotelId}`);
      return [];
    }

    const restrictions = await this.restrictionRepository.find({
      where: {
        hotelId,
        fromDate: MoreThanOrEqual(new Date(startDate)),
        toDate: LessThanOrEqual(new Date(endDate))
      }
    });

    try {
      const result = await this.pmsService.createPmsPropertyRestriction(
        hotelId,
        hotelRestrictionSettings,
        roomProductMappingPms,
        restrictions
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async handleClearPmsRestriction(hotelId: string, restrictions: Restriction[]) {
  //   try {
  //     const roomProductMappingPms = await this.roomProductMappingPmsRepository.find({
  //       where: {
  //         hotelId
  //       }
  //     });

  //     if (roomProductMappingPms.length === 0) {
  //       this.logger.warn(`No room product mapping pms found for hotel ${hotelId}`);
  //       return [];
  //     }

  //     await this.queue.add(JOB_NAMES.RESTRICTION.PROCESS_CLEAR_PMS_RESTRICTION, {
  //       hotelId,
  //       restrictions,
  //       roomProductMappingPms
  //     });
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async getCalendar(query: CalendarRestrictionDto) {
    const { hotelId, startDate, endDate } = query;
    if (!hotelId || !startDate || !endDate) {
      throw new BadRequestException('Hotel ID, start date and end date are required');
    }

    // for rate plan calendar, get public rate plan ids
    let publicRatePlanIds = await this.ratePlanRepository.find({
      where: {
        hotelId,
        type: RatePlanTypeEnum.PUBLIC,
        status: RatePlanStatusEnum.ACTIVE
      },
      select: ['id', 'distributionChannel']
    });

    // filter by distribution channel
    publicRatePlanIds = (publicRatePlanIds || []).filter((ratePlan) =>
      ratePlan.distributionChannel?.includes(DistributionChannel.GV_SALES_ENGINE)
    );

    const ratePlanPublicIdsSet = [...new Set(publicRatePlanIds.map((ratePlan) => ratePlan.id))];

    const queryBuilderHouseLevel = this.buildRestrictionQuery(
      hotelId,
      startDate,
      endDate,
      RestrictionLevel.HOUSE_LEVEL
    );

    const queryBuilderRatePlan = this.buildRestrictionQuery(
      hotelId,
      startDate,
      endDate,
      RestrictionLevel.RATE_PLAN,
      undefined,
      ratePlanPublicIdsSet || undefined
    );

    const [restrictionsHouseLevel, restrictionsRatePlan] = await Promise.all([
      queryBuilderHouseLevel.getMany(),
      queryBuilderRatePlan.getMany()
    ]);

    // Collect all dates that have HOUSE_LEVEL restrictions
    const houseLevelDates = new Set<string>();
    restrictionsHouseLevel.forEach((restriction) => {
      const restrictionDates = eachDayOfInterval({
        start: restriction.fromDate,
        end: restriction.toDate
      }).map((date) => format(date, DATE_FORMAT));
      restrictionDates.forEach((date) => houseLevelDates.add(date));
    });

    // Filter out RATE_PLAN restrictions that overlap with HOUSE_LEVEL restriction dates
    const filteredRatePlanRestrictions = (restrictionsRatePlan || []).filter((restriction) => {
      const restrictionDates = eachDayOfInterval({
        start: restriction.fromDate,
        end: restriction.toDate
      }).map((date) => format(date, DATE_FORMAT));

      // Exclude this restriction if any of its dates overlap with HOUSE_LEVEL dates
      return !restrictionDates.some((date) => houseLevelDates.has(date));
    });

    // Need to evaluate per-day rate-plan restrictions:
    //   - When a date has restrictions for all rate plans → apply the combined restriction.
    //   - When a date is missing a restriction for any rate plan → do not apply it; exclude that date.
    // const dateRange = Helper.generateDateRange(startDate, endDate);
    // const dateExcludeSet = new Set<string>();
    // for (const date of dateRange) {
    //   const restrictionsForDate = (restrictionsRatePlan || []).filter((restriction) => {
    //     const restrictionDates = eachDayOfInterval({
    //       start: restriction.fromDate,
    //       end: restriction.toDate
    //     }).map((date) => format(date, DATE_FORMAT));
    //     return restrictionDates?.includes(date);
    //   });

    //   // get all rate plan ids for this date
    //   const ratePlanRestrictionIds = restrictionsForDate
    //     .map((restriction) => restriction.ratePlanIds)
    //     .flat()
    //     .filter((id): id is string => id != null);
    //   const ratePlanRestrictionIdsSet = new Set(ratePlanRestrictionIds);

    //   // if the rate plan restriction ids set is not the same as the public rate plan ids set, exclude the date
    //   // Check: all public rate plans must have restrictions, and no extra rate plans should be present
    //   if (ratePlanPublicIdsSet.length > 0) {
    //     const allPublicRatePlansHaveRestrictions = ratePlanPublicIdsSet.every((id) =>
    //       ratePlanRestrictionIdsSet.has(id)
    //     );
    //     const noExtraRatePlans = ratePlanRestrictionIdsSet.size === ratePlanPublicIdsSet.length;

    //     if (!allPublicRatePlansHaveRestrictions || !noExtraRatePlans) {
    //       dateExcludeSet.add(date);
    //     }

    //     // log that date have all rate plan restrictions
    //     if (allPublicRatePlansHaveRestrictions && noExtraRatePlans) {
    //       this.logger.log(
    //         `Date ${date} has all public rate plan restrictions and no extra rate plans`
    //       );
    //     }
    //   } else if (ratePlanRestrictionIdsSet.size > 0) {
    //     // If there are no public rate plans but there are restrictions, exclude the date
    //     dateExcludeSet.add(date);
    //   }
    // }

    // Filter out RATE_PLAN restrictions that overlap with excluded dates
    // (dates that don't have restrictions for all public rate plans)
    // const filteredRatePlanRestrictionsByDate = (restrictionsRatePlan || []).filter(
    //   (restriction) => {
    //     const restrictionDates = eachDayOfInterval({
    //       start: restriction.fromDate,
    //       end: restriction.toDate
    //     }).map((date) => format(date, DATE_FORMAT));

    //     // Exclude this restriction if any of its dates are in the exclude set
    //     return !restrictionDates.some((date) => dateExcludeSet.has(date));
    //   }
    // );
    const restrictions = [
      ...(restrictionsHouseLevel || []),
      ...(filteredRatePlanRestrictions || [])
    ];

    return this.combineStrongestRestrictions(restrictions, startDate, endDate);
  }

  async getCalendarDirect(query: CalendarRestrictionDirectDto) {
    const { hotelId, startDate, endDate, roomProductIds } = query;
    if (!hotelId || !startDate || !endDate || !roomProductIds) {
      throw new BadRequestException(
        'Hotel ID, start date and end date and room product ids are required'
      );
    }

    const queryBuilderRoomProduct = this.buildRestrictionQuery(
      hotelId,
      startDate,
      endDate,
      RestrictionLevel.ROOM_PRODUCT,
      roomProductIds
    );

    const restrictions = await queryBuilderRoomProduct.getMany();

    return this.combineStrongestRestrictions(restrictions, startDate, endDate);
  }

  combineStrongestRestrictions(restrictions: Restriction[], startDate: string, endDate: string) {
    const dateRange = Helper.generateDateRange(startDate, endDate);
    const combinedRestrictions: any[] = [];

    for (const currentDate of dateRange) {
      const applicableRestrictions = restrictions.filter((restriction) => {
        const restrictionDates = eachDayOfInterval({
          start: restriction.fromDate,
          end: restriction.toDate
        }).map((date) => format(date, DATE_FORMAT));
        return restrictionDates?.includes(currentDate);
      });

      if (applicableRestrictions.length === 0) continue;

      const combinedRestriction = this.combineRestrictionGroup(applicableRestrictions);

      if (combinedRestriction) {
        combinedRestrictions.push({
          ...combinedRestriction,
          fromDate: format(currentDate, DATE_FORMAT),
          toDate: format(currentDate, DATE_FORMAT)
        });
      }
    }

    return combinedRestrictions;
  }

  /**
   * Determines the LEAST RESTRICTED plan among multiple candidates.
   *
   * Logic:
   * (1) Fewer close restrictions wins
   *     - Prefer plans with no CTA, no CTD, no CTS
   *     - A plan with 0 close restrictions is less restricted than one with 1 or more
   *
   * (2) More flexible LOS wins
   *     - Lower Min LOS = less restrictive
   *     - Higher Max LOS = less restrictive
   *
   * (3) More flexible advance booking wins
   *     - Lower Min Advance = less restrictive
   *     - Higher Max Advance = less restrictive
   *
   * Example: date: 2025-12-10
   * - Restriction 1: min LOS = 2, max LOS = 4, min Adv = 1, max Adv = 3, close restrictions = 0
   * - Restriction 2: min LOS = 3, max LOS = 3, min Adv = 2, max Adv = 2, close restrictions = 1
   * - Result: Combined restriction: min LOS = 2, max LOS = 4, min Adv = 1, max Adv = 3, close restrictions = 0
   *
   * @description
   * This creates a combined restriction that allows the least restrictive minimums
   * while allowing the most flexible maximums from all applicable restrictions.
   * The goal is to find the LEAST RESTRICTED plan that satisfies all input restrictions.
   */
  combineRestrictionGroup(restrictions: Restriction[]) {
    if (restrictions.length === 0) {
      return null;
    }

    if (restrictions.length === 1) {
      return restrictions[0];
    }

    // Start with a base restriction (we'll merge all properties)
    const baseRestriction = { ...restrictions[0] };

    // Helper: Check if a restriction is a close restriction
    const isCloseRestriction = (r: Restriction): boolean => {
      // Assuming 'hasRestrictionExceptions' means the restriction is being ignored,
      // thus it shouldn't count as a 'Close' restriction for the purpose of combining.
      if (this.hasRestrictionExceptions(r)) {
        return false;
      }

      return (
        r.type === RestrictionConditionType.ClosedToArrival ||
        r.type === RestrictionConditionType.ClosedToDeparture ||
        r.type === RestrictionConditionType.ClosedToStay
      );
    };

    // (1) Combine close restrictions - prefer fewer close restrictions (least restricted wins)
    // Only include close restrictions if ALL restrictions have them, otherwise prefer the less restricted option
    const closeRestrictions = restrictions.filter(isCloseRestriction);

    // If all restrictions have close restrictions, include them (prioritize most severe: CTS > CTD > CTA)
    // Otherwise, prefer restrictions without close restrictions (fewer close restrictions wins)
    if (closeRestrictions.length === restrictions.length && closeRestrictions.length > 0) {
      const ctsRestriction = closeRestrictions.find(
        (r) => r.type === RestrictionConditionType.ClosedToStay
      );
      const ctdRestriction = closeRestrictions.find(
        (r) => r.type === RestrictionConditionType.ClosedToDeparture
      );
      const ctaRestriction = closeRestrictions.find(
        (r) => r.type === RestrictionConditionType.ClosedToArrival
      );

      const selectedCloseRestriction = ctsRestriction || ctdRestriction || ctaRestriction;
      if (selectedCloseRestriction) {
        baseRestriction.type = selectedCloseRestriction.type;
      }
    } else {
      // Prefer restrictions without close restrictions - find a non-close restriction to use as base
      const nonCloseRestrictions = restrictions.filter((r) => !isCloseRestriction(r));
      if (nonCloseRestrictions.length > 0) {
        // Use the first non-close restriction as base to ensure we don't have a close restriction type
        const nonCloseBase = { ...nonCloseRestrictions[0] };
        // Copy over the type from non-close restriction, but keep other properties we'll combine
        baseRestriction.type = nonCloseBase.type;
      }
      // If all restrictions have close restrictions but we filtered them out due to exceptions,
      // the baseRestriction type will remain from the first restriction
    }

    // (2) Combine Min values (e.g., Min LOS, Min Advance):
    // To satisfy ALL input restrictions, the combined minimum must be the LOWEST minimum required.
    // Example: (Min LOS 2) AND (Min LOS 4) => Combined Min LOS must be 2.
    const hasUnlimitedMinLength = restrictions.some((r) => r.minLength == null);
    if (hasUnlimitedMinLength) {
      baseRestriction.minLength = null as any; // unlimited is most flexible
    } else {
      const minLengths = restrictions.map((r) => r.minLength).filter((v) => v != null) as number[];
      baseRestriction.minLength = Math.min(...minLengths);
    }

    const hasUnlimitedMinAdv = restrictions.some((r) => r.minAdv == null);
    if (hasUnlimitedMinAdv) {
      baseRestriction.minAdv = null as any; // unlimited is most flexible
    } else {
      const minAdvValues = restrictions.map((r) => r.minAdv).filter((v) => v != null) as number[];
      baseRestriction.minAdv = Math.min(...minAdvValues);
    }

    // (3) Combine Max values (e.g., Max LOS, Max Advance):
    // To satisfy ALL input restrictions, the combined maximum must be the HIGHEST maximum allowed.
    // Example: (Max LOS 7) AND (Max LOS 5) => Combined Max LOS must be 7 (the highest maximum allowed).
    const hasUnlimitedMaxLength = restrictions.some((r) => r.maxLength == null);
    if (hasUnlimitedMaxLength) {
      baseRestriction.maxLength = null as any; // unlimited is most flexible
    } else {
      const maxLengths = restrictions.map((r) => r.maxLength).filter((v) => v != null) as number[];
      baseRestriction.maxLength = Math.max(...maxLengths);
    }

    const hasUnlimitedMaxAdv = restrictions.some((r) => r.maxAdv == null);
    if (hasUnlimitedMaxAdv) {
      baseRestriction.maxAdv = null as any; // unlimited is most flexible
    } else {
      const maxAdvValues = restrictions.map((r) => r.maxAdv).filter((v) => v != null) as number[];
      baseRestriction.maxAdv = Math.max(...maxAdvValues);
    }

    // check all field is null or undefined
    if (
      baseRestriction.minLength === null &&
      baseRestriction.maxLength === null &&
      baseRestriction.minAdv === null &&
      baseRestriction.maxAdv === null
    ) {
      return null;
    }

    return baseRestriction;
  }

  pushRestrictionToCmSiteminder(body: any) {
    const { hotelId, roomProductIds, startDate, endDate } = body;
    // check start date if in the past, return today
    // if (isBefore(new Date(startDate), new Date())) {
    //   startDate = format(new Date(), DATE_FORMAT);
    // }
    // try {
    //   // step 1: get room product restrictions
    //   const roomProductRestrictions = await this.roomProductDailyRestrictionRepository.find({
    //     where: {
    //       hotelId,
    //       roomProductId: In(roomProductIds ?? []),
    //       date: Between(format(startOfDay(new Date(startDate)), DATE_FORMAT), format(startOfDay(new Date(endDate)), DATE_FORMAT)),
    //       code: In([RestrictionCode.RSTR_LOS_MIN, RestrictionCode.RSTR_LOS_MAX]),
    //     },
    //     order: { date: 'ASC' },
    //   });

    //   // step 2: group restrictions by roomProductId and date
    //   const groupedRestrictions = new Map<
    //     string,
    //     {
    //       roomProductId: string;
    //       date: string;
    //       minLOS?: number;
    //       maxLOS?: number;
    //     }
    //   >();

    //   for (const restriction of roomProductRestrictions) {
    //     const key = `${restriction.roomProductId}_${restriction.date}`;

    //     if (!groupedRestrictions.has(key)) {
    //       groupedRestrictions.set(key, {
    //         roomProductId: restriction.roomProductId,
    //         date: restriction.date,
    //       });
    //     }

    //     const grouped = groupedRestrictions.get(key)!;
    //     if (restriction.code === RestrictionCode.RSTR_LOS_MIN) {
    //       grouped.minLOS = restriction.value;
    //     } else if (restriction.code === RestrictionCode.RSTR_LOS_MAX) {
    //       grouped.maxLOS = restriction.value;
    //     }
    //   }

    //   // step 3: map to PushRestrictionSmDto
    //   const pushRestrictionSmDto: PushRestrictionSmDto[] = Array.from(groupedRestrictions.values()).map((grouped) => ({
    //     propertyId: hotelId,
    //     roomProductId: grouped.roomProductId,
    //     startDate: format(new Date(grouped.date), DATE_FORMAT),
    //     endDate: format(new Date(grouped.date), DATE_FORMAT),
    //     salePlanId: '1', // TODO: adjust to use sale plan id from hotel
    //     restriction: {
    //       minLOS: grouped.minLOS || 1, // default to 1 if not set
    //       maxLOS: grouped.maxLOS || 999, // default to 999 if not set
    //     },
    //   }));

    //   // step 4: push restrictions to Siteminder
    //   await this.cmSiteminderService.pushRestriction(pushRestrictionSmDto);

    //   this.logger.log(
    //     `Pushed ${pushRestrictionSmDto.length} grouped restrictions to Siteminder with startDate: ${startDate} and endDate: ${endDate} and hotelId: ${hotelId}`,
    //   );
    // } catch (error) {
    //   this.logger.error(`Error pushing restriction to Siteminder: ${error}`);
    //   throw error;
    // }

    return [];
  }

  /**
   * Convert restriction entity to CreateRestrictionDto format
   */
  private convertToCreateRestrictionDto(restriction: Partial<Restriction>): CreateRestrictionDto {
    return {
      ...restriction,
      fromDate: restriction.fromDate,
      toDate: restriction.toDate
    } as CreateRestrictionDto;
  }

  /**
   * Bulk handle derived restrictions creation to avoid N+1 queries
   * Optimized version that batches all operations and minimizes database queries
   *
   * Performance improvements:
   * - Reduces N+1 queries to O(hotels) queries
   * - Single bulk operation for all derived restrictions
   * - Efficient lookup maps for existing restrictions
   */
  private async bulkHandleCreateDerivedRestrictions(restrictions: Restriction[]): Promise<void> {
    if (!restrictions.length) return;

    const startTime = Date.now();
    this.logger.log(
      `Starting bulk derived restrictions processing for ${restrictions.length} parent restrictions`
    );

    // Group restrictions by hotel for efficient processing
    const restrictionsByHotel = new Map<string, Restriction[]>();

    for (const restriction of restrictions) {
      if (!restriction.ratePlanIds || restriction.ratePlanIds.length === 0) {
        continue; // Skip restrictions without rate plan IDs
      }

      const hotelId = restriction.hotelId;
      if (!restrictionsByHotel.has(hotelId)) {
        restrictionsByHotel.set(hotelId, []);
      }
      restrictionsByHotel.get(hotelId)!.push(restriction);
    }

    // Collect all derived restrictions across all hotels in a single batch
    const allDerivedRestrictions: CreateRestrictionDto[] = [];

    // Process each hotel's restrictions
    await Promise.all(
      Array.from(restrictionsByHotel.entries()).map(async ([hotelId, hotelRestrictions]) => {
        // Step 1: Collect all rate plan IDs for this hotel
        const allParentRatePlanIds = new Set<string>();
        hotelRestrictions.forEach((restriction) => {
          restriction.ratePlanIds?.forEach((id) => allParentRatePlanIds.add(id));
        });

        if (allParentRatePlanIds.size === 0) return;

        // Step 2: Fetch ALL derived rate plans for this hotel in ONE query
        const allDerivedRatePlans = await this.findDerivedRatePlansWithRestrictionFollowing(
          Array.from(allParentRatePlanIds)
        );

        if (allDerivedRatePlans.length === 0) return;

        // Step 3: Create a comprehensive query to get ALL existing derived restrictions
        const derivedRatePlanIds = allDerivedRatePlans.map((drp) => drp.ratePlanId);
        const allTypes = [...new Set(hotelRestrictions.map((r) => r.type))];
        const minFromDate = new Date(
          Math.min(...hotelRestrictions.map((r) => new Date(r.fromDate).getTime()))
        );
        const maxToDate = new Date(
          Math.max(...hotelRestrictions.map((r) => new Date(r.toDate).getTime()))
        );

        // Single bulk query for ALL existing derived restrictions
        const existingDerivedRestrictions = await this.restrictionRepository.find({
          where: {
            hotelId,
            ratePlanIds: Raw((alias) => `${alias} && ARRAY[:...ratePlanIds]::text[]`, {
              ratePlanIds: derivedRatePlanIds
            }),
            roomProductIds: IsNull(),
            type: In(allTypes),
            fromDate: MoreThanOrEqual(minFromDate),
            toDate: LessThanOrEqual(maxToDate)
          }
        });

        // Step 4: Create lookup maps for efficient processing
        const derivedRatePlanMap = new Map<string, RatePlanDerivedSetting>();
        allDerivedRatePlans.forEach((drp) => {
          derivedRatePlanMap.set(drp.ratePlanId, drp);
        });

        const existingRestrictionsMap = new Map<string, Restriction[]>();
        existingDerivedRestrictions.forEach((restriction) => {
          restriction.ratePlanIds?.forEach((ratePlanId) => {
            const key = `${ratePlanId}_${restriction.type}_${format(new Date(restriction.fromDate), DATE_FORMAT)}_${format(new Date(restriction.toDate), DATE_FORMAT)}`;
            if (!existingRestrictionsMap.has(key)) {
              existingRestrictionsMap.set(key, []);
            }
            existingRestrictionsMap.get(key)!.push(restriction);
          });
        });

        // Step 5: Process each parent restriction efficiently
        for (const parentRestriction of hotelRestrictions) {
          const parentRatePlanIds = parentRestriction.ratePlanIds || [];

          // Find derived rate plans for this specific parent
          const relevantDerivedRatePlans = allDerivedRatePlans.filter((drp) =>
            parentRatePlanIds.some(
              (parentId) =>
                // Check if this derived rate plan is derived from any of the parent rate plan IDs
                drp.derivedRatePlanId === parentId
            )
          );

          // Process each derived rate plan
          for (const derivedRatePlan of relevantDerivedRatePlans) {
            const key = `${derivedRatePlan.ratePlanId}_${parentRestriction.type}_${format(new Date(parentRestriction.fromDate), DATE_FORMAT)}_${format(new Date(parentRestriction.toDate), DATE_FORMAT)}`;
            const existingRestrictions = existingRestrictionsMap.get(key) || [];

            if (existingRestrictions.length > 0) {
              // Merge with existing restrictions -> get data from parent restriction
              for (const existingRestriction of existingRestrictions) {
                const mergedRestriction = this.mergeDerivedRestrictions(
                  parentRestriction,
                  existingRestriction,
                  derivedRatePlan.inheritedRestrictionFields
                );

                allDerivedRestrictions.push(
                  this.convertToCreateRestrictionDto({
                    ...existingRestriction,
                    ...mergedRestriction
                  })
                );
              }
            } else {
              // Create new derived restriction
              const newRestriction = this.createDerivedRestriction(
                parentRestriction,
                derivedRatePlan,
                derivedRatePlan.inheritedRestrictionFields
              );
              allDerivedRestrictions.push(this.convertToCreateRestrictionDto(newRestriction));
            }
          }
        }
      })
    );

    // Step 6: Handle ALL derived restrictions in a SINGLE bulk operation
    if (allDerivedRestrictions.length > 0) {
      const BATCH_SIZE = 1000;
      for (let i = 0; i < allDerivedRestrictions.length; i += BATCH_SIZE) {
        const batch = allDerivedRestrictions.slice(i, i + BATCH_SIZE);
        await this.handleBulkRestrictionOperation(
          {
            restrictionsToAdd: batch
          },
          false // Don't call derived restrictions recursively
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      this.logger.log(
        `Bulk derived restrictions completed: Created/updated ${allDerivedRestrictions.length} derived restrictions in ${duration}ms`
      );
    }
  }

  /**
   * Bulk merge restrictions to eliminate N+1 queries
   * Groups restrictions by hotel/type/room/rate plan combinations and processes them in batches
   */
  private async bulkMergeRestrictions(
    restrictionsToAdd: CreateRestrictionDto[],
    isManual: boolean = false,
    isDerived: boolean = false
  ): Promise<{ restrictionsToCreate: Restriction[]; restrictionsToRemove: Restriction[] }> {
    if (!restrictionsToAdd.length) {
      return { restrictionsToCreate: [], restrictionsToRemove: [] };
    }

    // Validate all restrictions have required dates
    const restrictionsToAddValid = restrictionsToAdd.filter(
      ({ fromDate, toDate }) => fromDate && toDate
    );

    // Group restrictions by hotel, type, roomProductIds, and ratePlanIds for efficient processing
    const groupedRestrictions = new Map<string, CreateRestrictionDto[]>();
    const dateRangeMap = new Map<string, { fromDate: Date; toDate: Date }>();

    for (const restriction of restrictionsToAddValid) {
      const key = this.createRestrictionGroupKey(restriction);

      if (!groupedRestrictions.has(key)) {
        groupedRestrictions.set(key, []);
      }
      groupedRestrictions.get(key)!.push(restriction);

      // Track date ranges for each group
      const fromDate = new Date(restriction.fromDate!);
      const toDate = new Date(restriction.toDate!);

      // Validate date objects
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid date format provided in bulk restrictions');
      }

      const existingRange = dateRangeMap.get(key);
      if (!existingRange) {
        dateRangeMap.set(key, { fromDate, toDate });
      } else {
        // Expand the date range to cover all restrictions in this group
        if (fromDate < existingRange.fromDate) existingRange.fromDate = fromDate;
        if (toDate > existingRange.toDate) existingRange.toDate = toDate;
      }
    }

    // Fetch all overlapping restrictions in a single batch query per group
    const overlappingRestrictionsMap = new Map<string, Restriction[]>();

    await Promise.all(
      Array.from(groupedRestrictions.keys()).map(async (key) => {
        const [hotelId, type, roomProductIds, ratePlanIds] = key.split('|');
        const dateRange = dateRangeMap.get(key)!;

        const whereConditions: any = {
          hotelId,
          type,
          fromDate: LessThanOrEqual(dateRange.toDate),
          toDate: MoreThanOrEqual(dateRange.fromDate)
        };

        // Add room product conditions
        if (roomProductIds && roomProductIds !== 'null') {
          whereConditions.roomProductIds = Raw(() => `room_product_ids && :roomProductIds`, {
            roomProductIds: JSON.parse(roomProductIds)
          });
        } else {
          whereConditions.roomProductIds = IsNull();
        }

        // Add rate plan conditions
        if (ratePlanIds && ratePlanIds !== 'null') {
          whereConditions.ratePlanIds = Raw(() => `rate_plan_ids && :ratePlanIds`, {
            ratePlanIds: JSON.parse(ratePlanIds)
          });
        } else {
          whereConditions.ratePlanIds = IsNull();
        }

        const overlapping = await this.restrictionRepository.find({
          where: whereConditions,
          order: { fromDate: 'ASC' }
        });

        overlappingRestrictionsMap.set(key, overlapping);
      })
    );

    // Process each group using merge logic similar to single restriction merge
    const allRestrictionsToCreate: Restriction[] = [];
    const allRestrictionsToRemove: Restriction[] = [];

    // Type priority: higher number = higher priority (pure blocking restrictions)
    const typePriority: Record<RestrictionConditionType, number> = {
      [RestrictionConditionType.ClosedToArrival]: 1,
      [RestrictionConditionType.ClosedToDeparture]: 2,
      [RestrictionConditionType.ClosedToStay]: 3
    };

    for (const [key, newRestrictions] of groupedRestrictions.entries()) {
      const existingRestrictions = overlappingRestrictionsMap.get(key) || [];

      for (const newRestriction of newRestrictions) {
        const newFrom = new Date(newRestriction.fromDate!);
        const newTo = new Date(newRestriction.toDate!);

        // Find overlapping existing restrictions for this new restriction
        const overlappingForThisRestriction = existingRestrictions.filter(
          (existing) => existing.fromDate <= newTo && existing.toDate >= newFrom
        );

        // Convert new restriction to entity for merging
        let mergedRestriction: Partial<Restriction> = {
          ...this.mapDtoToEntity(newRestriction),
          fromDate: newFrom,
          toDate: newTo
        };

        if (overlappingForThisRestriction.length) {
          // Check if merged restriction (new) has exceptions
          const mergedHasExceptions = this.hasRestrictionExceptions(
            mergedRestriction as Restriction
          );
          const mergedIsPureBlocking = !mergedHasExceptions;

          // Find the highest priority pure blocking restriction among overlapping existing ones
          let highestPriorityPureBlocking: Restriction | null = null;
          let highestPriority = 0;

          for (const existing of overlappingForThisRestriction) {
            const existingHasExceptions = this.hasRestrictionExceptions(existing);
            const existingIsPureBlocking = !existingHasExceptions;

            if (existingIsPureBlocking) {
              const priority = typePriority[existing.type];
              if (priority > highestPriority) {
                highestPriority = priority;
                highestPriorityPureBlocking = existing;
              }
            }
          }

          // Check merged restriction priority if it's pure blocking
          const mergedPriority = mergedIsPureBlocking
            ? typePriority[mergedRestriction.type as RestrictionConditionType]
            : 0;

          // If we found a pure blocking restriction with higher priority than merged, use it
          if (highestPriorityPureBlocking && highestPriority > mergedPriority) {
            // Pure blocking restriction takes precedence - replace merged with it
            mergedRestriction = {
              ...highestPriorityPureBlocking,
              fromDate: newFrom,
              toDate: newTo
            };
          } else if (!mergedIsPureBlocking) {
            // Merged has exceptions, merge values from overlapping restrictions
            for (const existing of overlappingForThisRestriction) {
              const existingHasExceptions = this.hasRestrictionExceptions(existing);

              // Skip pure blocking restrictions if merged is not pure blocking (they would have been handled above)
              if (!existingHasExceptions) {
                continue;
              }

              // Preserve manual overrides from existing restriction
              const manualFields: (keyof Restriction)[] = [
                'minLength',
                'maxLength',
                'minAdv',
                'maxAdv',
                'minLosThrough'
              ];

              for (const field of manualFields) {
                const manualValue =
                  existing.restrictionSource?.[field] === RestrictionSourceType.MANUAL
                    ? existing[field]
                    : null;

                if (manualValue !== undefined && manualValue !== null && !isManual) {
                  (mergedRestriction as any)[field] = manualValue;
                  mergedRestriction.restrictionSource = {
                    ...mergedRestriction.restrictionSource,
                    [field]: RestrictionSourceType.MANUAL
                  };
                }
              }

              // Merge restriction values (most restrictive)
              // mergedRestriction = this.mergeRestrictionValues(mergedRestriction, existing);
            }
          }
          // If merged is pure blocking and has highest priority, keep it as is (no merging needed)
        }

        allRestrictionsToCreate.push(mergedRestriction as Restriction);
        allRestrictionsToRemove.push(...overlappingForThisRestriction);
      }
    }

    // Deduplicate and merge restrictions with same dates/type but different values
    const deduplicatedRestrictions = this.deduplicateAndMergeRestrictions(allRestrictionsToCreate);

    // Remove duplicate removal entries (same restriction marked for removal multiple times)
    const uniqueRestrictionsToRemove = allRestrictionsToRemove.filter(
      (restriction, index, self) => index === self.findIndex((r) => r.id === restriction.id)
    );

    return {
      restrictionsToCreate: deduplicatedRestrictions,
      restrictionsToRemove: uniqueRestrictionsToRemove
    };
  }

  /**
   * Creates a unique key for grouping restrictions by their core properties
   */
  private createRestrictionGroupKey(restriction: CreateRestrictionDto): string {
    const roomProductIds = restriction.roomProductIds
      ? JSON.stringify(restriction.roomProductIds.sort())
      : 'null';
    const ratePlanIds = restriction.ratePlanIds
      ? JSON.stringify(restriction.ratePlanIds.sort())
      : 'null';

    return `${restriction.hotelId}|${restriction.type}|${roomProductIds}|${ratePlanIds}`;
  }

  /**
   * Creates restriction source map based on the mode and field values
   */
  private createRestrictionSourceMap(
    dto: CreateRestrictionDto,
    sourceType: RestrictionSourceType = RestrictionSourceType.MANUAL
  ): RestrictionSourceMap {
    const sourceMap: RestrictionSourceMap = {};

    // Map each field that has a value to its source
    if (dto.minLength !== undefined && dto.minLength !== null) {
      sourceMap.minLength = sourceType;
    }
    if (dto.maxLength !== undefined && dto.maxLength !== null) {
      sourceMap.maxLength = sourceType;
    }
    if (dto.minAdv !== undefined && dto.minAdv !== null) {
      sourceMap.minAdv = sourceType;
    }
    if (dto.maxAdv !== undefined && dto.maxAdv !== null) {
      sourceMap.maxAdv = sourceType;
    }
    if (dto.minLosThrough !== undefined && dto.minLosThrough !== null) {
      sourceMap.minLosThrough = sourceType;
    }
    if (dto.maxReservationCount !== undefined && dto.maxReservationCount !== null) {
      sourceMap.maxReservationCount = sourceType;
    }

    return sourceMap;
  }

  async getHotelRestrictionSetting(hotelId: string) {
    return this.hotelRestrictionSettingRepository.find({
      where: {
        hotelId
      },
      select: {
        id: true,
        hotelId: true,
        restrictionEntity: true,
        restrictionCode: true,
        mode: true
      }
    });
  }

  async getRestrictionsByRoomProductAndRatePlan(
    hotelId: string,
    fromDate: string,
    toDate: string,
    roomProductIds: string[],
    ratePlanIds: string[]
  ) {
    const queryBuilderRoomProduct = this.buildRestrictionQuery(
      hotelId,
      fromDate,
      toDate,
      RestrictionLevel.ROOM_PRODUCT,
      roomProductIds
    );

    const queryBuilderRatePlan = this.buildRestrictionQuery(
      hotelId,
      fromDate,
      toDate,
      RestrictionLevel.RATE_PLAN,
      undefined,
      ratePlanIds
    );

    const [restrictionsRoomProduct, restrictionsRatePlan] = await Promise.all([
      queryBuilderRoomProduct.getMany(),
      queryBuilderRatePlan.getMany()
    ]);

    const restrictions = [...restrictionsRoomProduct, ...restrictionsRatePlan];

    return restrictions;
  }

  async pushPmsRestriction(
    hotelId: string,
    fromDate: string,
    toDate: string,
    roomProductIds?: string[],
    salesPlanIds?: string[]
  ) {
    if (!hotelId) {
      return null;
    }

    const where: any = {
      hotelId
    };

    if (roomProductIds != null && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }

    if (salesPlanIds != null && salesPlanIds.length > 0) {
      where.ratePlanId = In(salesPlanIds);
    }

    const [roomProductRatePlans, hotelConfig] = await Promise.all([
      this.roomProductRatePlanRepository.find({
        where,
        select: {
          id: true,
          ratePlanId: true,
          roomProductId: true
        }
      }),

      // get ROOM_PRODUCT_RESTRICTION_CONDITION
      this.hotelConfigurationRepository.findOne({
        where: {
          hotelId,
          configType: HotelConfigurationTypeEnum.ROOM_PRODUCT_RESTRICTION_CONDITION
        }
      })
    ]);

    if (roomProductRatePlans.length === 0) {
      return null;
    }

    const configPushRestriction: {
      pushPmsIfLowerThan?: number;
      pushPmsPeriod?: number;
    } = hotelConfig?.configValue?.metadata;

    // for pushPmsIfLowerThan -> Only push restrictions if maximum length of stay is lower than X days
    // for pushPmsPeriod -> Only push restrictions within booking window (X days from today)

    const today = new Date();
    const fromDateObj = new Date(fromDate);
    const toDateObj = new Date(toDate);
    const minDaysFromToday = Math.ceil(
      (fromDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const maxDaysFromToday = Math.ceil(
      (toDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Early return if date range is outside booking window
    if (
      configPushRestriction?.pushPmsPeriod != null &&
      (minDaysFromToday > configPushRestriction.pushPmsPeriod || maxDaysFromToday < 0)
    ) {
      return null; // Entire range is outside the booking window
    }

    const ratePlanIds = roomProductRatePlans.map((item) => item.ratePlanId);
    const roompIds = roomProductRatePlans.map((item) => item.roomProductId);

    const hotelRestrictionSettings = await this.hotelRestrictionIntegrationSettingRepository.find({
      where: {
        hotelId,
        mode: HotelRestrictionSettingMode.PUSH,
        ratePlanId: In(ratePlanIds),
        roomProductId: In(roompIds)
      }
    });

    if (hotelRestrictionSettings.length === 0) {
      return null;
    }

    // get restriction by room product and rate plan
    // use combine strongest restrictions
    const restrictions = await this.getRestrictionsByRoomProductAndRatePlan(
      hotelId,
      format(new Date(fromDate), DATE_FORMAT),
      format(new Date(toDate), DATE_FORMAT),
      roompIds,
      ratePlanIds
    );

    const dateRange = Helper.generateDateRange(fromDate, toDate);
    const combinedRestrictions: any[] = [];

    for (const currentDate of dateRange) {
      const currentDateObj = new Date(currentDate);
      const daysDifference = Math.ceil(
        (currentDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Apply pushPmsPeriod condition - only push if date is within booking window
      if (configPushRestriction?.pushPmsPeriod != null) {
        if (daysDifference > configPushRestriction.pushPmsPeriod || daysDifference < 0) {
          continue; // Skip: date is outside booking window
        }
      }

      const applicableRestrictions = restrictions.filter((restriction) => {
        const restrictionDates = eachDayOfInterval({
          start: restriction.fromDate,
          end: restriction.toDate
        }).map((date) => format(date, DATE_FORMAT));
        return restrictionDates?.includes(currentDate);
      });

      if (applicableRestrictions.length === 0) continue;

      const combinedRestriction = this.combinePmsRestrictionGroup(applicableRestrictions);

      if (combinedRestriction) {
        // Apply pushPmsIfLowerThan condition - only push if max length of stay is lower than X days
        if (configPushRestriction?.pushPmsIfLowerThan != null) {
          if (
            combinedRestriction.maxLength != null &&
            combinedRestriction.maxLength >= configPushRestriction.pushPmsIfLowerThan
          ) {
            continue; // Skip: max length of stay is >= threshold
          }
        }

        combinedRestrictions.push({
          ...combinedRestriction,
          fromDate: format(currentDate, DATE_FORMAT),
          toDate: format(currentDate, DATE_FORMAT)
        });
      }
    }

    const pmsRatePlanCodes = new Set(hotelRestrictionSettings.map((item) => item.pmsMappingCode));

    const restrictionsMapping: RestrictionMappingDto[] = Array.from(pmsRatePlanCodes).flatMap(
      (pmsRatePlanCode) =>
        combinedRestrictions
          .map((restriction) => ({
            roomProductMappingPmsCode: undefined,
            ratePlanMappingPmsCode: pmsRatePlanCode,
            fromDate: restriction.fromDate,
            toDate: restriction.toDate,
            type: restriction.type,
            minLength: restriction.minLength ?? undefined,
            maxLength: restriction.maxLength ?? undefined,
            minAdv: restriction.minAdv ?? undefined,
            maxAdv: restriction.maxAdv ?? undefined,
            minLosThrough: restriction.minLosThrough ?? undefined,
            weekdays: Object.values(Weekday)
          }))
          .filter((item) => item.ratePlanMappingPmsCode !== undefined)
    );

    await this.pmsService.createPmsRatePlanRestriction(hotelId, restrictionsMapping);

    return restrictionsMapping;
  }

  /**
   * Combines multiple restrictions into a single restriction using the most restrictive values.
   *
   * Logic:
   * - Combines restrictions by taking the most restrictive value for each constraint
   * - For minimum values (minLength, minAdv, minLosThrough): takes the HIGHER value (more restrictive)
   * - For maximum values (maxLength, maxAdv, maxReservationCount): takes the LOWER value (more restrictive)
   *
   * Example:
   * - Restriction A: { ClosedToArrival = true, maxLength = 4 }
   * - Restriction B: { ClosedToArrival = true, maxLength = 2 }
   *
   * @description
   * This ensures that when multiple restrictions apply to the same scenario,
   * the most restrictive combination is used.
   */
  private combinePmsRestrictionGroup(restrictions: Restriction[]) {
    if (restrictions.length === 0) {
      return null;
    }

    if (restrictions.length === 1) {
      return restrictions[0];
    }

    // Combine restrictions using most restrictive values
    // Start with the first restriction as base
    const combined = { ...restrictions[0] };

    // Combine with other restrictions using most restrictive rule logic
    for (let i = 1; i < restrictions.length; i++) {
      const current = restrictions[i];
      const typePriority: Record<RestrictionConditionType, number> = {
        [RestrictionConditionType.ClosedToArrival]: 1,
        [RestrictionConditionType.ClosedToDeparture]: 2,
        [RestrictionConditionType.ClosedToStay]: 3
      };

      // check if current restriction is a pure blocking restriction
      const pureBlockingRestrictions =
        current.minLength == null &&
        current.maxLength == null &&
        current.minAdv == null &&
        current.maxAdv == null &&
        current.minLosThrough == null &&
        current.maxReservationCount == null;

      // for type: ClosedToStay is the strongest
      if (pureBlockingRestrictions && typePriority[current.type] > typePriority[combined.type]) {
        combined.type = current.type;
        return combined;
      }

      // MinLength: Higher value is more restrictive (forces longer stay)
      if (current.minLength !== null && current.minLength !== undefined) {
        if (combined.minLength === null || combined.minLength === undefined) {
          combined.minLength = current.minLength;
        } else {
          combined.minLength = Math.max(combined.minLength, current.minLength);
        }
      }

      // MaxLength: Lower value is more restrictive (forces shorter stay)
      if (current.maxLength !== null && current.maxLength !== undefined) {
        if (combined.maxLength === null || combined.maxLength === undefined) {
          combined.maxLength = current.maxLength;
        } else {
          combined.maxLength = Math.min(combined.maxLength, current.maxLength);
        }
      }

      // MinAdv: Higher value is more restrictive (requires more advance booking)
      if (current.minAdv !== null && current.minAdv !== undefined) {
        if (combined.minAdv === null || combined.minAdv === undefined) {
          combined.minAdv = current.minAdv;
        } else {
          combined.minAdv = Math.max(combined.minAdv, current.minAdv);
        }
      }

      // MaxAdv: Lower value is more restrictive (limits advance booking)
      if (current.maxAdv !== null && current.maxAdv !== undefined) {
        if (combined.maxAdv === null || combined.maxAdv === undefined) {
          combined.maxAdv = current.maxAdv;
        } else {
          combined.maxAdv = Math.min(combined.maxAdv, current.maxAdv);
        }
      }

      // MinLosThrough: Higher value is more restrictive
      if (current.minLosThrough !== null && current.minLosThrough !== undefined) {
        if (combined.minLosThrough === null || combined.minLosThrough === undefined) {
          combined.minLosThrough = current.minLosThrough;
        } else {
          combined.minLosThrough = Math.max(combined.minLosThrough, current.minLosThrough);
        }
      }

      // MaxReservationCount: Lower value is more restrictive (fewer reservations allowed)
      if (current.maxReservationCount !== null && current.maxReservationCount !== undefined) {
        if (combined.maxReservationCount === null || combined.maxReservationCount === undefined) {
          combined.maxReservationCount = current.maxReservationCount;
        } else {
          combined.maxReservationCount = Math.min(
            combined.maxReservationCount,
            current.maxReservationCount
          );
        }
      }
    }

    return { ...combined, type: null };
  }

  async jobSetClosingHour() {
    // get all hotels
    const hotels = await this.hotelRepository.find({
      select: ['id', 'timeZone', 'name']
    });

    this.logger.log(`Found ${hotels.length} hotels with closing hour configuration`);

    if (!hotels || hotels.length === 0) {
      this.logger.warn('No hotels found');
      return;
    }

    const hotelIds = hotels.map((hotel) => hotel.id);

    // find configuration with config type in [RECEPTION_OPERATION_CLOSING_CHANNEL_SYNC, RECEPTION_OPERATION_CLOSING_PMS_SYNC, RECEPTION_OPERATION_CLOSING]
    const configurations = await this.hotelConfigurationRepository.find({
      where: {
        configType: In([
          HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING_CHANNEL_SYNC,
          HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING_PMS_SYNC,
          HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING
        ]),
        configValue: Not(IsNull()),
        hotelId: In(hotelIds)
      }
    });

    if (!configurations || configurations.length === 0) {
      this.logger.warn('No configurations found');
      return;
    }

    const configurationMap = new Map<string, HotelConfiguration[]>();

    // create map for fast lookup
    configurations.forEach((configuration) => {
      if (!configurationMap.has(configuration.hotelId)) {
        configurationMap.set(configuration.hotelId, []);
      }
      configurationMap.get(configuration.hotelId)!.push(configuration);
    });

    for (const hotel of hotels) {
      const configurations = configurationMap.get(hotel.id);

      if (!configurations || configurations.length === 0) {
        this.logger.warn(`No configuration found for hotel ${hotel.id}`);
        continue;
      }

      const closingHoursConfig = configurations.find(
        (configuration) =>
          configuration.configType === HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING
      )?.configValue?.metadata;
      if (!closingHoursConfig) {
        this.logger.warn(`Not found closing hours configuration for hotel ${hotel.id}`);
        continue;
      }
      const currentDate = toZonedTime(new Date(), hotel.timeZone); // get extractly date, hour, minute from hotel time zone
      const currentDay = format(currentDate, 'EEEE').toUpperCase();
      const todayClosingHour = closingHoursConfig?.[currentDay];

      if (!todayClosingHour) {
        this.logger.warn(`Not found closing hour configuration for hotel ${hotel.id} today`);
        continue;
      }

      const [closingHour, closingMinute] = todayClosingHour.split(':').map(Number);
      // To restrict same-day bookings after a operation hours, GauVendi will push a Close to Stay to PMS.
      if (
        getHours(currentDate) > closingHour ||
        (getHours(currentDate) === closingHour && getMinutes(currentDate) > closingMinute)
      ) {
        this.logger.debug(
          `Hotel ${hotel.name} is currently closed for check-in, today is ${todayClosingHour}`
        );
        this.logger.debug(`Current date: ${currentDate}`);
        this.logger.debug(`Hotel time zone: ${hotel.timeZone}`);

        // create house level restriction
        const restrictionToCreate: CreateRestrictionDto = {
          hotelId: hotel.id,
          type: RestrictionConditionType.ClosedToStay,
          weekdays: Object.values(Weekday),
          fromDate: `${format(currentDate, DATE_FORMAT)}T00:00:00Z`,
          toDate: `${format(currentDate, DATE_FORMAT)}T00:00:00Z`,
          minLength: undefined,
          maxLength: undefined
        };

        await this.handleBulkRestrictionOperation({
          restrictionsToAdd: [restrictionToCreate]
        });

        // handle push to pms restriction
        const configPushRestriction = configurations.find(
          (configuration) =>
            configuration.configType ===
            HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING_PMS_SYNC
        )?.configValue?.metadata;

        if (
          !configPushRestriction ||
          !configPushRestriction.enabled ||
          !configPushRestriction.days?.includes(currentDay)
        ) {
          continue;
        }

        // check if push to pms restriction is enabled and the current day is available
        const enablePushPmsRestriction = configPushRestriction?.enabled;
        const days = configPushRestriction?.days;
        const dayAvailable = days?.includes(currentDay);

        if (enablePushPmsRestriction && dayAvailable) {
          // get pms rate plan codes
          const pmsRatePlans = await this.pmsService.getPmsRatePlan({
            hotelId: hotel.id
          });

          if (pmsRatePlans.length === 0) {
            this.logger.debug(`Not found pms rate plan for hotel ${hotel.id}`);
            continue;
          }

          const pmsRatePlanCodes = pmsRatePlans.map((item) => item.ratePlanMappingPmsCode);

          const restrictionsToPms: RestrictionMappingDto[] = pmsRatePlanCodes.map(
            (pmsRatePlanCode: string) => ({
              roomProductMappingPmsCode: undefined,
              ratePlanMappingPmsCode: pmsRatePlanCode,
              fromDate: `${format(currentDate, DATE_FORMAT)}T00:00:00Z`,
              toDate: `${format(currentDate, DATE_FORMAT)}T00:00:00Z`,
              type: RestrictionConditionType.ClosedToStay,
              minLength: undefined,
              maxLength: undefined,
              weekdays: Object.values(Weekday)
            })
          );

          await this.pmsService.createPmsRatePlanRestriction(hotel.id, restrictionsToPms);
        }
        continue;
      }
    }
  }

  async jobDeleteDuplicatedRestrictions() {
    const duplicates: { id: string }[] = await this.restrictionRepository.query(`
        WITH ranked AS (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY
                hotel_id,
                type,
                from_date,
                to_date,
                room_product_ids,
                rate_plan_ids,
                min_length,
                max_length,
                min_adv,
                max_adv,
                min_los_through
              ORDER BY id
            ) AS rn
          FROM restriction
        )
        SELECT id FROM ranked WHERE rn > 1;
      `);

    if (duplicates.length === 0) {
      this.logger.log('No duplicated restrictions found');
      return { success: true };
    }

    const chunkSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < duplicates.length; i += chunkSize) {
      const chunkIds = duplicates.slice(i, i + chunkSize).map((d) => d.id);

      await this.restrictionRepository
        .createQueryBuilder()
        .delete()
        .from('restriction')
        .where('id IN (:...ids)', { ids: chunkIds })
        .execute();

      deletedCount += chunkIds.length;
    }

    this.logger.log(
      `Deleted ${deletedCount} duplicated restrictions (from ${duplicates.length} found)`
    );

    return { success: true };
  }
}
