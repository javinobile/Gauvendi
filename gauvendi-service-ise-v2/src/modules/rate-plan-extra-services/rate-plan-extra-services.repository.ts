import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  RatePlanExtraService,
  RatePlanExtraServiceType
} from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanDailyExtraService } from 'src/core/entities/rate-plan-daily-extra-service.entity';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsSelect, FindOptionsWhere, In, Repository } from 'typeorm';

@Injectable()
export class RatePlanExtraServicesRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanExtraService, DB_NAME.POSTGRES)
    private readonly ratePlanExtraServicesRepository: Repository<RatePlanExtraService>,

    @InjectRepository(RatePlanDailyExtraService, DB_NAME.POSTGRES)
    private readonly ratePlanDailyExtraServicesRepository: Repository<RatePlanDailyExtraService>,
    configService: ConfigService
  ) {
    super(configService);
  }

  findAll(
    filter: {
      extrasIds?: string[];
      ratePlanIds?: string[];
      types?: RatePlanExtraServiceType[];
    },
    select?: FindOptionsSelect<RatePlanExtraService>
  ): Promise<RatePlanExtraService[]> {
    const where: FindOptionsWhere<RatePlanExtraService> = {};
    if (filter.extrasIds && filter.extrasIds.length > 0) {
      where.extrasId = In(filter.extrasIds);
    }
    if (filter.ratePlanIds && filter.ratePlanIds.length > 0) {
      where.ratePlanId = In(filter.ratePlanIds);
    }
    if (filter.types && filter.types.length > 0) {
      where.type = In(filter.types);
    }
    return this.ratePlanExtraServicesRepository.find({
      where,
      select
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

  findByExtrasIds(extrasIds: string[]): Promise<RatePlanExtraService[]> {
    return this.ratePlanExtraServicesRepository.find({
      where: {
        extrasId: In(extrasIds)
      }
    });
  }
}
