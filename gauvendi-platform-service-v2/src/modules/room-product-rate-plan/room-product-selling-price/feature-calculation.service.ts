import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { groupByToMap } from '@src/core/utils/group-by.util';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomProductAssignedUnit } from 'src/core/entities/room-product-assigned-unit.entity';
import { RoomProductFeatureRateAdjustment } from 'src/core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { RoomProductStatus, RoomProductType } from 'src/core/enums/common';
import { DecimalRoundingHelper } from 'src/core/helper/decimal-rounding.helper';
import { Helper } from 'src/core/helper/utils';
import { In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';

export interface FeatureCalculationOptions {
  roomProductType: RoomProductType;
  roomProductId: string;
  hotelId: string;
  fromDate?: string;
  toDate?: string;
  useDaily?: boolean;
  isAverage?: boolean;
  pricingMethodAdjustmentValue?: number;
  pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE';
}

export interface FeatureCalculationResult {
  date?: string;
  featureBasedRate: number;
  roomProductCode: string;
  roomProductName: string;
  linkedRoomProducts?: FeatureCalculationResult[];
}

export interface DailyFeatureCalculationResult {
  date: string;
  featureBasedRate: number;
  roomProductCode: string;
  roomProductName: string;
  linkedRoomProducts?: FeatureCalculationResult[];
}

@Injectable()
export class FeatureCalculationService {
  private readonly logger = new Logger(FeatureCalculationService.name);

  constructor(
    @InjectRepository(RoomProductRetailFeature, DbName.Postgres)
    private readonly roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(RoomProductFeatureRateAdjustment, DbName.Postgres)
    private readonly roomProductFeatureRateAdjustmentRepository: Repository<RoomProductFeatureRateAdjustment>,

    @InjectRepository(RoomProductAssignedUnit, DbName.Postgres)
    private readonly roomProductAssignedUnitRepository: Repository<RoomProductAssignedUnit>
  ) {}

  /**
   * Calculate feature-based pricing with flexible options
   */
  async calculateFeatureBasedPrice(
    options: FeatureCalculationOptions
  ): Promise<FeatureCalculationResult[]> {
    try {
      this.validateOptions(options);

      if (options.useDaily && options.fromDate && options.toDate) {
        return await this.calculateDailyFeaturePrice(options);
      } else {
        const result = await this.calculateBaseFeaturePrice(options);
        return result ? [result] : [];
      }
    } catch (error) {
      throw new BadRequestException(`Failed to calculate feature-based price: ${error.message}`);
    }
  }

  /**
   * Calculate combined feature pricing across related room products
   */
  async calculateCombinedFeaturePrice(
    options: FeatureCalculationOptions
  ): Promise<FeatureCalculationResult[]> {
    try {
      this.validateOptions(options);


      const relatedAssignedUnits = await this.getRelatedRoomProduct(options.roomProductId);
      const relatedRoomProductIds = [...new Set(relatedAssignedUnits.map((unit) => unit.roomProductId))];


      if (relatedRoomProductIds.length === 0) {
        this.logger.warn(`No related room products found for ${options.roomProductId}`);
        return [];
      }

      const relatedAssignedUnitMap = groupByToMap(relatedAssignedUnits, (unit) => unit.roomProductId);


      // Calculate in parallel for all related room products
      const calculationPromises = relatedRoomProductIds.map((roomProductId) => {

        return this.calculateFeatureBasedPrice({ ...options, roomProductId });
      }
      );

      const allResults = await Promise.all(calculationPromises);
      return this.combineCalculationResults({
        allResults,
        isAverage: options.isAverage || false,
        roomProductType: options.roomProductType,
        relatedAssignedUnitMap
      });
    } catch (error) {
      throw new BadRequestException(`Failed to calculate combined feature price: ${error.message}`);
    }
  }

  /**
   * Get room product retail features with room product info
   */
  async getRoomProductRetailFeatures(
    roomProductId: string,
    hotelId: string
  ): Promise<RoomProductRetailFeature[]> {
    return await this.roomProductRetailFeatureRepository.find({
      where: {
        roomProductId,
        hotelId,
        quantity: MoreThanOrEqual(1),
        retailFeature: {
          baseRate: Not(IsNull())
        }
      },
      select: {
        id: true,
        retailFeatureId: true,
        quantity: true,
        roomProduct: {
          id: true,
          code: true,
          name: true
        },
        retailFeature: {
          id: true,
          baseRate: true,
          name: true
        }
      },
      relations: ['retailFeature', 'roomProduct']
    });
  }

  /**
   * Calculate daily feature pricing
   */
  private async calculateDailyFeaturePrice(
    options: FeatureCalculationOptions
  ): Promise<DailyFeatureCalculationResult[]> {
    const { roomProductId, hotelId, fromDate, toDate } = options;
    const dates = Helper.generateDateRange(fromDate!, toDate!);

    // Parallel queries for better performance
    const [featureAdjustments, roomProductRetailFeatures] = await Promise.all([
      this.getRoomProductFeatureRateAdjustments(roomProductId, dates),
      this.getRoomProductRetailFeatures(roomProductId, hotelId)
    ]);

    if (roomProductRetailFeatures.length === 0) {
      const roomProductInfo = roomProductRetailFeatures.find(
        (rf) => rf.roomProductId === roomProductId
      )?.roomProduct;
      return dates.map((date) => ({
        date,
        featureBasedRate: 0,
        roomProductCode: roomProductInfo?.code || '',
        roomProductName: roomProductInfo?.name || ''
      }));
    }

    // Get room product info from the first feature (all should have same room product)
    const roomProductInfo = roomProductRetailFeatures[0].roomProduct;

    // Create efficient lookup map
    const dailyAdjustmentMap = new Map(
      featureAdjustments.map((fa) => [`${fa.featureId}_${fa.date}`, Number(fa.rateAdjustment)])
    );

    return dates.map((date) => ({
      date,
      featureBasedRate: this.calculateDateFeatureRate(
        roomProductRetailFeatures,
        dailyAdjustmentMap,
        date
      ),
      roomProductCode: roomProductInfo.code,
      roomProductName: roomProductInfo.name
    }));
  }

  /**
   * Calculate base feature pricing (no date range)
   */
  private async calculateBaseFeaturePrice(
    options: FeatureCalculationOptions
  ): Promise<FeatureCalculationResult | null> {
    const { roomProductId, hotelId } = options;

    const roomProductRetailFeatures = await this.getRoomProductRetailFeatures(
      roomProductId,
      hotelId
    );

    if (roomProductRetailFeatures.length === 0) {
      return null;
    }

    // Get room product info from the first feature (all should have same room product)
    const roomProductInfo = roomProductRetailFeatures.find(
      (rf) => rf.roomProduct.id === roomProductId
    )?.roomProduct;

    const featureBasedRate = roomProductRetailFeatures
      .map((rf) => Number(rf.retailFeature.baseRate) * (rf.quantity || 1))
      .reduce((acc, curr) => acc + curr, 0);

    return {
      featureBasedRate,
      roomProductCode: roomProductInfo?.code || '',
      roomProductName: roomProductInfo?.name || ''
    };
  }

  /**
   * Get feature rate adjustments for specific dates
   */
  private async getRoomProductFeatureRateAdjustments(roomProductId: string, dates: string[]) {
    try {
      return await this.roomProductFeatureRateAdjustmentRepository.find({
        where: {
          roomProductId,
          date: In(dates)
        },
        select: {
          rateAdjustment: true,
          featureId: true,
          date: true
        }
      });
    } catch (error) {
      this.logger.error(`Error fetching feature rate adjustments: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate feature rate for a specific date
   */
  private calculateDateFeatureRate(
    features: RoomProductRetailFeature[],
    adjustmentMap: Map<string, number>,
    date: string,
    pricingMethodAdjustmentValue?: number,
    pricingMethodAdjustmentUnit?: 'FIXED' | 'PERCENTAGE'
  ): number {
    return features
      .map((rf) => {
        const adjustmentKey = `${rf.id}_${date}`;
        const rate = adjustmentMap.get(adjustmentKey) || Number(rf.retailFeature.baseRate);
        const finalRate = DecimalRoundingHelper.calculatePriceAdjustment(
          rate,
          pricingMethodAdjustmentValue || 0,
          pricingMethodAdjustmentUnit || 'FIXED'
        );
        return finalRate * (rf.quantity || 1);
      })
      .reduce((acc, curr) => acc + curr, 0);
  }

  /**
   * Get related room product IDs through assigned units
   */
  private async getRelatedRoomProduct(roomProductId: string) {
    try {
      // Get assigned units for the room product
      const roomProductAssignedUnits = await this.roomProductAssignedUnitRepository.find({
        where: { roomProductId },
        select: { roomUnitId: true }
      });

      if (roomProductAssignedUnits.length === 0) {
        return [];
      }

      const unitIds = roomProductAssignedUnits.map((unit) => unit.roomUnitId);

      // Get related assigned units
      const relatedAssignedUnits = await this.roomProductAssignedUnitRepository.find({
        where: {
          roomUnitId: In(unitIds),
          roomProduct: {
            type: RoomProductType.RFC,
            status: RoomProductStatus.ACTIVE
          }
        },
        select: { roomProductId: true },
        relations: ['roomProduct']
      });

      return relatedAssignedUnits;


    } catch (error) {
      this.logger.error(`Error fetching related room product IDs: ${error.message}`);
      return [];
    }
  }

  /**
   * Combine multiple calculation results
   */
  private combineCalculationResults(
    input: {
      allResults: FeatureCalculationResult[][],
    isAverage: boolean,
    roomProductType: RoomProductType,
    relatedAssignedUnitMap: Map<string, RoomProductAssignedUnit[]>
    }
  ): FeatureCalculationResult[] {
    const { allResults, isAverage, roomProductType, relatedAssignedUnitMap } = input;
    if (allResults.length === 0) return [];

    // Handle single result case
    if (allResults[0].length === 1 && !allResults[0][0].date) {
      // Base calculation results
      const rates = allResults.map((results) => results[0]?.featureBasedRate || 0);


      

      const combinedRate = isAverage
        ? rates.reduce((acc, curr) => acc + curr, 0) / rates.length
        : rates.reduce((acc, curr) => acc + curr, 0);
      return [
        {
          featureBasedRate: combinedRate,
          roomProductCode: 'COMBINED',
          roomProductName: 'COMBINED',
          linkedRoomProducts: allResults
            .map((results) => results[0])
            .flat()
            .filter((result) => result !== undefined)
        }
      ];
    }

    // Handle daily calculation results
    const dateRateMap = new Map<
      string,
      { rates: number[]; roomProductInfo: { code: string; name: string } }
    >();

    for (const resultArray of allResults) {
      for (const result of resultArray) {
        if (result.date) {
          if (!dateRateMap.has(result.date)) {
            dateRateMap.set(result.date, {
              rates: [],
              roomProductInfo: { code: result.roomProductCode, name: result.roomProductName }
            });
          }
          dateRateMap.get(result.date)!.rates.push(result?.featureBasedRate || 0);
        }
      }
    }


 
    return Array.from(dateRateMap.entries()).map(([date, data]) => {

      if(isAverage) {

      }

      const combinedRate = isAverage
        ? data.rates.reduce((acc, curr) => acc + curr, 0) / data.rates.length
        : data.rates.reduce((acc, curr) => acc + curr, 0);

      return {
        date,
        featureBasedRate: combinedRate,
        roomProductCode: data.roomProductInfo.code,
        roomProductName: data.roomProductInfo.name
      };
    });
  }

  /**
   * Validate calculation options
   */
  private validateOptions(options: FeatureCalculationOptions): void {
    if (!options.roomProductId) {
      throw new BadRequestException('Room product ID is required');
    }

    if (!options.hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (options.useDaily && (!options.fromDate || !options.toDate)) {
      throw new BadRequestException('From date and to date are required for daily calculations');
    }

    if (options.fromDate && options.toDate && options.fromDate > options.toDate) {
      throw new BadRequestException('From date must be before or equal to to date');
    }
  }
}
