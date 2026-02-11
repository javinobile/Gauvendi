import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { InternalServerErrorException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { In, Repository } from 'typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanPaymentTermSettingFilterDto } from '../dtos/rate-plan-payment-term-setting-filter.dto';

@Injectable()
export class RatePlanPaymentTermSettingsRepository extends BaseService {
  constructor(
    @InjectRepository(RatePlanPaymentTermSetting, DB_NAME.POSTGRES)
    private readonly ratePlanPaymentTermSettingRepository: Repository<RatePlanPaymentTermSetting>,
    configService: ConfigService
  ) {
    super(configService);
  }

  /**
   * Get rate plan payment term settings with filtering and pagination
   * Preserves exact Java logic from RatePlanPaymentTermSettingServiceImpl.ratePlanPaymentTermSettingList()
   */
  async findAll(
    filter: RatePlanPaymentTermSettingFilterDto
  ): Promise<RatePlanPaymentTermSetting[]> {
    try {
      const { where, relations, order } = Filter.buildCondition<
        RatePlanPaymentTermSetting,
        RatePlanPaymentTermSettingFilterDto
      >(filter);

      if (filter.hotelIdList && filter.hotelIdList.length > 0) {
        where.hotelId = In(filter.hotelIdList);
      }
      if (filter.ratePlanIdList && filter.ratePlanIdList.length > 0) {
        where.ratePlanId = In(filter.ratePlanIdList);
      }
      if (filter.idList && filter.idList.length > 0) {
        where.id = In(filter.idList);
      }
      if (filter.hotelPaymentTermIdList && filter.hotelPaymentTermIdList.length > 0) {
        where.hotelPaymentTermId = In(filter.hotelPaymentTermIdList);
      }
      if (
        filter.supportedPaymentMethodCodeList &&
        filter.supportedPaymentMethodCodeList.length > 0
      ) {
        where.supportedPaymentMethodCodes = In(filter.supportedPaymentMethodCodeList);
      }

      if (filter.isDefault !== undefined) {
        where.isDefault = filter.isDefault;
      }

      return this.ratePlanPaymentTermSettingRepository.find({
        where,
        order,
        relations
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get rate plan payment term settings',
        error.message
      );
    }
  }
}
