import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ResponseData } from '@src/core/dtos/common.dto';
import {
  Reservation,
  ReservationStatusEnum
} from '@src/core/entities/booking-entities/reservation.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RoomProductAssignedUnit } from '@src/core/entities/room-product-assigned-unit.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  RoomUnitAvailability,
  RoomUnitAvailabilityStatus
} from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RoomProductStatus, RoomProductType } from '@src/core/enums/common';
import { NotFoundException } from '@src/core/exceptions';
import { eachDayOfInterval, format } from 'date-fns';
import {
  Between,
  DataSource,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  Not,
  Raw,
  Repository
} from 'typeorm';
import {
  DailyOccupancyRate,
  DailyOccupancyRateAvailableToSell,
  DailyOccupancyRateFilter,
  DailyOccupancyRateRoomSold
} from './dto/daily-hotel-occupancy-rate-list.dto';
import {
  BlockDaily,
  BlockStatus
} from '@src/core/entities/availability-entities/block-daily.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import {
  BookingTransaction,
  BookingTransactionStatusEnum
} from '@src/core/entities/booking-entities/booking-transaction.entity';
import { DATE_FORMAT } from '@src/core/constants/date.constant';

@Injectable()
export class RatePlanDailyManagementService {
  constructor(
    @InjectRepository(RoomProduct, DbName.Postgres)
    private roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,

    @InjectRepository(Reservation, DbName.Postgres)
    private reservationRepository: Repository<Reservation>,

    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private roomProductMappingRepository: Repository<RoomProductMapping>,

    @InjectRepository(RoomProductDailyAvailability, DbName.Postgres)
    private roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(Hotel, DbName.Postgres)
    private hotelRepository: Repository<Hotel>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(BlockDaily, DbName.Postgres)
    private blockDailyRepository: Repository<BlockDaily>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  async dailyHotelOccupancyRateList(filter: DailyOccupancyRateFilter) {
    // : Promise<ResponseData<DailyOccupancyRate>>
    // 1. Get hotel info
    const hotel = await this.hotelRepository.findOne({ where: { code: filter.hotelCode } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    const hotelId = hotel.id;

    if (filter.onlyOccRate) {
      return this.dailyOnlyHotelOccupancyRateList(filter, hotelId);
    }

    // 2. Get date range - optimize date processing
    const fromDate = new Date(filter.fromDate);
    const toDate = new Date(filter.toDate);
    const arrayDate = eachDayOfInterval({ start: fromDate, end: toDate }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );

    // 3. OPTIMIZED: Single query to get all required data with joins
    const [
      roomProductAvailability,
      roomProductAvailabilityrRemaining,
      roomUnitsWithAvailabilityData,
      blockDailyData,
      reservations
    ] = await Promise.all([
      // Get room product availability data
      this.roomProductDailyAvailabilityRepository
        .createQueryBuilder('rpda')
        .leftJoinAndSelect('rpda.roomProduct', 'rp')
        .where('rpda.hotelId = :hotelId', { hotelId })
        .andWhere('rpda.date IN (:...dates)', { dates: arrayDate })
        .andWhere('rpda.deletedAt IS NULL')
        .andWhere('rp.hotelId = :hotelId', { hotelId })
        .andWhere('rp.deletedAt IS NULL')
        .andWhere('rp.type IN (:...types)', {
          types: [RoomProductType.MRFC]
        })
        .andWhere('rp.status = :status', { status: RoomProductStatus.ACTIVE })
        .getMany(),

      // Get room product availability data for RFC and ERFC
      this.roomProductDailyAvailabilityRepository
        .createQueryBuilder('rpda')
        .leftJoinAndSelect('rpda.roomProduct', 'rp')
        .where('rpda.hotelId = :hotelId', { hotelId })
        .andWhere('rpda.date IN (:...dates)', { dates: arrayDate })
        .andWhere('rpda.deletedAt IS NULL')
        .andWhere('rp.hotelId = :hotelId', { hotelId })
        .andWhere('rp.deletedAt IS NULL')
        .andWhere('rp.type IN (:...types)', {
          types: [RoomProductType.RFC, RoomProductType.ERFC]
        })
        .andWhere('rp.status = :status', { status: RoomProductStatus.ACTIVE })
        .getMany(),

      // OPTIMIZED: Single complex query to get room units with availability and assignments
      this.roomUnitRepository
        .createQueryBuilder('ru')
        .leftJoinAndSelect('ru.roomUnitAvailabilities', 'rua', 'rua.date IN (:...dates)', {
          dates: arrayDate
        })
        .innerJoin('ru.roomProductAssignedUnits', 'rpau')
        .innerJoin(
          'rpau.roomProduct',
          'rp',
          'rp.hotelId = :hotelId AND rp.deletedAt IS NULL AND rp.type = :type AND rp.status = :status',
          { hotelId, type: RoomProductType.MRFC, status: RoomProductStatus.ACTIVE }
        )
        .where('ru.deletedAt IS NULL')
        .getMany(),

      // Get block daily data
      this.blockDailyRepository
        .createQueryBuilder('bd')
        .where('bd.hotelId = :hotelId', { hotelId })
        .andWhere('bd.date IN (:...dates)', { dates: arrayDate })
        .andWhere('bd.deletedAt IS NULL')
        .andWhere('bd.status IN (:...statusList)', {
          statusList: [BlockStatus.DEFINITE, BlockStatus.TENTATIVE]
        })
        .getMany(),

      // get reservation on that day
      this.reservationRepository.find({
        where: {
          hotelId: hotelId,
          status: In([
            ReservationStatusEnum.RESERVED,
            ReservationStatusEnum.CONFIRMED,
            ReservationStatusEnum.PROPOSED,
            ReservationStatusEnum.COMPLETED
          ]),
          arrival: Raw((alias) => `DATE(${alias}) IN (:...dates)`, { dates: arrayDate }),
          deletedAt: IsNull()
        },
        relations: {
          reservationTimeSlices: true, // Java: reservation.getReservationRoomList()
          booking: {
            bookingTransactions: true
          }
        },
        select: {
          id: true,
          arrival: true,
          bookingId: true,
          booking: {
            id: true,
            bookingTransactions: {
              status: true
            }
          },
          reservationTimeSlices: {
            roomId: true,
            fromTime: true
          }
        }
      })
    ]);

    // filter reservation transaction not failed
    const filterReservations = (reservations || []).filter((x) => {
      // no transaction → valid
      if (x.booking.bookingTransactions.length === 0 || !x.booking.bookingTransactions) {
        return true;
      }

      // has at least one SUCCESS transaction → valid
      return x.booking.bookingTransactions.some(
        (tx) => tx.status === BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
      );
    });

    // 4. OPTIMIZED: Pre-calculate data structures
    const totalRoomInventory = roomUnitsWithAvailabilityData.length;

    // Pre-build date-indexed maps for O(1) lookups
    const roomAvailabilityByDate = new Map<string, RoomUnitAvailability[]>();
    const roomProductAvailabilityByDate = new Map<string, RoomProductDailyAvailability[]>();
    const roomProductAvailabilityForRemainingByDate = new Map<
      string,
      RoomProductDailyAvailability[]
    >();
    const blockDailyByDate = new Map<string, BlockDaily[]>();
    const reservationTimeSliceByDate = new Map<string, ReservationTimeSlice[]>();

    (filterReservations || []).forEach((x) => {
      if (!x.reservationTimeSlices || x.reservationTimeSlices.length === 0) return;
      const reservationTimeSlices = x.reservationTimeSlices || [];

      for (let index = 0; index < arrayDate.length; index++) {
        const dateEle = arrayDate[index];
        const roomTimeSlices = reservationTimeSlices.filter(
          (x) => x.fromTime && format(new Date(x.fromTime), DATE_FORMAT) === dateEle
        );
        const res = reservationTimeSliceByDate.get(dateEle) || [];
        res.push(...roomTimeSlices);
        reservationTimeSliceByDate.set(dateEle, res);
      }
    });

    // build block daily by date
    blockDailyData.forEach((blockDaily) => {
      const dateBlocks = blockDailyByDate.get(blockDaily.date) || [];
      dateBlocks.push(blockDaily);
      blockDailyByDate.set(blockDaily.date, dateBlocks);
    });

    // Single pass to build both maps
    roomUnitsWithAvailabilityData.forEach((roomUnit) => {
      roomUnit.roomUnitAvailabilities?.forEach((availability) => {
        const dateAvailabilities = roomAvailabilityByDate.get(availability.date) || [];
        dateAvailabilities.push(availability);
        roomAvailabilityByDate.set(availability.date, dateAvailabilities);
      });
    });

    roomProductAvailability.forEach((availability) => {
      const dateAvailabilities = roomProductAvailabilityByDate.get(availability.date) || [];
      dateAvailabilities.push(availability);
      roomProductAvailabilityByDate.set(availability.date, dateAvailabilities);
    });

    // build room product availability for remaining by date
    roomProductAvailabilityrRemaining.forEach((availability) => {
      const dateAvailabilities =
        roomProductAvailabilityForRemainingByDate.get(availability.date) || [];
      dateAvailabilities.push(availability);
      roomProductAvailabilityForRemainingByDate.set(availability.date, dateAvailabilities);
    });

    // 5. OPTIMIZED: Generate daily occupancy rates with pre-calculated date strings
    const dailyOccupancyRates: DailyOccupancyRate[] = [];

    // Pre-calculate all date strings to avoid repeated Date operations
    const dateStrings = arrayDate;

    for (const dateStr of dateStrings) {
      // Get pre-indexed data - O(1) lookup
      const roomAvailabilitiesOfDate = roomAvailabilityByDate.get(dateStr) || [];
      const roomProductAvailabilityOfDate = roomProductAvailabilityByDate.get(dateStr) || [];
      const roomProductAvailabilityForRemainingOfDate =
        roomProductAvailabilityForRemainingByDate.get(dateStr) || [];

      const resTimeSliceByDate = reservationTimeSliceByDate.get(dateStr);

      // OPTIMIZED: Single pass calculation of room status counts
      let totalOutOfInventoryRoomCount = 0;
      let totalOutOfOrderRoomCount = 0;
      let totalAssignedRoomCount = 0;

      for (const availability of roomAvailabilitiesOfDate) {
        switch (availability.status) {
          case RoomUnitAvailabilityStatus.OUT_OF_INVENTORY:
            totalOutOfInventoryRoomCount++;
            break;
          case RoomUnitAvailabilityStatus.OUT_OF_ORDER:
            totalOutOfOrderRoomCount++;
            break;
          case RoomUnitAvailabilityStatus.ASSIGNED:
            totalAssignedRoomCount++;
            break;
        }
      }

      // OPTIMIZED: Single pass calculation of room product metrics
      let totalRoomSoldOfDate = 0;
      let totalRoomSoldUnassignedOfDate = resTimeSliceByDate?.filter(
        (x) => !x.roomId || x.roomId === '' || x.roomId == null || x.roomId == undefined
      ).length || 0;

      let availableToSell = 0;
      let totalAvailabilityAdjustment = 0;
      // only valid for apaleo
      let totalTentativelyBlock = 0;
      let totalDefinitelyBlock = 0;
      let totalPickedUnits = 0;

      for (const availability of roomProductAvailabilityOfDate) {
        // totalRoomSoldOfDate += availability.sold || 0;
        // totalRoomSoldUnassignedOfDate += availability.soldUnassigned || 0;
        availableToSell += availability.available || 0;
        totalAvailabilityAdjustment += availability.adjustment || 0;
      }

      // soldUnassigned is the units that are not assigned to any unit
      for (const availability of roomProductAvailabilityForRemainingOfDate) {
        // totalRoomSoldOfDate += availability.sold || 0;
        // totalRoomSoldUnassignedOfDate += availability.soldUnassigned || 0;
      }

      // get block daily data of date
      const blockDailyOfDate = blockDailyByDate.get(dateStr) || [];
      for (const blockDaily of blockDailyOfDate) {
        totalTentativelyBlock += blockDaily.tentativelyBlock || 0;
        totalDefinitelyBlock += blockDaily.definitelyBlock || 0;
        totalPickedUnits += blockDaily.pickedUnits || 0;
      }
      totalRoomSoldOfDate = totalAssignedRoomCount + totalRoomSoldUnassignedOfDate;
      // Calculate derived metrics
      const totalOutOfServiceRoomCount = 0; // No OUT_OF_SERVICE status in enum
      const totalPropertyRooms = totalRoomInventory - totalOutOfInventoryRoomCount;
      const totalRoomsUnassigned = totalPropertyRooms - totalAssignedRoomCount;
      const totalRoomsSoldAssigned = totalAssignedRoomCount;
      const totalRoomsSoldUnassigned = totalRoomSoldUnassignedOfDate;
      const occupancyRate = totalPropertyRooms > 0 ? totalRoomSoldOfDate / totalPropertyRooms : 0;
      const totalAvailablePropertyRooms =
        totalPropertyRooms - totalOutOfOrderRoomCount - totalRoomSoldOfDate;

      // Build daily occupancy rate object
      const dailyRate: DailyOccupancyRate = {
        date: dateStr,
        occupancyRate,
        totalRoomInventory,
        totalOutOfInventory: totalOutOfInventoryRoomCount,
        totalPropertyRooms,
        totalOutOfOrder: totalOutOfOrderRoomCount,
        totalOutOfService: totalOutOfServiceRoomCount,
        roomSoldList: [{ channel: 'GAUVENDI', value: totalRoomSoldOfDate }],
        totalAvailablePropertyRooms,
        totalAvailabilityAdjustment,
        availableToSellList: [{ channel: 'GAUVENDI', value: availableToSell }],
        totalRoomsAssigned: totalAssignedRoomCount,
        totalRoomsUnassigned,
        totalRoomsSoldAssigned,
        totalRoomsSoldUnassigned,
        totalRoomSold: totalRoomSoldOfDate,
        totalTentativelyBlock,
        totalDefinitelyBlock,
        totalPickedUnits
      };

      dailyOccupancyRates.push(dailyRate);
    }

    return new ResponseData(dailyOccupancyRates.length, 1, dailyOccupancyRates);
  }

  private async dailyOnlyHotelOccupancyRateList(
    filter: DailyOccupancyRateFilter,
    hotelId: string
  ): Promise<ResponseData<DailyOccupancyRate>> {
    const fromDate = new Date(filter.fromDate);
    const toDate = new Date(filter.toDate);

    // Get reservations for occupancy calculation only
    const reservations = await this.reservationRepository.find({
      where: {
        hotelId: hotelId,
        status: In([
          ReservationStatusEnum.RESERVED,
          ReservationStatusEnum.CONFIRMED,
          ReservationStatusEnum.PROPOSED
        ]),
        arrival: LessThanOrEqual(toDate),
        departure: MoreThan(fromDate),
        booking: {
          completedDate: Not(IsNull()) // Java: setIsCompleted(true)
        }
      },
      relations: {
        reservationRooms: true // For consistency
      }
    });

    // Get room units with availability data
    const roomUnits = await this.roomUnitRepository.find({
      where: {
        hotelId: hotelId,
        roomUnitAvailabilities: {
          date: Between(filter.fromDate, filter.toDate)
        }
      },
      relations: {
        roomUnitAvailabilities: true
      }
    });

    const dailyOccupancyRates: DailyOccupancyRate[] = [];

    for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];

      // Calculate total room sold for this date
      const totalRoomSold = reservations.filter((reservation) => {
        if (!reservation.arrival || !reservation.departure) return false;
        if (
          reservation.status === ReservationStatusEnum.RESERVED &&
          reservation.hotelPaymentModeCode === 'GUAWCC'
        )
          return false;
        return date >= reservation.arrival && date < reservation.departure;
      }).length;

      // Count out of inventory rooms for this date
      const outOfInventoryCount = roomUnits.filter((ru) =>
        ru.roomUnitAvailabilities?.some(
          (av) => av.date === dateStr && av.status === RoomUnitAvailabilityStatus.OUT_OF_INVENTORY
        )
      ).length;

      const totalPropertyRooms = roomUnits.length - outOfInventoryCount;
      const occupancyRate = totalPropertyRooms > 0 ? totalRoomSold / totalPropertyRooms : 0;

      dailyOccupancyRates.push({
        date: dateStr,
        occupancyRate,
        totalRoomInventory: roomUnits.length,
        totalOutOfInventory: outOfInventoryCount,
        totalPropertyRooms,
        totalOutOfOrder: 0,
        totalOutOfService: 0,
        roomSoldList: [],
        totalAvailablePropertyRooms: 0,
        totalAvailabilityAdjustment: 0,
        availableToSellList: [],
        totalRoomsAssigned: 0,
        totalRoomsUnassigned: 0,
        totalRoomsSoldAssigned: 0,
        totalRoomsSoldUnassigned: 0,
        totalRoomSold: 0
      });
    }

    return new ResponseData(dailyOccupancyRates.length, 1, dailyOccupancyRates);
  }
}
