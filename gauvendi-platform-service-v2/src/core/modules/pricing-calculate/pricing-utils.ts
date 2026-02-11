import { HotelTaxSetting } from '@src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { RatePlanAdjustmentType, RoundingMode, RoundingModeEnum } from '@src/core/enums/common';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { TaxInclusiveUtils } from '@src/core/utils/tax-inclusive.utils';
import Decimal from 'decimal.js';
import { GetDailyOrDefaultRatePlanAdjustmentResult } from './rate-plan-adjustment/rate-plan-adjustment.service';
import { ApaleoReservationDto } from '@src/modules/pms/apaleo/apaleo.dto';
import { Helper } from '@src/core/helper/utils';

export abstract class PricingUtils {
  static calculateHotelTax(input: {
    date: string;
    basePrice: number;
    pricingMethodAdjustmentRate: number;
    ratePlanAdjustmentRate: number;
    ratePlanId: string;
    hotelId: string;
    roomProductId: string;
    accommodationTaxes: HotelTaxSetting[];
    roundingMode: RoundingModeEnum;
  }) {
    const {
      date,
      basePrice,
      roomProductId,
      ratePlanId,
      hotelId,
      accommodationTaxes,
      roundingMode,
      ratePlanAdjustmentRate,
      pricingMethodAdjustmentRate
    } = input;

    const accommodationRate = basePrice + ratePlanAdjustmentRate + pricingMethodAdjustmentRate;

    // Apply rounding to accommodation rate if needed
    const roundedAccommodationRate = DecimalRoundingHelper.conditionalRounding(
      accommodationRate,
      roundingMode,
      0
    );

    const calculateResult = TaxInclusiveUtils.calculateWithMultipleTaxRates(
      new Decimal(roundedAccommodationRate),
      0, // service charge rate
      0, // service charge tax rate
      accommodationTaxes.map((tax) => ({
        code: tax.hotelTax?.code || '',
        rate: tax.hotelTax?.rate || 0
      })),
      4,
      RoundingMode[roundingMode]
    );

    const grossPrice = Number(calculateResult.grossAmount);
    const totalTaxAmount = Number(calculateResult.totalTaxAmount);

    const netPrice = grossPrice - totalTaxAmount;

    return {
      date,
      roomProductId,
      ratePlanId,
      hotelId,
      adjustmentRate: ratePlanAdjustmentRate,
      featureBasedRate: basePrice,
      accommodationRate: roundedAccommodationRate,
      netPrice,
      grossPrice,
      totalTaxAmount
    };
  }

  static calculateRatePlanAdjustmentReversed(input: {
    targetPrice: number; // feature based price + adjustment rate
    pricingMethodAdjustmentValue?: number;
    pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';

    ratePlanAdjustment: GetDailyOrDefaultRatePlanAdjustmentResult | undefined;
  }) {
    const {
      targetPrice,
      ratePlanAdjustment,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit
    } = input;
    let adjustmentRate = 0;
    if (ratePlanAdjustment?.adjustmentType === RatePlanAdjustmentType.FIXED) {
      adjustmentRate = Number(ratePlanAdjustment.adjustmentValue);
    } else {
      const rate = Number(ratePlanAdjustment?.adjustmentValue || 0) / 100;
      adjustmentRate = targetPrice - targetPrice / (1 + rate);
    }

    const basePrice = targetPrice - adjustmentRate;
    const pricingMethodAdjustmentRate = PricingUtils.calculateAdjustment({
      basePrice,
      adjustmentValue: pricingMethodAdjustmentValue,
      adjustmentUnit: pricingMethodAdjustmentUnit
    });

    const ratePlanAdjustmentRate = PricingUtils.calculateAdjustment({
      basePrice: pricingMethodAdjustmentRate + basePrice,
      adjustmentValue: ratePlanAdjustment?.adjustmentValue,
      adjustmentUnit: ratePlanAdjustment?.adjustmentType
    });

    return {
      ratePlanAdjustmentRate: ratePlanAdjustmentRate,
      pricingMethodAdjustmentRate: pricingMethodAdjustmentRate,
      basePrice: basePrice
    };
  }

  static calculateRatePlanAdjustment(input: {
    basePrice: number;
    pricingMethodAdjustmentValue?: number;
    pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';

    ratePlanAdjustment: GetDailyOrDefaultRatePlanAdjustmentResult | undefined;
  }) {
    const {
      basePrice,
      ratePlanAdjustment,
      pricingMethodAdjustmentValue,
      pricingMethodAdjustmentUnit
    } = input;

    let pricingMethodAdjustmentRate = PricingUtils.calculateAdjustment({
      basePrice,
      adjustmentValue: pricingMethodAdjustmentValue,
      adjustmentUnit: pricingMethodAdjustmentUnit
    });

    let ratePlanAdjustmentRate = PricingUtils.calculateAdjustment({
      basePrice: pricingMethodAdjustmentRate + basePrice,
      adjustmentValue: ratePlanAdjustment?.adjustmentValue,
      adjustmentUnit: ratePlanAdjustment?.adjustmentType
    });

    return {
      ratePlanAdjustmentRate: ratePlanAdjustmentRate,
      pricingMethodAdjustmentRate: pricingMethodAdjustmentRate,
      basePrice: basePrice
    };
  }

  static calculateAdjustment(input: {
    basePrice: number;
    adjustmentValue?: number;
    adjustmentUnit?: 'FIXED' | 'PERCENTAGE';
  }) {
    const { basePrice, adjustmentValue = 0, adjustmentUnit = 'FIXED' } = input;

    let adjustmentRate = 0;
    if (adjustmentUnit === RatePlanAdjustmentType.FIXED) {
      adjustmentRate = Number(adjustmentValue);
    } else {
      adjustmentRate = basePrice * (Number(adjustmentValue || 0) / 100);
    }
    return adjustmentRate;
  }

  static calculateApaleoReservationPricing(input: ApaleoReservationDto) {
    let pmsGrossAmount = input.totalGrossAmount?.amount || 0;

    const totalTaxAmount = input.taxDetails?.reduce((acc, curr) => acc + (curr.tax.amount || 0), 0);
    const totalNetAmount = pmsGrossAmount - (totalTaxAmount || 0);
    const cityTaxAmount = input.hasCityTax ? Helper.calculateCityTaxAmount(input.cityTaxCharges) : 0;

    const totalGrossAmount = pmsGrossAmount + (cityTaxAmount || 0); // in GV system, city tax is included in the total gross amount
    return { totalNetAmount, totalGrossAmount, cityTaxAmount };
  }
}
