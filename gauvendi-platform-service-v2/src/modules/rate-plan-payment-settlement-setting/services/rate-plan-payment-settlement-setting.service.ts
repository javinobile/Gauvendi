import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { ResponseContent, ResponseData } from 'src/core/dtos/common.dto';
import { Repository } from 'typeorm';
import { HotelRepository } from '../../hotel/repositories/hotel.repository';
import { RatePlanPaymentSettlementSettingRepository } from '../repositories/rate-plan-payment-settlement-setting.repository';
import { RatePlanPaymentSettlementSettingModeEnum } from '@src/core/enums/common';
import { RatePlanPaymentSettlementSettingDto, RatePlanPaymentSettlementSettingInputDto } from '../dtos';
import { RatePlanPaymentSettlementSettingListInput } from '../dtos/rate-plan-payment-settlement-setting-input.dto';

@Injectable()
export class RatePlanPaymentSettlementSettingService {
  constructor(
    private readonly ratePlanPaymentSettlementSettingRepository: RatePlanPaymentSettlementSettingRepository,
    private readonly hotelRepository: HotelRepository,
    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>
  ) {}

  async createOrUpdateRatePlanPaymentSettlementSetting(
    payload: RatePlanPaymentSettlementSettingListInput
  ): Promise<ResponseContent<RatePlanPaymentSettlementSettingDto | null>> {
    return await this.ratePlanPaymentSettlementSettingRepository.createOrUpdateRatePlanPaymentSettlementSetting(payload);
  }


  async getSalesPlanPaymentSettlementSettingList(propertyCode: string): Promise<ResponseData<any>> {
    const hotel = await this.hotelRepository.findByCode(propertyCode);
    if (!hotel) {
      return new ResponseData(0, 1, []);
    }

    let ratePlans = await this.ratePlanRepository.find({
      where: { hotelId: hotel.id },
      relations: ['ratePlanPaymentSettlementSettings'],
      select: {
        id: true,
        name: true,
        code: true,
        ratePlanPaymentSettlementSettings: {
          id: true,
          mode: true
        }
      }
    });

    const missingSettings = ratePlans
      .filter(rp => !rp.ratePlanPaymentSettlementSettings?.length)
      .map(rp => ({
        salesPlanId: rp.id,
        mode: RatePlanPaymentSettlementSettingModeEnum.MANUAL_SETTLEMENT
      }));

    if (missingSettings.length > 0) {
      await this.ratePlanPaymentSettlementSettingRepository.createOrUpdateRatePlanPaymentSettlementSetting({
        propertyCode,
        settingList: missingSettings
      });
      ratePlans = await this.ratePlanRepository.find({
        where: { hotelId: hotel.id },
        relations: ['ratePlanPaymentSettlementSettings'],
        select: {
          id: true,
          name: true,
          code: true,
          ratePlanPaymentSettlementSettings: {
            id: true,
            mode: true
          }
        }
      });
    }

    const mappedData = ratePlans.map(rp => ({
      id: rp.id,
      name: rp.name,
      code: rp.code,
      paymentSettlementSetting: rp.ratePlanPaymentSettlementSettings?.[0]
    }));

    return new ResponseData(mappedData.length, 1, mappedData);
  }
}
