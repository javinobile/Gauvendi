import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationAmenityDate } from 'src/core/entities/booking-entities/reservation-amenity-date.entity';
import { In, IsNull, Repository } from 'typeorm';
import { GetReservationAmenityDateDto } from '../dtos/reservation-amenity-date.dto';

@Injectable()
export class ReservationAmenityDateRepository {
  private readonly logger = new Logger(ReservationAmenityDateRepository.name);

  constructor(
    @InjectRepository(ReservationAmenityDate, DB_NAME.POSTGRES)
    private reservationAmenityDateRepository: Repository<ReservationAmenityDate>
  ) {}

  async createReservationAmenityDates(
    body: ReservationAmenityDate[]
  ): Promise<ReservationAmenityDate[]> {
    try {
      const reservationAmenityDates = await this.reservationAmenityDateRepository.save(body);
      return reservationAmenityDates;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  async getReservationAmenityDates(
    body: GetReservationAmenityDateDto
  ): Promise<ReservationAmenityDate[]> {
    try {
      const reservationAmenityDates = await this.reservationAmenityDateRepository.find({
        where: {
          reservationAmenityId: In(body.reservationAmenityIds),
          deletedAt: IsNull()
        },
        relations: body.relations || []
      });
      this.logger.log(`Reservation amenity dates: ${reservationAmenityDates.length}`);
      return reservationAmenityDates;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }
}
