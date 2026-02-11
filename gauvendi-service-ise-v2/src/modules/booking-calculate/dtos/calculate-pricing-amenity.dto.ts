import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RoundingModeEnum } from 'src/core/enums/common';

export interface CalculatePricingAmenityPayload {
  input: CalculatePricingAmenityInput;
  hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
}

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

export interface CalculatePricingAmenityPayload {
  input: CalculatePricingAmenityInput;
  hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
}
