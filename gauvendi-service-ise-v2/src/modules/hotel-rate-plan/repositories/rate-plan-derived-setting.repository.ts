import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanDerivedSetting } from '../../../core/entities/pricing-entities/rate-plan-derived-setting.entity';
import {
  RatePlanDerivedSettingFilter,
  RatePlanDerivedSettingInput
} from '../dtos/rate-plan-derived-setting.dto';

@Injectable()
export class RatePlanDerivedSettingRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDerivedSetting, DB_NAME.POSTGRES)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,
    configService: ConfigService
  ) {
    super(configService);
  }

  findAll(
    filter: { hotelId: string; ratePlanIds: string[], followDailyIncludedAmenity?: boolean },
    select?: FindOptionsSelect<RatePlanDerivedSetting>
  ): Promise<RatePlanDerivedSetting[]> {
    const where: FindOptionsWhere<RatePlanDerivedSetting> = {};
    if (filter.hotelId) {
      where.hotelId = filter.hotelId;
    }
    if (filter.ratePlanIds && filter.ratePlanIds.length > 0) {
      where.ratePlanId = In(filter.ratePlanIds);
    }


    return this.ratePlanDerivedSettingRepository.find({
      where,
      select
    });
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
  async createOrUpdate(input: RatePlanDerivedSettingInput): Promise<RatePlanDerivedSetting> {
    try {
      // Find existing entity - matching Java QRatePlanDerivedSetting query logic
      let entity = await this.ratePlanDerivedSettingRepository.findOne({
        where: {
          hotelId: input.hotelId,
          derivedRatePlanId: input.derivedRatePlanId,
          ratePlanId: input.ratePlanId
        }
      });

      if (!entity) {
        // Create new entity - matching Java logic
        entity = this.ratePlanDerivedSettingRepository.create({
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

      if (!this.isProd) {
        entity.createdBy = this.currentSystem;
        entity.updatedBy = this.currentSystem;
      }

      // Save to database - matching Java entity.save() logic
      const savedEntity = await this.ratePlanDerivedSettingRepository.save(entity);

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
