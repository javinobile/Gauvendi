import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { HotelAmenityPrice } from '@src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { RoundingModeEnum } from '@src/core/enums/common';

export type CalculateAmenityPricingInput = {
  fromDate: string; // inclusive yyyy-mm-dd
  toDate: string; // inclusive yyyy-mm-dd
  adults: number;
  childrenAges: number[];
  pets: number;
  hotel: Hotel;
  hotelAmenity: HotelAmenity;
  taxSettings: HotelTaxSetting[];
  hotelAmenityPrices: HotelAmenityPrice[];
  count: number;
  hotelConfigRoundingMode: { roundingMode: RoundingModeEnum; decimalPlaces: number };
};

export interface CalculateAmenityPriceInput {
  hotel: Hotel;
  hotelAmenityWithCounts: (HotelAmenity & { count: number })[];
  taxSettings: HotelTaxSetting[];
  hotelAmenityPrices: HotelAmenityPrice[];
  fromDate: string;
  toDate: string;
  adult: number;
  childrenAges: number[];
  pets: number;
  
  serviceChargeTaxRate?: number;//0
  serviceChargeRate?: number; //0
  hotelConfigRoundingMode: HotelPricingDecimalRoundingRuleDto;
  
}
