import { RatePlanAdjustmentType } from 'src/core/enums/common';
import { HotelAmenityDto } from '../dtos/booking.dto';

export class DailySellingRateDto {
  date: string;

  originalSellingRate?: number;
  
  originalTotalSellingRate?: number;

  sellingRate?: number;

  extraBedAmount?: number;

  extraOccupancySurchargeAmount?: number;

  addInPetAmenity?: HotelAmenityDto;

  roomOnlySellingPrice?: number;

  rateBeforeAdjustment?: number;

  rateAfterAdjustment?: number;

  roomSellingRateGap?: number;

  ratePlanAdjustmentRate?: number;

  roundingGap?: number;

  salesPlanAdjustmentUnit?: RatePlanAdjustmentType;

  salesPlanAdjustmentValue?: number;

  includedExtraServicesRate?: number;

  includedServicesTaxAmount?: number;

  includedServicesAmountAfterTax?: number;

  nonDailyExtraServicesAfterTaxAmount?: number;

  taxAmount?: number;

  roomOnlyTaxAmount?: number;

  cityTaxAmount?: number;

  taxDetails?: { [key: string]: number };

  roomOnlyTaxDetails?: { [key: string]: number };

  includedServiceTaxDetails?: { [key: string]: number };

  includedServicePriceDetails?: { [key: string]: number };

  calculatedCityTax?: any; // CalculatedCityTaxDto

  ratePlanId: string;
  roomProductId: string;
  roomProductRatePlanId: string;
  isDerived: boolean;
  doubleOccupancyRate?: number;
  featureAdjustmentRate?: number;
  baseSellingRate?: number;

  baseNetPrice: number;
  baseGrossPrice: number;
}
