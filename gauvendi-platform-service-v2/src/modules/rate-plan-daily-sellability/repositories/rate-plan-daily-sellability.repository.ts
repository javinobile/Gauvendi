import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { getAllowedDateByDayOfWeek } from '@src/core/utils/datetime.util';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanDailySellability } from 'src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Filter, ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanDailySellabilityDto,
  RatePlanDailySellabilityFilterDto,
  RatePlanDailySellabilityInputDto
} from '../dtos';

@Injectable()
export class RatePlanDailySellabilityRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDailySellability, DbName.Postgres)
    private readonly ratePlanDailySellabilityRepository: Repository<RatePlanDailySellability>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    configService: ConfigService
  ) {
    super(configService);
  }

  async ratePlanDailySellabilityList(
    filter: RatePlanDailySellabilityFilterDto
  ): Promise<ResponseData<RatePlanDailySellabilityDto>> {
    try {
      // Set default filter values
      const processedFilter = Filter.setDefaultValue(filter, RatePlanDailySellabilityFilterDto);

      // Build query using TypeORM QueryBuilder
      const queryBuilder = this.ratePlanDailySellabilityRepository.createQueryBuilder('rpds');

      // Apply filters
      this.applyFilters(queryBuilder, processedFilter);

      // Execute query
      const entities = await queryBuilder.getMany();
      const mappedResults = this.mapEntitiesToDto(entities);

      return new ResponseData(mappedResults.length, 1, mappedResults);
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch rate plan daily sellability adjustments: ${error.message}`
      );
    }
  }

  async createOrUpdateRatePlanDailySellability(
    input: RatePlanDailySellabilityInputDto
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateInput(input);

      // Generate date range based on input
      const dateEntities = this.generateDateEntities(input);

      // Find existing entities to update
      const existingEntities = await queryRunner.manager.find(RatePlanDailySellability, {
        where: {
          hotelId: input.hotelId,
          ratePlanId: input.ratePlanId,
          distributionChannel: input.distributionChannel,
          date: In(dateEntities.map((e) => e.date))
        }
      });

      // Create map for quick lookup
      const existingEntitiesMap = new Map(existingEntities.map((e) => [e.date, e]));
      const entitiesToSave: RatePlanDailySellability[] = [];

      // Update existing or create new entities
      for (const dateEntity of dateEntities) {
        if (existingEntitiesMap.has(dateEntity.date)) {
          // Update existing entity
          const existingEntity = existingEntitiesMap.get(dateEntity.date)!;
          existingEntity.isSellable = !!input.isSellable;
          existingEntity.updatedBy = this.currentSystem;
          entitiesToSave.push(existingEntity);
        } else {
          // Create new entity
          const newEntity = new RatePlanDailySellability();
          newEntity.hotelId = input.hotelId;
          newEntity.ratePlanId = input.ratePlanId;
          newEntity.distributionChannel = input.distributionChannel;
          newEntity.date = dateEntity.date;
          newEntity.isSellable = !!input.isSellable;
          newEntity.createdBy = this.currentSystem;
          newEntity.updatedBy = this.currentSystem;
          entitiesToSave.push(newEntity);
        }
      }

      const savedEntities = await queryRunner.manager.save(
        RatePlanDailySellability,
        entitiesToSave
      );
      await queryRunner.commitTransaction();

      return ResponseContent.success(
        null,
        `Rate plan daily sellability adjustments processed successfully. ${savedEntities.length} records processed.`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      return ResponseContent.error(
        `Failed to create or update rate plan daily sellability adjustments: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreateOrUpdateRatePlanDailySellability(
    inputList: RatePlanDailySellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    if (!inputList || inputList.length === 0) {
      return ResponseContent.error('Empty input list provided');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate and filter inputs
      const validInputs = inputList.filter((input) => this.isValidInput(input));

      if (validInputs.length === 0) {
        return ResponseContent.error('No valid inputs found');
      }

      const allEntitiesToSave: RatePlanDailySellability[] = [];
      const processedCount = { new: 0, updated: 0 };

      for (const input of validInputs) {
        // Generate date entities for this input
        const dateEntities = this.generateDateEntities(input);

        // Find existing entities
        const existingEntities = await queryRunner.manager.find(RatePlanDailySellability, {
          where: {
            hotelId: input.hotelId,
            ratePlanId: input.ratePlanId,
            distributionChannel: input.distributionChannel,
            date: In(dateEntities.map((e) => e.date))
          }
        });

        const existingEntitiesMap = new Map(existingEntities.map((e) => [e.date, e]));

        // Process each date
        for (const dateEntity of dateEntities) {
          if (existingEntitiesMap.has(dateEntity.date)) {
            // Update existing
            const existingEntity = existingEntitiesMap.get(dateEntity.date)!;
            existingEntity.isSellable = !!input.isSellable;
            existingEntity.updatedBy = this.currentSystem;
            allEntitiesToSave.push(existingEntity);
            processedCount.updated++;
          } else {
            // Create new
            const newEntity = new RatePlanDailySellability();
            newEntity.hotelId = input.hotelId;
            newEntity.ratePlanId = input.ratePlanId;
            newEntity.distributionChannel = input.distributionChannel;
            newEntity.date = dateEntity.date;
            newEntity.isSellable = !!input.isSellable;
            newEntity.createdBy = this.currentSystem;
            newEntity.updatedBy = this.currentSystem;
            allEntitiesToSave.push(newEntity);
            processedCount.new++;
          }
        }
      }

      // Remove duplicates based on unique constraint (hotelId, ratePlanId, date)
      const uniqueEntities = this.removeDuplicateEntities(allEntitiesToSave);

      if (uniqueEntities.length > 0) {
        await queryRunner.manager.save(RatePlanDailySellability, uniqueEntities);
      }

      await queryRunner.commitTransaction();

      return ResponseContent.success(
        null,
        `Bulk operation completed successfully. ${processedCount.new} new records created, ${processedCount.updated} records updated.`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return ResponseContent.error(
        `Failed to bulk create or update rate plan daily sellability adjustments: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRatePlanDailySellability(
    input: RatePlanDailySellabilityInputDto
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateInputForDelete(input);

      // Generate date range for deletion
      const dateEntities = this.generateDateEntities(input);
      const datesToDelete = dateEntities.map((e) => e.date);
      console.log(
        '🚀 ~ RatePlanDailySellabilityRepository ~ deleteRatePlanDailySellability ~ datesToDelete:',
        datesToDelete
      );

      // Find entities to delete
      const entitiesToDelete = await queryRunner.manager.find(RatePlanDailySellability, {
        where: {
          hotelId: input.hotelId,
          ratePlanId: input.ratePlanId,
          distributionChannel: input.distributionChannel,
          date: In(datesToDelete)
        }
      });

      if (entitiesToDelete.length === 0) {
        return ResponseContent.success(null, 'No matching records found to delete');
      }

      // Delete the entities
      await queryRunner.manager.remove(RatePlanDailySellability, entitiesToDelete);
      await queryRunner.commitTransaction();

      return ResponseContent.success(
        null,
        `Rate plan daily sellability adjustments deleted successfully. ${entitiesToDelete.length} records removed.`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      }
      return ResponseContent.error(
        `Failed to delete rate plan daily sellability adjustments: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async bulkDeleteRatePlanDailySellability(
    inputList: RatePlanDailySellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    if (!inputList || inputList.length === 0) {
      return ResponseContent.error('Empty input list provided');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate and filter inputs
      const validInputs = inputList.filter((input) => this.isValidInputForDelete(input));

      if (validInputs.length === 0) {
        return ResponseContent.error('No valid inputs found');
      }

      const allEntitiesToDelete: RatePlanDailySellability[] = [];

      for (const input of validInputs) {
        // Generate date entities for this input
        const dateEntities = this.generateDateEntities(input);
        const datesToDelete = dateEntities.map((e) => e.date);
        console.log(
          '🚀 ~ RatePlanDailySellabilityRepository ~ bulkDeleteRatePlanDailySellability ~ datesToDelete:',
          datesToDelete
        );

        // Find entities to delete
        const entitiesToDelete = await queryRunner.manager.find(RatePlanDailySellability, {
          where: {
            hotelId: input.hotelId,
            ratePlanId: input.ratePlanId,
            distributionChannel: input.distributionChannel,
            date: In(datesToDelete)
          }
        });

        allEntitiesToDelete.push(...entitiesToDelete);
      }

      if (allEntitiesToDelete.length === 0) {
        return ResponseContent.success(null, 'No matching records found to delete');
      }

      // Remove duplicates
      const uniqueEntitiesToDelete = this.removeDuplicateEntities(allEntitiesToDelete);

      // Delete the entities
      await queryRunner.manager.remove(RatePlanDailySellability, uniqueEntitiesToDelete);
      await queryRunner.commitTransaction();

      return ResponseContent.success(
        null,
        `Bulk delete completed successfully. ${uniqueEntitiesToDelete.length} records removed.`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return ResponseContent.error(
        `Failed to bulk delete rate plan daily sellability adjustments: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<RatePlanDailySellability>,
    filter: RatePlanDailySellabilityFilterDto
  ): void {
    if (filter.hotelId) {
      queryBuilder.andWhere('rpds.hotelId = :hotelId', { hotelId: filter.hotelId });
    }

    if (filter.idList && filter.idList.length) {
      queryBuilder.andWhere('rpds.id IN (:...ids)', { ids: filter.idList });
    }

    if (filter.ratePlanIdList && filter.ratePlanIdList.length) {
      queryBuilder.andWhere('rpds.ratePlanId IN (:...ratePlanIds)', {
        ratePlanIds: filter.ratePlanIdList
      });
    }

    if (filter.distributionChannelList && filter.distributionChannelList.length) {
      queryBuilder.andWhere('rpds.distributionChannel IN (:...distributionChannels)', {
        distributionChannels: filter.distributionChannelList
      });
    }

    if (filter.isSellable) {
      queryBuilder.andWhere('rpds.isSellable = :isSellable', { isSellable: filter.isSellable });
    }

    if (filter.fromDate) {
      queryBuilder.andWhere('rpds.date::date >= :fromDate::date', { fromDate: filter.fromDate });
    }

    if (filter.toDate) {
      queryBuilder.andWhere('rpds.date::date <= :toDate::date', { toDate: filter.toDate });
    }

    // Apply pagination
    Filter.setPagingFilter(queryBuilder, filter);
  }

  private async validateInput(input: RatePlanDailySellabilityInputDto): Promise<void> {
    await Promise.resolve();

    if (
      !input.hotelId ||
      !input.ratePlanId ||
      !input.distributionChannel ||
      !input.fromDate ||
      !input.toDate
    ) {
      throw new BadRequestException(
        'Invalid input: hotelId, ratePlanId, distributionChannel, fromDate, and toDate are required'
      );
    }

    if (new Date(input.fromDate) > new Date(input.toDate)) {
      throw new BadRequestException('From date cannot be after to date');
    }

    if (!input.daysOfWeek || input.daysOfWeek.length === 0) {
      throw new BadRequestException('Days of week cannot be empty');
    }

    if (input.isSellable === undefined || input.isSellable === null) {
      throw new BadRequestException('isSellable field is required');
    }
  }

  private async validateInputForDelete(input: RatePlanDailySellabilityInputDto): Promise<void> {
    await Promise.resolve();

    if (
      !input.hotelId ||
      !input.ratePlanId ||
      !input.distributionChannel ||
      !input.fromDate ||
      !input.toDate
    ) {
      throw new BadRequestException(
        'Invalid input: hotelId, ratePlanId, distributionChannel, fromDate, and toDate are required'
      );
    }

    if (new Date(input.fromDate) > new Date(input.toDate)) {
      throw new BadRequestException('From date cannot be after to date');
    }
  }

  private isValidInput(input: RatePlanDailySellabilityInputDto): boolean {
    return !!(
      input.hotelId &&
      input.ratePlanId &&
      input.distributionChannel &&
      input.fromDate &&
      input.toDate &&
      new Date(input.fromDate) <= new Date(input.toDate) &&
      input.daysOfWeek &&
      input.daysOfWeek.length > 0 &&
      input.isSellable !== undefined &&
      input.isSellable !== null
    );
  }

  private isValidInputForDelete(input: RatePlanDailySellabilityInputDto): boolean {
    return !!(
      input.hotelId &&
      input.ratePlanId &&
      input.distributionChannel &&
      input.fromDate &&
      input.toDate &&
      new Date(input.fromDate) <= new Date(input.toDate)
    );
  }

  private generateDateEntities(input: RatePlanDailySellabilityInputDto): { date: string }[] {
    const startDate = new Date(input.fromDate);
    const endDate = new Date(input.toDate);
    const dateEntities: { date: string }[] = [];

    const daysOfWeek = input.daysOfWeek || [];
    const currentDate = startDate;

    if (!daysOfWeek?.length) {
      while (currentDate <= endDate) {
        dateEntities.push({
          date: currentDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dateEntities;
    }

    return getAllowedDateByDayOfWeek(input.fromDate, input.toDate, daysOfWeek).map((date) => ({
      date
    }));
  }

  private removeDuplicateEntities(
    entities: RatePlanDailySellability[]
  ): RatePlanDailySellability[] {
    const seen = new Set<string>();
    return entities.filter((entity) => {
      const key = `${entity.hotelId}-${entity.ratePlanId}-${entity.date}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private mapEntitiesToDto(entities: RatePlanDailySellability[]): RatePlanDailySellabilityDto[] {
    return entities.map((entity) => ({
      id: entity.id,
      hotelId: entity.hotelId,
      ratePlanId: entity.ratePlanId,
      distributionChannel: entity.distributionChannel,
      date: entity.date,
      isSellable: entity.isSellable
    }));
  }
}
