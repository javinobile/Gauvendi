import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanDailySellability } from '@src/core/entities/pricing-entities/rate-plan-daily-sellability.entity';
import { DistributionChannel } from '@src/core/enums/common';
import { DbName } from 'src/core/constants/db-name.constant';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, FindOptionsWhere, In, Raw, Repository } from 'typeorm';

@Injectable()
export class RatePlanDailySellabilityRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDailySellability, DbName.Postgres)
    private readonly ratePlanDailySellabilityRepository: Repository<RatePlanDailySellability>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(
    filter: {
      hotelId: string;
      ratePlanIds: string[];
      distributionChannels: DistributionChannel[];
      fromDate: string;
      toDate: string;
      isSellable?: boolean;
    },
    select?: FindOptionsSelect<RatePlanDailySellability>
  ): Promise<RatePlanDailySellability[]> {
    const { hotelId, ratePlanIds, distributionChannels, fromDate, toDate, isSellable } = filter;

    let where: FindOptionsWhere<RatePlanDailySellability> = {
      hotelId: hotelId
    };
    if (ratePlanIds.length > 0) {
      where.ratePlanId = In(ratePlanIds);
    }
    if (distributionChannels && distributionChannels.length > 0) {
      where.distributionChannel = In(distributionChannels);
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

    if (isSellable !== undefined && isSellable !== null) {
      where.isSellable = isSellable;
    }

    return this.ratePlanDailySellabilityRepository.find({
      where: where,
      select: select
    });
  }

  async delete(filter: {
    hotelId: string;
    ratePlanId: string;
    distributionChannel: DistributionChannel;
    dates: string[];
  }) {
    const { hotelId, ratePlanId, distributionChannel, dates } = filter;

    let where: FindOptionsWhere<RatePlanDailySellability> = {
      hotelId: hotelId,
      ratePlanId: ratePlanId,
      distributionChannel: distributionChannel,
      date: In(dates)
    };

    await this.ratePlanDailySellabilityRepository.delete(where);
  }
}
