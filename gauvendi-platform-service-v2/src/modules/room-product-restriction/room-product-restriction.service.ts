import { BadRequestException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GapModeEnum,
  RestrictionAutomationSetting,
  RestrictionAutomationSettingTypeEnum
} from '@src/core/entities/restriction-automation-setting.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { Helper } from '@src/core/helper/utils';
import { RedisService } from '@src/core/redis/redis.service';
import {
  addMonths,
  endOfDay,
  format,
  isBefore,
  isWithinInterval,
  startOfDay,
  subMonths
} from 'date-fns';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import { DbName } from 'src/core/constants/db-name.constant';
import {
  Restriction,
  RestrictionSourceMap,
  RestrictionSourceType
} from 'src/core/entities/restriction.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import {
  RestrictionConditionType,
  RestrictionLevel,
  RoomProductStatus,
  RoomUnitAvailabilityStatus,
  Weekday
} from 'src/core/enums/common';
import { In, IsNull, Repository } from 'typeorm';
import { HotelConfigurationRepository } from '../hotel-configuration/hotel-configuration.repository';
import { CreateRestrictionDto } from '../restriction/restriction.dto';
import { RestrictionService } from '../restriction/restriction.service';
import {
  AutomateLosRequestDto,
  RoomProductRestriction,
  TriggerLosRestrictionDto
} from './room-product-restriction.dto';

@Injectable()
export class RoomProductRestrictionService {
  private readonly logger = new Logger(RoomProductRestrictionService.name);

  constructor(
    @InjectRepository(RestrictionAutomationSetting, DbName.Postgres)
    private readonly restrictionAutomationSettingRepository: Repository<RestrictionAutomationSetting>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductDailyAvailability, DbName.Postgres)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(Restriction, DbName.Postgres)
    private readonly restrictionRepository: Repository<Restriction>,

    private readonly hotelConfigurationRepository: HotelConfigurationRepository,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @Inject(forwardRef(() => RestrictionService))
    private readonly restrictionService: RestrictionService,
    private readonly redisService: RedisService
  ) {}

  async triggerLosRestriction(body: TriggerLosRestrictionDto) {
    const { hotelId } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    const restrictionSettings = await this.restrictionAutomationSettingRepository.find({
      where: {
        hotelId
      }
    });

    if (restrictionSettings.length === 0) {
      this.logger.warn(`No restriction automate settings found for hotel ${hotelId}`);
      return [];
    }

    await Promise.all(
      restrictionSettings.map(async (setting) => {
        const { type, referenceId, isEnabled, hotelId } = setting;

        switch (type) {
          case RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT:
            if (!isEnabled) {
              return this.processRoomProductDefaultRestrictions(setting);
            }
            return this.processAutomateLos({
              hotelId,
              roomProductIds: [referenceId]
            });

          case RestrictionAutomationSettingTypeEnum.RATE_PLAN:
            return this.processRatePlanDefaultRestrictions(setting);

          default:
            return null;
        }
      })
    );

    return restrictionSettings;
  }

  async process(
    hotelId: string,
    referenceId: string,
    type: RestrictionAutomationSettingTypeEnum,
    fromDate?: string,
    toDate?: string
  ) {
    // find restriction setting
    const restrictionSetting = await this.restrictionAutomationSettingRepository.findOne({
      where: {
        hotelId,
        type,
        referenceId
      },
      select: {
        id: true,
        settings: true,
        referenceId: true,
        isEnabled: true,
        hotelId: true
      }
    });

    if (!restrictionSetting) {
      this.logger.warn(`No restriction setting found for reference ${referenceId}`);
      return;
    }

    // for flow room product restriction
    if (type === RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT) {
      if (!restrictionSetting.isEnabled) {
        const result = await this.processRoomProductDefaultRestrictions(
          restrictionSetting,
          fromDate,
          toDate
        );
        if (result) {
          return result;
        }
        return;
      } else {
        const result = await this.processAutomateLos({
          hotelId,
          roomProductIds: [referenceId],
          fromDate,
          toDate
        });

        if (result) {
          return result;
        }
        return;
      }
    }

    // for flow rate plan restriction
    if (type === RestrictionAutomationSettingTypeEnum.RATE_PLAN) {
      const result = await this.processRatePlanDefaultRestrictions(
        restrictionSetting,
        fromDate,
        toDate
      );
      if (result) {
        return result;
      }
      return;
    }
  }

  async processRoomProductDefaultRestrictions(
    restrictionSetting: RestrictionAutomationSetting,
    fromDate?: string,
    toDate?: string
  ): Promise<CreateRestrictionDto[] | undefined> {
    return this.processDefaultRestrictions(
      restrictionSetting,
      RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT,
      fromDate,
      toDate
    );
  }

  async processRatePlanDefaultRestrictions(
    restrictionSetting: RestrictionAutomationSetting,
    fromDate?: string,
    toDate?: string
  ): Promise<CreateRestrictionDto[] | undefined> {
    return this.processDefaultRestrictions(
      restrictionSetting,
      RestrictionAutomationSettingTypeEnum.RATE_PLAN,
      fromDate,
      toDate
    );
  }

  /**
   * Shared method to process default restrictions for both room products and rate plans
   */
  private async processDefaultRestrictions(
    restrictionSetting: RestrictionAutomationSetting,
    type: RestrictionAutomationSettingTypeEnum,
    fromDate?: string,
    toDate?: string
  ): Promise<CreateRestrictionDto[] | undefined> {
    const entityType =
      type === RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT ? 'room product' : 'rate plan';

    // Get last sellable date
    const lastSellableDate = await this.hotelConfigurationRepository.getLastSellableDate(
      restrictionSetting.hotelId,
      fromDate,
      toDate
    );

    const dates = Helper.generateDateRange(
      fromDate || format(new Date(), DATE_FORMAT),
      lastSellableDate
    );

    const cleanValue = (value: any) =>
      value !== null && value !== undefined && value !== '' ? value : undefined;

    const restrictions: any[] = [];

    const hasValidRestriction = (settings: any) =>
      entityType === 'room product'
        ? cleanValue(settings.minLOS) || cleanValue(settings.maxLOS) // room product only has minLOS and maxLOS
        : cleanValue(settings.isCTA) ||
          cleanValue(settings.isCTD) ||
          cleanValue(settings.minLOS) ||
          cleanValue(settings.maxLOS) ||
          cleanValue(settings.minAdv) ||
          cleanValue(settings.maxAdv) ||
          cleanValue(settings.minLosThrough);

    if (!hasValidRestriction(restrictionSetting.settings)) {
      this.logger.warn(
        `No valid restriction values for ${entityType} ${restrictionSetting.referenceId}`
      );
      await this.restrictionService.deleteBulkRestriction({
        hotelId: restrictionSetting.hotelId,
        fromDate: format(new Date(dates[0]), DATE_FORMAT),
        toDate: format(new Date(dates[dates.length - 1]), DATE_FORMAT),
        level:
          entityType === 'room product'
            ? RestrictionLevel.ROOM_PRODUCT
            : RestrictionLevel.RATE_PLAN,
        roomProductIds: [restrictionSetting.referenceId],
        ratePlanIds: [restrictionSetting.referenceId],
        restrictionSource: RestrictionSourceType.MANUAL
      });
      return;
    }

    for (const date of dates) {
      const baseRestriction = {
        fromDate: `${date}T00:00:00Z`,
        toDate: `${date}T00:00:00Z`,
        [type === RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT
          ? 'roomProductId'
          : 'ratePlanId']: restrictionSetting.referenceId,
        hotelId: restrictionSetting.hotelId,
        minLength: cleanValue(restrictionSetting.settings.minLOS),
        maxLength: cleanValue(restrictionSetting.settings.maxLOS),
        minAdv: cleanValue(restrictionSetting.settings.minAdv),
        maxAdv: cleanValue(restrictionSetting.settings.maxAdv),
        minLosThrough: cleanValue(restrictionSetting.settings.minLosThrough)
      };

      // Both CTA and CTD active → create two restrictions
      if (restrictionSetting.settings.isCTA && restrictionSetting.settings.isCTD) {
        restrictions.push({
          ...baseRestriction,
          type: RestrictionConditionType.ClosedToArrival
        });
        restrictions.push({
          ...baseRestriction,
          type: RestrictionConditionType.ClosedToDeparture
        });
        continue;
      }

      // Only one of CTA or CTD → create one restriction
      const typeRestriction = restrictionSetting.settings.isCTA
        ? RestrictionConditionType.ClosedToArrival
        : restrictionSetting.settings.isCTD
          ? RestrictionConditionType.ClosedToDeparture
          : RestrictionConditionType.ClosedToArrival;

      restrictions.push({
        ...baseRestriction,
        type: typeRestriction
      });
    }

    if (restrictions.length === 0) {
      this.logger.warn(
        `No restrictions generated for ${entityType} ${restrictionSetting.referenceId}`
      );
      return;
    }

    const createRestrictionDtos: CreateRestrictionDto[] = restrictions.map((restriction) => {
      const restrictionSource: Record<string, RestrictionSourceType> = {};

      // Dynamically assign DEFAULT source if the property is defined
      ['minLength', 'maxLength', 'minAdv', 'maxAdv', 'minLosThrough', 'isCTA', 'isCTD'].forEach(
        (key) => {
          if (restriction[key] !== undefined)
            restrictionSource[key] = RestrictionSourceType.DEFAULT;
        }
      );

      return {
        hotelId: restrictionSetting.hotelId,
        type: restriction.type,
        weekdays: Object.values(Weekday),
        fromDate: restriction.fromDate,
        toDate: restriction.toDate,
        minLength: restriction.minLength,
        maxLength: restriction.maxLength,
        minAdv: restriction.minAdv,
        maxAdv: restriction.maxAdv,
        minLosThrough: restriction.minLosThrough,
        isCTA: restriction.isCTA,
        isCTD: restriction.isCTD,
        roomProductIds:
          type === RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT
            ? [restrictionSetting.referenceId]
            : undefined,
        ratePlanIds:
          type === RestrictionAutomationSettingTypeEnum.RATE_PLAN
            ? [restrictionSetting.referenceId]
            : undefined,
        metadata: undefined,
        restrictionSource
      };
    });

    // Bulk create restrictions
    await this.restrictionService.handleBulkRestrictionOperation({
      restrictionsToAdd: createRestrictionDtos
    });

    this.logger.log(
      `Successfully applied LOS automation for ${entityType} ${restrictionSetting.referenceId}: ${createRestrictionDtos.length} restrictions created for date range ${format(new Date(dates[0]), DATE_FORMAT)} to ${format(new Date(dates[dates.length - 1]), DATE_FORMAT)}`
    );

    return createRestrictionDtos;
  }

  async processAutomateLos(request: AutomateLosRequestDto) {
    const { hotelId, fromDate, toDate, roomProductIds } = request;

    // Validate input parameters
    const validationResult = this.validateAutomateLosRequest(hotelId, roomProductIds);
    if (validationResult) return validationResult;

    // Check cache for each room product ID to prevent concurrent processing
    const cacheResults = await this.checkAndSetRoomProductCache(hotelId, roomProductIds);
    const { processableRoomProductIds, cachedRoomProductIds } = cacheResults;

    if (processableRoomProductIds.length === 0) {
      this.logger.warn(
        `All room products for hotel ${hotelId} are currently being processed or recently processed`
      );
      return {
        processed: 0,
        skipped: cachedRoomProductIds.length,
        errors: [],
        message:
          'All room products are currently cached (processing in progress or recently completed)'
      };
    }

    // Calculate date range for automation processing
    const { startDate, extendedEndDate } = await this.calculateAutomationDateRange(
      hotelId,
      fromDate,
      toDate
    );

    this.logger.log(
      `Starting LOS automation for hotel ${hotelId} from ${format(startDate, DATE_FORMAT)} to ${format(extendedEndDate, DATE_FORMAT)}. Processing ${processableRoomProductIds.length} room products, skipping ${cachedRoomProductIds.length} cached ones.`
    );

    try {
      // Get enabled automation settings for processable room products only
      const automationSettings = await this.getEnabledAutomationSettings(
        hotelId,
        processableRoomProductIds
      );
      if (automationSettings.length === 0) {
        this.logger.warn(
          `No restriction automate settings found for processable room products in hotel ${hotelId}`
        );
        // Clear cache for room products that don't have automation settings
        await this.clearRoomProductCache(hotelId, processableRoomProductIds);
        return { processed: 0, skipped: cachedRoomProductIds.length, errors: [] };
      }

      // Process room products with automation
      await this.processRoomProductsWithAutomation(
        automationSettings,
        hotelId,
        startDate,
        extendedEndDate
      );

      return {
        processed: automationSettings.length,
        skipped: cachedRoomProductIds.length,
        errors: []
      };
    } catch (error) {
      this.logger.error(
        `LOS automation failed for hotel ${hotelId}: ${error.message}`,
        error.stack
      );
      // Clear cache for failed room products to allow retry
      await this.clearRoomProductCache(hotelId, processableRoomProductIds);
      return { processed: 0, skipped: cachedRoomProductIds.length, errors: [error.message] };
    }
  }

  /**
   * Validates the automation request parameters
   */
  private validateAutomateLosRequest(
    hotelId: string,
    roomProductIds: string[]
  ): { processed: number; skipped: number; errors: [] } | null {
    if (!hotelId) {
      this.logger.warn(`No hotel ID provided for automate los`);
      return { processed: 0, skipped: 0, errors: [] };
    }

    if (!roomProductIds || roomProductIds.length === 0) {
      this.logger.warn(`No room product IDs provided for automation in hotel ${hotelId}`);
      return { processed: 0, skipped: 0, errors: [] };
    }

    return null;
  }

  /**
   * Calculates the date range for automation processing
   */
  private async calculateAutomationDateRange(
    hotelId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ startDate: Date; extendedEndDate: Date }> {
    const today = new Date();
    let triggeredDate = fromDate ? subMonths(new Date(fromDate), 6) : today;

    // Ensure triggered date is not in the past
    if (isBefore(triggeredDate, today)) {
      triggeredDate = today;
    }

    const lastSellableDate = await this.hotelConfigurationRepository.getLastSellableDate(
      hotelId,
      fromDate,
      toDate
    );
    const startDate = triggeredDate;
    const extendedEndDate = lastSellableDate
      ? new Date(lastSellableDate)
      : addMonths(startDate, 12);

    return { startDate, extendedEndDate };
  }

  /**
   * Retrieves enabled automation settings for room products
   */
  private async getEnabledAutomationSettings(
    hotelId: string,
    roomProductIds: string[]
  ): Promise<RestrictionAutomationSetting[]> {
    return this.restrictionAutomationSettingRepository.find({
      where: {
        hotelId,
        type: RestrictionAutomationSettingTypeEnum.ROOM_PRODUCT,
        isEnabled: true,
        referenceId: In(roomProductIds)
      },
      select: {
        id: true,
        isEnabled: true,
        settings: true,
        referenceId: true
      }
    });
  }

  /**
   * Processes room products with default automation (null gap mode)
   */
  private async processRoomProductsWithAutomation(
    automationSettings: RestrictionAutomationSetting[],
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    if (automationSettings.length === 0) return;

    const roomProductIds = automationSettings.map((setting) => setting.referenceId);

    const [roomProducts, roomProductAssignedUnitsMap] = await Promise.all([
      this.getActiveRoomProductsWithAutomation(hotelId, roomProductIds, startDate, endDate),

      this.getRoomUnitAvailabilities(
        roomProductIds,
        format(startDate, DATE_FORMAT),
        format(endDate, DATE_FORMAT)
      )
    ]);

    for (const roomProduct of roomProducts) {
      const automationSetting = automationSettings.find(
        (setting) => setting.referenceId === roomProduct.id
      )!;

      if (!automationSetting) {
        this.logger.warn(`No automation setting found for room product ${roomProduct.id}`);
        continue;
      }

      const assignedUnits = roomProductAssignedUnitsMap.get(roomProduct.id) ?? [];

      if (assignedUnits.length === 0) {
        this.logger.warn(`No assigned units found for room product ${roomProduct.id}`);
        continue;
      }

      await this.processDefaultAutomationForRoomProduct(
        roomProduct,
        automationSetting,
        assignedUnits,
        startDate,
        endDate
      );
    }
  }

  /**
   * Processes default automation for a single room product
   */
  private async processDefaultAutomationForRoomProduct(
    roomProduct: {
      hotelId: string;
      id: string;
      code: string;
      roomProductRestrictions: Restriction[];
      roomProductDailyAvailabilities: RoomProductDailyAvailability[];
    },
    automationSetting: RestrictionAutomationSetting,
    assignedUnits: RoomUnit[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const {
      hotelId,
      id: roomProductId,
      code: roomProductCode,
      roomProductDailyAvailabilities: availabilityData,
      roomProductRestrictions
    } = roomProduct;

    try {
      // Validate automation setting and availability data
      if (
        !this.validateRoomProductForAutomation(
          automationSetting,
          roomProductCode,
          availabilityData,
          startDate,
          endDate
        )
      ) {
        return;
      }

      this.logger.log(`Processing LOS automation for room product: ${roomProductCode}`);

      // Calculate daily restrictions based on room unit availability
      const dailyRestrictions = this.calculateDailyRestrictionsFromUnits(
        assignedUnits,
        roomProductRestrictions,
        roomProductId,
        hotelId,
        startDate,
        endDate,
        automationSetting
      );

      if (dailyRestrictions.length === 0) {
        this.logger.warn(
          `No daily restrictions calculated for room product ${roomProductCode} - no available periods found`
        );
        return;
      }

      // Create and apply restrictions
      await this.createAndApplyRestrictions(dailyRestrictions, hotelId, roomProductId);

      this.logger.log(`Successfully applied LOS automation for room product: ${roomProductCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to process automation for room product ${roomProductCode} (${roomProductId}): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Validates room product for automation processing
   */
  private validateRoomProductForAutomation(
    automationSetting: RestrictionAutomationSetting,
    roomProductCode: string,
    availabilityData: RoomProductDailyAvailability[],
    startDate: Date,
    endDate: Date
  ): boolean {
    if (!automationSetting?.isEnabled) {
      this.logger.warn(`Automation not enabled for room product ${roomProductCode}`);
      return false;
    }

    if (availabilityData && availabilityData.length === 0) {
      this.logger.warn(
        `No availability data found for date range ${format(startDate, DATE_FORMAT)} to ${format(endDate, DATE_FORMAT)}`
      );
      return false;
    }

    return true;
  }

  /**
   * Calculates daily restrictions based on room unit availability
   */
  private calculateDailyRestrictionsFromUnits(
    assignedUnits: RoomUnit[],
    roomProductRestrictions: Restriction[],
    roomProductId: string,
    hotelId: string,
    startDate: Date,
    endDate: Date,
    automationSetting: RestrictionAutomationSetting
  ): RoomProductRestriction[] {
    const maxLosForRooms = this.calculateMaxLosForRooms(
      assignedUnits,
      roomProductRestrictions,
      roomProductId
    );

    const dateRanges = Helper.generateDateRange(
      format(startDate, DATE_FORMAT),
      format(endDate, DATE_FORMAT)
    );

    return dateRanges.map((currentDate) => {
      const manualMinLength = this.findManualRestrictionWithHighestMinLength(
        roomProductRestrictions,
        currentDate
      );

      const maxLos = maxLosForRooms.find((maxLos) => maxLos.date === currentDate)?.maxLos;

      // Calculate LOS restrictions for this specific date based on automation mode
      const { minLength, maxLength, restrictionSource } = this.calculateLosForDate(
        automationSetting,
        manualMinLength?.minLength ?? undefined,
        maxLos
      );

      return {
        roomProductId,
        hotelId,
        fromDate: currentDate,
        toDate: currentDate,
        minLength: manualMinLength?.minLength ?? minLength ?? undefined,
        maxLength: maxLength === 0 ? 1 : maxLength,
        restrictionSource
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

  /**
   * Creates restriction DTOs and applies them via bulk operation
   */
  private async createAndApplyRestrictions(
    dailyRestrictions: RoomProductRestriction[],
    hotelId: string,
    roomProductId: string
  ): Promise<void> {
    const createRestrictionDtos: any[] = dailyRestrictions.map((restriction) => {
      const minLength = Number.isFinite(restriction.minLength) ? restriction.minLength : null;
      const maxLength = Number.isFinite(restriction.maxLength) ? restriction.maxLength : null;

      return {
        hotelId,
        type: RestrictionConditionType.ClosedToArrival,
        weekdays: Object.values(Weekday),
        fromDate: restriction.fromDate,
        toDate: restriction.toDate,
        minLength,
        maxLength,
        roomProductIds: [roomProductId],
        ratePlanIds: undefined,
        metadata: undefined,
        restrictionSource: restriction.restrictionSource
      };
    });

    await this.restrictionService.handleBulkRestrictionOperation({
      restrictionsToAdd: createRestrictionDtos
    });
  }

  private async getRoomUnitAvailabilities(
    roomProductIds: string[],
    startDate: string,
    endDate: string
  ): Promise<Map<string, RoomUnit[]>> {
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpa')
      .leftJoinAndSelect('rpa.roomUnit', 'ru')
      .leftJoinAndSelect('ru.roomUnitAvailabilities', 'rua')
      .select('rpa.roomProductId')
      .addSelect('ru.id')
      .addSelect('ru.roomNumber')
      .addSelect('rua.date')
      .addSelect('rua.status')
      .where('rpa.roomProductId IN (:...roomProductIds)', { roomProductIds })
      .andWhere('rua.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('rua.date', 'ASC')
      .getMany();

    const roomProductMap = new Map<string, RoomUnit[]>();

    for (const rpa of roomProductAssignedUnits) {
      if (!roomProductMap.has(rpa.roomProductId)) {
        roomProductMap.set(rpa.roomProductId, []);
      }
      roomProductMap.get(rpa.roomProductId)!.push(rpa.roomUnit);
    }

    return roomProductMap;
  }

  calculateMaxLosForRooms(
    rooms: RoomUnit[],
    roomProductRestrictions: Restriction[],
    roomProductId: string
  ) {
    // find CTS restrictions
    const ctsRestrictionsByDate = roomProductRestrictions.filter(
      (restriction) =>
        restriction.type === RestrictionConditionType.ClosedToStay &&
        !this.hasRestrictionExceptions(restriction)
    );

    // if have CTS restriction in that date, it mean sold out, so we should not calculate los for this date

    const uniqueDates = [
      ...new Set(rooms.flatMap((r) => r.roomUnitAvailabilities.map((a) => a.date)))
    ].sort();

    const totalDays = uniqueDates.length;
    const maxLosPerDay = new Array(totalDays).fill(0);
    const dateIndexMap = new Map(uniqueDates.map((d, i) => [d, i]));

    for (const room of rooms) {
      // Build boolean availability array directly using dateIndexMap
      const availabilityArray = new Array(totalDays).fill(false);
      for (const a of room.roomUnitAvailabilities) {
        const idx = dateIndexMap.get(a.date);
        if (idx !== undefined && a.status === RoomUnitAvailabilityStatus.AVAILABLE) {
          availabilityArray[idx] = true;
        }
      }

      // Apply CTS restrictions - if CTS restriction applies to a date, mark it as unavailable
      for (let i = 0; i < totalDays; i++) {
        const currentDate = uniqueDates[i];
        if (this.isCtsRestrictionApplicable(currentDate, ctsRestrictionsByDate, roomProductId)) {
          availabilityArray[i] = false; // CTS restriction means NO AVAILABILITY
        }
      }

      // Detect consecutive available streaks
      let start: number | null = null;
      for (let i = 0; i <= totalDays; i++) {
        const isAvailable = i < totalDays && availabilityArray[i];
        if (isAvailable && start === null) start = i;

        if ((!isAvailable || i === totalDays) && start !== null) {
          const end = i - 1;
          const streakLength = end - start + 1;
          for (let j = 0; j < streakLength; j++) {
            const dayIndex = start + j;
            const remaining = streakLength - j;
            if (remaining > maxLosPerDay[dayIndex]) {
              maxLosPerDay[dayIndex] = remaining;
            }
          }
          start = null;
        }
      }
    }

    const a = uniqueDates.map((date, i) => ({
      date,
      maxLos: maxLosPerDay[i]
    }));

    return a;
  }

  /**
   * Check if a CTS (Closed To Stay) restriction applies to a specific date and room product
   */
  private isCtsRestrictionApplicable(
    date: string,
    ctsRestrictions: Restriction[],
    roomProductId?: string
  ): boolean {
    const checkDate = new Date(date);
    const weekdayName = format(checkDate, 'EEEE').toLowerCase() as Weekday;

    return ctsRestrictions.some((restriction) => {
      // Check if restriction applies to this room product
      if (roomProductId && restriction.roomProductIds && restriction.roomProductIds.length > 0) {
        if (!restriction.roomProductIds.includes(roomProductId)) {
          return false;
        }
      }

      // Check if date is within restriction date range
      if (restriction.fromDate && restriction.toDate) {
        const restrictionStart = startOfDay(restriction.fromDate);
        const restrictionEnd = endOfDay(restriction.toDate);

        if (!isWithinInterval(checkDate, { start: restrictionStart, end: restrictionEnd })) {
          return false;
        }
      }

      // Check if weekday restriction applies
      if (restriction.weekdays && restriction.weekdays.length > 0) {
        if (!restriction.weekdays.includes(weekdayName)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get active room products with their automation settings
   * Optimized for performance using lookup maps
   */
  private async getActiveRoomProductsWithAutomation(
    hotelId: string,
    roomProductIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    const [roomProducts, roomProductRestrictions, availabilityData] = await Promise.all([
      this.roomProductRepository.find({
        where: {
          hotelId,
          id: In(roomProductIds),
          status: RoomProductStatus.ACTIVE,
          deletedAt: IsNull()
        },
        select: {
          id: true,
          code: true,
          hotelId: true,
          status: true
        }
      }),

      this.getRoomProductRestrictions(roomProductIds, hotelId, startDate, endDate),

      // get room product availability data
      this.getRoomProductAvailabilityData(roomProductIds, hotelId, startDate, endDate)
    ]);

    // ---- ✅ Create lookup maps for O(1) access ----

    const restrictionMap = new Map<string, Restriction[]>();
    for (const restriction of roomProductRestrictions) {
      for (const rpId of restriction.roomProductIds ?? []) {
        if (!restrictionMap.has(rpId)) {
          restrictionMap.set(rpId, []);
        }
        restrictionMap.get(rpId)!.push(restriction);
      }
    }

    const availabilityMap = new Map<string, RoomProductDailyAvailability[]>();
    for (const avail of availabilityData) {
      const key = avail.roomProductId;
      if (!availabilityMap.has(key)) {
        availabilityMap.set(key, []);
      }
      availabilityMap.get(key)!.push(avail);
    }

    // ---- ✅ Merge results using lookup maps ----
    return roomProducts.map((roomProduct) => ({
      ...roomProduct,
      roomProductRestrictions: restrictionMap.get(roomProduct.id) ?? [],
      roomProductDailyAvailabilities: availabilityMap.get(roomProduct.id) ?? []
    }));
  }

  private async getRoomProductRestrictions(
    roomProductIds: string[],
    hotelId: string,
    startDate: Date,
    endDate: Date
  ) {
    // get room product restriction
    return this.restrictionRepository
      .createQueryBuilder('r')
      .select('r.fromDate', 'fromDate')
      .addSelect('r.toDate', 'toDate')
      .addSelect('r.minLength', 'minLength')
      .addSelect('r.maxLength', 'maxLength')
      .addSelect('r.type', 'type')
      .addSelect('r.restrictionSource', 'restrictionSource')
      .addSelect('r.roomProductIds', 'roomProductIds')
      .where('r.roomProductIds && :roomProductIds', { roomProductIds: roomProductIds })
      .andWhere('r.ratePlanIds IS NULL')
      .andWhere('r.hotelId = :hotelId', { hotelId })
      .andWhere('r.fromDate >= :startDate', { startDate })
      .andWhere('r.toDate <= :endDate', { endDate })
      .getRawMany();
  }

  /**
   * Get room product availability data for the date range
   */
  private async getRoomProductAvailabilityData(
    roomProductIds: string[],
    hotelId: string,
    startDate: Date,
    endDate: Date
  ) {
    const query = await this.roomProductDailyAvailabilityRepository
      .createQueryBuilder('ra')
      .select('ra.date', 'date')
      .addSelect('ra.available', 'available')
      .addSelect('ra.adjustment', 'adjustment')
      .addSelect('ra.sellLimit', 'sellLimit')
      .addSelect('ra.roomProductId', 'roomProductId')
      .addSelect('ra.sold', 'sold')
      .where('ra.roomProductId IN (:...roomProductIds)', { roomProductIds })
      .andWhere('ra.hotelId = :hotelId', { hotelId })
      .andWhere('ra.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawMany();

    return query;
  }

  /**
   * Calculate LOS restrictions for a specific date based on remaining consecutive availability
   * Follows the automation logic from automate-los.guide.md
   * for CTS, it mean sold out, so we should not calculate los for this date
   */
  private calculateLosForDate(
    automationSetting: RestrictionAutomationSetting,
    manualMinLength: number | undefined,
    maxLos: number
  ): {
    minLength: number | undefined;
    maxLength: number | undefined;
    restrictionSource: RestrictionSourceMap;
  } {
    const mode = automationSetting.settings.gapMode || GapModeEnum.DEFAULT;
    const restrictionSource: RestrictionSourceMap = {};

    // get default min los from automation setting
    const defaultMin = automationSetting?.settings?.minLOS ?? undefined;
    // get decreasing max los, base on max los from calculate
    const decreasingMax = Math.max(1, maxLos);

    let minLength: number | undefined;
    let maxLength: number | undefined;

    // === FLEXIBLE MODE (DYNAMIC_FILL / FILLING) ===
    if (mode === GapModeEnum.FILLING) {
      // if have default min
      if (defaultMin !== undefined) {
        // Check if this is a manual restriction that should never be override
        const isManualRestriction = manualMinLength !== undefined;

        // check if have is manual restriction
        if (isManualRestriction) {
          minLength = manualMinLength; // do not override manual min
          maxLength = decreasingMax;
          restrictionSource.minLength = RestrictionSourceType.MANUAL;
          restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
        } else {
          // if default min is greater than max los => min = max
          if (defaultMin >= maxLos) {
            minLength = maxLos;
            maxLength = maxLos;
            restrictionSource.minLength = RestrictionSourceType.AUTOMATED;
            restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
          } else {
            // if default min is less than max los => min = default min
            minLength = defaultMin;
            maxLength = decreasingMax;
            restrictionSource.minLength = RestrictionSourceType.DEFAULT;
            restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
          }
        }
      } else {
        // no defaultMin → min undefined, max decreases
        minLength = undefined;
        maxLength = decreasingMax;
        restrictionSource.minLength = undefined;
        restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
      }
    }

    // === MAXIMIZE MODE (FULL_GAP / MAXIMUM) ===
    else if (mode === GapModeEnum.MAXIMUM) {
      // if have default min
      if (defaultMin !== undefined) {
        // Check if this is a manual restriction that should never be override
        const isManualRestriction = manualMinLength !== undefined;

        // check if have is manual restriction
        if (isManualRestriction) {
          minLength = manualMinLength; // do not override manual min
          maxLength = decreasingMax;
          restrictionSource.minLength = RestrictionSourceType.MANUAL;
          restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
        } else {
          // Manual restrictions should NEVER be reduced, even if > gapSize
          minLength = defaultMin; // Keep manual min fixed
          maxLength = decreasingMax; // Max still decreases normally
          restrictionSource.minLength = RestrictionSourceType.DEFAULT;
          restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
        }
      } else {
        // No default min
        minLength = undefined;
        maxLength = decreasingMax;
        restrictionSource.minLength = undefined;
        restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
      }
    }

    // === fallback to default ===
    else {
      minLength = manualMinLength !== undefined ? manualMinLength : defaultMin;
      maxLength = decreasingMax;
      restrictionSource.minLength =
        manualMinLength !== undefined
          ? RestrictionSourceType.MANUAL
          : defaultMin !== undefined
            ? RestrictionSourceType.DEFAULT
            : undefined;
      restrictionSource.maxLength = RestrictionSourceType.AUTOMATED;
    }

    return { minLength, maxLength, restrictionSource };
  }

  findManualRestrictionWithHighestMinLength(
    roomProductRestrictions: Restriction[],
    date: string
  ): Restriction | undefined {
    if (!roomProductRestrictions?.length) return undefined;

    // find all restrictions covering this date
    const applicableRestrictions =
      roomProductRestrictions.filter(
        (restriction) =>
          isWithinInterval(new Date(date), {
            start: startOfDay(restriction.fromDate),
            end: endOfDay(restriction.toDate)
          }) &&
          restriction.restrictionSource?.minLength &&
          restriction.restrictionSource?.minLength === RestrictionSourceType.MANUAL
      ) ?? [];

    if (!applicableRestrictions.length) return undefined;

    // 🔹 Step 1: find manual restriction with minLength
    const manualRestrictions = applicableRestrictions.filter(
      (r) => r.restrictionSource && r.restrictionSource?.minLength === RestrictionSourceType.MANUAL
    );

    if (manualRestrictions.length > 0) {
      // return the manual one with the highest minLength
      return manualRestrictions.reduce((max, restriction) =>
        restriction.minLength > (max?.minLength ?? 0) ? restriction : max
      );
    }

    // 🔹 Step 2: fallback to highest minLength among all
    return undefined;
  }

  /**
   * Check cache for room product IDs and set cache for processable ones
   * @param hotelId Hotel ID
   * @param roomProductIds Array of room product IDs to check
   * @returns Object containing processable and cached room product IDs
   */
  private async checkAndSetRoomProductCache(hotelId: string, roomProductIds: string[]) {
    const processableRoomProductIds: string[] = [];
    const cachedRoomProductIds: string[] = [];

    for (const roomProductId of roomProductIds) {
      const cacheKey = this.getRoomProductCacheKey(hotelId, roomProductId);

      try {
        const cachedValue = await this.redisService.get(cacheKey);

        if (cachedValue) {
          // Room product is already being processed or recently processed
          cachedRoomProductIds.push(roomProductId);
          this.logger.log(`Room product ${roomProductId} is cached, skipping processing`);
        } else {
          // Set cache with 1 minute TTL to prevent concurrent processing
          await this.redisService.set(cacheKey, 'processing', 60);
          processableRoomProductIds.push(roomProductId);
          this.logger.log(`Room product ${roomProductId} cached for processing`);
        }
      } catch (error) {
        // If Redis fails, allow processing to continue
        this.logger.warn(
          `Redis cache check failed for room product ${roomProductId}: ${error.message}`
        );
        processableRoomProductIds.push(roomProductId);
      }
    }

    return {
      processableRoomProductIds,
      cachedRoomProductIds
    };
  }

  /**
   * Clear cache for specific room product IDs
   * @param hotelId Hotel ID
   * @param roomProductIds Array of room product IDs to clear from cache
   */
  private async clearRoomProductCache(hotelId: string, roomProductIds: string[]) {
    for (const roomProductId of roomProductIds) {
      const cacheKey = this.getRoomProductCacheKey(hotelId, roomProductId);

      try {
        await this.redisService.delete(cacheKey);
        this.logger.log(`Cleared cache for room product ${roomProductId}`);
      } catch (error) {
        this.logger.warn(
          `Failed to clear cache for room product ${roomProductId}: ${error.message}`
        );
      }
    }
  }

  /**
   * Generate Redis cache key for room product automation
   * @param hotelId Hotel ID
   * @param roomProductId Room product ID
   * @returns Redis cache key
   */
  private getRoomProductCacheKey(hotelId: string, roomProductId: string): string {
    return `automate_los:hotel_${hotelId}:room_product_${roomProductId}`;
  }
}
