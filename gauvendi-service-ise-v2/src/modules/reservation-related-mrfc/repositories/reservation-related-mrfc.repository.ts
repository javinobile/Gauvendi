import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationRelatedMrfc } from 'src/core/entities/booking-entities/reservation-related-mrfc.entity';
import { BadRequestException } from 'src/core/exceptions';
import { Repository } from 'typeorm';

@Injectable()
export class ReservationRelatedMrfcRepository {
  private readonly logger = new Logger(ReservationRelatedMrfcRepository.name);

  constructor(
    @InjectRepository(ReservationRelatedMrfc, DB_NAME.POSTGRES)
    private reservationRelatedMrfcRepository: Repository<ReservationRelatedMrfc>
  ) {}

  async createReservationRelatedMrfc(
    body: ReservationRelatedMrfc[]
  ): Promise<ReservationRelatedMrfc[] | null> {
    try {
      if (!body.length) return [];
      return await this.reservationRelatedMrfcRepository.save(body);
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
