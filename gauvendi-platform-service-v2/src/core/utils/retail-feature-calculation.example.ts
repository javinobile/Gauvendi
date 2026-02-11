import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomUnitRetailFeature } from 'src/core/entities/room-unit-retail-feature.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { RetailFeatureCalculationUtils } from 'src/core/utils/retail-feature-calculation.util';
import Decimal from 'decimal.js';

/**
 * Example service demonstrating how to use RetailFeatureCalculationUtils
 * for calculating room unit retail feature rates
 */
@Injectable()
export class RoomUnitRetailFeatureService {
  private readonly logger = new Logger(RoomUnitRetailFeatureService.name);

  constructor(
    @InjectRepository(RoomUnitRetailFeature)
    private readonly roomUnitRetailFeatureRepository: Repository<RoomUnitRetailFeature>,
  ) {}

  /**
   * Example: Calculate total rate for a single room unit retail feature
   */
  async calculateSingleFeatureRate(
    roomUnitId: string,
    retailFeatureId: string
  ): Promise<{ featureRate: Decimal; featureName: string } | null> {
    try {
      // Fetch the room unit retail feature with its related hotel retail feature
      const roomUnitRetailFeature = await this.roomUnitRetailFeatureRepository
        .createQueryBuilder('rurf')
        .leftJoinAndSelect('rurf.retailFeature', 'retailFeature')
        .where('rurf.roomUnitId = :roomUnitId', { roomUnitId })
        .andWhere('rurf.retailFeatureId = :retailFeatureId', { retailFeatureId })
        .getOne();

      if (!roomUnitRetailFeature || !roomUnitRetailFeature.retailFeature) {
        return null;
      }

      // Use the utility to calculate the total rate
      const calculation = RetailFeatureCalculationUtils.calculateFromRoomUnitRetailFeature(
        roomUnitRetailFeature
      );

      return {
        featureRate: calculation.totalRate,
        featureName: roomUnitRetailFeature.retailFeature.name
      };
    } catch (error) {
      this.logger.error(`Error calculating single feature rate: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example: Calculate total rates for all retail features of a room unit
   */
  async calculateRoomUnitTotalFeatureRates(
    roomUnitId: string
  ): Promise<{
    individualRates: Array<{
      featureId: string;
      featureName: string;
      baseRate: Decimal;
      quantity: number;
      totalRate: Decimal;
    }>;
    totalAmount: Decimal;
  }> {
    try {
      // Fetch all room unit retail features with their related hotel retail features
      const roomUnitRetailFeatures = await this.roomUnitRetailFeatureRepository
        .createQueryBuilder('rurf')
        .leftJoinAndSelect('rurf.retailFeature', 'retailFeature')
        .where('rurf.roomUnitId = :roomUnitId', { roomUnitId })
        .andWhere('retailFeature.status = :status', { status: 'ACTIVE' })
        .getMany();

      if (roomUnitRetailFeatures.length === 0) {
        return {
          individualRates: [],
          totalAmount: new Decimal(0)
        };
      }

      // Use the utility to calculate multiple feature rates
      const calculation = RetailFeatureCalculationUtils.calculateMultipleRoomUnitRetailFeatures(
        roomUnitRetailFeatures
      );

      return {
        individualRates: calculation.results.map(result => ({
          featureId: result.featureId,
          featureName: result.featureName,
          baseRate: result.baseRate,
          quantity: result.quantity,
          totalRate: result.totalRate
        })),
        totalAmount: calculation.totalAmount
      };
    } catch (error) {
      this.logger.error(`Error calculating room unit total feature rates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example: Calculate feature rates with price adjustments
   */
  async calculateFeatureRatesWithAdjustment(
    roomUnitId: string,
    adjustmentValue: number,
    adjustmentType: 'FIXED' | 'PERCENTAGE' = 'FIXED'
  ): Promise<{
    originalTotal: Decimal;
    adjustmentValue: number;
    adjustmentType: string;
    adjustedTotal: Decimal;
    savings: Decimal;
  }> {
    try {
      // Get the original total
      const originalCalculation = await this.calculateRoomUnitTotalFeatureRates(roomUnitId);
      
      // Apply adjustment using the utility
      const adjustedTotal = RetailFeatureCalculationUtils.applyPriceAdjustment(
        originalCalculation.totalAmount,
        adjustmentValue,
        adjustmentType
      );

      const savings = originalCalculation.totalAmount.minus(adjustedTotal);

      return {
        originalTotal: originalCalculation.totalAmount,
        adjustmentValue,
        adjustmentType,
        adjustedTotal,
        savings
      };
    } catch (error) {
      this.logger.error(`Error calculating feature rates with adjustment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Example: Validate feature calculation inputs
   */
  validateFeatureInputs(baseRate: number, quantity: number): boolean {
    return RetailFeatureCalculationUtils.validateInput(baseRate, quantity);
  }

  /**
   * Example: Direct calculation without database queries
   */
  calculateDirectFeatureRate(
    baseRate: number,
    quantity: number,
    decimalPlaces: number = 2
  ): Decimal {
    const calculation = RetailFeatureCalculationUtils.calculate({
      baseRate,
      quantity,
      decimalPlaces
    });

    return calculation.totalRate;
  }
}
