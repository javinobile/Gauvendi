import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import {
  RatePlanExtraService,
  RatePlanExtraServiceType
} from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { DataSource, FindOptionsSelect, FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Filter, ResponseContentStatusEnum } from '../../../core/dtos/common.dto';
import {
  RatePlanExtraServiceDto,
  RatePlanExtraServiceFilterDto,
  RatePlanExtraServiceInputDto
} from '../dtos';

@Injectable()
export class RatePlanExtraServiceRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanExtraService, DbName.Postgres)
    private readonly ratePlanExtraServiceRepository: Repository<RatePlanExtraService>,

    @InjectRepository(RatePlanDailyExtraService, DB_NAME.POSTGRES)
    private readonly ratePlanDailyExtraServicesRepository: Repository<RatePlanDailyExtraService>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: {
    ratePlanIds?: string[];
    serviceIds?: string[];
    types?: RatePlanExtraServiceType[];
  }, select?: FindOptionsSelect<RatePlanExtraService>): Promise<RatePlanExtraService[]> {
    const { ratePlanIds, serviceIds, types } = filter;

    let where: FindOptionsWhere<RatePlanExtraService> = {};

    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (types && types.length > 0) {
      where.type = In(types);
    }

    if (serviceIds && serviceIds.length > 0) {
      where.extrasId = In(serviceIds);
    }

    return await this.ratePlanExtraServiceRepository.find({
      where: where,
      select
    });
  }

  findByExtrasIds(extrasIds: string[]): Promise<RatePlanExtraService[]> {
    return this.ratePlanExtraServiceRepository.find({
      where: {
        extrasId: In(extrasIds)
      }
    });
  }

  findDailyExtraServices(
    filter: {
      hotelId: string;
      dates: string[];
      ratePlanIds: string[];
    },
    select?: FindOptionsSelect<RatePlanDailyExtraService>
  ): Promise<RatePlanDailyExtraService[]> {
    const where: FindOptionsWhere<RatePlanDailyExtraService> = {};
    if (filter.ratePlanIds && filter.ratePlanIds.length > 0) {
      where.ratePlanId = In(filter.ratePlanIds);
    }
    if (filter.hotelId) {
      where.hotelId = filter.hotelId;
    }
    if (filter.dates && filter.dates.length > 0) {
      where.date = In(filter.dates);
    }
    return this.ratePlanDailyExtraServicesRepository.find({
      where,
      select
    });
  }

  async ratePlanExtraServiceList(
    filter: RatePlanExtraServiceFilterDto
  ): Promise<RatePlanExtraServiceDto[]> {
    try {
      // Set default filter values
      const processedFilter = Filter.setDefaultValue(filter, RatePlanExtraServiceFilterDto);

      // Build query using TypeORM QueryBuilder
      const queryBuilder = this.ratePlanExtraServiceRepository.createQueryBuilder('rpes');

      // Apply filters
      this.applyFilters(queryBuilder, processedFilter);

      // Execute query
      const entities = await queryBuilder.getMany();
      const mappedResults = this.mapEntitiesToDto(entities);

      return mappedResults;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch rate plan extra services: ${error.message}`);
    }
  }

  async createRatePlanExtraService(input: RatePlanExtraServiceInputDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateInput(input);

      // Find existing rate plan extra services for the rate plan
      const existingRatePlanExtraServices = await queryRunner.manager.find(RatePlanExtraService, {
        where: {
          ratePlanId: input.ratePlanId,
          extrasId: In(input.services.map((service) => service.serviceId))
        }
      });

      // Delete existing entries to replace with new ones
      if (existingRatePlanExtraServices.length) {
        await queryRunner.manager.remove(RatePlanExtraService, existingRatePlanExtraServices);
      }

      // Create new entries
      const newEntries = input.services.map((serviceInput) => {
        const entity = new RatePlanExtraService();
        entity.ratePlanId = input.ratePlanId;
        entity.extrasId = serviceInput.serviceId; // Map serviceId from DTO to extrasId in entity
        entity.type = serviceInput.type as RatePlanExtraServiceType;
        entity.createdBy = this.currentSystem;
        entity.updatedBy = this.currentSystem;
        return entity;
      });

      await queryRunner.manager.save(RatePlanExtraService, newEntries);

      await queryRunner.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Rate plan extra services created successfully',
        status: ResponseContentStatusEnum.SUCCESS
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new BadRequestException(`Failed to create rate plan extra services: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRatePlanExtraService(
    input: RatePlanExtraServiceInputDto
  ): Promise<RatePlanExtraService[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const serviceIds = input.services.map((service) => service.serviceId);
      // Find services to delete
      const servicesToDelete = await queryRunner.manager.find(RatePlanExtraService, {
        where: {
          ratePlanId: input.ratePlanId,
          extrasId: In(serviceIds) // Map serviceId from DTO to extrasId in entity
        }
      });

      if (servicesToDelete.length === 0) {
        await queryRunner.rollbackTransaction();
        return [];
      }

      // Delete the services
      const deleteResult = await queryRunner.manager.remove(RatePlanExtraService, servicesToDelete);

      await queryRunner.commitTransaction();

      return deleteResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Failed to delete rate plan extra services: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<RatePlanExtraService>,
    filter: RatePlanExtraServiceFilterDto
  ): void {
    if (filter.ratePlanIdList && filter.ratePlanIdList.length) {
      queryBuilder.andWhere('rpes.ratePlanId IN (:...ratePlanIds)', {
        ratePlanIds: filter.ratePlanIdList
      });
    }

    if (filter.serviceIdList && filter.serviceIdList.length) {
      queryBuilder.andWhere('rpes.extrasId IN (:...serviceIds)', {
        serviceIds: filter.serviceIdList
      });
    }

    if (filter.type) {
      queryBuilder.andWhere('rpes.type = :type', {
        type: filter.type
      });
    }

    // Apply pagination
    Filter.setPagingFilter(queryBuilder, filter);
  }

  private async validateInput(input: RatePlanExtraServiceInputDto): Promise<void> {
    // Simple async validation
    await Promise.resolve();

    if (!input.ratePlanId || !input.services) {
      throw new BadRequestException('Invalid input: ratePlanId and services are required');
    }

    if (input.services.length === 0) {
      throw new BadRequestException('Invalid input: at least one service must be provided');
    }
  }

  private mapEntitiesToDto(entities: RatePlanExtraService[]): RatePlanExtraServiceDto[] {
    return entities.map((entity) => ({
      id: entity.id,
      ratePlanId: entity.ratePlanId,
      serviceId: entity.extrasId, // Map extrasId from entity to serviceId in DTO
      type: entity.type
    }));
  }
}
