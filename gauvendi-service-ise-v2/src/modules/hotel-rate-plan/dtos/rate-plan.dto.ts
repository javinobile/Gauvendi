import { Translation } from 'src/core/database/entities/base.entity';
import { DistributionChannel } from 'src/core/entities/room-product.entity';
import { HotelCancellationPolicyDto } from '../../hotel-cancellation-policy/dtos/hotel-cancellation-policy.dto';
import { RatePlanDerivedSettingDto } from './rate-plan-derived-setting.dto';

// Forward declarations for complex nested types
export interface HotelAmenityDto {
  id?: string;
  name?: string;
  code?: string;
  pricingUnit?: string;
  includedDates?: string[];
}

export interface HotelPaymentTermDto {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  translationList?: Translation[];
}

export interface RatePlanTranslationDto {
  id?: string;
  ratePlanId?: string;
  languageCode?: string;
  name?: string;
  description?: string;
}

export class RatePlanDto {
  id?: string;
  hotelId?: string;
  code?: string;
  name?: string;
  hotelCxlPolicyCode?: string;
  hotelCancellationPolicy?: HotelCancellationPolicyDto;
  paymentCode?: string;
  paymentTermCode?: string;
  hotelPaymentTerm?: HotelPaymentTermDto;
  payOnHotel?: number;
  payAtConfirmation?: number;
  hourPrior?: number;
  displayUnit?: string;
  cancellationFeeValue?: number;
  cancellationFeeUnit?: string;
  description?: string;
  includedHotelExtrasList?: HotelAmenityDto[];
  mandatoryHotelExtrasIdList?: string[];
  mandatoryHotelExtrasList?: HotelAmenityDto[];
  surchargeHotelExtrasIdList?: string[];
  surchargeHotelExtrasList?: HotelAmenityDto[];
  mappingRatePlanCode?: string;
  strongestPaymentTermsCode?: string;
  strongestPaymentTerms?: HotelPaymentTermDto;
  strongestCxlPolicyCode?: string;
  strongestCxlPolicy?: HotelCancellationPolicyDto;
  promoCodeList?: string[];
  type?: string;
  hotelExtrasCodeList?: string[];
  isPrimary?: boolean;
  translations?: Translation[];
  distributionChannelList?: DistributionChannel[];
  sellableSetting?: Record<DistributionChannel, boolean>;
  pricingMethodology?: string;
  includedServiceCodeList?: string[];
  ratePlanDerivedSetting?: RatePlanDerivedSettingDto;
}
