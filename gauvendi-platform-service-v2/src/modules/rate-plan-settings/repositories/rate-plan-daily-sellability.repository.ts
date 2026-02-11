import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanCxlPolicyDaily } from '@src/core/entities/rate-plan-cxl-policy-daily.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { BaseService } from 'src/core/services/base.service';
import { DeleteResult, FindOptionsWhere, In, Raw, Repository } from 'typeorm';

@Injectable()
export class RatePlanDailyCancellationPolicyRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanCxlPolicyDaily, DbName.Postgres)
    private readonly ratePlanDailyCancellationPolicyRepository: Repository<RatePlanCxlPolicyDaily>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: {
    hotelId: string;
    ratePlanIds: string[];
    fromDate?: string;
    toDate?: string;
    ids?: string[];
    dates?: string[];
  }) {
    const { hotelId, ratePlanIds, fromDate, toDate, ids, dates } = filter;

    let where: FindOptionsWhere<RatePlanCxlPolicyDaily> = {
      hotelId: hotelId
    };
    if (ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }

    if (ids && ids.length > 0) {
      where.id = In(ids);
    }

    if (fromDate && toDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date AND "date"::date <= :toDate::date`, {
        fromDate: fromDate,
        toDate: toDate
      });
    } else if (fromDate) {
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: filter.fromDate });
    } else if (toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: filter.toDate });
    }

    if (dates && dates.length > 0) {
      where.date = In(dates);
    }

    return this.ratePlanDailyCancellationPolicyRepository.find({
      where: where
    });
  }

  async save(input: RatePlanCxlPolicyDaily[]): Promise<RatePlanCxlPolicyDaily[]> {
    return await this.ratePlanDailyCancellationPolicyRepository.save(input);
  }

  async delete(filter: FindOptionsWhere<RatePlanCxlPolicyDaily>): Promise<DeleteResult> {
    return await this.ratePlanDailyCancellationPolicyRepository.delete(filter);
  }
}
