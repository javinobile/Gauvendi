import { Injectable } from '@nestjs/common';
import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { formatDateString } from '@src/core/utils/datetime.util';
import { differenceInDays } from 'date-fns';
import { HotelCityTax } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { CityTaxUnitEnum, RfcAllocationSetting, RoundingModeEnum } from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';

export type CalculateCityTaxInput = {
  unit: CityTaxUnitEnum;
  taxRate: number;
  peopleCount: number;
  nightCount: number;
  totalRooms: number;
  priceBeforeHotelTax: number;
  priceAfterHotelTax: number;
  pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
};

export type CalculateCityTaxForReservationInput = {
  hotelId: string;
  adults: number;
  childrenAgeList: number[];
  totalRooms: number;
  pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
  hotelCityTaxList: HotelCityTax[];
};

export type CalculateTotalCityTaxForRangeInput = {
  adults: number;
  childrenAgeList: number[];
  totalRooms: number;
  pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
  hotelCityTaxList: HotelCityTax[];
  fromDate: string;
  toDate: string;
  defaultPriceBeforeHotelTax: number;
  defaultPriceAfterHotelTax: number;
  defaultPriceBeforeHotelTaxBeforeAdjustment: number;
  defaultPriceAfterHotelTaxBeforeAdjustment: number;
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

@Injectable()
export class BookingCityTaxCalculateService {
  private calculateAllCityTaxForRange(input: CalculateTotalCityTaxForRangeInput) {
    const cityTaxUnitsHavingChildCount = [
      CityTaxUnitEnum.PER_PERSON_PER_NIGHT,
      CityTaxUnitEnum.PER_PERSON_PER_STAY_FIXED
      // CityTaxUnitEnum.PER_PERSON_PER_STAY_PERCENTAGE
    ];

    const {
      adults,
      childrenAgeList,
      totalRooms,
      pricingDecimalRoundingRule,
      hotelCityTaxList,
      prices,
      fromDate,
      toDate,
      defaultPriceBeforeHotelTax,
      defaultPriceAfterHotelTax,
      defaultPriceBeforeHotelTaxBeforeAdjustment,
      defaultPriceAfterHotelTaxBeforeAdjustment
    } = input;
    const result: CalculatedCityTaxBreakdownDto[] = [];

    for (const cityTax of hotelCityTaxList) {
      let finalFromDate = fromDate;
      if (
        cityTax.unit === CityTaxUnitEnum.PER_PERSON_PER_NIGHT &&
        cityTax.validFrom &&
        cityTax.validFrom > new Date(fromDate)
      ) {
        finalFromDate = formatDateString(cityTax.validFrom);
      }

      let finalToDate = toDate;
      if (
        cityTax.unit === CityTaxUnitEnum.PER_PERSON_PER_NIGHT &&
        cityTax.validTo &&
        cityTax.validTo < new Date(toDate)
      ) {
        finalToDate = formatDateString(cityTax.validTo);
      }

      const nightCount = differenceInDays(new Date(finalToDate), new Date(finalFromDate));

      const finalPriceBeforeHotelTax =
        prices.find((price) => price.date === finalFromDate)?.priceBeforeHotelTax ||
        defaultPriceBeforeHotelTax;

      const finalPriceAfterHotelTax =
        prices.find((price) => price.date === finalFromDate)?.priceAfterHotelTax ||
        defaultPriceAfterHotelTax;

      const finalPriceBeforeHotelTaxBeforeAdjustment =
        prices.find((price) => price.date === finalFromDate)?.priceBeforeHotelTaxBeforeAdjustment ||
        defaultPriceBeforeHotelTaxBeforeAdjustment;

      const finalPriceAfterHotelTaxBeforeAdjustment =
        prices.find((price) => price.date === finalFromDate)?.priceAfterHotelTaxBeforeAdjustment ||
        defaultPriceAfterHotelTaxBeforeAdjustment;

      const defaultTaxRate = cityTax.value ? parseFloat(`${cityTax.value}`) : 0;
      let specificTaxAmount = 0;
      let specificTaxAmountBeforeAdjustment = 0;
      const taxAmountForAdult = this.calculateCityTax({
        unit: cityTax.unit,
        taxRate: defaultTaxRate,
        peopleCount: adults,
        nightCount: nightCount,
        totalRooms: totalRooms,
        priceBeforeHotelTax: finalPriceBeforeHotelTax,
        priceAfterHotelTax: finalPriceAfterHotelTax,
        pricingDecimalRoundingRule: pricingDecimalRoundingRule
      });

      const taxAmountForAdultBeforeAdjustment = this.calculateCityTax({
        unit: cityTax.unit,
        taxRate: defaultTaxRate,
        peopleCount: adults,
        nightCount: nightCount,
        totalRooms: totalRooms,
        priceBeforeHotelTax: finalPriceBeforeHotelTaxBeforeAdjustment,
        priceAfterHotelTax: finalPriceAfterHotelTaxBeforeAdjustment,
        pricingDecimalRoundingRule: pricingDecimalRoundingRule
      });

      specificTaxAmount += taxAmountForAdult;
      specificTaxAmountBeforeAdjustment += taxAmountForAdultBeforeAdjustment;
      if (
        childrenAgeList &&
        childrenAgeList.length > 0 &&
        cityTaxUnitsHavingChildCount.includes(cityTax.unit)
      ) {
        for (const age of childrenAgeList) {
          //   TODO: handle city tax age group
          const taxAmountForChild = this.calculateCityTax({
            unit: cityTax.unit,
            taxRate: defaultTaxRate,
            peopleCount: 1,
            nightCount: nightCount,
            totalRooms: totalRooms,
            priceBeforeHotelTax: finalPriceBeforeHotelTax,
            priceAfterHotelTax: finalPriceAfterHotelTax,
            pricingDecimalRoundingRule: pricingDecimalRoundingRule
          });

          const taxAmountForChildBeforeAdjustment = this.calculateCityTax({
            unit: cityTax.unit,
            taxRate: defaultTaxRate,
            peopleCount: adults,
            nightCount: nightCount,
            totalRooms: totalRooms,
            priceBeforeHotelTax: finalPriceBeforeHotelTaxBeforeAdjustment,
            priceAfterHotelTax: finalPriceAfterHotelTaxBeforeAdjustment,
            pricingDecimalRoundingRule: pricingDecimalRoundingRule
          });

          specificTaxAmount += taxAmountForChild;
          specificTaxAmountBeforeAdjustment += taxAmountForChildBeforeAdjustment;
        }
      }

      result.push({
        ...cityTax,
        taxAmount: DecimalRoundingHelper.conditionalRounding(
          specificTaxAmount,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        ),
        taxAmountBeforeAdjustment: DecimalRoundingHelper.conditionalRounding(
          specificTaxAmountBeforeAdjustment,
          pricingDecimalRoundingRule.roundingMode,
          pricingDecimalRoundingRule.decimalUnits
        )
      });
    }

    return result;
  }

  private calculateCityTax(input: CalculateCityTaxInput) {
    const {
      unit,
      taxRate,
      peopleCount,
      nightCount,
      totalRooms,
      priceBeforeHotelTax,
      priceAfterHotelTax,
      pricingDecimalRoundingRule
    } = input;
    const finalPeopleCount = peopleCount || 1;
    const finalNightCount = nightCount || 1;

    let taxAmount = 0;

    switch (unit) {
      case CityTaxUnitEnum.FIXED_ON_GROSS_AMOUNT_ROOM:
        taxAmount = totalRooms * taxRate;
        break;
      case CityTaxUnitEnum.PERCENTAGE_ON_GROSS_AMOUNT_ROOM:
        if (priceAfterHotelTax) {
          const rate = DecimalRoundingHelper.conditionalRounding(
            taxRate / 100,
            RoundingModeEnum.HALF_ROUND_UP,
            4
          );
          taxAmount = priceAfterHotelTax * rate;
        }
        break;
      case CityTaxUnitEnum.PERCENTAGE_ON_NET_AMOUNT_ROOM:
        if (priceBeforeHotelTax) {
          const rate = DecimalRoundingHelper.conditionalRounding(
            taxRate / 100,
            RoundingModeEnum.HALF_ROUND_UP,
            4
          );
          taxAmount = priceBeforeHotelTax * rate;
        }
        break;
      case CityTaxUnitEnum.PER_PERSON_PER_NIGHT:
        taxAmount = finalPeopleCount * finalNightCount * taxRate;
        break;

      case CityTaxUnitEnum.PER_PERSON_PER_STAY_FIXED: // Per person per stay (Fixed amount)
        taxAmount = finalPeopleCount * taxRate;
        break;
      case CityTaxUnitEnum.PER_ROOM_PER_NIGHT: // Per room per night (Fixed amount)
        taxAmount = totalRooms * finalNightCount * taxRate;
        break;

      // TODO: handle PER_PERSON_PER_STAY_PERCENTAGE unit
      // case CityTaxUnitEnum.PER_PERSON_PER_STAY_PERCENTAGE: // Per person per stay (Percentage amount)
      // taxAmount = finalPeopleCount  * taxRate;
      // break;
    }

    return DecimalRoundingHelper.conditionalRounding(
      taxAmount,
      pricingDecimalRoundingRule.roundingMode,
      pricingDecimalRoundingRule.decimalUnits
    );
  }

  getTotalRoom(roomProductAllocationSetting: RfcAllocationSetting, roomSize: number) {
    if (roomProductAllocationSetting === RfcAllocationSetting.ALL) {
      return roomSize;
    }
    return 1;
  }

  getHotelCityTaxInRange(hotelCityTaxList: HotelCityTax[], fromDate: string, toDate: string) {
    return hotelCityTaxList.filter((cityTax) => {
      const validFrom = cityTax.validFrom;
      const validTo = cityTax.validTo;
      const isPerNightUnit = cityTax.unit === CityTaxUnitEnum.PER_PERSON_PER_NIGHT;

      // Nếu cả validFrom và validTo đều null, trả về true
      if (!validFrom && !validTo) {
        return true;
      }

      // Nếu validFrom null, kiểm tra validTo >= fromDate
      if (!validFrom) {
        return validTo && validTo >= new Date(fromDate);
      }

      // Kiểm tra validFrom <= (isPerNightUnit ? toDate : fromDate)
      const isFromValid = validFrom <= (isPerNightUnit ? new Date(toDate) : new Date(fromDate));

      // Nếu validTo null, trả về kết quả isFromValid
      if (!validTo) {
        return isFromValid;
      }

      // Trả về kết quả kết hợp: isFromValid && validTo >= fromDate
      return isFromValid && validTo >= new Date(fromDate);
    });
  }

  accumulateUniqueCityTaxBreakdown(
    calculatedCityTaxList: CalculatedCityTaxBreakdownDto[]
  ): CalculatedCityTaxBreakdownDto[] {
    // Tạo Map để gộp các breakdown theo code (tương đương Collectors.toMap)
    const breakdownMap = new Map<string, CalculatedCityTaxBreakdownDto>();

    calculatedCityTaxList.forEach((breakdown) => {
      const code = breakdown.code;

      if (!code) {
        return; // Bỏ qua nếu không có code
      }

      if (breakdownMap.has(code)) {
        // Nếu đã tồn tại, cộng dồn amount (tương đương merge function trong Java)
        const existing = breakdownMap.get(code)!;
        existing.taxAmount = (existing.taxAmount || 0) + (breakdown.taxAmount || 0);
        existing.taxAmountBeforeAdjustment =
          (existing.taxAmountBeforeAdjustment || 0) + (breakdown.taxAmountBeforeAdjustment || 0);
      } else {
        // Nếu chưa tồn tại, thêm mới (tương đương Function.identity())
        breakdownMap.set(code, { ...breakdown });
      }
    });

    // Chuyển đổi Map values thành Array (tương đương .values() trong Java)
    return Array.from(breakdownMap.values());
  }
}
