import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { RoomProductExtraOccupancyRate } from 'src/core/entities/room-product-extra-occupancy-rate.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { BadRequestException, InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { QueryBuilderUtils } from 'src/core/utils/query-builder.utils';
import { HotelRepository } from 'src/modules/hotel-v2/repositories/hotel.repository';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Repository
} from 'typeorm';
import { RoomProductFilterDto } from '../dtos/room-product-filter.dto';
type s = keyof RoomProduct;
@Injectable()
export class RoomProductRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductExtraOccupancyRate, DB_NAME.POSTGRES)
    private readonly roomProductExtraOccupancyRateRepository: Repository<RoomProductExtraOccupancyRate>,
    private readonly hotelRepository: HotelRepository,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: RoomProductFilterDto, select?: string[]): Promise<RoomProduct[]> {
    try {
      const { relations, order } = Filter.buildCondition<RoomProduct, RoomProductFilterDto>(filter);

      // Create QueryBuilder
      let queryBuilder = this.roomProductRepository.createQueryBuilder('roomProduct');

      // Add relations
      if (relations) {
        Object.keys(relations).forEach((relation) => {
          queryBuilder = queryBuilder.leftJoinAndSelect(`roomProduct.${relation}`, relation);
        });
      }

      // Hotel condition
      const hotel = await this.hotelRepository.getHotelByIdOrCode(filter.hotelId, filter.hotelCode);
      if (hotel && hotel.id) {
        queryBuilder = queryBuilder.andWhere('roomProduct.hotelId = :hotelId', {
          hotelId: hotel.id
        });
      }

      // ID conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.id',
        filter.idList,
        'idList'
      );
      queryBuilder = QueryBuilderUtils.setNotEqualOrNotInQuery(
        queryBuilder,
        'roomProduct.id',
        filter.excludeIdList,
        'excludeIdList'
      );

      // Code conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.code',
        filter.codeList,
        'codeList'
      );

      // Status conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.status',
        filter.statusList,
        'statusList'
      );

      // RFC Allocation Setting conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.rfcAllocationSetting',
        filter.roomProductAllocationSettingList,
        'allocationSettings'
      );

      // Type conditions
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProduct.type',
        filter.typeList,
        'typeList'
      );

      // Travel Tag LIKE conditions
      if (filter.travelTagList && filter.travelTagList.length > 0) {
        queryBuilder = QueryBuilderUtils.addArrayFieldLikeConditions(
          queryBuilder,
          'roomProduct.travelTag',
          filter.travelTagList,
          'travelTag'
        );
      }

      // Occasion LIKE conditions
      if (filter.occasionList && filter.occasionList.length > 0) {
        queryBuilder = QueryBuilderUtils.addArrayFieldLikeConditions(
          queryBuilder,
          'roomProduct.occasion',
          filter.occasionList,
          'occasion'
        );
      }

      // Distribution Channel LIKE conditions
      // if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
      //   queryBuilder = QueryBuilderUtils.addArrayFieldLikeConditions(
      //     queryBuilder,
      //     'roomProduct.distributionChannel',
      //     filter.distributionChannelList.map(String), // Convert enum to string
      //     'distributionChannel'
      //   );
      // }

      if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
        queryBuilder.andWhere('roomProduct.distributionChannel && ARRAY[:...distributionChannel]', {
          distributionChannel: filter.distributionChannelList
        });
      }

      // Apply ordering
      if (order) {
        Object.entries(order).forEach(([field, direction]) => {
          queryBuilder = queryBuilder.addOrderBy(
            `roomProduct.${field}`,
            direction as 'ASC' | 'DESC'
          );
        });
      }

      return queryBuilder.select(select as string[]).getMany();
    } catch (error) {
      console.log('Failed to find room product (roomProductRepository.findAll)', error);
      throw new InternalServerErrorException(
        'Failed to find room product (roomProductRepository.findAll)',
        error.message
      );
    }
  }

  async findExtraOccupancyRates(
    filter: {
      roomProductIds?: string[];
      hotelId?: string;
      relations?: FindOptionsRelations<RoomProductExtraOccupancyRate>;
      order?: FindOptionsOrder<RoomProductExtraOccupancyRate>;
    },
    select?: FindOptionsSelect<RoomProductExtraOccupancyRate>
  ): Promise<RoomProductExtraOccupancyRate[]> {
    const { roomProductIds, hotelId, relations, order } = filter;
    const where: FindOptionsWhere<RoomProductExtraOccupancyRate> = {};
    if (roomProductIds && roomProductIds.length > 0) {
      where.roomProductId = In(roomProductIds);
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }
    return this.roomProductExtraOccupancyRateRepository.find({
      where,
      relations,
      order,
      select
    });
  }

  async getRoomProduct(body: { code: string; hotelId: string }) {
    try {
      const result = await this.roomProductRepository.findOne({
        where: { code: body.code, hotelId: body.hotelId }
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Failed to get room product', error.message);
    }
  }

  async getRoomProducts(body: { ids: string[] }) {
    try {
      const result = await this.roomProductRepository.find({
        where: { id: In(body.ids) }
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Failed to get room product', error.message);
    }
  }
}
