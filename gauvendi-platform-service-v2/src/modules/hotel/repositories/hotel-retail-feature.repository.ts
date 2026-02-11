import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { DbName } from '../../../core/constants/db-name.constant';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from '../../../core/entities/hotel-retail-feature.entity';

export class HotelRetailFeatureFilter {
  hotelId?: string;
  idList?: string[];
  hotelRetailCategoryIdList?: string[];
  statusList?: Set<HotelRetailFeatureStatusEnum>;
  sort?: any;
  expand?: any;
}

@Injectable()
export class HotelRetailFeatureRepository {
  constructor(
    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>
  ) {}

  async hotelRetailFeatureList(filter: HotelRetailFeatureFilter): Promise<{
    entities: HotelRetailFeature[];
    total: number;
  }> {
    // Build where conditions
    const whereConditions:
      | FindOptionsWhere<HotelRetailFeature>
      | FindOptionsWhere<HotelRetailFeature>[] = {};

    if (filter.hotelId) {
      whereConditions.hotelId = filter.hotelId;
    }

    if (filter.idList && filter.idList.length > 0) {
      whereConditions.id = filter.idList.length === 1 ? filter.idList[0] : In(filter.idList);
    }

    if (filter.hotelRetailCategoryIdList && filter.hotelRetailCategoryIdList.length > 0) {
      whereConditions.hotelRetailCategoryId =
        filter.hotelRetailCategoryIdList.length === 1
          ? filter.hotelRetailCategoryIdList[0]
          : In(filter.hotelRetailCategoryIdList);
    }

    if (filter.statusList && filter.statusList.size > 0) {
      const statusArray = Array.from(filter.statusList);
      whereConditions.status = statusArray.length === 1 ? statusArray[0] : In(statusArray);
    }

    // Build find options
    const findOptions: FindManyOptions<HotelRetailFeature> = {
      where: whereConditions
    };

    // Add relations if expand is specified
    if (filter.expand) {
      findOptions.relations = ['hotelRetailCategory'];
    }

    const [entities, total] = await this.hotelRetailFeatureRepository.findAndCount(findOptions);

    // Map entities to DTOs
    // const results: HotelRetailFeatureDto[] = entities.map((entity) => ({
    //   id: entity.id,
    //   code: entity.code,
    //   name: entity.name,
    //   baseRate: entity.baseRate,
    //   baseWeight: entity.baseWeight,
    //   type: entity.type,
    //   description: entity.description,
    //   shortDescription: entity.shortDescription,
    //   displaySequence: entity.displaySequence,
    //   isVisible: entity.isVisible,
    //   status: entity.status,
    //   hotelRetailCategoryId: entity.hotelRetailCategoryId,
    //   travelTag: entity.travelTag,
    //   occasion: entity.occasion,
    //   isMultiBedroom: entity.isMultiBedroom,
    //   hotelRetailCategory: entity.hotelRetailCategory,
    //   iconImageUrl: entity.imageUrl,
    //   measurementUnit: entity.measurementUnit
    // }));

    return {
      entities,
      total
    };
  }
}
