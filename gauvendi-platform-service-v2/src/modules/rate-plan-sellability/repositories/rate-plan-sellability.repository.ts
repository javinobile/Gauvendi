import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DistributionChannel } from '@src/modules/rate-plan/enums';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanSellability } from 'src/core/entities/pricing-entities/rate-plan-sellability.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { DataSource, FindOptionsSelect, FindOptionsWhere, In, Raw, Repository, SelectQueryBuilder } from 'typeorm';
import { Filter, ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanSellabilityDeleteDto,
  RatePlanSellabilityDto,
  RatePlanSellabilityFilterDto,
  RatePlanSellabilityInputDto
} from '../dtos';

@Injectable()
export class RatePlanSellabilityRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanSellability, DbName.Postgres)
    private readonly ratePlanSellabilityRepository: Repository<RatePlanSellability>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: {
    hotelId: string;
    ratePlanIds?: string[];
    distributionChannels?: DistributionChannel[];
    isSellable?: boolean;
  }, select?: FindOptionsSelect<RatePlanSellability>): Promise<RatePlanSellability[]> {
    const { hotelId, ratePlanIds, distributionChannels } = filter;

    let where: FindOptionsWhere<RatePlanSellability> = {
      hotelId: hotelId
    };
    if (ratePlanIds) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (distributionChannels && distributionChannels.length > 0) {
      where.distributionChannel = Raw(() => `"distribution_channel" && :distributionChannels`, {
        distributionChannels: distributionChannels
      });
    }

    return this.ratePlanSellabilityRepository.find({
      where,
      select
    });
  }

  async ratePlanSellabilityList(
    filter: RatePlanSellabilityFilterDto
  ): Promise<ResponseData<RatePlanSellabilityDto>> {
    try {
      // Set default filter values
      const processedFilter = Filter.setDefaultValue(filter, RatePlanSellabilityFilterDto);

      // Build query using TypeORM QueryBuilder
      const queryBuilder = this.ratePlanSellabilityRepository.createQueryBuilder('rps');

      // Apply filters
      this.applyFilters(queryBuilder, processedFilter);

      // Execute query
      const entities = await queryBuilder.getMany();
      const mappedResults = this.mapEntitiesToDto(entities);

      return new ResponseData(mappedResults.length, 1, mappedResults);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch rate plan sellability list: ${error.message}`);
    }
  }

  async createOrUpdateRatePlanSellability(
    inputs: RatePlanSellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanSellabilityDto | null>> {
    if (!inputs || inputs.length === 0) {
      return ResponseContent.success(null, 'Inputs is empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Filter valid inputs
      const validInputs = inputs.filter(
        (dto) => dto.hotelId && dto.ratePlanId && dto.distributionChannelList
      );

      // Find existing entities to update
      const hotelIds = [...new Set(validInputs.map((input) => input.hotelId))];

      const ratePlanIds = [...new Set(validInputs.map((input) => input.ratePlanId))];

      const existingEntities = await queryRunner.manager.find(RatePlanSellability, {
        where: {
          hotelId: In(hotelIds),
          ratePlanId: In(ratePlanIds)
        }
      });

      // Create map for quick lookup
      const existingEntitiesMap = new Map(
        existingEntities.map((e) => [`${e.hotelId}${e.ratePlanId}`, e])
      );

      const entitiesToSave: RatePlanSellability[] = [];

      // Process each input
      for (const input of validInputs) {
        const key = `${input.hotelId}${input.ratePlanId}`;

        if (existingEntitiesMap.has(key)) {
          // Update existing entity
          const existingEntity = existingEntitiesMap.get(key)!;
          existingEntity.distributionChannel = input.distributionChannelList;
          existingEntity.updatedBy = this.currentSystem;
          entitiesToSave.push(existingEntity);
        } else {
          // Create new entity
          const newEntity = new RatePlanSellability();
          newEntity.hotelId = input.hotelId;
          newEntity.ratePlanId = input.ratePlanId;
          newEntity.distributionChannel = input.distributionChannelList;
          newEntity.createdBy = this.currentSystem;
          newEntity.updatedBy = this.currentSystem;
          entitiesToSave.push(newEntity);
        }
      }

      // Save all entities
      await queryRunner.manager.save(RatePlanSellability, entitiesToSave);
      await queryRunner.commitTransaction();

      return ResponseContent.success(null, 'Rate plan sellability updated successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Failed to create or update rate plan sellability: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRatePlanSellability(
    inputs: RatePlanSellabilityDeleteDto[]
  ): Promise<ResponseContent<null>> {
    if (!inputs || inputs.length === 0) {
      return ResponseContent.success(null, 'Inputs is empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Filter valid inputs
      const validInputs = inputs.filter((dto) => dto.hotelId && dto.ratePlanId);

      if (validInputs.length === 0) {
        await queryRunner.rollbackTransaction();
        return ResponseContent.success(null, 'No valid inputs to delete');
      }

      let deletedCount = 0;

      for (const input of validInputs) {
        let deleteConditions: any = {
          hotelId: input.hotelId,
          ratePlanId: input.ratePlanId
        };

        // If ID is provided, use it as primary condition
        if (input.id) {
          deleteConditions = { id: input.id };
        }

        const deleteResult = await queryRunner.manager.delete(
          RatePlanSellability,
          deleteConditions
        );
        deletedCount += deleteResult.affected || 0;
      }

      await queryRunner.commitTransaction();

      const message =
        deletedCount > 0
          ? `Successfully deleted ${deletedCount} rate plan sellability record(s)`
          : 'No matching records found to delete';

      return ResponseContent.success(null, message);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Failed to delete rate plan sellability: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<RatePlanSellability>,
    filter: RatePlanSellabilityFilterDto
  ): void {
    if (filter.hotelId) {
      queryBuilder.andWhere('rps.hotelId = :hotelId', { hotelId: filter.hotelId });
    }

    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('rps.id IN (:...idList)', { idList: filter.idList });
    }

    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder.andWhere('rps.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    if (filter.distributionChannelList && filter.distributionChannelList.length > 0) {
      queryBuilder.andWhere('rps.distributionChannel && :distributionChannelList', {
        distributionChannelList: filter.distributionChannelList
      });
    }
  }

  private mapEntitiesToDto(entities: RatePlanSellability[]): RatePlanSellabilityDto[] {
    return entities.map((entity) => ({
      id: entity.id,
      hotelId: entity.hotelId,
      ratePlanId: entity.ratePlanId,
      distributionChannel: entity.distributionChannel,
    }));
  }
}
