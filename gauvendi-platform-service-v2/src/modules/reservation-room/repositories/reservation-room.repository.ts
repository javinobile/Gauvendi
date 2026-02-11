import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservationRoom } from '@src/core/entities/booking-entities/reservation-room.entity';
import { DB_NAME } from 'src/core/constants/db.const';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateReservationRoomDto } from '../dtos/reservation-room.dto';

@Injectable()
export class ReservationRoomRepository extends BaseService {
  private readonly logger = new Logger(ReservationRoomRepository.name);

  constructor(
    @InjectRepository(ReservationRoom, DB_NAME.POSTGRES)
    private readonly reservationRoomRepository: Repository<ReservationRoom>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async upsertReservationRooms(reservationRooms: Partial<ReservationRoom>[]) {
    await this.reservationRoomRepository.upsert(reservationRooms, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true
    });
  }

  async createReservationRooms(body: CreateReservationRoomDto): Promise<ReservationRoom[]> {
    try {
      const { reservations, roomAvailability } = body;
      const reservationRooms: ReservationRoom[] = [];
      let currnetIndex = 0;
      for (const [index, roomProduct] of roomAvailability.entries()) {
        currnetIndex += index;
        const isErfcDeductAll =
          roomProduct?.roomProductCode?.startsWith('ERFC') && !roomProduct?.isErfcDeduct;
        const roomAvailabilityDates: any[] = (roomProduct?.roomAvailability || []).map(
          (room) => room.date
        );
        const firstDate = roomAvailabilityDates[0];
        const countDuplicateDate = roomAvailabilityDates?.filter(
          (date) => date === firstDate
        )?.length;

        const reservationList =
          reservations.slice(currnetIndex, currnetIndex + countDuplicateDate) || [];
        const roomAvailabilityGroup =
          roomProduct.roomAvailability?.reduce<Record<string, any>>((acc, room) => {
            if (!acc[room.roomUnitId]) {
              acc[room.roomUnitId] = [];
            }
            acc[room.roomUnitId].push(room);
            return acc;
          }, {}) || {};
        const roomAvailabilityArr = Object.values(roomAvailabilityGroup) || [];
        for (const [idx, item] of reservationList.entries()) {
          const room = roomAvailabilityArr[idx];
          const reservationRoom: ReservationRoom = {
            id: uuidv4(),
            reservationId: item.id,
            roomId: room?.find((r) => r.roomId)?.roomId || null,
            createdBy: this.currentSystem,
            createdAt: new Date(),
            updatedBy: this.currentSystem,
            updatedAt: new Date(),
            deletedAt: null
          };
          reservationRooms.push(reservationRoom);
        }
        currnetIndex += countDuplicateDate - 1;
      }

      const result = await this.reservationRoomRepository.save(reservationRooms);
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }
}
