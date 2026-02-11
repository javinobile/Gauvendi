import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsRelations, FindOptionsSelect, Repository } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { QueryBuilderUtils } from 'src/core/utils/query-builder.utils';
import { HotelAmenityFilter } from '../dtos/rate-plan-services.dto';

@Injectable()
export class HotelAmenityRepository extends BaseService {
  constructor(
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,
    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Get hotel amenities with filtering and pagination
   * Preserves exact Java logic from HotelAmenityServiceImpl.hotelAmenityList()
   */
  async findAll(
    filter: HotelAmenityFilter,
    select?: FindOptionsSelect<HotelAmenity>,
    relations?: FindOptionsRelations<HotelAmenity>
  ): Promise<HotelAmenity[]> {
    try {
      let qb = this.hotelAmenityRepository.createQueryBuilder('amenity');

      if (filter.idList && filter.idList.length > 0) {
        qb.andWhere('amenity.id IN (:...idList)', { idList: filter.idList });
      }
      if (filter.statusList && filter.statusList.length > 0) {
        qb.andWhere('amenity.status IN (:...statusList)', { statusList: filter.statusList });
      }
      if (filter.hotelId) {
        qb.andWhere('amenity.hotelId = :hotelId', { hotelId: filter.hotelId });
      }
      if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
        // Postgres ANY over array column
        qb = QueryBuilderUtils.addArrayFieldLikeConditions(
          qb,
          'amenity.distributionChannel',
          filter.distributionChannelList.map(String),
          'distributionChannel'
        );
      }

      // Optional relations (top-level only)
      if (relations) {
        Object.entries(relations).forEach(([relation, include]) => {
          if (include) {
            qb.leftJoinAndSelect(`amenity.${relation}`, relation);
          }
        });
      }

      // Optional select for top-level fields on HotelAmenity only
      if (select) {
        const selectedColumns = Object.entries(select)
          .filter(([, include]) => !!include)
          .map(([column]) => `amenity.${column}`);
        if (selectedColumns.length > 0) {
          if (!selectedColumns.includes('amenity.id')) {
            selectedColumns.push('amenity.id');
          }
          qb.select(selectedColumns);
        }
      }

      return await qb.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Failed to get hotel amenities', error.message);
    }
  }
}
