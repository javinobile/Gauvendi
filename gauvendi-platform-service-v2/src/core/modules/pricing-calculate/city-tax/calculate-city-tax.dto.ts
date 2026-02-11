import { HotelPricingDecimalRoundingRuleDto } from "@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto";
import { HotelCityTaxAgeGroup } from "@src/core/entities/hotel-entities/hotel-city-tax-age-group.entity";
import { HotelCityTax } from "@src/core/entities/hotel-entities/hotel-city-tax.entity";
import { CityTaxUnitEnum } from "@src/core/enums/common";

export type CalculateCityTaxInput = {
  unit: CityTaxUnitEnum;
  taxRate: number;
  peopleCount: number;
  nightCount: number;
  totalRooms: number;
  priceBeforeHotelTax: number;
  priceAfterHotelTax: number;
  pricingDecimalRoundingRule?: HotelPricingDecimalRoundingRuleDto;
};

export type CalculateTotalCityTaxForRangeInput = {
  adults: number;
  childrenAgeList: number[];
  totalRooms: number;
  hotelCityTaxList: HotelCityTax[];
  fromDate: string;
  toDate: string;
  hotelCityTaxAgeGroups: HotelCityTaxAgeGroup[];
  defaultPriceBeforeHotelTax: number;
  defaultPriceAfterHotelTax: number;
  defaultPriceBeforeHotelTaxBeforeAdjustment: number;
  defaultPriceAfterHotelTaxBeforeAdjustment: number;
  pricingDecimalRoundingRule?: HotelPricingDecimalRoundingRuleDto;
  prices: {
    date: string;
    priceBeforeHotelTaxBeforeAdjustment: number;
    priceAfterHotelTaxBeforeAdjustment: number;
    priceBeforeHotelTax: number;
    priceAfterHotelTax: number;
  }[];
};

export type CalculatedCityTaxBreakdownDto = HotelCityTax & {
  taxAmount: number;
  taxAmountBeforeAdjustment: number;
};
