import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsWhere, In, Repository } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlanExtraService } from 'src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlanServicesFilter } from '../dtos/rate-plan-services.dto';

@Injectable()
export class RatePlanExtraServicesRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanExtraService, DB_NAME.POSTGRES)
    private readonly ratePlanServicesRepository: Repository<RatePlanExtraService>,
    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Get rate plan services with filtering and pagination
   * Preserves exact Java logic from RatePlanPaymentTermSettingServiceImpl.ratePlanPaymentTermSettingList()
   */
  async findAll(filter: RatePlanServicesFilter): Promise<RatePlanExtraService[]> {
    try {
      const where: FindOptionsWhere<RatePlanExtraService> = {
        ratePlanId: In(filter.ratePlanIdList)
      };

      return this.ratePlanServicesRepository.find({
        where
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get rate plan services',
        error.message
      );
    }
  }
}
