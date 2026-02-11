import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { RoomProductRatePlanExtraOccupancyRateAdjustment } from 'src/core/entities/room-product-rate-plan-extra-occupancy-rate-adjustment.entity';
import { RoomProductRatePlan } from 'src/core/entities/room-product-rate-plan.entity';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { QueryBuilderUtils } from 'src/core/utils/query-builder.utils';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';
import { RoomProductRatePlanFilterDto } from '../dtos/room-product-rate-plan-filter.dto';

@Injectable()
export class RoomProductRatePlanRepository extends BaseService {
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 1000;

  constructor(
    @InjectRepository(RoomProductRatePlan, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanRepository: Repository<RoomProductRatePlan>,

    @InjectRepository(RoomProductRatePlanExtraOccupancyRateAdjustment, DB_NAME.POSTGRES)
    private readonly roomProductRatePlanExtraOccupancyRateAdjustmentRepository: Repository<RoomProductRatePlanExtraOccupancyRateAdjustment>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAndCount(
    filter: RoomProductRatePlanFilterDto
  ): Promise<{ data: RoomProductRatePlan[]; total: number; page: number }> {
    try {
      // Set default filter values
      filter = Filter.setDefaultValue(filter, RoomProductRatePlanFilterDto);

      // Set limit - if pageSize is -1, get total count and set max page size
      if (filter.pageSize === -1) {
        const countQueryBuilder =
          this.roomProductRatePlanRepository.createQueryBuilder('roomProductRatePlan');
        this.setFilterForQuery(countQueryBuilder, filter);
        const totalCount = await countQueryBuilder.getCount();
        filter.pageSize = Math.min(totalCount, this.MAX_PAGE_SIZE);
      }

      // Create main query
      const { relations, order } = Filter.buildCondition<
        RoomProductRatePlan,
        RoomProductRatePlanFilterDto
      >(filter);
      let queryBuilder =
        this.roomProductRatePlanRepository.createQueryBuilder('roomProductRatePlan');

      // Add relations
      if (relations) {
        Object.keys(relations).forEach((relation) => {
          queryBuilder = queryBuilder.leftJoinAndSelect(
            `roomProductRatePlan.${relation}`,
            relation
          );
        });
      }

      // Apply filters
      this.setFilterForQuery(queryBuilder, filter);

      // Apply ordering
      if (order) {
        Object.entries(order).forEach(([field, direction]) => {
          queryBuilder = queryBuilder.addOrderBy(
            `roomProductRatePlan.${field}`,
            direction as 'ASC' | 'DESC'
          );
        });
      }

      // Apply pagination
      const offset = filter.offset || 0;
      const pageSize = filter.pageSize || this.DEFAULT_PAGE_SIZE;

      queryBuilder = queryBuilder.skip(offset).take(pageSize);

      // Get results and total count

      const [data, total] = await queryBuilder.getManyAndCount();
      const page = Math.floor(offset / pageSize) + 1;

      return {
        data,
        total,
        page
      };
    } catch (error) {
      console.log('Failed to find room product rate plan list', error);
      throw new InternalServerErrorException(
        'Failed to find room product rate plan list',
        error.message
      );
    }
  }

  findDailyExtraOccupancyRate(
    filter: {
      fromDate: string;
      toDate: string;
      roomProductRatePlanIds?: string[];
      relations?: FindOptionsRelations<RoomProductRatePlanExtraOccupancyRateAdjustment>;
    },
    select?: FindOptionsSelect<RoomProductRatePlanExtraOccupancyRateAdjustment>
  ) {
    const { fromDate, toDate, roomProductRatePlanIds, relations } = filter;
    if ((!fromDate && !toDate) || fromDate > toDate) {
      throw new BadRequestException('Invalid date range');
    }

    const where: FindOptionsWhere<RoomProductRatePlanExtraOccupancyRateAdjustment> = {};

    if (roomProductRatePlanIds && roomProductRatePlanIds.length > 0) {
      where.roomProductRatePlanId = In(roomProductRatePlanIds);
    }

    if (fromDate && toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: fromDate,
        toDate: toDate
      });
    } else if (fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: fromDate });
    } else if (toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: toDate });
    }

    return this.roomProductRatePlanExtraOccupancyRateAdjustmentRepository.find({
      where,
      relations: relations,
      select
    });
  }

  private setFilterForQuery(queryBuilder: any, filter: RoomProductRatePlanFilterDto): void {
    // Filter by hotel
    if (filter.hotelIdList && filter.hotelIdList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.hotelId',
        filter.hotelIdList,
        'hotelIdList'
      );
    }
    // Filter by Rate plan id list
    if (filter.idList && filter.idList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.id',
        filter.idList,
        'idList'
      );
    }

    // Filter by Rate Plan ID list
    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.ratePlanId',
        filter.ratePlanIdList,
        'ratePlanIdList'
      );
    }
    // Filter by code list
    if (filter.codeList && filter.codeList.length > 0) {
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'roomProductRatePlan.code',
        filter.codeList,
        'codeList'
      );
    }

    // Filter by rate plan status (requires join with ratePlan)
    if (filter.ratePlanStatusList && filter.ratePlanStatusList.length > 0) {
      queryBuilder = queryBuilder.leftJoin('roomProductRatePlan.ratePlan', 'ratePlan');
      queryBuilder = QueryBuilderUtils.setEqualOrInQuery(
        queryBuilder,
        'ratePlan.status',
        filter.ratePlanStatusList,
        'ratePlanStatusList'
      );
    }

    // Filter by isAutomatePricing

    if (filter.isAutomatePricing !== undefined && filter.isAutomatePricing !== null) {
      // TODO RoomProductRatePlan: Implement this
      // queryBuilder = queryBuilder.andWhere(
      //   'roomProductRatePlan.isAutomatePricing = :isAutomatePricing',
      //   { isAutomatePricing: filter.isAutomatePricing }
      // );
    }

    // Filter by isSellable
    // if (filter.isSellable !== undefined && filter.isSellable !== null) {
    //   // Ensure ratePlan is joined if not already
    //   if (
    //     !queryBuilder.expressionMap.joinAttributes.find(
    //       (join: any) => join.alias.name === 'ratePlan'
    //     )
    //   ) {
    //     queryBuilder = queryBuilder.leftJoin('roomProductRatePlan.ratePlan', 'ratePlan');
    //   }

    //   /*
    //    * 3 states: True, False, Null
    //    * if filter True -> filter != False
    //    * and vice versa
    //    */
    //   queryBuilder = queryBuilder.andWhere('ratePlan.isSellable != :notIsSellable', {
    //     notIsSellable: !filter.isSellable
    //   });
    // }
  }
}
