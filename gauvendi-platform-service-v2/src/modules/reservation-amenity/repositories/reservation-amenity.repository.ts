import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { ReservationAmenity } from 'src/core/entities/booking-entities/reservation-amenity.entity';
import { BadRequestException } from 'src/core/exceptions';
import { S3Service } from 'src/core/s3/s3.service';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import {
  CreateReservationAmenityDto,
  GetReservationAmenityDto,
  ReservationAmenityFilterDto
} from '../dtos/reservation-amenity.dto';

@Injectable()
export class ReservationAmenityRepository extends BaseService {
  private readonly logger = new Logger(ReservationAmenityRepository.name);

  constructor(
    @InjectRepository(ReservationAmenity, DB_NAME.POSTGRES)
    private readonly reservationAmenityRepository: Repository<ReservationAmenity>,
    configService: ConfigService,
    private readonly s3Service: S3Service
  ) {
    super(configService);
  }
  

  async getReservationAmenitiesWithRelations(
    filter: ReservationAmenityFilterDto
  ): Promise<ReservationAmenity[] | null> {
    try {
      const reservationAmenities = await this.reservationAmenityRepository.find({
        where: { id: In(filter.ids) },
        relations: [
          'reservationAmenityDates',
          'hotelAmenity',
          'hotelAmenity.hotelAmenityPrices',
          'hotelAmenity.hotelAmenityPrices.hotelAgeCategory'
        ]
      });

      const mappedReservationAmenities = reservationAmenities.map(async (reservationAmenity) => {
        const itemTranslation =
          reservationAmenity.hotelAmenity.translations.find(
            (translation) => translation.languageCode === filter.translateTo
          ) || {};
        const imageUrl =
          (await this.s3Service.getPreSignedUrl(reservationAmenity.hotelAmenity.iconImageUrl)) ||
          '';

        return {
          ...reservationAmenity,
          hotelAmenity: {
            ...reservationAmenity.hotelAmenity,
            ...itemTranslation,
            iconImageUrl: imageUrl
          }
        };
      });
      return await Promise.all(mappedReservationAmenities);
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }

  async createReservationAmenities(
    body: CreateReservationAmenityDto
  ): Promise<ReservationAmenity[]> {
    try {
      const result = await this.reservationAmenityRepository.save(body.reservationAmenities);
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  async findAll(filter: {
    reservationIds?: string[];
    reservationId?: string;
    relations?: FindOptionsRelations<ReservationAmenity>;
  }, select?: FindOptionsSelect<ReservationAmenity>): Promise<ReservationAmenity[]> {
    try {
      const { reservationIds, reservationId, relations } = filter;
      const where: FindOptionsWhere<ReservationAmenity> = {
        deletedAt: IsNull()
      };
      if (reservationIds) {
        where.reservationId = In(reservationIds);
      }
      if (reservationId) {
        where.reservationId = reservationId;
      }
      
      const result = await this.reservationAmenityRepository.find({
        where,
        select,
        relations
      });
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }



  async getReservationAmenities(body: GetReservationAmenityDto): Promise<ReservationAmenity[]> {
    try {
      const result = await this.reservationAmenityRepository.find({
        where: {
          reservationId: body.reservationId,
          deletedAt: IsNull()
        }
      });
      this.logger.log(`Reservation amenities: ${result.length}`);
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error);
    }
  }

  async upsertReservationAmenities(reservationAmenities: Partial<ReservationAmenity>[]) {
    await this.reservationAmenityRepository.upsert(reservationAmenities, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true
    });
  }
}
