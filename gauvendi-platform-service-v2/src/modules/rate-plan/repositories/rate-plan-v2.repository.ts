import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';
import { RatePlanDailyAdjustment } from '@src/core/entities/pricing-entities/rate-plan-daily-adjustment.entity';
import { RatePlanDerivedSetting } from '@src/core/entities/pricing-entities/rate-plan-derived-setting.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanStatusEnum } from 'src/core/enums/common';
import { BaseService } from 'src/core/services/base.service';
import {
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  Raw,
  Repository
} from 'typeorm';

@Injectable()
export class RatePlanV2Repository extends BaseService {
  private readonly logger = new Logger(RatePlanV2Repository.name);

  constructor(
    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(RatePlanDerivedSetting, DbName.Postgres)
    private readonly ratePlanDerivedSettingRepository: Repository<RatePlanDerivedSetting>,

    @InjectRepository(RatePlanDailyAdjustment, DbName.Postgres)
    private readonly ratePlanDailyAdjustmentRepository: Repository<RatePlanDailyAdjustment>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(
    filter: {
      hotelId: string;
      ratePlanCodes?: string[];
      ratePlanIds?: string[];
      statusList?: RatePlanStatusEnum[];
      relations?: FindOptionsRelations<RatePlan>;
    },
    select?: FindOptionsSelect<RatePlan>
  ): Promise<RatePlan[]> {
    const { hotelId, ratePlanCodes, ratePlanIds, statusList, relations } = filter;
    const where: FindOptionsWhere<RatePlan> = {
      hotelId
    };

    if (ratePlanCodes && ratePlanCodes.length > 0) {
      where.code = In(ratePlanCodes);
    }

    if (ratePlanIds && ratePlanIds.length > 0) {
      where.id = In(ratePlanIds);
    }

    if (statusList && statusList.length > 0) {
      where.status = In(statusList);
    }

    return this.ratePlanRepository.find({
      where,
      relations,
      select
    });
  }

  async findDailyAdjustments(
    filter: {
      hotelId: string;
      ratePlanId?: string;
      ratePlanIds?: string[];
      dates?: string[];
      fromDate?: string;
      toDate?: string;
      relations?: FindOptionsRelations<RatePlanDailyAdjustment>;
    },
    select?: FindOptionsSelect<RatePlanDailyAdjustment>
  ): Promise<RatePlanDailyAdjustment[]> {
    const { hotelId, ratePlanId, ratePlanIds, dates, fromDate, toDate, relations } = filter;

    const where: FindOptionsWhere<RatePlanDailyAdjustment> = {
      hotelId
    };
    if (ratePlanId) {
      where.ratePlanId = ratePlanId;
    }
    if (ratePlanIds && ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (dates && dates.length > 0) {
      where.date = In(dates);
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

    return this.ratePlanDailyAdjustmentRepository.find({
      where,
      select,
      relations
    });
  }

  async findDerivedSettings(
    filter: {
      hotelId: string;
      baseRatePlanId?: string;
      baseRatePlanIds?: string[];
      derivedRatePlanId?: string;
      derivedRatePlanIds?: string[];
      relations?: FindOptionsRelations<RatePlanDerivedSetting>;
    },
    select?: FindOptionsSelect<RatePlanDerivedSetting>
  ): Promise<RatePlanDerivedSetting[]> {
    const {
      hotelId,
      baseRatePlanId,
      baseRatePlanIds,
      derivedRatePlanId,
      derivedRatePlanIds,
      relations
    } = filter;
    const where: FindOptionsWhere<RatePlanDerivedSetting> = {
      hotelId
    };
    if (baseRatePlanId) {
      where.ratePlanId = baseRatePlanId;
    }
    if (baseRatePlanIds && baseRatePlanIds.length > 0) {
      where.ratePlanId = In(baseRatePlanIds);
    }
    if (derivedRatePlanId) {
      where.derivedRatePlanId = derivedRatePlanId;
    }
    if (derivedRatePlanIds && derivedRatePlanIds.length > 0) {
      where.derivedRatePlanId = In(derivedRatePlanIds);
    }

    return this.ratePlanDerivedSettingRepository.find({
      where,
      relations,
      select
    });
  }
}
