import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { filter, firstValueFrom, map } from 'rxjs';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from 'src/core/entities/hotel-retail-feature.entity';
import { HotelStandardFeature } from 'src/core/entities/hotel-standard-feature.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { FindOptionsOrder, In, Repository } from 'typeorm';
import { QueryHotelRetailFeaturesDto } from './hotel-retail-features.dto';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import {
  HotelConfiguration,
  HotelConfigurationTypeEnum
} from 'src/core/entities/hotel-entities/hotel-configuration.entity';

export interface TemplateFeature {
  id: string;
  iconImageId: string;
  imageUrl: string;
  code: string;
  name: string;
  description: string;
  displaySequence: number;
}

@Injectable()
export class HotelRetailFeaturesService {
  private getImageUrlEndpoint = 'https://admin-services.gauvendi.com/admin/template-feature/getAll';
  private gvdAdminKey = 'm1lMeP7bP5p3wdkFQk0rDCk3HT4hR1oGoJ7UekEaz7BynNqXzY';
  private readonly logger = new Logger(HotelRetailFeaturesService.name);

  constructor(
    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private readonly hotelRetailFeaturesRepository: Repository<HotelRetailFeature>,

    @InjectRepository(HotelStandardFeature, DB_NAME.POSTGRES)
    private readonly hotelStandardFeaturesRepository: Repository<HotelStandardFeature>,

    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(RoomProductRetailFeature, DB_NAME.POSTGRES)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(HotelConfiguration, DB_NAME.POSTGRES)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    private readonly s3Service: S3Service,
    private readonly httpService: HttpService
  ) {}

  async getAllHotelRetailFeatures(query: QueryHotelRetailFeaturesDto) {
    try {
      let {
        relations,
        translateTo,
        sort,
        hotelCode,
        offset,
        pageSize,
        hotelId,
        codes,
        usingSortDefault
      } = query;

      // Always include hotelRetailCategory relation for sorting
      let defaultSort = {};
      if (!relations?.length) {
        relations = [];
      }
      if (!relations.includes('hotelRetailCategory')) {
        relations.push('hotelRetailCategory');
      }
      const config = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: query.hotelId,
          configType: HotelConfigurationTypeEnum.ISE_FEATURE_SORTING_DISPLAY
        }
      });
      const isDisplayByPopularity = config?.configValue?.value === 'POPULARITY';
      defaultSort = {
        hotelRetailCategory: {
          displaySequence: 'ASC'
        },
        ...(isDisplayByPopularity ? { baseWeight: 'DESC' } : { displaySequence: 'ASC' }),
        name: 'ASC',
        createdAt: 'ASC'
      };
      /** mainFeatureImage = imageURL in the table
       * So don't need relations for mainFeatureImage
       */
      let shouldGetRetailFeatureImage = false;
      if (relations && relations.includes('mainFeatureImage')) {
        shouldGetRetailFeatureImage = true;
        relations = relations.filter((relation) => relation !== 'mainFeatureImage');
      }

      let currentHotelId = query.hotelId;
      if (!hotelId) {
        const hotel = await this.hotelRepository.findOne({
          where: {
            code: hotelCode
          },
          select: {
            id: true
          }
        });
        if (!hotel) {
          throw new NotFoundException('Hotel not found');
        }
        currentHotelId = hotel.id;
      }

      // find all room-product-features to get the retail feature codes which are assigned to the room products
      const roomProductRetailFeatures = await this.roomProductRetailFeatureRepository
        .createQueryBuilder('roomProductRetailFeature')
        .where('roomProductRetailFeature.hotelId = :hotelId', { hotelId: currentHotelId })
        .andWhere('roomProductRetailFeature.quantity IS NOT NULL')
        .andWhere('roomProductRetailFeature.quantity >= :minQuantity', { minQuantity: 1 })
        .leftJoinAndSelect('roomProductRetailFeature.retailFeature', 'retailFeature')
        .select([
          'roomProductRetailFeature.id',
          'roomProductRetailFeature.retailFeatureId',
          'retailFeature.id',
          'retailFeature.code',
          'retailFeature.name'
        ])
        .getMany();
      const retailFeatureCodes = roomProductRetailFeatures.map(
        (feature) => feature.retailFeature.code
      );

      const combinedCodes = Array.from(new Set([...(codes || []), ...(retailFeatureCodes || [])]));

      const hotelRetailFeatures = await this.hotelRetailFeaturesRepository.find({
        where: {
          hotelId: currentHotelId,
          isVisible: true,
          status: HotelRetailFeatureStatusEnum.ACTIVE,
          ...(combinedCodes && { code: In(combinedCodes) })
        },
        relations: relations ? relations : [],
        // take: pageSize,
        // skip: offset,
        order: {
          ...defaultSort,
          ...(sort?.length ? Filter.buildSortForQueryAPI(sort) : { createdAt: 'DESC' })
        }
      });

      const data = await Promise.all(
        hotelRetailFeatures.map(async (hotelRetailFeature) => {
          const foundTranslation = hotelRetailFeature?.translations?.find(
            (translation) =>
              `${translation.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
          );
          const foundHotelRetailCategoryTranslation =
            hotelRetailFeature?.hotelRetailCategory?.translations?.find(
              (translation) =>
                `${translation.languageCode}`.toUpperCase() === `${translateTo}`.toUpperCase()
            );

          return {
            name: foundTranslation ? foundTranslation?.name : hotelRetailFeature.name,
            code: hotelRetailFeature.code,
            description: foundTranslation
              ? foundTranslation?.description
              : hotelRetailFeature.description,
            shortDescription: hotelRetailFeature?.shortDescription,
            displaySequence: hotelRetailFeature.displaySequence,
            measurementUnit: hotelRetailFeature?.measurementUnit,
            hotelRetailCategory: {
              name:
                foundHotelRetailCategoryTranslation?.name ||
                hotelRetailFeature.hotelRetailCategory?.name,
              code: hotelRetailFeature.hotelRetailCategory?.code
            },
            retailFeatureImageList: shouldGetRetailFeatureImage
              ? [
                  {
                    imageUrl: hotelRetailFeature.imageUrl
                      ? await this.s3Service.getPreSignedUrl(hotelRetailFeature.imageUrl)
                      : '',
                    description: hotelRetailFeature.description
                  }
                ]
              : []
          };
        })
      );

      return data;
    } catch (error) {
      this.logger.error('getAllHotelRetailFeatures: ', JSON.stringify(error));

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error);
    }
  }

  async syncImageUrl() {
    const data: {
      data: TemplateFeature[];
    } = await firstValueFrom(
      this.httpService
        .post(
          this.getImageUrlEndpoint,
          {
            sort: ['displaySequence:asc'],
            featureType: 'STANDARD'
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
      await this.updateImageUrl(item.code, item.imageUrl);
    }
  }

  async updateImageUrl(code: string, imageUrl: string) {
    await this.hotelRetailFeaturesRepository
      .createQueryBuilder()
      .update(HotelRetailFeature)
      .set({ imageUrl })
      .where('code = :code', { code })
      .execute();
  }

  async syncImageUrlStandard() {
    const data: {
      data: TemplateFeature[];
    } = await firstValueFrom(
      this.httpService
        .post(
          this.getImageUrlEndpoint,
          {
            sort: ['displaySequence:asc'],
            featureType: 'STANDARD'
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
      await this.updateImageUrlStandard(item.code, item.imageUrl);
    }
  }

  async updateImageUrlStandard(code: string, imageUrl: string) {
    await this.hotelStandardFeaturesRepository
      .createQueryBuilder()
      .update(HotelStandardFeature)
      .set({ imageUrl })
      .where('code = :code', { code })
      .execute();
  }
}
