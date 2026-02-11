import { Injectable, Logger } from '@nestjs/common';
import {
  DirectRoomProductAvailable,
  DirectBookingHistoryItem,
  ValueEmptyException,
  DirectProcessExecuteError
} from './recommendation-algorithm.types';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service';
import { PriceJumpService } from './price-jump.service';
import { MergedRequestsService } from './merged-requests.service';
import {
  BookingFlowResponse,
  CapacityData,
  postprocessResponseBookingFlow
} from './postprocessing.utils';
import { CapacityDataFrame } from './capacity-score.service';
import { cloneDeep } from 'lodash';

export interface RoomRequest {
  adults: number;
  children: number;
  pets: number;
  index?: number;
}

export interface DirectPipelineResult {
  combinations: string[][];
  response: BookingFlowResponse;
}

@Injectable()
export class DirectProductPipelineService {
  private readonly logger = new Logger(DirectProductPipelineService.name);

  constructor(
    private readonly recommendationAlgorithmService: RecommendationAlgorithmService,
    private readonly priceJumpService: PriceJumpService,
    private readonly mergedRequestsService: MergedRequestsService
  ) {}

  /**
   * Calculate the total base price for a combination of product codes.
   */
  calculateBasePrice(combination: string[], dictBasePrice: { [key: string]: number }): number {
    return combination.reduce((sum, code) => sum + (dictBasePrice[code] || 0), 0);
  }

  /**
   * Get all unique buildings from available products.
   */
  private getAllBuildings(listRoomProductAvailable: DirectRoomProductAvailable[]): string[] {
    const buildings = new Set<string>();
    listRoomProductAvailable.forEach((product) => {
      product.availableRoomDetails?.forEach((room) => {
        if (room.building) {
          buildings.add(room.building);
        }
      });
    });
    return Array.from(buildings);
  }

  /**
   * Filter capacity data to only include products available in a specific building.
   */
  private filterCapacityDataByBuilding(
    capacityData: CapacityData[][],
    building: string,
    productBuildingMap: Map<string, string[]>
  ): CapacityData[][] {
    return capacityData.map((group) =>
      group.filter((capacity) => {
        const productBuildings = productBuildingMap.get(capacity.productCode) || [];
        return productBuildings.includes(building);
      })
    );
  }

  /**
   * Check if filtered capacity data can fulfill all room requests.
   * Each request group must have at least one product option.
   */
  private canFulfillAllRequests(filteredCapacityData: CapacityData[][]): boolean {
    return filteredCapacityData.every((group) => group.length > 0);
  }

  /**
   * Get unique buildings for a combination of product codes.
   */
  private getBuildingsForCombination(
    combination: string[],
    productBuildingMap: Map<string, string[]>
  ): { buildings: string[]; isSameBuilding: boolean } {
    const allBuildings = new Set<string>();

    for (const code of combination) {
      const buildings = productBuildingMap.get(code) || [];
      buildings.forEach((b) => allBuildings.add(b));
    }

    const buildingList = Array.from(allBuildings);
    return {
      buildings: buildingList,
      isSameBuilding: buildingList.length <= 1
    };
  }

  /**
   * Generate combinations for given capacity data.
   */
  private async generateCombinationsForCapacityData(
    capacityData: CapacityData[][],
    mergedIndicesList: number[][][],
    directSaleStrategy: string[],
    listBookingHistory: DirectBookingHistoryItem[],
    listRoomProductAvailable: DirectRoomProductAvailable[],
    listExcludeCombination: string[][],
    listExcludeBasePrice: number[],
    listSpaceTypeReq: string[],
    dictBasePrice: { [key: string]: number },
    productBuildingMap: Map<string, string[]>,
    listMergedRequestsDfs?: CapacityData[][][]
  ): Promise<any[]> {
    const combinationResults: any[] = [];
    const dataToProcess = listMergedRequestsDfs || [capacityData];
    const indicesToProcess = mergedIndicesList;

    for (let idxGroup = 0; idxGroup < dataToProcess.length; idxGroup++) {
      const mergedReqDfs = dataToProcess[idxGroup];
      const mergedIndices = indicesToProcess[idxGroup] || capacityData.map((_, index) => [index]);

      // Generate popularity-scored results for each capacity requirement
      const mostPopularResults: any[][] = [];

      for (let idxReq = 0; idxReq < mergedReqDfs.length; idxReq++) {
        const capacityDataCopy = JSON.parse(JSON.stringify(mergedReqDfs[idxReq]));
        const popularProducts =
          await this.recommendationAlgorithmService.getPopularProductWithPipeline(
            directSaleStrategy,
            listBookingHistory,
            capacityDataCopy,
            idxReq,
            'direct',
            0
          );
        mostPopularResults.push(popularProducts);
      }

      // Generate combinations using the multiple room pipeline
      const combinationResult = await this.recommendationAlgorithmService.multipleRoomPipeline(
        directSaleStrategy,
        mostPopularResults,
        listRoomProductAvailable,
        listExcludeCombination,
        listExcludeBasePrice,
        null, // listCodeMatched
        'directScore'
      );

      if (!combinationResult || combinationResult.length === 0) {
        continue;
      }

      // Calculate the base price for each combination
      const processedResults = combinationResult.map((result) => {
        const buildingInfo = this.getBuildingsForCombination(
          result.combination,
          productBuildingMap
        );

        return {
          ...result,
          basePrice: this.calculateBasePrice(result.combination, dictBasePrice),
          directScore: result.value,
          idxGroup: idxGroup,
          mergedIndices: mergedIndices,
          isSameBuilding: buildingInfo.isSameBuilding,
          buildings: buildingInfo.buildings
        };
      });

      combinationResults.push(...processedResults);
    }

    return combinationResults;
  }

  /**
   * Generate direct product recommendations based on room requests and availability.
   */
  async pipelineDirectProduct(
    listRoomReq: RoomRequest[],
    listSpaceTypeReq: string[],
    priceJump: boolean,
    stayOptRcmNumber: number,
    directSaleStrategy: string[],
    listExcludeCombination: string[][],
    listExcludeBasePrice: number[],
    listRoomProductAvailable: DirectRoomProductAvailable[],
    capacityData: CapacityData[][],
    listBookingHistory: DirectBookingHistoryItem[]
  ): Promise<DirectPipelineResult> {
    try {
      // Initialize the default response
      const response: BookingFlowResponse = {
        bookingFlow: 'direct',
        recommendationList: {}
      };

      // If no direct sale strategy is provided, return empty results
      if (directSaleStrategy.length === 0) {
        return {
          combinations: [[]],
          response
        };
      }

      let listMergedRequestsDfs: CapacityData[][][] = [];
      let topMergedIndices: number[][][] = [];

      if (listRoomReq.length > 1) {
        // Process merged requests when there are multiple room requests
        const mergedRequestsResult = await this.mergedRequestsService.getMergedRequests(
          listRoomReq,
          listRoomProductAvailable,
          directSaleStrategy
        );

        listMergedRequestsDfs = mergedRequestsResult.mergedCapacityDfs;
        topMergedIndices = mergedRequestsResult.mergedIndices;

        // Append default request (individual rooms) as the first option
        listMergedRequestsDfs.unshift(capacityData);
        topMergedIndices.unshift(capacityData.map((_, index) => [index]));
      } else {
        // Process merged requests when there are multiple room requests
        const mergedRequestsResult = await this.mergedRequestsService.getMergedRequests(
          listRoomReq,
          listRoomProductAvailable,
          directSaleStrategy
        );

        listMergedRequestsDfs = mergedRequestsResult.mergedCapacityDfs;
        topMergedIndices = mergedRequestsResult.mergedIndices;

        // Append default request (individual rooms) as the first option
        listMergedRequestsDfs.unshift(capacityData);
        topMergedIndices.unshift(capacityData.map((_, index) => [index]));
      }

      // Create a mapping of product codes to base prices
      const dictBasePrice: { [key: string]: number } = {};
      listRoomProductAvailable.forEach((product) => {
        dictBasePrice[product.code] = product.basePrice || 0;
      });

      const combinationResults: any[] = [];

      for (let idxGroup = 0; idxGroup < listMergedRequestsDfs.length; idxGroup++) {
        const mergedReqDfs = listMergedRequestsDfs[idxGroup];
        const mergedIndices = topMergedIndices[idxGroup];

        const iterationStart = Date.now();

        // Generate popularity-scored results for each capacity requirement
        const directResults: any[][] = [];

        for (let idxReq = 0; idxReq < mergedReqDfs.length; idxReq++) {
          const capacityDataCopy = cloneDeep(mergedReqDfs[idxReq]);
          const directProducts =
            await this.recommendationAlgorithmService.getPopularProductWithPipeline(
              directSaleStrategy,
              listBookingHistory,
              capacityDataCopy,
              idxReq,
              'direct',
              0
            );
          directResults.push(directProducts);
        }

        // Generate combinations using the multiple room pipeline
        const combinationResult = await this.recommendationAlgorithmService.multipleRoomPipeline(
          directSaleStrategy,
          directResults,
          listRoomProductAvailable,
          listExcludeCombination,
          listExcludeBasePrice,
          null, // listCodeMatched
          'directScore'
        );

        if (!combinationResult || combinationResult.length === 0) {
          continue;
        }

        // Calculate the base price for each combination
        const processedResults = combinationResult.map((result) => ({
          ...result,
          basePrice: this.calculateBasePrice(result.combination, dictBasePrice),
          directScore: result.value, // Rename value to directScore
          idxGroup: idxGroup,
          mergedIndices: mergedIndices
        }));

        combinationResults.push(...processedResults);
      }

      if (combinationResults.length === 0) {
        return {
          combinations: [[]],
          response
        };
      }

      // Apply price jump logic to optimize or re-rank combinations
      const priceJumpResult = await this.priceJumpService.priceJumpExecute(
        priceJump,
        combinationResults,
        listExcludeBasePrice,
        stayOptRcmNumber - 2, // Adjust target number for other recommendations
        'popular',
        'directScore'
      );

      const listCombination = priceJumpResult.combination;
      const listIdxGroup = priceJumpResult.idxGroup;

      // Format the response for each selected combination
      if (listCombination && listCombination.length > 0) {
        for (let i = 0; i < listCombination.length; i++) {
          const combination = listCombination[i];
          const idxGroup = listIdxGroup[i];
          if (combination.length === 0) {
            continue;
          }

          // console.log('listMergedRequestsDfs', listMergedRequestsDfs[idxGroup]);
          response.recommendationList[i.toString()] = postprocessResponseBookingFlow(
            combination,
            listMergedRequestsDfs[idxGroup]
          );
        }
      } else {
      }

      return {
        combinations: listCombination || [[]],
        response
      };
    } catch (error) {
      if (error instanceof ValueEmptyException) {
        this.logger.error('Value is unexpectedly empty');
        this.logger.log(error.message);
        return {
          combinations: [[]],
          response: { bookingFlow: 'direct', recommendationList: {} }
        };
      }

      this.logger.error('An error occurred in the direct product pipeline');
      this.logger.error(`Detail Error: ${error.stack}`);
      return {
        combinations: [[]],
        response: { bookingFlow: 'direct', recommendationList: {} }
      };
    }
  }
}
