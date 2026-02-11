import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RoomUnitAvailability,
  RoomUnitAvailabilityStatus
} from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { ReservationAmenity } from '@src/core/entities/booking-entities/reservation-amenity.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import {
  Reservation,
  ReservationStatusEnum
} from '@src/core/entities/booking-entities/reservation.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import {
  HotelConfigurationTypeEnum,
  RoomProductStatus,
  RoundingModeEnum,
  TaxSettingEnum
} from 'src/core/enums/common';
import { BadRequestException } from 'src/core/exceptions';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { BaseService } from 'src/core/services/base.service';
import { Between, In, IsNull, Not, Raw, Repository } from 'typeorm';
import { MonthlyRatePlanOverviewFilterDto, MonthlyRatePlanOverviewResponseDto } from '../dto';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { addDays, endOfDay, format, startOfDay, subDays } from 'date-fns';
import { ReservationAmenityDate } from '@src/core/entities/booking-entities/reservation-amenity-date.entity';

/**
 * Repository for calculating monthly rate plan overview metrics and analytics.
 *
 * This service provides comprehensive KPIs including:
 * - Occupancy rates and room night calculations
 * - Average Daily Rate (ADR) metrics
 * - Revenue calculations with tax handling
 * - 7-day trend analysis for pace and pickup metrics
 *
 * All calculations are optimized for performance using parallel data processing
 * and respect hotel-specific rounding and tax configuration settings.
 */
@Injectable()
export class RatePlanOverviewRepository extends BaseService {
  private readonly logger = new Logger(RatePlanOverviewRepository.name);

  constructor(
    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationTimeSlice, DbName.Postgres)
    private readonly reservationTimeSliceRepository: Repository<ReservationTimeSlice>,
    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,
    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,
    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,
    @InjectRepository(ReservationAmenity, DbName.Postgres)
    private readonly reservationAmenityRepository: Repository<ReservationAmenity>,

    @InjectRepository(ReservationAmenityDate, DbName.Postgres)
    private readonly reservationAmenityDateRepository: Repository<ReservationAmenityDate>,

    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Calculates comprehensive monthly rate plan overview metrics for a hotel.
   *
   * This method performs the following operations:
   * 1. Validates input parameters and fetches hotel configuration
   * 2. Calculates date ranges for the specified month and 7-day periods
   * 3. Fetches reservation and availability data in parallel
   * 4. Calculates all metrics (occupancy, ADR, revenue, trends) in parallel
   * 5. Applies hotel-specific rounding rules and returns formatted response
   *
   * @param filter - Contains hotelId, month name, and year
   * @returns Promise<MonthlyRatePlanOverviewResponseDto> - Complete overview metrics
   * @throws BadRequestException - When hotelId is missing
   * @throws InternalServerErrorException - When calculation or database errors occur
   *
   * @example
   * Input:
   * {
   *   hotelId: "3efd68e5-043d-46ae-9f8f-6fbf91da7865",
   *   month: "OCTOBER",
   *   year: 2025
   * }
   *
   * Output:
   * {
   *   propertyId: "3efd68e5-043d-46ae-9f8f-6fbf91da7865",
   *   month: "OCTOBER",
   *   year: "2025",
   *   occupancy: 0.3400,              // 34% occupancy (31/93 rooms)
   *   adr: 208.03,                    // $208.03 average daily rate
   *   totalRoomRevenue: 6449.0000,    // $6,449 total revenue
   *   roomNights: 31,                 // 31 room nights sold
   *   sevenDayOccupancyPaceTrend: 0.0200,        // 2% occupancy increase
   *   sevenDayPickupAdr: -172.23,                // ADR decreased 172.23%
   *   sevenDayAvgDailyRoomPickup: 0,             // 0 rooms/day in last 7 days
   *   sevenDayRoomNights: 0,                     // 0 room nights in last 7 days
   *   sevenDayCancellationCount: 0,              // 0 cancellations
   *   sevenDayPickupAdrBefore: 380.26,           // Previous period ADR
   *   sevenDayOccupancyPaceTrendBefore: 0.34     // Previous period occupancy
   * }
   */
  async monthlyRatePlanOverview(
    filter: MonthlyRatePlanOverviewFilterDto
  ): Promise<MonthlyRatePlanOverviewResponseDto> {
    const { hotelId, month, year } = filter;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    try {
      // 1. Get basic hotel configuration data in parallel for optimal performance
      // This includes rounding rules, decimal precision, and tax settings
      const [hotelConfig, hotel] = await Promise.all([
        this.getHotelConfigRoundingMode(hotelId),
        this.getHotelBasicInfo(hotelId)
      ]);

      // 2. Calculate date ranges for the specified month and 7-day analysis periods
      const monthNumber = this.getMonthNumber(month);
      const fromDate = new Date(year, monthNumber - 1, 1); // First day of month
      const toDate = new Date(year, monthNumber, 0); // Last day of month
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago for trend analysis

      // 3. Get main data in parallel for optimal database performance
      // Fetches non-cancelled reservations and room availability data simultaneously
      let [nonCancelledReservations, roomAvailability] = await Promise.all([
        this.getNonCancelledReservations(hotelId, fromDate, toDate),
        this.getRoomAvailability(hotelId, fromDate, toDate)
      ]);

      // 3.5. Get reservation time slices for accurate daily revenue calculations
      // This matches Java's approach of using time slice data instead of total reservation amounts
      // nonCancelledReservations = nonCancelledReservations.filter((reservation) => reservation.id === "9ea267d3-af7f-4945-b101-e9586c00ac46");
      // const reservationTimeSlices = await this.getReservationTimeSlices(nonCancelledReservations);
      const [reservationTimeSlices, reservationAmenitiesDate] = await Promise.all([
        this.reservationTimeSliceRepository.find({
          where: {
            deletedAt: IsNull(),
            reservation: {
              status: In([
                ReservationStatusEnum.COMPLETED,
                ReservationStatusEnum.CONFIRMED,
                ReservationStatusEnum.RESERVED
              ]),
              hotelId,
              deletedAt: IsNull()
            },
            fromTime: Raw((alias) => `${alias} >= :fromDate AND ${alias} < :toDate`, {
              fromDate: format(fromDate, DATE_FORMAT),
              toDate: format(addDays(toDate, 1), DATE_FORMAT)
            })
          },
          select: {
            id: true,
            reservationId: true,
            fromTime: true,
            toTime: true,
            totalBaseAmount: true,
            totalGrossAmount: true,
            taxAmount: true
          },
          order: {
            fromTime: 'DESC'
          }
        }),

        this.reservationAmenityDateRepository.find({
          where: {
            deletedAt: IsNull(),
            reservationAmenity: {
              reservation: {
                status: In([
                  ReservationStatusEnum.COMPLETED,
                  ReservationStatusEnum.CONFIRMED,
                  ReservationStatusEnum.RESERVED
                ]),
                hotelId,
                deletedAt: IsNull()
              },
              deletedAt: IsNull()
            },
            date: Raw((alias) => `${alias} >= :fromDate AND ${alias} < :toDate`, {
              fromDate: format(fromDate, DATE_FORMAT),
              toDate: format(addDays(toDate, 1), DATE_FORMAT)
            })
          },
          select: {
            id: true,
            reservationAmenityId: true,
            date: true,
            totalBaseAmount: true,
            totalGrossAmount: true,
            taxAmount: true
          },
          order: {
            date: 'DESC'
          }
        })
      ]);

      const rev = this.calculateTimeSliceRevenue(
        reservationTimeSlices,
        hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
        hotelConfig
      );

      const reservationAmenities = await this.getReservationAmenities(nonCancelledReservations);

      const amenityRevenue = this.calculateAmenityRevenue(
        reservationAmenities,
        hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
        hotelConfig
      );

      const amenityRevenueDate = this.calculateAmenityRevenueDate(
        reservationAmenitiesDate,
        hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
        hotelConfig
      );

      const calculateReservationRevenue = this.calculateReservationRevenue(
        nonCancelledReservations,
        hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
        hotelConfig
      );
      const totalCityTax = reservationTimeSlices.reduce((sum, reservation) => {
        return sum + (reservation.taxAmount || 0);
      }, 0);

      // 4. Calculate all metrics in parallel for maximum performance
      // Each calculation is independent and can run simultaneously
      const [occupancyMetrics, adrMetrics, revenueMetrics, sevenDayMetrics] = await Promise.all([
        this.calculateOccupancyMetrics(nonCancelledReservations, roomAvailability),
        this.calculateADRMetrics(
          nonCancelledReservations,
          reservationTimeSlices,
          fromDate,
          toDate,
          hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
          hotelConfig
        ),
        this.calculateRevenueMetrics(
          reservationTimeSlices,
          fromDate,
          toDate,
          hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
          hotelConfig
        ),
        this.calculateSevenDayMetrics(
          hotelId,
          fromDate,
          toDate,
          pastDate,
          hotel.taxSetting || TaxSettingEnum.INCLUSIVE,
          hotelConfig,
          roomAvailability
        )
      ]);

      // 5. Assemble response with proper rounding and formatting
      // All monetary values use hotel-specific rounding rules
      // Percentage values are converted to decimals for consistency

      const accommodationRevenue = rev - amenityRevenueDate;
      const adr =
        adrMetrics.totalRoomNights > 0 ? accommodationRevenue / adrMetrics.totalRoomNights : 0;

      return {
        propertyId: hotelId,
        hotelTaxSetting: hotel.taxSetting,
        month: month,
        year: year.toString(),
        amenityRevenue: amenityRevenueDate,
        accommodationRevenue,
        // Convert occupancy percentage to decimal (0-1 range)
        occupancy: DecimalRoundingHelper.applyRounding(
          occupancyMetrics.occupancyRate / 100,
          RoundingModeEnum.HALF_UP,
          4
        ),
        // Apply hotel-specific rounding for ADR
        adr: this.applyRoundingWithFallback(
          adr,
          hotelConfig.roundingMode,
          hotelConfig.decimalPlaces
        ),
        // Apply hotel-specific rounding for total revenue
        totalRoomRevenue: this.applyRoundingWithFallback(
          revenueMetrics.totalRevenue,
          hotelConfig.roundingMode,
          hotelConfig.decimalPlaces
        ),
        // Convert 7-day occupancy trend percentage to decimal
        sevenDayOccupancyPaceTrend: DecimalRoundingHelper.applyRounding(
          sevenDayMetrics.occupancyPaceTrend / 100,
          RoundingModeEnum.HALF_UP,
          4
        ),
        // 7-day ADR pickup percentage (standard 2 decimal places)
        sevenDayPickupAdr: DecimalRoundingHelper.applyRounding(
          sevenDayMetrics.adrPickup,
          RoundingModeEnum.HALF_UP,
          2
        ),
        // Average daily room pickup (standard 2 decimal places)
        sevenDayAvgDailyRoomPickup: DecimalRoundingHelper.applyRounding(
          sevenDayMetrics.averageDailyRoomPickup,
          RoundingModeEnum.HALF_UP,
          2
        ),
        // Raw counts (no rounding needed)
        roomNights: adrMetrics.totalRoomNights,
        growthRevenue: sevenDayMetrics.growthRevenue,
        sevenDayRoomNights: sevenDayMetrics.currentRoomNights,
        sevenDayCancellationCount: -sevenDayMetrics.cancellationCount,
        // Previous period ADR (standard 2 decimal places)
        sevenDayPickupAdrBefore: DecimalRoundingHelper.applyRounding(
          sevenDayMetrics.pastADR,
          RoundingModeEnum.HALF_UP,
          2
        ),
        // Previous period occupancy trend (converted to decimal)
        sevenDayOccupancyPaceTrendBefore: DecimalRoundingHelper.applyRounding(
          sevenDayMetrics.pastRoomNights > 0
            ? sevenDayMetrics.pastRoomNights /
                (sevenDayMetrics.pastRoomNights + sevenDayMetrics.currentRoomNights)
            : 0,
          RoundingModeEnum.HALF_UP,
          4
        ),
        sevenDayAccommodationRevenue: sevenDayMetrics.sevenDayAccommodationRevenue,
        sevenDayExtra: sevenDayMetrics.sevenDayExtra
      };
    } catch (error) {
      this.logger.error('Failed to get monthly rate plan overview', JSON.stringify(error));
      throw new InternalServerErrorException(
        'Failed to get monthly rate plan overview',
        error.message
      );
    }
  }

  // Helper methods for monthly rate plan overview
  private async getHotelConfigRoundingMode(
    hotelId: string
  ): Promise<{ roundingMode: RoundingModeEnum; decimalPlaces: number }> {
    let defaultConfig = {
      roundingMode: RoundingModeEnum.NO_ROUNDING,
      decimalPlaces: 2
    };

    const config = await this.hotelConfigurationRepository.findOne({
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

  private async getHotelBasicInfo(hotelId: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      select: {
        id: true,
        timeZone: true,
        taxSetting: true,
        serviceChargeSetting: true
      }
    });

    if (!hotel) {
      throw new BadRequestException(`Hotel with ID ${hotelId} not found`);
    }

    return hotel;
  }

  private async getNonCancelledReservations(
    hotelId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Reservation[]> {
    const r = await this.reservationRepository.find({
      where: {
        deletedAt: IsNull(),
        hotelId,
        status: Not(In([ReservationStatusEnum.CANCELLED, ReservationStatusEnum.PAYMENT_FAILED])),
        arrival: Raw((alias) => `${alias} >= :fromDate AND ${alias} < :toDate`, {
          fromDate: format(fromDate, DATE_FORMAT),
          toDate: format(addDays(toDate, 1), DATE_FORMAT)
        }),
        departure: Raw((alias) => `${alias} < :toDate`, {
          toDate: format(addDays(toDate, 1), DATE_FORMAT)
        })
      },
      select: {
        id: true,
        arrival: true,
        departure: true,
        totalBaseAmount: true,
        totalGrossAmount: true,
        taxAmount: true,
        status: true,
        roomProductId: true,
        ratePlanId: true,
        cityTaxAmount: true
      },
      order: {
        arrival: 'DESC'
      }
    });

    return r;
  }

  private async getCancelledReservations(
    hotelId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: {
        hotelId,
        status: ReservationStatusEnum.CANCELLED,
        arrival: Raw((alias) => `${alias} >= :fromDate AND ${alias} <= :toDate`, {
          fromDate: fromDate.toISOString().split('T')[0],
          toDate: toDate.toISOString().split('T')[0]
        })
      },
      select: {
        id: true,
        arrival: true,
        departure: true,
        status: true
      }
    });
  }

  /**
   * Gets physical room unit availability following Java's logic chain:
   * 1. Get MRFC mappings (channel=GAUVENDI equivalent)
   * 2. Get MRFC products and validate they're active/draft
   * 3. Get RFC (standard room products) mapped to these MRFCs
   * 4. Get room units assigned to these room products
   * 5. Get room unit availability for the date range
   *
   * This matches Java's logic in SalesPlanCockpitServiceImpl lines 529-626
   */
  private async getRoomAvailability(
    hotelId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<RoomUnitAvailability[]> {
    // const a = await this.roomUnitAvailabilityRepository.find({
    //   where: {
    //     hotelId,
    //     date: Raw((alias) => `${alias} >= :fromDate AND ${alias} <= :toDate`, {
    //       fromDate: fromDate.toISOString().split('T')[0],
    //       toDate: toDate.toISOString().split('T')[0]
    //     })
    //     // status: In([RoomUnitAvailabilityStatus.AVAILABLE])
    //   }
    // });
    // return a;

    // Step 1: Get room product mappings (MRFC mappings for GAUVENDI channel)
    const roomProductMappings = await this.roomProductMappingRepository.find({
      where: { hotelId },
      select: { roomProductId: true, relatedRoomProductId: true }
    });

    if (roomProductMappings.length === 0) {
      return [];
    }

    // Step 2: Get MRFC IDs from mappings
    const mrfcIdList = [...new Set(roomProductMappings.map((m) => m.roomProductId))];

    // Step 3: Get MRFC products and validate they're active or draft
    const mrfcList = await this.roomProductRepository.find({
      where: {
        hotelId,
        id: In(mrfcIdList),
        deletedAt: IsNull()
      },
      select: { id: true, type: true, status: true }
    });

    if (mrfcList.length === 0) {
      return [];
    }

    // Step 4: Get standard room products (RFC) linked to these MRFCs
    // Filter by active/draft status
    const activeRfcIds = mrfcList
      .filter(
        (mrfc) =>
          mrfc.status === RoomProductStatus.ACTIVE || mrfc.status === RoomProductStatus.DRAFT
      )
      .map((mrfc) => mrfc.id);

    if (activeRfcIds.length === 0) {
      return [];
    }

    // Get the mapped room product codes (relatedRoomProductId from mappings with active MRFCs)
    const roomProductCodes = roomProductMappings
      .filter((m) => activeRfcIds.includes(m.roomProductId))
      .map((m) => m.relatedRoomProductId);

    if (roomProductCodes.length === 0) {
      return [];
    }

    // Step 5: Get room products by codes
    const roomProductList = await this.roomProductRepository.find({
      where: {
        hotelId,
        id: In(roomProductCodes),
        deletedAt: IsNull()
      },
      select: { id: true }
    });

    if (roomProductList.length === 0) {
      return [];
    }

    const roomProductIdList = roomProductList.map((rp) => rp.id);

    // Step 6: Get room units assigned to these room products
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: { roomProductId: In(roomProductIdList) },
      select: { roomUnitId: true }
    });

    const roomUnitIdList = [...new Set(roomProductAssignedUnits.map((rau) => rau.roomUnitId))];

    if (roomUnitIdList.length === 0) {
      return [];
    }

    // Step 7: Get room unit availability for the date range
    // Status filter matches Java: AVAILABLE, ASSIGNED, BLOCKED, OUT_OF_ORDER
    const ru = await this.roomUnitAvailabilityRepository.find({
      where: {
        hotelId,
        roomUnitId: In(roomUnitIdList),
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
      },
      select: {
        roomUnitId: true,
        date: true,
        status: true
      }
    });

    return ru;
  }

  /**
   * Calculates occupancy metrics including room nights sold and occupancy rate.
   *
   * Formula: Occupancy Rate = (Total Room Nights Sold / Total Room Nights Available) × 100
   *
   * Note: Now uses physical room unit availability instead of room product availability.
   * Total room nights available = count of room unit availability records across all dates.
   *
   * @param reservations - Non-cancelled reservations for the period
   * @param roomAvailability - Daily room unit availability data
   * @returns Object containing roomNightsSold, roomNightsAvailable, and occupancyRate
   *
   * @example
   * Given: 31 room nights sold, 93 room unit availabilities across date range
   * Result: occupancyRate = (31 / 93) × 100 = 33.33% (rounded to 2 decimal places)
   */
  private async calculateOccupancyMetrics(
    reservations: Reservation[],
    roomAvailability: RoomUnitAvailability[]
  ): Promise<any> {
    const totalRoomNightsSold = reservations.reduce((sum, reservation) => {
      if (reservation.arrival && reservation.departure) {
        const arrival = new Date(reservation.arrival);
        const departure = new Date(reservation.departure);
        const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }
      return sum;
    }, 0);

    // Total room nights available = count of all room unit availability records
    // Each record represents one room available for one night
    const totalRoomNightsAvailable = roomAvailability.length;

    const occupancyRate =
      totalRoomNightsAvailable > 0 ? (totalRoomNightsSold / totalRoomNightsAvailable) * 100 : 0;

    return {
      roomNightsSold: totalRoomNightsSold,
      roomNightsAvailable: totalRoomNightsAvailable,
      occupancyRate: DecimalRoundingHelper.applyRounding(occupancyRate, RoundingModeEnum.HALF_UP, 2) // Round to 2 decimal places
    };
  }

  /**
   * Calculates Average Daily Rate (ADR) using time slice data for accurate daily breakdown.
   *
   * Formula: ADR = Total Revenue (from time slices) / Total Room Nights Sold
   *
   * This matches Java's approach of using ReservationDailyTimeSliceInformationDto
   * for more accurate revenue calculation by summing daily amounts.
   *
   * @param reservations - Non-cancelled reservations for the period
   * @param timeSlices - Reservation time slices for daily breakdown
   * @param fromDate - Start date for filtering time slices
   * @param toDate - End date for filtering time slices
   * @param taxSetting - Hotel tax setting (INCLUSIVE or EXCLUSIVE)
   * @param roundingConfig - Hotel-specific rounding configuration
   * @returns Object containing totalRevenue, totalRoomNights, and adr
   *
   * @example
   * Given: Total Time Slice Revenue = $6,449, Room Nights = 31
   * Result: ADR = $6,449 / 31 = $208.03 (rounded to 2 decimal places)
   */
  private async calculateADRMetrics(
    reservations: Reservation[],
    timeSlices: ReservationTimeSlice[],
    fromDate: Date,
    toDate: Date,
    taxSetting: TaxSettingEnum,
    roundingConfig: any
  ): Promise<any> {
    // Filter time slices by date range
    const filteredTimeSlices = timeSlices.filter((slice) => {
      if (!slice.fromTime) return false;
      const sliceDate = new Date(slice.fromTime);
      return sliceDate >= fromDate && sliceDate < addDays(toDate, 1);
    });

    // Calculate total revenue from time slices (more accurate than using reservation totals)
    const totalRevenue = filteredTimeSlices.reduce((sum, slice) => {
      if (taxSetting === TaxSettingEnum.INCLUSIVE) {
        return sum + (slice.totalGrossAmount || 0);
      } else {
        return sum + (slice.totalBaseAmount || 0);
      }
    }, 0);

    // Calculate total room nights from reservations
    const totalRoomNights = filteredTimeSlices?.length;

    const adr = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;

    return {
      totalRevenue,
      totalRoomNights,
      adr: this.applyRoundingWithFallback(
        adr,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      )
    };
  }

  private calculateTimeSliceRevenue(
    timeSlices: ReservationTimeSlice[],
    taxSetting: TaxSettingEnum,
    roundingConfig: any
  ) {
    const totalRevenue = timeSlices.reduce((sum, timeSlice) => {
      if (taxSetting === TaxSettingEnum.INCLUSIVE) {
        return sum + (timeSlice.totalGrossAmount || 0);
      } else {
        return sum + (timeSlice.totalBaseAmount || 0);
      }
    }, 0);

    return this.applyRoundingWithFallback(
      totalRevenue,
      roundingConfig.roundingMode,
      roundingConfig.decimalPlaces
    );
  }

  private calculateReservationRevenue(
    reservations: Reservation[],
    taxSetting: TaxSettingEnum,
    roundingConfig: any
  ) {
    const totalRevenue = reservations.reduce((sum, reservation) => {
      if (taxSetting === TaxSettingEnum.INCLUSIVE) {
        return sum + (reservation.totalGrossAmount || 0);
      } else {
        return sum + (reservation.totalBaseAmount || 0);
      }
    }, 0);

    return this.applyRoundingWithFallback(
      totalRevenue,
      roundingConfig.roundingMode,
      roundingConfig.decimalPlaces
    );
  }

  private calculateAmenityRevenueDate(
    reservationAmenitieDate: ReservationAmenityDate[],
    taxSetting: TaxSettingEnum,
    roundingConfig: any
  ) {
    const totalRevenue = reservationAmenitieDate.reduce((sum, amenity) => {
      if (taxSetting === TaxSettingEnum.INCLUSIVE) {
        return sum + (amenity.totalGrossAmount || 0);
      } else {
        return sum + (amenity.totalBaseAmount || 0);
      }
    }, 0);

    return this.applyRoundingWithFallback(
      totalRevenue,
      roundingConfig.roundingMode,
      roundingConfig.decimalPlaces
    );
  }

  private calculateAmenityRevenue(
    reservationAmenities: ReservationAmenity[],
    taxSetting: TaxSettingEnum,
    roundingConfig: any
  ) {
    const totalRevenue = reservationAmenities.reduce((sum, amenity) => {
      if (taxSetting === TaxSettingEnum.INCLUSIVE) {
        return sum + (amenity.totalGrossAmount || 0);
      } else {
        return sum + (amenity.totalBaseAmount || 0);
      }
    }, 0);

    return this.applyRoundingWithFallback(
      totalRevenue,
      roundingConfig.roundingMode,
      roundingConfig.decimalPlaces
    );
  }

  /**
   * Calculates revenue metrics using time slice data for accurate daily breakdown.
   * This matches Java's getRevenue() method that uses daily time slice amounts.
   *
   * @param timeSlices - Reservation time slices for daily breakdown
   * @param fromDate - Start date for filtering
   * @param toDate - End date for filtering
   * @param taxSetting - Hotel tax setting
   * @param roundingConfig - Hotel-specific rounding configuration
   * @returns Object containing total, base, and tax revenue
   */
  private async calculateRevenueMetrics(
    timeSlices: ReservationTimeSlice[],
    fromDate: Date,
    toDate: Date,
    taxSetting: TaxSettingEnum,
    roundingConfig: any
  ): Promise<any> {
    // Filter time slices by date range
    const filteredTimeSlices = timeSlices.filter((slice) => {
      if (!slice.fromTime) return false;
      const sliceDate = new Date(slice.fromTime);
      return sliceDate >= fromDate && sliceDate <= toDate;
    });

    // Calculate total revenue from time slices
    const totalRevenue = filteredTimeSlices.reduce((sum, slice) => {
      if (taxSetting === TaxSettingEnum.INCLUSIVE) {
        return sum + (slice.totalGrossAmount || 0);
      } else {
        return sum + (slice.totalBaseAmount || 0);
      }
    }, 0);

    const baseRevenue = filteredTimeSlices.reduce((sum, slice) => {
      return sum + (slice.totalBaseAmount || 0);
    }, 0);

    const taxRevenue = filteredTimeSlices.reduce((sum, slice) => {
      return sum + (slice.taxAmount || 0);
    }, 0);

    return {
      totalRevenue: this.applyRoundingWithFallback(
        totalRevenue,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      ),
      baseRevenue: this.applyRoundingWithFallback(
        baseRevenue,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      ),
      taxRevenue: this.applyRoundingWithFallback(
        taxRevenue,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      ),
      taxSetting
    };
  }

  /**
   * Calculates 7-day trend metrics with complex logic matching Java implementation.
   *
   * This method implements Java's sophisticated 7-day metrics calculation including:
   * - Booking date filtering for accurate pace trends
   * - Cancelled reservation handling with pseudo time slices
   * - Average daily pickup based on bookings in last 7 days / total days in month
   * - Occupancy pace trend based on bookingDate and cancelledDate logic
   *
   * Current Period: Last 7 days of the month (e.g., Oct 25-31)
   * Past Period: 7 days before current period (e.g., Oct 18-24)
   * Booking Window: Last 7 days from today (for pickup calculations)
   *
   * @param hotelId - Hotel identifier
   * @param fromDate - Start of month
   * @param toDate - End of month
   * @param pastDate - 7 days ago from today (for booking date filtering)
   * @param taxSetting - Hotel tax setting
   * @param roundingConfig - Hotel rounding configuration
   * @returns Object containing all 7-day trend metrics
   */
  private async calculateSevenDayMetrics(
    hotelId: string,
    fromDate: Date,
    toDate: Date,
    pastDate: Date,
    taxSetting: TaxSettingEnum,
    roundingConfig: any,
    roomAvailability: RoomUnitAvailability[]
  ) {
    // Calculate 7-day periods for the month
    const currentPeriodEnd = toDate;
    const currentPeriodStart = new Date(currentPeriodEnd);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - 6);

    const pastPeriodEnd = new Date(currentPeriodStart);
    pastPeriodEnd.setDate(pastPeriodEnd.getDate() - 1);
    const pastPeriodStart = new Date(pastPeriodEnd);
    pastPeriodStart.setDate(pastPeriodStart.getDate() - 6);

    const currentDate = new Date();
    const last7Days = subDays(currentDate, 7);

    // Get ALL reservations for the month (including cancelled) with bookingDate

    const allReservations = await this.reservationRepository.find({
      where: {
        hotelId,
        arrival: Raw((alias) => `${alias} >= :fromDate AND ${alias} < :toDate`, {
          fromDate: format(fromDate, DATE_FORMAT),
          toDate: format(addDays(toDate, 1), DATE_FORMAT)
        }),
        deletedAt: IsNull()
      },
      select: {
        id: true,
        arrival: true,
        departure: true,
        totalBaseAmount: true,
        totalGrossAmount: true,
        taxAmount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        cityTaxAmount: true
      },
      order: {
        arrival: 'DESC'
      }
    });

    this.logger.log('ARRIVAL QUERY CHECK: ', {
      fromDate: format(fromDate, DATE_FORMAT),
      toDate: format(toDate, DATE_FORMAT)
    });

    // Separate into confirmed and cancelled
    const reservationsWithCancelled = allReservations.filter(
      (r) =>
        r.status === ReservationStatusEnum.CONFIRMED ||
        r.status === ReservationStatusEnum.RESERVED ||
        r.status === ReservationStatusEnum.CANCELLED ||
        r.status === ReservationStatusEnum.PAYMENT_FAILED
    );

    const cancelledReservations = allReservations.filter(
      (r) => r.status === ReservationStatusEnum.CANCELLED
    );

    // Calculate total days in month for average daily pickup
    const totalDaysInMonth =
      Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // ======= CURRENT PERIOD CALCULATIONS =======
    // Filter reservations in current period (last 7 days of month)
    const currentReservationWithoutCancelledAndPaymentFailed = reservationsWithCancelled.filter(
      (r) =>
        r.status !== ReservationStatusEnum.CANCELLED &&
        r.status !== ReservationStatusEnum.PAYMENT_FAILED
    );

    this.logger.debug(`currentPeriodStart: ${currentPeriodStart}`);
    this.logger.debug(`currentPeriodEnd: ${currentPeriodEnd}`);
    this.logger.debug(`pastPeriodStart: ${pastPeriodStart}`);
    this.logger.debug(`pastPeriodEnd: ${pastPeriodEnd}`);

    // Get time slices for current period
    const currentTimeSlices = await this.getReservationTimeSlices(
      currentReservationWithoutCancelledAndPaymentFailed
    );
    const filteredCurrentTimeSlices = currentTimeSlices;

    const currentRoomNights = this.calculateRoomNights(
      currentReservationWithoutCancelledAndPaymentFailed,
      currentDate,
      currentDate
    );
    const currentRevenue = filteredCurrentTimeSlices.reduce(
      (sum, slice) =>
        sum +
        (taxSetting === TaxSettingEnum.INCLUSIVE
          ? slice.totalGrossAmount || 0
          : slice.totalBaseAmount || 0),
      0
    );
    const currentADR = currentRoomNights > 0 ? currentRevenue / currentRoomNights : 0;

    // ======= PAST PERIOD CALCULATIONS WITH BOOKING DATE FILTERING =======
    // Filter reservations that were booked BEFORE pastDate (7 days ago)
    const pastPeriodReservationsBookedBefore = reservationsWithCancelled.filter((r) => {
      if (!r.createdAt) return false;

      const bookingDate = format(r.createdAt, DATE_FORMAT);
      const updatedDate = format(r.updatedAt, DATE_FORMAT);

      if (
        r.status === ReservationStatusEnum.CONFIRMED ||
        r.status === ReservationStatusEnum.RESERVED
      ) {
        return bookingDate < format(last7Days, DATE_FORMAT);
      } else if (r.status === ReservationStatusEnum.CANCELLED) {
        return (
          bookingDate < format(last7Days, DATE_FORMAT) &&
          updatedDate > format(last7Days, DATE_FORMAT)
        );
      }

      return false;
    });

    // Handle cancelled reservations that were booked before pastDate but cancelled after

    const pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed =
      pastPeriodReservationsBookedBefore.filter(
        (e) =>
          e.status !== ReservationStatusEnum.CANCELLED &&
          e.status !== ReservationStatusEnum.PAYMENT_FAILED
      );
    const filteredPastTimeSlices = await this.getReservationTimeSlices(
      pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed
    );

    // Add pseudo time slices for cancelled reservations
    let pastRevenue = filteredPastTimeSlices.reduce(
      (sum, slice) =>
        sum +
        (taxSetting === TaxSettingEnum.INCLUSIVE
          ? slice.totalGrossAmount || 0
          : slice.totalBaseAmount || 0),
      0
    );

    // Add revenue from cancelled reservations using pseudo time slices

    const pastRoomNights = this.calculateRoomNights(
      pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed,
      last7Days,
      last7Days
    );
    const pastADR = pastRoomNights > 0 ? pastRevenue / pastRoomNights : 0;

    // ======= AVERAGE DAILY ROOM PICKUP (Java formula) =======
    // Room nights booked in last 7 days / Total days in month
    const recentlyBookedReservations = reservationsWithCancelled.filter((r) => {
      if (!r.createdAt) return false;
      const bookingDate = new Date(r.createdAt);
      return bookingDate > pastDate; // Booked after pastDate (in last 7 days)
    });

    const recentlyBookedRoomNights = this.calculateRoomNightsByMonth(
      recentlyBookedReservations,
      fromDate,
      toDate
    );
    const averageDailyRoomPickup = recentlyBookedRoomNights / totalDaysInMonth;

    // ======= OCCUPANCY PACE TREND =======
    // Calculate occupancy pace trend as the difference between current and past occupancy percentages
    // Total room nights available = count of all room unit availability records
    const totalRoomNightsAvailable = roomAvailability.length;

    // Current occupancy: total room nights sold now / total available
    const currentTotalRoomNightsSold = reservationsWithCancelled.reduce((sum, reservation) => {
      if (reservation.arrival && reservation.departure) {
        const arrival = new Date(reservation.arrival);
        const departure = new Date(reservation.departure);
        const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }
      return sum;
    }, 0);
    const currentOccupancy =
      totalRoomNightsAvailable > 0
        ? (currentTotalRoomNightsSold / totalRoomNightsAvailable) * 100
        : 0;

    // Past occupancy (7 days ago): room nights sold as of 7 days ago / total available
    // Only count reservations that were booked before pastDate (7 days ago)
    const reservationsBookedBefore7DaysAgo = reservationsWithCancelled.filter((r) => {
      if (!r.createdAt) return false;
      const bookingDate = new Date(r.createdAt);
      const updatedDate = new Date(r.updatedAt);

      if (
        r.status === ReservationStatusEnum.CONFIRMED ||
        r.status === ReservationStatusEnum.RESERVED
      ) {
        return bookingDate <= last7Days;
      }

      return bookingDate <= last7Days && updatedDate > last7Days;
    });
    const pastTotalRoomNightsSold = reservationsBookedBefore7DaysAgo.reduce((sum, reservation) => {
      if (reservation.arrival && reservation.departure) {
        const arrival = new Date(reservation.arrival);
        const departure = new Date(reservation.departure);
        const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }
      return sum;
    }, 0);
    const pastOccupancy =
      totalRoomNightsAvailable > 0 ? (pastTotalRoomNightsSold / totalRoomNightsAvailable) * 100 : 0;

    // Occupancy Pace Trend = Current Occupancy - Past Occupancy
    // Positive means occupancy is going up, negative means going down, zero means constant
    const occupancyPaceTrend = currentOccupancy - pastOccupancy;

    // ======= ADR PICKUP =======
    const adrPickup = currentADR - pastADR;

    // ======= CANCELLATIONS IN LAST 7 DAYS =======
    const recentCancellations = cancelledReservations;

    const cancellationsLast7Days = cancelledReservations.filter((r) => {
      if (!r.updatedAt) return false;
      const cancelledDate = format(r.updatedAt, DATE_FORMAT);
      // const bookingDate = format(r.createdAt, DATE_FORMAT);
      return (
        // bookingDate <= format(last7Days, DATE_FORMAT) &&
        cancelledDate > format(last7Days, DATE_FORMAT)
      );
    });
    const cancellationsRoomNight = cancellationsLast7Days.reduce((sum, reservation) => {
      if (reservation.arrival && reservation.departure) {
        const arrival = new Date(reservation.arrival);
        const departure = new Date(reservation.departure);
        const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
        return sum + nights;
      }
      return sum;
    }, 0);

    // ======= SEVEN DAY ACCOMMODATION REVENUE & EXTRA (AMENITY REVENUE) =======
    // Calculate for CURRENT period (currentReservationWithoutCancelledAndPaymentFailed)
    const currentReservationAmenities = await this.getReservationAmenities(
      currentReservationWithoutCancelledAndPaymentFailed
    );
    const currentAmenityRevenue = this.calculateAmenityRevenue(
      currentReservationAmenities,
      taxSetting,
      roundingConfig
    );
    const currentTotalRevenue = this.calculateReservationRevenue(
      currentReservationWithoutCancelledAndPaymentFailed,
      taxSetting,
      roundingConfig
    );
    const currentCityTax = currentReservationWithoutCancelledAndPaymentFailed.reduce(
      (sum, reservation) => sum + (reservation.cityTaxAmount || 0),
      0
    );
    const currentAccommodationRevenue =
      currentTotalRevenue - currentCityTax - currentAmenityRevenue;

    // Calculate for PAST period (pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed)
    const pastReservationAmenities = await this.getReservationAmenities(
      pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed
    );
    const pastAmenityRevenue = this.calculateAmenityRevenue(
      pastReservationAmenities,
      taxSetting,
      roundingConfig
    );
    const pastTotalRevenue = this.calculateReservationRevenue(
      pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed,
      taxSetting,
      roundingConfig
    );
    const pastCityTax = pastPeriodReservationsBookedBeforeWithoutCancelledAndPaymentFailed.reduce(
      (sum, reservation) => sum + (reservation.cityTaxAmount || 0),
      0
    );
    const pastAccommodationRevenue = pastTotalRevenue - pastCityTax - pastAmenityRevenue;

    // Seven Day values = Current - Past (difference over 7 days)
    const sevenDayAccommodationRevenue = this.applyRoundingWithFallback(
      currentAccommodationRevenue - pastAccommodationRevenue,
      roundingConfig.roundingMode,
      roundingConfig.decimalPlaces
    );

    const sevenDayExtra = this.applyRoundingWithFallback(
      currentAmenityRevenue - pastAmenityRevenue,
      roundingConfig.roundingMode,
      roundingConfig.decimalPlaces
    );

    return {
      occupancyPaceTrend: DecimalRoundingHelper.applyRounding(
        occupancyPaceTrend,
        RoundingModeEnum.HALF_UP,
        2
      ),
      adrPickup: DecimalRoundingHelper.applyRounding(adrPickup, RoundingModeEnum.HALF_UP, 2),
      averageDailyRoomPickup: DecimalRoundingHelper.applyRounding(
        averageDailyRoomPickup,
        RoundingModeEnum.HALF_UP,
        2
      ),
      currentRoomNights,
      pastRoomNights,
      currentADR: this.applyRoundingWithFallback(
        currentADR,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      ),
      pastADR: this.applyRoundingWithFallback(
        pastADR,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      ),
      cancellationCount: cancellationsRoomNight,
      growthRevenue: sevenDayAccommodationRevenue + sevenDayExtra,
      sevenDayAccommodationRevenue,
      sevenDayExtra: this.applyRoundingWithFallback(
        sevenDayExtra,
        roundingConfig.roundingMode,
        roundingConfig.decimalPlaces
      )
    };
  }

  /**
   * Helper: Calculate room nights within a date range for given reservations
   */
  private calculateRoomNights(reservations: Reservation[], fromDate: Date, toDate: Date): number {
    return reservations.reduce((sum, reservation) => {
      if (!reservation.arrival || !reservation.departure) return sum;
      const arrival = new Date(reservation.arrival);
      const departure = new Date(reservation.departure);

      // Only count nights within the date range
      const effectiveStart = arrival < fromDate ? fromDate : arrival;
      const effectiveEnd = departure > toDate ? toDate : departure;

      if (effectiveStart >= effectiveEnd) return sum + 1;

      const nights = Math.ceil(
        (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + (nights > 0 ? nights : 0);
    }, 0);
  }

  /**
   * Helper: Calculate room nights only within the specified month
   * Used for average daily pickup calculation
   */
  private calculateRoomNightsByMonth(
    reservations: Reservation[],
    fromDate: Date,
    toDate: Date
  ): number {
    return reservations.reduce((sum, reservation) => {
      if (!reservation.arrival || !reservation.departure) return sum;
      const arrival = new Date(reservation.arrival);
      const departure = new Date(reservation.departure);

      // Check if arrival is in the target month
      if (arrival < fromDate || arrival > toDate) return sum;

      const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (nights > 0 ? nights : 0);
    }, 0);
  }

  /**
   * Apply rounding that always respects decimal places, even with NO_ROUNDING mode
   * Falls back to HALF_UP rounding when NO_ROUNDING is specified
   */
  private applyRoundingWithFallback(
    value: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number
  ): number {
    // If NO_ROUNDING is specified, use HALF_UP as fallback to ensure decimal places are respected
    const effectiveRoundingMode =
      roundingMode === RoundingModeEnum.NO_ROUNDING ? RoundingModeEnum.HALF_UP : roundingMode;

    return DecimalRoundingHelper.applyRounding(value, effectiveRoundingMode, decimalPlaces);
  }

  private getMonthNumber(monthName: string): number {
    const monthNames = [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER'
    ];
    const index = monthNames.indexOf(monthName.toUpperCase());
    return index !== -1 ? index + 1 : 1; // Default to January (1) if not found
  }

  /**
   * Gets reservation time slices for the given reservations.
   * Time slices provide daily breakdown of reservation amounts.
   *
   * This matches Java's getReservationDailyTimeSliceList() method.
   *
   * @param reservations - Array of reservations
   * @returns Promise<ReservationTimeSlice[]> - Time slices for all reservations
   */
  private async getReservationTimeSlices(
    reservations: Reservation[]
  ): Promise<ReservationTimeSlice[]> {
    if (reservations.length === 0) {
      return [];
    }

    const reservationIds = reservations.map((r) => r.id).filter((id): id is string => id !== null);

    if (reservationIds.length === 0) {
      return [];
    }

    return this.reservationTimeSliceRepository.find({
      where: {
        reservationId: In(reservationIds),
        deletedAt: IsNull()
      },
      select: {
        id: true,
        reservationId: true,
        fromTime: true,
        toTime: true,
        totalBaseAmount: true,
        totalGrossAmount: true,
        taxAmount: true
      },
      order: {
        fromTime: 'DESC'
      }
    });
  }

  private async getReservationAmenities(
    reservations: Reservation[]
  ): Promise<ReservationAmenity[]> {
    if (reservations.length === 0) {
      return [];
    }

    const reservationIds = reservations.map((r) => r.id).filter((id): id is string => id !== null);

    return this.reservationAmenityRepository.find({
      where: {
        reservationId: In(reservationIds),
        deletedAt: IsNull()
      },
      select: {
        id: true,
        reservationId: true,
        totalBaseAmount: true,
        totalGrossAmount: true,
        extraServiceType: true
      }
    });
  }

  /**
   * Creates pseudo time slices for cancelled reservations.
   * This matches Java's logic for handling cancelled reservations in past period ADR calculation.
   *
   * Pseudo time slices distribute the reservation's total amount evenly across each night.
   *
   * @param reservation - Cancelled reservation
   * @param fromDate - Start date for filtering
   * @param toDate - End date for filtering
   * @returns Array of pseudo time slice objects
   */
  private createPseudoTimeSlices(
    reservation: Reservation,
    fromDate: Date,
    toDate: Date
  ): Array<{ totalBaseAmount: number; totalGrossAmount: number }> {
    if (!reservation.arrival || !reservation.departure) {
      return [];
    }

    const arrival = new Date(reservation.arrival);
    const departure = new Date(reservation.departure);
    const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return [];
    }

    const baseAmountPerNight = (reservation.totalBaseAmount || 0) / nights;
    const grossAmountPerNight = (reservation.totalGrossAmount || 0) / nights;

    const pseudoSlices: Array<{ totalBaseAmount: number; totalGrossAmount: number }> = [];

    // Generate one pseudo slice for each night in the stay
    for (let date = new Date(arrival); date < departure; date.setDate(date.getDate() + 1)) {
      // Filter by date range
      if (date >= fromDate && date <= toDate) {
        pseudoSlices.push({
          totalBaseAmount: baseAmountPerNight,
          totalGrossAmount: grossAmountPerNight
        });
      }
    }

    return pseudoSlices;
  }
}
