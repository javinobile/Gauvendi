import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  HotelRetailFeature,
  HotelRetailFeatureStatusEnum
} from 'src/core/entities/hotel-retail-feature.entity';
import { S3Service } from 'src/core/s3/s3.service';
import { In, Repository } from 'typeorm';
import { QueryHotelRetailFeaturesDto } from './hotel-retail-features.dto';
import { HotelRetailFeatureTranslation } from '@src/core/entities/hotel-retail-feature-translation.entity';
import { BadRequestException } from '@src/core/exceptions';

@Injectable()
export class HotelRetailFeaturesService {
  private readonly logger = new Logger(HotelRetailFeaturesService.name);

  constructor(
    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private readonly hotelRetailFeaturesRepository: Repository<HotelRetailFeature>,

    @InjectRepository(HotelRetailFeatureTranslation, DB_NAME.POSTGRES)
    private readonly hotelRetailFeatureTranslationRepository: Repository<HotelRetailFeatureTranslation>,

    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly s3Service: S3Service
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

      // if (translateTo && relations) {
      //   relations.push('hotelRetailFeatureTranslations.hotelRetailFeature.hotelRetailCategory');
      // }

      // Always include hotelRetailCategory relation for sorting
      let defaultSort = {};
      if (usingSortDefault) {
        if (!relations?.length) {
          relations = [];
        }
        if (!relations.includes('hotelRetailCategory')) {
          relations.push('hotelRetailCategory');
        }
        defaultSort = {
          // Multi-level sorting using TypeORM order:
          // 1. hotelRetailCategory.displaySequence (nulls last)
          hotelRetailCategory: {
            displaySequence: 'ASC'
          },
          // 2. displaySequence (feature) (nulls last)
          displaySequence: 'ASC',
          // 3. baseWeight (higher weight first, nulls last)
          baseWeight: 'DESC',
          // 4. name (alphabetically)
          name: 'ASC'
        };
      }
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

      const hotelRetailFeatures = await this.hotelRetailFeaturesRepository.find({
        where: {
          hotelId: currentHotelId,
          isVisible: true,
          status: HotelRetailFeatureStatusEnum.ACTIVE,
          ...(codes && { code: In(codes) })
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
          const translations = hotelRetailFeature?.translations || [];
          const foundTranslation = translateTo
            ? translations.find(
                (translation) => translation.languageCode === translateTo
              )
            : null;

          return {
            id: hotelRetailFeature.id,
            name: foundTranslation?.name || hotelRetailFeature.name,
            code: hotelRetailFeature.code,
            description: foundTranslation?.description || hotelRetailFeature.description,
            shortDescription:
              foundTranslation?.shortDescription || hotelRetailFeature.shortDescription,
            displaySequence: hotelRetailFeature.displaySequence,
            measurementUnit: hotelRetailFeature?.measurementUnit,
            baseRate: hotelRetailFeature.baseRate,
            isVisible: hotelRetailFeature.isVisible,
            isSuggestedPrice: hotelRetailFeature.isSuggestedPrice,
            hotelRetailCategory: {
              id: hotelRetailFeature.hotelRetailCategory?.id,
              name: hotelRetailFeature.hotelRetailCategory?.name,
              code: hotelRetailFeature.hotelRetailCategory?.code
            },
            retailFeatureImageList: shouldGetRetailFeatureImage
              ? [
                  {
                    imageUrl: hotelRetailFeature.imageUrl
                      ? await this.s3Service.getPreSignedUrl(hotelRetailFeature.imageUrl)
                      : '',
                    description: foundTranslation?.description || hotelRetailFeature.description
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

  async getCppRetailFeatures(query: QueryHotelRetailFeaturesDto) {
    query.pageSize = 9999;
    // Multi-level sorting using TypeORM order:
    // 1. displaySequence (feature) (nulls last)
    // 2. baseWeight (higher weight first, nulls last)
    // 3. name (alphabetically)
    query.sort = ['displaySequence:ASC', 'baseWeight:DESC', 'name:ASC'];
    query.relations = ['hotelRetailCategory', 'mainFeatureImage'];
    const data = await this.getAllHotelRetailFeatures(query);
    const mappedData = data.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      displayName: item.name, // Using name as displayName, can be customized if needed
      description: item.description || ' ',
      iconUrl: item.retailFeatureImageList?.[0]?.imageUrl || '',
      popularity: item.displaySequence || 1,
      isVisible: item.isVisible !== undefined ? item.isVisible : true,
      price: item.baseRate || 0.0,
      isSuggested: item.isSuggestedPrice || null,
      assignedRoomProductList: null,
      assignedRoomList: null,
      category: {
        id: item.hotelRetailCategory?.id || null,
        code: item.hotelRetailCategory?.code || null,
        name: item.hotelRetailCategory?.name || null
      }
    }));

    return mappedData;
  }

  async migrateTranslation() {
    try {
      const allTranslations = await this.hotelRetailFeatureTranslationRepository.find();

      // group by hotelRetailFeatureId:
      const translationsByHotelRetailFeatureId = allTranslations.reduce((acc, translation) => {
        acc[translation.hotelRetailFeatureId] = acc[translation.hotelRetailFeatureId] || [];
        acc[translation.hotelRetailFeatureId].push(translation);
        return acc;
      }, {});

      // bulk update hotelRetailFeature:
      const updatePromises: Promise<any>[] = [];
      let migratedCount = 0;

      for (const [hotelRetailFeatureId, translations] of Object.entries(
        translationsByHotelRetailFeatureId
      )) {
        // Transform HotelRetailFeatureTranslation entities to Translation interface format
        const translationsArray = (translations as HotelRetailFeatureTranslation[])
          .map((translation) => ({
            languageCode: translation.languageCode as any,
            name: translation.name,
            description: translation.description,
            measurementUnit: translation.measurementUnit
          }))
          .filter(
            (translation) =>
              // Only include translations that have actual content
              translation.name || translation.description || translation.measurementUnit
          );

        if (translationsArray.length > 0) {
          const updatePromise = this.hotelRetailFeaturesRepository
            .createQueryBuilder()
            .update(HotelRetailFeature)
            .set({ translations: translationsArray as any })
            .where('id = :id', { id: hotelRetailFeatureId })
            .execute();

          updatePromises.push(updatePromise);
          migratedCount++;
        }
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      this.logger.log(
        `Successfully migrated translations for ${migratedCount} hotel retail features`
      );

      return {
        message: 'Translations migrated successfully',
        migratedCount: migratedCount,
        totalTranslationRecords: allTranslations.length
      };
    } catch (error) {
      this.logger.error('migrateTranslation: ', JSON.stringify(error));
      throw new BadRequestException(error);
    }
  }
}
