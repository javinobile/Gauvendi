import Decimal from 'decimal.js';
import { HotelRetailFeature } from '../entities/hotel-retail-feature.entity';
import { RoomUnitRetailFeature } from '../entities/room-unit-retail-feature.entity';
import { RoomProductRetailFeature } from '../entities/room-product-retail-feature.entity';

/**
 * RetailFeatureCalculationUtils
 * 
 * Utility class for calculating retail feature rates with quantities.
 * Provides reusable methods for calculating total rates from base rates and quantities.
 */

export interface RetailFeatureCalculationInput {
  baseRate: number | string | Decimal;
  quantity?: number;
  decimalPlaces?: number;
  roundingMode?: Decimal.Rounding;
}

export interface RetailFeatureCalculationResult {
  baseRate: Decimal;
  quantity: number;
  totalRate: Decimal;
}

export class RetailFeatureCalculationUtils {
  
  /**
   * Calculate total rate from base rate and quantity
   * Formula: totalRate = baseRate * quantity
   * 
   * @param input - Calculation input parameters
   * @returns Calculation result with breakdown
   */
  static calculate(input: RetailFeatureCalculationInput): RetailFeatureCalculationResult {
    const decimalPlaces = input.decimalPlaces ?? 2;
    const roundingMode = input.roundingMode ?? Decimal.ROUND_HALF_UP;
    
    const baseRate = new Decimal(input.baseRate || 0);
    const quantity = input.quantity || 1;
    
    const totalRate = baseRate
      .times(new Decimal(quantity))
      .toDecimalPlaces(decimalPlaces, roundingMode);
    
    return {
      baseRate,
      quantity,
      totalRate
    };
  }

  /**
   * Calculate total rate for a single RoomUnitRetailFeature
   * Uses the related HotelRetailFeature's baseRate and the quantity from RoomUnitRetailFeature
   * 
   * @param roomUnitRetailFeature - The room unit retail feature entity
   * @param decimalPlaces - Number of decimal places for rounding (default: 2)
   * @param roundingMode - Rounding mode (default: ROUND_HALF_UP)
   * @returns Calculation result
   */
  static calculateFromRoomUnitRetailFeature(
    roomUnitRetailFeature: RoomUnitRetailFeature & { retailFeature: HotelRetailFeature },
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): RetailFeatureCalculationResult {
    return this.calculate({
      baseRate: roomUnitRetailFeature.retailFeature.baseRate || 0,
      quantity: roomUnitRetailFeature.quantity || 1,
      decimalPlaces,
      roundingMode
    });
  }

  /**
   * Calculate total rate for a single RoomProductRetailFeature
   * Uses the related HotelRetailFeature's baseRate and the quantity from RoomProductRetailFeature
   * 
   * @param roomProductRetailFeature - The room product retail feature entity
   * @param decimalPlaces - Number of decimal places for rounding (default: 2)
   * @param roundingMode - Rounding mode (default: ROUND_HALF_UP)
   * @returns Calculation result
   */
  static calculateFromRoomProductRetailFeature(
    roomProductRetailFeature: RoomProductRetailFeature & { retailFeature: HotelRetailFeature },
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): RetailFeatureCalculationResult {
    return this.calculate({
      baseRate: roomProductRetailFeature.retailFeature.baseRate || 0,
      quantity: roomProductRetailFeature.quantity || 1,
      decimalPlaces,
      roundingMode
    });
  }

  /**
   * Calculate total rates for multiple retail features
   * 
   * @param features - Array of retail features with base rates and quantities
   * @param decimalPlaces - Number of decimal places for rounding (default: 2)
   * @param roundingMode - Rounding mode (default: ROUND_HALF_UP)
   * @returns Array of calculation results and total sum
   */
  static calculateMultiple(
    features: Array<{
      baseRate: number | string | Decimal;
      quantity?: number;
      id?: string;
      name?: string;
    }>,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): {
    results: Array<RetailFeatureCalculationResult & { id?: string; name?: string }>;
    totalAmount: Decimal;
  } {
    const results = features.map(feature => ({
      ...this.calculate({
        baseRate: feature.baseRate,
        quantity: feature.quantity,
        decimalPlaces,
        roundingMode
      }),
      id: feature.id,
      name: feature.name
    }));

    const totalAmount = results
      .reduce((sum, result) => sum.plus(result.totalRate), new Decimal(0))
      .toDecimalPlaces(decimalPlaces, roundingMode);

    return {
      results,
      totalAmount
    };
  }

  /**
   * Calculate total rates for multiple RoomUnitRetailFeatures
   * 
   * @param roomUnitRetailFeatures - Array of room unit retail features
   * @param decimalPlaces - Number of decimal places for rounding (default: 2)
   * @param roundingMode - Rounding mode (default: ROUND_HALF_UP)
   * @returns Array of calculation results and total sum
   */
  static calculateMultipleRoomUnitRetailFeatures(
    roomUnitRetailFeatures: Array<RoomUnitRetailFeature & { retailFeature: HotelRetailFeature }>,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): {
    results: Array<RetailFeatureCalculationResult & { featureId: string; featureName: string }>;
    totalAmount: Decimal;
  } {
    const features = roomUnitRetailFeatures.map(rf => ({
      baseRate: rf.retailFeature.baseRate || 0,
      quantity: rf.quantity || 1,
      id: rf.retailFeatureId,
      name: rf.retailFeature.name
    }));

    const calculation = this.calculateMultiple(features, decimalPlaces, roundingMode);

    return {
      results: calculation.results.map(result => ({
        ...result,
        featureId: result.id!,
        featureName: result.name!
      })),
      totalAmount: calculation.totalAmount
    };
  }

  /**
   * Calculate total rates for multiple RoomProductRetailFeatures
   * 
   * @param roomProductRetailFeatures - Array of room product retail features
   * @param decimalPlaces - Number of decimal places for rounding (default: 2)
   * @param roundingMode - Rounding mode (default: ROUND_HALF_UP)
   * @returns Array of calculation results and total sum
   */
  static calculateMultipleRoomProductRetailFeatures(
    roomProductRetailFeatures: Array<RoomProductRetailFeature & { retailFeature: HotelRetailFeature }>,
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): {
    results: Array<RetailFeatureCalculationResult & { featureId: string; featureName: string }>;
    totalAmount: Decimal;
  } {
    const features = roomProductRetailFeatures.map(rf => ({
      baseRate: rf.retailFeature.baseRate || 0,
      quantity: rf.quantity || 1,
      id: rf.retailFeatureId,
      name: rf.retailFeature.name
    }));

    const calculation = this.calculateMultiple(features, decimalPlaces, roundingMode);

    return {
      results: calculation.results.map(result => ({
        ...result,
        featureId: result.id!,
        featureName: result.name!
      })),
      totalAmount: calculation.totalAmount
    };
  }

  /**
   * Apply price adjustments to calculated retail feature rates
   * 
   * @param totalRate - The calculated total rate
   * @param adjustmentValue - The adjustment value
   * @param adjustmentType - The adjustment type ('FIXED' or 'PERCENTAGE')
   * @param decimalPlaces - Number of decimal places for rounding (default: 2)
   * @param roundingMode - Rounding mode (default: ROUND_HALF_UP)
   * @returns Adjusted total rate
   */
  static applyPriceAdjustment(
    totalRate: Decimal,
    adjustmentValue: number,
    adjustmentType: 'FIXED' | 'PERCENTAGE' = 'FIXED',
    decimalPlaces: number = 2,
    roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
  ): Decimal {
    if (adjustmentType === 'PERCENTAGE') {
      return totalRate
        .times(new Decimal(1).plus(new Decimal(adjustmentValue).dividedBy(100)))
        .toDecimalPlaces(decimalPlaces, roundingMode);
    } else {
      return totalRate
        .plus(new Decimal(adjustmentValue))
        .toDecimalPlaces(decimalPlaces, roundingMode);
    }
  }

  /**
   * Validate that base rate and quantity are valid numbers
   * 
   * @param baseRate - The base rate to validate
   * @param quantity - The quantity to validate
   * @returns True if both values are valid
   */
  static validateInput(baseRate: number | string | Decimal, quantity?: number): boolean {
    try {
      const rate = new Decimal(baseRate || 0);
      const qty = quantity || 1;
      
      return rate.isFinite() && 
             rate.greaterThanOrEqualTo(0) && 
             Number.isInteger(qty) && 
             qty > 0;
    } catch (error) {
      return false;
    }
  }
}
