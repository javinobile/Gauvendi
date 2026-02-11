import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Filter } from '@src/core/dtos/common.dto';
import { DbName } from 'src/core/constants/db-name.constant';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { HotelAmenityPriceFilterDto } from '../dtos/hotel-amenity-price-filter.dto';

@Injectable()
export class HotelAmenityPriceRepository extends BaseService {
  constructor(
    @InjectRepository(HotelAmenityPrice, DbName.Postgres)
    private readonly hotelAmenityPriceRepository: Repository<HotelAmenityPrice>,

    configService: ConfigService
  ) {
    super(configService);
  }

  getHotelAmenityList(filter: HotelAmenityPriceFilterDto) {
    const { hotelAmenityIds } = filter;
    try {
      const queryBuilder = this.hotelAmenityPriceRepository.createQueryBuilder('hap');
      queryBuilder.where('hap.hotelAmenityId IN (:...hotelAmenityIds)', {
        hotelAmenityIds: hotelAmenityIds
      });

      if (filter.relations) {
        Filter.setQueryBuilderRelations(queryBuilder, 'hap', filter.relations);
      }

      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
