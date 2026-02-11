import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Filter } from '@src/core/dtos/common.dto';
import {
  AmenityStatusEnum,
  HotelAmenity
} from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { BadRequestException, InternalServerErrorException } from '@src/core/exceptions';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';
import { HotelAmenityBodyDto, HotelAmenityFilterDto } from '../dtos/hotel-amenity.dto';
import {
  HotelAmenityFilter,
  HotelAmenityInputDto
} from '@src/modules/hotel/dtos/hotel-amenity-filter.dto';
import { DistributionChannel } from '@src/core/entities/room-product.entity';

@Injectable()
export class HotelAmenityRepository {
  constructor(
    @InjectRepository(HotelAmenity, DbName.Postgres)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>
  ) {}

  getHotelAmenityList(filter: HotelAmenityFilterDto) {
    try {
      const { ids, mappingPmsCodes, hotelId, status } = filter;
      const queryBuilder = this.hotelAmenityRepository.createQueryBuilder('hotelAmenity');
      if (ids?.length) {
        queryBuilder.andWhere('hotelAmenity.id IN (:...ids)', { ids: ids });
      }
      if (mappingPmsCodes?.length) {
        queryBuilder.andWhere('hotelAmenity.mappingHotelAmenityCode IN (:...mappingPmsCodes)', {
          mappingPmsCodes: mappingPmsCodes
        });
      }
      if (hotelId) {
        queryBuilder.andWhere('hotelAmenity.hotelId = :hotelId', { hotelId: hotelId });
      }
      if (status) {
        queryBuilder.andWhere('hotelAmenity.status = :status', { status: status });
      }
      if (filter.relations) {
        Filter.setQueryBuilderRelations(queryBuilder, 'hotelAmenity', filter.relations);
      }

      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelAmenities(body: HotelAmenityBodyDto): Promise<HotelAmenity[]> {
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

  findInIdsOrCodes(
    filter: {
      ids?: string[];
      codes?: string[];
      hotelId: string;
      relations?: FindOptionsRelations<HotelAmenity>;
    },
    select?: FindOptionsSelect<HotelAmenity>
  ) {
    const { ids, codes, hotelId } = filter;

    return this.hotelAmenityRepository.find({
      where: [
        {
          hotelId: hotelId,
          id: In(ids || [])
        },
        {
          hotelId: hotelId,
          code: In(codes || [])
        }
      ],
      relations: filter.relations,
      select: select
    });
  }

  updateHotelAmenityList(amenityList: Partial<HotelAmenity> & Pick<HotelAmenity, 'id'>[]) {
    try {
      return this.hotelAmenityRepository.save(amenityList);
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
      throw new BadRequestException('Failed to get hotel amenities', error.message);
    }
  }

  async getBookingHotelAmenities(filter: { hotelId: string }): Promise<HotelAmenity[]> {
    return this.findAll({
      hotelId: filter.hotelId,
      statusList: [AmenityStatusEnum.ACTIVE],
      distributionChannelList: [DistributionChannel.GV_SALES_ENGINE]
    });
  }
}
