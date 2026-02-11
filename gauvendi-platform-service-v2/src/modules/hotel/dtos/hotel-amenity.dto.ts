import { HotelTaxSetting } from '@entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { HotelAgeCategory } from 'src/core/entities/hotel-entities/hotel-age-category.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { AmenityAvailabilityEnum, AmenityStatusEnum, AmenityTypeEnum, PricingUnitEnum } from 'src/core/enums/common';

export interface AmenityDayDetail {
  date: string;
  included: Partial<HotelAmenity>[];
  extrasTotal: number;
}

export interface CalculatePricingAmenityResult {
  days: AmenityDayDetail[];
  totals: {
    includedTotal: number;
    extrasTotal: number;
    grandTotal: number;
  };
}

export interface CalculatePricingAmenityInput {
  hotel: Hotel;
  serviceChargeRate?: number; // e.g. 0.1
  serviceChargeTaxRate?: number; // e.g. 0.05 (tax rate applied to service charge)
  hotelAmenity: HotelAmenity;
  fromDate: string; // inclusive yyyy-mm-dd
  toDate: string; // inclusive yyyy-mm-dd
  includedDates?: string[];
  taxSettingList?: HotelTaxSetting[];
  childrenAgeList?: number[]; // list ages
  adult?: number;
  allocatedPets?: number | null;
}

export interface CppExtraServiceDto {
  id: string;
  name: string;
  code: string;
  description: string;
  status: AmenityStatusEnum;
  amenityType: AmenityTypeEnum;
  pricingUnit: PricingUnitEnum;
  availability: AmenityAvailabilityEnum;
  postNextDay: boolean;
  iconImageUrl: string;
  totalSellingRate: number;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  mappingHotelAmenityCode: string;
  hotelAmenityPriceList: HotelAmenityPriceDto[];
  productList: CppExtraServiceProductDto[];
}

export interface HotelAmenityPriceDto {
  id: string;
  hotelAmenityId: string;
  hotelAgeCategoryId: string;
  hotelAgeCategory: HotelAgeCategory;
  price: number;
}

export interface CppExtraServiceProductDto {
  salesPlanId: string;
  roomProductId: string;
  arrival: string; // yyyy-MM-dd format
  departure: string; // yyyy-MM-dd format
  isInclude: boolean;
  isMandatory: boolean;
}


export class HotelAmenityDto {

  ids?: string[];
  hotelId?: string;
  code?: string;
  status?: string;
  codes?: string[];
  relations?: string[];
}