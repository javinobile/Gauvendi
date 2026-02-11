import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { ApaleoRatePlanPmsMapping } from '@src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import {
  Reservation,
  ReservationStatusEnum
} from '@src/core/entities/booking-entities/reservation.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCancellationPolicy } from '@src/core/entities/hotel-entities/hotel-cancellation-policy.entity';
import {
  HotelConfiguration,
  HotelPricingDecimalRoundingRuleConfigValue
} from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanTranslation } from '@src/core/entities/pricing-entities/rate-plan-translation.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductBasePriceSetting } from '@src/core/entities/room-product-base-price-setting.entity';
import { RoomProductDailySellingPrice } from '@src/core/entities/room-product-daily-selling-price.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductPricingMethodDetail } from '@src/core/entities/room-product-pricing-method-detail.entity';
import { RoomProductRatePlanAvailabilityAdjustment } from '@src/core/entities/room-product-rate-plan-availability-adjustment.entity';
import { RoomProductRatePlan } from '@src/core/entities/room-product-rate-plan.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  DayOfWeekJs,
  DistributionChannel,
  FEWeekdayToWeekday,
  HotelConfigurationTypeEnum,
  RatePlanAdjustmentType,
  RatePlanExtraServiceType,
  RatePlanPricingMethodologyEnum,
  RatePlanStatusEnum,
  RoomProductPricingMethodEnum,
  RoomProductStatus,
  RoomProductType,
  RoomUnitAvailabilityStatus,
  RoundingModeEnum,
  TaxSettingEnum
} from '@src/core/enums/common';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { RatePlanUtils } from '@src/core/helper/rate-plan.utils';
import {
  PricingCalculateResult,
  PricingCalculateService,
  RoomProductDailySellingPriceCalculatedDto
} from '@src/core/modules/pricing-calculate/pricing-calculate.service';
import { RoomProductPricingService } from '@src/core/modules/pricing-calculate/room-product-pricing/room-product-pricing.service';
import { RedisTaskContext, RedisTaskNamespace, RedisTaskService } from '@src/core/redis';
import {
  PushToPmsTaskData,
  PushToPmsTaskKeyComponents
} from '@src/core/redis/redis-task.interface';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { FeaturePricingService } from '@src/modules/feature-pricing/feature-pricing.service';
import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
  subDays
} from 'date-fns';
import Decimal from 'decimal.js';
import { groupBy } from 'lodash';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  In,
  IsNull,
  MoreThanOrEqual,
  Raw,
  Repository
} from 'typeorm';
import { RoomUnitAvailability } from '../../core/entities/availability-entities/room-unit-availability.entity';
import { RoomProductStandardFeature } from '../../core/entities/room-product-standard-feature.entity';
import { DailyRatePlanSellabilityDto } from '../rate-plan-sellability/dtos/daily-rate-plan-sellability.dto';
import { RatePlanSellabilityService } from '../rate-plan-sellability/services/rate-plan-sellability.service';
import { SalesPlanSearchTypeEnum } from '../rate-plan/enums';
import { RoomProductPricingMethodDetailService } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan/room-product-rate-plan.repository';
import {
  ApaleoRatePlanPmsMappingBulkInput,
  ApaleoRatePlanPmsMappingListFilter,
  ApaleoRoomProductRatePlanPmsMappingBulkInput,
  DailyOccPaceTrendResponseDto,
  DailyPropertyAdrListResponseDto,
  DailyPropertyPickupAdrListResponseDto,
  DailyRatePlanAdjustmentListFilter,
  DailySalesPlanPricingBreakdownFilter,
  DailyTrendDto,
  ExtranetRatePlanFilter,
  RatePlanProductsToSellDailyDto,
  RatePlanProductsToSellDailyFilterDto,
  RoomProductDailyRateDetailsFilter,
  RoomProductDailyRateListFilter,
  SetLowestSellingPriceDto
} from './rate-plans.dto';

type RoomProductId = string;
type RatePlanId = string;
type DateString = string;
type RoomProductRatePlanId = string;

@Injectable()
export class RatePlansService {
  private readonly logger = new Logger(RatePlansService.name);

  constructor(
    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,
    @InjectRepository(RoomProductRatePlan, DbName.Postgres)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,
    @InjectRepository(HotelCancellationPolicy, DbName.Postgres)
    private readonly hotelCancellationPolicyRepository: Repository<HotelCancellationPolicy>,
    @InjectRepository(HotelPaymentTerm, DbName.Postgres)
    private readonly hotelPaymentTermRepository: Repository<HotelPaymentTerm>,
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(RoomProductDailySellingPrice, DbName.Postgres)
    private readonly roomProductDailySellingPriceRepository: Repository<RoomProductDailySellingPrice>,
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,
    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,
    @InjectRepository(RoomProductDailyAvailability, DbName.Postgres)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,
    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,
    @InjectRepository(RoomProductStandardFeature, DbName.Postgres)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,
    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,
    @InjectRepository(RoomProductRatePlanAvailabilityAdjustment, DbName.Postgres)
    private readonly roomProductRatePlanAvailabilityAdjustmentRepository: Repository<RoomProductRatePlanAvailabilityAdjustment>,
    @InjectRepository(RoomProductPricingMethodDetail, DbName.Postgres)
    private readonly roomProductPricingMethodDetailRepository: Repository<RoomProductPricingMethodDetail>,
    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,
    @InjectRepository(RatePlanTranslation, DbName.Postgres)
    private readonly ratePlanTranslationRepository: Repository<RatePlanTranslation>,

    @InjectRepository(HotelTaxSetting, DbName.Postgres)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>,

    @InjectRepository(RatePlanDailyAdjustment, DbName.Postgres)
    private readonly ratePlanDailyAdjustmentRepository: Repository<RatePlanDailyAdjustment>,

    @InjectRepository(RatePlanExtraService, DbName.Postgres)
    private readonly ratePlanExtraServiceRepository: Repository<RatePlanExtraService>,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigRepository: Repository<HotelConfiguration>,

    @InjectRepository(RatePlanPaymentTermSetting, DbName.Postgres)
    private readonly ratePlanPaymentTermSettingRepository: Repository<RatePlanPaymentTermSetting>,

    @InjectRepository(ApaleoRatePlanPmsMapping, DbName.Postgres)
    private readonly apaleoRatePlanPmsMappingRepository: Repository<ApaleoRatePlanPmsMapping>,

    @InjectRepository(RoomProductBasePriceSetting, DbName.Postgres)
    private readonly roomProductBasePriceSettingRepository: Repository<RoomProductBasePriceSetting>,

    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,
    // another service

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly roomProductRatePlanRepositoryCustom: RoomProductRatePlanRepository,
    private readonly pricingCalculateService: PricingCalculateService,
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService,
    private readonly ratePlanSellabilityService: RatePlanSellabilityService,
    private readonly roomProductPricingService: RoomProductPricingService,
    private readonly redisTaskService: RedisTaskService,
    private readonly featurePricingService: FeaturePricingService
  ) {}

  private _applyRoundingWithFallback(
    value: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number
  ): number {
    // If NO_ROUNDING is specified, use HALF_UP as fallback to ensure decimal places are respected
    const effectiveRoundingMode =
      roundingMode === RoundingModeEnum.NO_ROUNDING ? RoundingModeEnum.HALF_UP : roundingMode;

    return DecimalRoundingHelper.applyRounding(value, effectiveRoundingMode, decimalPlaces);
  }

  private async _getHotelConfigRoundingMode(
    hotelId: string
  ): Promise<{ roundingMode: RoundingModeEnum; decimalPlaces: number }> {
    let defaultConfig = {
      roundingMode: RoundingModeEnum.NO_ROUNDING,
      decimalPlaces: 2
    };

    const config = await this.hotelConfigRepository.findOne({
      where: { hotelId, configType: HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE }
    });

    if (config) {
      defaultConfig = {
        roundingMode: config.configValue?.roundingMode || RoundingModeEnum.NO_ROUNDING,
        decimalPlaces: config.configValue?.decimalPlaces || 2
      };
    }
    return defaultConfig;
  }

  async getDailyPropertyAdrList(payload: DailyTrendDto) {
    try {
      const { hotelId, fromDate, toDate } = payload;

      // Init data
      const responseData: DailyPropertyAdrListResponseDto[] = eachDayOfInterval({
        start: new Date(fromDate),
        end: new Date(toDate)
      }).map((date) => ({
        propertyId: hotelId,
        date: format(date, DATE_FORMAT),
        adr: 0
      }));

      // Get reservation list
      const allReservations = await this.reservationRepository.find({
        where: {
          hotelId,
          status: In([
            ReservationStatusEnum.COMPLETED,
            ReservationStatusEnum.CONFIRMED,
            ReservationStatusEnum.RESERVED
          ]),
          arrival: Between(startOfDay(new Date(fromDate)), endOfDay(new Date(toDate))),
          deletedAt: IsNull()
        },
        relations: ['reservationTimeSlices'],
        order: {
          arrival: 'DESC'
        }
      });

      // Prepare data before populating
      const startRange = new Date(fromDate);
      const endRange = new Date(toDate);

      allReservations.forEach((res) => {
        if (res.reservationTimeSlices?.length > 0) {
          res.reservationTimeSlices = res.reservationTimeSlices.filter((ts) => {
            if (!ts.fromTime) return false;
            const tsDate = new Date(ts.fromTime);
            return tsDate >= startOfDay(startRange) && tsDate <= endOfDay(endRange);
          });
        }
      });

      const filteredReservations = allReservations.filter(
        (res) => res.reservationTimeSlices?.length > 0
      );

      if (filteredReservations.length === 0) {
        this.logger.log('No reservations found for hotelId: ' + hotelId);
        return responseData;
      }

      const roundingConfig = await this._getHotelConfigRoundingMode(hotelId);

      const groupedReservationArrivalDate = groupBy(
        filteredReservations.map((e) => {
          if (e?.arrival) {
            return { ...e, arrival: format(new Date(e.arrival), DATE_FORMAT) };
          }
          return e;
        }),
        'arrival'
      );

      for (const item of responseData) {
        const itemDate = new Date(item.date);

        // Filter reservations that stay on this date
        const reservationListPerDate = groupedReservationArrivalDate[item.date];

        if (reservationListPerDate.length > 0) {
          const slicesOnDate = reservationListPerDate.flatMap((res) =>
            (res.reservationTimeSlices || []).filter(
              (ts) => ts.fromTime && isSameDay(new Date(ts.fromTime), itemDate)
            )
          );

          const roomOnlyAmountPresent = slicesOnDate.reduce(
            (sum, ts) => sum.plus(ts.totalBaseAmount || 0),
            new Decimal(0)
          );
          const roomNightSold = slicesOnDate.length;
          const adrPresentRaw = roomOnlyAmountPresent.div(roomNightSold).toNumber();
          const adrPresent = this._applyRoundingWithFallback(
            adrPresentRaw,
            roundingConfig.roundingMode,
            roundingConfig.decimalPlaces
          );

          // Set data
          item.adr = adrPresent || 0;
        }
      }

      return responseData;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('getDailyPropertyAdrList error: ' + error.message);
    }
  }

  async getDailyPropertyPickupAdrList(payload: DailyTrendDto) {
    try {
      const { hotelId, fromDate, toDate } = payload;

      // Init data:
      const responseData: DailyPropertyPickupAdrListResponseDto[] = eachDayOfInterval({
        start: new Date(fromDate),
        end: new Date(toDate)
      }).map((date) => ({
        propertyId: hotelId,
        date: format(date, DATE_FORMAT),
        adr: 0,
        percentageDifference: 0
      }));

      // Get reservation list
      const allReservations = await this.reservationRepository.find({
        where: {
          hotelId,
          status: In([
            ReservationStatusEnum.COMPLETED,
            ReservationStatusEnum.CONFIRMED,
            ReservationStatusEnum.RESERVED
          ]),
          arrival: Between(startOfDay(new Date(fromDate)), endOfDay(new Date(toDate))),
          deletedAt: IsNull()
        },
        relations: ['reservationTimeSlices'],
        order: {
          arrival: 'DESC'
        }
      });

      if (allReservations?.length === 0) {
        this.logger.log('No reservations found for hotelId: ' + hotelId);
        return responseData;
      }

      // Prepare data before populating
      const startRange = new Date(fromDate);
      const endRange = new Date(toDate);

      allReservations.forEach((res) => {
        if (res.reservationTimeSlices?.length > 0) {
          res.reservationTimeSlices = res.reservationTimeSlices.filter((ts) => {
            if (!ts.fromTime) return false;
            const tsDate = new Date(ts.fromTime);
            return tsDate >= startOfDay(startRange) && tsDate <= endOfDay(endRange);
          });
        }
      });

      const filteredReservations = allReservations.filter(
        (res) => res.reservationTimeSlices?.length > 0
      );

      if (filteredReservations.length === 0) {
        this.logger.log('No reservations found for hotelId: ' + hotelId);
        return responseData;
      }

      // Populate data
      const pastDate = subDays(new Date(), 7); // Default to 7 days snapshot
      const roundingConfig = await this._getHotelConfigRoundingMode(hotelId);
      const groupedReservationArrivalDate = groupBy(
        filteredReservations.map((e) => {
          if (e?.arrival) {
            return { ...e, arrival: format(new Date(e.arrival), DATE_FORMAT) };
          }

          return e;
        }),
        'arrival'
      );

      for (const item of responseData) {
        const itemDate = new Date(item.date);

        // Filter reservations that stay on this date
        const reservationListPerDate = groupedReservationArrivalDate[item.date];

        if (reservationListPerDate.length > 0) {
          const slicesOnDate = reservationListPerDate.flatMap((res) =>
            (res.reservationTimeSlices || []).filter(
              (ts) => ts.fromTime && isSameDay(new Date(ts.fromTime), itemDate)
            )
          );

          if (slicesOnDate.length > 0) {
            const roomOnlyAmountPresent = slicesOnDate.reduce(
              (sum, ts) => sum.plus(ts.totalBaseAmount || 0),
              new Decimal(0)
            );
            const roomNightSold = slicesOnDate.length;

            const adrPresentRaw = roomOnlyAmountPresent.div(roomNightSold).toNumber();
            const adrPresent = this._applyRoundingWithFallback(
              adrPresentRaw,
              roundingConfig.roundingMode,
              roundingConfig.decimalPlaces
            );

            // Calculate ADR Past
            const reservationListPastDate = reservationListPerDate.filter((res) => {
              const bookingDate = res.bookingDate ? new Date(res.bookingDate) : null;
              return bookingDate && bookingDate <= pastDate;
            });

            const slicesPastOnDate = reservationListPastDate.flatMap((res) =>
              (res.reservationTimeSlices || []).filter(
                (ts) => ts.fromTime && isSameDay(new Date(ts.fromTime), itemDate)
              )
            );

            let adrPast = 0;
            if (slicesPastOnDate.length > 0) {
              const roomOnlyAmountPast = slicesPastOnDate.reduce(
                (sum, ts) => sum.plus(ts.totalBaseAmount || 0),
                new Decimal(0)
              );
              const roomNightSoldPast = slicesPastOnDate.length;

              const adrPastRaw = roomOnlyAmountPast.div(roomNightSoldPast).toNumber();
              adrPast = this._applyRoundingWithFallback(
                adrPastRaw,
                roundingConfig.roundingMode,
                roundingConfig.decimalPlaces
              );
            }

            // Set data
            item.adr = new Decimal(adrPresent).minus(adrPast).toNumber();

            if (adrPast > 0) {
              item.percentageDifference = new Decimal(adrPresent)
                .div(adrPast)
                .minus(1)
                .mul(100)
                .toNumber();
            } else {
              item.percentageDifference = 100;
            }
          }
        }
      }

      return responseData;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('getDailyPropertyPickupAdrList error: ' + error.message);
    }
  }

  async getDailyPropertyPaceTrends(payload: DailyTrendDto) {
    try {
      const { hotelId, fromDate, toDate } = payload;

      // Init response data:
      const responseData: DailyOccPaceTrendResponseDto[] = eachDayOfInterval({
        start: new Date(fromDate),
        end: new Date(toDate)
      }).map((date) => ({
        propertyId: hotelId,
        date: format(date, DATE_FORMAT),
        paceTrend: 0
      }));

      // Get all reservations for the hotel in period:
      // Updated query to include overlapping stays and time slices
      const allReservations = await this.reservationRepository.find({
        where: {
          hotelId,
          status: In([
            ReservationStatusEnum.COMPLETED,
            ReservationStatusEnum.CONFIRMED,
            ReservationStatusEnum.RESERVED,
            ReservationStatusEnum.CANCELLED,
            ReservationStatusEnum.PAYMENT_FAILED
          ]),
          arrival: Between(startOfDay(new Date(fromDate)), endOfDay(new Date(toDate))),
          deletedAt: IsNull()
        },
        relations: ['reservationTimeSlices'],
        order: {
          arrival: 'DESC'
        }
      });

      if (allReservations?.length === 0) {
        this.logger.warn('No reservations found for the hotel: ' + hotelId);
        return responseData;
      }

      // Get room availability list
      // Refactored to use RoomProductMapping and filter by distribution channel
      const mappings = await this.roomProductMappingRepository.find({
        where: { hotelId },
        relations: ['roomProduct', 'relatedRoomProduct']
      });

      const validMappings = mappings.filter((m) => {
        const hasChannel = m.roomProduct?.distributionChannel?.some((c) =>
          [DistributionChannel.GV_SALES_ENGINE, DistributionChannel.GV_VOICE].includes(c)
        );
        const isActiveOrDraft = [RoomProductStatus.ACTIVE, RoomProductStatus.DRAFT].includes(
          m.relatedRoomProduct?.status
        );
        return hasChannel && isActiveOrDraft;
      });

      const roomProductIdList = [...new Set(validMappings.map((m) => m.relatedRoomProductId))];

      const roomProductRoomList =
        roomProductIdList.length > 0
          ? await this.roomProductAssignedUnitRepository.find({
              where: {
                roomProductId: In(roomProductIdList)
              }
            })
          : [];

      const roomIdList = roomProductRoomList.map((r) => r.roomUnitId).filter((id) => !!id);

      if (roomIdList?.length === 0) {
        this.logger.warn('No room units found for the hotel: ' + hotelId);
        return responseData;
      }

      // Get roomAvailability:
      // SalesPlanCockpitServiceImpl.java 1042:
      const roomAvailabilityList = await this.roomUnitAvailabilityRepository.find({
        where: {
          hotelId,
          roomUnitId: In(roomIdList),
          date: Raw((alias) => `${alias} >= :fromDate AND ${alias} < :toDate`, {
            fromDate: format(fromDate, DATE_FORMAT),
            toDate: format(addDays(toDate, 1), DATE_FORMAT)
          }),
          status: In([
            RoomUnitAvailabilityStatus.AVAILABLE,
            RoomUnitAvailabilityStatus.ASSIGNED,
            RoomUnitAvailabilityStatus.BLOCKED,
            RoomUnitAvailabilityStatus.OUT_OF_ORDER
          ])
        }
      });

      if (roomAvailabilityList?.length === 0) {
        return responseData;
      }

      // Populate data
      const pastDate = subDays(new Date(), 7); // Following 7-day trend analysis standard

      const groupedReservationArrivalDate = groupBy(
        allReservations.map((e) => {
          if (e?.arrival) {
            return { ...e, arrival: format(new Date(e.arrival), DATE_FORMAT) };
          }

          return e;
        }),
        'arrival'
      );

      for (const item of responseData) {
        const itemDate = new Date(item.date);

        // Filter reservations that stay on this date
        const reservationListPerDate = groupedReservationArrivalDate[item.date];

        const roomAvailabilityListPerDate = roomAvailabilityList.filter(
          (ra) => ra.date === item.date
        );

        if (reservationListPerDate.length > 0 && roomAvailabilityListPerDate.length > 0) {
          // Calculate occupancy present
          const roomSoldPresent = reservationListPerDate.reduce((count, res) => {
            if (
              [
                ReservationStatusEnum.CONFIRMED,
                ReservationStatusEnum.RESERVED,
                ReservationStatusEnum.COMPLETED
              ].includes(res.status)
            ) {
              const slicesOnDate =
                res.reservationTimeSlices?.filter(
                  (ts) => ts.fromTime && isSameDay(new Date(ts.fromTime), itemDate)
                ) || [];
              return count + slicesOnDate.length;
            }
            return count;
          }, 0);

          const occupancyPresentDate = new Decimal(roomSoldPresent).div(
            roomAvailabilityListPerDate.length
          );

          // Calculate occupancy past
          const roomSoldPast = reservationListPerDate.reduce((count, res) => {
            const bookingDate = res.bookingDate ? new Date(res.bookingDate) : null;
            if (!bookingDate || bookingDate > pastDate) return count;

            if (
              [
                ReservationStatusEnum.CONFIRMED,
                ReservationStatusEnum.RESERVED,
                ReservationStatusEnum.COMPLETED
              ].includes(res.status)
            ) {
              const slicesOnDate =
                res.reservationTimeSlices?.filter(
                  (ts) => ts.fromTime && isSameDay(new Date(ts.fromTime), itemDate)
                ) || [];
              return count + slicesOnDate.length;
            }

            if (
              [ReservationStatusEnum.CANCELLED, ReservationStatusEnum.PAYMENT_FAILED].includes(
                res.status
              )
            ) {
              const cancelledDateValue = res.cancelledDate ? new Date(res.cancelledDate) : null;
              if (cancelledDateValue && cancelledDateValue > pastDate) {
                const slicesOnDate =
                  res.reservationTimeSlices?.filter(
                    (ts) => ts.fromTime && isSameDay(new Date(ts.fromTime), itemDate)
                  ) || [];
                return count + slicesOnDate.length;
              }
            }
            return count;
          }, 0);

          const occupancyPastDate = new Decimal(roomSoldPast).div(
            roomAvailabilityListPerDate.length
          );

          // Set data
          item.paceTrend = occupancyPresentDate.minus(occupancyPastDate).mul(100).toNumber();
        }
      }

      return responseData;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('getDailyPropertyPaceTrends error: ' + error.message);
    }
  }

  async migrateRatePlanTranslation() {
    try {
      const allTranslations = await this.ratePlanTranslationRepository.find();

      // group by ratePlanId
      const translationsByRatePlanId = allTranslations.reduce((acc, translation) => {
        acc[translation.ratePlanId] = acc[translation.ratePlanId] || [];
        acc[translation.ratePlanId].push(translation);
        return acc;
      }, {});

      // bulk update ratePlan:
      const updatePromises: Promise<any>[] = [];
      let migratedCount = 0;

      for (const [ratePlanId, translations] of Object.entries(translationsByRatePlanId)) {
        // Transform RatePlanTranslation entities to Translation interface format
        const translationsArray = (translations as RatePlanTranslation[])
          .map((translation) => ({
            languageCode: translation.languageCode as any,
            name: translation.name,
            description: translation.description
          }))
          .filter(
            (translation) =>
              // Only include translations that have actual content
              translation.name || translation.description
          );

        if (translationsArray.length > 0) {
          const updatePromise = this.ratePlanRepository
            .createQueryBuilder()
            .update(RatePlan)
            .set({ translations: translationsArray as any })
            .where('id = :id', { id: ratePlanId })
            .execute();

          updatePromises.push(updatePromise);
          migratedCount++;
        }
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      this.logger.log(`Successfully migrated translations for ${migratedCount} rate plans`);

      return {
        message: 'Rate plan translations migrated successfully',
        migratedCount: migratedCount,
        totalTranslationRecords: allTranslations.length
      };
    } catch (error) {
      this.logger.error('migrateRatePlanTranslation error: ' + error.message);
      throw new BadRequestException('migrateRatePlanTranslation error: ' + error.message);
    }
  }

  async getListWithExpand(filterDto: ExtranetRatePlanFilter) {
    const { hotelId, isSalesPlanManagementSearch } = filterDto;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    // Query HotelCancellationPolicy and HotelPaymentTerm separately
    const [hotelCancellationPolicies, hotelPaymentTerms] = await Promise.all([
      this.hotelCancellationPolicyRepository.find({ where: { hotelId } }),
      this.hotelPaymentTermRepository.find({ where: { hotelId } })
    ]);
    // level 1  // ratePlans
    const ratePlans = await this.ratePlanRepository.find({
      where: { hotelId },
      order: {
        isPrimary: 'DESC',
        name: 'ASC'
      },
      relations: ['baseSetting']
    });
    // level 2  // ratePlanPaymentTermSettings, ratePlanExtraServices, roomProductRatePlans
    const ratePlanIds = ratePlans.map((plan) => plan.id);
    const [ratePlanPaymentTermSettings, ratePlanExtraServices, roomProductRatePlans] =
      await Promise.all([
        this.ratePlanPaymentTermSettingRepository.find({
          where: { hotelId, ratePlanId: In(ratePlanIds) }
        }),
        this.ratePlanExtraServiceRepository.find({
          where: { ratePlanId: In(ratePlanIds) },
          relations: ['extra']
        }),
        this.roomProductRatePlanRepository.find({
          where: { ratePlanId: In(ratePlanIds) },
          relations: ['roomProduct'],
          select: {
            id: true,
            ratePlanId: true,
            roomProductId: true,
            roomProduct: {
              id: true,
              type: true
            }
          }
        })
      ]);
    const tree = isSalesPlanManagementSearch ? this.buildSalesPlanTree(ratePlans) : ratePlans;
    // apply filter here
    const filteredRatePlans = this.applyFilter(tree, filterDto);

    const transformedData =
      filteredRatePlans?.map((i) =>
        this.transformRatePlanForExpand(
          ratePlans,
          i,
          roomProductRatePlans,
          hotelCancellationPolicies,
          hotelPaymentTerms,
          ratePlanPaymentTermSettings,
          ratePlanExtraServices
        )
      ) || [];
    return transformedData;
  }

  private transformRatePlanForExpand(
    ratePlans: RatePlan[],
    ratePlan: RatePlan & { salesPlanFollowList: RatePlan[] },
    roomProductRatePlans: RoomProductRatePlan[],
    hotelCancellationPolicies: HotelCancellationPolicy[],
    hotelPaymentTerms: HotelPaymentTerm[],
    ratePlanPaymentTermSettings: RatePlanPaymentTermSetting[],
    ratePlanExtraServices: RatePlanExtraService[]
  ): any {
    const isDerived =
      ratePlan.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING;

    const isFollowDailyPaymentTerm = ratePlan.baseSetting?.followDailyPaymentTerm;
    let ratePlanPaymentTermSetting;
    if (isDerived && isFollowDailyPaymentTerm) {
      const parentRatePlan = ratePlans?.find(
        (r) => r.id === ratePlan.baseSetting?.derivedRatePlanId
      );

      ratePlanPaymentTermSetting = ratePlanPaymentTermSettings?.find(
        (setting) => setting.ratePlanId === parentRatePlan?.id && setting.isDefault
      );
    } else {
      ratePlanPaymentTermSetting = ratePlanPaymentTermSettings?.find(
        (setting) => setting.ratePlanId === ratePlan.id && setting.isDefault
      );
    }

    const isFollowDailyIncludedAmenity =
      ratePlan.baseSetting?.followDailyIncludedAmenity &&
      ratePlan.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING;

    let hotelExtrasList: HotelAmenity[] = [];
    if (isFollowDailyIncludedAmenity) {
      const parentRatePlan = ratePlans?.find(
        (r) => r.id === ratePlan.baseSetting?.derivedRatePlanId
      );

      const derivedRatePlanExtraServices = ratePlanExtraServices?.filter(
        (service) => service.ratePlanId === parentRatePlan?.id
      );

      const includedRatePlanExtraServices = derivedRatePlanExtraServices?.filter(
        (service) => service.type === RatePlanExtraServiceType.INCLUDED
      );

      const mandatoryRatePlanExtraServices = derivedRatePlanExtraServices?.filter(
        (service) => service.type === RatePlanExtraServiceType.MANDATORY
      );

      const extraRatePlanExtraServices = ratePlanExtraServices?.filter(
        (service) =>
          service.ratePlanId === ratePlan.id && service.type === RatePlanExtraServiceType.EXTRA
      );

      hotelExtrasList = [
        ...includedRatePlanExtraServices,
        ...mandatoryRatePlanExtraServices,
        ...extraRatePlanExtraServices
      ].map((service) => service.extra);
    } else {
      hotelExtrasList = ratePlanExtraServices
        ?.filter((service) => service.ratePlanId === ratePlan.id)
        .map((service) => service.extra);
    }

    const hotelPaymentTermFound = hotelPaymentTerms.find(
      (term) => term.id === ratePlanPaymentTermSetting?.hotelPaymentTermId
    );
    const transformed = {
      id: ratePlan.id,
      code: ratePlan.code,
      name: ratePlan.name,
      roundingMode: ratePlan.roundingMode,
      status: ratePlan.status,
      description: ratePlan.description,
      promoCodeList: ratePlan.promoCodes || [],
      type: ratePlan.type,
      paymentTermCode: hotelPaymentTermFound?.code,
      payAtHotel: ratePlan.payAtHotel,
      payOnConfirmation: ratePlan.payOnConfirmation,
      hotelCxlPolicyCode: ratePlan.hotelCxlPolicyCode,
      hourPrior: ratePlan.hourPrior,
      displayUnit: ratePlan.displayUnit,
      cancellationFeeValue: ratePlan.cancellationFeeValue,
      cancellationFeeUnit: ratePlan.cancellationFeeUnit,
      mappingRatePlanCode: ratePlan.pmsMappingRatePlanCode,
      adjustmentValue: ratePlan.adjustmentValue,
      adjustmentUnit: ratePlan.adjustmentUnit,
      isPrimary: ratePlan.isPrimary,
      pricingMethodology: ratePlan.pricingMethodology,
      mrfcPositioningMode: ratePlan.mrfcPositioningMode,
      rfcAttributeMode: ratePlan.rfcAttributeMode,
      sellingStrategyType: ratePlan.sellingStrategyType,
      marketSegment: ratePlan.marketSegmentId ? { id: ratePlan.marketSegmentId } : null,
      ratePlanDerivedSetting: ratePlan.baseSetting,
      hotelCancellationPolicy: hotelCancellationPolicies?.find(
        (policy) => policy.code === ratePlan.hotelCxlPolicyCode
      ),
      hotelPaymentTerm: !!hotelPaymentTermFound
        ? {
            name: hotelPaymentTermFound?.name,
            code: hotelPaymentTermFound?.code,
            description: hotelPaymentTermFound?.description
          }
        : null,
      ratePlanRfcCountList: [
        {
          rfcType: 'RFC',
          count: roomProductRatePlans?.filter(
            (roomProductRatePlan) =>
              roomProductRatePlan.ratePlanId === ratePlan.id &&
              roomProductRatePlan.roomProduct?.type === RoomProductType.RFC
          )?.length
        },
        {
          rfcType: 'MRFC',
          count: roomProductRatePlans?.filter(
            (roomProductRatePlan) =>
              roomProductRatePlan.ratePlanId === ratePlan.id &&
              roomProductRatePlan.roomProduct?.type === RoomProductType.MRFC
          )?.length
        },
        {
          rfcType: 'ERFC',
          count: roomProductRatePlans?.filter(
            (roomProductRatePlan) =>
              roomProductRatePlan.ratePlanId === ratePlan.id &&
              roomProductRatePlan.roomProduct?.type === RoomProductType.ERFC
          )?.length
        }
      ],
      hotelExtrasList: hotelExtrasList,
      distributionChannelList: ratePlan.distributionChannel || [],
      salesPlanFollowList:
        ratePlan.salesPlanFollowList?.map((childPlan) =>
          this.transformRatePlanForExpand(
            ratePlans,
            childPlan,
            roomProductRatePlans,
            hotelCancellationPolicies,
            hotelPaymentTerms,
            ratePlanPaymentTermSettings,
            ratePlanExtraServices
          )
        ) || [],
      translationList: ratePlan.translations || []
    };

    return transformed;
  }

  /**
   * Build sales plan tree structure with derived plans as children
   */
  private buildSalesPlanTree(
    ratePlans: RatePlan[]
  ): (RatePlan & { salesPlanFollowList: RatePlan[] })[] {
    const basePlans: RatePlan[] = [];
    const derivedPlans: RatePlan[] = [];

    ratePlans.forEach((ratePlan) => {
      if (ratePlan.baseSetting) {
        derivedPlans.push(ratePlan);
      } else {
        basePlans.push(ratePlan);
      }
    });

    // Second pass: Build the tree by adding derived plans to their base plans
    const tree = basePlans?.map((basePlan) => {
      const ratePlanFollowList = ratePlans?.filter(
        (j) => basePlan.id === j.baseSetting?.derivedRatePlanId
      );
      return {
        ...basePlan,
        salesPlanFollowList: ratePlanFollowList || []
      };
    });
    const sortedTree = tree?.sort((a, b) => (a.isPrimary ? -1 : 1));
    return sortedTree;
  }

  /**
   * Build sales plan tree structure with derived plans as children
   */
  private applyFilter(
    ratePlans: RatePlan[],
    filterDto: ExtranetRatePlanFilter
  ): (RatePlan & { salesPlanFollowList: RatePlan[] })[] {
    const parentFilterd = this.applyFilterForListRatePlan(ratePlans, filterDto);
    const childFilterd = ratePlans?.map((i) => ({
      ...i,
      salesPlanFollowList: this.applyFilterForListRatePlan(i.salesPlanFollowList, filterDto)
    }));
    // return array of if parent match filter or if one of child match filter
    return childFilterd?.filter(
      (i) => i.salesPlanFollowList?.length > 0 || parentFilterd?.some((j) => j.id === i.id)
    );
  }

  private applyFilterForListRatePlan(
    ratePlans: RatePlan[],
    filterDto: ExtranetRatePlanFilter
  ): (RatePlan & { salesPlanFollowList: RatePlan[] })[] {
    let filteredRatePlans = ratePlans;
    const { statusList, searchType, searchText, typeList } = filterDto;

    if (statusList && statusList?.length > 0) {
      filteredRatePlans = filteredRatePlans?.filter((i) => statusList.includes(i.status));
    }
    if (searchType && searchType === SalesPlanSearchTypeEnum.PROMO_CODE && searchText) {
      filteredRatePlans = filteredRatePlans?.filter((i) =>
        i.promoCodes?.some((promoCode) =>
          promoCode?.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    if (searchType && searchType === SalesPlanSearchTypeEnum.NAME_CODE && searchText) {
      filteredRatePlans = filteredRatePlans?.filter(
        (i) =>
          i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          i.code?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (typeList && typeList?.length > 0) {
      filteredRatePlans = filteredRatePlans?.filter((i) => typeList.includes(i.type));
    }
    return filteredRatePlans;
  }

  private async calculateRoomProductDailySellingPrice(
    filterDto: DailySalesPlanPricingBreakdownFilter,
    hotel: Hotel
  ) {
    const methodStartTime = Date.now();
    this.logger.log(`🔄 Starting calculateRoomProductDailySellingPrice for hotel: ${hotel.code}`);

    const {
      ratePlanTypes,
      propertyCode,
      fromDate,
      toDate,
      isFollowingRetailStrategy,
      hasPriceCombinedByDate,
      guestCount,
      salesPlanIdList,
      hasIncludedServicesInPrice,
      hasCityTaxInPrice,
      distributionChannelList
    } = filterDto;
    console.log('hasCityTaxInPrice', hasCityTaxInPrice);
    let salesPlanIds = salesPlanIdList || [];
    if (!salesPlanIdList || salesPlanIdList?.length === 0) {
      const where: FindOptionsWhere<RatePlan> = { hotelId: hotel.id };
      if (ratePlanTypes && ratePlanTypes?.length > 0) {
        where.type = In(ratePlanTypes);
      }

      const allSalesPlan = await this.ratePlanRepository.find({ where });
      salesPlanIds.push(...allSalesPlan.map((i) => i.id));
    }

    // ------------------------------------------------------------
    // isFollowingRetailStrategy => ISE Lowest Selling Product Price
    const whereRoomProduct: FindOptionsWhere<RoomProduct> = {
      hotelId: hotel.id,
      status: RoomProductStatus.ACTIVE
    };
    if (distributionChannelList && distributionChannelList?.length > 0) {
      whereRoomProduct.distributionChannel = Raw(
        () => `"distribution_channel" && :distributionChannels`,
        {
          distributionChannels: distributionChannelList
        }
      );
    }
    if (isFollowingRetailStrategy) {
      const hotelConfig = await this.hotelConfigRepository.findOne({
        where: {
          hotelId: hotel.id,
          configType: In([
            HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING
          ])
        }
      });

      const types = hotelConfig?.configValue?.metadata?.['LOWEST_PRICE'] || {};
      const roomProductTypeList = [
        RoomProductType.RFC,
        RoomProductType.MRFC,
        RoomProductType.ERFC
      ].filter((t) => types[t]);

      if (roomProductTypeList.length) whereRoomProduct.type = In(roomProductTypeList);
    }
    // ------------------------------------------------------------
    const dates = eachDayOfInterval({ start: fromDate, end: toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );

    const [roomProductRatePlans, roomProducts] = await Promise.all([
      this.roomProductRatePlanRepository.query(
        `SELECT rprp.id,
                rprp.hotel_id AS "hotelId",
                rprp.rate_plan_id AS "ratePlanId",
                rprp.room_product_id AS "roomProductId",
                rprp.name,
                rprp.code,
                rprp.is_sellable AS "isSellable"
        FROM room_product_rate_plan rprp
        JOIN rate_plan rp ON rprp.rate_plan_id = rp.id
        WHERE rprp.hotel_id = $1
          AND rp.id = ANY($2)
          AND rp.status = $3;`,
        [hotel.id, salesPlanIds, RatePlanStatusEnum.ACTIVE]
      ),
      this.roomProductRepository.find({
        where: whereRoomProduct
      })
    ]);
    const roomProductIds = roomProducts.map((i) => i.id);
    const roomProductRatePlanIds = roomProductRatePlans.map((i) => i.id);
    const [
      roomProductDailySellingRateList,
      taxSettings,
      roomProductDailyAvailabilities,
      roomProductRatePlanAvailabilityAdjustments
    ] = await Promise.all([
      // Room Product Daily Selling Price (with date chunking)
      this.getRoomProductDailySellingPricesInChunks(hotel.id, salesPlanIds, dates),
      this.hotelTaxSettingRepository.find({
        where: { hotelId: hotel.id },
        relations: ['hotelTax']
      }),
      // Room Product Daily Availability (with date chunking)
      this.getRoomProductDailyAvailabilitiesInChunks(hotel.id, roomProductIds, dates),
      // Raw SQL: Room Product Rate Plan Availability Adjustment (with date chunking)
      this.getRoomProductRatePlanAvailabilityAdjustmentsInChunks(
        hotel.id,
        roomProductRatePlanIds,
        dates
      )
    ]);

    let roomProductDailySellingRateFiltered = roomProductDailySellingRateList;

    const ratePlanDailySellabilityFilter = {
      hotelId: hotel.id,
      salesPlanIdList: salesPlanIds,
      distributionChannelList: distributionChannelList,
      fromDate: fromDate,
      toDate: toDate,
      isSellable: true
    };

    const ratePlanDailySellabilities =
      await this.ratePlanSellabilityService.getDailyRatePlanSellability(
        ratePlanDailySellabilityFilter
      );

    const ratePlanDailySellabilityMap = new Map<
      `${RatePlanId}_${DateString}`,
      DailyRatePlanSellabilityDto[]
    >();

    for (const ratePlanDailySellability of ratePlanDailySellabilities) {
      if (ratePlanDailySellability.isSellable) {
        const key =
          `${ratePlanDailySellability.salePlanId}_${ratePlanDailySellability.date}` as const;
        if (!ratePlanDailySellabilityMap.has(key)) {
          ratePlanDailySellabilityMap.set(key, []);
        }
        ratePlanDailySellabilityMap.get(key)!.push(ratePlanDailySellability);
      }
    }

    const getRoomProductDailyOrDefaultAvailabilities = await this.getProductDailyAvailability({
      roomProductRatePlans,
      roomProductDailyAvailabilities,
      roomProductRatePlanAvailabilityAdjustments,
      fromDate,
      toDate
    });

    const roomProductDailyAvailabilitiesMap = groupByToMapSingle(
      getRoomProductDailyOrDefaultAvailabilities,
      (i) => `${i.roomProductId}__${i.ratePlanId}_${i.date}`
    );

    roomProductDailySellingRateFiltered = roomProductDailySellingRateList.filter((i) => {
      const sellabilityKey = `${i.ratePlanId}_${i.date}` as const;
      const roomProductRatePlan = roomProductRatePlans.find((j) => j.ratePlanId === i.ratePlanId);

      const availabilityKey = `${i.roomProductId}__${i.ratePlanId}_${i.date}` as const;
      return (
        (roomProductRatePlan?.isSellable || ratePlanDailySellabilityMap.has(sellabilityKey)) &&
        roomProductDailyAvailabilitiesMap.has(availabilityKey)
      );
    });

    // const roomProducts = roomProductRatePlans.map((i) => i.roomProduct);

    // Calculate
    const pricingCalculation = await this.pricingCalculateService.calculateWithBatch({
      fromDate,
      toDate,
      adults: guestCount,
      childrenAges: [],
      pets: 0,
      hotel,
      roomProductDailySellingPrices: roomProductDailySellingRateFiltered,
      taxSettings,
      isIncludeCityTax: hasCityTaxInPrice,
      isIncludeOccupancySurcharge: true,
      isIncludeExtraBed: true,
      isIncludeService: hasIncludedServicesInPrice,
      ratePlanTypes
    });

    console.time('groupData');

    const roomProductRatePlanMap = roomProductRatePlans.reduce((map, roomProductRatePlan) => {
      if (!map.has(roomProductRatePlan.roomProductId)) {
        map.set(roomProductRatePlan.roomProductId, []);
      }
      map.get(roomProductRatePlan.roomProductId)!.push(roomProductRatePlan);
      return map;
    }, new Map<string, RoomProductRatePlan[]>());

    const extraOccupancySurchargePriceMap = groupByToMap(
      pricingCalculation?.occupancySurcharges,
      (i) => `${i.roomProductId}-${i.ratePlanId}-${i.date}`
    );

    const roomProductDailySellingRateMap = roomProductDailySellingRateList.reduce(
      (map, roomProductDailySellingPrice) => {
        const key = `${roomProductDailySellingPrice.roomProductId}` as const;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(roomProductDailySellingPrice);
        return map;
      },
      new Map<`${RoomProductId}_${RatePlanId}`, RoomProductDailySellingPrice[]>()
    );

    const roomProductDailySellingPriceMap =
      pricingCalculation?.roomProductDailySellingPrices.reduce(
        (map, roomProductDailySellingPrice) => {
          if (!map.has(roomProductDailySellingPrice.id)) {
            map.set(roomProductDailySellingPrice.id, roomProductDailySellingPrice);
          }
          return map;
        },
        new Map<string, RoomProductDailySellingPriceCalculatedDto>()
      ) || new Map();

    console.timeEnd('groupData');

    // Final - Batch Processing for better performance
    console.time('roomProducts mapping ' + roomProducts.length);

    const result: any[] = [];
    const ROOM_PRODUCT_BATCH_SIZE = 20; // Process 20 room products concurrently

    for (let i = 0; i < roomProducts.length; i += ROOM_PRODUCT_BATCH_SIZE) {
      const batch = roomProducts.slice(i, i + ROOM_PRODUCT_BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (roomProduct) => {
          const roomProductRatePlanInRoomProduct = roomProductRatePlanMap.get(roomProduct.id) || [];
          if (!roomProductRatePlanInRoomProduct.length) return null;

          const roomProductRatePlanResults: any[] = [];

          for (const roomProductRatePlan of roomProductRatePlanInRoomProduct) {
            const roomProductDailySellingRatesInRoomProductRatePlan =
              roomProductDailySellingRateMap.get(`${roomProduct.id}`) || [];

            if (!roomProductDailySellingRatesInRoomProductRatePlan.length) continue;

            const dailySellingRateList = roomProductDailySellingRatesInRoomProductRatePlan.map(
              (roomProductDailySellingPrice) => {
                const extraOccupancySurchargePrices = extraOccupancySurchargePriceMap.get(
                  `${roomProductDailySellingPrice.roomProductId}-${roomProductDailySellingPrice.ratePlanId}-${roomProductDailySellingPrice.date}`
                );
                const extraOccupancySurchargeAmount =
                  extraOccupancySurchargePrices?.reduce(
                    (acc, curr) => acc + (curr.extraOccupancySurcharge ?? 0),
                    0
                  ) || 0;

                const dailySellingRateCalculated = roomProductDailySellingPriceMap.get(
                  roomProductDailySellingPrice.id
                );
                if (!dailySellingRateCalculated) return null;
                const includedExtraServicesRate =
                  dailySellingRateCalculated?.hotelAmenityPrices?.reduce(
                    (acc, curr) =>
                      acc +
                      (hotel.taxSetting === TaxSettingEnum.INCLUSIVE
                        ? curr.amount
                        : Number(curr.totalBaseAmount)),
                    0
                  ) || 0;

                // City tax should only be included in selling rate when:
                const cityTaxAmount = hasCityTaxInPrice
                  ? dailySellingRateCalculated?.cityTaxAmount || 0
                  : 0;

                return {
                  ...roomProductDailySellingPrice,
                  dailySellingRateCalculated,
                  sellingRate:
                    roomProductDailySellingPrice.grossPrice +
                    includedExtraServicesRate +
                    extraOccupancySurchargeAmount +
                    cityTaxAmount
                  // final to display on FE (no related params)
                };
              }
            );

            roomProductRatePlanResults.push({
              id: roomProductRatePlan.id,
              name: roomProductRatePlan.name,
              code: roomProductRatePlan.code,
              dailySellingRateList
            });
          }

          return {
            id: roomProduct.id,
            code: roomProduct.code,
            name: roomProduct.name,
            type: roomProduct.type,
            status: roomProduct.status,
            distributionChannelList: roomProduct.distributionChannel || [],
            rfcRatePlanList: roomProductRatePlanResults
          };
        })
      );

      // Filter out null results and accumulate
      result.push(...batchResults.filter((item) => item !== null));
    }

    // const pricingData = roomProducts
    //   ?.map((roomProduct) => {
    //     return {
    //       id: roomProduct.id,
    //       code: roomProduct.code,
    //       name: roomProduct.name,
    //       type: roomProduct.type,
    //       status: roomProduct.status,
    //       distributionChannelList: roomProduct.distributionChannel || [],
    //       rfcRatePlanList: roomProductRatePlans
    //         ?.filter((roomProductRatePlan) => roomProductRatePlan.roomProductId === roomProduct.id)
    //         ?.map((roomProductRatePlan) => ({
    //           id: roomProductRatePlan.id,
    //           name: roomProductRatePlan.name,
    //           code: roomProductRatePlan.code,
    //           dailySellingRateList: roomProductDailySellingRateList
    //             ?.filter((dailySellingRate) => dailySellingRate.roomProductId === roomProduct.id)
    //             ?.map((roomProductDailySellingPrice) => {
    //               const dailySellingRateCalculated =
    //                 pricingCalculation?.roomProductDailySellingPrices?.find(
    //                   (i) => i.id === roomProductDailySellingPrice.id
    //                 );
    //               const includedExtraServicesRate =
    //                 dailySellingRateCalculated?.hotelAmenityPrices?.reduce(
    //                   (acc, curr) =>
    //                     acc +
    //                     (hotel.taxSetting === TaxSettingEnum.INCLUSIVE
    //                       ? curr.amount
    //                       : Number(curr.totalBaseAmount)),
    //                   0
    //                 ) || 0;
    //               return {
    //                 ...roomProductDailySellingPrice,
    //                 dailySellingRateCalculated,
    //                 sellingRate: roomProductDailySellingPrice.grossPrice + includedExtraServicesRate
    //                 // final to display on FE (no related params)
    //               };
    //             })
    //         }))
    //         ?.filter((i) => !!i.dailySellingRateList?.length)
    //     };
    //   })
    //   ?.filter((i) => !!i.rfcRatePlanList?.length);

    console.timeEnd('roomProducts mapping ' + roomProducts.length);
    return result;

    // return pricingData;
  }

  // daily sales plan pricing breakdown API
  async dailySalesPlanPricingBreakdown(filterDto: DailySalesPlanPricingBreakdownFilter) {
    const {
      propertyCode,
      fromDate,
      toDate,
      isFollowingRetailStrategy,
      hasPriceCombinedByDate,
      guestCount,
      salesPlanIdList,
      hasIncludedServicesInPrice,
      hasCityTaxInPrice,
      distributionChannelList
    } = filterDto;
    const hotel = await this.hotelRepository.findOne({ where: { code: propertyCode } });
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }
    const dates = eachDayOfInterval({ start: fromDate, end: toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );
    const pricingData = await this.calculateRoomProductDailySellingPrice(filterDto, hotel);

    if (salesPlanIdList) {
      return RatePlanUtils.flatAndGetPricingBreakdownByRatePlanOnly(pricingData, hotel, dates);
    }

    return RatePlanUtils.flatAndGetPricingBreakdown(pricingData, hotel, dates);
  }

  async dailyProductsToSellList(filterDto: RatePlanProductsToSellDailyFilterDto) {
    const { hotelId, fromDate, toDate, ratePlanId, types } = filterDto;

    const whereRoomProductRatePlan: FindOptionsWhere<RoomProductRatePlan> = {
      hotelId: hotelId
    };

    if (types && types?.length > 0) {
      whereRoomProductRatePlan.roomProduct = {
        type: In(types)
      };
    }

    if (ratePlanId) {
      whereRoomProductRatePlan.ratePlanId = ratePlanId;
    }

    const roomProductRatePlans = await this.roomProductRatePlanRepository.find({
      where: whereRoomProductRatePlan,
      select: {
        id: true,
        roomProductId: true,
        ratePlanId: true,
        isSellable: true
      }
    });

    const roomProductIds = Array.from(new Set(roomProductRatePlans.map((i) => i.roomProductId)));
    const ratePlanIds = Array.from(new Set(roomProductRatePlans.map((i) => i.ratePlanId)));

    const roomProductRatePlanIds = roomProductRatePlans.map((i) => i.id);
    const dates = eachDayOfInterval({ start: fromDate, end: toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );

    const [
      roomProductDailyAvailabilityList,
      roomProductRatePlanAvailabilityAdjustments,
      ratePlanDailySellabilityList
    ] = await Promise.all([
      this.roomProductDailyAvailabilityRepository.find({
        where: { roomProductId: In(roomProductIds), date: In(dates), deletedAt: IsNull() },
        select: {
          id: true,
          roomProductId: true,
          date: true,
          available: true
        },
        order: { date: 'ASC' }
      }),
      this.roomProductRatePlanAvailabilityAdjustmentRepository.find({
        where: { roomProductRatePlanId: In(roomProductRatePlanIds), date: In(dates) },
        select: {
          id: true,
          roomProductRatePlanId: true,
          date: true,
          ratePlanId: true,
          isSellable: true
        }
      }),
      this.ratePlanSellabilityService.getDailyRatePlanSellability({
        salesPlanIdList: ratePlanIds,
        fromDate,
        toDate,
        hotelId,
        distributionChannelList: [DistributionChannel.GV_SALES_ENGINE]
      })
    ]);

    const ratePlanDailySellabilityMap = groupByToMapSingle(
      ratePlanDailySellabilityList,
      (i) => `${i.salePlanId}_${i.date}`
    );

    const roomProductDailyAvailabilityMap = groupByToMap(
      roomProductDailyAvailabilityList,
      (i) => i.date
    );

    const roomProductRatePlanAvailabilityAdjustmentMap = groupByToMapSingle(
      roomProductRatePlanAvailabilityAdjustments,
      (i) => `${i.roomProductRatePlanId}_${i.ratePlanId}_${i.date}`
    );

    const result: RatePlanProductsToSellDailyDto[] = [];
    for (const date of dates) {
      let roomProducts = new Set<string>([]);

      const roomProductDailyAvailabilityListInDate =
        roomProductDailyAvailabilityMap.get(date) || [];

      for (const roomProductDailyAvailability of roomProductDailyAvailabilityListInDate) {
        const findRoomProductRatePlans = roomProductRatePlans.filter(
          (i) => i.roomProductId === roomProductDailyAvailability.roomProductId
        );

        let isHasRoomProductRatePlanSellable = false;

        if (findRoomProductRatePlans.length > 0) {
          for (const findRoomProductRatePlan of findRoomProductRatePlans) {
            const ratePlanDailySellability = ratePlanDailySellabilityMap.get(
              `${findRoomProductRatePlan.ratePlanId}_${date}`
            );

            const roomProductRatePlanAvailabilityAdjustment =
              roomProductRatePlanAvailabilityAdjustmentMap.get(
                `${findRoomProductRatePlan?.id}_${ratePlanId}_${date}`
              );

            const isSellable = roomProductRatePlanAvailabilityAdjustment
              ? roomProductRatePlanAvailabilityAdjustment?.isSellable
              : findRoomProductRatePlan?.isSellable;

            if (
              isSellable &&
              roomProductDailyAvailability.available > 0 &&
              ratePlanDailySellability?.isSellable
            ) {
              isHasRoomProductRatePlanSellable = true;
            }
          }
        }

        if (isHasRoomProductRatePlanSellable) {
          roomProducts.add(roomProductDailyAvailability.roomProductId);
        }
      }

      result.push({
        roomProductIds: roomProductIds,
        productToSell: roomProducts.size,
        date
      });
    }
    return result;
  }

  /**
   * Calculate optimal chunk size based on data volume
   * @param totalDates Total number of dates
   * @param totalIds Total number of IDs (rate plans, room products, etc.)
   * @returns Optimal chunk size
   */
  private calculateOptimalChunkSize(totalDates: number, totalIds: number): number {
    const estimatedRecords = totalDates * totalIds;

    // Dynamic chunk sizing based on estimated data volume
    if (estimatedRecords > 100000) return 15; // Very large dataset
    if (estimatedRecords > 50000) return 20; // Large dataset
    if (estimatedRecords > 10000) return 30; // Medium dataset
    if (estimatedRecords > 1000) return 60; // Small dataset
    return 90; // Very small dataset
  }

  /**
   * Get Room Product Daily Selling Prices with date chunking for better performance
   * @param hotelId Hotel ID
   * @param salesPlanIds Array of sales plan IDs
   * @param dates Array of dates
   * @param chunkSize Number of dates to process per chunk (auto-calculated if not provided)
   * @returns Promise<any[]>
   */
  private async getRoomProductDailySellingPricesInChunks(
    hotelId: string,
    salesPlanIds: string[],
    dates: string[],
    chunkSize?: number
  ): Promise<any[]> {
    const results: any[] = [];
    const optimalChunkSize =
      chunkSize || this.calculateOptimalChunkSize(dates.length, salesPlanIds.length);

    // Process dates in chunks to avoid large IN clauses
    for (let i = 0; i < dates.length; i += optimalChunkSize) {
      const dateChunk = dates.slice(i, i + optimalChunkSize);
      const chunkResult = await this.roomProductDailySellingPriceRepository.query(
        `SELECT id,
                hotel_id AS "hotelId",
                room_product_id AS "roomProductId",
                rate_plan_id AS "ratePlanId",
                date,
                CAST(base_price AS float) AS "basePrice",
                CAST(rate_plan_adjustments AS float) AS "ratePlanAdjustments",
                CAST(net_price AS float) AS "netPrice",
                CAST(gross_price AS float) AS "grossPrice",
                CAST(tax_amount AS float) AS "taxAmount"
         FROM room_product_daily_selling_price
         WHERE hotel_id = $1
           AND rate_plan_id = ANY($2::uuid[])
           AND date = ANY($3::text[])
         ORDER BY date ASC`,
        [hotelId, salesPlanIds, dateChunk]
      );

      if (Array.isArray(chunkResult)) {
        results.push(...chunkResult);
      }

      // Optional: Add small delay between chunks to prevent overwhelming the database
      if (i + optimalChunkSize < dates.length && dates.length > 100) {
        await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay
      }
    }

    return results;
  }

  /**
   * Get Room Product Daily Availabilities with date chunking for better performance
   * @param hotelId Hotel ID
   * @param roomProductIds Array of room product IDs
   * @param dates Array of dates
   * @param chunkSize Number of dates to process per chunk (auto-calculated if not provided)
   * @returns Promise<any[]>
   */
  private async getRoomProductDailyAvailabilitiesInChunks(
    hotelId: string,
    roomProductIds: string[],
    dates: string[],
    chunkSize?: number
  ): Promise<any[]> {
    const startTime = Date.now();
    const results: any[] = [];
    const optimalChunkSize =
      chunkSize || this.calculateOptimalChunkSize(dates.length, roomProductIds.length);
    const totalChunks = Math.ceil(dates.length / optimalChunkSize);

    // Process dates in chunks to avoid large IN clauses
    for (let i = 0; i < dates.length; i += optimalChunkSize) {
      const chunkIndex = Math.floor(i / optimalChunkSize) + 1;
      const dateChunk = dates.slice(i, i + optimalChunkSize);

      const chunkStartTime = Date.now();
      const chunkResult = await this.roomProductDailyAvailabilityRepository.query(
        `SELECT id, 
                room_product_id as "roomProductId", 
                date, 
                available
         FROM room_product_daily_availability
         WHERE hotel_id = $1
           AND room_product_id = ANY($2::uuid[])
           AND date = ANY($3::text[])
           AND deleted_at IS NULL`,
        [hotelId, roomProductIds, dateChunk]
      );

      if (Array.isArray(chunkResult)) {
        results.push(...chunkResult);
      }

      // Optional: Add small delay between chunks to prevent overwhelming the database
      if (i + optimalChunkSize < dates.length && dates.length > 100) {
        await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay
      }
    }
    return results;
  }

  /**
   * Get Room Product Rate Plan Availability Adjustments with date chunking for better performance
   * @param hotelId Hotel ID
   * @param roomProductRatePlanIds Array of room product rate plan IDs
   * @param dates Array of dates
   * @param chunkSize Number of dates to process per chunk (auto-calculated if not provided)
   * @returns Promise<RoomProductRatePlanAvailabilityAdjustment[]>
   */
  private async getRoomProductRatePlanAvailabilityAdjustmentsInChunks(
    hotelId: string,
    roomProductRatePlanIds: string[],
    dates: string[],
    chunkSize?: number
  ): Promise<any[]> {
    const results: any[] = [];
    const optimalChunkSize =
      chunkSize || this.calculateOptimalChunkSize(dates.length, roomProductRatePlanIds.length);

    // Process dates in chunks to avoid large IN clauses
    for (let i = 0; i < dates.length; i += optimalChunkSize) {
      const dateChunk = dates.slice(i, i + optimalChunkSize);

      const chunkResult = await this.roomProductRatePlanAvailabilityAdjustmentRepository.query(
        `SELECT id, 
                room_product_rate_plan_id as "roomProductRatePlanId", 
                date, 
                is_sellable as "isSellable", 
                rate_plan_id as "ratePlanId"
         FROM room_product_rate_plan_availability_adjustment
         WHERE hotel_id = $1
           AND room_product_rate_plan_id = ANY($2::uuid[])
           AND date = ANY($3::text[])`,
        [hotelId, roomProductRatePlanIds, dateChunk]
      );

      if (Array.isArray(chunkResult)) {
        results.push(...chunkResult);
      }

      // Optional: Add small delay between chunks to prevent overwhelming the database
      if (i + optimalChunkSize < dates.length && dates.length > 100) {
        await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms delay
      }
    }

    return results;
  }

  async getProductDailyAvailability(input: {
    roomProductRatePlans: RoomProductRatePlan[];
    roomProductDailyAvailabilities: RoomProductDailyAvailability[];
    roomProductRatePlanAvailabilityAdjustments: RoomProductRatePlanAvailabilityAdjustment[];
    fromDate: string;
    toDate: string;
  }) {
    const {
      roomProductDailyAvailabilities,
      roomProductRatePlanAvailabilityAdjustments,
      fromDate,
      toDate,
      roomProductRatePlans
    } = input;

    const dates = eachDayOfInterval({ start: fromDate, end: toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );

    const roomProductRatePlansMap = groupByToMap(roomProductRatePlans, (i) => i.roomProductId);

    const roomProductDailyAvailabilitiesMap = groupByToMapSingle(
      roomProductDailyAvailabilities,
      (i) => `${i.roomProductId}_${i.date}`
    );

    const roomProductRatePlanAvailabilityAdjustmentsMap = groupByToMapSingle(
      roomProductRatePlanAvailabilityAdjustments,
      (i) => `${i.roomProductRatePlanId}_${i.ratePlanId}_${i.date}`
    );

    const result: {
      date: string;
      roomProductId: string;
      ratePlanId: string;
    }[] = [];
    for (const date of dates) {
      for (const roomProductRatePlan of roomProductRatePlans) {
        let isSellable = roomProductRatePlan.isSellable;
        const roomProductDailyAvailability = roomProductDailyAvailabilitiesMap.get(
          `${roomProductRatePlan.roomProductId}_${date}`
        );

        const dailyAvailability = roomProductRatePlanAvailabilityAdjustmentsMap.get(
          `${roomProductRatePlan.id}_${roomProductRatePlan.ratePlanId}_${date}`
        );

        if (dailyAvailability) {
          isSellable = dailyAvailability.isSellable;
        }

        if (
          isSellable &&
          roomProductDailyAvailability &&
          roomProductDailyAvailability.available > 0
        ) {
          result.push({
            date,
            roomProductId: roomProductDailyAvailability.roomProductId,
            ratePlanId: roomProductRatePlan.ratePlanId
          });
        }
      }
    }
    return result;
  }

  async roomProductDailyRateList(filterDto: RoomProductDailyRateListFilter) {
    const {
      propertyCode,
      fromDate,
      toDate,
      salesPlanIdList,
      roomProductStatusList,
      roomProductTypeList,
      adults,
      childrenAgeList,
      roomProductRetailFeatureIdList,
      text
    } = filterDto;
    const hotel = await this.hotelRepository.findOne({ where: { code: propertyCode } });
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    const dates = eachDayOfInterval({ start: fromDate, end: toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );

    const roomProductRatePlans = await this.roomProductRatePlanRepository.find({
      where: {
        hotelId: hotel.id,
        ratePlanId: In(salesPlanIdList)
      }
    });
    const roomProductIds = roomProductRatePlans.map((i) => i.roomProductId);

    // Early return nếu không có room product IDs để tránh SQL syntax error với IN ()
    if (!roomProductIds || roomProductIds.length === 0) {
      return [];
    }

    let roomProductQuery = this.roomProductRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.roomProductBasePriceSettings', 'roomProductBasePriceSettings')
      .where('rp.id IN (:...roomProductIds)', { roomProductIds });

    if (roomProductTypeList && roomProductTypeList?.length > 0) {
      roomProductQuery = roomProductQuery.andWhere('rp.type IN (:...types)', {
        types: roomProductTypeList
      });
    }
    if (roomProductStatusList && roomProductStatusList?.length > 0) {
      roomProductQuery = roomProductQuery.andWhere('rp.status IN (:...statuses)', {
        statuses: roomProductStatusList
      });
    }
    if (text) {
      roomProductQuery = roomProductQuery.andWhere('(rp.code ILIKE :text OR rp.name ILIKE :text)', {
        text: `%${text}%`
      });
    }
    if (roomProductRetailFeatureIdList && roomProductRetailFeatureIdList.length > 0) {
      roomProductQuery = roomProductQuery.andWhere(
        `(
          EXISTS (
            SELECT 1 FROM room_product_retail_feature rprf 
            WHERE rprf.room_product_id = rp.id 
            AND rprf.retail_feature_id IN (:...featureIds)
          )
          OR EXISTS (
            SELECT 1 FROM room_product_standard_feature rpsf 
            WHERE rpsf.room_product_id = rp.id 
            AND rpsf.standard_feature_id IN (:...featureIds)
          )
        )`,
        { featureIds: roomProductRetailFeatureIdList }
      );
    }

    const [
      roomProducts,
      ratePlans,
      dailyRoomAvailabilityList,
      roomProductMapping,
      roomProductRetailFeatures,
      roomProductStandardFeatures,
      roomUnits,
      roomProductPricingMethodDetails,
      roomProductMappings,
      roomProductRatePlanAvailabilityAdjustments,
      roomProductDailySellingRateList,
      taxSettings,
      ratePlanDailyAdjustments,
      hotelConfig
    ] = await Promise.all([
      roomProductQuery.getMany(),
      this.ratePlanRepository.find({ where: { id: In(salesPlanIdList) } }),
      this.roomProductDailyAvailabilityRepository.find({
        where: { roomProductId: In(roomProductIds), date: In(dates) },
        order: { date: 'ASC' }
      }),
      this.roomProductMappingRepository.find({
        where: { relatedRoomProductId: In(roomProductIds), hotelId: hotel.id },
        select: {
          relatedRoomProductId: true,
          roomProductId: true,
          roomProduct: {
            id: true,
            code: true,
            name: true
          }
        },
        relations: ['roomProduct']
      }),
      this.roomProductRetailFeatureRepository.find({
        where: {
          roomProductId: In(roomProductIds),
          hotelId: hotel.id,
          quantity: MoreThanOrEqual(1)
        },
        select: {
          roomProductId: true,
          quantity: true,
          retailFeatureId: true,
          retailFeature: {
            id: true,
            name: true,
            code: true
          }
        },
        relations: ['retailFeature']
      }),
      this.roomProductStandardFeatureRepository.find({
        where: { hotelId: hotel.id },
        select: {
          roomProductId: true,
          standardFeatureId: true,
          standardFeature: {
            id: true,
            name: true,
            code: true
          }
        },
        relations: ['standardFeature']
      }),
      this.roomProductAssignedUnitRepository.find({
        where: { roomProductId: In(roomProductIds) },
        relations: ['roomUnit'],
        select: {
          roomProductId: true,
          roomUnitId: true,
          roomUnit: {
            roomNumber: true
          }
        }
      }),
      this.roomProductPricingMethodDetailRepository.find({
        where: {
          roomProductId: In(roomProductIds),
          ratePlanId: salesPlanIdList && salesPlanIdList.length ? In(salesPlanIdList) : undefined
        },
        relations: ['targetRoomProduct'],
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
        }
      }),
      this.roomProductMappingRepository.find({ where: { roomProductId: In(roomProductIds) } }),
      this.roomProductRatePlanAvailabilityAdjustmentRepository.find({
        where: { roomProductRatePlanId: In(roomProductRatePlans.map((i) => i.id)) }
      }),
      this.roomProductDailySellingPriceRepository.find({
        where: { hotelId: hotel.id, ratePlanId: In(salesPlanIdList), date: In(dates) },
        order: { date: 'ASC' }
      }),
      this.hotelTaxSettingRepository.find({
        where: { hotelId: hotel.id },
        relations: ['hotelTax']
      }),
      this.ratePlanDailyAdjustmentRepository.find({
        where: { hotelId: hotel.id, ratePlanId: In(salesPlanIdList), date: In(dates) },
        select: {
          id: true,
          date: true,
          hotelId: true,
          ratePlanId: true,
          adjustmentValue: true,
          adjustmentType: true
        }
      }),
      this.hotelConfigRepository.findOne({
        where: {
          hotelId: hotel.id,
          configType: HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE
        }
      })
    ]);

    let decimalRoundingRule = new HotelPricingDecimalRoundingRuleDto();
    if (hotelConfig) {
      const configValue = hotelConfig.configValue as HotelPricingDecimalRoundingRuleConfigValue;
      if (configValue.metadata) {
        decimalRoundingRule = {
          decimalUnits: configValue.metadata.decimalUnits,
          roundingMode: configValue.metadata.roundingMode
        };
      }
    }

    const pricingCalculation = await this.pricingCalculateService.calculateWithBatch({
      fromDate,
      toDate,
      adults: adults,
      childrenAges: childrenAgeList || [],
      pets: 0,
      hotel,
      roomProductDailySellingPrices: roomProductDailySellingRateList,
      taxSettings,
      isIncludeCityTax: true,
      isIncludeOccupancySurcharge: true,
      isIncludeExtraBed: true,
      isIncludeService: true
    });

    const extraOccupancySurchargePriceMap = groupByToMap(
      pricingCalculation.occupancySurcharges,
      (i) => `${i.roomProductId}-${i.ratePlanId}-${i.date}`
    );

    const tasks = await this.redisTaskService.getTasksByIdentifier<PushToPmsTaskData>(
      RedisTaskNamespace.PMS,
      RedisTaskContext.PUSH_RATE_PLAN_PRICING,
      hotel.id
    );

    const isPushToPmsMap = new Map<`${RatePlanId}-${RoomProductId}`, boolean>();

    for (const task of tasks) {
      const components = new PushToPmsTaskKeyComponents();
      components.setIdentifierFromKey(task.key);
      const { ratePlanId, roomProductId } = components.identifier;
      isPushToPmsMap.set(`${ratePlanId}-${roomProductId}`, true);
    }
    // Final
    return roomProducts
      ?.map((roomProduct) => {
        const isPmsReversedRoomProduct = RatePlanUtils.calculateIsPmsReversedRoomProduct(
          roomProduct.id,
          roomProductPricingMethodDetails,
          roomProductMappings,
          roomProductRatePlans
        );

        const findRoomProductPricingMethodDetails = roomProductPricingMethodDetails.filter(
          (item) =>
            item.roomProductId === roomProduct.id &&
            item.pricingMethod === RoomProductPricingMethodEnum.LINK
        );

        const linkedMrfcList =
          findRoomProductPricingMethodDetails &&
          findRoomProductPricingMethodDetails.length > 0 &&
          findRoomProductPricingMethodDetails.some(
            (item) => item.pricingMethod === RoomProductPricingMethodEnum.LINK
          )
            ? findRoomProductPricingMethodDetails[0].targetRoomProduct
            : [];

        return {
          id: roomProduct.id,
          code: roomProduct.code,
          name: roomProduct.name,
          type: roomProduct.type,
          capacityDefault: roomProduct.capacityDefault,
          capacityExtra: roomProduct.capacityExtra,
          numberOfBedrooms: roomProduct.numberOfBedrooms,
          space: roomProduct.space,
          rfcAllocationSetting: roomProduct.rfcAllocationSetting,
          status: roomProduct.status,
          maximumAdult: roomProduct.maximumAdult,
          maximumKid: roomProduct.maximumKid,
          maximumPet: roomProduct.maximumPet,

          retailFeatureList: roomProductRetailFeatures
            ?.filter((retailFeature) => retailFeature.roomProductId === roomProduct.id)
            ?.map((i) => ({
              name: i.retailFeature.name,
              code: i.retailFeature.code,
              quantity: i.quantity
            })),
          standardFeatureList: roomProductStandardFeatures
            ?.filter(
              (roomProductStandardFeature) =>
                roomProductStandardFeature.roomProductId === roomProduct.id
            )
            ?.map((i) => ({
              code: i.standardFeature.code,
              name: i.standardFeature.name
            })),
          dailyRoomAvailabilityList: dailyRoomAvailabilityList
            ?.filter((j) => j.roomProductId === roomProduct.id)
            ?.map((j) => ({
              availableRooms: j.available,
              date: j.date,
              roomSold: j.sold,
              occupancy: j.sold / j.sellLimit // occupancy = roomSold/sellLimit
            })),
          roomList: roomUnits
            ?.filter((roomUnit) => roomUnit.roomProductId === roomProduct.id)
            ?.map((i) => i.roomUnit),
          distributionChannelList: roomProduct.distributionChannel || [],
          featureList: null, // left it null for now
          linkedMrfcList: linkedMrfcList,
          relatedMrfcList: roomProductMapping
            ?.filter(
              (roomProductMapping) => roomProductMapping.relatedRoomProductId === roomProduct.id
            )
            ?.map((i) => i.roomProduct),
          rfcRatePlanList: roomProductRatePlans
            ?.filter((roomProductRatePlan) => roomProductRatePlan.roomProductId === roomProduct.id)
            ?.map((roomProductRatePlan) => {
              const ratePlan = ratePlans?.find(
                (ratePlan) => ratePlan.id === roomProductRatePlan.ratePlanId
              );

              const isPushToPms = isPushToPmsMap.get(
                `${roomProductRatePlan.ratePlanId}-${roomProduct.id}`
              );

              return {
                id: roomProductRatePlan.id,
                name: roomProductRatePlan.name,
                code: roomProductRatePlan.code,
                isSellable: roomProductRatePlan.isSellable,
                isPushToPms,
                dailyAvailabilityList: dates.map((dateStr) => {
                  const adjustment = roomProductRatePlanAvailabilityAdjustments?.find(
                    (rdd) =>
                      rdd.roomProductRatePlanId === roomProductRatePlan.id && rdd.date === dateStr
                  );
                  return {
                    date: dateStr,
                    isSellable: adjustment ? adjustment?.isSellable : roomProductRatePlan.isSellable
                  };
                }),
                ratePlan: ratePlan
                  ? {
                      id: ratePlan.id,
                      name: ratePlan.name,
                      code: ratePlan.code
                    }
                  : null,
                isAutomatePricing: true, // hardcode true,
                automatePricing: RatePlanUtils.getAutomatePricing({
                  roomProductId: roomProduct.id,
                  ratePlanId: roomProductRatePlan.ratePlanId,
                  roomProductPricingMethodDetails,
                  roomProductRatePlan,

                  roomProductBasePriceSettings: roomProduct.roomProductBasePriceSettings
                }),
                configuratorSetting: roomProductRatePlan.configuratorSetting,
                isPmsReversedRoomProduct,
                dailyExtraOccupancyRateList: null, // in this api no need to calculate,
                dailySellingRateList: roomProductDailySellingRateList
                  ?.filter((dailySellingRate) => dailySellingRate.roomProductId === roomProduct.id)
                  ?.map((roomProductDailySellingPrice) => {
                    const dailySellingRateCalculated =
                      pricingCalculation?.roomProductDailySellingPrices?.find(
                        (i) => i.id === roomProductDailySellingPrice.id
                      );

                    const extraOccupancySurchargePrices = extraOccupancySurchargePriceMap.get(
                      `${roomProductDailySellingPrice.roomProductId}-${roomProductDailySellingPrice.ratePlanId}-${roomProductDailySellingPrice.date}`
                    );

                    const extraOccupancySurchargeAmount =
                      extraOccupancySurchargePrices?.reduce(
                        (acc, curr) => acc + (curr.extraOccupancySurcharge ?? 0),
                        0
                      ) || 0;

                    const includedExtraServicesBreakdownWithTaxCalculated =
                      dailySellingRateCalculated?.hotelAmenityPrices?.map((j) => ({
                        id: j.id,
                        name: j.name,
                        code: j.code,
                        amenityPricingUnit: j.pricingUnit,
                        amount:
                          hotel.taxSetting === TaxSettingEnum.INCLUSIVE
                            ? j.amount
                            : Number(j.totalBaseAmount)
                      }));
                    const includedExtraServicesRate =
                      includedExtraServicesBreakdownWithTaxCalculated?.reduce(
                        (acc, curr) => acc + Number(curr.amount),
                        0
                      ) || 0;
                    const ratePlanDailyAdjustment = ratePlanDailyAdjustments?.find(
                      (i) =>
                        i.date === roomProductDailySellingPrice.date &&
                        i.ratePlanId === roomProductDailySellingPrice.ratePlanId
                    );

                    const adjustment = ratePlanDailyAdjustment?.adjustmentValue
                      ? Number(ratePlanDailyAdjustment.adjustmentValue)
                      : 0;

                    const totalCityTaxAmount =
                      dailySellingRateCalculated?.cityTaxBreakdowns?.reduce(
                        (acc, curr) => acc + (curr.taxAmount || 0),
                        0
                      ) || 0;
                    const sellingRateNoRounding =
                      roomProductDailySellingPrice.grossPrice +
                      includedExtraServicesRate +
                      extraOccupancySurchargeAmount +
                      totalCityTaxAmount;

                    const sellingRate =
                      roomProductDailySellingPrice.grossPrice +
                      includedExtraServicesRate +
                      extraOccupancySurchargeAmount +
                      totalCityTaxAmount;

                    const roundedSellingRate = DecimalRoundingHelper.conditionalRounding(
                      sellingRateNoRounding,
                      ratePlan?.roundingMode as RoundingModeEnum,
                      decimalRoundingRule.decimalUnits
                    );

                    const roundingGap = new Decimal(sellingRate)
                      .minus(roundedSellingRate)
                      .toNumber();

                    return {
                      date: roomProductDailySellingPrice.date,
                      adjustedProductBasedPrice:
                        hotel.taxSetting === TaxSettingEnum.INCLUSIVE
                          ? roomProductDailySellingPrice.grossPrice + extraOccupancySurchargeAmount
                          : roomProductDailySellingPrice.netPrice + extraOccupancySurchargeAmount,
                      ratePlanAdjustmentRate: roomProductDailySellingPrice.ratePlanAdjustments,
                      includedExtraServicesRate: includedExtraServicesRate,
                      includedServicesSellingPrice: includedExtraServicesRate,
                      sellingRate: sellingRate, // alway add includedExtraServicesRate

                      originalSellingRate: roomProductDailySellingPrice.basePrice,
                      productBasedPrice: roomProductDailySellingPrice.basePrice,

                      isDerived:
                        ratePlans?.find(
                          (ratePlan) => ratePlan.id === roomProductDailySellingPrice.ratePlanId
                        )?.pricingMethodology === RatePlanPricingMethodologyEnum.DERIVED_PRICING,
                      featureAdjustmentRate: null, // hardcode null for now
                      salesPlanAdjustmentValue: ratePlanDailyAdjustment?.adjustmentValue,
                      salesPlanAdjustmentUnit: ratePlanDailyAdjustment?.adjustmentType,
                      doubleOccupancyRate: dailySellingRateCalculated?.occupancySurcharge,
                      roundingGap: roundingGap,
                      automatedPricingDataList: null,
                      includedExtraServicesBreakdown:
                        includedExtraServicesBreakdownWithTaxCalculated,
                      propertyTaxBreakdown: RatePlanUtils.mappingPropertyTaxBreakdown(
                        taxSettings,
                        ratePlans,
                        roomProductDailySellingPrice,
                        dailySellingRateCalculated?.hotelAmenityPrices || []
                      ),
                      cityTaxBreakdown: dailySellingRateCalculated?.cityTaxBreakdowns?.map(
                        (item) => ({
                          ...item,
                          amount: item.taxAmount
                        })
                      ),
                      cityTaxAmount: totalCityTaxAmount,

                      // for debug
                      grossPrice: roomProductDailySellingPrice.grossPrice,
                      netPrice: roomProductDailySellingPrice.netPrice,
                      basePrice: roomProductDailySellingPrice.basePrice,
                      ratePlanDailyAdjustment: ratePlanDailyAdjustment,
                      adjustmentFromSellingRate: roomProductDailySellingPrice.ratePlanAdjustments
                    };
                  })
              };
            })
        };
      })
      ?.filter((i) => !!i.rfcRatePlanList?.length)
      .sort((a, b) => {
        let lowestRoomProductBasePriceA = Infinity;
        for (const roomProductRatePlan of a.rfcRatePlanList) {
          for (const dailySellingRate of roomProductRatePlan.dailySellingRateList) {
            lowestRoomProductBasePriceA = Math.min(
              lowestRoomProductBasePriceA,
              dailySellingRate.productBasedPrice
            );
          }
        }

        let lowestRoomProductBasePriceB = Infinity;
        for (const roomProductRatePlan of b.rfcRatePlanList) {
          for (const dailySellingRate of roomProductRatePlan.dailySellingRateList) {
            lowestRoomProductBasePriceB = Math.min(
              lowestRoomProductBasePriceB,
              dailySellingRate.productBasedPrice
            );
          }
        }
        return lowestRoomProductBasePriceA - lowestRoomProductBasePriceB;
      });
  }

  async dailyRatePlanAdjustmentList(filterDto: DailyRatePlanAdjustmentListFilter) {
    const { hotelCode, fromDate, toDate, ratePlanIdList } = filterDto;
    const hotel = await this.hotelRepository.findOne({ where: { code: hotelCode } });
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }
    const dates = eachDayOfInterval({ start: new Date(fromDate), end: new Date(toDate) }).map(
      (date) => format(date, 'yyyy-MM-dd')
    );
    const ratePlans = await this.ratePlanRepository.find({ where: { id: In(ratePlanIdList) } });
    const ratePlanDailyAdjustments = await this.ratePlanDailyAdjustmentRepository.find({
      where: { hotelId: hotel.id, ratePlanId: In(ratePlanIdList), date: In(dates) }
    });
    return ratePlans
      ?.map((ratePlan) => {
        return dates.map((date) => {
          return {
            date,
            ratePlanId: ratePlan.id,
            value:
              ratePlanDailyAdjustments?.find((i) => i.date === date && i.ratePlanId === ratePlan.id)
                ?.adjustmentValue ||
              ratePlan.adjustmentValue ||
              null,
            unit:
              ratePlanDailyAdjustments?.find((i) => i.date === date && i.ratePlanId === ratePlan.id)
                ?.adjustmentType ||
              ratePlan.adjustmentUnit ||
              null,
            isAdjusted: !!ratePlanDailyAdjustments?.find(
              (i) => i.date === date && i.ratePlanId === ratePlan.id
            )
          };
        });
      })
      ?.flat();
  }

  // ----------------------------------------------------------------------
  async setLowestSellingPrice(body: SetLowestSellingPriceDto) {
    const hotel = await this.hotelRepository.findOne({ where: { code: body.propertyCode } });
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }
    const dates = eachDayOfInterval({ start: body.fromDate, end: body.toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );
    const daysAllowed = body.dayList.map((day) => DayOfWeekJs[day]);
    const datesFiltered = dates.filter((date) => !!daysAllowed.includes(new Date(date).getDay()));

    const [roomProductRatePlans, hotelConfig, roomProductRatePlanAvailabilityAdjustments] =
      await Promise.all([
        this.roomProductRatePlanRepositoryCustom.findAll({
          hotelId: hotel.id,
          ratePlanIds: [body.salesPlanId]
        }),

        this.hotelConfigRepository.findOne({
          where: {
            hotelId: hotel.id,
            configType: In([
              HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING
            ])
          }
        }),
        this.roomProductRatePlanRepositoryCustom.findAvailabilities({
          hotelId: hotel.id,
          ratePlanIds: [body.salesPlanId],
          isSellable: true,
          dates: dates
        })
      ]);

    const roomProductDailyAvailabilities = await this.roomProductDailyAvailabilityRepository.find({
      where: {
        hotelId: hotel.id,
        roomProductId: In(roomProductRatePlans.map((item) => item.roomProductId)),
        date: In(datesFiltered)
      }
    });

    const types = hotelConfig?.configValue?.metadata?.['LOWEST_PRICE'] || {};
    const roomProductTypeList = [
      RoomProductType.RFC,
      RoomProductType.MRFC,
      RoomProductType.ERFC
    ].filter((t) => types[t]);

    const roomProductIds = roomProductRatePlans.map((item) => item.roomProductId);

    const [roomProducts, pricingMethodDetails] = await Promise.all([
      this.roomProductRepository.find({
        where: { id: In(roomProductIds), status: RoomProductStatus.ACTIVE },
        select: { id: true, type: true }
      }),
      this.roomProductRatePlanRepositoryCustom.findRoomProductPricingMethodDetail({
        hotelId: hotel.id,
        roomProductIds: roomProductIds,
        ratePlanIds: [body.salesPlanId]
      })
    ]);

    const pricingMethodDetailsMap = groupByToMapSingle(
      pricingMethodDetails,
      (item) => item.roomProductId
    );

    let rfcReversedProducts = roomProducts.filter((item) => {
      const pricingMethodDetail = pricingMethodDetailsMap.get(item.id);
      return (
        pricingMethodDetail?.pricingMethod === RoomProductPricingMethodEnum.REVERSED_PRICING &&
        item.type === RoomProductType.RFC
      );
    });

    const rfcTargetProducts =
      rfcReversedProducts && rfcReversedProducts.length > 0
        ? await this.roomProductPricingService.getTargetForRFCRoomProduct({
            hotelId: hotel.id,
            rfcRoomProductIds: rfcReversedProducts.map((item) => item.id),
            targetRoomProductTypes: [RoomProductType.MRFC]
          })
        : [];

    const rfcTargetProductMapByRFCId = groupByToMapSingle(
      rfcTargetProducts,
      (item) => item.rfcRoomProductId
    );

    const rfcTargetProductMapByTargetId = groupByToMap(
      rfcTargetProducts,
      (item) => item.targetRoomProductId
    );

    rfcReversedProducts = rfcReversedProducts.filter((item) => {
      return rfcTargetProductMapByRFCId.get(item.id);
    });

    const targetProductIds = Array.from(
      new Set(rfcTargetProducts.map((item) => item.targetRoomProductId))
    ).filter((id) => roomProductIds.includes(id));
    const rfcReversedProductIds = rfcReversedProducts
      .map((item) => item.id)
      .filter((item) => {
        const targetId = rfcTargetProductMapByRFCId.get(item)?.targetRoomProductId;
        return targetId && targetProductIds.includes(targetId);
      });

    const dailySellingPrices =
      rfcReversedProductIds &&
      rfcReversedProductIds.length > 0 &&
      targetProductIds &&
      targetProductIds.length > 0
        ? await this.roomProductRatePlanRepositoryCustom.findDailySellingPrices({
            roomProductIds: [...rfcReversedProductIds, ...targetProductIds],
            ratePlanIds: [body.salesPlanId],
            dates: datesFiltered
          })
        : [];

    const dailySellingPriceMap = groupByToMapSingle(
      dailySellingPrices,
      (item) => `${item.roomProductId}-${item.date}`
    );

    const listAdjustments: any = [];

    let allowedRoomProductIds = roomProducts
      .filter((item) => roomProductTypeList.includes(item.type))
      .map((item) => item.id);

    let pricingCalculation: PricingCalculateResult | undefined;
    if (rfcReversedProductIds && rfcReversedProductIds.length > 0) {
      pricingCalculation = await this.pricingCalculateService.calculateWithBatch({
        fromDate: body.fromDate,
        toDate: body.toDate,
        adults: 1,
        childrenAges: [],
        hotel: hotel,
        isIncludeCityTax: false,
        isIncludeExtraBed: true,
        isIncludeOccupancySurcharge: false,
        isIncludeService: true,
        pets: 0,
        roomProductDailySellingPrices: dailySellingPrices,
        taxSettings: []
      });
    }

    for (const date of datesFiltered) {
      const dailyAvailabilityRoomProductRatePlanIds = roomProductRatePlanAvailabilityAdjustments
        .filter((item) => item.date === date && item.isSellable)
        .map((item) => item.roomProductRatePlanId);

      const roomProductSellableIds = roomProductRatePlans
        .filter((item) => {
          let isSellable = item.isSellable;
          if (dailyAvailabilityRoomProductRatePlanIds.includes(item.id)) {
            isSellable = true;
          }
          return isSellable;
        })
        .map((item) => item.roomProductId);

      const filteredRoomProductIds = allowedRoomProductIds.filter((item) =>
        roomProductSellableIds.includes(item)
      );

      if (filteredRoomProductIds.length === 0) {
        continue;
      }

      const lowestPriceRecord = await this.roomProductDailySellingPriceRepository
        .createQueryBuilder('selling_price')
        .innerJoin('room_product', 'rp', 'rp.id = selling_price.room_product_id')
        .innerJoin(
          'room_product_daily_availability',
          'rpdav',
          'rpdav.room_product_id = selling_price.room_product_id'
        )
        .where('selling_price.hotel_id = :hotelId', { hotelId: hotel.id })
        .andWhere('selling_price.room_product_id IN (:...roomProductIds)', {
          roomProductIds: filteredRoomProductIds
        })
        .andWhere('rpdav.date = :date', { date: date })
        .andWhere('rpdav.available > 0')
        .andWhere('selling_price.rate_plan_id = :ratePlanId', { ratePlanId: body.salesPlanId })
        .andWhere('rp.type IN (:...roomProductTypes)', {
          roomProductTypes: roomProductTypeList
        })
        .andWhere('selling_price.date = :date', { date: date })
        .orderBy('selling_price.date', 'ASC')
        .addOrderBy('selling_price.base_price', 'ASC')
        .getOne();

      if (!lowestPriceRecord) {
        continue;
      }

      const isRfcReversedProduct = rfcReversedProductIds.includes(lowestPriceRecord.roomProductId);

      let convertToPercent = 0;

      let isCalculate = false;

      if (isRfcReversedProduct) {
        const targetId = rfcTargetProductMapByRFCId.get(
          lowestPriceRecord.roomProductId
        )?.targetRoomProductId;
        const targetDailySellingPrice = dailySellingPriceMap.get(`${targetId}-${date}`);

        if (targetId && targetDailySellingPrice) {
          const relatedIds =
            rfcTargetProductMapByTargetId.get(targetId)?.map((item) => item.rfcRoomProductId) || [];

          const relatedDailySellingPrice =
            relatedIds
              .map((id) => dailySellingPriceMap.get(`${id}-${date}`))
              .filter((item) => !!item) || [];

          const averagePrice =
            relatedDailySellingPrice && relatedDailySellingPrice.length > 0
              ? relatedDailySellingPrice.reduce((acc, curr) => acc + (curr?.basePrice || 0), 0) /
                relatedDailySellingPrice.length
              : 0;

          let extraPrice = 0;
          let targeExtraPrice = 0;
          if (pricingCalculation) {
            extraPrice =
              pricingCalculation.roomProductDailySellingPrices
                .find(
                  (item) =>
                    item.roomProductId === lowestPriceRecord.roomProductId &&
                    item.date === date &&
                    item.ratePlanId === body.salesPlanId
                )
                ?.hotelAmenityPrices.reduce(
                  (acc, curr) => acc + (curr?.totalGrossAmount?.toNumber() || 0),
                  0
                ) || 0;

            targeExtraPrice =
              pricingCalculation.roomProductDailySellingPrices
                .find(
                  (item) =>
                    item.roomProductId === targetId &&
                    item.date === date &&
                    item.ratePlanId === body.salesPlanId
                )
                ?.hotelAmenityPrices.reduce(
                  (acc, curr) => acc + (curr?.totalGrossAmount?.toNumber() || 0),
                  0
                ) || 0;
          }

          const lowestPrice = DecimalRoundingHelper.applyRounding(
            lowestPriceRecord.basePrice,
            RoundingModeEnum.HALF_UP,
            0
          );
          const cal = new Decimal(body.targetPrice)
            .sub(extraPrice)
            .sub(lowestPrice)
            .div(lowestPriceRecord.basePrice)
            .mul(100);

          convertToPercent = cal.toNumber();

          // convertToPercent =
          //   (((body.targetPrice -
          //     extraPrice -
          //     DecimalRoundingHelper.applyRounding(
          //       lowestPriceRecord.basePrice,
          //       RoundingModeEnum.HALF_UP,
          //       2
          //     )) *
          //     (lowestPriceRecord.basePrice / targetDailySellingPrice.basePrice)) /
          //     targetDailySellingPrice.basePrice) *
          //   100;

          // convertToPercent = (lowestPriceRecord.basePrice / targetDailySellingPrice.basePrice)
          // * body.targetPrice - extraPrice - targetDailySellingPrice.basePrice
          // convertToPercent =
          //   ((body.targetPrice - extraPrice) /
          //     ((targetDailySellingPrice.basePrice * lowestPriceRecord.basePrice) / averagePrice) -
          //     1) *
          //   100;

          isCalculate = true;
        }
      }

      if (!isCalculate) {
        const newRatePlanAdjustments =
          body.targetPrice -
          body.basePrice -
          (body.currentISELowestSellingPrice - body.ratePlanAdjustments - body.basePrice); // extra;
        convertToPercent = (newRatePlanAdjustments / lowestPriceRecord.basePrice) * 100;
      }

      listAdjustments.push({
        hotelId: hotel.id,
        ratePlanId: body.salesPlanId,
        date: date,
        adjustmentValue: convertToPercent.toString(),
        adjustmentType: RatePlanAdjustmentType.PERCENTAGE,
        dayOfWeek: body.dayList.map((day) => FEWeekdayToWeekday[day])
      });
    }

    const result = await this.ratePlanDailyAdjustmentRepository.upsert(listAdjustments, {
      conflictPaths: ['hotelId', 'ratePlanId', 'date']
    });
    const syncData =
      await this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail({
        hotelId: hotel.id,
        ratePlanIds: [body.salesPlanId],
        from: body.fromDate,
        to: body.toDate
      });
    return { result, syncData };
  }

  async roomProductDailyRateDetails(body: RoomProductDailyRateDetailsFilter) {
    const {
      hotelCode,
      rfcRatePlanId,
      rfcId,
      fromDate,
      toDate,
      guestCount,
      isIncludedCityTax,
      isIncludedDailyExtrasPricing
    } = body;
    const [hotel, roomProductRatePlan] = await Promise.all([
      this.hotelRepository.findOne({ where: { code: hotelCode } }),
      this.roomProductRatePlanRepository.findOne({
        where: { id: rfcRatePlanId },
        relations: ['roomProduct', 'ratePlan']
      })
    ]);
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }
    if (!roomProductRatePlan) {
      throw new BadRequestException('Room product Rate plan not found');
    }
    const roomProduct = roomProductRatePlan.roomProduct;
    const ratePlan = roomProductRatePlan.ratePlan;
    const dates = eachDayOfInterval({ start: new Date(fromDate), end: new Date(toDate) }).map(
      (date) => format(date, 'yyyy-MM-dd')
    );

    let relatedRoomProductIds: string[] = [];
    let targetRoomProductIds: string[] = [];
    if (roomProduct.type === RoomProductType.RFC) {
      const targetProducts = await this.roomProductPricingService.getTargetForRFCRoomProduct({
        hotelId: hotel.id,
        rfcRoomProductIds: [rfcId],
        targetRoomProductTypes: [RoomProductType.MRFC, RoomProductType.ERFC]
      });
      targetRoomProductIds = targetProducts.map((item) => item.targetRoomProductId);
    } else {
      relatedRoomProductIds = await this.roomProductPricingService.getRelatedRoomProductIds({
        hotelId: hotel.id,
        roomProductId: rfcId,
        roomProductType: roomProduct.type
      });
    }

    const [
      roomUnits,
      roomProductPricingMethodDetails,
      roomProductRatePlans,
      roomProductMappings,
      roomProductDailySellingPrices,
      relatedRoomProductDailySellingPrices,
      ratePlanDailyAdjustments,
      hotelTaxSettings,
      hotelConfigRounding,
      roomProductRetailFeatures,
      featureDailyRates,
      relatedRoomProductList,
      roomProductBasePriceSettings,
      relatedRoomProductDailyAvailabilities
    ] = await Promise.all([
      this.roomUnitRepository.find({
        where: { roomProductAssignedUnits: { roomProductId: In([rfcId]) } }
      }),
      this.roomProductPricingMethodDetailRepository.find({
        where: { hotelId: hotel.id, roomProductId: In([rfcId]) },
        select: {
          id: true,
          hotelId: true,
          roomProductId: true,
          targetRoomProductId: true,
          targetRoomProduct: {
            id: true,
            code: true,
            name: true
          },
          ratePlanId: true,
          pricingMethod: true,
          pricingMethodAdjustmentValue: true,
          pricingMethodAdjustmentUnit: true
        },
        relations: ['targetRoomProduct']
      }),
      this.roomProductRatePlanRepository.find({
        where: {
          roomProductId: In([rfcId, ...targetRoomProductIds, ...relatedRoomProductIds]),
          ratePlanId: In([ratePlan.id])
        }
      }),
      this.roomProductMappingRepository.find({
        where: [
          { hotelId: hotel.id, roomProductId: rfcId },
          { hotelId: hotel.id, relatedRoomProductId: rfcId }
        ],
        relations: {
          roomProduct: true
        },
        select: {
          id: true,
          roomProductId: true,
          relatedRoomProductId: true,

          roomProduct: {
            id: true,
            code: true,
            name: true
          }
        }
      }),
      this.roomProductDailySellingPriceRepository.find({
        where: {
          hotelId: hotel.id,
          roomProductId: In([rfcId]),
          ratePlanId: In([ratePlan.id]),
          date: In(dates)
        }
      }),
      relatedRoomProductIds.length > 0 || targetRoomProductIds.length > 0
        ? this.roomProductDailySellingPriceRepository.find({
            where: {
              hotelId: hotel.id,
              roomProductId: In([...relatedRoomProductIds, ...targetRoomProductIds]),
              ratePlanId: In([ratePlan.id]),
              date: In(dates)
            }
          })
        : [],
      this.ratePlanDailyAdjustmentRepository.find({
        where: { hotelId: hotel.id, ratePlanId: In([ratePlan.id]), date: In(dates) }
      }),
      this.hotelTaxSettingRepository.find({
        where: { hotelId: hotel.id },
        relations: ['hotelTax']
      }),
      this.hotelConfigRepository.findOne({
        where: {
          hotelId: hotel.id,
          configType: HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE
        }
      }),
      this.featurePricingService.getRoomProductRetailFeatures({
        hotelId: hotel.id,
        roomProductIds: [rfcId]
      }),
      this.featurePricingService.getDailyOrDefaultFeatureRate({
        hotelId: hotel.id,
        roomProductIds: [rfcId],
        dates: dates
      }),
      this.roomProductRepository.find({
        where: { id: In(relatedRoomProductIds) },
        select: {
          id: true,
          code: true,
          name: true
        }
      }),
      this.roomProductBasePriceSettingRepository.find({
        where: { hotelId: hotel.id, roomProductId: rfcId }
      }),
      relatedRoomProductIds.length > 0 || targetRoomProductIds.length > 0
        ? this.roomProductDailyAvailabilityRepository.find({
            where: {
              hotelId: hotel.id,
              roomProductId: In([...relatedRoomProductIds, ...targetRoomProductIds]),
              date: In(dates)
            }
          })
        : []
    ]);

    let decimalRoundingRule = new HotelPricingDecimalRoundingRuleDto();
    if (hotelConfigRounding) {
      const configValue =
        hotelConfigRounding.configValue as HotelPricingDecimalRoundingRuleConfigValue;
      if (configValue.metadata) {
        decimalRoundingRule = {
          decimalUnits: configValue.metadata.decimalUnits,
          roundingMode: configValue.metadata.roundingMode
        };
      }
    }

    const calculated = await this.pricingCalculateService.calculateWithBatch({
      hotel,
      fromDate,
      toDate,
      adults: guestCount,
      childrenAges: [],
      pets: 0,
      roomProductDailySellingPrices: roomProductDailySellingPrices,
      taxSettings: hotelTaxSettings,
      isIncludeCityTax: isIncludedCityTax,
      isIncludeOccupancySurcharge: true, // hardcode true because it auto include by guestCount = 2
      isIncludeExtraBed: true,
      isIncludeService: isIncludedDailyExtrasPricing
    });

    return RatePlanUtils.mappingRoomProductDailyRateDetails({
      hotel,
      roomProduct,
      roomUnits,
      rateplans: [ratePlan],
      roomProductPricingMethodDetails,
      roomProductRatePlans,
      roomProductMappings,
      roomProductRetailFeatures,
      featureDailyRates,
      roomProductDailySellingPrices,
      relatedRoomProductDailySellingPrices,
      ratePlanDailyAdjustments,
      calculated,
      hotelTaxSettings,
      decimalUnits: decimalRoundingRule.decimalUnits,
      relatedRoomProductList,
      roomProductBasePriceSettings,
      relatedRoomProductDailyAvailabilities
    });
  }

  async getApaleoRatePlanPmsMappingList(filter: ApaleoRatePlanPmsMappingListFilter) {
    const where: FindOptionsWhere<ApaleoRatePlanPmsMapping> = {
      hotelId: filter.hotelId
    };
    if (filter.ratePlanIds) {
      where.ratePlanId = In(filter.ratePlanIds);
    }
    if (filter.roomProductIds) {
      where.roomProductId = In(filter.roomProductIds);
    }
    return this.apaleoRatePlanPmsMappingRepository.find({
      where
    });
  }

  async createOrUpdateApaleoRoomProductRatePlanPmsMapping(
    body: ApaleoRoomProductRatePlanPmsMappingBulkInput
  ) {
    const { hotelId, mappingList } = body;

    if (!mappingList || mappingList.length === 0) {
      await this.apaleoRatePlanPmsMappingRepository.delete({ hotelId: hotelId });
      return null;
    }

    const insertItems: ApaleoRatePlanPmsMapping[] = [];
    const updateItems: ApaleoRatePlanPmsMapping[] = [];
    const deleteItems: ApaleoRatePlanPmsMapping[] = [];

    const existingItems = await this.apaleoRatePlanPmsMappingRepository.find({
      where: { hotelId: hotelId },
      select: {
        id: true,
        ratePlanId: true,
        roomProductId: true,
        mappingRatePlanCode: true
      }
    });

    const existingItemsMap = groupByToMapSingle(
      existingItems,
      (item) => `${item.ratePlanId}-${item.roomProductId}`
    );

    const mappingListMap = groupByToMapSingle(
      mappingList,
      (item) => `${item.ratePlanId}-${item.roomProductId}`
    );

    for (const item of mappingList) {
      const existingItem = existingItemsMap.get(`${item.ratePlanId}-${item.roomProductId}`);
      if (existingItem) {
        if (item.mappingRatePlanCode) {
          if (existingItem.mappingRatePlanCode !== item.mappingRatePlanCode) {
            updateItems.push({
              ...existingItem,
              updatedAt: new Date(),
              mappingRatePlanCode: item.mappingRatePlanCode
            });
          }
        } else {
          deleteItems.push(existingItem);
        }
      } else {
        const newItem = this.apaleoRatePlanPmsMappingRepository.create({
          hotelId: body.hotelId,
          ratePlanId: item.ratePlanId,
          roomProductId: item.roomProductId,
          mappingRatePlanCode: item.mappingRatePlanCode
        });
        insertItems.push(newItem);
      }
    }

    deleteItems.push(
      ...existingItems.filter(
        (item) => !mappingListMap.has(`${item.ratePlanId}-${item.roomProductId}`)
      )
    );

    await this.dataSource.transaction(async (trx) => {
      if (insertItems.length > 0) {
        await trx.insert(ApaleoRatePlanPmsMapping, insertItems);
      }
      if (updateItems.length > 0) {
        await Promise.all(
          updateItems.map((item) => {
            trx.update(ApaleoRatePlanPmsMapping, item.id, {
              mappingRatePlanCode: item.mappingRatePlanCode,
              updatedAt: item.updatedAt
            });
          })
        );
      }
      if (deleteItems.length > 0) {
        await trx.delete(ApaleoRatePlanPmsMapping, { id: In(deleteItems.map((item) => item.id)) });
      }
    });

    return null;
  }

  async createOrUpdateApaleoRatePlanPmsMapping(body: ApaleoRatePlanPmsMappingBulkInput) {
    const { hotelId, mappingList = [] } = body;

    const updateItems: RatePlan[] = [];
    const deleteItems: RatePlan[] = [];

    const ratePlanIds = mappingList.map((item) => item.ratePlanId);

    const existingItems = await this.ratePlanRepository.find({
      where: { id: In(ratePlanIds), hotelId: hotelId },
      select: {
        id: true,
        pmsMappingRatePlanCode: true
      }
    });

    const existingItemsMap = groupByToMapSingle(existingItems, (item) => `${item.id}`);

    const mappingListMap = groupByToMapSingle(mappingList, (item) => `${item.ratePlanId}`);

    for (const item of mappingList) {
      const existingItem = existingItemsMap.get(`${item.ratePlanId}`);
      if (existingItem) {
        if (item.mappingRatePlanCode) {
          if (existingItem.pmsMappingRatePlanCode !== item.mappingRatePlanCode) {
            updateItems.push({
              ...existingItem,
              updatedAt: new Date(),
              pmsMappingRatePlanCode: item.mappingRatePlanCode
            });
          }
        } else {
          updateItems.push({
            ...existingItem,
            updatedAt: new Date(),
            pmsMappingRatePlanCode: undefined
          });
        }
      } else {
        throw new BadRequestException('Rate plan not found');
      }
    }

    await this.dataSource.transaction(async (trx) => {
      if (updateItems.length > 0) {
        await Promise.all(
          updateItems.map((item) => {
            trx.update(RatePlan, item.id, {
              pmsMappingRatePlanCode: item.pmsMappingRatePlanCode,
              updatedAt: item.updatedAt
            });
          })
        );
      }
    });

    return null;
  }
}
