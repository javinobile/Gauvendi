import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  AmenityStatusEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { In, Repository } from 'typeorm';
import { HotelAmenityDto } from '../dtos/hotel-amenity.dto';

@Injectable()
export class HotelAmenityRepository {
  private readonly logger = new Logger(HotelAmenityRepository.name);
  constructor(
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private hotelAmenityRepository: Repository<HotelAmenity>
  ) {}

  async getHotelAmenity(body: HotelAmenityDto): Promise<HotelAmenity | null> {
    try {
      const hotelAmenity = await this.hotelAmenityRepository.findOne({
        where: {
          hotelId: body.hotelId,
          ...(body.code && { code: body.code })
        },
        relations: body.relations ?? []
      });

      return hotelAmenity;
    } catch (error) {
      this.logger.error('Error getting hotel amenity', error);
      throw new BadRequestException('Error getting hotel amenity');
    }
  }

  async getHotelAmenities(body: HotelAmenityDto): Promise<HotelAmenity[]> {
    try {
      const hotelAmenity = await this.hotelAmenityRepository.find({
        where: {
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.ids && { id: In(body.ids) }),
          ...(body.codes && { code: In(body.codes) }),
          ...(body.status && { status: body.status as AmenityStatusEnum })
        },
        relations: body.relations ?? []
      });

      return hotelAmenity;
    } catch (error) {
      this.logger.error('Error getting hotel amenities', error);
      throw new BadRequestException('Error getting hotel amenities');
    }
  }
}
