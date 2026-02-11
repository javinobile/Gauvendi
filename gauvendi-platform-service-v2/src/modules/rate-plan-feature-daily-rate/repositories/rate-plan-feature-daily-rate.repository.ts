import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Filter } from '../../../core/dtos/common.dto';
import { RatePlanFeatureDailyRate } from '../../../core/entities/pricing-entities/rate-plan-feature-daily-rate.entity';
import {
  RatePlanFeatureDailyRateDto,
  RatePlanFeatureDailyRateFilterDto,
  RatePlanFeatureDailyRateInputDto
} from '../dto';

import { ConfigService } from '@nestjs/config';
import { DbName } from 'src/core/constants/db-name.constant';
import { Weekday } from 'src/core/entities/restriction.entity';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { RatePlanFeatureDailyRateDeleteFilterDto } from '../dto/rate-plan-feature-daily-rate-delete-filter.dto';

@Injectable()
export class RatePlanFeatureDailyRateRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanFeatureDailyRate, DbName.Postgres)
    private readonly ratePlanFeatureDailyRateRepository: Repository<RatePlanFeatureDailyRate>,
    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(
    filter: RatePlanFeatureDailyRateFilterDto
  ): Promise<{ entities: RatePlanFeatureDailyRate[]; totalCount: number }> {
    try {
      // Set default filter values
      filter = Filter.setDefaultValue(filter, RatePlanFeatureDailyRateFilterDto);
      console.log('filter', filter);
      // Create query builder
      const queryBuilder = this.ratePlanFeatureDailyRateRepository.createQueryBuilder(
        'rate'
      );

      // Apply filters
      this.setFilterForQuery(queryBuilder, filter);

      // Apply pagination
      Filter.setPagingFilter(queryBuilder, filter);

      // Execute query
      const [entities, totalCount] = await queryBuilder.getManyAndCount();

      return { entities, totalCount };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Failed to get rate plan feature daily rates',
        error.message
      );
    }
  }

  async createOrUpdate(
    input: RatePlanFeatureDailyRateInputDto
  ): Promise<RatePlanFeatureDailyRateDto[]> {
    // Use transaction for data consistency
    return await this.dataSource.transaction(async (manager) => {
      try {
      // Convert day list to weekday numbers (Java uses 0-based weekdays)
      const dayValues = input.dayList.map((day) => this.convertDayOfWeekToNumber(day) - 1);

      // Prepare rate plan ID list
      let ratePlanIdList = input.ratePlanIdList ? [...input.ratePlanIdList] : [];
      ratePlanIdList.push(input.ratePlanId);
      ratePlanIdList = [...new Set(ratePlanIdList)]; // Remove duplicates

      // Find existing entities to delete
      const queryBuilder = manager
        .createQueryBuilder(RatePlanFeatureDailyRate, 'entity')
        .where('entity.ratePlanId IN (:...ratePlanIds)', { ratePlanIds: ratePlanIdList })
        .andWhere('entity.featureId = :featureId', { featureId: input.featureId })
        .andWhere('entity.date::date >= :fromDate::date', { fromDate: input.fromDate })
        .andWhere('entity.date::date <= :toDate::date', { toDate: input.toDate });

      // Add weekday filter using PostgreSQL EXTRACT function
      if (dayValues.length > 0) {
        queryBuilder.andWhere(`EXTRACT(DOW FROM entity.date::date) IN (:...dayNumbers)`, {
          dayNumbers: dayValues
        });
      }

      const existingEntities = await queryBuilder.getMany();

      // Delete existing entities
      if (existingEntities.length > 0) {
        await manager.remove(RatePlanFeatureDailyRate, existingEntities);
      }

      // Generate new entities
      const entities: RatePlanFeatureDailyRate[] = [];
      const fromDate = new Date(input.fromDate);
      const toDate = new Date(input.toDate);

      for (const ratePlanId of ratePlanIdList) {
        const entitiesByRatePlan = this.generateDateRange(fromDate, toDate)
          .filter((date) => input.dayList.includes(this.convertNumberToDayOfWeek(date.getDay())))
          .map((date) => {
            const entity = manager.create(RatePlanFeatureDailyRate, {
              featureId: input.featureId,
              ratePlanId: ratePlanId,
              rate: input.rate.toString(),
              date: this.formatDate(date)
            });

            if (!this.isProd) {
              entity.createdBy = this.currentSystem;
              entity.updatedBy = this.currentSystem;
            }

            return entity;
          });

        entities.push(...entitiesByRatePlan);
      }

      // Save new entities
      const savedEntities = await manager.save(RatePlanFeatureDailyRate, entities);

      return savedEntities;
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to create or update rate plan feature daily rate: ' + error.message
        );
      }
    });
  }

  async delete(input: RatePlanFeatureDailyRateDeleteFilterDto): Promise<RatePlanFeatureDailyRateDto[]> {
    // Use transaction for data consistency
    return await this.dataSource.transaction(async (manager) => {
      try {
      const queryBuilder = manager
        .createQueryBuilder(RatePlanFeatureDailyRate, 'entity')
        .where('entity.ratePlanId = :ratePlanId', { ratePlanId: input.ratePlanId });

      if (input.featureId) {
        queryBuilder.andWhere('entity.featureId = :featureId', { featureId: input.featureId });
      }

      if (input.fromDate) {
        queryBuilder.andWhere('entity.date::date >= :fromDate::date', { fromDate: input.fromDate });
      }

      if (input.toDate) {
        queryBuilder.andWhere('entity.date::date <= :toDate::date', { toDate: input.toDate });
      }

      if (input.dayList && input.dayList.length > 0) {
        const dayValues = input.dayList.map((day) => this.convertDayOfWeekToNumber(day));
        queryBuilder.andWhere(`EXTRACT(DOW FROM entity.date::date) IN (:...dayNumbers)`, {
          dayNumbers: dayValues
        });
      }

      const existingEntities = await queryBuilder.getMany();

      // Delete entities
      await manager.remove(RatePlanFeatureDailyRate, existingEntities);

      return existingEntities;
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to delete rate plan feature daily rate: ' + error.message
        );
      }
    });
  }

  async deleteByRatePlanId(ratePlanIds: string[]): Promise<RatePlanFeatureDailyRate[]> {
    // Use transaction for data consistency
    return await this.dataSource.transaction(async (manager) => {
      try {
        const entities = await manager.find(RatePlanFeatureDailyRate, {
          where: {
            ratePlanId: In(ratePlanIds)
          }
        });

        await manager.softRemove(RatePlanFeatureDailyRate, entities);
        return entities;
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to delete rate plan feature daily rates by rate plan ID: ' + error.message
        );
      }
    });
  }

  // Private helper methods

  private setFilterForQuery(
    queryBuilder: SelectQueryBuilder<RatePlanFeatureDailyRate>,
    filter: RatePlanFeatureDailyRateFilterDto
  ): void {
    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder.andWhere('rate.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    if (filter.featureIdList && filter.featureIdList.length > 0) {
      queryBuilder.andWhere('rate.featureId IN (:...featureIdList)', {
        featureIdList: filter.featureIdList
      });
    }

    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('rate.id IN (:...idList)', {
        idList: filter.idList
      });
    }

    if (filter.fromDate) {
      queryBuilder.andWhere('rate.date::date >= :fromDate::date', {
        fromDate: filter.fromDate
      });
    }

    if (filter.toDate) {
      queryBuilder.andWhere('rate.date::date <= :toDate::date', {
        toDate: filter.toDate
      });
    }

    // Add ordering
    queryBuilder.orderBy('rate.date', 'ASC');
  }

  private convertDayOfWeekToNumber(dayOfWeek: Weekday): number {
    const dayMap = {
      [Weekday.Sunday]: 0,
      [Weekday.Monday]: 1,
      [Weekday.Tuesday]: 2,
      [Weekday.Wednesday]: 3,
      [Weekday.Thursday]: 4,
      [Weekday.Friday]: 5,
      [Weekday.Saturday]: 6
    };
    return dayMap[dayOfWeek];
  }

  private convertNumberToDayOfWeek(dayNumber: number): Weekday {
    const dayMap = {
      0: Weekday.Sunday,
      1: Weekday.Monday,
      2: Weekday.Tuesday,
      3: Weekday.Wednesday,
      4: Weekday.Thursday,
      5: Weekday.Friday,
      6: Weekday.Saturday
    };
    return dayMap[dayNumber];
  }

  private generateDateRange(fromDate: Date, toDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
