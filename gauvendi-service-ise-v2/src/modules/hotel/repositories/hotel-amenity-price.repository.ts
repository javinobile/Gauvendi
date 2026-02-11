import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAgeCategoryCodeEnum } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import {
  AmenityStatusEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { In, Repository } from 'typeorm';
import { HotelAmenityPriceDto } from '../dtos/hotel-amenity-price.dto';

@Injectable()
export class HotelAmenityPriceRepository {
  private readonly logger = new Logger(HotelAmenityPriceRepository.name);
  constructor(
    @InjectRepository(HotelAmenityPrice, DB_NAME.POSTGRES)
    private hotelAmenityPriceRepository: Repository<HotelAmenityPrice>,
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private hotelAmenityRepository: Repository<HotelAmenity>
  ) {}

  async getHotelAmenityPrice(body: HotelAmenityPriceDto): Promise<HotelAmenityPrice | null> {
    try {
      const result = await this.hotelAmenityPriceRepository.findOne({
        where: {
          hotelAmenityId: body.hotelAmenityId,
          ...(body.hotelAgeCategory && {
            hotelAgeCategory: {
              ...(body.hotelAgeCategory.code && {
                code: body.hotelAgeCategory.code as HotelAgeCategoryCodeEnum
              }),
              ...(body.hotelAgeCategory.fromAge && { fromAge: body.hotelAgeCategory.fromAge }),
              ...(body.hotelAgeCategory.toAge && { toAge: body.hotelAgeCategory.toAge })
            }
          })
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting hotel amenity price', error);
      throw new BadRequestException('Error getting hotel amenity price');
    }
  }

  async getHotelAmenitiesPrice(body: HotelAmenityPriceDto): Promise<HotelAmenityPrice[]> {
    try {
      const result = await this.hotelAmenityPriceRepository.find({
        where: {
          hotelAmenityId: In(body.hotelAmenityIds || [])
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting hotel amenities price', error);
      throw new BadRequestException('Error getting hotel amenities price');
    }
  }

  async getHotelAmenities(hotelId: string): Promise<HotelAmenity[]> {
    try {
      const result = await this.hotelAmenityRepository.find({
        where: {
          hotelId,
          status: AmenityStatusEnum.ACTIVE
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting hotel amenities', error);
      throw new BadRequestException('Error getting hotel amenities');
    }
  }

  async getHotelAmenityPrices(amenityIds: string[]): Promise<HotelAmenityPrice[]> {
    try {
      const result = await this.hotelAmenityPriceRepository.find({
        where: {
          hotelAmenityId: In(amenityIds),
          hotelAmenity: {
            status: AmenityStatusEnum.ACTIVE
          }
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting hotel amenity prices', error);
      throw new BadRequestException('Error getting hotel amenity prices');
    }
  }
}
