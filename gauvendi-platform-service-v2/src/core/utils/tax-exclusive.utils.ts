import Decimal from 'decimal.js';

/**
 * TaxExclusiveUtils
 * 
 * Input (sellingRate) → Treated as base amount (before tax and service charges).
 * 
 * Flow:
 * 1. Start from base amount.
 * 2. Compute service charge from base.
 * 3. Compute tax = base * taxRate + serviceCharge * serviceChargeTaxRate.
 * 4. Compute gross amount = base + serviceCharge + tax.
 * 5. Selling Amount → set equal to baseAmount.
 * 
 * Use Case: When the price given is before tax, and you need to add taxes and service charges.
 */

export interface TaxExclusiveCalculationInput {
  sellingRate: Decimal;
  serviceChargeRate: number;
  serviceChargeTaxRate: number;
  taxRate: number;
  decimalPlaces?: number;
  roundingMode?: Decimal.Rounding;
}

export interface TaxExclusiveCalculationResult {
  baseAmount: Decimal;
  serviceChargeAmount: Decimal;
  taxAmount: Decimal;
  grossAmount: Decimal;
  sellingAmount: Decimal; // Equal to baseAmount in exclusive mode
}

export class TaxExclusiveUtils {
  
  /**
   * Calculate service charge from base amount
   */
  static calculateServiceChargeFromBase(
    baseAmount: Decimal,
    serviceChargeRate: number,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    return baseAmount
      .times(new Decimal(serviceChargeRate))
      .toDecimalPlaces(decimalPlaces, roundingMode);
  }

  /**
   * Calculate tax amount for exclusive pricing
   * Formula: tax = base * taxRate + serviceCharge * serviceChargeTaxRate
   */
  static calculateTaxAmountExclusive(
    baseAmount: Decimal,
    serviceChargeAmount: Decimal,
    taxRate: number,
    serviceChargeTaxRate: number,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    const baseTax = baseAmount.times(new Decimal(taxRate));
    const serviceChargeTax = serviceChargeAmount.times(new Decimal(serviceChargeTaxRate));
    
    return baseTax
      .plus(serviceChargeTax)
      .toDecimalPlaces(decimalPlaces, roundingMode);
  }

  /**
   * Calculate gross amount from components
   * Formula: gross = base + serviceCharge + tax
   */
  static calculateGrossAmount(
    baseAmount: Decimal,
    serviceChargeAmount: Decimal,
    taxAmount: Decimal,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    return baseAmount
      .plus(serviceChargeAmount)
      .plus(taxAmount)
      .toDecimalPlaces(decimalPlaces, roundingMode);
  }

  /**
   * Main calculation method for tax exclusive pricing
   */
  static calculate(input: TaxExclusiveCalculationInput): TaxExclusiveCalculationResult {
    const decimalPlaces = input.decimalPlaces ?? 2;
    const roundingMode = input.roundingMode ?? Decimal.ROUND_HALF_UP;
    
    const baseAmount = input.sellingRate;
    
    // Step 1: Calculate service charge from base
    const serviceChargeAmount = this.calculateServiceChargeFromBase(
      baseAmount,
      input.serviceChargeRate,
      decimalPlaces,
      roundingMode
    );
    
    // Step 2: Calculate tax amount
    const taxAmount = this.calculateTaxAmountExclusive(
      baseAmount,
      serviceChargeAmount,
      input.taxRate,
      input.serviceChargeTaxRate,
      decimalPlaces,
      roundingMode
    );
    
    // Step 3: Calculate gross amount
    const grossAmount = this.calculateGrossAmount(
      baseAmount,
      serviceChargeAmount,
      taxAmount,
      decimalPlaces,
      roundingMode
    );
    
    // Step 4: Selling amount equals base amount in exclusive mode
    const sellingAmount = baseAmount;
    
    return {
      baseAmount,
      serviceChargeAmount,
      taxAmount,
      grossAmount,
      sellingAmount
    };
  }

  /**
   * Validate that the components sum to the gross amount
   */
  static validateCalculation(result: TaxExclusiveCalculationResult): boolean {
    const calculatedGross = result.baseAmount
      .plus(result.serviceChargeAmount)
      .plus(result.taxAmount);
    
    return calculatedGross.equals(result.grossAmount);
  }

  /**
   * Calculate with multiple tax rates
   */
  static calculateWithMultipleTaxRates(
    baseAmount: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxRates: { code: string; rate: number }[],
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): {
    baseAmount: Decimal;
    serviceChargeAmount: Decimal;
    taxBreakdown: { code: string; amount: Decimal }[];
    totalTaxAmount: Decimal;
    grossAmount: Decimal;
  } {
    const serviceChargeAmount = this.calculateServiceChargeFromBase(
      baseAmount,
      serviceChargeRate,
      decimalPlaces,
      roundingMode
    );
    
    // Calculate tax for each tax code
    const taxBreakdown: { code: string; amount: Decimal }[] = [];
    let totalTaxAmount = new Decimal(0);
    
    for (const tax of taxRates) {
      const taxAmount = this.calculateTaxAmountExclusive(
        baseAmount,
        serviceChargeAmount,
        tax.rate,
        serviceChargeTaxRate,
        decimalPlaces,
        roundingMode
      );
      
      taxBreakdown.push({
        code: tax.code,
        amount: taxAmount
      });
      
      totalTaxAmount = totalTaxAmount.plus(taxAmount);
    }
    
    const grossAmount = this.calculateGrossAmount(
      baseAmount,
      serviceChargeAmount,
      totalTaxAmount,
      decimalPlaces,
      roundingMode
    );
    
    return {
      baseAmount,
      serviceChargeAmount,
      taxBreakdown,
      totalTaxAmount,
      grossAmount
    };
  }

  /**
   * Calculate tax amount by tax code with proportional distribution
   * This is useful when you have a single combined tax rate but need breakdown by tax codes
   */
  static calculateTaxAmountByTaxCode(
    baseAmount: Decimal,
    serviceChargeAmount: Decimal,
    serviceChargeTaxRate: number,
    taxRates: { code: string; rate: number }[],
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Record<string, Decimal> {
    const result: Record<string, Decimal> = {};
    const totalTaxRate = taxRates.reduce((sum, tax) => sum + tax.rate, 0);
    
    if (totalTaxRate === 0) {
      return result;
    }
    
    // Calculate total tax amount
    const totalTaxAmount = this.calculateTaxAmountExclusive(
      baseAmount,
      serviceChargeAmount,
      totalTaxRate,
      serviceChargeTaxRate,
      decimalPlaces,
      roundingMode
    );
    
    // Distribute proportionally
    for (const tax of taxRates) {
      const proportion = new Decimal(tax.rate).dividedBy(new Decimal(totalTaxRate));
      const taxAmount = totalTaxAmount
        .times(proportion)
        .toDecimalPlaces(decimalPlaces, roundingMode);
      
      result[tax.code] = taxAmount;
    }
    
    return result;
  }
}
