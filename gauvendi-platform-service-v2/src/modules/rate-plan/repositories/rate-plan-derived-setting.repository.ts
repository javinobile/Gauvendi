import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LIMIT_PAGE_SIZE } from 'src/core/constants/common.const';
import { DbName } from 'src/core/constants/db-name.constant';
import { Filter } from 'src/core/dtos/common.dto';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { EntityManager, In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  RatePlanDerivedSettingFilter,
  RatePlanDerivedSettingInput
} from '../../../core/dtos/rate-plan-derived-setting.dto';
import { RatePlanDerivedSetting } from '../../../core/entities/pricing-entities/rate-plan-derived-setting.entity';

@Injectable()
export class RatePlanDerivedSettingRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,
    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Get rate plan derived settings with filtering and pagination
   * Preserves exact Java logic from RatePlanDerivedSettingServiceImpl.ratePlanDerivedSettingList()
   */
  async findAll(filter: RatePlanDerivedSettingFilter): Promise<RatePlanDerivedSetting[]> {
    try {
      // Set default filter value - matching Java logic
      filter = Filter.setDefaultValue(filter, RatePlanDerivedSettingFilter);

      // Set limit - matching Java logic
      if (filter.pageSize === -1) {
        const countQuery =
          this.ratePlanDerivedSettingRepository.createQueryBuilder('ratePlanDerivedSetting');
        this.setFilterForQuery(countQuery, filter);
        filter.pageSize = LIMIT_PAGE_SIZE; // Config.LIMIT_PAGE_SIZE equivalent
      }

      // Create query builder - matching Java QRatePlanDerivedSetting logic
      const queryBuilder =
        this.ratePlanDerivedSettingRepository.createQueryBuilder('ratePlanDerivedSetting');

      // Apply filters - matching Java setFilterForQuery logic
      this.setFilterForQuery(queryBuilder, filter);

      // Set paging - matching Java Filter.setPagingFilter logic
      // Filter.setPagingFilter(queryBuilder, filter);

      // Execute query - matching Java findPagedList logic
      const [entities] = await queryBuilder.getManyAndCount();

      return entities;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get rate plan derived settings',
        error.message
      );
    }
  }

  /**
   * Find derived settings for matching derived plan IDs
   * Used by RatePlanRepository for derived plan matching logic
   */
  async findForMatching(hotelId: string, ratePlanIds: string[]): Promise<RatePlanDerivedSetting[]> {
    try {
      return await this.ratePlanDerivedSettingRepository.find({
        where: {
          hotelId,
          ratePlanId: In(ratePlanIds)
        },
        select: ['ratePlanId', 'derivedRatePlanId']
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find derived settings for matching',
        error.message
      );
    }
  }

  /**
   * Find derived settings by hotel and derived rate plan ID
   * Used for checking dependencies before deleting a rate plan
   */
  async findByDerivedRatePlanId(
    hotelId: string,
    derivedRatePlanId: string
  ): Promise<RatePlanDerivedSetting[]> {
    try {
      return await this.ratePlanDerivedSettingRepository.find({
        where: {
          hotelId,
          derivedRatePlanId
        }
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find derived settings by derived rate plan ID',
        error.message
      );
    }
  }

  /**
   * Delete derived settings by hotel and rate plan ID
   * Used for cleanup when deleting a rate plan
   */
  async deleteByRatePlanId(hotelId: string, ratePlanId: string): Promise<void> {
    try {
      await this.ratePlanDerivedSettingRepository.delete({
        hotelId,
        ratePlanId
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete derived settings by rate plan ID',
        error.message
      );
    }
  }

  /**
   * Check if rate plan has dependent derived settings
   * Returns the dependent rate plan IDs if any exist
   */
  async checkDependentDerivedPlans(hotelId: string, derivedRatePlanId: string): Promise<string[]> {
    try {
      const derivedSettings = await this.findByDerivedRatePlanId(hotelId, derivedRatePlanId);
      return derivedSettings.map((ds) => ds.ratePlanId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to check dependent derived plans',
        error.message
      );
    }
  }

  /**
   * Create or update rate plan derived setting
   * Preserves exact Java logic from RatePlanDerivedSettingServiceImpl.createOrUpdateRatePlanDerivedSetting()
   */
  async createOrUpdate(
    input: RatePlanDerivedSettingInput,
    transactionalEntityManager?: EntityManager
  ): Promise<RatePlanDerivedSetting> {
    try {
      // Use transactional manager if provided, otherwise use default repository
      const repo = transactionalEntityManager
        ? transactionalEntityManager.getRepository(RatePlanDerivedSetting)
        : this.ratePlanDerivedSettingRepository;

      // Find existing entity - matching Java QRatePlanDerivedSetting query logic
      let entity = await repo.findOne({
        where: {
          hotelId: input.hotelId,
          derivedRatePlanId: input.derivedRatePlanId,
          ratePlanId: input.ratePlanId
        }
      });

      if (!entity) {
        // Create new entity - matching Java logic
        entity = repo.create({
          hotelId: input.hotelId,
          ratePlanId: input.ratePlanId,
          derivedRatePlanId: input.derivedRatePlanId
        });
      }

      // Update entity fields - matching Java logic exactly
      entity.followDailyPaymentTerm = input.followDailyPaymentTerm ?? false;
      entity.followDailyCxlPolicy = input.followDailyCxlPolicy ?? false;
      entity.followDailyIncludedAmenity = input.followDailyIncludedAmenity ?? false;
      entity.followDailyRoomProductAvailability = input.followDailyRoomProductAvailability ?? false;
      entity.followDailyRestriction = input.followDailyRestriction ?? false;
      entity.inheritedRestrictionFields = input.inheritedRestrictionFields ?? [];

      if (!this.isProd) {
        entity.createdBy = this.currentSystem;
        entity.updatedBy = this.currentSystem;
      }

      // Save to database using appropriate repository - matching Java entity.save() logic
      const savedEntity = await repo.save(entity);

      return savedEntity;
    } catch (error) {
      // Handle database errors
      throw new InternalServerErrorException(
        'Failed to create or update rate plan derived setting',
        error.message
      );
    }
  }

  /**
   * Set filters for query - matching Java setFilterForQuery logic exactly
   */
  private setFilterForQuery(
    queryBuilder: SelectQueryBuilder<RatePlanDerivedSetting>,
    filter: RatePlanDerivedSettingFilter
  ): void {
    // filter hotelId
    if (filter.hotelId) {
      queryBuilder.andWhere('ratePlanDerivedSetting.hotelId = :hotelId', {
        hotelId: filter.hotelId
      });
    }

    // filter ratePlanIds
    if (filter.ratePlanIds?.length) {
      queryBuilder.andWhere('ratePlanDerivedSetting.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIds
      });
    }

    // Filter by id - matching Java EbeanUtils.setEqualOrInQuery(query.id, filter.getIdList())
    if (filter.idList && filter.idList.length > 0) {
      queryBuilder.andWhere('ratePlanDerivedSetting.id IN (:...idList)', { idList: filter.idList });
    }

    // Filter by hotelId - matching Java EbeanUtils.setEqualOrInQuery(query.hotelId, filter.getHotelIdList())
    if (filter.hotelIdList && filter.hotelIdList.length > 0) {
      queryBuilder.andWhere('ratePlanDerivedSetting.hotelId IN (:...hotelIdList)', {
        hotelIdList: filter.hotelIdList
      });
    }

    // Filter by ratePlanId - matching Java EbeanUtils.setEqualOrInQuery(query.ratePlanId, filter.getRatePlanIdList())
    if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
      queryBuilder.andWhere('ratePlanDerivedSetting.ratePlanId IN (:...ratePlanIdList)', {
        ratePlanIdList: filter.ratePlanIdList
      });
    }

    // Filter by derivedRatePlanId - matching Java EbeanUtils.setEqualOrInQuery(query.derivedRatePlanId, filter.getDerivedRatePlanIdList())
    if (filter.derivedRatePlanIdList && filter.derivedRatePlanIdList.length > 0) {
      queryBuilder.andWhere(
        'ratePlanDerivedSetting.derivedRatePlanId IN (:...derivedRatePlanIdList)',
        { derivedRatePlanIdList: filter.derivedRatePlanIdList }
      );
    }

    // Filter by followDailyRoomProductAvailability - matching Java logic
    if (filter.isFollowDailyRoomProductAvailability !== undefined) {
      queryBuilder.andWhere(
        'ratePlanDerivedSetting.followDailyRoomProductAvailability = :followDailyRoomProductAvailability',
        {
          followDailyRoomProductAvailability: filter.isFollowDailyRoomProductAvailability
        }
      );
    }
  }
}
