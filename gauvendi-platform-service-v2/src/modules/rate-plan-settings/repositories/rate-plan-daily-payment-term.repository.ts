import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanDailyPaymentTerm } from '@src/core/entities/rate-plan-daily-payment-term.entity';
import { DbName } from 'src/core/constants/db-name.constant';
import { BaseService } from 'src/core/services/base.service';
import { DeleteResult, FindOptionsSelect, FindOptionsWhere, In, Raw, Repository } from 'typeorm';

@Injectable()
export class RatePlanDailyPaymentTermRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDailyPaymentTerm, DbName.Postgres)
    private readonly ratePlanDailyPaymentTermRepository: Repository<RatePlanDailyPaymentTerm>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(
    filter: {
      hotelId: string;
      ratePlanIds: string[];
      fromDate?: string;
      toDate?: string;
      ids?: string[];
      dates?: string[];
    },
    select?: FindOptionsSelect<RatePlanDailyPaymentTerm>
  ) {
    const { hotelId, ratePlanIds, fromDate, toDate, ids, dates } = filter;

    let where: FindOptionsWhere<RatePlanDailyPaymentTerm> = {
      hotelId: hotelId
    };
    if (ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }

    if (ids && ids.length > 0) {
      where.id = In(ids);
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
      where.date = Raw(() => `"date"::date >= :fromDate::date`, { fromDate: filter.fromDate });
    } else if (toDate) {
      where.date = Raw(() => `"date"::date <= :toDate::date`, { toDate: filter.toDate });
    }

    return this.ratePlanDailyPaymentTermRepository.find({
      where: where,
      select: select
    });
  }

  async save(input: RatePlanDailyPaymentTerm[]): Promise<RatePlanDailyPaymentTerm[]> {
    return await this.ratePlanDailyPaymentTermRepository.save(input);
  }

  async delete(filter: FindOptionsWhere<RatePlanDailyPaymentTerm>): Promise<DeleteResult> {
    return await this.ratePlanDailyPaymentTermRepository.delete(filter);
  }
}
