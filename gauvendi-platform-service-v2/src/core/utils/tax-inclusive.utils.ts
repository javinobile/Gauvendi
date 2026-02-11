import Decimal from 'decimal.js';

/**
 * TaxInclusiveUtils
 *
 * Input (sellingRate) → Treated as gross amount (already includes base + service charge + tax).
 *
 * Flow:
 * 1. Start from gross amount.
 * 2. Compute net amount by subtracting gross amount by gross amount times tax rate.
 * 3. Compute service charge from base.
 * 4. Compute tax as grossAmount - serviceChargeAmount - baseAmount.
 * 5. Selling Amount → set equal to grossAmount.
 *
 * Use Case: When the price given already includes taxes and service charges, and you need to break it down.
 */

export interface TaxInclusiveCalculationInput {
  sellingRate: Decimal;
  serviceChargeRate: number;
  serviceChargeTaxRate: number;
  taxRate: number;
  decimalPlaces?: number;
  roundingMode?: Decimal.Rounding;
}

export interface TaxInclusiveCalculationResult {
  baseAmount: Decimal;
  serviceChargeAmount: Decimal;
  taxAmount: Decimal;
  grossAmount: Decimal;
  sellingAmount: Decimal; // Equal to grossAmount in inclusive mode
}

export class TaxInclusiveUtils {
  /**
   * Calculate base amount from inclusive gross amount
   * Formula: base = gross / (1 + serviceChargeRate*(1+serviceChargeTaxRate) + taxRate)
   */
  static calculateBaseAmountFromInclusive(
    grossAmount: Decimal,
    serviceChargeRate: number,
    serviceChargeTaxRate: number,
    taxRate: number,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    const s = new Decimal(serviceChargeRate);
    const st = new Decimal(serviceChargeTaxRate);
    const t = new Decimal(taxRate);

    // Denominator: 1 + s*(1+st) + t
    const denominator = new Decimal(1).plus(s.times(new Decimal(1).plus(st))).plus(t);

    if (denominator.equals(0)) {
      return new Decimal(0);
    }

    // net = gross / (1 + taxRate)
    return grossAmount.dividedBy(denominator).toDecimalPlaces(decimalPlaces, roundingMode);
  }

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
   * Calculate tax amount for inclusive pricing
   * Formula: tax = grossAmount - baseAmount - serviceChargeAmount
   */
  static calculateTaxAmountInclusive(
    grossAmount: Decimal,
    baseAmount: Decimal,
    serviceChargeAmount: Decimal,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    return grossAmount
      .minus(baseAmount)
      .minus(serviceChargeAmount)
      .toDecimalPlaces(decimalPlaces, roundingMode);
  }

  /**
   * Main calculation method for tax inclusive pricing
   */
  static calculate(input: TaxInclusiveCalculationInput): TaxInclusiveCalculationResult {
    const decimalPlaces = input.decimalPlaces ?? 2;
    const roundingMode = input.roundingMode ?? Decimal.ROUND_HALF_UP;

    const grossAmount = input.sellingRate;

    // Step 1: Calculate base amount from gross
    const baseAmount = this.calculateBaseAmountFromInclusive(
      grossAmount,
      input.serviceChargeRate,
      input.serviceChargeTaxRate,
      input.taxRate,
      decimalPlaces,
      roundingMode
    );

    // Step 2: Calculate service charge from base
    const serviceChargeAmount = this.calculateServiceChargeFromBase(
      baseAmount,
      input.serviceChargeRate,
      decimalPlaces,
      roundingMode
    );

    // Step 3: Calculate tax amount (remainder)
    const taxAmount = this.calculateTaxAmountInclusive(
      grossAmount,
      baseAmount,
      serviceChargeAmount,
      decimalPlaces,
      roundingMode
    );

    // Step 4: Selling amount equals gross amount in inclusive mode
    const sellingAmount = grossAmount;

    return {
      baseAmount,
      serviceChargeAmount,
      taxAmount,
      grossAmount,
      sellingAmount
    };
  }

  /**
   * Validate that the breakdown sums back to the original gross amount
   */
  static validateCalculation(result: TaxInclusiveCalculationResult): boolean {
    const calculatedGross = result.baseAmount
      .plus(result.serviceChargeAmount)
      .plus(result.taxAmount);

    return calculatedGross.equals(result.grossAmount);
  }

  /**
   * Calculate multiple tax rates with proportional distribution
   */
  static calculateWithMultipleTaxRates(
    grossAmount: Decimal,
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
    const totalTaxRate = taxRates.reduce((sum, tax) => sum + tax.rate, 0);

    // Calculate base components using total tax rate
    const baseAmount = this.calculateBaseAmountFromInclusive(
      grossAmount,
      serviceChargeRate,
      serviceChargeTaxRate,
      totalTaxRate,
      decimalPlaces,
      roundingMode
    );

    const serviceChargeAmount = this.calculateServiceChargeFromBase(
      baseAmount,
      serviceChargeRate,
      decimalPlaces,
      roundingMode
    );

    const totalTaxAmount = this.calculateTaxAmountInclusive(
      grossAmount,
      baseAmount,
      serviceChargeAmount,
      decimalPlaces,
      roundingMode
    );

    // Distribute tax amount proportionally across tax codes
    const taxBreakdown: { code: string; amount: Decimal }[] = [];

    if (totalTaxRate > 0) {
      for (const tax of taxRates) {
        const proportion = new Decimal(tax.rate).dividedBy(new Decimal(totalTaxRate));
        const taxAmount = totalTaxAmount
          .times(proportion)
          .toDecimalPlaces(decimalPlaces, roundingMode);

        taxBreakdown.push({
          code: tax.code,
          amount: taxAmount
        });
      }
    }

    return {
      baseAmount,
      serviceChargeAmount,
      taxBreakdown,
      totalTaxAmount,
      grossAmount
    };
  }
}
