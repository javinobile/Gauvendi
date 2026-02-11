import { DATE_FORMAT } from '@constants/date.constant';
import { DbName } from '@constants/db-name.constant';
import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { RatePlan } from '@entities/pricing-entities/rate-plan.entity';
import { Restriction } from '@entities/restriction.entity';
import { RoomProductRatePlan } from '@entities/room-product-rate-plan.entity';
import { RoomProduct } from '@entities/room-product.entity';
import {
  DistributionChannel,
  HotelConfigurationTypeEnum,
  HotelRestrictionCodeEnum,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RestrictionLevel,
  RoomProductType,
  Weekday
} from '@enums/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanDailySellability } from '@src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { RatePlanSellability } from '@src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { Cache } from 'cache-manager';
import { addDays, addMonths, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { RestrictionConditionType } from 'src/core/enums/common';
import { Helper } from 'src/core/helper/utils';
import { Between, In, Raw, Repository } from 'typeorm';
import { RoomProductAvailabilityService } from '../room-product-availability/room-product-availability.service';

export interface ViolatedRestriction {
  code: HotelRestrictionCodeEnum;
  fromDate: string; // format DATE_FORMAT (yyyy-MM-dd)
  toDate: string; // format DATE_FORMAT (yyyy-MM-dd)
  value: number;
  id?: string;
}

@Injectable()
export class IseRecommendationService {
  private readonly logger = new Logger(IseRecommendationService.name);

  constructor(
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

    @InjectRepository(RatePlanSellability, DbName.Postgres)
    private readonly ratePlanSellabilityRepository: Repository<RatePlanSellability>,

    @InjectRepository(RatePlanDailySellability, DbName.Postgres)
    private readonly ratePlanDailySellabilityRepository: Repository<RatePlanDailySellability>,

    @InjectRepository(RoomProductRatePlanAvailabilityAdjustment, DbName.Postgres)
    private readonly roomProductRatePlanAvailabilityAdjustmentRepository: Repository<RoomProductRatePlanAvailabilityAdjustment>,

    private readonly roomProductAvailabilityService: RoomProductAvailabilityService,

    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private readonly ONE_HOUR_TTL = 60 * 60 * 1000; // seconds

  async getCachedHotel(hotelCode: string): Promise<Hotel> {
    const cacheKey = `hotel:${hotelCode}`;

    let cachedHotel = await this.cacheManager.get<Hotel | null>(cacheKey);
    if (cachedHotel) {
      this.logger.log(`Cache hit for hotel ${hotelCode}`);
      return cachedHotel;
    }

    this.logger.log(`Cache miss for hotel ${hotelCode} → Fetching from DB`);
    cachedHotel = await this.hotelRepository.findOne({
      where: { code: hotelCode },
      select: ['id', 'timeZone', 'serviceChargeSetting', 'taxSetting']
    });

    if (cachedHotel) {
      await this.cacheManager.set(cacheKey, cachedHotel, this.ONE_HOUR_TTL);
    }

    return cachedHotel!;
  }

  async getCachedHotelConfig(
    hotelId: string,
    configTypes: HotelConfigurationTypeEnum[] = []
  ): Promise<HotelConfiguration[]> {
    const cacheConfigKeys =
      configTypes.length > 0
        ? configTypes
        : [
            HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE,
            HotelConfigurationTypeEnum.ISE_PRICING_DISPLAY,
            HotelConfigurationTypeEnum.DEFAULT_PAX,
            HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT,
            HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION
          ];

    let cachedConfig: HotelConfiguration[] = [];

    // for (const configKey of cacheConfigKeys) {
    //   const cacheKey = `hotel-config:${hotelId}:${configKey}`;
    //   const cachedConfigItem = await this.cacheManager.get<HotelConfiguration>(cacheKey);
    //   if (!cachedConfigItem) continue;
    //   cachedConfig.push(cachedConfigItem);
    // }

    // this.logger.log(`Cache miss for hotel config ${hotelId} → Fetching from DB`);
    const [cachedHotelConfigs, hotelConfigs] = await Promise.all([
      cachedConfig?.length
        ? Promise.resolve(cachedConfig)
        : this.hotelConfigurationRepository.find({
            where: {
              hotelId,
              configType: In(cacheConfigKeys)
            },
            select: ['id', 'configType', 'configValue']
          }),
      this.hotelConfigurationRepository.find({
        where: {
          hotelId,
          configType: In([
            HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING,
            HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING,
            HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING,
            HotelConfigurationTypeEnum.DISABLE_STAY_OPTION_PRICE_CLUSTERING,
            HotelConfigurationTypeEnum.POPULAR_AI_RECOMMENDATION_SETTING,
            HotelConfigurationTypeEnum.OUR_TIP_AI_RECOMMENDATION_SETTING
          ])
        },
        select: ['id', 'configType', 'configValue']
      })
    ]);

    const allHotelConfigs = [...cachedHotelConfigs, ...hotelConfigs];
    for (const config of allHotelConfigs) {
      const cacheKey = `hotel-config:${hotelId}:${config.configType}`;
      await this.cacheManager.set(cacheKey, config, this.ONE_HOUR_TTL);
    }

    return allHotelConfigs;
  }

  async getNearestBookableDate(payload: { hotelCode: string; fromDate: string }) {
    const { hotelCode, fromDate } = payload;

    if (!hotelCode || !fromDate) {
      return {
        checkIn: null,
        checkOut: null,
        stayNights: null
      };
    }

    // check from date on in past
    if (startOfDay(new Date(fromDate)) < startOfDay(new Date())) {
      return {
        checkIn: null,
        checkOut: null,
        stayNights: null
      };
    }

    const hotel = await this.getCachedHotel(hotelCode);
    if (!hotel) {
      return {
        checkIn: null,
        checkOut: null,
        stayNights: null
      };
    }

    const hotelConfiguration = await this.getCachedHotelConfig(hotel.id);

    let defaultPax = 1;
    let defaultStayNight = 1;
    let allowAllRoomProducts: Map<RoomProductType, boolean> = new Map();
    let timeSliceConfiguration: {
      checkInHours: number;
      checkInMinutes: number;
    } = {
      checkInHours: 0,
      checkInMinutes: 0
    };

    hotelConfiguration.forEach((config) => {
      switch (config.configType) {
        case HotelConfigurationTypeEnum.DEFAULT_PAX:
          defaultPax = config.configValue?.value;
          break;
        case HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT:
          defaultStayNight = Number(config.configValue?.value);
          break;
        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING:
          // Config handled separately per booking flow - no need to process here
          break;
        case HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING:
          // Config handled separately per booking flow - no need to process here
          break;
        case HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION:
          const checkInHours = config.configValue?.metadata['CI'].split(':')[0];
          const checkInMinutes = config.configValue?.metadata['CI'].split(':')[1];
          timeSliceConfiguration = {
            checkInHours: Number(checkInHours),
            checkInMinutes: Number(checkInMinutes)
          };

          break;
      }
    });

    const hotelId = hotel.id;
    // Allow all room product types by default - filtering will be done per booking flow
    const types: RoomProductType[] = [
      RoomProductType.RFC,
      RoomProductType.MRFC,
      RoomProductType.ERFC
    ];
    const totalAdult = Number(defaultPax);

    // Try to find bookable dates in up to 3 attempts (18 months total)
    const maxAttempts = 3;
    let currentFromDate = fromDate;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.searchBookableDatesInRange(
        hotelId,
        currentFromDate,
        types,
        totalAdult,
        defaultStayNight
      );

      if (result) {
        return result;
      }

      // Move to next 6-month window for the next attempt
      currentFromDate = format(addMonths(new Date(currentFromDate), 6), DATE_FORMAT);
    }

    // No valid pair found within 18 months (3 attempts)
    return null;
  }

  /**
   * Search for bookable dates within a 12-month range
   */
  private async searchBookableDatesInRange(
    hotelId: string,
    fromDate: string,
    types: RoomProductType[],
    totalAdult: number,
    defaultStayNight: number
  ) {
    const toDate = format(addMonths(new Date(fromDate), 12), DATE_FORMAT); // 12 months

    // get room product with capacity
    const roomProductsWithCapacity =
      await this.roomProductAvailabilityService.getAvailabilityCalendar({
        childAgeList: [],
        fromDate: fromDate,
        types: types,
        hotelId: hotelId,
        toDate: toDate,
        totalAdult: totalAdult,
        totalPet: 0
      });

    const roomProductIds = roomProductsWithCapacity.roomProductsWithCapacity
      .map((rp) => rp.id)
      .filter((id) => id !== undefined);

    if (roomProductIds.length === 0) {
      return null;
    }

    // run parallel
    const [restrictions, roomProductRatePlans] = await Promise.all([
      // get restrictions // for nearest, only get house level restrictions
      this.getRestrictions(hotelId, fromDate, toDate, RestrictionLevel.HOUSE_LEVEL),

      // get room product rate plans
      this.getRoomProductRatePlansWithSellability(hotelId, roomProductIds, fromDate, toDate)
    ]);

    const dailyRoomProductAvailabilityMap = new Map<string, number>();
    roomProductsWithCapacity.availabilityPerDate.forEach((p) => {
      // p0 is date, p1 is availability count
      dailyRoomProductAvailabilityMap.set(p[0], p[1]);
    });

    // Iterate day by day to find the nearest bookable check-in/check-out pair
    const searchDates = Helper.generateDateRange(fromDate, toDate);

    for (const candidateCheckIn of searchDates) {
      // Find corresponding checkout date
      const candidateCheckOut = format(
        addDays(new Date(candidateCheckIn), defaultStayNight),
        DATE_FORMAT
      );

      // Validate candidateCheckOut is within search window
      if (new Date(candidateCheckOut) > new Date(toDate)) {
        continue; // Check-out date exceeds search window
      }

      // Comprehensive validation using the enhanced validation method
      const isValid = await this.validateStayWindow(
        candidateCheckIn,
        candidateCheckOut,
        defaultStayNight,
        roomProductRatePlans,
        restrictions,
        dailyRoomProductAvailabilityMap
      );

      if (isValid) {
        // Both check-in and check-out dates pass all validations
        return {
          checkIn: candidateCheckIn,
          checkOut: candidateCheckOut,
          stayNights: defaultStayNight
        };
      }
    }

    // No valid pair found in this 6-month range
    return null;
  }

  /**
   * Check if restriction has exceptions
   */
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

  /**
   * Validate restriction exceptions
   */
  private validateRestrictionExceptions(
    restriction: Restriction,
    checkInDate: string,
    stayNights: number = 1,
    currentDate: Date
  ): boolean {
    const checkIn = startOfDay(new Date(checkInDate));
    const current = startOfDay(currentDate);

    // Check advance booking restrictions
    if (restriction.minAdv != null && restriction.minAdv > 0) {
      const daysDiff = Math.floor(differenceInCalendarDays(checkIn, current));
      if (daysDiff < restriction.minAdv) {
        return false; // Too early to book
      }
    }

    if (restriction.maxAdv != null && restriction.maxAdv > 0) {
      const daysDiff = Math.floor(differenceInCalendarDays(checkIn, current));
      if (daysDiff > restriction.maxAdv) {
        return false; // Too far in advance
      }
    }

    // Check length of stay restrictions
    if (restriction.minLength != null && restriction.minLength > 0) {
      if (stayNights < restriction.minLength) {
        return false; // Stay too short
      }
    }

    if (restriction.maxLength != null && restriction.maxLength > 0) {
      if (stayNights > restriction.maxLength) {
        return false; // Stay too long
      }
    }

    // Check minimum LOS through restriction
    if (restriction.minLosThrough != null && restriction.minLosThrough > 0) {
      // minLosThrough only applies if the stay overlaps with the restricted period
      const checkOut = new Date(checkIn.getTime() + stayNights * 24 * 60 * 60 * 1000);
      const restrictionStart = restriction.fromDate;
      const restrictionEnd = restriction.toDate;

      // Check if stay overlaps with restricted period
      // Stay overlaps if: checkIn <= restrictionEnd AND checkOut >= restrictionStart
      // Note: checkOut >= (not >) because checkout on restrictionStart still means staying the night before
      if (
        restrictionStart &&
        restrictionEnd &&
        checkIn <= restrictionEnd &&
        checkOut >= restrictionStart
      ) {
        if (stayNights < restriction.minLosThrough) {
          return false; // Minimum LOS through not met for overlapping stay
        }
      }
      // If no overlap, minLosThrough doesn't apply
    }

    // All exception validations passed
    return true;
  }

  /**
   * Comprehensive validation for a check-in/check-out pair
   */
  private async validateStayWindow(
    checkInDate: string,
    checkOutDate: string,
    stayNights: number,
    roomProductRatePlans: any[],
    restrictions: Restriction[],
    dailyRoomProductAvailabilityMap: Map<string, number>
  ): Promise<boolean> {
    // Generate all dates in the stay window (excluding checkout date)
    const stayDates = Helper.generateDateRange(
      checkInDate,
      format(addDays(new Date(checkOutDate), -1), DATE_FORMAT)
    );

    // Validate each day in the stay window
    for (let i = 0; i < stayDates.length; i++) {
      const currentStayDate = stayDates[i];
      const isFirstDay = i === 0; // Check-in day
      const isLastDay = i === stayDates.length - 1; // Last night of stay

      // Check inventory - room product must exist in availability list
      const availability = dailyRoomProductAvailabilityMap.get(currentStayDate);
      if (!availability || availability <= 0) {
        return false; // No availability on this date
      }

      // Check sellability - product must be sellable under its sales plan
      let hasSellableProduct = false;
      for (const p of roomProductRatePlans) {
        // Rate Plan sellability (daily → fallback to default)
        const dailyRatePlanSellability = p.ratePlan.ratePlanDailySellabilities.find(
          (rpds) =>
            rpds.date === currentStayDate &&
            rpds.distributionChannel === DistributionChannel.GV_SALES_ENGINE
        );
        const ratePlanSellable =
          dailyRatePlanSellability?.isSellable ??
          p.ratePlan.ratePlanSellabilities?.some((rps) =>
            rps.distributionChannel.includes(DistributionChannel.GV_SALES_ENGINE)
          ) ??
          false;

        // Room Product Rate Plan sellability (daily → fallback to default)
        const dailyRoomProductRatePlanSellability =
          p.roomProductRatePlanAvailabilityAdjustments.find(
            (adj: RoomProductRatePlanAvailabilityAdjustment) => adj.date === currentStayDate
          );
        const roomProductRatePlanSellable =
          dailyRoomProductRatePlanSellability?.isSellable ?? p.isSellable ?? false;

        // Check if this product is sellable
        if (ratePlanSellable && roomProductRatePlanSellable) {
          hasSellableProduct = true;
          break;
        }
      }

      if (!hasSellableProduct) {
        return false; // No sellable products on this date
      }

      // Check restrictions for this specific day
      if (isFirstDay) {
        // Check CTA and CTS for check-in day
        const arrivalViolations = this.checkRestrictions(
          currentStayDate,
          'arrival',
          stayNights,
          checkInDate,
          restrictions
        );
        if (arrivalViolations.length > 0) {
          return false;
        }
        const stayViolations = this.checkRestrictions(
          currentStayDate,
          'stay',
          stayNights,
          checkInDate,
          restrictions
        );
        if (stayViolations.length > 0) {
          return false;
        }
      } else if (isLastDay) {
        // Check CTS for intermediate days and CTD for the last night
        const stayViolations = this.checkRestrictions(
          currentStayDate,
          'stay',
          stayNights,
          checkInDate,
          restrictions,
          isLastDay
        );
        if (stayViolations.length > 0) {
          return false;
        }
        // Note: CTD is checked on checkout date, not the last night of stay
      } else {
        // Check CTS for intermediate days
        const stayViolations = this.checkRestrictions(
          currentStayDate,
          'stay',
          stayNights,
          checkInDate,
          restrictions
        );
        if (stayViolations.length > 0) {
          return false;
        }
      }
    }

    // Check CTD for checkout date
    const departureViolations = this.checkRestrictions(
      checkOutDate,
      'departure',
      stayNights,
      checkInDate,
      restrictions
    );
    if (departureViolations.length > 0) {
      return false;
    }

    return true; // All validations passed
  }

  /**
   * Enhanced restriction checking with all validation rules
   * Returns array of violated restrictions instead of boolean
   */
  public checkRestrictions(
    date: string,
    restrictionType: 'arrival' | 'departure' | 'stay',
    stayNights: number = 1,
    checkInDate: string,
    restrictions: Restriction[],
    isLastDay: boolean = false
  ): ViolatedRestriction[] {
    const checkDate = new Date(date);
    const weekdayName = format(checkDate, 'EEEE');
    const now = new Date();
    const violatedRestrictions: ViolatedRestriction[] = [];

    for (const restriction of restrictions) {
      // Check if restriction applies to this date range
      if (restriction.fromDate && restriction.toDate) {
        const restrictionStart = restriction.fromDate;
        const restrictionEnd = restriction.toDate;

        if (checkDate >= restrictionStart && checkDate <= restrictionEnd) {
          // Check if weekday restriction applies first
          if (restriction.weekdays && restriction.weekdays.length > 0) {
            if (!restriction.weekdays.includes(weekdayName as Weekday)) {
              continue; // This restriction doesn't apply to this weekday
            }
          }

          let isViolated = false;
          let restrictionCode: HotelRestrictionCodeEnum | undefined;
          let restrictionValue = 0;

          // Check restriction type
          if (
            restrictionType === 'arrival' &&
            restriction.type === RestrictionConditionType.ClosedToArrival
          ) {
            const hasExceptions = this.hasRestrictionExceptions(restriction);

            if (!hasExceptions) {
              restrictionCode = HotelRestrictionCodeEnum.RSTR_CLOSE_TO_ARRIVAL;
              isViolated = true; // Arrival is blocked
              restrictionValue = 0;
            } else {
              if (!this.validateRestrictionExceptions(restriction, checkInDate, stayNights, now)) {
                isViolated = true; // Restriction exceptions not met
                // Get specific exception details
                const exceptionDetails = this.getRestrictionExceptionDetails(
                  restriction,
                  checkInDate,
                  stayNights,
                  now
                );
                if (exceptionDetails) {
                  restrictionCode = exceptionDetails.code;
                  restrictionValue = exceptionDetails.value;
                } else {
                  restrictionCode = HotelRestrictionCodeEnum.RSTR_CLOSE_TO_ARRIVAL;
                  restrictionValue = 0;
                }
              }
            }
          }

          if (
            restrictionType === 'departure' &&
            restriction.type === RestrictionConditionType.ClosedToDeparture
          ) {
            const hasExceptions = this.hasRestrictionExceptions(restriction);

            if (!hasExceptions) {
              restrictionCode = HotelRestrictionCodeEnum.RSTR_CLOSE_TO_DEPARTURE;
              isViolated = true; // Departure is blocked
              restrictionValue = 0;
            } else {
              if (!this.validateRestrictionExceptions(restriction, checkInDate, stayNights, now)) {
                isViolated = true; // Restriction exceptions not met
                // Get specific exception details
                const exceptionDetails = this.getRestrictionExceptionDetails(
                  restriction,
                  checkInDate,
                  stayNights,
                  now
                );
                if (exceptionDetails) {
                  restrictionCode = exceptionDetails.code;
                  restrictionValue = exceptionDetails.value;
                } else {
                  restrictionCode = HotelRestrictionCodeEnum.RSTR_CLOSE_TO_DEPARTURE;
                  restrictionValue = 0;
                }
              }
            }
          }

          if (restriction.type === RestrictionConditionType.ClosedToStay) {
            // Implemented the "Check Out Only" logic for restricted blocks:
            // If the stay is the last day, skip the CTS restriction check
            if (isLastDay) {
              this.logger.warn(`CTS is bypassed for date ${date} because it is the last day`);
              continue;
            }
            const hasExceptions = this.hasRestrictionExceptions(restriction);

            if (!hasExceptions) {
              // this.logger.warn(`Stay is blocked for date ${date} by restriction ${restriction.id}`);
              restrictionCode = HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY;
              isViolated = true; // Stay is blocked
              restrictionValue = 0;
            } else {
              if (!this.validateRestrictionExceptions(restriction, checkInDate, stayNights, now)) {
                isViolated = true; // Restriction exceptions not met
                // Get specific exception details
                const exceptionDetails = this.getRestrictionExceptionDetails(
                  restriction,
                  checkInDate,
                  stayNights,
                  now
                );
                if (exceptionDetails) {
                  restrictionCode = exceptionDetails.code;
                  restrictionValue = exceptionDetails.value;
                } else {
                  restrictionCode = HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY;
                  restrictionValue = 0;
                }
              }
            }
          }

          // Add violated restriction to the array
          if (isViolated && restrictionCode) {
            violatedRestrictions.push({
              code: restrictionCode,
              fromDate: format(restrictionStart, DATE_FORMAT),
              toDate: format(restrictionEnd, DATE_FORMAT),
              value: restrictionValue,
              id: restriction.id
            });
          }
        }
      }
    }

    return violatedRestrictions;
  }

  /**
   * Get the restriction exception details that caused the violation
   */
  private getRestrictionExceptionDetails(
    restriction: Restriction,
    checkInDate: string,
    stayNights: number = 1,
    currentDate: Date
  ): { code: HotelRestrictionCodeEnum; value: number } | null {
    const checkIn = startOfDay(new Date(checkInDate));
    const current = startOfDay(currentDate);

    // const checkIn = Helper.parseDateToUTC(checkInDate);

    // Check advance booking restrictions
    if (restriction.minAdv != null && restriction.minAdv > 0) {
      const daysDiff = Math.floor(differenceInCalendarDays(checkIn, current));
      if (daysDiff < restriction.minAdv) {
        return {
          code: HotelRestrictionCodeEnum.RSTR_MIN_ADVANCE_BOOKING,
          value: restriction.minAdv
        };
      }
    }

    if (restriction.maxAdv != null && restriction.maxAdv > 0) {
      const daysDiff = Math.floor(differenceInCalendarDays(checkIn, current));
      if (daysDiff > restriction.maxAdv) {
        return {
          code: HotelRestrictionCodeEnum.RSTR_MAX_ADVANCE_BOOKING,
          value: restriction.maxAdv
        };
      }
    }

    // Check length of stay restrictions
    if (restriction.minLength != null && restriction.minLength > 0) {
      if (stayNights < restriction.minLength) {
        return {
          code: HotelRestrictionCodeEnum.RSTR_LOS_MIN,
          value: restriction.minLength
        };
      }
    }

    if (restriction.maxLength != null && restriction.maxLength > 0) {
      if (stayNights > restriction.maxLength) {
        return {
          code: HotelRestrictionCodeEnum.RSTR_LOS_MAX,
          value: restriction.maxLength
        };
      }
    }

    // Check minimum LOS through restriction
    if (restriction.minLosThrough != null && restriction.minLosThrough > 0) {
      if (stayNights < restriction.minLosThrough) {
        return {
          code: HotelRestrictionCodeEnum.RSTR_MIN_LOS_THROUGH,
          value: restriction.minLosThrough
        };
      }
    }

    return null; // No specific exception found
  }

  public async getRoomProductRatePlansWithSellability(
    hotelId: string,
    roomProductIds: string[],
    fromDate: string,
    toDate: string,
    ratePlanPromoIdList: string[] = []
  ): Promise<RoomProductRatePlan[]> {
    // Prepare concurrent operations for all related data
    const concurrentOperations: Array<{
      type: string;
      promise: Promise<any>;
    }> = [
      // get rate plans
      {
        type: 'ratePlans',
        promise: this.ratePlanRepository.find({
          where: {
            hotelId,
            distributionChannel: Raw(
              (alias) => `'${DistributionChannel.GV_SALES_ENGINE}' = ANY(${alias})`
            ),
            status: RatePlanStatusEnum.ACTIVE,
            ...(ratePlanPromoIdList.length > 0
              ? {
                  type: In([
                    RatePlanTypeEnum.PUBLIC,
                    RatePlanTypeEnum.GROUP,
                    RatePlanTypeEnum.CORPORATE,
                    RatePlanTypeEnum.PROMOTION
                  ])
                }
              : { type: RatePlanTypeEnum.PUBLIC })
          },
          select: {
            id: true,
            code: true,
            distributionChannel: true,
            type: true,
            promoCodes: true,
            name: true,
            description: true,
            translations: true,
            baseSetting: {
              ratePlanId: true,
              derivedRatePlanId: true,
              followDailyRoomProductAvailability: true
            }
          },
          relations: ['baseSetting']
        })
      },

      // get rate plan sellabilities
      {
        type: 'ratePlanSellabilities',
        promise: this.ratePlanSellabilityRepository.find({
          where: {
            hotelId,
            distributionChannel: Raw(
              (alias) => `'${DistributionChannel.GV_SALES_ENGINE}' = ANY(${alias})`
            )
          },
          select: ['ratePlanId', 'id', 'distributionChannel']
        })
      },

      // get rate plan daily sellabilities
      {
        type: 'ratePlanDailySellabilities',
        promise: this.ratePlanDailySellabilityRepository.find({
          where: {
            hotelId,
            date: Between(fromDate, toDate)
          },
          select: ['date', 'ratePlanId', 'isSellable', 'id', 'distributionChannel'],
          order: { date: 'ASC' }
        })
      },

      // get room product rate plan availability adjustments
      {
        type: 'roomProductRatePlanAvailabilityAdjustments',
        promise: this.roomProductRatePlanAvailabilityAdjustmentRepository.find({
          where: { hotelId, date: Between(fromDate, toDate) },
          select: ['date', 'isSellable', 'roomProductRatePlanId', 'id'],
          order: { date: 'ASC' }
        })
      }
    ];

    // Execute all concurrent operations and main query in parallel
    const [concurrentResults, roomProductRatePlans] = await Promise.all([
      Promise.all(concurrentOperations.map((op) => op.promise)),
      this.roomProductRatePlanRepository.find({
        where: {
          hotelId,
          roomProductId: In(roomProductIds)
          // isSellable: true,
        },
        select: ['id', 'name', 'code', 'ratePlanId', 'roomProductId', 'isSellable']
      })
    ]);

    // Map concurrent results to variables
    const [
      ratePlans,
      ratePlanSellabilities,
      ratePlanDailySellabilities,
      roomProductRatePlanAvailabilityAdjustments
    ] = concurrentResults;

    // Create lookup maps for efficient data mapping - optimized with reduce

    const ratePlanSellabilityMap = new Map<string, RatePlanSellability>(
      ratePlanSellabilities.map((rps: RatePlanSellability) => [rps.ratePlanId, rps])
    );

    // Optimized grouping with reduce for better performance
    const ratePlanDailySellabilityMap: Map<string, RatePlanDailySellability[]> =
      ratePlanDailySellabilities.reduce((map, rpds) => {
        if (!map.has(rpds.ratePlanId)) {
          map.set(rpds.ratePlanId, []);
        }
        map.get(rpds.ratePlanId)!.push(rpds);
        return map;
      }, new Map<string, RatePlanDailySellability[]>());

    const dates = Helper.generateDateRange(fromDate, toDate);
    let saleRatePlan: RatePlan[] = ratePlans.filter((rp: RatePlan) => {
      let findRatePlanDailySellability: RatePlanDailySellability[] = [];
      let findRatePlanSellability = ratePlanSellabilityMap.get(rp.id);
      if (
        rp &&
        rp.baseSetting &&
        rp.baseSetting.followDailyRoomProductAvailability &&
        rp.baseSetting.derivedRatePlanId
      ) {
        // Get daily sellabilities from parent rate plan
        findRatePlanSellability = ratePlanSellabilityMap.get(rp.baseSetting.derivedRatePlanId);
        findRatePlanDailySellability =
          ratePlanDailySellabilityMap.get(rp.baseSetting.derivedRatePlanId) || [];
      } else {
        // Use current rate plan's daily sellabilities
        findRatePlanSellability = ratePlanSellabilityMap.get(rp.id);
        findRatePlanDailySellability = ratePlanDailySellabilityMap.get(rp.id) || [];
      }

      let isDefaultSellable = findRatePlanSellability?.distributionChannel.includes(
        DistributionChannel.GV_SALES_ENGINE
      );

      return dates.some((date) => {
        const dailySellability = findRatePlanDailySellability?.find((rpds) => rpds.date === date);
        if (dailySellability) {
          return dailySellability.isSellable;
        }
        return isDefaultSellable;
      });
    });

    let saleRoomProductRatePlans: RoomProductRatePlan[] = roomProductRatePlans;
    if (ratePlanPromoIdList.length > 0) {
      const ratePlanPromos = saleRatePlan.filter((item) => ratePlanPromoIdList.includes(item.id));
      if (
        ratePlanPromos.length > 0 &&
        ratePlanPromos.some((item) => item.type === RatePlanTypeEnum.CORPORATE)
      ) {
        saleRatePlan = ratePlanPromos;
        saleRoomProductRatePlans = roomProductRatePlans.filter((item) =>
          ratePlanPromoIdList.includes(item.ratePlanId)
        );
      }
    }

    const ratePlanMap = new Map(saleRatePlan.map((rp: RatePlan) => [rp.id, rp]));

    const availabilityAdjustmentMap = roomProductRatePlanAvailabilityAdjustments.reduce(
      (map, adj) => {
        if (!map.has(adj.roomProductRatePlanId)) {
          map.set(adj.roomProductRatePlanId, []);
        }
        map.get(adj.roomProductRatePlanId)!.push(adj);
        return map;
      },
      new Map<string, any[]>()
    );

    // Map related data to room product rate plans
    const result = saleRoomProductRatePlans
      .filter((rprp: RoomProductRatePlan) => {
        const ratePlan = ratePlanMap.get(rprp.ratePlanId);
        return ratePlan; // Only include if rate plan exists and matches criteria
      })
      .map((rprp: any) => {
        const ratePlan = ratePlanMap.get(rprp.ratePlanId) as RatePlan & {
          baseSetting?: { derivedRatePlanId: string; followDailyRoomProductAvailability: boolean };
        };

        // Check if rate plan has derived setting with followDailyRoomProductAvailability
        let ratePlanDailySellabilities: any[] = [];
        let ratePlanSellability = ratePlanSellabilityMap.get(rprp.ratePlanId);
        if (
          ratePlan &&
          ratePlan.baseSetting &&
          ratePlan.baseSetting.followDailyRoomProductAvailability &&
          ratePlan.baseSetting.derivedRatePlanId
        ) {
          // Get daily sellabilities from parent rate plan
          ratePlanDailySellabilities =
            ratePlanDailySellabilityMap.get(ratePlan.baseSetting.derivedRatePlanId) || [];
          ratePlanSellability = ratePlanSellabilityMap.get(ratePlan.baseSetting.derivedRatePlanId);
        } else {
          // Use current rate plan's daily sellabilities
          ratePlanDailySellabilities = ratePlanDailySellabilityMap.get(rprp.ratePlanId) || [];
          ratePlanSellability = ratePlanSellabilityMap.get(rprp.ratePlanId);
        }

        const currentRoomProductRatePlanAvailabilityAdjustments =
          availabilityAdjustmentMap.get(rprp.id) || [];

        return {
          ...rprp,
          ratePlan: {
            ...(ratePlan || {}),
            ratePlanSellabilities: ratePlanSellability ? [ratePlanSellability] : [],
            ratePlanDailySellabilities
          },
          roomProductRatePlanAvailabilityAdjustments:
            currentRoomProductRatePlanAvailabilityAdjustments
        };
      });

    return result;
  }

  public getRestrictions(
    hotelId: string,
    fromDate: string,
    toDate: string,
    level?: RestrictionLevel,
    roomProductIds?: string[]
  ): Promise<Restriction[]> {
    // get restrictions

    const endDate = format(addDays(new Date(toDate), 1), DATE_FORMAT);

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
        'r.maxReservationCount'
      ])
      .orderBy('r.createdAt', 'DESC')
      .addOrderBy('r.fromDate', 'ASC')
      .where('r.hotelId = :hotelId', { hotelId });

    // filter by level
    if (level) {
      switch (level) {
        case RestrictionLevel.HOUSE_LEVEL:
          queryBuilder.andWhere('r.roomProductIds IS NULL');
          queryBuilder.andWhere('r.ratePlanIds IS NULL');
          break;

        case RestrictionLevel.ROOM_PRODUCT:
          if (roomProductIds?.length) {
            queryBuilder.andWhere('r.roomProductIds && :roomProductIds', { roomProductIds });
          }
          queryBuilder.andWhere('r.roomProductIds IS NOT NULL');
          queryBuilder.andWhere('r.ratePlanIds IS NULL');
          break;

        case RestrictionLevel.RATE_PLAN:
          queryBuilder.andWhere('r.ratePlanIds IS NOT NULL');
          queryBuilder.andWhere('r.roomProductIds IS NULL');
          break;

        default:
          break;
      }
    }

    if (fromDate && toDate) {
      queryBuilder
        .andWhere('r.fromDate <= :endDate', {
          endDate
        })
        .andWhere('r.toDate >= :startDate', {
          startDate: fromDate
        });
    }

    return queryBuilder.getMany();
  }
}
