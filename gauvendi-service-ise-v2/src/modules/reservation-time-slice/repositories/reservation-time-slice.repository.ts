import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, format } from 'date-fns';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationTimeSlice } from 'src/core/entities/booking-entities/reservation-time-slice.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { convertToUtcDate, setTimeFromTimeSlice } from 'src/core/utils/datetime.util';
import { DailyRoomRateDto } from 'src/modules/booking-calculate/dtos/reservation-pricing.dto';
import { HotelConfigurationRepository } from 'src/modules/hotel-configuration/repositories/hotel-configuration.repository';
import { In, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateReservationTimeSliceDto } from '../dtos/reservation-time-slice.dto';

@Injectable()
export class ReservationTimeSliceRepository extends BaseService {
  private readonly logger = new Logger(ReservationTimeSliceRepository.name);

  constructor(
    @InjectRepository(ReservationTimeSlice, DB_NAME.POSTGRES)
    private reservationTimeSliceRepository: Repository<ReservationTimeSlice>,
    configService: ConfigService,
    private readonly hotelConfigurationRepository: HotelConfigurationRepository,
    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private roomProductRepository: Repository<RoomProduct>
  ) {
    super(configService);
  }

  async getReservationTimeSlices(reservationIds: string[]): Promise<ReservationTimeSlice[]> {
    return this.reservationTimeSliceRepository.find({
      where: {
        reservationId: In(reservationIds),
        deletedAt: IsNull()
      }
    });
  }

  async createReservationTimeSlices(
    body: CreateReservationTimeSliceDto
  ): Promise<ReservationTimeSlice[]> {
    const { hotelId, roomAvailability, reservations, timeSlice, timeZone, bookingInput } = body;
    try {
      const reservationsInput = bookingInput.bookingInformation.reservationList;

      const roomProductIds = roomAvailability.map((roomProduct) => roomProduct.roomProductId);

      const roomProducts = await this.roomProductRepository.find({
        where: {
          hotelId: hotelId,
          id: In(roomProductIds),
          deletedAt: IsNull()
        },
        select: {
          id: true,
          isLockedUnit: true
        }
      });

      const data: ReservationTimeSlice[] = [];
      let currnetIndex = 0;
      for (const [index, roomProduct] of roomAvailability?.entries()) {
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

        const currentReservation = reservations[index];
        currnetIndex += countDuplicateDate - 1;

        const dailyRoomRateList =
          reservationsInput[index]?.reservationPricing?.dailyRoomRateList ?? [];
        const dailyRoomRateListMap = new Map<string, DailyRoomRateDto>(
          dailyRoomRateList.map((dailyRoomRate) => [dailyRoomRate.date, dailyRoomRate])
        );

        const roomProductEntity = roomProducts.find(
          (item) => item.id === roomProduct.roomProductId
        );
        if (!roomProductEntity) {
          throw new BadRequestException('Room product not found');
        }

        let isLocked = false;
        if (currentReservation?.isLocked !== undefined && currentReservation?.isLocked !== null) {
          isLocked = currentReservation?.isLocked;
        } else {
          isLocked = roomProductEntity.isLockedUnit || false;
        }

        // const nights = getNights(reservation?.arrival || null, reservation?.departure || null);
        // const serviceChargeAmount = reservation?.serviceChargeAmount || 0 / nights;
        const roomAvailabilityList = roomProduct.roomAvailability || [];
        if (!isErfcDeductAll) {
          for (const room of roomAvailabilityList) {
            const date = room.date;
            const fromTime = date
              ? convertToUtcDate(timeZone, setTimeFromTimeSlice(date, timeSlice.CI))
              : null;
            const toTime = date
              ? convertToUtcDate(
                  timeZone,
                  setTimeFromTimeSlice(
                    format(addDays(new Date(date), 1), 'yyyy-MM-dd'),
                    timeSlice.CO
                  )
                )
              : null;
            const dailyRoomRate = dailyRoomRateListMap.get(date);

            const reservationTimeSlice: ReservationTimeSlice = {
              id: uuidv4(),
              roomId: room.roomUnitId || null,
              reservationId: currentReservation?.id ?? null,
              roomProductId: roomProduct.roomProductId,
              millisecFromTime: null,
              millisecToTime: null,
              fromTime: fromTime,
              toTime: toTime,
              totalBaseAmount: dailyRoomRate?.baseAmount ?? 0,
              totalGrossAmount: dailyRoomRate?.grossAmount ?? 0,
              taxAmount: dailyRoomRate?.taxAmount ?? 0,
              serviceChargeAmount: 0,
              isLocked: isLocked,
              createdBy: this.currentSystem,
              updatedBy: this.currentSystem,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null
            };
            data.push(reservationTimeSlice);
          }
          continue;
        }

        // Create a reservation time slice for ERFC Deduct All
        const roomAvailabilityGroup = roomAvailabilityList.reduce<Record<string, any>>(
          (acc, room) => {
            if (!acc[room.roomId]) {
              acc[room.roomId] = [];
            }
            acc[room.roomId].push(room);
            return acc;
          },
          {}
        );
        const roomAvailabilityArr = Object.values(roomAvailabilityGroup);
        const totalReservations = roomAvailabilityArr.length || 1;
        Object.values(roomAvailabilityGroup).forEach((rooms, idx) => {
          const reservation = reservations[idx];
          rooms.forEach((room) => {
            const date = room.date;
            const fromTime = date
              ? convertToUtcDate(timeZone, setTimeFromTimeSlice(date, timeSlice.CI))
              : null;
            const toTime = date
              ? convertToUtcDate(
                  timeZone,
                  setTimeFromTimeSlice(
                    format(addDays(new Date(date), 1), 'yyyy-MM-dd'),
                    timeSlice.CO
                  )
                )
              : null;
            const dailyRoomRate = dailyRoomRateListMap.get(date);
            const totalBaseAmount = (dailyRoomRate?.baseAmount ?? 0) / totalReservations;
            const totalGrossAmount = (dailyRoomRate?.grossAmount ?? 0) / totalReservations;
            const taxAmount = (dailyRoomRate?.taxAmount ?? 0) / totalReservations;

            const reservationTimeSlice: ReservationTimeSlice = {
              id: uuidv4(),
              roomId: room.roomUnitId || null,
              reservationId: reservation?.id ?? null,
              roomProductId: roomProduct.roomProductId,
              millisecFromTime: null,
              millisecToTime: null,
              fromTime: fromTime,
              toTime: toTime,
              totalBaseAmount: totalBaseAmount,
              totalGrossAmount: totalGrossAmount,
              taxAmount: taxAmount,
              serviceChargeAmount: 0,
              isLocked: isLocked,
              createdBy: this.currentSystem,
              updatedBy: this.currentSystem,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null
            };
            data.push(reservationTimeSlice);
          });
        });
      }

      const result = await this.reservationTimeSliceRepository.save(data);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
