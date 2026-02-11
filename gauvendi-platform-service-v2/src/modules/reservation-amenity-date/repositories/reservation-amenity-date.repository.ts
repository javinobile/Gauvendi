import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ReservationAmenityDate } from '@src/core/entities/booking-entities/reservation-amenity-date.entity';
import { BadRequestException } from '@src/core/exceptions';
import { DB_NAME } from 'src/core/constants/db.const';
import { BaseService } from 'src/core/services/base.service';
import { In, Repository } from 'typeorm';

@Injectable()
export class ReservationAmenityDateRepository extends BaseService {
  private readonly logger = new Logger(ReservationAmenityDateRepository.name);

  constructor(
    @InjectRepository(ReservationAmenityDate, DB_NAME.POSTGRES)
    private readonly reservationAmenityDateRepository: Repository<ReservationAmenityDate>,
    configService: ConfigService
  ) {
    super(configService);
  }

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

  async upsertReservationAmenityDates(reservationAmenityDates: Partial<ReservationAmenityDate>[]) {
    await this.reservationAmenityDateRepository.upsert(reservationAmenityDates, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true
    });
  }

  async getReservationAmenityDates(filter: {
    reservationAmenityIds: string[];
    relations?: string[];
  }) {
    const { reservationAmenityIds, relations } = filter;
    try {
      return await this.reservationAmenityDateRepository.find({
        where: {
          reservationAmenityId: In(reservationAmenityIds)
        },
        relations: relations || []
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
