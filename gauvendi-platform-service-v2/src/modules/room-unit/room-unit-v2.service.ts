import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { ReservationStatusEnum } from '@src/core/entities/booking-entities/reservation.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  RoomUnitAvailability,
  RoomUnitAvailabilityStatus
} from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { ResponseStatusEnum, RoomProductStatus, RoomProductType } from '@src/core/enums/common';
import { Helper } from '@src/core/helper/utils';
import { groupByToMap } from '@src/core/utils/group-by.util';
import { chunk } from 'lodash';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PmsService } from '../pms/pms.service';
import { ReservationRepository } from '../reservation/repositories/reservation.repository';
import { RoomProductAvailabilityService } from '../room-product-availability/room-product-availability.service';
import { RoomProductRepository } from '../room-product/room-product.repository';
import { RoomProductService } from '../room-product/room-product.service';
import {
  CppCalendarReservationDto,
  CppCalendarRoomReservationDto,
  CppCalendarRoomReservationFilterDto
} from './dtos/cpp-calendar-room-reservation.dto';
import { CppCalendarRoomDto, CppCalendarRoomFilterDto } from './dtos/cpp-calendar-room.dto';
import { RoomUnitRepository } from './room-unit.repository';
import { RoomUnitService } from './room-unit.service';

@Injectable()
export class RoomUnitV2Service {
  constructor(
    private readonly roomUnitRepository: RoomUnitRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly pmsService: PmsService,
    private readonly roomProductCustomRepository: RoomProductRepository,
    private readonly roomUnitService: RoomUnitService,
    private readonly roomProductAvailabilityService: RoomProductAvailabilityService,

    private roomProductService: RoomProductService,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,

    @InjectRepository(BookingProposalSetting, DbName.Postgres)
    private readonly bookingProposalSettingRepository: Repository<BookingProposalSetting>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductMappingPms, DbName.Postgres)
    private readonly roomProductMappingPmsRepository: Repository<RoomProductMappingPms>
  ) {}

  private getEarliestDate(date1?: string, date2?: string): string | undefined {
    if (!date1 && !date2) return undefined;
    if (!date1) return date2;
    if (!date2) return date1;

    return new Date(date1) <= new Date(date2) ? date1 : date2;
  }

  private getLatestDate(date1?: string, date2?: string): string | undefined {
    if (!date1 && !date2) return undefined;
    if (!date1) return date2;
    if (!date2) return date1;

    return new Date(date1) >= new Date(date2) ? date1 : date2;
  }

  async getCppCalendarRoomReservations(
    filter: CppCalendarRoomReservationFilterDto
  ): Promise<CppCalendarRoomReservationDto[]> {
    const { hotelId, fromDate, toDate } = filter;
    const roomUnits = await this.roomUnitRepository.find({
      hotelId: hotelId,
      isAssigned: true
    });

    const hotel = await this.hotelRepository.findOne({
      where: {
        id: hotelId
      }
    });

    const reservations = await this.reservationRepository.findAll({
      hotelId: hotelId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      relations: {
        reservationRooms: true,
        primaryGuest: true,
        reservationTimeSlices: true
      },
      statuses: [
        ReservationStatusEnum.CONFIRMED,
        ReservationStatusEnum.PROPOSED,
        ReservationStatusEnum.RESERVED,
        ReservationStatusEnum.COMPLETED
        // ReservationStatusEnum.CANCELLED,
        // ReservationStatusEnum.RELEASED
      ]
    });

    const bookingProposalIds = reservations
      .filter((reservation) => reservation.status === ReservationStatusEnum.PROPOSED)
      .map((reservation) => reservation.bookingId);

    const reservationProposalBookings = await this.bookingProposalSettingRepository.find({
      where: {
        bookingId: In(bookingProposalIds)
      }
    });

    const bookingProposalSettingsMap = new Map<string, BookingProposalSetting>(
      reservationProposalBookings.map((bookingProposalSetting) => [
        bookingProposalSetting.bookingId,
        bookingProposalSetting
      ])
    );

    const map = new Map<string, CppCalendarReservationDto[]>();
    for (const reservation of reservations) {
      const cppCalendarReservation: CppCalendarReservationDto = {
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        arrival: reservation.arrival?.toISOString(),
        departure: reservation.departure?.toISOString(),
        bookingDate: reservation.bookingDate?.toISOString(),
        status: reservation.status,
        rooms: [],
        timeSlices: [],
        summarizedTimeSlices: [],
        bookingId: reservation.bookingId,
        primaryGuest: {
          firstName: reservation.primaryGuest?.firstName,
          lastName: reservation.primaryGuest?.lastName,
          emailAddress: reservation.primaryGuest?.emailAddress
        },
        isLocked: reservation.isLocked,
        proposalSetting: null
      };
      const bookingProposalSetting = bookingProposalSettingsMap.get(reservation.bookingId || '');

      if (reservation.status === ReservationStatusEnum.PROPOSED) {
        if (bookingProposalSetting) {
          cppCalendarReservation.proposalSetting = {
            id: bookingProposalSetting.id,
            createdAt: bookingProposalSetting.createdAt?.toISOString(),
            updatedAt: bookingProposalSetting.updatedAt?.toISOString(),
            deletedAt: bookingProposalSetting.deletedAt?.toISOString(),
            hotelId: bookingProposalSetting.hotelId,
            bookingId: bookingProposalSetting.bookingId,
            triggerAt: bookingProposalSetting.triggerAt.toISOString(),
            validBefore: bookingProposalSetting.validBefore.toISOString()
          };
        }
      }

      if (reservation.reservationRooms.length > 0) {
        for (const timeSlice of reservation.reservationTimeSlices) {
          if (!timeSlice.roomId) continue;

          const reservationTimeSlice: CppCalendarReservationDto = {
            id: reservation.id,
            reservationNumber: reservation.reservationNumber,
            arrival: timeSlice.fromTime?.toISOString(),
            departure: timeSlice.toTime?.toISOString(),
            bookingDate: reservation.bookingDate?.toISOString(),
            status: reservation.status,
            rooms: [],
            timeSlices: [],
            summarizedTimeSlices: [],
            bookingId: reservation.bookingId,
            primaryGuest: {
              firstName: reservation.primaryGuest?.firstName,
              lastName: reservation.primaryGuest?.lastName,
              emailAddress: reservation.primaryGuest?.emailAddress
            },
            isLocked: reservation.isLocked,
            proposalSetting: bookingProposalSetting
              ? {
                  id: bookingProposalSetting.id,
                  createdAt: bookingProposalSetting.createdAt?.toISOString(),
                  updatedAt: bookingProposalSetting.updatedAt?.toISOString(),
                  deletedAt: bookingProposalSetting.deletedAt?.toISOString(),
                  hotelId: bookingProposalSetting.hotelId,
                  bookingId: bookingProposalSetting.bookingId,
                  triggerAt: bookingProposalSetting.triggerAt.toISOString(),
                  validBefore: bookingProposalSetting.validBefore.toISOString()
                }
              : null
          };

          const currentReservations = map.get(timeSlice.roomId) || [];
          currentReservations.push(reservationTimeSlice);
          map.set(timeSlice.roomId, currentReservations);
        }
      } else {
        const currentRoomId =
          reservation.reservationRooms && reservation.reservationRooms.length > 0
            ? reservation.reservationRooms[0].roomId
            : null;

        if (currentRoomId) {
          const currentReservations = map.get(currentRoomId) || [];
          currentReservations.push(cppCalendarReservation);
          map.set(currentRoomId, currentReservations);
        }
      }
    }

    return roomUnits.map((roomUnit) => {
      const currentReservations = map.get(roomUnit.id) || [];

      // Group reservations by ID and merge them
      const reservationMap = new Map<string, CppCalendarReservationDto>();

      for (const reservation of currentReservations) {
        const existingReservation = reservationMap.get(reservation.id);

        if (existingReservation) {
          // Merge reservations with same ID
          const mergedReservation: CppCalendarReservationDto = {
            ...existingReservation,
            // Take the earliest arrival date
            arrival: this.getEarliestDate(existingReservation.arrival, reservation.arrival),
            // Take the latest departure date
            departure: this.getLatestDate(existingReservation.departure, reservation.departure)
          };
          reservationMap.set(reservation.id, mergedReservation);
        } else {
          // First occurrence of this reservation ID
          reservationMap.set(reservation.id, { ...reservation });
        }
      }

      const newReservationList = Array.from(reservationMap.values());

      return {
        roomId: roomUnit.id,
        reservationList: newReservationList
      };
    });
  }

  async cppCalendarRoom(filter: CppCalendarRoomFilterDto): Promise<CppCalendarRoomDto[]> {
    const { hotelId, fromDate, toDate } = filter;
    const rangeDates = Helper.generateDateRange(fromDate, toDate);
    const roomUnits = await this.roomUnitRepository.find({
      hotelId: hotelId,
      isAssigned: true
    });

    const roomUnitAvailabilities = await this.roomUnitAvailabilityRepository.find({
      where: {
        hotelId: hotelId,
        roomUnitId: In(roomUnits.map((roomUnit) => roomUnit.id)),
        status: RoomUnitAvailabilityStatus.OUT_OF_ORDER,
        date: In(rangeDates)
      }
    });

    const roomUnitAvailabilityMap = groupByToMap(roomUnitAvailabilities, (item) => item.roomUnitId);

    return roomUnits.map((roomUnit) => {
      const currentRoomUnitAvailability = roomUnitAvailabilityMap.get(roomUnit.id) || [];
      return {
        id: roomUnit.id,
        roomNumber: roomUnit.roomNumber,
        roomStatus: roomUnit.status,
        outOfOrderDates: currentRoomUnitAvailability.map((item) => item.date)
      };
    });
  }

  async syncRoomUnitInventory(hotelId: string): Promise<any> {
    const [pmsRoomUnits, pmsRoomProducts, roomUnits, roomProducts] = await Promise.all([
      this.pmsService.getPmsRoomUnits(hotelId),
      this.pmsService.getPmsRoomProducts(hotelId),
      this.roomUnitRepository.find({
        hotelId: hotelId
      }),
      this.roomProductRepository.find({
        where: {
          hotelId: hotelId,
          type: RoomProductType.MRFC
        },
        relations: ['roomProductMappingPms']
      }),
    ]);
    const roomUnitsMap = new Map<string, RoomUnit>();
    for (const item of roomUnits) {
      if (!item.mappingPmsCode) {
        continue;
      }
      roomUnitsMap.set(item.mappingPmsCode, item);
    }
    const roomProductsMap = new Map<string, RoomProduct>();
    for (const item of roomProducts) {
      const roomProductMappingPmsCode = item.roomProductMappingPms?.[0]?.roomProductMappingPmsCode;
      if (!roomProductMappingPmsCode) {
        continue;
      }

      roomProductsMap.set(roomProductMappingPmsCode, item);
    }

    // update room unit inventory
    const updatedRoomUnits: Partial<RoomUnit>[] = [];
    for (const item of pmsRoomUnits) {
      const roomUnit = roomUnitsMap.get(item.roomUnitMappingPmsCode);
      const updateBody: Partial<RoomUnit> = {
        roomNumber: item.name,
        hotelId: hotelId,
        mappingPmsCode: item.roomUnitMappingPmsCode,
        roomFloor: item.floor,
        status: item.status,
      };
      if (!roomUnit) {
        updatedRoomUnits.push({
          id: uuidv4(),
          hotelId: hotelId,
          mappingPmsCode: item.roomUnitMappingPmsCode,
          ...updateBody,
        });
        continue;
      }

      updatedRoomUnits.push({
        ...roomUnit,
        ...updateBody,
      });
    }

    // update room product inventory
    const updatedRoomProducts: Partial<RoomProduct>[] = [];
    const createRoomProducts: Partial<RoomProduct>[] = [];
    const updatedRoomProductMappingPms: Partial<RoomProductMappingPms>[] = [];
    let countMrfc = (roomProducts.length || 0) + 1;
    for (const item of pmsRoomProducts) {
      const roomProduct = roomProductsMap.get(item.roomProductMappingPmsCode);
      if (!roomProduct) {
        const type = item.productType || RoomProductType.MRFC;
        const roomProductId = uuidv4();
        createRoomProducts.push({
          code: `${type}${String(countMrfc).padStart(3, '0')}`,
          hotelId: hotelId,
          roomProductMappingPms: [
            {
              roomProductId: roomProductId,
              roomProductMappingPmsCode: item.roomProductMappingPmsCode
            } as RoomProductMappingPms
          ],
          name: item.name,
          description: item.description,
          // Default Product Capacity
          capacityDefault: item.productCapacity || 1,
          maximumAdult: item.productCapacity || 1,
          maximumKid: 0,
          // Additional Extra Bed Capacity
          capacityExtra: item.productExtraCapacity || 0,
          extraBedAdult: item.productExtraCapacity || 0,
          extraBedKid: 0,
          status: item.status || RoomProductStatus.DRAFT,
          type
        });
        countMrfc++;
        continue;
      }

      updatedRoomProducts.push({
        id: roomProduct.id,
        capacityDefault: item.productCapacity || roomProduct.capacityDefault
      });

      updatedRoomProductMappingPms.push({
        roomProductId: roomProduct.id,
        hotelId: hotelId,
        roomProductMappingPmsCode: item.roomProductMappingPmsCode
      });
    }

    const [updatedRoomUnitsResult, updatedRoomProductsResult, createRoomProductsResult] =
      await Promise.all([
        updatedRoomUnits.length
          ? this.roomUnitRepository.upsertRoomUnits(updatedRoomUnits)
          : Promise.resolve([]),
        updatedRoomProducts.length
          ? this.roomProductRepository.save(updatedRoomProducts)
          : Promise.resolve([]),
        createRoomProducts.length
          ? Promise.all(
              createRoomProducts.map((item) =>
                this.roomProductService.createRoomProduct({
                  hotelId: hotelId,
                  name: item.name as string,
                  type: item.type as any,
                  productCode: item.code as string,
                  additionalData: item
                })
              )
            )
          : Promise.resolve([])
      ]);

    // update room product mapping pms
    const createRoomProductsMap = new Map<string, Partial<RoomProduct>>(
      createRoomProducts.map((item) => [item.code as string, item])
    );
    for (const item of createRoomProductsResult) {
      if (!item || typeof item === 'boolean') continue;

      const roomProduct = createRoomProductsMap.get(item.code as string);
      if (!roomProduct || !roomProduct.roomProductMappingPms?.[0]?.roomProductMappingPmsCode) {
        continue;
      }

      updatedRoomProductMappingPms.push({
        roomProductId: item.id,
        hotelId: hotelId,
        roomProductMappingPmsCode: roomProduct.roomProductMappingPms[0].roomProductMappingPmsCode
      });
    }

    await this.roomProductMappingPmsRepository.upsert(updatedRoomProductMappingPms, {
      conflictPaths: ['hotelId', 'roomProductId'],
      skipUpdateIfNoValuesChanged: true
    });

    let roomProductIds: string[] = [
      ...updatedRoomProductsResult.map((item) => item.id),
      ...createRoomProductsResult
        .filter((item) => item && typeof item !== 'boolean')
        .map((item) => item.id)
    ];
    roomProductIds = [...new Set(roomProductIds)];
    const newRoomProducts =
      (await this.roomProductRepository.find({
        where: {
          id: In(roomProductIds)
        },
        relations: ['roomProductAssignedUnits', 'roomProductMappingPms']
      })) || [];
    const newRoomProductsMap = new Map<string, RoomProduct>(
      newRoomProducts.map((item) => [
        item.roomProductMappingPms?.[0]?.roomProductMappingPmsCode,
        item
      ])
    );
    const newRoomUnitMap = new Map<string, RoomUnit>(
      updatedRoomUnitsResult.map((item) => [item.mappingPmsCode, item])
    );

    const getPmsRoomProductsAssignment = (await this.pmsService.getPmsRoomProductsAssignment(hotelId));
    const pmsRoomProductWithAssignUnits: { [key: string]: string[] } = {...(getPmsRoomProductsAssignment?.categoryAssignmentMap || {})}

    const assignUnitList: { roomProduct: RoomProduct; roomUnitIds: string[] }[] = [];
    for (const [key, value] of Object.entries(pmsRoomProductWithAssignUnits)) {
      const roomProduct = newRoomProductsMap.get(key);
      if (!roomProduct) {
        continue;
      }

      let assignUnitIds: string[] = value
        .map((item) => newRoomUnitMap.get(item)?.id)
        .filter(Boolean) as string[];
      assignUnitIds = [...new Set(assignUnitIds)];
      assignUnitList.push({ roomProduct: roomProduct, roomUnitIds: assignUnitIds });
    }

    // chunk assignUnitList to 1000 items
    const chunkAssignUnitList = chunk(assignUnitList, 20);
    for (const chunk of chunkAssignUnitList) {
      await Promise.all(
        chunk.map((item) =>
          this.roomProductCustomRepository.updateRoomProductAssignedUnits(
            item.roomProduct,
            item.roomUnitIds
          )
        )
      );
    }

    // generate room unit availability
    const chunkRoomUnits = chunk(updatedRoomUnitsResult, 20);
    for (const chunkRoomUnit of chunkRoomUnits) {
      await Promise.all(
        chunkRoomUnit.map((item) =>
          this.roomUnitService.generateRoomUnitAvailabilityWithOneRoomUnit(hotelId, item.id)
        )
      );
    }

    // generate room product availability
    this.roomProductAvailabilityService.generateRoomProductAvailability({
      hotelId: hotelId,
      roomProductIds: newRoomProducts.map((item) => item.id)
    });

    return {
      status: ResponseStatusEnum.SUCCESS,
      message: `Sync room unit inventory success: ${updatedRoomUnitsResult.length}`,
      data: updatedRoomUnitsResult?.length
    };
  }

  async getPmsRoomUnitsInventory(hotelId: string): Promise<any> {
    const pmsRoomUnits = await this.pmsService.getPmsRoomUnits(hotelId);
    return pmsRoomUnits;
  }
}
