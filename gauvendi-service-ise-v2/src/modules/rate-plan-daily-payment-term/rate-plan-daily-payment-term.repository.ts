import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Between, FindOptionsWhere, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanDailyPaymentTerm } from 'src/core/entities/rate-plan-daily-payment-term.entity';
import { RatePlanDailyPaymentTermFilter } from './rate-plan-daily-payment-term.dto';

@Injectable()
export class RatePlanDailyPaymentTermRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanDailyPaymentTerm, DB_NAME.POSTGRES)
    private readonly ratePlanPaymentTermSettingRepository: Repository<RatePlanDailyPaymentTerm>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async findAll(filter: RatePlanDailyPaymentTermFilter): Promise<RatePlanDailyPaymentTerm[]> {
    try {
      const where: FindOptionsWhere<RatePlanDailyPaymentTerm> = {
        hotelId: filter.hotelId
      };

      if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
        where.ratePlanId = In(filter.ratePlanIdList);
      }
      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }
      // Với string date field, cần cast thành date để so sánh chính xác
      if (filter.fromDate && filter.toDate) {
        where.date = Between(filter.fromDate, filter.toDate);
      } else if (filter.fromDate) {
        where.date = MoreThanOrEqual(filter.fromDate);
      } else if (filter.toDate) {
        where.date = LessThanOrEqual(filter.toDate);
      }

      // Các cách khác cho string date (tham khảo):

      // Cách 1: String comparison (chỉ hoạt động với ISO format YYYY-MM-DD)
      // if (filter.fromDate && filter.toDate) {
      //   where.date = Between(filter.fromDate, filter.toDate);
      // }

      // Cách 2: Raw query không cast (rủi ro với format khác)
      // if (filter.fromDate && filter.toDate) {
      //   where.date = Raw((alias) => `${alias} BETWEEN :fromDate AND :toDate`, {
      //     fromDate: filter.fromDate,
      //     toDate: filter.toDate
      //   });
      // }

      return this.ratePlanPaymentTermSettingRepository.find({
        where
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get rate plan daily payment term',
        error.message
      );
    }
  }
}
