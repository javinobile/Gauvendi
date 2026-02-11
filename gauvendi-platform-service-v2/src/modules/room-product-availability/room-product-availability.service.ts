import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BlockDaily,
  BlockStatus
} from '@src/core/entities/availability-entities/block-daily.entity';
import { RoomProductDailyAvailability } from '@src/core/entities/availability-entities/room-product-daily-availability.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import { ReservationStatusEnum } from '@src/core/entities/booking-entities/reservation.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { Restriction } from '@src/core/entities/restriction.entity';
import { RoomProductRetailFeature } from '@src/core/entities/room-product-retail-feature.entity';
import { RoomProductStandardFeature } from '@src/core/entities/room-product-standard-feature.entity';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@src/core/exceptions';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { RetailFeatureCalculationUtils } from '@src/core/utils/retail-feature-calculation.util';
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
  subDays
} from 'date-fns';
import Decimal from 'decimal.js';
import { DATE_BUSINESS_FORMAT, DATE_FORMAT } from 'src/core/constants/date.constant';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import { RoomProductMapping } from 'src/core/entities/room-product-mapping.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { RoomUnitRetailFeature } from 'src/core/entities/room-unit-retail-feature.entity';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import {
  ConnectorTypeEnum,
  DistributionChannel,
  RatePlanStatusEnum,
  RfcAllocationSetting,
  RoomProductPricingMethodEnum,
  RoomProductStatus,
  RoomProductType,
  RoomProductTypeMappingChannel,
  RoomUnitAvailabilityStatus
} from 'src/core/enums/common';
import { Helper } from 'src/core/helper/utils';
import { Between, Brackets, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CmSiteminderService } from '../cm-siteminder/cm-siteminder.service';
import { RoomProductAvailabilityMappingDto, UpdatePmsAvailabilityDto } from '../pms/pms.dto';
import { PmsService } from '../pms/pms.service';
import { RatePlanV2Repository } from '../rate-plan/repositories/rate-plan-v2.repository';
import { ReservationRepository } from '../reservation/repositories/reservation.repository';
import { RoomProductPricingMethodDetailService } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { RoomProductRatePlanRepository } from '../room-product-rate-plan/room-product-rate-plan.repository';
import { PricingCacheService } from '@src/core/modules/pricing-cache.service';
import { RoomProductRestrictionService } from '../room-product-restriction/room-product-restriction.service';
import { RoomProductAvailabilityListQueryDto } from '../room-product/room-product.dto';
import { RoomProductRepository } from '../room-product/room-product.repository';
import {
  RoomDailyAvailabilityDto,
  RoomDailyAvailabilityFilter
} from './dtos/room-product-availability-daily.dto';
import {
  CalendarRoomProductAvailabilityQueryDto,
  CalendarRoomProductQueryDto,
  GenerateRoomProductAvailabilityDto,
  GetOverlappingRfcErfcForMrfcDto,
  GetRelatedMrfcDto,
  GetRoomProductMappingPmsDto,
  ManualUpsertDailyAvailabilityDto,
  ProcessRoomUnitAvailabilityUpdateDto,
  RequestRoomsUpdateDto,
  RoomProductAvailabilityDto,
  RoomProductReleaseAvailabilityDto,
  SyncRoomProductAvailabilityPmsDto,
  UpdateRoomUnitAvailabilityStatusDto,
  UpsertRoomProductAvailabilityDto,
  UpsertRoomProductMappingPmsDto
} from './room-product-availability.dto';
@Injectable()
export class RoomProductAvailabilityService {
  logger = new Logger(RoomProductAvailabilityService.name);

  // Debouncing mechanism for PMS availability updates
  private readonly pmsAvailabilityUpdateQueue = new Map<
    string,
    Map<string, UpdatePmsAvailabilityDto>
  >();
  private readonly pmsAvailabilityTimers = new Map<string, NodeJS.Timeout>();
  private readonly DEBOUNCE_DELAY_MS = 30000; // 30 seconds

  constructor(
    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductDailyAvailability, DbName.Postgres)
    private readonly roomProductDailyAvailabilityRepository: Repository<RoomProductDailyAvailability>,

    @InjectRepository(RoomProductMappingPms, DbName.Postgres)
    private readonly roomProductMappingPmsRepository: Repository<RoomProductMappingPms>,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>,

    @InjectRepository(Restriction, DbName.Postgres)
    private readonly restrictionRepository: Repository<Restriction>,

    @InjectRepository(RoomUnitRetailFeature, DbName.Postgres)
    private readonly roomUnitRetailFeatureRepository: Repository<RoomUnitRetailFeature>,

    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductStandardFeature, DbName.Postgres)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(BlockDaily, DbName.Postgres)
    private readonly blockDailyRepository: Repository<BlockDaily>,

    @InjectRepository(ReservationTimeSlice, DbName.Postgres)
    private readonly reservationTimeSliceRepository: Repository<ReservationTimeSlice>,

    private readonly cmSiteminderService: CmSiteminderService,
    private readonly pmsService: PmsService,
    private readonly roomProductRestrictionService: RoomProductRestrictionService,
    private readonly reservationRepository: ReservationRepository,
    private readonly roomProductCustomRepository: RoomProductRepository,
    private readonly roomProductRatePlanRepository: RoomProductRatePlanRepository,
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService,
    private readonly ratePlanRepository: RatePlanV2Repository,
    private readonly pricingCacheService: PricingCacheService
  ) {}

  /**
   * Build query builder for filtering room products
   */
  private buildRoomProductsQuery(filter: {
    hotelId: string;
    type: RoomProductType[];
    status?: RoomProductStatus[];
    name?: string[];
    ids?: string[];
    retailFeatureIds?: string[];
  }) {
    const { hotelId, type, status, name, ids, retailFeatureIds } = filter;

    const queryBuilder = this.roomProductRepository
      .createQueryBuilder('r')
      .where('r.hotelId = :hotelId', { hotelId })
      .andWhere('r.deletedAt IS NULL')
      .andWhere('r.type = ANY(:types)', { types: type })
      .andWhere('r.status = ANY(:status)', {
        status: status?.length ? status : [RoomProductStatus.ACTIVE]
      })
      .orderBy('r.code', 'ASC')
      .select([
        'r.id',
        'r.code',
        'r.name',
        'r.description',
        'r.rfcAllocationSetting',
        'r.distributionChannel',
        'r.type',
        'r.status'
      ]);

    // Filter by name or code
    if (name && name.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          name.forEach((n, index) => {
            const paramName = `name${index}`;
            qb.orWhere(`r.name ILIKE :${paramName}`, { [paramName]: `%${n.trim()}%` });
            qb.orWhere(`r.code ILIKE :${paramName}`, { [paramName]: `%${n.trim()}%` });
          });
        })
      );
    }

    // Filter by IDs
    if (ids && ids.length > 0) {
      queryBuilder.andWhere('r.id IN (:...ids)', { ids: ids || [] });
    }

    // Filter by retail features or standard features (must have ALL features)
    if (retailFeatureIds && retailFeatureIds.length > 0) {
      queryBuilder.andWhere(
        `(
          SELECT COUNT(DISTINCT feature_id)
          FROM (
            SELECT rprf.retail_feature_id as feature_id
            FROM room_product_retail_feature rprf 
            WHERE rprf.room_product_id = r.id 
            AND rprf.retail_feature_id = ANY(:retailFeatureIds)
            UNION
            SELECT rpsf.standard_feature_id as feature_id
            FROM room_product_standard_feature rpsf 
            WHERE rpsf.room_product_id = r.id 
            AND rpsf.standard_feature_id = ANY(:retailFeatureIds)
          ) features
        ) = :featureCount`,
        { retailFeatureIds, featureCount: retailFeatureIds.length }
      );
    }

    return queryBuilder;
  }

  async getRoomProductsAvailability(filter: RoomProductAvailabilityListQueryDto) {
    const {
      hotelId,
      type = [RoomProductType.MRFC, RoomProductType.RFC, RoomProductType.ERFC],
      startDate,
      endDate,
      ids,
      status,
      name,
      retailFeatureIds
    } = filter;
    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }
    // filter type is MRFC
    try {
      // Generate standardized date range (with null checks)
      const dates = startDate && endDate ? Helper.generateDateRange(startDate, endDate) : [];

      // Build room products query
      const queryRoomProducts = this.buildRoomProductsQuery({
        hotelId,
        type: type || [],
        status,
        ids,
        retailFeatureIds
      });

      const [mrfcRoomProducts, dailyAvailabilities, assignedUnits, allRestrictions, reservations] =
        await Promise.all([
          // Room Products
          queryRoomProducts.getMany(),
          // Room Product Daily Availabilities,
          this.getRoomProductDailyAvailabilities(hotelId, startDate, endDate, type, status),

          // Room Product Assigned Units
          this.getRoomProductAssignedUnits(),
          // Always get restrictions
          this.getRestrictions(hotelId, startDate, endDate),
          this.getReservations(
            hotelId,
            endDate ? new Date(endDate) : undefined,
            startDate ? new Date(startDate) : undefined
          )
        ]);

      const roomSoldList: {
        roomUnitIds: string[];
        date: string;
        reservationId: string;
      }[] = [];

      for (const reservation of reservations) {
        if (
          reservation.status === ReservationStatusEnum.RESERVED &&
          reservation.hotelPaymentModeCode === 'GUAWCC'
        ) {
          continue;
        }

        if (!reservation.arrival || !reservation.departure) continue;

        const channel =
          reservation.channel === RoomProductTypeMappingChannel.PMS
            ? RoomProductTypeMappingChannel.PMS
            : RoomProductTypeMappingChannel.GAUVENDI;

        const reservationDates = Helper.generateDateRange(
          format(reservation.arrival, DATE_FORMAT),
          format(reservation.departure, DATE_FORMAT)
        );

        for (const date of reservationDates) {
          if (
            (!startDate || new Date(date) >= new Date(startDate)) &&
            (!endDate || new Date(date) <= new Date(endDate))
          ) {
            roomSoldList.push({
              roomUnitIds: reservation.reservationRooms
                .map((room) => room.roomId)
                .filter((roomId) => roomId !== null),
              date: date,
              reservationId: reservation.id
            });
          }
        }
      }

      const roomUnitIds = [...new Set(assignedUnits.map((assignment) => assignment.roomUnitId))];
      const mrfcRoomProductIds = mrfcRoomProducts.map((roomProduct) => roomProduct.id);

      const [roomUnitsWithAvailability, roomProductRetailFeatures, roomProductStandardFeatures] =
        await Promise.all([
          this.roomUnitRepository.find({
            where: {
              id: In(roomUnitIds), // CRITICAL: Only rooms from GAUVENDI MRFC mappings
              roomUnitAvailabilities: {
                date: In(dates),
                status: In([
                  RoomUnitAvailabilityStatus.OUT_OF_INVENTORY,
                  RoomUnitAvailabilityStatus.OUT_OF_ORDER
                ])
              },
              deletedAt: IsNull()
            },
            relations: {
              roomUnitAvailabilities: true
            }
          }),
          this.roomProductRetailFeatureRepository.find({
            where: {
              roomProductId: In(mrfcRoomProductIds),
              quantity: MoreThanOrEqual(1)
            },
            select: {
              id: true,
              retailFeatureId: true,
              roomProductId: true
            }
          }),
          this.roomProductStandardFeatureRepository.find({
            where: {
              roomProductId: In(mrfcRoomProductIds)
            },
            select: {
              id: true,
              standardFeatureId: true,
              roomProductId: true
            }
          })
        ]);

      const roomUnitAvailability = roomUnitsWithAvailability.flatMap(
        (roomUnit) => roomUnit.roomUnitAvailabilities
      );
      const roomAvailabilityByDate = groupByToMap(roomUnitAvailability, (i) => i.date);

      if (mrfcRoomProducts.length === 0) {
        this.logger.warn(`No room products found for hotel ${hotelId} with given criteria`);
        return [];
      }

      // Create lookup maps for efficient data association
      const dailyAvailabilityMap = groupByToMapSingle(
        dailyAvailabilities,
        (i) => `${i.roomProductId}_${i.date}`
      );

      const assignedUnitsMapByRoomUnitId = new Map<string, RoomProductAssignedUnit[]>();
      assignedUnits.forEach((unit) => {
        if (!assignedUnitsMapByRoomUnitId.has(unit.roomProductId)) {
          assignedUnitsMapByRoomUnitId.set(unit.roomProductId, []);
        }
        assignedUnitsMapByRoomUnitId.get(unit.roomProductId)!.push({
          roomUnitId: unit.roomUnitId,
          roomUnit: {
            roomNumber: unit.roomUnit?.roomNumber
          }
        } as RoomProductAssignedUnit);
      });

      const assignedUnitsMapByProductId = groupByToMap(assignedUnits, (unit) => unit.roomProductId);

      const mrfcRoomUnitIds = assignedUnits
        .filter((unit) => mrfcRoomProductIds.includes(unit.roomProductId))
        .map((unit) => unit.roomUnitId);

      const overlappingAssignedUnits = assignedUnits.filter(
        (unit) =>
          mrfcRoomUnitIds.includes(unit.roomUnitId) &&
          !mrfcRoomProductIds.includes(unit.roomProductId)
      );
      const overlappingAssignedUnitsMap = groupByToMap(
        overlappingAssignedUnits,
        (unit) => unit.roomUnitId
      );

      const overlappingAssignedRoomProductIds = overlappingAssignedUnits.map(
        (unit) => unit.roomProductId
      );
      const overlappingRoomProducts = await this.buildRoomProductsQuery({
        hotelId,
        type: [RoomProductType.ERFC, RoomProductType.RFC],
        ids: overlappingAssignedRoomProductIds,
        name: name,
        retailFeatureIds: retailFeatureIds ? retailFeatureIds : undefined,
        status: status
      }).getMany();

      // Assign related data to room products
      const filteredRoomProducts = mrfcRoomProducts.filter((roomProduct) => {
        const assignedUnitsInMRFC = assignedUnitsMapByProductId.get(roomProduct.id) || [];
        const overlappingAssignedRoomProductIdInMRFC = assignedUnitsInMRFC
          .map((unit) => overlappingAssignedUnitsMap.get(unit.roomUnitId) || [])
          .flat()
          .map((unit) => unit.roomProductId);

        const overlappingRoomProductInMRFC = overlappingRoomProducts.filter((roomProduct) =>
          overlappingAssignedRoomProductIdInMRFC.includes(roomProduct.id)
        );

        let isMatched = true;

        if (name && name.length > 0) {
          let isNameMatched = false;
          for (const search of name || []) {
            if (search && roomProduct.name.includes(search)) {
              isNameMatched = true;
            }
            if (search && roomProduct.code.includes(search)) {
              isNameMatched = true;
            }
          }

          isMatched = isNameMatched && isMatched;
        }

        if (retailFeatureIds && retailFeatureIds.length > 0) {
          const retailFeatureInMRFC =
            roomProductRetailFeatures.filter(
              (roomProductRetailFeature) =>
                roomProductRetailFeature.roomProductId === roomProduct.id &&
                retailFeatureIds?.includes(roomProductRetailFeature.retailFeatureId)
            ) || [];
          const standardFeatureInMRFC =
            roomProductStandardFeatures.filter(
              (roomProductStandardFeature) =>
                roomProductStandardFeature.roomProductId === roomProduct.id &&
                retailFeatureIds?.includes(roomProductStandardFeature.standardFeatureId)
            ) || [];

          isMatched =
            isMatched && (retailFeatureInMRFC.length > 0 || standardFeatureInMRFC.length > 0);
        }

        return (
          isMatched || (overlappingRoomProductInMRFC && overlappingRoomProductInMRFC.length > 0)
        );
      });

      const roomProductIds = filteredRoomProducts.map((roomProduct) => roomProduct.id);
      const roomProductRatePlansMap = new Map<string, boolean>();
      if (roomProductIds.length) {
        const roomProductRatePlans =
          roomProductIds && roomProductIds.length > 0
            ? await this.roomProductRatePlanRepository.findAll({
                roomProductIds: roomProductIds
              })
            : [];
        for (const roomProductId of roomProductIds) {
          const hasRoomProductRatePlan = roomProductRatePlans.some(
            (roomProductRatePlan) => roomProductRatePlan.roomProductId === roomProductId
          );
          roomProductRatePlansMap.set(roomProductId, hasRoomProductRatePlan);
        }
      }

      filteredRoomProducts.forEach((roomProduct) => {
        // Assign daily availabilities
        roomProduct.roomProductDailyAvailabilities = dates.map((date) => {
          // const assignedUnits = assignedUnitsMapByRoomUnitId.get(roomProduct.id) || [];
          // const roomUnitIds = assignedUnits.map((unit) => unit.roomUnitId);

          const dailyAvailability = dailyAvailabilityMap.get(`${roomProduct.id}_${date}`);

          if (!dailyAvailability) {
            return null as unknown as RoomProductDailyAvailability;
          }

          // const roomAvailabilitiesOfDate = roomAvailabilityByDate.get(date) || [];

          // const totalOutOfInventoryRoomCount = roomAvailabilitiesOfDate.filter(
          //   (ra) =>
          //     ra.status === RoomUnitAvailabilityStatus.OUT_OF_INVENTORY &&
          //     roomUnitIds.includes(ra.roomUnitId)
          // ).length;
          // const totalOutOfOrderRoomCount = roomAvailabilitiesOfDate.filter(
          //   (ra) =>
          //     ra.status === RoomUnitAvailabilityStatus.OUT_OF_ORDER &&
          //     roomUnitIds.includes(ra.roomUnitId)
          // ).length;

          // let totalRoomSold = roomSoldList.filter(
          //   (roomSold) =>
          //     roomSold.date === date &&
          //     roomSold.roomUnitIds.some((roomUnitId) => roomUnitIds.includes(roomUnitId))
          // ).length;

          // const totalAvailablePropertyRooms =
          //   dailyAvailability.sellLimit -
          //   totalOutOfInventoryRoomCount -
          //   totalOutOfOrderRoomCount -
          //   totalRoomSold;

          return {
            ...dailyAvailability
            // sellLimit: totalAvailablePropertyRooms
          };
        });

        // Assign room units
        roomProduct.roomProductAssignedUnits =
          assignedUnitsMapByRoomUnitId.get(roomProduct.id) || [];

        // Always assign restrictions
        roomProduct.roomProductRestrictions = dates.flatMap((date) =>
          allRestrictions.filter((restriction: Restriction) => {
            if (!restriction.roomProductIds?.includes(roomProduct.id)) return false;

            const restrictionDates = eachDayOfInterval({
              start: new Date(restriction.fromDate),
              end: new Date(restriction.toDate)
            }).map((d) => format(d, DATE_FORMAT));

            return restrictionDates.includes(date);
          })
        );

        roomProduct['isAssignedToRatePlan'] = roomProductRatePlansMap.get(roomProduct.id) || false;
      });

      return filteredRoomProducts || [];
    } catch (error) {
      this.logger.error(`Error fetching room products: ${error.message}`, {
        hotelId,
        stack: error.stack
      });
      throw new InternalServerErrorException(`Failed to fetch room products: ${error.message}`);
    }
  }

  async getRoomProductAssignedUnits() {
    return this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpa')
      .leftJoin('rpa.roomUnit', 'roomUnit')
      .where('rpa.roomProductId IS NOT NULL')
      .select(['rpa.roomProductId', 'rpa.roomUnitId', 'roomUnit.roomNumber'])
      .getMany();
  }

  async getRestrictions(hotelId: string, startDate?: string, endDate?: string) {
    if (!startDate || !endDate) {
      return [];
    }

    return this.restrictionRepository
      .createQueryBuilder('r')
      .where('r.hotelId = :hotelId', { hotelId })
      .andWhere('r.fromDate <= :endDate', {
        endDate: endDate || new Date().toISOString().split('T')[0]
      })
      .andWhere('r.toDate >= :startDate', {
        startDate: startDate || new Date().toISOString().split('T')[0]
      })
      .andWhere('r.ratePlanIds IS NULL')
      .select([
        'r.roomProductIds',
        'r.fromDate',
        'r.toDate',
        'r.type',
        'r.weekdays',
        'r.minLength',
        'r.maxLength',
        'r.minAdv',
        'r.maxAdv',
        'r.minLosThrough',
        'r.maxReservationCount',
        'r.restrictionSource'
      ])
      .getMany();
  }

  async getRoomProductDailyAvailabilities(
    hotelId: string,
    startDate?: string,
    endDate?: string,
    types?: RoomProductType[],
    status?: RoomProductStatus[]
  ) {
    if (!startDate || !endDate) {
      return [];
    }

    const [blockDailyData, reservationTimeSlices, roomProductDailyAvailabilityData] =
      await Promise.all([
        this.blockDailyRepository
          .createQueryBuilder('bd')
          .where('bd.hotelId = :hotelId', { hotelId })
          .andWhere('bd.date BETWEEN :startDate AND :endDate', { startDate, endDate })
          .andWhere('bd.deletedAt IS NULL')
          .andWhere('bd.status IN (:...statusList)', {
            statusList: [BlockStatus.DEFINITE, BlockStatus.TENTATIVE]
          })
          .getMany(),
        // get room product daily availability data
        this.reservationTimeSliceRepository
          .createQueryBuilder('rst')
          .leftJoin('rst.reservation', 'reservation')
          .where('reservation.hotelId = :hotelId', { hotelId })
          .andWhere('rst.fromTime BETWEEN :startDate AND :endDate', {
            startDate: startOfDay(new Date(startDate)),
            endDate: startOfDay(new Date(endDate))
          })
          .andWhere('rst.deletedAt IS NULL')
          .select(['rst.id', 'rst.roomProductId', 'rst.fromTime', 'rst.toTime', 'rst.roomId'])
          .getMany(),
        // get room product daily availability data
        this.roomProductDailyAvailabilityRepository
          .createQueryBuilder('rpad')
          .leftJoin('rpad.roomProduct', 'roomProduct')
          .where('rpad.hotelId = :hotelId', { hotelId })
          .andWhere('roomProduct.type IN (:...types)', { types: types || [] })
          .andWhere('roomProduct.status IN (:...status)', { status: status || [] })
          .andWhere('rpad.date >= :startDate AND rpad.date <= :endDate', {
            startDate,
            endDate
          })
          .orderBy('rpad.date', 'ASC')
          .select([
            'rpad.id',
            'rpad.roomProductId',
            'rpad.date',
            'rpad.available',
            'rpad.adjustment',
            'rpad.sellLimit',
            'rpad.sold'
          ])
          .getMany()
      ]);

    let roomProductIds: string[] = roomProductDailyAvailabilityData.map(
      (rpad) => rpad.roomProductId
    );
    roomProductIds = [...new Set(roomProductIds)];

    // mapping room product assigned units
    const roomProductAssignedUnitsMap = await this.mappingRoomProductAssignedUnits({
      hotelId,
      startDate,
      endDate,
      types: types || [],
      status: status || [],
      roomProductIds
    });
    // mapping block daily data
    const blockDailyMap = this.mappingBlockDailyData(blockDailyData);
    // mapping reservation time slices
    const unassignedUnitMap = new Map<string, number>();
    for (const rst of reservationTimeSlices) {
      if (rst.roomId) continue;

      const key = `${rst.roomProductId}_${rst.fromTime?.toISOString().split('T')[0]}`;
      const unassignedUnitCount = unassignedUnitMap.get(key) || 0;
      unassignedUnitMap.set(key, unassignedUnitCount + (rst.roomId ? 0 : 1));
    }

    const newData = roomProductDailyAvailabilityData.map((rpad) => {
      const key = `${rpad.roomProductId}_${rpad.date}`;
      const dateBlocks = blockDailyMap.get(key) || {
        tentativelyBlock: 0,
        definitelyBlock: 0,
        pickedUnits: 0
      };
      const roomProductAssignedUnitCount = roomProductAssignedUnitsMap.get(key) || {
        totalOutOfOrder: 0,
        totalOutOfInventory: 0,
        totalAvailable: 0,
        totalAssigned: 0,
        totalInventory: 0
      };
      const unassignedUnitCount = unassignedUnitMap.get(key) || 0;
      const totalSoldUnits = unassignedUnitCount + roomProductAssignedUnitCount.totalAssigned;
      const totalSoldUnitsExcludingBlock = totalSoldUnits - dateBlocks.pickedUnits;
      const totalUnitsInventory = roomProductAssignedUnitCount.totalInventory;
      const totalOutOfInventory = roomProductAssignedUnitCount.totalOutOfInventory;
      const totalUnitsAvailable = roomProductAssignedUnitCount.totalAvailable;
      const totalActualUnits = totalUnitsAvailable;

      return {
        ...rpad,
        tentativelyBlock: dateBlocks.tentativelyBlock,
        definitelyBlock: dateBlocks.definitelyBlock,
        pickedUnits: dateBlocks.pickedUnits,
        totalOutOfOrder: roomProductAssignedUnitCount.totalOutOfOrder,
        totalOutOfInventory: totalOutOfInventory,
        totalUnitsAvailable: totalUnitsAvailable,
        totalUnitsAssigned: roomProductAssignedUnitCount.totalAssigned,
        totalUnitsInventory: totalUnitsInventory,
        totalUnitsUnassigned: unassignedUnitCount,
        totalSoldUnits: totalSoldUnits,
        totalSoldUnitsExcludingBlock: totalSoldUnitsExcludingBlock,
        totalActualUnits: totalActualUnits
      };
    });

    return newData;
  }

  async getReservations(hotelId: string, toDate?: Date, fromDate?: Date) {
    if (!toDate || !fromDate) {
      return [];
    }

    return this.reservationRepository.findAll({
      hotelId: hotelId,
      toDate: toDate,
      fromDate: fromDate,
      isCompleted: true,
      statuses: [
        ReservationStatusEnum.RESERVED,
        ReservationStatusEnum.CONFIRMED,
        ReservationStatusEnum.PROPOSED
      ],

      relations: {
        reservationRooms: true
      }
    });
  }

  async upsertRoomProductMappingPms(body: UpsertRoomProductMappingPmsDto[]) {
    if (!Array.isArray(body) || body.length === 0) {
      this.logger.warn('No room product mapping pms to upsert');
      throw new BadRequestException('No room product mapping pms to upsert');
    }

    const validFields = ['roomProductId', 'hotelId', 'roomProductMappingPmsCode'];

    Helper.checkValidFields(body, validFields);
    const roomProductMappingPms = body.map((item) =>
      this.roomProductMappingPmsRepository.create(item)
    );

    try {
      const result = await this.roomProductMappingPmsRepository.upsert(roomProductMappingPms, {
        conflictPaths: ['hotelId', 'roomProductId']
      });

      return result.raw;
    } catch (error) {
      this.logger.error('Error upserting room product mapping pms', error);
      throw new InternalServerErrorException(
        'Error upserting room product mapping pms ',
        error.message
      );
    }
  }

  async deleteRoomProductMappingPms(id: string) {
    try {
      const roomProductMappingPms = await this.roomProductMappingPmsRepository.findOne({
        where: { id }
      });
      if (!roomProductMappingPms) {
        throw new BadRequestException('Room product mapping pms not found');
      }
      return this.roomProductMappingPmsRepository.delete(id);
    } catch (error) {
      this.logger.error('Error deleting room product mapping pms', error);
      throw new InternalServerErrorException(
        'Error deleting room product mapping pms ',
        error.message
      );
    }
  }

  async syncRoomProductAvailabilityPms(body: SyncRoomProductAvailabilityPmsDto) {
    const { endDate, startDate, hotelId } = body;

    if (!hotelId?.length) {
      throw new BadRequestException('Invalid hotelId');
    }

    let fromDate = startDate;
    if (!fromDate) {
      // fallback today
      const today = new Date();
      fromDate = format(today, DATE_FORMAT);
    }

    let toDate = endDate;
    if (!toDate) {
      // fallback today
      const endDay = addDays(new Date(), 365); // 1 year
      toDate = format(endDay, DATE_FORMAT);
    }

    const response: RoomProductAvailabilityMappingDto[] =
      await this.pmsService.getPmsProductAvailability(hotelId, fromDate, toDate);

    await this.upsertParsedAvailability(response, fromDate, toDate, hotelId);

    return response;
  }

  async upsertParsedAvailability(
    parsedData: RoomProductAvailabilityMappingDto[],
    startDate: string,
    endDate: string,
    hotelId: string
  ): Promise<void> {
    if (!parsedData || parsedData.length === 0) {
      this.logger.warn('No parsed availability data to process.');
      return;
    }

    this.logger.debug(`Received ${parsedData.length} availability records to upsert.`);

    try {
      // Step 1: Extract unique mapping codes
      const mappingCodes = [...new Set(parsedData.map((x) => x.roomProductMappingPmsCode))];
      this.logger.debug(`Extracted ${mappingCodes.length} unique mapping codes.`);

      // Step 2: Load mapping info
      const mappings = await this.roomProductMappingPmsRepository.find({
        where: { roomProductMappingPmsCode: In(mappingCodes), hotelId },
        select: ['roomProductId', 'hotelId', 'roomProductMappingPmsCode']
      });
      this.logger.debug(`Loaded ${mappings.length} room product mappings from DB.`);

      const mappingMap = new Map<string, { roomProductId: string; hotelId: string }>();
      for (const m of mappings) {
        mappingMap.set(m.roomProductMappingPmsCode, {
          roomProductId: m.roomProductId,
          hotelId: m.hotelId
        });
      }

      // Step 3: Build records with mapped data
      const records = parsedData
        .map((item, index) => {
          const mapping = mappingMap.get(item.roomProductMappingPmsCode);
          if (!mapping) {
            return null;
          }

          const record = {
            hotelId: mapping.hotelId,
            roomProductId: mapping.roomProductId,
            date: item.date?.split('T')[0],
            available: item.available,
            adjustment: item.adjustment
          };

          return record;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (records.length === 0) {
        this.logger.warn('No valid records to upsert after mapping.');
        return;
      }

      this.logger.debug(`Prepared ${records.length} records for bulk upsert.`);

      // Step 4: Perform bulk upsert with deadlock retry protection
      const chunkSize = 1500;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);

        await this.retryOnDeadlock(async () => {
          await this.roomProductDailyAvailabilityRepository
            .createQueryBuilder()
            .insert()
            .into(RoomProductDailyAvailability)
            .values(chunk)
            .orUpdate(['available', 'adjustment'], ['hotel_id', 'room_product_id', 'date'])
            .execute();
        });

        this.logger.log(
          `Successfully upserted chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} records) of daily availability records.`
        );
      }

      this.logger.log(`Successfully upserted ${records.length} total daily availability records.`);

      // step 5: call processUpdateRoomProductAvailability
      const roomProductIds = mappings.map((x) => x.roomProductId);
      const dates = Helper.generateDateRange(startDate, endDate);
      await this.processUpdateRoomProductAvailability(hotelId, roomProductIds, dates);

      //  step 6: push availability to cm siteminder
      await Promise.all(
        Array.from(mappingMap.values()).map(async (value) => {
          this.pushAvailabilityToCmSiteminder(
            value.hotelId,
            value.roomProductId,
            startDate,
            endDate
          );
        })
      );
    } catch (error) {
      this.logger.error('Failed to upsert room product daily availability', error.stack);
      throw error;
    }
  }

  async roomProductCheckAvailability(body: RoomProductAvailabilityDto) {
    const { hotelId, requestRooms } = body;

    if (!hotelId) {
      throw new BadRequestException('hotelId must be required');
    }

    if (!requestRooms || requestRooms.length === 0) {
      throw new BadRequestException('requestRooms must be required');
    }

    const result = await Promise.all(
      requestRooms.map((requestRoom) =>
        this.checkRoomProductAvailability(
          hotelId,
          requestRoom.arrival,
          requestRoom.departure,
          requestRoom.roomProductId
        )
      )
    );

    return result;
  }

  async roomProductCheckAvailabilityProposal(body: RoomProductAvailabilityDto) {
    const { hotelId, requestRooms } = body;

    if (!hotelId) {
      throw new BadRequestException('hotelId must be required');
    }

    if (!requestRooms || requestRooms.length === 0) {
      throw new BadRequestException('requestRooms must be required');
    }

    const result = await Promise.all(
      requestRooms.map((requestRoom) =>
        this.checkRoomProductAvailabilityProposal(
          hotelId,
          requestRoom.arrival,
          requestRoom.departure,
          requestRoom.roomProductId,
          requestRoom.roomUnitId
        )
      )
    );

    return result;
  }

  private async checkRoomProductAvailability(
    hotelId: string,
    arrival: string,
    departure: string,
    roomProductId: string
  ) {
    if (!hotelId || !arrival || !departure || !roomProductId) {
      throw new BadRequestException('hotelId, arrival, departure and roomProductId are required');
    }

    // validate check in date and check out date
    this.validateAndCheckDateRangeChange(arrival, departure);

    const checkIn = startOfDay(new Date(arrival));
    const checkOut = startOfDay(new Date(departure));

    // checkout - 1 day because hotel pricing is per-night — guests leave on checkOut, and that night is not charged.
    const stayEndDate = subDays(checkOut, 1);

    // Build expected dates and validate each date has positive remaining capacity.
    const expectedDates: string[] = Helper.generateDateRange(
      format(checkIn, DATE_FORMAT),
      format(stayEndDate, DATE_FORMAT)
    );

    // get total nights
    const totalDays = expectedDates.length;

    // run parallel
    const [roomProduct, roomProductDailyAvailabilities, roomProductAssignedUnits] =
      await Promise.all([
        this.roomProductRepository.findOne({
          where: {
            id: roomProductId,
            hotelId,
            deletedAt: IsNull(),
            status: RoomProductStatus.ACTIVE
          },
          select: ['id', 'code', 'name', 'status', 'type', 'rfcAllocationSetting']
        }),

        this.roomProductDailyAvailabilityRepository.find({
          where: {
            hotelId,
            roomProductId: roomProductId,
            date: Between(format(checkIn, DATE_FORMAT), format(stayEndDate, DATE_FORMAT))
          },
          select: ['date', 'available', 'adjustment', 'sellLimit', 'sold']
        }),

        this.getRoomProductAssignedUnitAvailable(
          roomProductId,
          format(checkIn, DATE_FORMAT),
          format(stayEndDate, DATE_FORMAT)
        )
      ]);

    if (!roomProduct || roomProductDailyAvailabilities.length === 0) {
      throw new NotFoundException('Room product not available');
    }

    // Branch by product type
    const byDateAvailabilities = new Map(
      (roomProductDailyAvailabilities ?? []).map((a) => [a.date, a] as const)
    );

    const hasCapacityEveryNight = expectedDates.every((d) => {
      const a = byDateAvailabilities.get(d);
      if (!a) return false; // missing row -> no capacity
      return this.hasAvailableToSell(a);
    });

    // check if every night has positive remaining capacity
    if (!hasCapacityEveryNight) {
      throw new BadRequestException(
        `Option is not available for the selected dates from ${format(checkIn, DATE_BUSINESS_FORMAT)} to ${format(addDays(stayEndDate, 1), DATE_BUSINESS_FORMAT)}`
      );
    }

    // Filter units to only include those available for ALL dates in the stay
    const fullyAvailableUnits = roomProductAssignedUnits.filter((unit: RoomProductAssignedUnit) => {
      const availableDates =
        unit.roomUnit?.roomUnitAvailabilities?.filter(
          (availability) =>
            availability.status === RoomUnitAvailabilityStatus.AVAILABLE &&
            expectedDates.includes(availability.date)
        ) || [];
      return availableDates.length === expectedDates.length;
    });

    const roomProductAssignedUnitsWithRate = await Promise.all(
      fullyAvailableUnits.map(async (unit: RoomProductAssignedUnit) => {
        const roomUnitAvailabilities = expectedDates.map((date) => {
          const availability = unit.roomUnit?.roomUnitAvailabilities?.find(
            (avail) => avail.date === date && avail.status === RoomUnitAvailabilityStatus.AVAILABLE
          );
          const a: Partial<RoomUnitAvailability> = {
            roomUnitId: availability?.roomUnitId || unit.roomUnitId,
            hotelId: availability?.hotelId || hotelId,
            date: date
          };
          return a;
        });
        const roomUnit = {
          ...unit.roomUnit,
          roomUnitAvailabilities
        };
        return {
          ...unit,
          roomUnit: roomUnit,
          totalAmount:
            (await this.calculateRoomUnitTotalFeatureRates(unit.roomUnitId))?.totalAmount ||
            new Decimal(0)
        };
      })
    );

    // If no fully available units, check per date if it has adjustment but no room units available
    // Create fake data only for dates that have adjustment but no available room units
    // For dates with available room units, use the actual room unit ID
    let finalAssignedUnits = roomProductAssignedUnitsWithRate;
    if (finalAssignedUnits.length === 0) {
      // Check which dates have adjustment but no room units available
      const datesNeedingFakeData = expectedDates.filter((date) => {
        const dailyAvail = byDateAvailabilities.get(date);
        const hasAdjustment = dailyAvail && (dailyAvail.adjustment ?? 0) > 0;

        const available = dailyAvail && (dailyAvail.available ?? 0) > 0;

        if (!hasAdjustment || !available) {
          return false; // No adjustment or available, don't need fake data
        }

        return true;
      });

      // Create fake data only if there are dates with adjustment but no room units
      if (datesNeedingFakeData.length > 0) {
        // For each date, assign real room unit ID if available, otherwise use empty string
        const roomUnitAvailabilities = expectedDates.map((date) => {
          // Check if this date has an available room unit
          const availableUnit = roomProductAssignedUnits.find((unit) => {
            return unit.roomUnit?.roomUnitAvailabilities?.some(
              (availability) =>
                availability.date === date &&
                availability.status === RoomUnitAvailabilityStatus.AVAILABLE
            );
          });

          if (availableUnit) {
            // Use the actual room unit ID and availability data
            const availability = availableUnit.roomUnit?.roomUnitAvailabilities?.find(
              (avail) =>
                avail.date === date && avail.status === RoomUnitAvailabilityStatus.AVAILABLE
            );
            return {
              roomUnitId: availability?.roomUnitId || availableUnit.roomUnitId,
              hotelId: availability?.hotelId || hotelId,
              date: date
            } as RoomUnitAvailability;
          } else {
            // No room unit available, use fake data (empty roomUnitId)
            return {
              roomUnitId: '',
              hotelId: hotelId,
              date: date
            } as RoomUnitAvailability;
          }
        });

        finalAssignedUnits = [
          {
            roomUnitId: '',
            roomUnit: {
              roomUnitAvailabilities
            } as any,
            totalAmount: new Decimal(0)
          } as any
        ];
      }
    }

    return {
      ...roomProduct,
      roomProductAssignedUnits: finalAssignedUnits,
      roomProductDailyAvailabilities
    };
  }

  private async checkRoomProductAvailabilityProposal(
    hotelId: string,
    arrival: string,
    departure: string,
    roomProductId: string,
    roomUnitId?: string
  ) {
    if (!hotelId || !arrival || !departure || !roomProductId || !roomUnitId) {
      throw new BadRequestException(
        'hotelId, arrival, departure, roomProductId and roomUnitId are required'
      );
    }

    // validate check in date and check out date
    this.validateAndCheckDateRangeChange(arrival, departure);

    const checkIn = startOfDay(new Date(arrival));
    const checkOut = startOfDay(new Date(departure));

    // checkout - 1 day because hotel pricing is per-night — guests leave on checkOut, and that night is not charged.
    const stayEndDate = subDays(checkOut, 1);

    // Build expected dates and validate each date has positive remaining capacity.
    const expectedDates: string[] = Helper.generateDateRange(
      format(checkIn, DATE_FORMAT),
      format(stayEndDate, DATE_FORMAT)
    );

    // get total nights
    const totalDays = expectedDates.length;

    // run parallel
    const [roomProduct, roomProductDailyAvailabilities, roomProductAssignedUnits] =
      await Promise.all([
        this.roomProductRepository.findOne({
          where: {
            id: roomProductId,
            hotelId,
            deletedAt: IsNull(),
            status: RoomProductStatus.ACTIVE
          },
          select: ['id', 'code', 'name', 'status', 'type', 'rfcAllocationSetting']
        }),

        this.roomProductDailyAvailabilityRepository.find({
          where: {
            hotelId,
            roomProductId: roomProductId,
            date: Between(format(checkIn, DATE_FORMAT), format(stayEndDate, DATE_FORMAT))
          },
          select: ['date', 'available', 'adjustment', 'sellLimit', 'sold']
        }),

        this.getRoomProductAssignedUnitProposal(
          roomProductId,
          format(checkIn, DATE_FORMAT),
          format(stayEndDate, DATE_FORMAT),
          roomUnitId
        )
      ]);

    if (!roomProduct || roomProductDailyAvailabilities.length === 0) {
      throw new NotFoundException('Room product not available');
    }

    // Branch by product type
    const byDateAvailabilities = new Map(
      (roomProductDailyAvailabilities ?? []).map((a) => [a.date, a] as const)
    );

    // const hasCapacityEveryNight = expectedDates.every((d) => {
    //   const a = byDateAvailabilities.get(d);
    //   if (!a) return false; // missing row -> no capacity
    //   return this.hasAvailableToSell(a);
    // });

    // // check if every night has positive remaining capacity
    // if (!hasCapacityEveryNight) {
    //   throw new BadRequestException(
    //     `Option is not available for the selected dates from ${format(checkIn, DATE_BUSINESS_FORMAT)} to ${format(addDays(stayEndDate, 1), DATE_BUSINESS_FORMAT)}`
    //   );
    // }

    // Filter units to only include those available for ALL dates in the stay
    const fullyAvailableUnits = roomProductAssignedUnits.filter((unit: RoomProductAssignedUnit) => {
      const availableDates =
        unit.roomUnit?.roomUnitAvailabilities?.filter((availability) =>
          // availability.status === RoomUnitAvailabilityStatus.AVAILABLE &&
          expectedDates.includes(availability.date)
        ) || [];
      return availableDates.length === expectedDates.length;
    });

    const roomProductAssignedUnitsWithRate = await Promise.all(
      fullyAvailableUnits.map(async (unit: RoomProductAssignedUnit) => {
        const roomUnitAvailabilities = expectedDates.map((date) => {
          const availability = unit.roomUnit?.roomUnitAvailabilities?.find(
            (avail) => avail.date === date
          );
          const a: Partial<RoomUnitAvailability> = {
            roomUnitId: availability?.roomUnitId || unit.roomUnitId,
            hotelId: availability?.hotelId || hotelId,
            date: date
          };
          return a;
        });
        const roomUnit = {
          ...unit.roomUnit,
          roomUnitAvailabilities
        };
        return {
          ...unit,
          roomUnit: roomUnit,
          totalAmount:
            (await this.calculateRoomUnitTotalFeatureRates(unit.roomUnitId))?.totalAmount ||
            new Decimal(0)
        };
      })
    );

    // If no fully available units, check per date if it has adjustment but no room units available
    // Create fake data only for dates that have adjustment but no available room units
    // For dates with available room units, use the actual room unit ID
    let finalAssignedUnits = roomProductAssignedUnitsWithRate;
    if (finalAssignedUnits.length === 0) {
      // Check which dates have adjustment but no room units available
      const datesNeedingFakeData = expectedDates.filter((date) => {
        const dailyAvail = byDateAvailabilities.get(date);
        const hasAdjustment = dailyAvail && (dailyAvail.adjustment ?? 0) > 0;

        const available = dailyAvail && (dailyAvail.available ?? 0) > 0;

        if (!hasAdjustment || !available) {
          return false; // No adjustment or available, don't need fake data
        }

        return true;
      });

      // Create fake data only if there are dates with adjustment but no room units
      if (datesNeedingFakeData.length > 0) {
        // For each date, assign real room unit ID if available, otherwise use empty string
        const roomUnitAvailabilities = expectedDates.map((date) => {
          // Check if this date has an available room unit
          const availableUnit = roomProductAssignedUnits.find((unit) => {
            return unit.roomUnit?.roomUnitAvailabilities?.some(
              (availability) =>
                availability.date === date &&
                availability.status === RoomUnitAvailabilityStatus.AVAILABLE
            );
          });

          if (availableUnit) {
            // Use the actual room unit ID and availability data
            const availability = availableUnit.roomUnit?.roomUnitAvailabilities?.find(
              (avail) =>
                avail.date === date && avail.status === RoomUnitAvailabilityStatus.AVAILABLE
            );
            return {
              roomUnitId: availability?.roomUnitId || availableUnit.roomUnitId,
              hotelId: availability?.hotelId || hotelId,
              date: date
            } as RoomUnitAvailability;
          } else {
            // No room unit available, use fake data (empty roomUnitId)
            return {
              roomUnitId: '',
              hotelId: hotelId,
              date: date
            } as RoomUnitAvailability;
          }
        });

        finalAssignedUnits = [
          {
            roomUnitId: '',
            roomUnit: {
              roomUnitAvailabilities
            } as any,
            totalAmount: new Decimal(0)
          } as any
        ];
      }
    }

    return {
      ...roomProduct,
      roomProductAssignedUnits: finalAssignedUnits,
      roomProductDailyAvailabilities
    };
  }

  async getRoomProductAssignedUnitAvailable(
    roomProductId: string,
    checkIn: string,
    stayEndDate: string
  ): Promise<RoomProductAssignedUnit[]> {
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpu')
      .where('rpu.roomProductId = :roomProductId', { roomProductId })
      .leftJoin('rpu.roomUnit', 'roomUnit')
      .select([
        'rpu.roomUnitId',
        'roomUnit.roomNumber',
        'roomUnitAvailabilities.status',
        'roomUnitAvailabilities.date',
        'roomUnitAvailabilities.roomUnitId',
        'roomUnitAvailabilities.hotelId'
      ])
      .leftJoin('roomUnit.roomUnitAvailabilities', 'roomUnitAvailabilities')
      .andWhere('roomUnitAvailabilities.status = :status', {
        status: RoomUnitAvailabilityStatus.AVAILABLE
      })
      .andWhere('roomUnitAvailabilities.date BETWEEN :from AND :to', {
        from: format(checkIn, DATE_FORMAT),
        to: format(stayEndDate, DATE_FORMAT)
      })
      .getMany();

    return roomProductAssignedUnits;
  }

  async getRoomProductAssignedUnitProposal(
    roomProductId: string,
    checkIn: string,
    stayEndDate: string,
    roomUnitId?: string
  ): Promise<RoomProductAssignedUnit[]> {
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpu')
      .where('rpu.roomProductId = :roomProductId', { roomProductId })
      .andWhere('rpu.roomUnitId = :roomUnitId', { roomUnitId })
      .leftJoin('rpu.roomUnit', 'roomUnit')
      .select([
        'rpu.roomUnitId',
        'roomUnit.roomNumber',
        'roomUnitAvailabilities.status',
        'roomUnitAvailabilities.date',
        'roomUnitAvailabilities.roomUnitId',
        'roomUnitAvailabilities.hotelId'
      ])
      .leftJoin('roomUnit.roomUnitAvailabilities', 'roomUnitAvailabilities')
      .andWhere('roomUnitAvailabilities.date BETWEEN :from AND :to', {
        from: format(checkIn, DATE_FORMAT),
        to: format(stayEndDate, DATE_FORMAT)
      })
      .getMany();

    return roomProductAssignedUnits;
  }

  async calculateRoomUnitTotalFeatureRates(roomUnitId: string): Promise<{
    individualRates: Array<{
      featureId: string;
      featureName: string;
      baseRate: Decimal;
      quantity: number;
      totalRate: Decimal;
    }>;
    totalAmount: Decimal;
  }> {
    try {
      // Fetch all room unit retail features with their related hotel retail features
      const roomUnitRetailFeatures = await this.roomUnitRetailFeatureRepository
        .createQueryBuilder('rurf')
        .leftJoinAndSelect('rurf.retailFeature', 'retailFeature')
        .where('rurf.roomUnitId = :roomUnitId', { roomUnitId })
        .andWhere('retailFeature.status = :status', { status: 'ACTIVE' })
        .andWhere('rurf.quantity >= 1')
        .andWhere('rurf.quantity IS NOT NULL')
        .getMany();

      if (roomUnitRetailFeatures.length === 0) {
        return {
          individualRates: [],
          totalAmount: new Decimal(0)
        };
      }

      // Use the utility to calculate multiple feature rates
      const calculation =
        RetailFeatureCalculationUtils.calculateMultipleRoomUnitRetailFeatures(
          roomUnitRetailFeatures
        );

      return {
        individualRates: calculation.results.map((result) => ({
          featureId: result.featureId,
          featureName: result.featureName,
          baseRate: result.baseRate,
          quantity: result.quantity,
          totalRate: result.totalRate
        })),
        totalAmount: calculation.totalAmount
      };
    } catch (error) {
      this.logger.error(`Error calculating room unit total feature rates: ${error.message}`);
      throw error;
    }
  }

  private validateAndCheckDateRangeChange(startDate: string, endDate: string): void {
    if (!startDate?.trim() || !endDate?.trim()) {
      throw new BadRequestException('Start date and end date are required');
    }

    const newStartDate = parseISO(startDate);
    const newEndDate = parseISO(endDate);

    if (!isValid(newStartDate) || !isValid(newEndDate)) {
      throw new BadRequestException('Invalid date format. Expected format: yyyy-MM-dd');
    }

    if (newEndDate < newStartDate) {
      throw new BadRequestException('End date must be greater than or equal to start date');
    }

    const dayCount = differenceInCalendarDays(newEndDate, newStartDate) + 1;

    // TODO: enhance sau
    if (dayCount > 365) {
      throw new BadRequestException('Date range must not exceed 365 days');
    }
  }

  /**
   * Update room unit availability status for all units assigned to a given room product
   * over a date range. Only allows setting to OUT_OF_ORDER or OUT_OF_INVENTORY.
   */
  async updateRoomUnitAvailabilityStatus(body: UpdateRoomUnitAvailabilityStatusDto) {
    const { hotelId, roomProductId, startDate, endDate, status } = body;

    if (!hotelId || !roomProductId || !startDate || !endDate || !status) {
      throw new BadRequestException(
        'hotelId, roomProductId, startDate, endDate and status are required'
      );
    }

    // Validate date range
    this.validateAndCheckDateRangeChange(startDate, endDate);

    // 1) Fetch assigned room units for the room product
    const assignedUnits = await this.roomProductRepository
      .createQueryBuilder('r')
      .leftJoin('r.roomProductAssignedUnits', 'assigned')
      .select('assigned.roomUnitId', 'roomUnitId')
      .where('r.id = :roomProductId', { roomProductId })
      .andWhere('r.hotelId = :hotelId', { hotelId })
      .getRawMany<{ roomUnitId: string }>();

    const roomUnitIds = assignedUnits.map((x) => x.roomUnitId).filter(Boolean);
    if (roomUnitIds.length === 0) {
      throw new NotFoundException('No assigned room units found for the room product');
    }

    // 2) Build list of dates (inclusive)
    const dates: string[] = Helper.generateDateRange(startDate, endDate);

    // 3) Upsert rows for each (roomUnitId, date)
    const rows = roomUnitIds.flatMap((unitId) =>
      dates.map((d) => ({ hotelId, roomUnitId: unitId, date: d, status }))
    );

    try {
      await this.roomUnitAvailabilityRepository
        .createQueryBuilder()
        .insert()
        .into(RoomUnitAvailability)
        .values(rows)
        .orUpdate(['status'], ['hotel_id', 'room_unit_id', 'date'])
        .execute();

      return { updated: true, unitCount: roomUnitIds.length, dates: dates.length };
    } catch (error) {
      this.logger.error('Error updating room product availability', error);
      throw new InternalServerErrorException('Error updating room product availability');
    }
  }

  /**
   * Retrieves MRFCs for a hotel, finds one specific MRFC, extracts its rooms,
   * retrieves RFCs/ERFCs with overlapping rooms, fetches their availability over
   * a date range, links each RFC/ERFC back to MRFC by room, sorts the RFCs/ERFCs
   * by room number, and returns a structured response.
   * return related rfc/erfc with availability and room unit availability
   */
  async getOverlappingRfcErfcForMrfc(body: GetOverlappingRfcErfcForMrfcDto) {
    const { hotelId, roomProductId, arrival, departure, name, retailFeatureIds, statusList } = body;

    if (!hotelId || !roomProductId || !arrival || !departure) {
      throw new BadRequestException('hotelId, roomProductId, arrival and departure are required');
    }

    this.validateAndCheckDateRangeChange(arrival, departure);

    const checkIn = startOfDay(new Date(arrival));
    const stayEndDate = startOfDay(new Date(departure));

    // 1. find room assign unit to this mrfc
    const mrfcAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpu')
      .where('rpu.roomProductId = :roomProductId', { roomProductId })
      .select(['rpu.roomUnitId'])
      .getMany();

    const mrfcRoomUnitIds = mrfcAssignedUnits.map((x) => x.roomUnitId).filter(Boolean);

    // 2. Retrieve RFCs/ERFCs with room assigned to mrfc room unit
    const overlappingAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpu')
      .where('rpu.roomUnitId IN (:...mrfcRoomUnitIds)', { mrfcRoomUnitIds })
      .andWhere('rpu.roomProductId != :roomProductId', { roomProductId }) // filter out mrfc itself
      .getMany();

    if (!overlappingAssignedUnits || overlappingAssignedUnits.length === 0) {
      throw new NotFoundException('No overlapping room products found with date range');
    }

    try {
      // 3. For those overlapping products, fetch ALL assigned units (not only those linked with MRFC)
      const overlappingProductIds = overlappingAssignedUnits
        .map((p) => p.roomProductId)
        .filter(Boolean);
      const overlappingProducts = await this.getRoomProductsAvailability({
        hotelId,
        type: [RoomProductType.ERFC, RoomProductType.RFC],
        startDate: format(checkIn, DATE_FORMAT),
        endDate: format(stayEndDate, DATE_FORMAT),
        ids: overlappingProductIds,
        name: name ? [name] : undefined,
        retailFeatureIds: retailFeatureIds ? retailFeatureIds : undefined,
        status: statusList ? statusList : undefined
      });

      if (!overlappingProducts || overlappingProducts.length === 0) {
        return [];
      }

      return overlappingProducts;
    } catch (error) {
      this.logger.error('Error getting overlapping room products', error);
      throw new InternalServerErrorException('Error getting overlapping room products');
    }
  }

  async roomProductReleaseAvailability(body: RoomProductReleaseAvailabilityDto) {
    const { hotelId, requestRooms } = body;

    if (!hotelId || !requestRooms || requestRooms.length === 0) {
      throw new BadRequestException('hotelId and requestRooms are required');
    }

    return await Promise.all(
      requestRooms.map((requestRoom) =>
        this.roomProductReleaseAvailabilityRequestRoom(hotelId, requestRoom)
      )
    );
  }

  async roomProductReleaseAvailabilityRequestRoom(
    hotelId: string,
    requestRoom: RequestRoomsUpdateDto
  ) {
    const { arrival, departure, roomProductId, roomUnitIds } = requestRoom;
    if (!roomProductId) {
      this.logger.warn(`Room product ID is required for release availability`);
      return null;
    }

    this.validateAndCheckDateRangeChange(arrival, departure);

    const checkInDate = startOfDay(new Date(arrival));
    // checkout - 1 day because hotel pricing is per-night — guests leave on checkOut, and that night is not charged.
    const stayEndDate = subDays(startOfDay(new Date(departure)), 1);

    // Generate date range for the stay
    const dates: string[] = Helper.generateDateRange(
      format(checkInDate, DATE_FORMAT),
      format(stayEndDate, DATE_FORMAT)
    );

    const newRoomUnitIds: string[] = roomUnitIds?.filter((unitId) => !!unitId) || [];
    try {
      if (newRoomUnitIds.length) {
        // check if room unit availability is already AVAILABLE for the date range
        const existingRoomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
          where: {
            hotelId,
            roomUnitId: In(newRoomUnitIds),
            date: In(dates),
            status: RoomUnitAvailabilityStatus.AVAILABLE
          }
        });

        const roomAvailableMap = new Map<string, Set<string>>();

        for (const roomUnitAvailability of existingRoomUnitAvailabilities) {
          if (!roomAvailableMap.has(roomUnitAvailability.roomUnitId)) {
            roomAvailableMap.set(roomUnitAvailability.roomUnitId, new Set());
          }
          roomAvailableMap.get(roomUnitAvailability.roomUnitId)?.add(roomUnitAvailability.date);
        }

        // Verify if all dates for all room units are already AVAILABLE
        const allDatesAvailable = newRoomUnitIds.every((roomUnitId) => {
          const availableDates = roomAvailableMap.get(roomUnitId) || new Set();
          return dates.every((date) => availableDates.has(date));
        });

        if (allDatesAvailable) {
          this.logger.warn(
            `Room unit availability is already AVAILABLE for the date range, skipping update`
          );
          return { success: true, datesUpdated: dates.length };
        }

        const roomUnitUpdateRows = newRoomUnitIds.flatMap((unitId) =>
          dates.map((date) => ({
            hotelId,
            roomUnitId: unitId,
            date,
            status: RoomUnitAvailabilityStatus.AVAILABLE,
            maintenanceId: null
          }))
        );

        // upsert room unit availability
        await this.roomUnitAvailabilityRepository
          .createQueryBuilder()
          .insert()
          .into(RoomUnitAvailability)
          .values(roomUnitUpdateRows)
          .orUpdate(['status'], ['hotel_id', 'room_unit_id', 'date'])
          .execute();

        this.logger.log(
          `Updated ${newRoomUnitIds.length} room units to AVAILABLE status for ${dates.length} dates`
        );

        // find related room products by room unit assigned id
        const relatedRoomProducts = await this.roomProductAssignedUnitRepository
          .createQueryBuilder('rpu')
          .select(['rpu.roomProductId'])
          .where('rpu.roomUnitId IN (:...roomUnitIds)', { roomUnitIds: newRoomUnitIds })
          .getMany();

        const relatedRoomProductIds = relatedRoomProducts.map((rp) => rp.roomProductId);

        await this.processUpdateRoomProductAvailability(
          hotelId,
          relatedRoomProductIds,
          Helper.generateDateRange(arrival, format(stayEndDate, DATE_FORMAT))
        );

        return { success: true, datesUpdated: dates.length };
      }

      // Handle overbooking release case - revert sold count while keeping available = 0
      // for carefully revert, we need to check all room unit availability assigned to this room product
      // find room unit availability assigned to this room product
      const roomProduct = (await this.roomProductRepository.findOne({
        where: {
          id: roomProductId,
          hotelId,
          deletedAt: IsNull(),
          status: RoomProductStatus.ACTIVE
        },
        select: ['id', 'type', 'rfcAllocationSetting', 'hotelId']
      })) as RoomProduct;

      if (!roomProduct) {
        throw new NotFoundException('Room Product not found');
      }

      await this.revertAvailabilityForOverbooking(hotelId, roomProductId, dates);
    } catch (error) {
      this.logger.error('Error unassigning room product', error);
      throw new InternalServerErrorException('Error unassigning room product');
    }
  }

  /**
   * Process room unit availability updates with comprehensive MRFC handling
   */
  async processRoomUnitAvailabilityUpdate(
    body: ProcessRoomUnitAvailabilityUpdateDto,
    from?: string
  ) {
    this.logger.debug(
      `🚀 ~ RoomProductAvailabilityService ~ processRoomUnitAvailabilityUpdate ~ from: ${from}`
    );
    const { hotelId, requestRooms } = body;

    if (!hotelId || !requestRooms || requestRooms.length === 0) {
      throw new BadRequestException('hotelId and requestRooms are required');
    }
    const result = await Promise.all(
      requestRooms.map((requestRoom) =>
        this.processRoomUnitAvailabilityUpdateRequestRoom(hotelId, requestRoom)
      )
    );

    // current date format is yyyy-MM-dd
    //   let lowestArrival = requestRooms[0].arrival;
    //   let highestDeparture = requestRooms[0].departure;
    //   let roomProductIds: string[] = [requestRooms[0].roomProductId];
    //   if (requestRooms.length) {
    //     for (const requestRoom of requestRooms.slice(1)) {
    //       roomProductIds.push(requestRoom.roomProductId);

    //       // get the lowest arrival and highest departure
    //       const arrival = startOfDay(new Date(requestRoom.arrival));
    //       const departure = startOfDay(new Date(requestRoom.departure));
    //       const currentArrival = startOfDay(new Date(lowestArrival));
    //       const currentDeparture = startOfDay(new Date(highestDeparture));
    //       if (arrival < currentArrival) {
    //         lowestArrival = requestRoom.arrival;
    //       }
    //       if (departure > currentDeparture) {
    //         highestDeparture = requestRoom.departure;
    //       }
    //     }
    //   }
    //   roomProductIds = [...new Set(roomProductIds)];

    //   const checkIn = startOfDay(new Date(lowestArrival));
    //   const checkOut = startOfDay(new Date(highestDeparture));
    //   // checkout - 1 day because hotel pricing is per-night — guests leave on checkOut, and that night is not charged.
    //   const stayEndDate = subDays(checkOut, 1);
    //   // Generate date range for the stay
    //   const dates: string[] = Helper.generateDateRange(
    //     format(checkIn, DATE_FORMAT),
    //     format(stayEndDate, DATE_FORMAT)
    //   ).sort();
    //   if (dates.length > 0) {
    //     await this.processUpdateRoomProductAvailability(hotelId, roomProductIds, dates); // missing await
    //   }
    return result;
  }

  async processRoomUnitAvailabilityUpdateRequestRoom(
    hotelId: string,
    requestRoom: RequestRoomsUpdateDto
  ) {
    const { arrival, departure, roomProductId, roomUnitIds } = requestRoom;

    if (!hotelId || !arrival || !departure || !roomProductId) {
      throw new BadRequestException('hotelId, arrival, departure and roomProductId are required');
    }

    this.validateAndCheckDateRangeChange(arrival, departure);

    const checkIn = startOfDay(new Date(arrival));
    const checkOut = startOfDay(new Date(departure));

    // checkout - 1 day because hotel pricing is per-night — guests leave on checkOut, and that night is not charged.
    const stayEndDate = subDays(checkOut, 1);

    // Generate date range for the stay
    const dates: string[] = Helper.generateDateRange(
      format(checkIn, DATE_FORMAT),
      format(stayEndDate, DATE_FORMAT)
    );

    try {
      // Step 1: Always update room unit statuses first (if not oversell case)
      if (roomUnitIds && roomUnitIds.length > 0) {
        // check if room unit availability is already assigned for the date range
        const existingRoomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
          where: {
            hotelId,
            roomUnitId: In(roomUnitIds),
            date: In(dates),
            status: RoomUnitAvailabilityStatus.ASSIGNED
          }
        });

        const roomAssignedMap = new Map<string, Set<string>>();

        for (const roomUnitAvailability of existingRoomUnitAvailabilities) {
          if (!roomAssignedMap.has(roomUnitAvailability.roomUnitId)) {
            roomAssignedMap.set(roomUnitAvailability.roomUnitId, new Set());
          }
          roomAssignedMap.get(roomUnitAvailability.roomUnitId)?.add(roomUnitAvailability.date);
        }

        // Verify if all dates for all room units are already assigned
        const allDatesAssigned = roomUnitIds.every((roomUnitId) => {
          const assignedDates = roomAssignedMap.get(roomUnitId) || new Set();
          return dates.every((date) => assignedDates.has(date));
        });

        if (allDatesAssigned) {
          this.logger.warn(
            `Room unit availability is already assigned for the date range, skipping update`
          );
          return { success: true, datesUpdated: dates.length };
        }

        // Mark room units as ASSIGNED for the date range
        const roomUnitUpdateRows = roomUnitIds.flatMap((unitId) =>
          dates.map((date) => ({
            hotelId,
            roomUnitId: unitId,
            date,
            status: RoomUnitAvailabilityStatus.ASSIGNED
          }))
        );

        // upsert room unit availability
        await this.roomUnitAvailabilityRepository
          .createQueryBuilder()
          .insert()
          .into(RoomUnitAvailability)
          .values(roomUnitUpdateRows)
          .orUpdate(['status'], ['hotel_id', 'room_unit_id', 'date'])
          .execute();

        this.logger.log(
          `Updated ${roomUnitIds.length} room units to ASSIGNED status for ${dates.length} dates, from ${dates[0]} to ${dates[dates.length - 1]}, roomIds: ${roomUnitIds.join(', ')}`
        );

        // find related room products by room unit assigned id
        const relatedRoomProducts = await this.roomProductAssignedUnitRepository
          .createQueryBuilder('rpu')
          .select(['rpu.roomProductId'])
          .where('rpu.roomUnitId IN (:...roomUnitIds)', { roomUnitIds })
          .getMany();

        const relatedRoomProductIds = relatedRoomProducts.map((rp) => rp.roomProductId);

        await this.processUpdateRoomProductAvailability(
          hotelId,
          relatedRoomProductIds,
          Helper.generateDateRange(arrival, format(stayEndDate, DATE_FORMAT))
        );

        return { success: true, datesUpdated: dates.length };
      }

      // if oversell case, update available and adjustment in room product daily availability
      // oversell case means roomUnitIds is empty

      // Step 2: Fetch the room product and check its type and settings
      const roomProduct = (await this.roomProductRepository.findOne({
        where: {
          id: roomProductId,
          hotelId,
          deletedAt: IsNull(),
          status: RoomProductStatus.ACTIVE
        },
        select: ['id', 'type', 'rfcAllocationSetting', 'hotelId']
      })) as RoomProduct;

      if (!roomProduct) {
        throw new NotFoundException('Room Product not found');
      }

      await this.updateAvailabilityForOverbooking(hotelId, roomProductId, dates);

      return { success: true, datesUpdated: dates.length };
    } catch (error) {
      this.logger.error('Error processing room unit availability update', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error processing room unit availability update');
    }
  }

  /**
   * Update availability for overbooking case
   * Increments sold count and decrements available by 1 when adjustment allows overbooking
   * This consumes the adjustment capacity (available decreases from adjustment value back to 0)
   */
  private async updateAvailabilityForOverbooking(
    hotelId: string,
    roomProductId: string,
    dates: string[]
  ): Promise<void> {
    // if oversell case, update available and adjustment in room product daily availability
    // oversell case means roomUnitIds is empty
    // const roomProductAssignedUnits = await this.getRoomProductAssignedUnitAvailable(
    //   roomProductId,
    //   format(dates[0], DATE_FORMAT),
    //   format(dates[dates.length - 1], DATE_FORMAT)
    // );

    // const availableRoomProductAssignedUnits = roomProductAssignedUnits.filter(
    //   (unit) => unit.roomUnit?.roomUnitAvailabilities?.length >= dates.length
    // );
    // const isSoldOutAllDates = availableRoomProductAssignedUnits.length === 0;

    // // if not sold out all dates, we cannot update the availability for overbooking
    // if (!isSoldOutAllDates) {
    //   this.logger.warn(
    //     `Room product ${roomProductId} is not sold out all dates, cannot update availability for overbooking`
    //   );
    //   return;
    // }
    // First, validate that overbooking is allowed for all dates
    const dailyAvailabilities = await this.roomProductDailyAvailabilityRepository
      .createQueryBuilder('rda')
      .where('rda.hotel_id = :hotelId', { hotelId })
      .andWhere('rda.room_product_id = :roomProductId', { roomProductId })
      .andWhere('rda.date IN (:...dates)', { dates })
      .getMany();

    // Validate each date has sufficient capacity for overbooking
    for (const date of dates) {
      const dailyAvail = dailyAvailabilities.find((da) => da.date === date);
      if (!dailyAvail) {
        throw new BadRequestException(`No availability record found for date ${date}`);
      }

      const available = dailyAvail.available ?? 0;
      const sold = dailyAvail.sold ?? 0;
      const sellLimit = dailyAvail.sellLimit ?? 0;
      const adjustment = dailyAvail.adjustment ?? 0;

      // Total capacity = sell_limit + adjustment
      const totalCapacity = sellLimit + adjustment;

      // Check if we can sell one more unit without exceeding total capacity
      const canSellMore = sold + 1 <= totalCapacity;
      const hasAvailableCapacity = available > 0;

      if (!canSellMore || !hasAvailableCapacity) {
        throw new BadRequestException(
          `Insufficient capacity for overbooking on date ${date}. ` +
            `Sold: ${sold}, Total Capacity: ${totalCapacity}, Available: ${available}`
        );
      }
    }

    // For overbooking: increment sold and recalculate available
    // Ensure sold never exceeds sell_limit + adjustment
    await this.roomProductDailyAvailabilityRepository
      .createQueryBuilder()
      .update(RoomProductDailyAvailability)
      .set({
        sold: () => `LEAST(
          COALESCE(sold, 0) + 1,
          COALESCE(sell_limit, 0) + COALESCE(adjustment, 0)
        )`,
        available: () => `GREATEST(
          (COALESCE(sell_limit, 0) + COALESCE(adjustment, 0)) - 
          LEAST(
            COALESCE(sold, 0) + 1,
            COALESCE(sell_limit, 0) + COALESCE(adjustment, 0)
          ),
          0
        )`
        // adjustment stays as is (manual override remains)
      })
      .where('hotel_id = :hotelId', { hotelId })
      .andWhere('room_product_id = :roomProductId', { roomProductId })
      .andWhere('date IN (:...dates)', { dates })
      .execute();
  }

  /**
   * Revert availability for overbooking case (opposite of updateAvailabilityForOverbooking)
   */
  private async revertAvailabilityForOverbooking(
    hotelId: string,
    roomProductId: string,
    dates: string[]
  ): Promise<void> {
    // if oversell case, update available and adjustment in room product daily availability
    // oversell case means roomUnitIds is empty
    // const roomProductAssignedUnits = await this.getRoomProductAssignedUnitAvailable(
    //   roomProductId,
    //   format(dates[0], DATE_FORMAT),
    //   format(dates[dates.length - 1], DATE_FORMAT)
    // );

    // const availableRoomProductAssignedUnits = roomProductAssignedUnits.filter(
    //   (unit) => unit.roomUnit?.roomUnitAvailabilities?.length >= dates.length
    // );
    // const isSoldOutAllDates = availableRoomProductAssignedUnits.length === 0;

    // // if sold out all dates, we cannot revert the availability for overbooking
    // if (!isSoldOutAllDates) {
    //   this.logger.warn(`Room product ${roomProductId} is not sold out all dates`);
    //   return;
    // }

    // For overbooking revert: decrement sold and increment available by 1
    // This restores the adjustment capacity (available goes from 0 back to 1)
    // CRITICAL: Ensure sold never exceeds sell_limit + adjustment after revert
    // If sold > sell_limit + adjustment after decrement, reset sold to sell_limit + adjustment
    await this.roomProductDailyAvailabilityRepository
      .createQueryBuilder()
      .update(RoomProductDailyAvailability)
      .set({
        sold: () => `LEAST(
          GREATEST(COALESCE(sold, 0) - 1, 0),
          COALESCE(sell_limit, 0) + COALESCE(adjustment, 0)
        )`,
        available: () => `GREATEST(
          (COALESCE(sell_limit, 0) + COALESCE(adjustment, 0)) - 
          LEAST(
            GREATEST(COALESCE(sold, 0) - 1, 0),
            COALESCE(sell_limit, 0) + COALESCE(adjustment, 0)
          ),
          0
        )`
        // adjustment stays as is (manual override remains)
      })
      .where('hotel_id = :hotelId', { hotelId })
      .andWhere('room_product_id = :roomProductId', { roomProductId })
      .andWhere('date IN (:...dates)', { dates })
      .execute();
  }

  async manualUpsertDailyAvailability(body: ManualUpsertDailyAvailabilityDto) {
    const { hotelId, roomProductId, startDate, endDate, available, sellLimit, adjustment } = body;

    if (!hotelId || !roomProductId || !startDate || !endDate) {
      throw new BadRequestException('hotelId, roomProductId, startDate and endDate are required');
    }

    if (available == null && sellLimit == null && adjustment == null) {
      throw new BadRequestException(
        'At least one of available, sellLimit, adjustment must be provided'
      );
    }

    this.validateAndCheckDateRangeChange(startDate, endDate);

    // Build list of dates (inclusive)
    const dates: string[] = Helper.generateDateRange(startDate, endDate);

    // Load existing rows to validate against sold counts
    const existing = await this.roomProductDailyAvailabilityRepository.find({
      where: {
        hotelId,
        roomProductId,
        date: Between(
          format(startOfDay(new Date(startDate)), DATE_FORMAT),
          format(startOfDay(new Date(endDate)), DATE_FORMAT)
        )
      }
    });

    const mapByDate = new Map(existing.map((e) => [e.date, e] as const));

    // Validate: proposed effective limit (sellLimit) + adjustment cannot be below sold
    for (const d of dates) {
      const row = mapByDate.get(d);
      const currentSold = row?.sold ?? 0;
      const baseLimitCandidate = available ?? row?.available ?? 0;
      const adjustmentCandidate = adjustment != null ? adjustment : (row?.adjustment ?? 0);
      const effectiveLimit = baseLimitCandidate + adjustmentCandidate;
      if (currentSold > effectiveLimit) {
        throw new BadRequestException(
          `Cannot set availability below already sold on ${d}: sold=${currentSold}, proposed effective limit=${effectiveLimit}`
        );
      }
    }

    // Insert missing rows first (no-op for existing)
    const missingDates = dates.filter((d) => !mapByDate.has(d));
    if (missingDates.length > 0) {
      const rows = missingDates.map((d) => ({
        hotelId,
        roomProductId,
        date: d,
        ...(available != null ? { available } : {}),
        ...(sellLimit != null ? { sellLimit } : {}),
        ...(adjustment != null ? { adjustment } : {})
      }));
      await this.roomProductDailyAvailabilityRepository
        .createQueryBuilder()
        .insert()
        .into(RoomProductDailyAvailability)
        .values(rows)
        .orIgnore()
        .execute();
    }

    // Update all rows in range with provided fields only
    const setClause: Partial<RoomProductDailyAvailability> = {};
    if (available != null) setClause.available = available;
    // if (sellLimit != null) setClause.sellLimit = sellLimit;
    if (adjustment != null) setClause.adjustment = adjustment;

    if (Object.keys(setClause).length === 0) {
      return { updated: false };
    }

    await this.roomProductDailyAvailabilityRepository
      .createQueryBuilder()
      .update(RoomProductDailyAvailability)
      .set(setClause)
      .where('hotel_id = :hotelId', { hotelId })
      .andWhere('room_product_id = :roomProductId', { roomProductId })
      .andWhere('date BETWEEN :from AND :to', {
        from: format(startOfDay(new Date(startDate)), DATE_FORMAT),
        to: format(startOfDay(new Date(endDate)), DATE_FORMAT)
      })
      .execute();

    return { updated: true, dates: dates.length };
  }

  pushAvailabilityToCmSiteminder(
    hotelId: string,
    roomProductId: string,
    startDate: string,
    endDate: string
  ) {
    // check start date if in the past, return today
    if (isBefore(new Date(startDate), new Date())) {
      startDate = format(new Date(), DATE_FORMAT);
    }
    // try {
    //   // step 1: get room product availability
    //   const roomProductAvailability = await this.roomProductDailyAvailabilityRepository.find({
    //     where: {
    //       hotelId,
    //       roomProductId,
    //       date: Between(format(startOfDay(new Date(startDate)), DATE_FORMAT), format(startOfDay(new Date(endDate)), DATE_FORMAT)),
    //     },
    //     order: { date: 'ASC' },
    //   });

    //   // step 2: map body to PushAvailabilitySmDto
    //   const pushAvailabilitySmDto: PushAvailabilitySmDto[] = roomProductAvailability.map((availability) => ({
    //     propertyId: hotelId,
    //     roomProductId,
    //     startDate: availability.date,
    //     endDate: format(addDays(new Date(availability.date), 1), DATE_FORMAT),
    //     bookingLimit: (availability.adjustment ?? 0) + (availability.available ?? 0),
    //   }));

    //   // step 3: push availability to Siteminder
    //   await this.cmSiteminderService.pushAvailability(pushAvailabilitySmDto);

    //   this.logger.log(
    //     `Pushed availability to Siteminder with startDate: ${startDate} and endDate: ${endDate} and hotelId: ${hotelId} and roomProductId: ${roomProductId}`,
    //   );
    // } catch (error) {
    //   this.logger.error(`Error pushing availability to Siteminder: ${error}`);
    //   throw error;
    // }
  }

  async generateRoomProductAvailability(body: GenerateRoomProductAvailabilityDto) {
    const { hotelId, roomProductIds, fromDate, toDate } = body;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    let roomProductIdsToProcess = roomProductIds;
    if (!roomProductIds || roomProductIds.length === 0) {
      roomProductIdsToProcess = (
        await this.roomProductRepository.find({
          where: { hotelId, deletedAt: IsNull() },
          select: {
            id: true,
            code: true
          }
        })
      ).map((roomProduct) => roomProduct.id);
    }

    if (!roomProductIdsToProcess || roomProductIdsToProcess.length === 0) {
      throw new BadRequestException('No room products to process');
    }

    const current = fromDate ? new Date(fromDate) : new Date();
    const end = toDate ? new Date(toDate) : addDays(current, 365);

    const dates = Helper.generateDateRange(format(current, DATE_FORMAT), format(end, DATE_FORMAT));
    await this.processUpdateRoomProductAvailability(hotelId, roomProductIdsToProcess, dates);

    return { success: true };
  }

  /**
   * Checks if an error is a PostgreSQL deadlock error
   */
  private isDeadlockError(error: any): boolean {
    // PostgreSQL deadlock error code is 40001
    return (
      error?.code === '40001' ||
      error?.code === '40P01' ||
      error?.message?.toLowerCase().includes('deadlock') ||
      error?.message?.toLowerCase().includes('deadlock detected')
    );
  }

  /**
   * Retries a database operation with exponential backoff on deadlock errors
   */
  private async retryOnDeadlock<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 100
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (this.isDeadlockError(error) && attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms, etc. (capped at 1000ms)
          const delayMs = Math.min(baseDelayMs * Math.pow(2, attempt), 1000);
          const jitter = Math.random() * 50; // Add small random jitter (0-50ms) to reduce collision
          const finalDelay = delayMs + jitter;

          this.logger.warn(
            `Deadlock detected in processUpdateRoomProductAvailability, retrying in ${Math.round(finalDelay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`
          );

          await new Promise((resolve) => setTimeout(resolve, finalDelay));
          continue;
        }

        // Not a deadlock or max retries reached, throw the error
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Updates room product daily availability based on room unit availability status
   * Calculates available, sold, and sell_limit based on actual room unit status for each date
   *
   * @param hotelId - Hotel identifier
   * @param roomUnits - Array of room units
   * @param dateRange - Optional date range to process (if not provided, processes current date)
   */
  async processUpdateRoomProductAvailability(
    hotelId: string,
    roomProductIds: string[],
    dateRange?: string[]
  ) {
    this.logger.log(
      `processUpdateRoomProductAvailability for hotel ${hotelId} from ${dateRange?.join(', ')}`
    );

    if (!roomProductIds || roomProductIds.length === 0) {
      this.logger.warn(`No room product ids provided for hotel ${hotelId}`);
      return;
    }

    try {
      // Step 1: Get all room product assignments for the provided room units
      const allRoomProductAssignments = await this.roomProductAssignedUnitRepository.find({
        where: {
          roomProductId: In(roomProductIds)
        },
        relations: ['roomProduct'],
        select: {
          roomUnitId: true,
          roomProductId: true,
          roomProduct: {
            id: true,
            code: true,
            rfcAllocationSetting: true,
            type: true,
            hotelId: true
          }
        }
      });

      if (!allRoomProductAssignments || allRoomProductAssignments.length === 0) {
        this.logger.warn(
          `No room product assignments found for hotel ${hotelId} with provided room units`
        );
        return;
      }

      const roomUnitIds = allRoomProductAssignments.map((assignment) => assignment.roomUnitId);

      // Step 2: Group assignments by room product
      const roomProductToUnits = new Map<string, string[]>();
      const roomProductMap = new Map<string, RoomProduct>();
      for (const assignment of allRoomProductAssignments) {
        if (!roomProductToUnits.has(assignment.roomProductId)) {
          roomProductToUnits.set(assignment.roomProductId, []);
          roomProductMap.set(assignment.roomProductId, assignment.roomProduct);
        }
        roomProductToUnits.get(assignment.roomProductId)!.push(assignment.roomUnitId);
      }

      // Step 3: Determine date range to process
      const dates: string[] = [];
      if (dateRange && dateRange.length > 0) {
        dates.push(...dateRange);
      } else {
        // Default to 365 days from current date if no range provided
        const current = new Date();
        const end = addDays(current, 365);
        dates.push(
          ...Helper.generateDateRange(format(current, DATE_FORMAT), format(end, DATE_FORMAT))
        );
      }

      this.logger.log(
        `Processing availability for ${roomProductToUnits.size} room products across ${dates.length} dates`
      );

      // Step 4: Fetch ALL room unit availabilities for all dates at once (PERFORMANCE OPTIMIZATION)
      const allRoomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
        where: {
          hotelId,
          roomUnitId: In(roomUnitIds),
          date: In(dates)
        },
        select: {
          roomUnitId: true,
          date: true,
          status: true
        },
        order: {
          date: 'ASC'
        }
      });

      // Step 5: Create lookup map for fast access
      const availabilityLookup = new Map<string, RoomUnitAvailabilityStatus>();
      for (const availability of allRoomUnitAvailabilities) {
        const key = `${availability.roomUnitId}_${availability.date}`;
        availabilityLookup.set(key, availability.status);
      }

      // Step 6: Get existing availability records to preserve adjustment values
      const existingAvailabilities = await this.roomProductDailyAvailabilityRepository.find({
        where: {
          hotelId,
          roomProductId: In(Array.from(roomProductToUnits.keys())),
          date: In(dates)
        },
        select: {
          roomProductId: true,
          date: true,
          adjustment: true
        }
      });

      // get block daily data
      // get reservation time slice data
      const [blockDailyData, reservationTimeSlices] = await Promise.all([
        await this.blockDailyRepository
          .createQueryBuilder('bd')
          .where('bd.hotelId = :hotelId', { hotelId })
          .andWhere('bd.roomProductId IN (:...roomProductIds)', { roomProductIds: roomProductIds })
          .andWhere('bd.date IN (:...dates)', { dates: dates })
          .andWhere('bd.deletedAt IS NULL')
          .andWhere('bd.status IN (:...statusList)', {
            statusList: [BlockStatus.DEFINITE, BlockStatus.TENTATIVE]
          })
          .getMany(),

        await this.reservationTimeSliceRepository.find({
          where: {
            roomProductId: In(roomProductIds),
            fromTime: Between(
              startOfDay(new Date(dates[0])),
              endOfDay(new Date(dates[dates.length - 1]))
            )
          }
        })
      ]);
      const blockDailyMap = this.mappingBlockDailyData(blockDailyData);
      const reservationTimeSliceMap = new Map<string, number>();
      for (const reservationTimeSlice of reservationTimeSlices) {
        const key = `${reservationTimeSlice.roomProductId}_${reservationTimeSlice.fromTime?.toISOString().split('T')[0]}`;
        const unassignedUnitCount = reservationTimeSliceMap.get(key) || 0;
        reservationTimeSliceMap.set(
          key,
          unassignedUnitCount + (reservationTimeSlice.roomId ? 0 : 1)
        );
      }
      // Create lookup map for existing adjustments
      const adjustmentLookup = new Map<string, number>();
      for (const existing of existingAvailabilities) {
        const key = `${existing.roomProductId}_${existing.date}`;
        adjustmentLookup.set(key, existing.adjustment || 0);
      }

      // Step 7: Prepare batch upsert data
      const upsertData: Array<{
        roomProductId: string;
        hotelId: string;
        date: string;
        available: number;
        soldUnassigned: number;
        sold: number;
        sellLimit: number;
        adjustment: number;
      }> = [];

      const sitemindersToUpdate: Array<{ roomProductId: string; date: string }> = [];

      // Step 8: Process each room product and date combination
      for (const [roomProductId, assignedUnitIds] of roomProductToUnits) {
        const roomProduct = roomProductMap.get(roomProductId);
        if (!roomProduct || roomProduct.deletedAt) {
          this.logger.warn(`Room product ${roomProductId} is deleted or not found`);
          continue;
        }

        // get room product rfc allocation setting
        const rfcAllocationSetting = roomProduct.rfcAllocationSetting;
        if (rfcAllocationSetting === RfcAllocationSetting.ALL) {
          this.logger.log(`RFC allocation setting is ALL for room product ${roomProduct.code}`);
        }

        for (const date of dates) {
          // Calculate counts based on status
          let availableCount = 0;
          let assignedCount = 0;
          const totalUnits = assignedUnitIds.length;

          // for rfc allocation setting = ALL, we need to check all assigned units
          // if any room unit is not available, we set available to 0
          if (rfcAllocationSetting === RfcAllocationSetting.ALL) {
            let allUnitsAvailable = true;

            for (const unitId of assignedUnitIds) {
              const lookupKey = `${unitId}_${date}`;
              const status = availabilityLookup.get(lookupKey);

              // If any unit is not available, mark as sold out
              if (status !== RoomUnitAvailabilityStatus.AVAILABLE) {
                allUnitsAvailable = false;
                break;
              }
            }

            // Set availability based on ALL units status
            availableCount = allUnitsAvailable ? 1 : 0;
            assignedCount = allUnitsAvailable ? 0 : 1;
          } else {
            // Count units by status using lookup map
            for (const unitId of assignedUnitIds) {
              const lookupKey = `${unitId}_${date}`;
              const status = availabilityLookup.get(lookupKey);

              switch (status) {
                case RoomUnitAvailabilityStatus.AVAILABLE:
                  availableCount++;
                  break;
                case RoomUnitAvailabilityStatus.ASSIGNED:
                  assignedCount++;
                  break;
                default:
                  break;
              }
            }
          }

          // // Get existing adjustment for this room product and date
          const adjustmentKey = `${roomProductId}_${date}`;
          const adjustment = adjustmentLookup.get(adjustmentKey) || 0;
          // get block daily data
          const dateBlocks = blockDailyMap.get(`${roomProductId}_${date}`);
          // get unassigned unit count
          const unassignedUnitCount = reservationTimeSliceMap.get(`${roomProductId}_${date}`) || 0;
          // Calculate available based on RFC allocation setting
          let calculatedAvailable: number;

          if (rfcAllocationSetting === RfcAllocationSetting.ALL) {
            // For ALL setting: available is 0 or 1 based on all units status
            calculatedAvailable = availableCount;
          } else {
            // For other settings: use overselling logic
            // availableWithAdjustment = availableCount + adjustment
            // available = max(0, availableWithAdjustment)
            // availableWithAdjustment = availableCount + adjustment - (definitelyBlock - pickedUnits)
            const availableWithAdjustment =
              availableCount +
              adjustment -
              ((dateBlocks?.definitelyBlock || 0) - (dateBlocks?.pickedUnits || 0)) -
              unassignedUnitCount;
            calculatedAvailable = Math.max(0, availableWithAdjustment);
          }

          // Add to batch upsert data
          upsertData.push({
            roomProductId,
            hotelId,
            date,
            available: calculatedAvailable,
            soldUnassigned: unassignedUnitCount,
            sold: assignedCount + unassignedUnitCount, // pickedUnits is the units that are picked up from the block but not assigned to any unit
            sellLimit: rfcAllocationSetting === RfcAllocationSetting.ALL ? 1 : totalUnits,
            adjustment: adjustment
          });

          // Track Siteminder updates
          sitemindersToUpdate.push({ roomProductId, date });
        }
      }

      // ---------------------------------------------------------------------
      // STEP 8.5: Filter to only changed availability (compare with Redis cache)
      // ---------------------------------------------------------------------
      const changedAvailData = await this.pricingCacheService.filterChanged('avail', upsertData);
      const changedAvailSet = new Set(
        changedAvailData.map((c) => `${c.hotelId}:${c.roomProductId}:${c.date}`)
      );
      const upsertDataFiltered = upsertData.filter((u) =>
        changedAvailSet.has(`${u.hotelId}:${u.roomProductId}:${u.date}`)
      );
      const skippedCount = upsertData.length - upsertDataFiltered.length;
      this.logger.log(
        `[PricingCache] hotel=${hotelId} | total=${upsertData.length} changed=${upsertDataFiltered.length} skipped=${skippedCount}`
      );

      // ---------------------------------------------------------------------
      // STEP 9: Deadlock-safe batch UPSERT for room product daily availability
      // ---------------------------------------------------------------------

      // 9.1 Sort deterministically to guarantee consistent row locking order
      upsertDataFiltered.sort((a, b) => {
        if (a.hotelId !== b.hotelId) {
          return a.hotelId.localeCompare(b.hotelId);
        }
        if (a.roomProductId !== b.roomProductId) {
          return a.roomProductId.localeCompare(b.roomProductId);
        }
        return a.date.localeCompare(b.date);
      });

      // 9.2 Use smaller chunks to reduce lock duration
      const CHUNK_SIZE = 400;

      for (let i = 0; i < upsertDataFiltered.length; i += CHUNK_SIZE) {
        const chunk = upsertDataFiltered.slice(i, i + CHUNK_SIZE);

        await this.retryOnDeadlock(async () => {
          await this.roomProductDailyAvailabilityRepository
            .createQueryBuilder()
            .insert()
            .into(RoomProductDailyAvailability)
            .values(chunk)
            .orUpdate(
              ['available', 'sold', 'sold_unassigned', 'sell_limit', 'adjustment'],
              ['room_product_id', 'date', 'hotel_id'],
              // Avoid row updates if values did not change
              { skipUpdateIfNoValuesChanged: true }
            )
            .execute();
        });
      }

      this.logger.log(
        `Successfully upserted ${upsertDataFiltered.length} room product availability records`
      );

      // Update Redis cache after successful upsert
      if (upsertDataFiltered.length > 0) {
        await this.pricingCacheService.setHashes('avail', upsertDataFiltered);
      }

      // step 11: process room product restriction
      const roomProductIdsSet = [...new Set(roomProductIds)];
      if (roomProductIdsSet.length > 0) {
        // Fire and forget
        Promise.all(
          roomProductIdsSet.map((roomProductId) =>
            this.roomProductRestrictionService.processAutomateLos({
              hotelId,
              roomProductIds: [roomProductId]
            })
          )
        ).catch((err) => {
          // Handle errors gracefully
          this.logger.error(`Error in processAutomateLos for hotel ${hotelId}`, err);
        });
      }

      try {
        if (dateRange && dateRange.length > 0 && roomProductIds.length > 0) {
          const roomProductPricingMethodDetails =
            await this.roomProductRatePlanRepository.findRoomProductPricingMethodDetail({
              hotelId,
              roomProductIds: roomProductIds,
              pricingMethods: [RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING]
            });
          const fromDate = dates[0];
          const toDate = dates[dates.length - 1];

          roomProductPricingMethodDetails.map((item) => {
            return this.roomProductPricingMethodDetailService.calculateFeatureBasedPricing({
              from: fromDate,
              to: toDate,
              hotelId,
              connectorType: ConnectorTypeEnum.APALEO,

              roomProductId: item.roomProductId,
              type: RoomProductPricingMethodEnum.PRODUCT_BASED_PRICING,
              ratePlanId: item.ratePlanId,
              unit: item.pricingMethodAdjustmentUnit,
              value: item.pricingMethodAdjustmentValue?.toString(),
              isPush: true
            });
          });
        }
      } catch (error) {
        this.logger.error(
          `Error in processUpdateRoomProductAvailability trigger room product pricing method detail for hotel ${hotelId}`,
          error
        );
        return { success: true, datesUpdated: dates.length };
      }

      this.logger.log(
        `processUpdateRoomProductAvailability completed for hotel ${hotelId}. Processed room products across ${dates.length} dates`
      );
      return { success: true, datesUpdated: dates.length };
    } catch (err) {
      // Log deadlock errors with additional context
      if (this.isDeadlockError(err)) {
        this.logger.error(
          `processUpdateRoomProductAvailability failed for hotel ${hotelId} due to deadlock after retries`,
          {
            hotelId,
            roomProductIds: roomProductIds?.slice(0, 10), // Log first 10 IDs to avoid log spam
            dateRange: dateRange?.slice(0, 5), // Log first 5 dates
            error: err.message,
            stack: err.stack
          }
        );
      } else {
        this.logger.error(
          `processUpdateRoomProductAvailability failed for hotel ${hotelId}`,
          err.stack || err
        );
      }
      throw err; // Re-throw to allow caller to handle the error
    }
  }

  private mappingBlockDailyData(blockDailyData: BlockDaily[]) {
    const blockDailyMap = new Map<
      string,
      {
        tentativelyBlock: number;
        definitelyBlock: number;
        pickedUnits: number;
      }
    >();
    for (const blockDaily of blockDailyData) {
      const key = `${blockDaily.roomProductId}_${blockDaily.date}`;
      const dateBlocks = blockDailyMap.get(key) || {
        tentativelyBlock: 0,
        definitelyBlock: 0,
        pickedUnits: 0
      };
      dateBlocks.tentativelyBlock += blockDaily.tentativelyBlock || 0;
      dateBlocks.definitelyBlock += blockDaily.definitelyBlock || 0;
      dateBlocks.pickedUnits += blockDaily.pickedUnits || 0;
      blockDailyMap.set(key, dateBlocks);
    }
    return blockDailyMap;
  }

  private async mappingRoomProductAssignedUnits(input: {
    hotelId: string;
    startDate: string;
    endDate: string;
    types: RoomProductType[];
    status: RoomProductStatus[];
    roomProductIds: string[];
  }) {
    const { hotelId, startDate, endDate, types, status, roomProductIds } = input;
    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpa')
      .leftJoin('rpa.roomProduct', 'roomProduct')
      .where('rpa.roomProductId IN (:...roomProductIds)', { roomProductIds })
      .andWhere('roomProduct.type IN (:...types)', { types: types || [] })
      .andWhere('roomProduct.status IN (:...status)', { status: status || [] })
      .select(['rpa.roomProductId', 'rpa.roomUnitId'])
      .getMany();
    let roomIds: string[] = roomProductAssignedUnits.map((rpa) => rpa.roomUnitId);
    roomIds = [...new Set(roomIds)];
    // get room unit daily availability data
    const roomUnitAvailabilityData = await this.roomUnitAvailabilityRepository
      .createQueryBuilder('rua')
      .where('rua.hotelId = :hotelId', { hotelId })
      .andWhere('rua.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('rua.roomUnitId IN (:...roomIds)', { roomIds })
      .select(['rua.roomUnitId', 'rua.date', 'rua.status'])
      .getMany();
    const roomUnitAvailabilityMap = new Map<string, RoomUnitAvailability[]>();
    for (const rua of roomUnitAvailabilityData) {
      const key = `${rua.roomUnitId}`;
      const roomUnitAvailability = roomUnitAvailabilityMap.get(key) || [];
      roomUnitAvailability.push(rua);
      roomUnitAvailabilityMap.set(key, roomUnitAvailability);
    }

    // mapping roomProductAssignedUnits to count total OOO, OOI, AVAILABLE, ASSIGNED units by room product and date
    const roomProductAssignedUnitsMap = new Map<
      string,
      {
        totalOutOfOrder: number;
        totalOutOfInventory: number;
        totalAvailable: number;
        totalAssigned: number;
        totalInventory: number;
      }
    >();
    for (const rpa of roomProductAssignedUnits) {
      const roomUnitAvailability = roomUnitAvailabilityMap.get(rpa.roomUnitId) || [];
      if (!roomUnitAvailability.length) continue;

      for (const rua of roomUnitAvailability) {
        const key = `${rpa.roomProductId}_${rua.date}`;
        const roomProductAssignedUnitCount = roomProductAssignedUnitsMap.get(key) || {
          totalOutOfOrder: 0,
          totalOutOfInventory: 0,
          totalAvailable: 0,
          totalAssigned: 0,
          totalInventory: 0
        };
        roomProductAssignedUnitCount.totalInventory++;
        switch (rua.status) {
          case RoomUnitAvailabilityStatus.OUT_OF_ORDER:
            roomProductAssignedUnitCount.totalOutOfOrder++;
            break;
          case RoomUnitAvailabilityStatus.OUT_OF_INVENTORY:
            roomProductAssignedUnitCount.totalOutOfInventory++;
            break;
          case RoomUnitAvailabilityStatus.AVAILABLE:
            roomProductAssignedUnitCount.totalAvailable++;
            break;
          case RoomUnitAvailabilityStatus.ASSIGNED:
            roomProductAssignedUnitCount.totalAssigned++;
            break;

          default:
            break;
        }
        roomProductAssignedUnitsMap.set(key, roomProductAssignedUnitCount);
      }
    }

    return roomProductAssignedUnitsMap;
  }

  async upsertRoomProductAvailability(body: UpsertRoomProductAvailabilityDto) {
    const { hotelId, roomProductId, startDate, endDate, adjustment } = body;

    // check if room product exists
    const roomProduct = await this.roomProductRepository.findOne({
      where: { id: roomProductId, hotelId }
    });

    if (!roomProduct) {
      throw new BadRequestException('Room product not found');
    }

    // check if start date is before today
    if (isBefore(startOfDay(new Date(startDate)), startOfDay(new Date()))) {
      throw new BadRequestException('Start date is before today');
    }

    // check if start date is after end date
    if (isAfter(startOfDay(new Date(startDate)), endOfDay(new Date(endDate)))) {
      throw new BadRequestException('Start date is after end date');
    }

    // check if adjustment is a number
    if (typeof adjustment !== 'number') {
      throw new BadRequestException('Adjustment must be a number');
    }

    // check if adjustment is a positive number
    const dates: string[] = Helper.generateDateRange(startDate, endDate);

    try {
      const currentRoomProductDailyAvailabilities =
        await this.roomProductDailyAvailabilityRepository.find({
          where: {
            hotelId,
            roomProductId,
            date: In(dates)
          }
        });
      const currentProductSoldOutDates: string[] = [];
      for (const date of dates) {
        const roomProductDailyAvailability = currentRoomProductDailyAvailabilities.find(
          (x) => x.date === date
        );
        if (roomProductDailyAvailability) {
          if (roomProductDailyAvailability.available + body.adjustment <= 0) {
            currentProductSoldOutDates.push(date);
          }
        }
      }

      const roomProductUpdateAvailabilityIds: string[] = [roomProductId];
      if (currentProductSoldOutDates.length > 0) {
        const overlappingProductIds = await this.getOverlappingRoomProductByMrfcId(roomProductId);
        const mrfcRoomProductByOverlappingIds =
          await this.getMrfcRoomProductByOverlappingIds(overlappingProductIds);

        const mrfcProductIds = [
          ...new Set(mrfcRoomProductByOverlappingIds.flatMap((x) => x.mrfcRoomProductIds))
        ];

        const mrfcProductAvailabilities = await this.roomProductDailyAvailabilityRepository.find({
          where: {
            hotelId,
            roomProductId: In(mrfcProductIds),
            deletedAt: IsNull(),
            date: In(dates)
          }
        });

        const mrfcProductAvailabilitiesMap = groupByToMapSingle(
          mrfcProductAvailabilities,
          (x) => `${x.roomProductId}_${x.date}`
        );

        const soldOutLinkProducts: {
          roomProductId: string;
          date: string;
        }[] = [];
        for (const mrfcRoomProductByOverlapping of mrfcRoomProductByOverlappingIds) {
          for (const date of dates) {
            const isSoldOut = mrfcRoomProductByOverlapping.mrfcRoomProductIds

              .map((x) => {
                const mrfcProductAvailability = mrfcProductAvailabilitiesMap.get(`${x}_${date}`);

                if (
                  mrfcProductAvailability &&
                  mrfcProductAvailability.roomProductId === roomProductId
                ) {
                  return mrfcProductAvailability.available + body.adjustment <= 0;
                }
                const total =
                  (mrfcProductAvailability?.available || 0) +
                  (mrfcProductAvailability?.adjustment || 0);

                return total <= 0;
              })
              .every((x) => x);

            if (isSoldOut) {
              soldOutLinkProducts.push({
                roomProductId: mrfcRoomProductByOverlapping.overlappingRoomProductId,
                date: date
              });
            }
          }
        }

        if (soldOutLinkProducts.length > 0) {
          const soldOutDates = [...new Set(soldOutLinkProducts.map((x) => x.date))];
          const soldOutRoomProductIds = [
            ...new Set(soldOutLinkProducts.map((x) => x.roomProductId))
          ];

          const soldOutRoomProductAvailabilities =
            await this.roomProductDailyAvailabilityRepository.find({
              where: {
                hotelId,
                roomProductId: In(soldOutRoomProductIds),
                date: In(soldOutDates)
              }
            });
          const soldOutRoomProductAvailabilitiesMap = groupByToMapSingle(
            soldOutRoomProductAvailabilities,
            (x) => `${x.roomProductId}_${x.date}`
          );

          const roomProductDailyAvailabilities: RoomProductDailyAvailability[] = [];
          for (const soldOutLinkProduct of soldOutLinkProducts) {
            const soldOutRoomProductAvailability = soldOutRoomProductAvailabilitiesMap.get(
              `${soldOutLinkProduct.roomProductId}_${soldOutLinkProduct.date}`
            );
            if (soldOutRoomProductAvailability) {
              soldOutRoomProductAvailability.adjustment =
                0 - soldOutRoomProductAvailability.available;
              roomProductDailyAvailabilities.push(soldOutRoomProductAvailability);
            }
          }

          roomProductUpdateAvailabilityIds.push(
            ...new Set(roomProductDailyAvailabilities.map((x) => x.roomProductId))
          );
          await this.roomProductDailyAvailabilityRepository.save(roomProductDailyAvailabilities);
        }
      }

      // upsert room product availability
      await this.roomProductDailyAvailabilityRepository
        .createQueryBuilder()
        .insert()
        .into(RoomProductDailyAvailability)
        .values(dates.map((date) => ({ roomProductId, date, adjustment, hotelId })))
        .orUpdate(['adjustment'], ['room_product_id', 'date', 'hotel_id'])
        .execute();

      // Recalculate availability for affected dates to reflect the new adjustments
      await this.processUpdateRoomProductAvailability(
        hotelId,
        roomProductUpdateAvailabilityIds,
        Helper.generateDateRange(startDate, endDate)
      );

      // check type MRFC
      if (roomProduct.type === RoomProductType.MRFC) {
        await this.updatePmsAvailabilityAdjustment(hotelId, roomProductId, startDate, endDate);
      }

      return body;
    } catch (error) {
      this.logger.error(`Error upserting room product availability: ${error}`);
      throw new BadRequestException('Error upserting room product availability: ' + error.message);
    }
  }

  async updatePmsAvailabilityAdjustment(
    hotelId: string,
    roomProductId: string,
    fromDate: string,
    toDate: string
  ) {
    const dates = Helper.generateDateRange(fromDate, toDate);

    const [roomProductDailyAvailabilities, roomProductMappingPms] = await Promise.all([
      this.roomProductDailyAvailabilityRepository.find({
        where: {
          hotelId,
          roomProductId,
          date: In(dates)
        },
        select: ['roomProductId', 'date', 'adjustment']
      }),

      this.roomProductMappingPmsRepository.findOne({
        where: {
          hotelId,
          roomProductId
        }
      })
    ]);

    if (roomProductDailyAvailabilities.length === 0) {
      this.logger.warn(
        `No room product daily availabilities found for room product ${roomProductId} in hotel ${hotelId}`
      );
      return;
    }

    const pmsRoomProductMappingCode = roomProductMappingPms?.roomProductMappingPmsCode || '';

    if (!pmsRoomProductMappingCode) {
      this.logger.warn(
        `No pms room product mapping code found for room product ${roomProductId} in hotel ${hotelId}`
      );
      return;
    }

    // Queue updates for debouncing
    if (!this.pmsAvailabilityUpdateQueue.has(hotelId)) {
      this.pmsAvailabilityUpdateQueue.set(hotelId, new Map());
      this.logger.debug(
        `[PMS Availability Queue] Created new queue for hotel ${hotelId}, roomProduct ${roomProductId}`
      );
    }

    const hotelQueue = this.pmsAvailabilityUpdateQueue.get(hotelId)!;
    const queueSizeBefore = hotelQueue.size;

    // Add or update entries in the queue
    for (const date of dates) {
      const roomProductDailyAvailability = roomProductDailyAvailabilities.find(
        (x) => x.date === date
      );
      if (roomProductDailyAvailability) {
        const key = `${pmsRoomProductMappingCode}_${date}`;
        hotelQueue.set(key, {
          pmsRoomProductMappingCode,
          startDate: format(new Date(date), DATE_FORMAT),
          endDate: format(new Date(date), DATE_FORMAT),
          adjustment: roomProductDailyAvailability.adjustment
        });
      }
    }

    const queueSizeAfter = hotelQueue.size;
    const hadExistingTimer = this.pmsAvailabilityTimers.has(hotelId);

    // Clear existing timer for this hotel
    if (hadExistingTimer) {
      clearTimeout(this.pmsAvailabilityTimers.get(hotelId)!);
      this.logger.debug(
        `[PMS Availability Queue] Reset timer for hotel ${hotelId}, queue size: ${queueSizeBefore} -> ${queueSizeAfter}`
      );
    }

    // Set new timer to flush updates after 30 seconds
    const timer = setTimeout(() => {
      this.flushPmsAvailabilityUpdates(hotelId);
    }, this.DEBOUNCE_DELAY_MS);

    this.pmsAvailabilityTimers.set(hotelId, timer);
  }

  private async flushPmsAvailabilityUpdates(hotelId: string) {
    this.logger.debug(`[PMS Availability Flush] Starting flush for hotel ${hotelId}`);

    const hotelQueue = this.pmsAvailabilityUpdateQueue.get(hotelId);

    if (!hotelQueue || hotelQueue.size === 0) {
      this.logger.debug(
        `[PMS Availability Flush] No updates to flush for hotel ${hotelId}, cleaning up`
      );
      this.pmsAvailabilityUpdateQueue.delete(hotelId);
      this.pmsAvailabilityTimers.delete(hotelId);
      return;
    }

    const queueSize = hotelQueue.size;
    this.logger.debug(
      `[PMS Availability Flush] Flushing ${queueSize} updates for hotel ${hotelId}`
    );

    // Convert queue to array
    const input = Array.from(hotelQueue.values());

    // Log details of what's being flushed
    const groupedByProduct = input.reduce(
      (acc, item) => {
        if (!acc[item.pmsRoomProductMappingCode]) {
          acc[item.pmsRoomProductMappingCode] = [];
        }
        acc[item.pmsRoomProductMappingCode].push(item);
        return acc;
      },
      {} as Record<string, UpdatePmsAvailabilityDto[]>
    );

    this.logger.debug(
      `[PMS Availability Flush] Updates grouped by product: ${Object.keys(groupedByProduct).length} products`
    );

    // Clear the queue and timer
    this.pmsAvailabilityUpdateQueue.delete(hotelId);
    this.pmsAvailabilityTimers.delete(hotelId);

    this.logger.debug(
      `[PMS Availability Flush] Queue cleared for hotel ${hotelId}, calling updatePmsAvailability`
    );

    // Push to PMS availability
    try {
      await this.pmsService.updatePmsAvailability(hotelId, input);
      this.logger.log(
        `Successfully pushed ${input.length} PMS availability updates for hotel ${hotelId}`
      );
    } catch (error) {
      this.logger.error(`Error pushing PMS availability updates for hotel ${hotelId}: ${error}`);
      this.logger.debug(
        `[PMS Availability Flush] Failed to flush updates for hotel ${hotelId}: ${error}`
      );
    }
  }

  async getMrfcRoomProductByOverlappingIds(overlappingRoomProductIds: string[]) {
    const assignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomProductId: In(overlappingRoomProductIds),
        roomProduct: {
          status: RoomProductStatus.ACTIVE,
          deletedAt: IsNull()
        }
      },
      select: ['roomUnitId', 'roomProductId']
    });
    const roomUnitIds = assignedUnits.map((x) => x.roomUnitId).filter(Boolean);
    const mrfcAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomUnitId: In(roomUnitIds),
        roomProductId: Not(In(overlappingRoomProductIds)),
        roomProduct: {
          status: RoomProductStatus.ACTIVE,
          type: RoomProductType.MRFC,
          deletedAt: IsNull()
        }
      },
      select: ['roomUnitId', 'roomProductId']
    });

    const results: {
      overlappingRoomProductId: string;
      mrfcRoomProductIds: string[];
    }[] = [];

    const assignedUnitsMapByProductId = groupByToMap(assignedUnits, (x) => x.roomProductId);
    const mrfcAssignedUnitsMapByRoomUnitId = groupByToMap(mrfcAssignedUnits, (x) => x.roomUnitId);

    for (const overlappingRoomProductId of overlappingRoomProductIds) {
      const assignedUnit = assignedUnitsMapByProductId.get(overlappingRoomProductId);
      const roomUnitIds = assignedUnit?.map((x) => x.roomUnitId).filter(Boolean);

      if (!roomUnitIds || roomUnitIds.length === 0) {
        continue;
      }

      const mrfcRoomProductIds = roomUnitIds
        .map((x) => mrfcAssignedUnitsMapByRoomUnitId.get(x)?.map((x) => x.roomProductId) || [])
        .flat();

      results.push({
        overlappingRoomProductId,
        mrfcRoomProductIds: [...new Set(mrfcRoomProductIds)]
      });
    }

    return results;
  }

  async getOverlappingRoomProductByMrfcId(roomProductId: string): Promise<string[]> {
    const mrfcAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpu')
      .where('rpu.roomProductId = :roomProductId', { roomProductId })
      .select(['rpu.roomUnitId'])
      .getMany();

    const mrfcRoomUnitIds = mrfcAssignedUnits.map((x) => x.roomUnitId).filter(Boolean);

    // 2. Retrieve RFCs/ERFCs with room assigned to mrfc room unit
    const overlappingAssignedUnits = await this.roomProductAssignedUnitRepository
      .createQueryBuilder('rpu')
      .where('rpu.roomUnitId IN (:...mrfcRoomUnitIds)', { mrfcRoomUnitIds })
      .andWhere('rpu.roomProductId != :roomProductId', { roomProductId }) // filter out mrfc itself
      .getMany();

    return overlappingAssignedUnits.map((p) => p.roomProductId).filter(Boolean);
  }

  async getAvailabilityCalendar(body: CalendarRoomProductQueryDto) {
    const { hotelId, fromDate, toDate, totalAdult, totalPet, childAgeList, types } = body;

    // Calculate guest counts
    const totalChildren = childAgeList?.length || 0;
    const requestedCapacity = totalAdult + totalChildren;
    const totalPets = totalPet || 0;

    const startTime = Date.now();

    try {
      // Step 1: Get room products with capacity filtering using raw query for performance
      const roomProductsWithCapacity = await this.getRoomProductsWithCapacityRaw(
        hotelId,
        types,
        totalAdult,
        totalChildren,
        totalPets,
        requestedCapacity
      );

      if (roomProductsWithCapacity.length === 0) {
        this.logger.warn(
          `No room products found with capacity for hotel ${hotelId} and types ${types}`
        );
        const emptyResult = {
          availabilityPerDate: [],
          roomProductsWithCapacity: []
        };
        return emptyResult;
      }

      // Step 2: Calculate availability per date using raw query
      // Optimized data structure - direct array processing instead of Map
      const availabilityPerDateArray: Array<[string, number]> = [];
      const dateSet = new Set<string>();
      let productsToCheck: Partial<RoomProduct>[];

      if (roomProductsWithCapacity.length > 0) {
        // Use filtered products
        const res = await this.calculateAvailabilityPerDateRaw(
          hotelId,
          fromDate,
          toDate,
          roomProductsWithCapacity
        );

        // Optimized processing - avoid Map overhead
        res.forEach((x) => {
          if (!dateSet.has(x.date)) {
            availabilityPerDateArray.push([x.date, x.available]);
            dateSet.add(x.date);
          }
        });

        const roomProductIdsAvailable = [...new Set(res.map((x) => x.roomProductId))].filter(
          (x) => x !== null
        );

        productsToCheck = roomProductsWithCapacity.filter((x) =>
          roomProductIdsAvailable.includes(x.id)
        );
      } else {
        this.logger.warn(
          `No room products found with capacity for hotel ${hotelId} and types ${types.join(', ')}`
        );
        const emptyResult = {
          availabilityPerDate: [],
          roomProductsWithCapacity: []
        };
        return emptyResult;
      }

      const result = {
        availabilityPerDate: availabilityPerDateArray,
        roomProductsWithCapacity: productsToCheck
      };

      const duration = Date.now() - startTime;
      this.logger.log(
        `Availability calendar query completed in ${duration}ms for hotel ${hotelId}`
      );

      // Alert if query takes too long
      if (duration > 2000) {
        this.logger.warn(`Slow query detected: ${duration}ms for hotel ${hotelId}`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Query failed after ${duration}ms: ${error.message}`);
      throw new BadRequestException('Error getting calendar: ' + error.message);
    }
  }

  // async getAvailabilityCalendarOptimize(body: CalendarRoomProductQueryDto) {
  //   const { hotelId, fromDate, toDate, totalAdult, totalPet, childAgeList, types } = body;

  //   // Calculate guest counts
  //   const totalChildren = childAgeList?.length || 0;
  //   const requestedCapacity = totalAdult + totalChildren;
  //   const totalPets = totalPet || 0;

  //   // Generate cache key for the request
  //   const cacheKey = this.generateCacheKey('availability_calendar', {
  //     hotelId,
  //     fromDate,
  //     toDate,
  //     totalAdult,
  //     totalChildren,
  //     totalPets,
  //     types: types.sort().join(',') // Sort for consistent cache keys
  //   });

  //   try {
  //     // Try to get from cache first (5 minute TTL for availability data)
  //     const cached = await this.getCachedResult(cacheKey);
  //     if (cached) {
  //       this.logger.debug(`Cache hit for availability calendar: ${cacheKey}`);
  //       return cached;
  //     }

  //     // Single optimized query that combines room product filtering and availability calculation
  //     const result = await this.getAvailabilityCalendarOptimized(
  //       hotelId,
  //       fromDate,
  //       toDate,
  //       types,
  //       totalAdult,
  //       totalChildren,
  //       totalPets,
  //       requestedCapacity
  //     );

  //     if (result.roomProductsWithCapacity.length === 0) {
  //       this.logger.warn(
  //         `No room products found with capacity for hotel ${hotelId} and types ${types}`
  //       );
  //       const emptyResult = {
  //         availabilityPerDate: [],
  //         roomProductsWithCapacity: []
  //       };
  //       // Cache empty results for shorter duration (1 minute)
  //       await this.setCachedResult(cacheKey, emptyResult, 60);
  //       return emptyResult;
  //     }

  //     // Cache successful results for 5 minutes
  //     await this.setCachedResult(cacheKey, result, 300);
  //     // this.logger.debug(`Cached availability calendar result: ${cacheKey}`);

  //     return result;
  //   } catch (error) {
  //     throw new BadRequestException('Error getting calendar: ' + error.message);
  //   }
  // }

  /**
   * Get room products with capacity filtering using raw SQL for maximum performance
   *
   * Filters out room products that cannot fit the required guests.
   *
   * Checks:
   * - Total capacity (capacityDefault + capacityExtra) >= requestedCapacity
   * - Adults capacity (maximumAdult) >= totalAdult
   * - Children capacity (maximumKid) >= totalChildren
   * - Pets capacity (maximumPet) >= totalPets
   *
   * Performance Notes:
   * - Uses existing composite index: ['hotelId', 'type', 'status'] for efficient filtering
   * - COALESCE functions handle NULL values without performance impact
   * - Ordered results by capacity for optimal user experience
   * - Consider adding index: ['hotelId', 'type', 'status', 'maximum_adult', 'maximum_kid'] for even better performance
   */
  private async getRoomProductsWithCapacityRaw(
    hotelId: string,
    types: string[],
    totalAdult: number,
    totalChildren: number,
    totalPets: number,
    requestedCapacity: number
  ): Promise<any[]> {
    const query = `
      SELECT 
        r.id,
        r.capacity_default as "capacityDefault",
        r.capacity_extra as "capacityExtra",
        r.maximum_adult as "maximumAdult",
        r.maximum_kid as "maximumKid",
        r.maximum_pet as "maximumPet",
        r.extra_bed_adult as "extraBedAdult",
        r.extra_bed_kid as "extraBedKid",
        r.number_of_bedrooms as "numberOfBedrooms",
        r.type,
        r.code,
        r.name,
        r.status
      FROM room_product r
      WHERE r.hotel_id = $1
        AND r.deleted_at IS NULL
        AND r.type = ANY($2::text[])
        AND r.status = $3
        AND $4 = ANY(r.distribution_channel)
        AND (COALESCE(r.capacity_default, 0) + COALESCE(r.capacity_extra, 0)) >= $5
        AND (COALESCE(r.maximum_adult, 0) + COALESCE(r.extra_bed_adult, 0)) >= $6
        AND (COALESCE(r.maximum_kid, 0) + COALESCE(r.extra_bed_kid, 0)) >= $7
        AND COALESCE(r.maximum_pet, 0) >= $8
        AND COALESCE(r.number_of_bedrooms, 0) > 0
      ORDER BY 
        -- Optimize ordering for better performance: prefer exact capacity matches first
        (COALESCE(r.capacity_default, 0) + COALESCE(r.capacity_extra, 0)) ASC,
        r.maximum_adult ASC,
        r.code ASC
    `;

    const result = await this.roomProductRepository.query(query, [
      hotelId,
      types,
      RoomProductStatus.ACTIVE,
      DistributionChannel.GV_SALES_ENGINE,
      requestedCapacity, // $5 - Total capacity requirement
      totalAdult, // $6 - Adults requirement
      totalChildren, // $7 - Children requirement
      totalPets // $8 - Pets requirement
    ]);

    return result;
  }

  async getCalendarSpecificRoomProduct(body: CalendarRoomProductAvailabilityQueryDto) {
    const { hotelId, fromDate, toDate, roomProductCodeList } = body;

    try {
      // Step 1: Get room products with capacity filtering using raw query for performance
      const roomProductsWithCapacity = await this.getRoomProductsWithCapacityRawSpecificRoomProduct(
        hotelId,
        roomProductCodeList
      );

      if (roomProductsWithCapacity.length === 0) {
        this.logger.warn(
          `No room products found with capacity for hotel ${hotelId} and room product code ${roomProductCodeList.join(', ')}`
        );
        return {
          availabilityPerDate: [],
          roomProductsWithCapacity: []
        };
      }

      // Step 2: Check if there's enough total capacity (using raw query)
      // const hasEnoughProduct = await this.checkHasEnoughProductCapacityRaw(
      //   hotelId,
      //   types,
      //   requestedCapacity,
      //   roomProductsWithCapacity.map((p) => p.id),
      // );

      // Step 3: Calculate availability per date using raw query
      const availabilityPerDate: Map<string, number> = new Map();
      let productsToCheck: Partial<RoomProduct>[];

      if (roomProductsWithCapacity.length > 0) {
        // Use filtered products
        productsToCheck = roomProductsWithCapacity;
        const res = await this.calculateAvailabilityPerDateRaw(
          hotelId,
          fromDate,
          toDate,
          roomProductsWithCapacity
        );

        res.forEach((x) => {
          const key = `${x.date}`;
          if (!availabilityPerDate.has(key)) {
            availabilityPerDate.set(key, x.available);
          }
        });
      } else {
        this.logger.warn(
          `No room products found with capacity for hotel ${hotelId} and room product code ${roomProductCodeList.join(', ')}`
        );
        return {
          availabilityPerDate: [],
          roomProductsWithCapacity: []
        };
      }

      return {
        availabilityPerDate: Array.from(availabilityPerDate),
        roomProductsWithCapacity: productsToCheck
      };
    } catch (error) {
      throw new BadRequestException('Error getting calendar: ' + error.message);
    }
  }

  /**
   * Optimized single-query approach that combines room product filtering and availability calculation
   *
   * Performance improvements:
   * - Single query instead of sequential execution (40-60% faster)
   * - Optimized date series generation with limited cross join
   * - Efficient availability calculation using window functions
   * - Reduced memory allocation with direct result processing
   * - Leverages covering indexes for index-only scans
   */
  private async getAvailabilityCalendarOptimized(
    hotelId: string,
    fromDate: string,
    toDate: string,
    types: string[],
    totalAdult: number,
    totalChildren: number,
    totalPets: number,
    requestedCapacity: number
  ): Promise<{
    availabilityPerDate: [string, number][];
    roomProductsWithCapacity: any[];
  }> {
    // Single query that filters room products and calculates availability in one go
    const query = `
      WITH eligible_products AS (
        SELECT 
          r.id,
          r.capacity_default as "capacityDefault",
          r.capacity_extra as "capacityExtra",
          r.maximum_adult as "maximumAdult",
          r.maximum_kid as "maximumKid",
          r.maximum_pet as "maximumPet",
          r.extra_bed_adult as "extraBedAdult",
          r.extra_bed_kid as "extraBedKid",
          r.number_of_bedrooms as "numberOfBedrooms",
          r.type,
          r.code,
          r.name,
          r.status
        FROM room_product r
        WHERE r.hotel_id = $1
          AND r.deleted_at IS NULL
          AND r.type = ANY($2::text[])
          AND r.status = $3
          AND $4 = ANY(r.distribution_channel)
          AND (COALESCE(r.capacity_default, 0) + COALESCE(r.capacity_extra, 0)) >= $5
          AND (COALESCE(r.maximum_adult, 0) + COALESCE(r.extra_bed_adult, 0)) >= $6
          AND (COALESCE(r.maximum_kid, 0) + COALESCE(r.extra_bed_kid, 0)) >= $7
          AND COALESCE(r.maximum_pet, 0) >= $8
          AND COALESCE(r.number_of_bedrooms, 0) > 0
        ORDER BY 
          -- Optimize ordering for better performance: prefer exact capacity matches first
          (COALESCE(r.capacity_default, 0) + COALESCE(r.capacity_extra, 0)) ASC,
          r.maximum_adult ASC,
          r.code ASC
      ),
      date_series AS (
        SELECT generate_series($9::date, $10::date, '1 day'::interval)::date::text as date
      ),
      availability_per_date AS (
        SELECT 
          ds.date,
          COUNT(CASE 
            WHEN rda.id IS NULL OR (
              (COALESCE(rda.sell_limit, 0) + COALESCE(rda.adjustment, 0)) - COALESCE(rda.sold, 0) > 0
              OR COALESCE(rda.available, 0) > 0
            ) THEN 1 
          END) as available_products_count
        FROM date_series ds
        CROSS JOIN eligible_products ep
        LEFT JOIN room_product_daily_availability rda 
          ON rda.room_product_id = ep.id 
          AND rda.date = ds.date
          AND rda.hotel_id = $1
        GROUP BY ds.date
        ORDER BY ds.date
      )
      SELECT 
        'products' as result_type,
        json_agg(ep.*) as data
      FROM eligible_products ep
      UNION ALL
      SELECT 
        'availability' as result_type,
        json_agg(json_build_object('date', apd.date, 'count', apd.available_products_count)) as data
      FROM availability_per_date apd
    `;

    const results = await this.roomProductRepository.query(query, [
      hotelId, // $1
      types, // $2
      RoomProductStatus.ACTIVE, // $3
      DistributionChannel.GV_SALES_ENGINE, // $4
      requestedCapacity, // $5 - Total capacity requirement
      totalAdult, // $6 - Adults requirement
      totalChildren, // $7 - Children requirement
      totalPets, // $8 - Pets requirement
      fromDate, // $9 - Date range start
      toDate // $10 - Date range end
    ]);

    // Process results
    let roomProductsWithCapacity: any[] = [];
    let availabilityPerDate: [string, number][] = [];

    for (const row of results) {
      if (row.result_type === 'products') {
        roomProductsWithCapacity = row.data || [];
      } else if (row.result_type === 'availability') {
        availabilityPerDate = (row.data || []).map((item: any) => [item.date, item.count]);
      }
    }

    return {
      availabilityPerDate,
      roomProductsWithCapacity
    };
  }

  /**
   * Check if there's enough total capacity using raw SQL
   */
  private async getRoomProductsWithCapacityRawSpecificRoomProduct(
    hotelId: string,
    roomProductCode: string[]
  ): Promise<any[]> {
    const normalizedRoomProductCode = roomProductCode.map((code) => code.toLowerCase()).at(0);
    const query = `
      SELECT 
        r.id,
        r.code,
        r.name,
        r.status
      FROM room_product r
      WHERE r.hotel_id = $1
        AND r.deleted_at IS NULL
        AND LOWER(r.code) = LOWER($2)
        AND r.status = $3
        AND $4 = ANY(r.distribution_channel)
      ORDER BY 
        -- Optimize ordering for better performance: prefer exact capacity matches first
        r.code ASC,
        r.name ASC
    `;

    const result = await this.roomProductRepository.query(query, [
      hotelId,
      normalizedRoomProductCode,
      RoomProductStatus.ACTIVE,
      DistributionChannel.GV_SALES_ENGINE
    ]);

    return result;
  }

  /**
   * Calculate availability per date using optimized raw SQL query
   *
   * Performance optimizations:
   * - Uses CTEs (Common Table Expressions) for better query planning
   * - Single query with JOINs instead of multiple round trips
   * - Leverages composite indexes on room_product_daily_availability
   * - FILTER clause for conditional aggregation (PostgreSQL 9.4+)
   *
   * Required indexes for optimal performance:
   * - IDX_room_product_daily_availability_hotel_date_product (hotel_id, date, room_product_id)
   * - IDX_room_product_daily_availability_covering (hotel_id, room_product_id, date) INCLUDE (sell_limit, adjustment, sold, available)
   */
  private async calculateAvailabilityPerDateRaw(
    hotelId: string,
    fromDate: string,
    toDate: string,
    roomProducts: RoomProduct[]
  ): Promise<{ date: string; roomProductId: string | null; available: number }[]> {
    if (roomProducts.length === 0) {
      return [];
    }

    const roomProductIds = roomProducts.map((p) => p.id);

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

    const availability = result
      .map((row) => ({
        date: row.date,
        roomProductId: row.room_product_id as string | null,
        available: Number(row.available) || 0
      }))
      .filter((x) => x.available > 0);

    return availability;
  }

  /**
   * Check if a daily availability record has products available to sell
   * Equivalent to dailyAvail.getAvailableToSell() > 0
   */
  private hasAvailableToSell(dailyAvail?: RoomProductDailyAvailability): boolean {
    if (!dailyAvail) {
      return false;
    }

    const available = dailyAvail.available ?? 0;
    return available > 0;
  }

  async getRoomProductMappingPms(body: GetRoomProductMappingPmsDto) {
    return this.roomProductCustomRepository.findRoomProductAndRoomUnitMappingPms(body);
  }

  async getSettingPmsRoomProductMapping(hotelId: string) {
    const roomProductMappingPms = await this.roomProductRepository.find({
      where: { hotelId, type: RoomProductType.MRFC, deletedAt: IsNull() },
      relations: ['roomProductMappingPms'],
      select: {
        roomProductMappingPms: {
          roomProductMappingPmsCode: true
        },
        id: true,
        code: true,
        type: true,
        name: true
      }
    });

    return roomProductMappingPms;
  }

  async getRelatedMrfc(body: GetRelatedMrfcDto) {
    const { hotelId, roomProductIds } = body;

    if (!hotelId || !roomProductIds?.length) {
      throw new BadRequestException('hotelId and roomProductId are required');
    }

    // get room product mapping
    const roomProductMappings = await this.roomProductMappingRepository
      .createQueryBuilder('mm')
      .distinctOn(['mm.relatedRoomProductId']) // 1 record / roomProductId
      .where('mm.hotelId = :hotelId', { hotelId })
      .andWhere('mm.relatedRoomProductId IN (:...ids)', { ids: roomProductIds })
      .orderBy('mm.relatedRoomProductId', 'ASC')
      .getMany();

    if (!roomProductMappings?.length) {
      throw new BadRequestException('Room product mapping not found');
    }
    const roomProducts: any[] = [];
    // get room product by room product mapping
    for (const roomProductMapping of roomProductMappings) {
      const roomProduct = await this.roomProductRepository
        .createQueryBuilder('rp')
        .where('rp.hotelId = :hotelId', { hotelId })
        .andWhere('rp.id = :roomProductId', { roomProductId: roomProductMapping.roomProductId })
        .select([
          'rp.id AS "relatedMrfcId"',
          'rp.code AS "relatedMrfcCode"',
          'rp.name AS "relatedMrfcName"'
        ])
        .getRawOne();
      if (!roomProduct) {
        throw new BadRequestException('Room product not found');
      }
      roomProduct['roomProductId'] = roomProductMapping.relatedRoomProductId;
      roomProducts.push(roomProduct);
    }

    if (!roomProducts?.length) {
      throw new BadRequestException('Room product not found');
    }

    return roomProducts;
  }

  async getRoomProductDailyAvailability(filter: RoomDailyAvailabilityFilter) {
    const { rfcId, hotelId, fromDate, toDate } = filter;

    const rangeDates = Helper.generateDateRange(fromDate, toDate);

    const roomProductDailyAvailability = await this.roomProductDailyAvailabilityRepository.find({
      where: {
        roomProductId: rfcId,
        date: In(rangeDates)
      }
    });

    const roomProduct = await this.roomProductRepository.findOne({
      where: {
        id: rfcId,
        hotelId: hotelId
      },
      select: {
        id: true,
        code: true,
        name: true,
        rfcAllocationSetting: true
      }
    });

    if (!roomProduct) {
      throw new BadRequestException('Room product not found');
    }

    const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
      where: {
        roomProductId: rfcId
      }
    });

    const roomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
      where: {
        roomUnitId: In(roomProductAssignedUnits.map((x) => x.roomUnitId)),
        status: RoomUnitAvailabilityStatus.AVAILABLE,
        date: In(rangeDates)
      }
    });

    const result: RoomDailyAvailabilityDto[] = [];
    for (const date of rangeDates) {
      const roomUnitAvailabilitiesInDate = roomUnitAvailabilities.filter((x) => x.date === date);

      let available =
        roomProduct.rfcAllocationSetting === RfcAllocationSetting.ALL
          ? 1
          : roomUnitAvailabilitiesInDate.length;
      let sold: number | null = null;
      let occupancy: number | null = null;

      const availabilityDaily = roomProductDailyAvailability.find(
        (x) => x.date === date && x.roomProductId === rfcId
      );
      if (availabilityDaily) {
        available = availabilityDaily.available;
        sold = availabilityDaily.sold;
        occupancy = sold / availabilityDaily.sellLimit;
      }

      result.push({
        date,
        occupancy: occupancy,
        roomSold: sold,
        availableRooms: available
      });
    }

    return result;
  }
}
