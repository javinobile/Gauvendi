import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Between, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanCxlPolicyDaily } from 'src/core/entities/rate-plan-cxl-policy-daily.entity';
import { RatePlanCancellationPolicyDailyFilter } from './rate-plan-cancellation-policy-daily.dto';

@Injectable()
export class RatePlanCancellationPolicyDailyRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanCxlPolicyDaily, DB_NAME.POSTGRES)
    private readonly ratePlanCancellationPolicyDailyRepository: Repository<RatePlanCxlPolicyDaily>,
    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Get rate plan derived settings with filtering and pagination
   * Preserves exact Java logic from RatePlanDerivedSettingServiceImpl.ratePlanDerivedSettingList()
   */
  async findAll(filter: RatePlanCancellationPolicyDailyFilter): Promise<RatePlanCxlPolicyDaily[]> {
    try {
      const where: FindOptionsWhere<RatePlanCxlPolicyDaily> = {
        hotelId: filter.hotelId
      };

      if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
        where.ratePlanId = In(filter.ratePlanIdList);
      }
      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }

      if (filter.fromDate && filter.toDate) {
        where.date = Between(filter.fromDate, filter.toDate);
      }

      else if (filter.fromDate) {
        where.date = MoreThanOrEqual(filter.fromDate);
      }
      else if (filter.toDate) {
        where.date = LessThanOrEqual(filter.toDate);
      }

      return this.ratePlanCancellationPolicyDailyRepository.find({
        where,
        order: {
          date: 'ASC'
        }
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get rate plan cancellation policy daily',
        error.message
      );
    }
  }
}
