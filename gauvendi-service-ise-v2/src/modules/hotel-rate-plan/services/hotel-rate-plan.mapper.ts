import { Injectable } from '@nestjs/common';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RatePlanDerivedSettingDto } from '../dtos/rate-plan-derived-setting.dto';
import { RatePlanDto } from '../dtos/rate-plan.dto';

@Injectable()
export class HotelRatePlanMapper {
  toDto(entity: RatePlan): RatePlanDto {
    let ratePlanDerivedSetting: RatePlanDerivedSettingDto | undefined = undefined;
    if (entity.derivedSetting && entity.derivedSetting.length > 0) {
      const derivedSettings = entity.derivedSetting[0];

      ratePlanDerivedSetting = {
        id: derivedSettings.id,
        hotelId: derivedSettings.hotelId,
        ratePlanId: derivedSettings.ratePlanId,
        derivedRatePlanId: derivedSettings.derivedRatePlanId,
        followDailyPaymentTerm: derivedSettings.followDailyPaymentTerm,
        followDailyCxlPolicy: derivedSettings.followDailyCxlPolicy,
        followDailyIncludedAmenity: derivedSettings.followDailyIncludedAmenity,
        followDailyRoomProductAvailability: derivedSettings.followDailyRoomProductAvailability,
        followDailyRestriction: derivedSettings.followDailyRestriction
      };
    }

    return {
      id: entity.id,
      hotelId: entity.hotelId,
      code: entity.code,
      name: entity.name,
      paymentCode: entity.paymentTermCode, // Map paymentTermCode to paymentCode
      paymentTermCode: entity.paymentTermCode,
      payOnHotel: entity.payAtHotel,
      payAtConfirmation: entity.payOnConfirmation,
      hourPrior: entity.hourPrior,
      displayUnit: entity.displayUnit,
      hotelCxlPolicyCode: entity.hotelCxlPolicyCode,
      cancellationFeeValue: entity.cancellationFeeValue,
      cancellationFeeUnit: entity.cancellationFeeUnit,
      description: entity.description,
      mappingRatePlanCode: entity.pmsMappingRatePlanCode,
      promoCodeList: entity.promoCodes || [],
      type: entity.type,
      isPrimary: entity.isPrimary,
      pricingMethodology: entity.pricingMethodology,
      ratePlanDerivedSetting: ratePlanDerivedSetting,
      translations: entity.translations
    };
  }
}
