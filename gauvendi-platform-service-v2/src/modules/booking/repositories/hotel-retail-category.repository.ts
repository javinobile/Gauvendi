import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { BaseService } from 'src/core/services/base.service';
import { In, Repository } from 'typeorm';

@Injectable()
export class HotelRetailCategoryRepository extends BaseService {
  constructor(
    @InjectRepository(HotelRetailCategory, DB_NAME.POSTGRES)
    private readonly hotelRetailCategoryRepository: Repository<HotelRetailCategory>,
    configService: ConfigService
  ) {
    super(configService);
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
            id: true
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
