import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { RoomProductStandardFeature } from 'src/core/entities/room-product-standard-feature.entity';
import { BadRequestException } from 'src/core/exceptions';
import { S3Service } from 'src/core/s3/s3.service';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { RoomProductStandardFeatureFilterDto } from '../dtos/room-product-retail-feature.dto';

@Injectable()
export class RoomProductStandardFeatureRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProductStandardFeature, DB_NAME.POSTGRES)
    private readonly roomProductStandardFeatureRepository: Repository<RoomProductStandardFeature>,
    configService: ConfigService,
    private readonly s3Service: S3Service
  ) {
    super(configService);
  }

  async getRoomProductStandardFeatures(filter: RoomProductStandardFeatureFilterDto) {
    try {
      const qb = this.roomProductStandardFeatureRepository
        .createQueryBuilder('roomProductStandardFeature')
        .where('roomProductStandardFeature.hotelId = :hotelId', { hotelId: filter.hotelId })
        .andWhere('roomProductStandardFeature.roomProductId IN (:...roomProductIds)', {
          roomProductIds: filter.roomProductIds
        })
        .leftJoinAndSelect('roomProductStandardFeature.standardFeature', 'standardFeature')
        // .leftJoinAndSelect(
        //   'standardFeature.hotelStandardFeatureTranslations',
        //   'hotelStandardFeatureTranslations'
        // );

      if (filter.relations) {
        Filter.setQueryBuilderRelations(qb, 'roomProductStandardFeature', filter.relations);
      }
      const result = await qb.getMany();

      if (!result) {
        throw new BadRequestException('Room product standard feature not found');
      }

      const mappedResultPromises = result.map(async (item) => {
        const translations = item.standardFeature.translations || [];
        const translation = filter.translateTo
          ? translations.find(
              (translation) => translation.languageCode === filter.translateTo
            )
          : null;

        return {
          ...item,
          standardFeature: {
            ...item.standardFeature,
            name: translation?.name || item.standardFeature.name,
            description: translation?.description || item.standardFeature.description,
            shortDescription:
              translation?.shortDescription || item.standardFeature.shortDescription,
            imageUrl: item.standardFeature.imageUrl
              ? await this.s3Service.getPreSignedUrl(item.standardFeature.imageUrl)
              : ''
          }
        };
      });
      const mappedResult = await Promise.all(mappedResultPromises);
      return mappedResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
