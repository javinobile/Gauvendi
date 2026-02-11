import { Injectable, Logger } from '@nestjs/common';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service';
import {
  DirectBookingHistoryItem,
  DirectRoomProductAvailable,
  ValueEmptyException
} from './recommendation-algorithm.types';
import {
  BookingFlowResponse,
  CapacityData,
  postprocessResponseBookingFlow
} from './postprocessing.utils';
import { MergedRequestsService } from './merged-requests.service';
import { RoomRequest } from './direct-product-pipeline.service';
import { cloneDeep } from 'lodash';
import { BookingFlow } from '@src/core/enums/common';
import { HotelPopularAiRecommendationSettingConfigValue } from '@src/core/entities/hotel-entities/hotel-configuration.entity';

@Injectable()
export class RecommendationPipelineService {
  private readonly logger = new Logger(RecommendationPipelineService.name);

  constructor(
    private readonly recommendationAlgorithmService: RecommendationAlgorithmService,
    private readonly mergedRequestsService: MergedRequestsService
  ) {}

  /**
   * Generate "Most Popular" room recommendations based on historical booking data.
   *
   * This pipeline identifies the most frequently booked room options based on the hotel's
   * booking history. It serves as the first component of the direct flow recommendation
   * system, providing customers with trusted choices that have been popular with other guests.
   *
   * The pipeline follows these steps:
   * 1. Validates the sale strategy configuration
   * 2. For each room request, identifies the most popular products that meet capacity requirements
   * 3. Combines these products into optimal room combinations
   * 4. Selects the highest-scoring combination as the "Most Popular" recommendation
   * 5. Formats the response for the booking engine
   */
  async pipelineMostPopular(
    listRoomProductAvailable: DirectRoomProductAvailable[],
    listBookingHistory: DirectBookingHistoryItem[],
    capacityData: CapacityData[][],
    mostPopularSaleStrategy: string[],
    listExcludeCombination: string[][],
    listRoomReq: RoomRequest[],
    lowestPrice: number,
    config?: HotelPopularAiRecommendationSettingConfigValue
  ): Promise<{
    combinations: string[][];
    basePrice: number;
    response: BookingFlowResponse;
  }> {
    // Initialize default response
    const response: BookingFlowResponse = {
      bookingFlow: 'mostPopular',
      recommendationList: {}
    };

    try {
      // If no sale strategy is provided, immediately return default response
      if (mostPopularSaleStrategy.length === 0) {
        return {
          combinations: [[]],
          basePrice: 0,
          response
        };
      }

      // For each capacity data array, get the most popular products using the sale strategy and booking history.
      // A deep copy of capacityData is used to avoid modifying the original data.
      let mostPopularResults: any[][] = [];

      for (let idxReq = 0; idxReq < capacityData.length; idxReq++) {
        const capacityDataCopy = cloneDeep(capacityData[idxReq]);
        const popularProducts =
          await this.recommendationAlgorithmService.getPopularProductWithPipeline(
            mostPopularSaleStrategy,
            listBookingHistory,
            capacityDataCopy,
            idxReq,
            'mostPopular',
            lowestPrice,
            config
          );
        mostPopularResults.push(popularProducts);
      }

      // filter mostPopularResults by fullfill request
      mostPopularResults = mostPopularResults.map((group, indexReq) =>
        group.filter((result) =>
          this.mergedRequestsService.canFulfillRequest(
            result,
            listRoomReq[indexReq].adults,
            listRoomReq[indexReq].children,
            listRoomReq[indexReq].pets
          )
        )
      );

      // Process the most popular results to generate combinations using the multiple room pipeline.
      const combinationResults = await this.recommendationAlgorithmService.multipleRoomPipeline(
        mostPopularSaleStrategy,
        mostPopularResults,
        listRoomProductAvailable,
        listExcludeCombination,
        [],
        null, // listCodeMatched
        'mostPopularScore'
      );

      if (!combinationResults || combinationResults.length === 0) {
        this.logger.warn('[Return] There are no results in Most Popular!');
        return {
          combinations: [[]],
          basePrice: 0,
          response
        };
      }

      // this.logger.debug(`Top 10 combinations: ${JSON.stringify(combinationResults.slice(0, 10))}`);

      // Select the top (first) combination from the generated combinations.
      const topCombination = combinationResults[0];
      const listCombination = [topCombination.combination];

      if (listCombination.length > 0 && listCombination[0].length > 0) {
        // Postprocess the selected combination to form a booking flow response.
        response.recommendationList['0'] = postprocessResponseBookingFlow(
          listCombination[0],
          capacityData
        );
      } else {
        this.logger.log(
          'No combination available in the Most Popular pipeline. Returning empty response.'
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
