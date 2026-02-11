import Decimal from 'decimal.js';
import {
  HotelAmenity,
  HotelAmenityAgeCategoryPricingDto,
  IsePricingDisplayModeEnum,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { CityTaxChargeMethodEnum } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';

export class TaxDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  rate?: number;
  amount: number;
  description?: string;
}

export class HotelPaymentTermDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  payAtHotel: number;
  payOnConfirmation: number;
  payAtHotelDescription: string;
  payOnConfirmationDescription: string;
}

export class HotelCancellationPolicyDto {
  id: string;
  name: string;
  description: string;
  hourPrior: number;
}

export class CityTaxBreakdownDto {
  id: string;
  code: string;
  name: string;
  amount: number;
  chargeMethod?: CityTaxChargeMethodEnum;
}

export class CalculatedCityTaxDto {
  propertyId?: string;
  fromDate?: string;
  toDate?: string;
  roomProductSalesPlanId?: string;
  taxBreakdown: CityTaxBreakdownDto[];
  totalCityTaxAmount?: number;
  chargeMethod?: CityTaxChargeMethodEnum;
}

export class RetailFeatureImageDto {
  imageUrl: string;
}

export class RetailCategoryDto {
  id: string;
  name: string;
  code: string;
  displaySequence: number;
}

export class RetailFeatureDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  quantity: number;
  retailFeatureImageList?: RetailFeatureImageDto[];
  hotelRetailCategory: RetailCategoryDto;
  measurementUnit: string;
}

export class StandardFeatureDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  iconImageUrl: string;
}

export class RoomProductDto {
  id: string;
  hotelId?: string;
  name: string;
  code: string;
  description: string;
  capacityAdult?: number;
  capacityChildren?: number;
  rfcImageList: any[];
  rfcType?: string;
  numberOfBedrooms: number;
  allocatedAdultCount?: number;
  allocatedChildCount?: number;
  allocatedExtraBedAdultCount?: number;
  allocatedExtraBedChildCount?: number;
  allocatedPetCount?: number;
  space: number;
  capacityDefault: number;
  maximumAdult: number;
  maximumKid: number;
  capacityExtra: number;
  extraBedAdult: number;
  extraBedKid: number;
  status: string;
  travelTag?: string;
  occasion?: string;
  retailFeatureList: RetailFeatureDto[];
  standardFeatureList: StandardFeatureDto[];
}

export class RatePlanDto {
  id: string;
  code: string;
  name: string;
  paymentTermCode?: string;
  payAtHotel?: boolean;
  payOnConfirmation?: boolean;
  hotelCxlPolicyCode?: string;
  hourPrior?: number;
  displayUnit?: string;
  cancellationFeeValue?: number;
  cancellationFeeUnit?: string;
  description: string;
  includedHotelExtrasList: any[];
  hotelExtrasCodeList?: string[];
}

export class RoomProductSalesPlanDto {
  id: string;
  rfcId: string;
  ratePlanId: string;
  name?: string;
  code: string;
  cancellationType?: string;
  guaranteeType?: string;
  totalBaseRate?: number;
  ratePlan: RatePlanDto;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalBaseAmountBeforeAdjustment?: number;
  totalGrossAmount: number;
  totalGrossAmountBeforeAdjustment?: number;
  taxAmount: number;
  cityTaxAmount?: number;
  serviceChargeAmount: number;
  averageDailyRate: number;
  roomOnlySellingPrice?: number;
  adjustmentPercentage?: number;
  shouldShowStrikeThrough?: boolean;
  averageDailyRateWithTax?: number;
  averageDailyRateIncludingCityTax?: number;
  averageDailyRateWithoutTax?: number;
  strikeThroughTotalGrossAmount?: number;
  calculatedCityTax?: CalculatedCityTaxDto;
  roomTaxDetailsMap?: Record<string, number>;
  includedServiceTaxDetailsMap?: Record<string, Decimal>;
  // dailySellingRateList: DailySellingRateDto[];
  totalExtraBedAmount?: number;
  totalOccupancySurchargeAmount?: number;
  totalSellingRateBeforeAdjustment?: number;
  taxAmountBeforeAdjustment?: number;
  dailyRoomRateList: DailyRoomRateDto[];
  baseRate?: number;
}
export interface DailyRoomRateDto {
  date: string;
  baseAmount: number;
  taxAmount: number;
  grossAmount: number;
  baseAmountBeforeAdjustment: number;
  taxAmountBeforeAdjustment: number;
  grossAmountBeforeAdjustment: number;
}
export class AgeCategoryPricingDto {
  ageCategoryCode: string;
  fromAge?: number;
  toAge?: number;
  totalSellingRate: number;
  count: number;
}

export class HotelAmenityDto {
  id: string;
  code: string;
  name: string;
  description: string;
  amenityType: string;
  pricingUnit: string;
  includedDates?: string[];
  iconImageUrl: string;
  isIncluded?: boolean;
  isePricingDisplayMode?: IsePricingDisplayModeEnum;
}

export class AmenityPricingDto {
  isSalesPlanIncluded: boolean;
  hotelAmenity: HotelAmenityDto;
  ageCategoryPricingList: HotelAmenityAgeCategoryPricingDto[];
  count: number;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  averageDailyRate: number;
  taxDetailsMap: Record<string, Decimal>;
  taxSettingList: HotelTaxSetting[];
  amenityPricingDateList: ReservationAmenityPricingDateDto[];
  comboItemPricingList: ReservationAmenityComboItemPricingDto[];
  cityTaxAmount?: number;
  extraServiceType?: string;
  includedDates?: string[];
  linkedAmenityInfoList?: HotelAmenity[];
  sellingType?: SellingTypeEnum;
}

export class ReservationPricingDto {
  arrival: string;
  departure: string;
  adults: number;
  childrenAgeList: number[];
  index?: string;
  allocatedChildren: number;
  allocatedAdults: number;
  allocatedExtraChildren: number;
  allocatedExtraAdults: number;
  allocatedPets: number;
  roomProductSalesPlan: RoomProductSalesPlanDto;
  amenityPricingList: AmenityPricingDto[];
  roomProduct: RoomProductDto;
  averageDailyRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  cityTaxAmount: number;
  payOnConfirmationAmount: number;
  payAtHotelAmount: number;
  totalSellingRate: number;
  totalSellingRateBySetting: number;
  adrSubTotal: number;
  adrSubTotalBySetting: number;
  accommodationTaxAmount: number;
  accommodationTaxList: TaxDto[];
  extraServiceTaxAmount: number;
  extraServiceTaxList: TaxDto[];
  totalAccommodationAmount: number;
  totalAccommodationAmountBySetting: number;
  averageAccommodationAmount: number;
  hotelPaymentTerm: HotelPaymentTermDto;
  hotelCxlPolicy: HotelCancellationPolicyDto;
  calculatedCityTax?: CalculatedCityTaxDto;
  totalBaseAmountBeforeAdjustment?: number;
  totalGrossAmountBeforeAdjustment?: number;
  adjustmentPercentage?: number;
  shouldShowStrikeThrough?: boolean;
  taxDetailsMap: Record<string, any>;
  taxAccommodationDetailsMap: Record<string, any>;
  dailyRoomRateList?: DailyRoomRateDto[];
}

export interface HotelAmenityPricingDailyDto {
  date: string;
  price: number;
  count: number;
}

export interface ReservationAmenityPricingDateDto {
  date: string;
  count: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
}

export interface ReservationAmenityComboItemPricingDto {
  masterHotelAmenityId: string;
  hotelAmenity: HotelAmenity;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
}
