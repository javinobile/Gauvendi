import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { RoomUnitAvailabilityStatus } from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { Helper } from '@src/core/helper/utils';
import { FindOptionsSelect, FindOptionsWhere, In, InsertResult, Repository } from 'typeorm';

@Injectable()
export class RoomUnitRepository {
  constructor(
    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>
  ) {}

  /**
   * Alternative approach using WHERE conditions with subquery
   * More declarative but might be less performant for large datasets
   */
  async find(
    filter: {
      roomUnitIds?: string[];
      hotelId: string;
      isAssigned?: boolean;
      relations?: string[];
    },
    select?: string[]
  ): Promise<RoomUnit[]> {
    const { roomUnitIds, hotelId, isAssigned, relations } = filter;

    const queryBuilder = this.roomUnitRepository
      .createQueryBuilder('roomUnit')
      .where('roomUnit.hotelId = :hotelId', { hotelId })
      .andWhere('roomUnit.deletedAt IS NULL');

    // Handle roomUnitIds filter
    if (roomUnitIds && roomUnitIds.length) {
      queryBuilder.andWhere('roomUnit.id IN (:...roomUnitIds)', { roomUnitIds });
    }

    // Handle isAssigned filter using subquery
    if (isAssigned !== undefined && isAssigned !== null) {
      if (isAssigned) {
        // Room units that ARE assigned (EXISTS in assignment table)
        queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM room_product_assigned_unit rpau 
            WHERE rpau.room_unit_id = "roomUnit"."id"
          )`
        );
      } else {
        // Room units that are NOT assigned (NOT EXISTS in assignment table)
        queryBuilder.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM room_product_assigned_unit rpau 
            WHERE rpau.room_unit_id = "roomUnit"."id"
          )`
        );
      }
    }

    // Load relations if needed
    if (relations && relations.length) {
      for (const relation of relations) {
        queryBuilder.leftJoinAndSelect(`roomUnit.${relation}`, relation);
      }
    }

    // Apply select if provided
    if (select && select.length) {
      queryBuilder.select(select);
    }

    return queryBuilder.getMany();
  }

  async findAvailabilities(
    filter: {
      hotelId: string;
      roomUnitIds?: string[];
      statusList?: RoomUnitAvailabilityStatus[];
      dates?: string[];
    },
    select?: FindOptionsSelect<RoomUnitAvailability>
  ): Promise<RoomUnitAvailability[]> {
    const { hotelId, roomUnitIds, statusList, dates } = filter;
    const where: FindOptionsWhere<RoomUnitAvailability> = {
      hotelId
    };

    if (roomUnitIds && roomUnitIds.length) {
      where.roomUnitId = In(roomUnitIds);
    }

    if (dates && dates.length) {
      where.date = In(dates);
    }

    if (statusList && statusList.length) {
      where.status = In(statusList);
    }

    return this.roomUnitAvailabilityRepository.find({
      where,
      select
    });
  }

  /**
   * Get available room units for a room product during a date range
   * Matching Java logic from availabilityRemoteService.availableRoomIds (lines 922-929)
   * A room is considered available only if it's available for ALL nights in the stay
   */
  async getAvailableRoomUnits(
    hotelId: string,
    roomProductId: string,
    arrival: string,
    departure: string
  ): Promise<RoomUnit[]> {
    // Step 1: Generate dates array (arrival to departure-1)
    const dates = Helper.generateDateRange(arrival, departure);

    // Step 2: Get all room units assigned to this room product
    const roomUnits = await this.roomUnitRepository
      .createQueryBuilder('roomUnit')
      .innerJoin('room_product_assigned_unit', 'rpau', 'rpau.room_unit_id = roomUnit.id')
      .where('rpau.room_product_id = :roomProductId', { roomProductId })
      .andWhere('roomUnit.hotel_id = :hotelId', { hotelId })
      .andWhere('roomUnit.deleted_at IS NULL')
      .getMany();

    if (!roomUnits || roomUnits.length === 0) {
      return [];
    }

    const roomUnitIds = roomUnits.map((ru) => ru.id);

    // Step 3: Get availability records for these rooms and dates
    const availabilities = await this.roomUnitAvailabilityRepository.find({
      where: {
        hotelId,
        roomUnitId: In(roomUnitIds),
        date: In(dates),
        status: RoomUnitAvailabilityStatus.AVAILABLE
      },
      select: ['roomUnitId', 'date']
    });

    // Step 4: Group by roomUnitId to count available dates
    const availabilityMap = new Map<string, Set<string>>();
    availabilities.forEach((avail) => {
      if (!availabilityMap.has(avail.roomUnitId)) {
        availabilityMap.set(avail.roomUnitId, new Set());
      }
      availabilityMap.get(avail.roomUnitId)?.add(avail.date);
    });

    // Step 5: Filter rooms that are available for ALL dates
    const availableRooms = roomUnits.filter((room) => {
      const roomAvailableDates = availabilityMap.get(room.id);
      // Room must have availability record for ALL dates
      return roomAvailableDates && roomAvailableDates.size === dates.length;
    });

    // Step 6: Sort by room number
    return availableRooms.sort((a, b) => {
      const numA = a.roomNumber || '';
      const numB = b.roomNumber || '';
      return numA.localeCompare(numB);
    });
  }

  async upsertRoomUnits(roomUnits: Partial<RoomUnit>[]) {
    try {
      await this.roomUnitRepository.upsert(roomUnits, {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true
      });
      return await this.roomUnitRepository.find({
        where: { id: In(roomUnits.map((item) => item.id)) }
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
