import { Decimal } from 'decimal.js';
import { RoundingMode, RoundingModeEnum } from '../enums/common';

/**
 * Decimal rounding utility helper for consistent financial calculations
 * Provides reusable methods for rounding numbers with different modes
 */
export class DecimalRoundingHelper {
  /**
   * Apply rounding to a number based on the specified rounding mode
   * @param value - The number to round
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 0)
   * @returns Rounded number
   */
  static applyRounding(
    value: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 0
  ): number {
    if (roundingMode === RoundingModeEnum.NO_ROUNDING) {
      return value;
    }

    return new Decimal(value).toDecimalPlaces(decimalPlaces, RoundingMode[roundingMode]).toNumber();
  }

  /**
   * Apply conditional rounding - only rounds if rounding mode is not NO_ROUNDING
   * @param value - The number to round
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 0)
   * @returns Rounded number or original value if no rounding
   */
  static conditionalRounding(
    value: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 0
  ): number {
    return roundingMode !== RoundingModeEnum.NO_ROUNDING
      ? new Decimal(value).toDecimalPlaces(decimalPlaces, RoundingMode[roundingMode]).toNumber()
      : value;
  }

  /**
   * Apply rounding to multiple values at once
   * @param values - Array of numbers to round
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 0)
   * @returns Array of rounded numbers
   */
  static applyRoundingToArray(
    values: number[],
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 0
  ): number[] {
    if (roundingMode === RoundingModeEnum.NO_ROUNDING) {
      return values;
    }

    return values.map((value) =>
      new Decimal(value).toDecimalPlaces(decimalPlaces, RoundingMode[roundingMode]).toNumber()
    );
  }

  /**
   * Calculate and round a percentage of a value
   * @param value - The base value
   * @param percentage - The percentage to calculate (e.g., 18 for 18%)
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 2)
   * @returns Rounded percentage amount
   */
  static calculatePercentageWithRounding(
    value: number,
    percentage: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 2
  ): number {
    const percentageAmount = (value * percentage) / 100;
    return this.conditionalRounding(percentageAmount, roundingMode, decimalPlaces);
  }

  /**
   * Calculate tax amount with rounding
   * @param baseAmount - The base amount to calculate tax on
   * @param taxRate - The tax rate (e.g., 0.18 for 18%)
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 2)
   * @returns Rounded tax amount
   */
  static calculateTaxWithRounding(
    baseAmount: number,
    taxRate: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 2
  ): number {
    const taxAmount = baseAmount * taxRate;
    return this.conditionalRounding(taxAmount, roundingMode, decimalPlaces);
  }

  /**
   * Sum multiple values and apply rounding to the total
   * @param values - Array of numbers to sum
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 2)
   * @returns Rounded sum
   */
  static sumWithRounding(
    values: number[],
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 2
  ): number {
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return this.conditionalRounding(sum, roundingMode, decimalPlaces);
  }

  /**
   * Calculate compound operations with rounding at each step
   * Useful for complex financial calculations where intermediate rounding is needed
   * @param operations - Array of operations to perform
   * @param roundingMode - The rounding mode to apply
   * @param decimalPlaces - Number of decimal places (default: 2)
   * @returns Final rounded result
   */
  static calculateWithStepwiseRounding(
    operations: Array<{
      operation: 'add' | 'subtract' | 'multiply' | 'divide';
      value: number;
      roundAfter?: boolean;
    }>,
    initialValue: number,
    roundingMode: RoundingModeEnum,
    decimalPlaces: number = 2
  ): number {
    let result = initialValue;

    for (const op of operations) {
      switch (op.operation) {
        case 'add':
          result += op.value;
          break;
        case 'subtract':
          result -= op.value;
          break;
        case 'multiply':
          result *= op.value;
          break;
        case 'divide':
          result /= op.value;
          break;
      }

      if (op.roundAfter) {
        result = this.conditionalRounding(result, roundingMode, decimalPlaces);
      }
    }

    return this.conditionalRounding(result, roundingMode, decimalPlaces);
  }

  /**
   * Format a number for display with proper decimal places
   * @param value - The number to format
   * @param decimalPlaces - Number of decimal places to show
   * @param locale - Locale for formatting (default: 'en-US')
   * @returns Formatted string
   */
  static formatForDisplay(
    value: number,
    decimalPlaces: number = 2,
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  }

  /**
   * Validate if a rounding mode is valid
   * @param roundingMode - The rounding mode to validate
   * @returns boolean indicating if the mode is valid
   */
  static isValidRoundingMode(roundingMode: string): roundingMode is RoundingModeEnum {
    return Object.values(RoundingModeEnum).includes(roundingMode as RoundingModeEnum);
  }

  /**
   * Calculate price adjustment based on value and unit
   */
  static calculatePriceAdjustment(basePrice: number, adjustmentValue: number, adjustmentUnit: 'PERCENTAGE' | 'FIXED'): number {
    if (adjustmentUnit === 'PERCENTAGE') {
      return basePrice * (1 + adjustmentValue / 100);
    } else {
      return basePrice + adjustmentValue;
    }
  }
}
