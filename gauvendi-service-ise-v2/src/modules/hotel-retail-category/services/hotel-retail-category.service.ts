import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { Repository } from 'typeorm';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';
import { LanguageCodeEnum, Translation } from 'src/core/database/entities/base.entity';
import { HotelRetailCategoryTranslation } from 'src/core/entities/hotel-retail-category-translation.entity';
import { HotelRetailCategory } from 'src/core/entities/hotel-retail-category.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { HotelRetailCategoryDto } from '../dtos/hotel-retail-category.dto';
import { HotelRetailCategoryFilterDto } from '../dtos/hotel-retail-category.filter';
import { HotelRetailCategoryRepository } from '../repositories/hotel-retail-category.repository';

@Injectable()
export class HotelRetailCategoryService {
  private getImageUrlEndpoint =
    'https://admin-services.gauvendi.com/admin/template-category/getAll';
  private gvdAdminKey = 'm1lMeP7bP5p3wdkFQk0rDCk3HT4hR1oGoJ7UekEaz7BynNqXzY';

  constructor(
    private readonly hotelRetailCategoryRepository: HotelRetailCategoryRepository,
    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,
    private readonly s3Service: S3Service,
    private readonly httpService: HttpService
  ) {}

  async findHotelRetailCategory(
    filter: HotelRetailCategoryFilterDto
  ): Promise<HotelRetailCategoryDto[]> {
    if (!filter.hotelCode && !filter.hotelId) {
      throw new BadRequestException('Hotel code or hotel id is required');
    }

    let hotelId = filter.hotelId;
    if (filter.hotelCode && !filter.hotelId) {
      const hotel = await this.hotelRepository.findOne({ where: { code: filter.hotelCode } });
      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }
      hotelId = hotel.id;
    }

    const entities = await this.hotelRetailCategoryRepository.findAll({
      ...filter,
      hotelId
    });

    return await Promise.all(
      entities.map((entity) => this.entityToDto(entity, filter.languageCodes))
    );
  }

  async syncImageUrl() {
    const data: {
      data: {
        id: string;
        imageUrl: string;
        name: string;
        code: string;
      }[];
    } = await firstValueFrom(
      this.httpService
        .post(
          this.getImageUrlEndpoint,
          {
            sort: ['displaySequence:asc']
          },
          {
            headers: {
              'gvd-admin-key': this.gvdAdminKey
            }
          }
        )
        .pipe(map((response) => response.data))
    );

    for (const item of data.data) {
      await this.hotelRetailCategoryRepository.updateImageUrl(item.code, item.imageUrl);
    }
  }

  private async entityToDto(
    entity: HotelRetailCategory,
    translateTo?: string[]
  ): Promise<HotelRetailCategoryDto> {
    const languageCode =
      translateTo && translateTo?.length > 0 ? translateTo?.at(0)?.toLocaleLowerCase() : null;
    const foundTranslation = entity.translations?.find(
      (translation) =>
        `${translation.languageCode}`.toUpperCase() === `${languageCode}`.toUpperCase()
    );

    return {
      id: entity.id,
      name: foundTranslation?.name || entity.name,
      hotelRetailFeatureList: entity.hotelRetailFeatures,
      categoryType: entity.categoryType,
      displaySequence: entity.displaySequence,
      priceWeight: entity.priceWeight,
      translationList: [],
      code: entity.code,
      iconImageUrl: entity.imageUrl ? await this.s3Service.getPreSignedUrl(entity.imageUrl) : ''
    };
  }

  private translationToDto(translation: HotelRetailCategoryTranslation): Translation {
    return {
      languageCode: translation.languageCode as LanguageCodeEnum,
      name: translation.name,
      description: ''
    };
  }
}
