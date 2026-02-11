import { DbName } from '@constants/db-name.constant';
import { HotelAgeCategory } from '@entities/hotel-entities/hotel-age-category.entity';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsOrder, Repository } from 'typeorm';
import {
  HotelAgeCategoryQueryDto,
  UpdateHotelAgeCategoryDto,
  DeleteHotelAgeCategoryDto,
  CreateHotelAgeCategoryDto,
  GetHotelAgeCategoryDto
} from './hotel-age-categories.dto';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelConfigurationTypeEnum } from '@src/core/enums/common';

@Injectable()
export class HotelAgeCategoriesService {
  constructor(
    @InjectRepository(HotelAgeCategory, DbName.Postgres)
    private readonly hotelAgeCategoryRepository: Repository<HotelAgeCategory>,
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  getHotelAgeCategories(query: HotelAgeCategoryQueryDto) {
    const sort = query.sort || [];
    const orderBy: FindOptionsOrder<HotelAgeCategory> = {};
    for (const s of sort) {
      const [field, order] = s.split(':');
      if (field === 'fromAge') {
        orderBy.fromAge = order as 'ASC' | 'DESC';
      }
      if (field === 'toAge') {
        orderBy.toAge = order as 'ASC' | 'DESC';
      }
      if (field === 'code') {
        orderBy.code = order as 'ASC' | 'DESC';
      }
      if (field === 'name') {
        orderBy.name = order as 'ASC' | 'DESC';
      }
    }
    return this.hotelAgeCategoryRepository.find({
      where: { hotel: { code: query.hotelCode } },
      order: orderBy
    });
  }

  async getHotelAgeCategory(dto: GetHotelAgeCategoryDto) {
    return this.hotelAgeCategoryRepository.findOne({
      where: {
        id: dto.id,
        hotel: { code: dto.hotelCode }
      }
    });
  }

  async createHotelAgeCategory(dto: CreateHotelAgeCategoryDto) {
    const hotel = await this.hotelRepository.findOne({ where: { code: dto.hotelCode } });
    if (!hotel) {
      throw new Error(`Hotel with code ${dto.hotelCode} not found`);
    }
    const hotelAgeCategory = this.hotelAgeCategoryRepository.create({
      name: dto.name,
      code: dto.code,
      fromAge: dto.fromAge,
      toAge: dto.toAge,
      description: dto.description,
      hotelId: hotel.id
    });

    return await this.hotelAgeCategoryRepository.save(hotelAgeCategory);
  }

  async updateHotelAgeCategory(dto: UpdateHotelAgeCategoryDto) {
    const hotelAgeCategories = await this.hotelAgeCategoryRepository.find({
      where: {
        hotel: { code: dto.hotelCode }
      }
    });

    const hotelAgeCategoryToUpdate = hotelAgeCategories.find(
      (ageCategory) => ageCategory.id === dto.id
    );

    if (!hotelAgeCategoryToUpdate) {
      throw new Error(`Hotel age category with id ${dto.id} not found for hotel ${dto.hotelCode}`);
    }

    if (dto.code) {
      hotelAgeCategoryToUpdate.code = dto.code;
    }
    if (dto.name) {
      hotelAgeCategoryToUpdate.name = dto.name;
    }
    if (dto.description) {
      hotelAgeCategoryToUpdate.description = dto.description;
    }
    if (dto.fromAge) {
      hotelAgeCategoryToUpdate.fromAge = dto.fromAge;
    }
    if (dto.toAge) {
      hotelAgeCategoryToUpdate.toAge = dto.toAge;
    }
    if (dto.isIncludeExtraOccupancyRate) {
      hotelAgeCategoryToUpdate.isIncludeExtraOccupancyRate = dto.isIncludeExtraOccupancyRate;
    }

    const { id, hotelCode, ...dataToUpdate } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let childrenPolicyConfig = await queryRunner.manager.findOne(HotelConfiguration, {
        where: {
          hotel: { code: dto.hotelCode },
          configType: HotelConfigurationTypeEnum.CHILDREN_POLICY
        }
      });

      const ageCategoriesWithExtraOccupancyRate = hotelAgeCategories.filter(
        (ageCategory) => ageCategory.isIncludeExtraOccupancyRate
      );

      let minChildrenAge = 0;
      let maxChildrenAge = 0;
      if (ageCategoriesWithExtraOccupancyRate.length === 0) {
        minChildrenAge = 0;
        maxChildrenAge = 0;
      } else {
        minChildrenAge = ageCategoriesWithExtraOccupancyRate[0].fromAge;
        maxChildrenAge =
          ageCategoriesWithExtraOccupancyRate[ageCategoriesWithExtraOccupancyRate.length - 1].toAge;

        for (const ageCategory of ageCategoriesWithExtraOccupancyRate) {
          if (ageCategory.fromAge < minChildrenAge) {
            minChildrenAge = ageCategory.fromAge;
          }
          if (ageCategory.toAge > maxChildrenAge) {
            maxChildrenAge = ageCategory.toAge;
          }
        }
      }

      if (childrenPolicyConfig) {
        childrenPolicyConfig.configValue = {
          ...childrenPolicyConfig.configValue,
          minChildrenAge,
          maxChildrenAge
        };
        await queryRunner.manager.save(childrenPolicyConfig);
      }

      await queryRunner.manager.update(HotelAgeCategory, hotelAgeCategoryToUpdate.id, dataToUpdate);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return true;
  }

  async deleteHotelAgeCategory(dto: DeleteHotelAgeCategoryDto) {
    const hotelAgeCategory = await this.hotelAgeCategoryRepository.findOne({
      where: {
        id: dto.id
      }
    });

    if (!hotelAgeCategory) {
      throw new Error(`Hotel age category with id ${dto.id} not found`);
    }

    return await this.hotelAgeCategoryRepository.delete(dto.id);
  }
}
