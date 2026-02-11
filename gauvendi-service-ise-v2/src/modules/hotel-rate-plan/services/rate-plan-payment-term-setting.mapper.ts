import { Injectable } from '@nestjs/common';
import { RatePlanPaymentTermSetting } from 'src/core/entities/pricing-entities/rate-plan-payment-term-setting.entity';
import { RatePlanPaymentTermSettingDto } from '../dtos/rate-plan-payment-term-setting.dto';

@Injectable()
export class RatePlanPaymentTermSettingMapper {
  constructor() {}

  toDto(entity: RatePlanPaymentTermSetting): RatePlanPaymentTermSettingDto {
    return {
      id: entity.id,
      hotelId: entity.hotelId,
      ratePlanId: entity.ratePlanId,
      hotelPaymentTermId: entity.hotelPaymentTermId,
      supportedPaymentMethodCodeList: entity.supportedPaymentMethodCodes,
      isDefault: entity.isDefault
    };
  }
}
