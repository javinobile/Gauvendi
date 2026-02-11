import { Injectable, Logger } from '@nestjs/common';
import { cloneDeep } from 'lodash';
import { RoomRequest } from './direct-product-pipeline.service';
import { MergedRequestsService } from './merged-requests.service';
import {
  BookingFlowResponse,
  CapacityData,
  postprocessResponseBookingFlow
} from './postprocessing.utils';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service';
import {
  DirectBookingHistoryItem,
  DirectEventItem,
  DirectFeatureItem,
  DirectOurTipPopularity,
  DirectOurTipRow,
  DirectProcessExecuteError,
  DirectRoomProductAvailable,
  DirectRoomProductItem,
  ValueEmptyException
} from './recommendation-algorithm.types';
import {
  applyEventToFeatureList,
  counter,
  getObjectInformation
} from './recommendation-algorithm.utils';
import { HotelOurTipAiRecommendationSettingConfigValue } from '@src/core/entities/hotel-entities/hotel-configuration.entity';

@Injectable()
export class OurTipService {
  private readonly logger = new Logger(OurTipService.name);

  constructor(
    private readonly recommendationAlgorithmService: RecommendationAlgorithmService,
    private readonly mergedRequestsService: MergedRequestsService
  ) {}

  /**
   * Calculate popularity score for Our Tip recommendation
   */
  calculatePopularityForOurTip(
    row: DirectOurTipRow,
    mergedData: any[],
    countFeatPopularity: Map<number, number>
  ): number {
    // Compute high popularity scores for 5-star and 4-star features, if available
    let popularity5Score = 0;
    let popularity4Score = 0;

    if (countFeatPopularity.has(5)) {
      popularity5Score = row['highPopularity5*'] / countFeatPopularity.get(5)!;
    }

    if (countFeatPopularity.has(4)) {
      popularity4Score = row['highPopularity4*'] / countFeatPopularity.get(4)!;
    }

    // Normalize product popularity using min-max normalization
    const popularityValues = mergedData
      .map((item) => item.productPopularity)
      .filter((val) => val !== null && val !== undefined);
    const minPopularity = Math.min(...popularityValues);
    const maxPopularity = Math.max(...popularityValues);

    let productPopularityScore = 0;
    if (minPopularity === maxPopularity) {
      productPopularityScore = Math.min(1, Math.max(0, minPopularity));
    } else {
      productPopularityScore = row.productPopularity / maxPopularity;
    }

    // The capacity score acts as a penalty factor
    const penaltyScore = row.capacityScore;

    // Compute the final Our Tip score as a weighted sum of all components, then apply the penalty
    const ourTipScore =
      (popularity5Score * 0.4 + popularity4Score * 0.2 + productPopularityScore * 0.4) *
      penaltyScore;

    return ourTipScore;
  }

  /**
   * Get Our Tip recommendations for a specific capacity dataset
   */
  async getOurTip(
    ourTipSaleStrategy: string[],
    capacityData: CapacityData[],
    listFeat: DirectFeatureItem[],
    listFeatEvent: DirectEventItem[],
    listRoomProductList: DirectRoomProductItem[],
    idxReq: number
  ): Promise<any[]> {
    try {
      // Filter capacity data based on the sale strategy criteria
      let filteredCapacityData = cloneDeep(capacityData).filter((item) =>
        ourTipSaleStrategy.includes(item.type)
      );

      // Remove restricted products
      filteredCapacityData = filteredCapacityData.filter((item) => !item.isRestricted);

      if (filteredCapacityData.length === 0) {
        this.logger.warn(`With index ${idxReq} - OurTip have no product.`);
        // throw new ValueEmptyException(`With index ${idxReq} - OurTip have no product.`);
        return [];
      }

      // Count the popularity of features from the hotel information
      const popularityCounter = counter(listFeat.map((feat) => feat.popularity));
      const countFeatPopularity = new Map<number, number>();
      popularityCounter.forEach((count, popularity) => {
        countFeatPopularity.set(popularity, count);
      });

      // Count event features (if multiple events have the same feature, they have higher priority)
      const countEventFeat = new Map<string, number>();
      listFeatEvent.forEach((event) => {
        event.featureList.forEach((feature) => {
          countEventFeat.set(feature, (countEventFeat.get(feature) || 0) + 1);
        });
      });

      // Apply event features to update the feature list with higher popularity
      const currentFeatureList = applyEventToFeatureList(countEventFeat, listFeat);

      // Create dictionaries mapping feature names to their popularity and selection values
      const featurePopularity: { [key: string]: number } = {};
      listFeat.forEach((item) => {
        featurePopularity[item.code] = item.popularity;
      });

      const currentFeaturePopularity: { [key: string]: number } = {};
      currentFeatureList.forEach((item) => {
        currentFeaturePopularity[item.code] = item.popularity;
      });

      // Build the Our Tip product list by processing each available room product
      const ourTipPopularityList: DirectOurTipPopularity[] = [];

      for (const product of listRoomProductList) {
        // Calculate high feature popularity counts (for 5-star and 4-star features)
        const highFeaturePopularityValues = getObjectInformation(
          product.featureList,
          featurePopularity
        );
        const highFeaturePopularityCounter = counter(highFeaturePopularityValues);

        // Calculate total feature popularity for the product
        const productPopularityValues = getObjectInformation(
          product.featureList,
          currentFeaturePopularity
        );
        const productPopularity = productPopularityValues.reduce((sum, val) => sum + val, 0);

        // Summarize the computed information into a dictionary
        const ourTipPopularity: DirectOurTipPopularity = {
          productCode: product.code,
          'highPopularity5*': highFeaturePopularityCounter.get(5) || 0,
          'highPopularity4*': highFeaturePopularityCounter.get(4) || 0,
          productPopularity
        };
        ourTipPopularityList.push(ourTipPopularity);
      }

      // Merge the capacity data with the Our Tip popularity data
      const mergedData = filteredCapacityData.map((capacity) => {
        const popularity = ourTipPopularityList.find(
          (item) => item.productCode === capacity.productCode
        );
        return {
          ...capacity,
          ...popularity,
          'highPopularity5*': popularity?.['highPopularity5*'] || 0,
          'highPopularity4*': popularity?.['highPopularity4*'] || 0,
          productPopularity: popularity?.productPopularity || 0
        };
      });

      // this.logger.debug(`Merged data (top 10): ${JSON.stringify(mergedData.slice(0, 10))}`);

      // Calculate the Our Tip popularity score for each product
      // this.logger.log(`Calculate Our Tip product popularity score in index request ${idxReq} ...`);

      const mergedDataWithScores = mergedData.map((item) => {
        const ourTipRow: DirectOurTipRow = {
          ...item,
          'highPopularity5*': item['highPopularity5*'],
          'highPopularity4*': item['highPopularity4*'],
          productPopularity: item.productPopularity,
          popularScore: 0, // Not used in Our Tip calculation, only needed for interface compatibility
          historyScore: 0, // Not used in Our Tip calculation, only needed for interface compatibility
          periodScore: 0, // Not used in Our Tip calculation, only needed for interface compatibility
          sameBookingPeriod: 0, // Not used in Our Tip calculation, only needed for interface compatibility
          totalHistoryBookingTime: 0, // Not used in Our Tip calculation, only needed for interface compatibility
          mergedIndices: item.mergedIndices || [], // Fix the undefined issue
          ourTipScore: 0 // Will be calculated immediately below
        };

        const score = this.calculatePopularityForOurTip(ourTipRow, mergedData, countFeatPopularity);

        return {
          ...item,
          ourTipScore: score
        };
      });

      // Sort products by the Our Tip score in descending order
      const ourTipData = mergedDataWithScores.sort((a, b) => b.ourTipScore - a.ourTipScore);

      return ourTipData;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      if (error instanceof ValueEmptyException) {
        throw error;
      }
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Execute the pipeline to generate 'Our Tip' room product recommendations.
   */
  async pipelineOurTip(
    listRoomProductAvailable: DirectRoomProductAvailable[],
    capacityData: CapacityData[][],
    ourTipSaleStrategy: string[],
    listBookingHistory: DirectBookingHistoryItem[],
    listExcludeCombination: string[][],
    listExcludeBasePrice: number[],
    listRoomReq: RoomRequest[],
    lowestPrice: number
  ): Promise<{
    combinations: string[][];
    basePrice: number;
    response: BookingFlowResponse;
  }> {
    // Initialize a default response
    const response: BookingFlowResponse = {
      bookingFlow: 'ourTip',
      recommendationList: {}
    };

    try {
      // If no sale strategy is provided, return an empty result immediately
      if (ourTipSaleStrategy.length === 0) {
        return {
          combinations: [[]],
          basePrice: 0,
          response
        };
      }

      // For each capacity data array, generate the Our Tip product recommendations
      let ourTipResults: any[][] = [];

      for (let idxReq = 0; idxReq < capacityData.length; idxReq++) {
        const capacityDataCopy = cloneDeep(capacityData[idxReq]);

        const ourTipData = await this.recommendationAlgorithmService.getPopularProductWithPipeline(
          ourTipSaleStrategy,
          listBookingHistory,
          capacityDataCopy,
          idxReq,
          'ourTip',
          lowestPrice
        );
        ourTipResults.push(ourTipData);
      }

      // filter ourTipResults by fullfill request
      ourTipResults = ourTipResults.map((group, indexReq) =>
        group.filter((result) =>
          this.mergedRequestsService.canFulfillRequest(
            result,
            listRoomReq[indexReq].adults,
            listRoomReq[indexReq].children,
            listRoomReq[indexReq].pets
          )
        )
      );

      // Use the multiple room pipeline to generate combinations based on the Our Tip score
      const combinationResults = await this.recommendationAlgorithmService.multipleRoomPipeline(
        ourTipSaleStrategy,
        ourTipResults,
        listRoomProductAvailable,
        listExcludeCombination,
        listExcludeBasePrice,
        null, // listCodeMatched
        'ourTipScore'
      );

      if (!combinationResults || combinationResults.length === 0) {
        this.logger.warn('[Return] There are no results in Our Tip !');
        return {
          combinations: [[]],
          basePrice: 0,
          response
        };
      }

      // this.logger.debug(`Top 10 combinations: ${JSON.stringify(combinationResults.slice(0, 10))}`);

      // Select the top combination from the generated combinations
      const topCombination = combinationResults[0];
      const listCombination = [topCombination.combination];

      if (listCombination.length > 0 && listCombination[0].length > 0) {
        // Postprocess the selected combination to create the booking flow response
        // this.logger.log('Postprocessing response in Our Tip.');
        response.recommendationList['0'] = postprocessResponseBookingFlow(
          listCombination[0],
          capacityData
        );
      } else {
        this.logger.log(
          'No combination available in the Our Tip pipeline. Returning empty response.'
        );
      }

      // Calculate base price for the selected combination
      const roomPriceMap = new Map<string, number>();
      listRoomProductAvailable.forEach((room) => {
        roomPriceMap.set(room.code, room.basePrice || 0);
      });

      const combination = listCombination[0];
      const basePrice = combination.reduce((sum, roomCode) => {
        return sum + (roomPriceMap.get(roomCode) || 0);
      }, 0);

      return {
        combinations: listCombination,
        basePrice,
        response
      };
    } catch (error) {
      if (error instanceof ValueEmptyException) {
        // Log and handle cases where a value is unexpectedly empty, returning default empty results
        this.logger.log(error.message);
        return {
          combinations: [[]],
          basePrice: 0,
          response
        };
      }

      this.logger.error(`Summary Error: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      return {
        combinations: [[]],
        basePrice: 0,
        response
      };
    }
  }
}
