import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import {
  AmenityStatusEnum,
  HotelAmenity
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { DistributionChannel } from 'src/core/entities/room-product.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { HotelAmenityFilter } from 'src/modules/hotel-rate-plan/dtos/rate-plan-services.dto';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';
import { HotelAmenityFilterDto } from '../dtos/hotel-amenity.dto';

@Injectable()
export class HotelAmenityRepository extends BaseService {
  constructor(
    @InjectRepository(HotelAmenity, DB_NAME.POSTGRES)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(HotelAmenityPrice, DB_NAME.POSTGRES)
    private readonly hotelAmenityPriceRepository: Repository<HotelAmenityPrice>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelAmenity(filter: HotelAmenityFilterDto) {
    try {
      const qb = this.hotelAmenityRepository.createQueryBuilder('hotelAmenity');

      if (filter.hotelId) {
        qb.andWhere('hotelAmenity.hotelId = :id', { id: filter.hotelId });
      }

      if (filter.amenityType) {
        qb.andWhere('hotelAmenity.amenityType = :type', { type: filter.amenityType });
      }

      if (filter.code) {
        qb.andWhere('hotelAmenity.code = :code', { code: filter.code });
      }

      if (filter.relations) {
        Filter.setQueryBuilderRelations(qb, 'hotelAmenity', filter.relations);
      }

      const result = await qb.getMany();
      if (!result?.length) {
        throw new BadRequestException('Hotel amenity not found');
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    filter: HotelAmenityFilter,
    select?: FindOptionsSelect<HotelAmenity>,
    relations?: FindOptionsRelations<HotelAmenity>
  ): Promise<HotelAmenity[]> {
    try {
      const where: FindOptionsWhere<HotelAmenity> = {};

      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }
      if (filter.statusList && filter.statusList.length > 0) {
        where.status = In(filter.statusList);
      }

      if (filter.codeList && filter.codeList.length > 0) {
        where.code = In(filter.codeList);
      }

      if (filter.hotelId) {
        where.hotelId = filter.hotelId;
      }
      if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
        where.distributionChannel = Raw(() => `"distribution_channel" && :distributionChannels`, {
          distributionChannels: filter.distributionChannelList
        });
      }

      const entities = await this.hotelAmenityRepository.find({
        where,
        select,
        relations
      });

      return entities;
    } catch (error) {
      throw new InternalServerErrorException('Failed to get hotel amenities', error.message);
    }
  }

  async getBookingHotelAmenities(filter: { hotelId: string }): Promise<HotelAmenity[]> {
    return this.findAll({
      hotelId: filter.hotelId,
      statusList: [AmenityStatusEnum.ACTIVE],
      distributionChannelList: [DistributionChannel.GV_SALES_ENGINE]
    });
  }

  async findPricesByAmenityIds(amenityIds: string[]): Promise<HotelAmenityPrice[]> {
    return this.hotelAmenityPriceRepository.find({
      where: {
        hotelAmenityId: In(amenityIds)
      },
      relations: {
        hotelAgeCategory: true
      }
    });
  }

  async findHotelAmenityById(id: string): Promise<HotelAmenity> {
    try {
      const entity = await this.hotelAmenityRepository.findOne({
        where: {
          id
        }
      });

      if (!entity) {
        throw new BadRequestException('Hotel amenity not found');
      }

      return entity;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelAmenityByCode(body: HotelAmenityFilterDto): Promise<HotelAmenity | null> {
    try {
      const hotelAmenity = await this.hotelAmenityRepository.findOne({
        where: {
          hotelId: body.hotelId,
          ...(body.code && { code: body.code })
        },
        relations: body.relations ?? []
      });

      return hotelAmenity;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelAmenities(body: HotelAmenityFilterDto): Promise<HotelAmenity[]> {
    try {
      const hotelAmenity = await this.hotelAmenityRepository.find({
        where: {
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.ids && { id: In(body.ids) }),
          ...(body.codes && { code: In(body.codes) }),
          ...(body.status && { status: body.status })
        },
        relations: body.relations ?? []
      });

      return hotelAmenity;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelAmenityWithTranslations(filter: HotelAmenityFilterDto) {
    try {
      const { ids, translateTo } = filter;
      if (!ids?.length) return [];
      const hotelAmenities = await this.hotelAmenityRepository.find({ where: { id: In(ids) } });
      if (!hotelAmenities.length) return [];
      const mappedHotelAmenities = hotelAmenities.map((hotelAmenity) => {
        const translation = hotelAmenity.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        if (!translation) return hotelAmenity;

        return {
          ...hotelAmenity,
          name: translation?.name || hotelAmenity.name,
          description: translation?.description || hotelAmenity.description
        };
      });

      return mappedHotelAmenities;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
