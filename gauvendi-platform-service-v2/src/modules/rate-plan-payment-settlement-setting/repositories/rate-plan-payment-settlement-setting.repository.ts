import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlanPaymentSettlementSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-settlement-setting.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Filter, ResponseContent, ResponseData } from '../../../core/dtos/common.dto';
import {
  RatePlanPaymentSettlementSettingDto,
  RatePlanPaymentSettlementSettingFilterDto,
  RatePlanPaymentSettlementSettingInputDto
} from '../dtos';
import { RatePlanPaymentSettlementSettingListInput } from '../dtos/rate-plan-payment-settlement-setting-input.dto';
import { HotelRepository } from '@src/modules/hotel/repositories/hotel.repository';
import { GetRatePlanPaymentSettlementSettingDto } from '../dtos/rate-plan-payment-settlement-setting.dto';

@Injectable()
export class RatePlanPaymentSettlementSettingRepository extends BaseService {
  private readonly logger = new Logger(RatePlanPaymentSettlementSettingRepository.name);

  constructor(
    @InjectRepository(RatePlanPaymentSettlementSetting, DbName.Postgres)
    private readonly ratePlanPaymentSettlementSettingRepository: Repository<RatePlanPaymentSettlementSetting>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly hotelRepository: HotelRepository,

    configService: ConfigService
  ) {
    super(configService);
  }

  async ratePlanPaymentSettlementSettingList(
    filter: RatePlanPaymentSettlementSettingFilterDto
  ): Promise<ResponseData<RatePlanPaymentSettlementSettingDto>> {
    try {
      // Set default filter values
      const processedFilter = Filter.setDefaultValue(
        filter,
        RatePlanPaymentSettlementSettingFilterDto
      );

      // Build query using TypeORM QueryBuilder
      const queryBuilder =
        this.ratePlanPaymentSettlementSettingRepository.createQueryBuilder('rppss');

      // Apply filters
      this.applyFilters(queryBuilder, processedFilter);

      // Execute query
      const entities = await queryBuilder.getMany();
      const mappedResults = this.mapEntitiesToDto(entities);

      return new ResponseData(mappedResults.length, 1, mappedResults);
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch rate plan payment settlement setting list: ${error.message}`
      );
    }
  }

  async createOrUpdateRatePlanPaymentSettlementSetting(
    payload: RatePlanPaymentSettlementSettingListInput
  ): Promise<ResponseContent<RatePlanPaymentSettlementSettingDto | null>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const results: RatePlanPaymentSettlementSettingDto[] = [];

      const hotel = await this.hotelRepository.findByCode(payload.propertyCode);
      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      for (const input of payload.settingList) {
        // Find existing entity by hotelId and ratePlanId (unique constraint)
        let entity = await queryRunner.manager.findOne(RatePlanPaymentSettlementSetting, {
          where: { hotelId: hotel.id, ratePlanId: input.salesPlanId }
        });

        if (entity) {
          // Update existing
          entity.mode = input.mode;
        } else {
          // Create new
          entity = queryRunner.manager.create(RatePlanPaymentSettlementSetting, {
            hotelId: hotel.id,
            ratePlanId: input.salesPlanId,
            mode: input.mode
          });
        }

        // Save entity
        const savedEntity = await queryRunner.manager.save(entity);
        results.push(this.mapEntityToDto(savedEntity));
      }

      await queryRunner.commitTransaction();

      return ResponseContent.success(
        results.length > 0 ? results[0] : null,
        `Rate plan payment settlement settings processed successfully with ${results.length} records processed.`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Failed to create/update rate plan payment settlement settings: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<RatePlanPaymentSettlementSetting>,
    filter: RatePlanPaymentSettlementSettingFilterDto
  ): void {
    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('rppss.id IN (:...idList)', { idList: filter.idList });
    }

    if (filter.hotelIdList && filter.hotelIdList.length > 0) {
      queryBuilder.andWhere('rppss.hotelId IN (:...hotelIdList)', {
        hotelIdList: filter.hotelIdList
      });
    }

    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder.andWhere('rppss.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    if (filter.mode) {
      queryBuilder.andWhere('rppss.mode = :mode', { mode: filter.mode });
    }

    // Apply pagination
    if (filter.pageSize && filter.pageSize > 0) {
      queryBuilder.limit(filter.pageSize);
    }

    if (filter.offset && filter.offset > 0) {
      queryBuilder.offset(filter.offset);
    }

    // Apply ordering
    queryBuilder.orderBy('rppss.createdAt', 'DESC');
  }

  private mapEntitiesToDto(
    entities: RatePlanPaymentSettlementSetting[]
  ): RatePlanPaymentSettlementSettingDto[] {
    return entities.map((entity) => this.mapEntityToDto(entity));
  }

  private mapEntityToDto(
    entity: RatePlanPaymentSettlementSetting
  ): RatePlanPaymentSettlementSettingDto {
    return {
      id: entity.id,
      hotelId: entity.hotelId,
      ratePlanId: entity.ratePlanId,
      mode: entity.mode
    };
  }

  async getRatePlanPaymentSettlementSetting(
    body: GetRatePlanPaymentSettlementSettingDto
  ): Promise<RatePlanPaymentSettlementSetting | null> {
    try {
      const result = await this.ratePlanPaymentSettlementSettingRepository.findOne({
        where: {
          hotelId: body.hotelId,
          ratePlanId: body.ratePlanId
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting sales plan payment settlement settings', error);
      throw new BadRequestException('Error getting sales plan payment settlement settings');
    }
  }
}
