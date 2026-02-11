import { Injectable } from '@nestjs/common';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { HotelCityTaxAgeGroup } from '@src/core/entities/hotel-entities/hotel-city-tax-age-group.entity';
import { groupByToMap } from '@src/core/utils/group-by.util';
import { DailySellingRateDto } from '@src/modules/booking/repositories/daily-selling-rate.dto';
import { differenceInDays, formatDate } from 'date-fns';
import { HotelCityTax } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { CityTaxUnitEnum, RfcAllocationSetting, RoundingModeEnum } from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import {
  CalculateCityTaxInput,
  CalculateTotalCityTaxForRangeInput,
  CalculatedCityTaxBreakdownDto
} from './calculate-city-tax.dto';

@Injectable()
export class CityTaxCalculateService {
  calculateBookingCityTax(input: {
    totalRooms: number;
    adults: number;
    childrenAgeList: number[];
    pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
    dailySellingRateList: DailySellingRateDto[];
    hotelCityTaxList: HotelCityTax[];
    hotelCityTaxAgeGroups: HotelCityTaxAgeGroup[];
  }) {
    const onceCityTaxType = [
      CityTaxUnitEnum.PERCENTAGE_ON_GROSS_AMOUNT_ROOM,
      CityTaxUnitEnum.PERCENTAGE_ON_NET_AMOUNT_ROOM,
      CityTaxUnitEnum.PER_PERSON_PER_STAY_FIXED,
      CityTaxUnitEnum.FIXED_ON_GROSS_AMOUNT_ROOM
    ];
    const countOnceCityTaxTypeMap = new Map<CityTaxUnitEnum, boolean>([
      // [CityTaxUnitEnum.PER_PERSON_PER_NIGHT, false],
      // CityTaxUnitEnum.PER_PERSON_PER_STAY_PERCENTAGE,
    ]);
    const {
      dailySellingRateList,
      hotelCityTaxList,
      adults,
      childrenAgeList,
      pricingDecimalRoundingRule,
      totalRooms,
      hotelCityTaxAgeGroups
    } = input;

    let totalCityTaxAmount = 0;
    let totalCityTaxAmountBeforeAdjustment = 0;
    const cityTaxBreakdown: CalculatedCityTaxBreakdownDto[] = [];

    for (const dailySellingRate of dailySellingRateList) {
      const appliedCityTaxList = this.getHotelCityTaxInRange(
        hotelCityTaxList,
        dailySellingRate.date,
        dailySellingRate.date
      );

      const uniqueCityTaxList: HotelCityTax[] = [];

      for (const cityTax of appliedCityTaxList) {
        if (onceCityTaxType.includes(cityTax.unit)) {
          const hasCountOnce = countOnceCityTaxTypeMap.get(cityTax.unit);
          if (!hasCountOnce) {
            uniqueCityTaxList.push(cityTax);
            countOnceCityTaxTypeMap.set(cityTax.unit, true);
          }
        } else {
          uniqueCityTaxList.push(cityTax);
        }
      }

      if (!appliedCityTaxList.length) {
        continue;
      }

      const cityTaxBreakdowns = this.calculateAllCityTaxForRange({
        adults: adults,
        childrenAgeList: childrenAgeList,
        totalRooms: totalRooms,
        pricingDecimalRoundingRule: pricingDecimalRoundingRule,
        hotelCityTaxList: uniqueCityTaxList,
        fromDate: dailySellingRate.date,
        toDate: dailySellingRate.date,
        defaultPriceBeforeHotelTax: dailySellingRate.baseNetPrice,
        defaultPriceAfterHotelTax: dailySellingRate.baseGrossPrice,
        defaultPriceBeforeHotelTaxBeforeAdjustment:
          dailySellingRate.baseNetPrice - Number(dailySellingRate.ratePlanAdjustmentRate || 0),
        defaultPriceAfterHotelTaxBeforeAdjustment:
          dailySellingRate.baseGrossPrice - Number(dailySellingRate.ratePlanAdjustmentRate || 0),
        prices: [
          // TODO: handle price before adjustment
          {
            date: dailySellingRate.date,
            priceBeforeHotelTaxBeforeAdjustment:
              dailySellingRate.baseNetPrice - Number(dailySellingRate.ratePlanAdjustmentRate || 0),
            priceAfterHotelTaxBeforeAdjustment:
              dailySellingRate.baseGrossPrice -
              Number(dailySellingRate.ratePlanAdjustmentRate || 0),
            priceBeforeHotelTax: dailySellingRate.baseNetPrice,
            priceAfterHotelTax: dailySellingRate.baseGrossPrice
          }
        ],
        hotelCityTaxAgeGroups: hotelCityTaxAgeGroups
      });

      totalCityTaxAmount += cityTaxBreakdowns.reduce((acc, curr) => acc + curr.taxAmount, 0);
      totalCityTaxAmountBeforeAdjustment += cityTaxBreakdowns.reduce(
        (acc, curr) => acc + curr.taxAmountBeforeAdjustment,
        0
      );

      cityTaxBreakdown.push(...cityTaxBreakdowns);
    }

    return {
      totalCityTaxAmount,
      totalCityTaxAmountBeforeAdjustment,
      cityTaxBreakdown: this.accumulateUniqueCityTaxBreakdown(cityTaxBreakdown)
    };
  }

  calculateAllCityTaxForRange(input: CalculateTotalCityTaxForRangeInput) {
    const cityTaxUnitsHavingChildCount = [
      CityTaxUnitEnum.PER_PERSON_PER_NIGHT,
      CityTaxUnitEnum.PER_PERSON_PER_STAY_FIXED
      // CityTaxUnitEnum.PER_PERSON_PER_STAY_PERCENTAGE
    ];

    const cityTaxUnitsHavingPerNight = [
      CityTaxUnitEnum.PER_PERSON_PER_NIGHT,
      CityTaxUnitEnum.PER_ROOM_PER_NIGHT
    ];

    const {
      adults,
      childrenAgeList,
      totalRooms,

      hotelCityTaxList,
      hotelCityTaxAgeGroups,
      prices,
      fromDate,
      toDate,
      defaultPriceBeforeHotelTax,
      defaultPriceAfterHotelTax,
      defaultPriceBeforeHotelTaxBeforeAdjustment,
      defaultPriceAfterHotelTaxBeforeAdjustment
    } = input;
    const result: CalculatedCityTaxBreakdownDto[] = [];

    const hotelCityTaxAgeGroupsMap = groupByToMap(
      hotelCityTaxAgeGroups,
      (item) => item.hotelCityTaxId
    );

    for (const cityTax of hotelCityTaxList) {
      let finalFromDate = fromDate;
      if (
        cityTaxUnitsHavingPerNight.includes(cityTax.unit) &&
        cityTax.validFrom &&
        cityTax.validFrom > new Date(fromDate)
      ) {
        finalFromDate = formatDate(cityTax.validFrom, DATE_FORMAT);
      }

      let finalToDate = toDate;
      if (
        cityTaxUnitsHavingPerNight.includes(cityTax.unit) &&
        cityTax.validTo &&
        cityTax.validTo < new Date(toDate)
      ) {
        finalToDate = formatDate(cityTax.validTo, DATE_FORMAT);
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

      const defaultTaxRate = cityTax.value ? parseFloat(cityTax.value.toString()) : 0;
      let specificTaxAmount = 0;
      let specificTaxAmountBeforeAdjustment = 0;
      const taxAmountForAdult = this.calculateCityTax({
        unit: cityTax.unit,
        taxRate: defaultTaxRate,
        peopleCount: adults,
        nightCount: nightCount,
        totalRooms: totalRooms,
        priceBeforeHotelTax: finalPriceBeforeHotelTax,
        priceAfterHotelTax: finalPriceAfterHotelTax
      });

      const taxAmountForAdultBeforeAdjustment = this.calculateCityTax({
        unit: cityTax.unit,
        taxRate: defaultTaxRate,
        peopleCount: adults,
        nightCount: nightCount,
        totalRooms: totalRooms,
        priceBeforeHotelTax: finalPriceBeforeHotelTaxBeforeAdjustment,
        priceAfterHotelTax: finalPriceAfterHotelTaxBeforeAdjustment
      });

      specificTaxAmount += taxAmountForAdult;
      specificTaxAmountBeforeAdjustment += taxAmountForAdultBeforeAdjustment;
      if (
        childrenAgeList &&
        childrenAgeList.length > 0 &&
        cityTaxUnitsHavingChildCount.includes(cityTax.unit)
      ) {
        for (const age of childrenAgeList) {
          const hotelCityTaxAgeGroups = hotelCityTaxAgeGroupsMap.get(cityTax.id) || [];

          const ageGroup = hotelCityTaxAgeGroups.find((groupItem) => {
            const ageFrom = groupItem.fromAge;
            const ageTo = groupItem.toAge;

            if (ageFrom === null && ageTo === null) return true;

            if (ageFrom === null) {
              return ageTo >= age;
            }

            if (ageTo === null) {
              return ageFrom <= age;
            }

            return ageFrom <= age && ageTo >= age;
          });

          const taxRate = ageGroup ? ageGroup.value : defaultTaxRate;

          //   TODO: handle city tax age group
          const taxAmountForChild = this.calculateCityTax({
            unit: cityTax.unit,
            taxRate: taxRate,
            peopleCount: 1,
            nightCount: nightCount,
            totalRooms: totalRooms,
            priceBeforeHotelTax: finalPriceBeforeHotelTax,
            priceAfterHotelTax: finalPriceAfterHotelTax
          });

          const taxAmountForChildBeforeAdjustment = this.calculateCityTax({
            unit: cityTax.unit,
            taxRate: taxRate,
            peopleCount: adults,
            nightCount: nightCount,
            totalRooms: totalRooms,
            priceBeforeHotelTax: finalPriceBeforeHotelTaxBeforeAdjustment,
            priceAfterHotelTax: finalPriceAfterHotelTaxBeforeAdjustment
          });

          specificTaxAmount += taxAmountForChild;
          specificTaxAmountBeforeAdjustment += taxAmountForChildBeforeAdjustment;
        }
      }

      result.push({
        ...cityTax,
        taxAmount: specificTaxAmount,
        taxAmountBeforeAdjustment: specificTaxAmountBeforeAdjustment
      });
    }

    return result;
  }

  calculateCityTax(input: CalculateCityTaxInput) {
    const {
      unit,
      taxRate,
      peopleCount,
      nightCount,
      totalRooms,
      priceBeforeHotelTax,
      priceAfterHotelTax
    } = input;
    const finalPeopleCount = peopleCount || 1;
    const finalNightCount = nightCount || 1;

    let taxAmount = 0;

    switch (unit) {
      case CityTaxUnitEnum.FIXED_ON_GROSS_AMOUNT_ROOM:
        taxAmount = totalRooms * taxRate;
        break;
      case CityTaxUnitEnum.PERCENTAGE_ON_GROSS_AMOUNT_ROOM:
        if (!priceAfterHotelTax) {
          const rate = DecimalRoundingHelper.conditionalRounding(
            taxRate / 100,
            RoundingModeEnum.HALF_ROUND_UP,
            4
          );
          taxAmount = priceAfterHotelTax * rate;
        }
        break;
      case CityTaxUnitEnum.PERCENTAGE_ON_NET_AMOUNT_ROOM:
        if (!priceAfterHotelTax) {
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

    return taxAmount;
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
