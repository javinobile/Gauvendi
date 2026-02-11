import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, SelectQueryBuilder } from 'typeorm';

import { ConfigService } from '@nestjs/config';
import { RoomProductPricingMethodDetailService } from '@src/modules/room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { eachDayOfInterval, format } from 'date-fns';
import { LIMIT_PAGE_SIZE } from 'src/core/constants/common.const';
import { DbName } from 'src/core/constants/db-name.constant';
import { Filter } from 'src/core/dtos/common.dto';
import { RatePlanDailyAdjustment } from 'src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { Weekday } from 'src/core/entities/restriction.entity';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import {
  DeleteAdjustmentDto,
  RatePlanDailyAdjustmentFilter,
  UpsertAdjustmentDto
} from '../models/rate-plan-daily-adjustment.dto';

@Injectable()
export class RatePlanDailyAdjustmentRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDailyAdjustment, DbName.Postgres)
    private readonly ratePlanDailyAdjustmentRepository: Repository<RatePlanDailyAdjustment>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService
  ) {
    super(configService);
  }

  /**
   * Get rate plan adjustments with filtering and pagination
   * Preserves exact Java logic from ratePlanDailyAdjustmentServiceImpl.adjustmentList()
   */
  async findAll(filter: RatePlanDailyAdjustmentFilter): Promise<RatePlanDailyAdjustment[]> {
    try {
      // Set default filter value - matching Java logic
      filter = Filter.setDefaultValue(filter, RatePlanDailyAdjustmentFilter);

      // Set limit - matching Java logic
      if (filter.pageSize === -1) {
        const countQuery = this.ratePlanDailyAdjustmentRepository.createQueryBuilder('adjustment');
        this.setFilterForQuery(countQuery, filter);
        filter.pageSize = LIMIT_PAGE_SIZE; // Config.LIMIT_PAGE_SIZE equivalent
      }

      // Create query builder - matching Java QRatePlanDailyAdjustment logic
      const queryBuilder = this.ratePlanDailyAdjustmentRepository.createQueryBuilder('adjustment');

      // Apply filters - matching Java setFilterForQuery logic
      this.setFilterForQuery(queryBuilder, filter);

      // Set paging - matching Java Filter.setPagingFilter logic
      Filter.setPagingFilter(queryBuilder, filter);

      // Execute query - matching Java findPagedList logic
      const [entities] = await queryBuilder.getManyAndCount();

      return entities;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to get rate plan adjustments', error.message);
    }
  }

  /**
   * Create multiple rate plan adjustments for date range
   * Preserves exact Java logic from ratePlanDailyAdjustmentServiceImpl.createOrUpdateadjustment()
   * Uses transaction to ensure data consistency
   */
  async createOrUpdateForRatePlanAdjustment(input: UpsertAdjustmentDto) {
    // Use transaction for data consistency
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const dates = eachDayOfInterval({ start: input.fromDate, end: input.toDate }).map((date) =>
          format(date, 'yyyy-MM-dd')
        );

        // Find existing adjustments in the date range - matching Java logic
        const existingAdjustments = await this.findExistingAdjustmentsWithManager(
          manager,
          input.ratePlanId,
          input.hotelId,
          dates,
          input.dayList
        );

        // Create a map for quick lookup - matching Java logic
        const existingAdjustmentsByDate = new Map<string, RatePlanDailyAdjustment>();
        existingAdjustments.forEach((adj) => {
          const dateKey = new Date(adj.date).toISOString().split('T')[0];
          existingAdjustmentsByDate.set(dateKey, adj);
        });

        // Generate adjustments for each date in range - matching Java Stream logic
        const adjustments: RatePlanDailyAdjustment[] = [];

        // Use date-fns for timezone-safe date iteration
        for (const dateKey of dates) {
          // Parse date string to get day of week (timezone safe)
          const [year, month, day] = dateKey.split('-').map(Number);
          const dateForDayOfWeek = new Date(year, month - 1, day); // Local date, no timezone issues
          const dayOfWeek = this.getDayOfWeekFromDate(dateForDayOfWeek);

          // Check if this day is in the dayList - matching Java filter logic
          if (input.dayList.includes(dayOfWeek)) {
            if (existingAdjustmentsByDate.has(dateKey)) {
              // Update existing adjustment - matching Java logic
              const existingAdjustment = existingAdjustmentsByDate.get(dateKey)!;
              existingAdjustment.adjustmentValue = input.value.toString();
              existingAdjustment.adjustmentType = input.unit;
              adjustments.push(existingAdjustment);
            } else {
              // Create new adjustment - matching Java logic
              const adjustment = manager.create(RatePlanDailyAdjustment, {
                hotelId: input.hotelId,
                ratePlanId: input.ratePlanId,
                adjustmentType: input.unit,
                adjustmentValue: input.value.toString(),
                date: dateKey,
                dayOfWeek: input.dayList
              });

              if (!this.isProd) {
                adjustment.createdBy = this.currentSystem;
                adjustment.updatedBy = this.currentSystem;
              }

              adjustments.push(adjustment);
            }
          }
        }

        // Save all adjustments - matching Java ebeanServer.saveAll()
        const savedAdjustments = await manager.upsert(RatePlanDailyAdjustment, adjustments, {
          conflictPaths: ['hotelId', 'ratePlanId', 'date']
        });

        return savedAdjustments;
      });

      // sync price
      await this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail(
        {
          hotelId: input.hotelId,
          ratePlanIds: [input.ratePlanId],
          from: input.fromDate,
          to: input.toDate,
        }
      );
      return result;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to create or update rate plan adjustments',
        error.message
      );
    }
  }

  /**
   * Delete rate plan adjustments by criteria
   * Preserves exact Java logic from ratePlanDailyAdjustmentServiceImpl.deleteadjustment()
   * Uses transaction to ensure data consistency
   */
  async deleteByFilter(filter: DeleteAdjustmentDto): Promise<RatePlanDailyAdjustment[]> {
    // Use transaction for data consistency
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const queryBuilder = manager.createQueryBuilder(RatePlanDailyAdjustment, 'adjustment');

        // Base filter - hotel ID is required
        queryBuilder.where('adjustment.hotelId = :hotelId', { hotelId: filter.hotelId });

        // Optional filters - matching Java logic
        if (filter.ratePlanId) {
          queryBuilder.andWhere('adjustment.ratePlanId = :ratePlanId', {
            ratePlanId: filter.ratePlanId
          });
        }

        if (filter.fromDate) {
          queryBuilder.andWhere('adjustment.date::date >= :fromDate::date', {
            fromDate: filter.fromDate
          });
        }

        if (filter.toDate) {
          queryBuilder.andWhere('adjustment.date::date <= :toDate::date', {
            toDate: filter.toDate
          });
        }

        // Day of week filter - matching Java raw SQL logic
        if (filter.dayList && filter.dayList.length > 0) {
          const dayNumbers = filter.dayList.map((day) => this.getDayNumber(day));
          queryBuilder.andWhere('EXTRACT(DOW FROM adjustment.date::date) IN (:...dayNumbers)', {
            dayNumbers
          });
        }

        // Find entities to delete
        const existingEntities = await queryBuilder.getMany();

        // Delete entities - matching Java ebeanServer.deleteAllPermanent()
        if (existingEntities.length > 0) {
          await manager.remove(RatePlanDailyAdjustment, existingEntities);
        }

        return existingEntities;
      });

      // sync price
      await this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail(
        {
          hotelId: filter.hotelId,
          ratePlanIds: [filter.ratePlanId],
          from: filter.fromDate,
          to: filter.toDate,
        }
      );
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete rate plan adjustments',
        error.message
      );
    }
  }

  /**
   * Set filters for query - matching Java setFilterForQuery logic exactly
   */
  private setFilterForQuery(
    queryBuilder: SelectQueryBuilder<RatePlanDailyAdjustment>,
    filter: RatePlanDailyAdjustmentFilter
  ): void {
    // Filter by id - matching Java EbeanUtils.setEqualOrInQuery(query.id, filter.getIdList())
    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('adjustment.id IN (:...idList)', { idList: filter.idList });
    }

    // Filter by ratePlanIdList - matching Java EbeanUtils.setEqualOrInQuery(query.ratePlanId, filter.getRatePlanIdList())
    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder.andWhere('adjustment.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    // Filter by hotelId - matching Java logic
    if (filter.hotelId) {
      queryBuilder.andWhere('adjustment.hotelId = :hotelId', { hotelId: filter.hotelId });
    }

    // Filter by ratePlanId - matching Java logic
    if (filter.ratePlanId) {
      queryBuilder.andWhere('adjustment.ratePlanId = :ratePlanId', {
        ratePlanId: filter.ratePlanId
      });
    }

    // Filter by fromDate - cast string to date for proper comparison
    if (filter.fromDate) {
      queryBuilder.andWhere('adjustment.date::date >= :fromDate::date', {
        fromDate: filter.fromDate
      });
    }

    // Filter by toDate - cast string to date for proper comparison
    if (filter.toDate) {
      queryBuilder.andWhere('adjustment.date::date <= :toDate::date', { toDate: filter.toDate });
    }
  }

  /**
   * Find existing adjustments in date range with transaction manager
   */
  private async findExistingAdjustmentsWithManager(
    manager: EntityManager,
    ratePlanId: string,
    hotelId: string,
    dates: string[],
    dayList: Weekday[]
  ): Promise<RatePlanDailyAdjustment[]> {
    const queryBuilder = manager.createQueryBuilder(RatePlanDailyAdjustment, 'adjustment');

    queryBuilder
      .where('adjustment.ratePlanId = :ratePlanId', { ratePlanId })
      .andWhere('adjustment.hotelId = :hotelId', { hotelId })
      .andWhere('adjustment.date IN (:...dates)', { dates: dates });

    // Add day filter if not all days are selected - matching Java logic
    if (dayList.length < 7) {
      const dayNumbers = dayList.map((day) => this.getDayNumber(day));
      queryBuilder.andWhere('EXTRACT(DOW FROM adjustment.date::date) IN (:...dayNumbers)', {
        dayNumbers
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Convert Date to DayOfWeekEnum - matching Java DayOfWeek logic
   */
  private getDayOfWeekFromDate(date: Date | string): Weekday {
    const dayIndex = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = [
      Weekday.Sunday,
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
      Weekday.Saturday
    ];
    return dayMap[dayIndex];
  }

  /**
   * Convert DayOfWeekEnum to PostgreSQL day number - matching Java WEEKDAY logic
   */
  private getDayNumber(day: Weekday): number {
    // PostgreSQL EXTRACT(DOW ...) returns 0 for Sunday, 1 for Monday, etc.
    const dayMap = {
      [Weekday.Sunday]: 0,
      [Weekday.Monday]: 1,
      [Weekday.Tuesday]: 2,
      [Weekday.Wednesday]: 3,
      [Weekday.Thursday]: 4,
      [Weekday.Friday]: 5,
      [Weekday.Saturday]: 6
    };
    return dayMap[day];
  }
}
