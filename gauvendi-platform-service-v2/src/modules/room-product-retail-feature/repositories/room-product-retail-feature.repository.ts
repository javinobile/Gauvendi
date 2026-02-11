import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { RoomProductRetailFeatureFilterDto } from '../dtos/room-product-retail-feature.dto';
import { S3Service } from 'src/core/s3/s3.service';

@Injectable()
export class RoomProductRetailFeatureRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProductRetailFeature, DB_NAME.POSTGRES)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,
    configService: ConfigService,
    private readonly s3Service: S3Service
  ) {
    super(configService);
  }

  async getRoomProductRetailFeatures(filter: RoomProductRetailFeatureFilterDto) {
    try {
      const qb = this.roomProductRetailFeatureRepository
        .createQueryBuilder('roomProductRetailFeature')
        .where('roomProductRetailFeature.hotelId = :hotelId', { hotelId: filter.hotelId })
        .andWhere('roomProductRetailFeature.roomProductId IN (:...roomProductIds)', {
          roomProductIds: filter.roomProductIds
        })
        .andWhere('roomProductRetailFeature.quantity >= 1')
        .andWhere('roomProductRetailFeature.quantity IS NOT NULL')
        .leftJoinAndSelect('roomProductRetailFeature.retailFeature', 'retailFeature')
        .leftJoinAndSelect('retailFeature.hotelRetailCategory', 'hotelRetailCategory')
        // .leftJoinAndSelect(
        //   'retailFeature.hotelRetailFeatureTranslations',
        //   'hotelRetailFeatureTranslations'
        // );

      if (filter.relations) {
        Filter.setQueryBuilderRelations(qb, 'roomProductRetailFeature', filter.relations);
      }
      const result = await qb.getMany();

      if (!result) {
        throw new BadRequestException('Room product retail feature not found');
      }

      const mappedResultPromises = result.map(async (item) => {
        const translations = item.retailFeature.translations || [];
        const translation = filter.translateTo
          ? translations.find(
              (translation) => translation.languageCode === filter.translateTo
            )
          : null;

        return {
          ...item,
          retailFeature: {
            ...item.retailFeature,
            name: translation?.name || item.retailFeature.name,
            description: translation?.description || item.retailFeature.description,
            shortDescription:
              translation?.shortDescription || item.retailFeature.shortDescription,
            imageUrl: item.retailFeature.imageUrl
              ? await this.s3Service.getPreSignedUrl(item.retailFeature.imageUrl)
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
