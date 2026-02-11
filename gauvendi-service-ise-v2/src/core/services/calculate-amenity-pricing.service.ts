import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  HotelAmenity,
  PricingUnitEnum
} from '../entities/hotel-entities/hotel-amenity.entity';
import { ServiceChargeSettingEnum, TaxSettingEnum } from '../entities/hotel-entities/hotel.entity';
import { RoundingModeEnum } from '../entities/pricing-entities/rate-plan.entity';

export interface CalculatePricingAmenityInput {
  hotel: {
    taxSetting: TaxSettingEnum;
    serviceChargeSetting: ServiceChargeSettingEnum;
    roundingMode: RoundingModeEnum;
    decimalPlaces: number;
  };
  hotelAmenity: HotelAmenity & {
    taxSettingList?: any[];
    count?: number;
  };
  fromDate: string;
  toDate: string;
  adult: number;
  childrenAgeList: number[];
  allocatedPets?: number;
  serviceChargeRate?: number;
  serviceChargeTaxRate?: number;
}

export interface TaxCalculationResult {
  totalBaseAmount: Decimal;
  totalBaseAmountBeforeAdjustment: Decimal;
  taxAmount: Decimal;
  taxAmountBeforeAdjustment: Decimal;
  serviceChargeAmount: Decimal;
  serviceChargeAmountBeforeAdjustment: Decimal;
  totalSellingRate: Decimal;
  totalGrossAmount: Decimal;
  totalGrossAmountBeforeAdjustment: Decimal;
}

@Injectable()
export class CalculateAmenityPricingService {
  private readonly logger = new Logger(CalculateAmenityPricingService.name);

  /**
   * Calculate tax and service charges based on hotel settings (inclusive/exclusive)
   */
  calculateTaxAndServiceCharges(
    amenity: HotelAmenity,
    totalSellingRate: Decimal,
    totalSellingRateBeforeAdjustment: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxSettingList: any[],
    fromDate: string,
    toDate: string,
    taxSetting: TaxSettingEnum,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    taxDetailsMap: Record<string, Decimal>
  ): TaxCalculationResult {
    if (taxSetting === TaxSettingEnum.INCLUSIVE) {
      return this.calculateInclusiveTax(
        amenity,
        totalSellingRate,
        totalSellingRateBeforeAdjustment,
        serviceChargeRate,
        serviceChargeTaxRate,
        taxSettingList,
        fromDate,
        toDate,
        decimalUnits,
        roundingMode,
        taxDetailsMap
      );
    } else {
      return this.calculateExclusiveTax(
        amenity,
        totalSellingRate,
        totalSellingRateBeforeAdjustment,
        serviceChargeRate,
        serviceChargeTaxRate,
        taxSettingList,
        fromDate,
        toDate,
        decimalUnits,
        roundingMode,
        taxDetailsMap
      );
    }
  }

  /**
   * Calculate inclusive tax (tax is included in the gross amount)
   * In inclusive mode: totalSellingRate IS the gross amount (includes base + service charge + tax)
   */
  private calculateInclusiveTax(
    amenity: HotelAmenity,
    totalSellingRate: Decimal, // This is gross amount in inclusive mode
    totalSellingRateBeforeAdjustment: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxSettingList: any[],
    fromDate: string,
    toDate: string,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    taxDetailsMap: Record<string, Decimal>
  ): TaxCalculationResult {
    const totalGrossAmount = totalSellingRate; // Selling rate = gross amount in inclusive mode
    const totalGrossAmountBeforeAdjustment = totalSellingRateBeforeAdjustment;

    // Split amounts across dates for daily tax calculation
    const grossDays = this.splitAcrossDates(
      fromDate,
      toDate,
      totalGrossAmount,
      decimalUnits,
      roundingMode
    );
    const grossDaysBefore = this.splitAcrossDates(
      fromDate,
      toDate,
      totalGrossAmountBeforeAdjustment,
      decimalUnits,
      roundingMode
    );

    let totalBaseAmount = new Decimal(0);
    let totalBaseAmountBeforeAdjustment = new Decimal(0);

    for (let i = 0; i < grossDays.length; i++) {
      const grossAmount = grossDays[i];
      const grossAmountBefore = grossDaysBefore[i];

      const appliedTaxList = this.getApplicableTaxes(taxSettingList, amenity.code, fromDate, i);
      const taxRate = appliedTaxList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);

      const baseAmount = this.calculateBaseAmountFromInclusive(
        grossAmount,
        serviceChargeRate,
        taxRate,
        serviceChargeTaxRate,
        decimalUnits,
        roundingMode
      );
      const baseAmountBefore = this.calculateBaseAmountFromInclusive(
        grossAmountBefore,
        serviceChargeRate,
        taxRate,
        serviceChargeTaxRate,
        decimalUnits,
        roundingMode
      );

      totalBaseAmount = totalBaseAmount.plus(baseAmount);
      totalBaseAmountBeforeAdjustment = totalBaseAmountBeforeAdjustment.plus(baseAmountBefore);

      // Calculate tax breakdown for this day
      const serviceCharge = this.calculateServiceCharge(
        baseAmount,
        serviceChargeRate,
        decimalUnits,
        roundingMode
      );
      const taxAmount = this.calculateTaxInclusiveForDay(
        grossAmount,
        serviceCharge,
        baseAmount,
        decimalUnits,
        roundingMode
      );

      this.distributeTaxAmountByCode(appliedTaxList, taxAmount, taxDetailsMap);
    }

    const taxAmount = this.calculateTaxInclusiveForTotals(
      totalGrossAmount,
      serviceChargeRate,
      totalBaseAmount,
      decimalUnits,
      roundingMode,
      serviceChargeTaxRate
    );
    const taxAmountBeforeAdjustment = this.calculateTaxInclusiveForTotals(
      totalGrossAmountBeforeAdjustment,
      serviceChargeRate,
      totalBaseAmountBeforeAdjustment,
      decimalUnits,
      roundingMode,
      serviceChargeTaxRate
    );

    const serviceChargeAmount = this.calculateServiceCharge(
      totalBaseAmount,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );
    const serviceChargeAmountBeforeAdjustment = this.calculateServiceCharge(
      totalBaseAmountBeforeAdjustment,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );

    return {
      totalBaseAmount,
      totalBaseAmountBeforeAdjustment,
      taxAmount,
      taxAmountBeforeAdjustment,
      serviceChargeAmount,
      serviceChargeAmountBeforeAdjustment,
      totalSellingRate,
      totalGrossAmount,
      totalGrossAmountBeforeAdjustment
    };
  }

  /**
   * Calculate exclusive tax (tax is added to the base amount)
   * In exclusive mode: totalSellingRate IS the base amount (before tax and service charges)
   */
  private calculateExclusiveTax(
    amenity: HotelAmenity,
    totalSellingRate: Decimal, // This is base amount in exclusive mode
    totalSellingRateBeforeAdjustment: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxSettingList: any[],
    fromDate: string,
    toDate: string,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    taxDetailsMap: Record<string, Decimal>
  ): TaxCalculationResult {
    const totalBaseAmount = totalSellingRate; // Selling rate = base amount in exclusive mode
    const totalBaseAmountBeforeAdjustment = totalSellingRateBeforeAdjustment;

    const serviceChargeAmount = this.calculateServiceCharge(
      totalBaseAmount,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );
    const serviceChargeAmountBeforeAdjustment = this.calculateServiceCharge(
      totalBaseAmountBeforeAdjustment,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );

    // Split base amounts across dates for daily tax calculation
    const baseDays = this.splitAcrossDates(
      fromDate,
      toDate,
      totalBaseAmount,
      decimalUnits,
      roundingMode
    );
    const baseDaysBefore = this.splitAcrossDates(
      fromDate,
      toDate,
      totalBaseAmountBeforeAdjustment,
      decimalUnits,
      roundingMode
    );

    let taxAmount = new Decimal(0);
    let taxAmountBeforeAdjustment = new Decimal(0);

    for (let i = 0; i < baseDays.length; i++) {
      const baseAmount = baseDays[i];
      const baseAmountBefore = baseDaysBefore[i];

      const appliedTaxList = this.getApplicableTaxes(taxSettingList, amenity.code, fromDate, i);

      const taxAmountByCode = this.calculateTaxAmountExclusiveProperty(
        appliedTaxList,
        baseAmount,
        serviceChargeRate,
        serviceChargeTaxRate,
        decimalUnits,
        roundingMode
      );
      const taxAmountBeforeByCode = this.calculateTaxAmountExclusiveProperty(
        appliedTaxList,
        baseAmountBefore,
        serviceChargeRate,
        serviceChargeTaxRate,
        decimalUnits,
        roundingMode
      );

      const dailyTaxAmount = Object.values(taxAmountByCode).reduce(
        (sum, amt) => sum.plus(amt),
        new Decimal(0)
      );
      const dailyTaxAmountBefore = Object.values(taxAmountBeforeByCode).reduce(
        (sum, amt) => sum.plus(amt),
        new Decimal(0)
      );

      taxAmount = taxAmount.plus(dailyTaxAmount);
      taxAmountBeforeAdjustment = taxAmountBeforeAdjustment.plus(dailyTaxAmountBefore);

      // Add to tax details map
      for (const [taxCode, amount] of Object.entries(taxAmountByCode)) {
        taxDetailsMap[taxCode] = (taxDetailsMap[taxCode] ?? new Decimal(0)).plus(amount);
      }
    }

    const totalGrossAmount = this.calculateGrossExclusive(
      totalBaseAmount,
      serviceChargeAmount,
      taxAmount,
      decimalUnits,
      roundingMode
    );
    const totalGrossAmountBeforeAdjustment = this.calculateGrossExclusive(
      totalBaseAmountBeforeAdjustment,
      serviceChargeAmountBeforeAdjustment,
      taxAmountBeforeAdjustment,
      decimalUnits,
      roundingMode
    );

    return {
      totalBaseAmount,
      totalBaseAmountBeforeAdjustment,
      taxAmount,
      taxAmountBeforeAdjustment,
      serviceChargeAmount,
      serviceChargeAmountBeforeAdjustment,
      totalSellingRate,
      totalGrossAmount,
      totalGrossAmountBeforeAdjustment
    };
  }

  /**
   * Get amenity selling price for a specific age category
   * Note: The price in hotelAmenityPrices is the SELLING PRICE, not base price
   */
  getAmenityPrice(amenity: HotelAmenity, ageCategoryCode: string): Decimal {
    const prices = amenity.hotelAmenityPrices ?? [];
    for (const price of prices) {
      if (price.hotelAgeCategory && price.hotelAgeCategory.code === ageCategoryCode) {
        return new Decimal(price.price ?? 0);
      }
    }
    // Fallback to base rate (also treated as selling price)
    return new Decimal(amenity.baseRate ?? 0);
  }

  /**
   * Calculate amenity price based on pricing unit and count
   */
  calculateAmenityPrice(
    amenity: HotelAmenity,
    ageCategory: string,
    count: number = 1,
    nights: number = 1
  ): Decimal {
    try {
      const basePrice = this.getAmenityPrice(amenity, ageCategory);
      
      switch (amenity.pricingUnit) {
        case PricingUnitEnum.PERSON:
          return basePrice.times(count);
        case PricingUnitEnum.NIGHT:
          return basePrice.times(nights);
        case PricingUnitEnum.PER_PERSON_PER_ROOM:
          return basePrice.times(count);
        case PricingUnitEnum.ROOM:
          return basePrice;
        case PricingUnitEnum.ITEM:
          return basePrice.times((amenity as any).count || count);
        case PricingUnitEnum.STAY:
          return basePrice;
        default:
          return basePrice;
      }
    } catch (error) {
      this.logger.error('Error calculating amenity price:', error);
      return new Decimal(0);
    }
  }

  /**
   * Calculate base amount from gross amount for inclusive tax hotels
   */
  calculateBaseAmountFromGross(
    grossAmount: Decimal,
    taxSettingList: any[],
    serviceChargeRate: number = 0,
    serviceChargeTaxRate: number = 0,
    decimalUnits: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    if (taxSettingList.length === 0) {
      return grossAmount; // No taxes, gross = base
    }

    const totalTaxRate = taxSettingList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);
    
    return this.calculateBaseAmountFromInclusive(
      grossAmount,
      serviceChargeRate,
      totalTaxRate,
      serviceChargeTaxRate,
      decimalUnits,
      roundingMode
    );
  }

  // ---------- Helper methods ----------

  private calculateBaseAmountFromInclusive(
    grossAmount: Decimal,
    serviceChargeRate: number,
    taxRate: number,
    serviceChargeTaxRate: number,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    const s = new Decimal(serviceChargeRate).dividedBy(100);
    const t = new Decimal(taxRate).dividedBy(100);
    const st = new Decimal(serviceChargeTaxRate).dividedBy(100);
    const denominator = new Decimal(1).plus(s).plus(t).plus(s.times(st));

    if (denominator.equals(0)) return new Decimal(0);

    return this.roundDecimal(grossAmount.dividedBy(denominator), decimalUnits, roundingMode);
  }

  private calculateServiceCharge(
    baseAmount: Decimal,
    serviceChargeRate: number,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    const rate = new Decimal(serviceChargeRate).dividedBy(100);
    return this.roundDecimal(baseAmount.times(rate), decimalUnits, roundingMode);
  }

  private calculateTaxInclusiveForDay(
    grossAmount: Decimal,
    serviceChargeAmount: Decimal,
    baseAmount: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    const taxAmount = grossAmount.minus(baseAmount).minus(serviceChargeAmount);
    return this.roundDecimal(taxAmount, decimalUnits, roundingMode);
  }

  private calculateTaxInclusiveForTotals(
    grossTotal: Decimal,
    serviceChargeRate: number,
    baseTotal: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding,
    serviceChargeTaxRate: number
  ): Decimal {
    const serviceChargeAmount = this.calculateServiceCharge(
      baseTotal,
      serviceChargeRate,
      decimalUnits,
      roundingMode
    );
    const taxAmount = grossTotal.minus(baseTotal).minus(serviceChargeAmount);
    return this.roundDecimal(taxAmount, decimalUnits, roundingMode);
  }

  private calculateTaxAmountExclusiveProperty(
    appliedTaxList: any[],
    baseAmount: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Record<string, Decimal> {
    const totalTaxRate = appliedTaxList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);

    if (totalTaxRate === 0) return {};

    const taxRateDecimal = new Decimal(totalTaxRate).dividedBy(100);
    const serviceChargeRateDecimal = new Decimal(serviceChargeRate).dividedBy(100);
    const serviceChargeTaxRateDecimal = new Decimal(serviceChargeTaxRate).dividedBy(100);

    const baseTax = baseAmount.times(taxRateDecimal);
    const serviceChargeAmount = baseAmount.times(serviceChargeRateDecimal);
    const serviceChargeTax = serviceChargeAmount.times(serviceChargeTaxRateDecimal);
    const totalTax = baseTax.plus(serviceChargeTax);

    const result: Record<string, Decimal> = {};

    for (const tax of appliedTaxList) {
      const taxCode = tax.taxCode;
      const taxRate = tax.hotelTax?.rate ?? 0;
      const proportion = new Decimal(taxRate).dividedBy(totalTaxRate);
      const amount = totalTax.times(proportion);
      result[taxCode] = this.roundDecimal(amount, decimalUnits, roundingMode);
    }

    return result;
  }

  private calculateGrossExclusive(
    baseAmount: Decimal,
    serviceChargeAmount: Decimal,
    taxAmount: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    return this.roundDecimal(
      baseAmount.plus(serviceChargeAmount).plus(taxAmount),
      decimalUnits,
      roundingMode
    );
  }

  private splitAcrossDates(
    fromDateIso: string,
    toDateIso: string,
    total: Decimal,
    decimalUnits: number,
    roundingMode: Decimal.Rounding
  ): Decimal[] {
    const dates = this.getDateRangeInclusive(fromDateIso, toDateIso);
    const numDates = dates.length;

    if (numDates === 0) return [];
    if (numDates === 1) return [total];

    const perDate = total.dividedBy(numDates).toDecimalPlaces(decimalUnits, roundingMode);
    const amounts: Decimal[] = new Array(numDates).fill(perDate);

    // Add remainder to last date
    const sum = amounts.reduce((acc, amt) => acc.plus(amt), new Decimal(0));
    const remainder = total.minus(sum);
    amounts[numDates - 1] = amounts[numDates - 1].plus(remainder);

    return amounts;
  }

  private getDateRangeInclusive(fromIso: string, toIso: string): string[] {
    const dates: string[] = [];
    const fromDate = new Date(fromIso + 'T00:00:00Z');
    const toDate = new Date(toIso + 'T00:00:00Z');

    for (let d = new Date(fromDate); d <= toDate; d.setUTCDate(d.getUTCDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }

    return dates;
  }

  private getApplicableTaxes(
    taxSettingList: any[],
    serviceCode: string,
    baseDate: string,
    dayIndex: number
  ): any[] {
    return taxSettingList.filter((tax) => {
      // Filter by service code if applicable
      if (serviceCode && tax.serviceCode && tax.serviceCode !== serviceCode) {
        return false;
      }

      // Add date validity checks here if needed
      return this.isValidDailyHotelTax(tax, baseDate);
    });
  }

  private isValidDailyHotelTax(taxSetting: any, dateIso: string): boolean {
    const date = new Date(dateIso);
    
    if (taxSetting.hotelTax?.validFrom && taxSetting.hotelTax?.validTo) {
      const validFrom = new Date(taxSetting.hotelTax.validFrom);
      const validTo = new Date(taxSetting.hotelTax.validTo);
      return date >= validFrom && date <= validTo;
    }
    
    return true;
  }

  private distributeTaxAmountByCode(
    appliedTaxList: any[],
    totalTaxAmount: Decimal,
    taxDetailsMap: Record<string, Decimal>
  ): void {
    if (appliedTaxList.length === 0) return;

    const totalTaxRate = appliedTaxList.reduce((sum, tax) => sum + (tax.hotelTax?.rate ?? 0), 0);

    if (totalTaxRate === 0) return;

    for (const tax of appliedTaxList) {
      const taxCode = tax.taxCode;
      const taxRate = tax.hotelTax?.rate ?? 0;
      const proportion = new Decimal(taxRate).dividedBy(totalTaxRate);
      const amount = totalTaxAmount.times(proportion);

      taxDetailsMap[taxCode] = (taxDetailsMap[taxCode] ?? new Decimal(0)).plus(amount);
    }
  }

  private mapRoundingMode(mode: RoundingModeEnum): Decimal.Rounding {
    switch (mode) {
      case RoundingModeEnum.UP:
        return Decimal.ROUND_UP;
      case RoundingModeEnum.DOWN:
        return Decimal.ROUND_DOWN;
      case RoundingModeEnum.HALF_ROUND_UP:
        return Decimal.ROUND_HALF_UP;
      case RoundingModeEnum.NO_ROUNDING:
        return Decimal.ROUND_HALF_UP; // Default behavior for no rounding
      default:
        return Decimal.ROUND_HALF_UP;
    }
  }

  private roundDecimal(
    value: Decimal,
    decimalPlaces: number,
    roundingMode: Decimal.Rounding
  ): Decimal {
    return value.toDecimalPlaces(decimalPlaces, roundingMode);
  }
}
