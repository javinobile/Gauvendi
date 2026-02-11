import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { BaseService } from 'src/core/services/base.service';
import { In, Repository } from 'typeorm';
import { HotelRetailCategoryFilterDto } from '../dtos/hotel-retail-category.filter';

@Injectable()
export class HotelRetailCategoryRepository extends BaseService {
  constructor(
    @InjectRepository(HotelRetailCategory, DB_NAME.POSTGRES)
    private readonly hotelRetailCategoryRepository: Repository<HotelRetailCategory>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: HotelRetailCategoryFilterDto): Promise<HotelRetailCategory[]> {
    try {
      const { where, relations, order } = Filter.buildCondition<
        HotelRetailCategory,
        HotelRetailCategoryFilterDto
      >(filter);

      where.hotelId = filter.hotelId;

      if (filter.codes && filter.codes.length > 0) {
        where.code = In(filter.codes);
      }

      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }
      // if (filter.languageCodes && filter.languageCodes.length > 0) {
      //   where.hotelRetailCategoryTranslations = {
      //     languageCode: In(filter.languageCodes)
      //   };
      // }

      if (filter.languageCodes && filter.languageCodes.length > 0) {
        relations.hotelRetailCategoryTranslations = true;
      }

      return this.hotelRetailCategoryRepository.find({
        where,
        relations: {
          hotelRetailFeatures: true,
        },
        order
      });
    } catch (error) {
      console.log(
        'Failed to find hotel retail category (hotelRetailCategoryRepository.findAll)',
        error
      );
      throw new InternalServerErrorException(
        'Failed to find hotel retail category (hotelRetailCategoryRepository.findAll)',
        error.message
      );
    }
  }

  async findByRetailFeatureIds(
    hotelId: string,
    retailFeatureIds: string[]
  ): Promise<HotelRetailCategory[]> {
    try {
      return this.hotelRetailCategoryRepository.find({
        where: {
          hotelId,
          hotelRetailFeatures: {
            id: In(retailFeatureIds)
          }
        },
        select: {
          id: true,
          name: true,
          code: true,
          imageUrl: true,
          categoryType: true,
          displaySequence: true,
          priceWeight: true,
          hotelRetailFeatures: {
            id: true,
          }
        },
        relations: {
          hotelRetailFeatures: true
        }
      });
    } catch (error) {
      console.log(
        'Failed to find hotel retail category (hotelRetailCategoryRepository.findAll)',
        error
      );
      throw new InternalServerErrorException(
        'Failed to find hotel retail category (hotelRetailCategoryRepository.findAll)',
        error.message
      );
    }
  }

  async updateImageUrl(code: string, imageUrl: string) {
    await this.hotelRetailCategoryRepository
      .createQueryBuilder()
      .update(HotelRetailCategory)
      .set({ imageUrl })
      .where('code = :code', { code })
      .execute();
  }
}
