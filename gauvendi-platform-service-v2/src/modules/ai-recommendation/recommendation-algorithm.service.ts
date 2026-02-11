import { Injectable, Logger } from '@nestjs/common';
import { cloneDeep } from 'lodash';
import {
  CodeRoomAvailable,
  DirectBestCombinations,
  DirectBookingHistoryItem,
  DirectCapacityItem,
  DirectCombinationResult,
  DirectOptimizationParams,
  DirectPipeline,
  DirectProcessExecuteError,
  DirectRoomProductAvailable,
  DirectScoreRow,
  DirectScoreType,
  ValueEmptyException
} from './recommendation-algorithm.types';
import {
  calculateDirectScore,
  calculateMinMaxScore,
  checkMatched,
  checkRestricted,
  checkSameRatePlan,
  counter,
  countersEqual,
  deepCopy,
  getEnv,
  mergeDataFrames
} from './recommendation-algorithm.utils';
import { runOptimizationIterative } from './postprocessing.utils';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import {
  HotelOurTipAiRecommendationSettingConfigValue,
  HotelPopularAiRecommendationSettingConfigValue
} from '@src/core/entities/hotel-entities/hotel-configuration.entity';

@Injectable()
export class RecommendationAlgorithmService {
  private readonly logger = new Logger(RecommendationAlgorithmService.name);

  // Constants
  private readonly LIMIT_MOST_POPULAR = Number(getEnv('LIMIT_MOST_POPULAR', 10));
  private readonly LIMIT_OUR_TIP = Number(getEnv('LIMIT_OUR_TIP', 2));
  private readonly LIMIT_MATCHING = Number(getEnv('LIMIT_MATCHING', 12));
  private readonly LIMIT_DIRECT = Number(getEnv('LIMIT_DIRECT', 300));
  private readonly MAX_COMBINATIONS = Number(getEnv('MAX_COMBINATIONS', 1000000));
  private readonly MAX_RESTRICTED = 12;
  private readonly TOP_K = 10000;

  constructor(private configService: ConfigService) {}

  /**
   * Generate a list of products with computed popularity scores.
   */
  async getPopularProductWithPipeline(
    saleStrategy: string[],
    listBookingHistory: DirectBookingHistoryItem[],
    capacityData: DirectCapacityItem[],
    idxReq: number,
    pipeline: DirectPipeline = 'mostPopular',
    lowestPrice: number,
    config: HotelPopularAiRecommendationSettingConfigValue = {
      popularRate: 0.3,
      periodRate: 0.2,
      historyRate: 0.2,
      priceRate: 0.6
    }
  ): Promise<any[]> {
    try {
      // Filter capacity data based on the provided sale strategy types
      let filteredCapacityData = capacityData.filter((item) => saleStrategy.includes(item.type));

      // Remove restricted products for mostPopular pipeline
      if (pipeline === 'mostPopular') {
        filteredCapacityData = filteredCapacityData.filter((item) => !item.isRestricted);
      }

      if (filteredCapacityData.length === 0) {
        this.logger.warn(`With index ${idxReq} - Most Popular Product have no product.`);
        // throw new ValueEmptyException(
        //   `With index ${idxReq} - Most Popular Product have no product.`
        // );

        return [];
      }

      // Merge capacity data with booking history
      const mergedData = mergeDataFrames(filteredCapacityData, listBookingHistory);

      let popularData: any[];

      if (mergedData.length === 1) {
        mergedData[0][`${pipeline}Score`] = 0.99;
        popularData = mergedData;
      } else {
        // -------------------- CONFIG --------------------
        const PIPELINE_CONFIG = {
          mostPopular: {
            minPct: 0.1,
            maxPct: 0.3,
            scoreKey: 'mostPopularScore'
          },
          ourTip: {
            minPct: 0.1,
            maxPct: 0.5,
            scoreKey: 'ourTipScore'
          },
          direct: {
            scoreKey: 'directScore'
          }
        };

        // -------------------- MAIN LOGIC --------------------
        const sortKeys = [
          'capacityScore',
          'sameBookingPeriod',
          'totalHistoryBookingTime',
          'productPopularity'
        ];
        // Step 1: Sort raw data
        mergedData.sort((a, b) => {
          for (const key of sortKeys) {
            const diff = b[key] - a[key];
            if (diff !== 0) return diff;
          }
          return 0;
        });

        // Step 2: Normalize scores
        const copyData = deepCopy(mergedData);

        mergedData.forEach((item) => {
          item.popularScore = calculateMinMaxScore(
            item.productPopularity,
            copyData,
            'productPopularity'
          );

          item.periodScore = calculateMinMaxScore(
            item.sameBookingPeriod,
            copyData,
            'sameBookingPeriod'
          );

          item.historyScore = calculateMinMaxScore(
            item.totalHistoryBookingTime,
            copyData,
            'totalHistoryBookingTime'
          );

          // Apply price score only for pipelines that need pricing
          if (pipeline !== 'direct') {
            const { minPct, maxPct } = PIPELINE_CONFIG[pipeline];
            item.priceScore = this.calculatePriceScore(
              item,
              lowestPrice,
              mergedData,
              minPct,
              maxPct
            );
          }
        });

        // -------------------- PIPELINE HANDLING --------------------
        if (pipeline === 'direct') {
          mergedData.forEach((item) => {
            item.directScore = calculateDirectScore(item);
          });

          return mergedData.sort((a, b) => b.directScore - a.directScore);
        }

        // ----- Shared scoring logic for: mostPopular & ourTip -----
        const { minPct, maxPct, scoreKey } = PIPELINE_CONFIG[pipeline];

        // Step 3: Compute final weighted score
        mergedData.forEach((item) => {
          item[scoreKey] =
            item.popularScore * config.popularRate +
            item.periodScore * config.periodRate +
            item.historyScore * config.historyRate +
            item.priceScore * config.priceRate;
        });

        // Step 4: Sort by capacityScore (pre-sort logic)
        let result = mergedData.sort((a, b) => b.capacityScore - a.capacityScore);

        // get 10 items with highest capacityScore
        let top10 = result.slice(0, 10);

        // Step 5: Apply buffing (only if lowest price exists)
        if (lowestPrice > 0) {
          top10 = this.applyBuffScore(top10, lowestPrice, minPct, maxPct, scoreKey);
        }

        // Step 6: Final sort by weighted pipeline score
        popularData = top10.sort((a, b) => b[scoreKey] - a[scoreKey]);

        // step 7: sort again by capacityScore
        popularData = [
          ...top10,
          ...result.slice(10).sort((a, b) => b.capacityScore - a.capacityScore)
        ];
      }

      return popularData;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      if (error instanceof ValueEmptyException) {
        throw error;
      }
      throw new DirectProcessExecuteError(error.message);
    }
  }

  private applyBuffScore(
    popularData: any[],
    lowestPrice: number,
    minPct: number,
    maxPct: number,
    scoreKey: string
  ): any[] {
    if (!lowestPrice) return popularData;

    return popularData.map((item) => {
      const price = Number(item.price);
      let score = Number(item[scoreKey]);

      if (isNaN(price)) return item;

      // Initialize score if NaN
      if (isNaN(score)) score = 0;

      const diffRatio = (price - lowestPrice) / lowestPrice;

      // ✔ Item is in the 10–30% above lowest range
      const isMostPopular = diffRatio >= minPct && diffRatio <= maxPct;

      if (isMostPopular) {
        const buffMultiplier = 1 + diffRatio;
        item[scoreKey] = score * buffMultiplier;
      } else {
        item[scoreKey] = score;
      }

      return item;
    });
  }

  private calculatePriceScore(
    item: any,
    lowestPrice: number,
    allData: any[],
    minPct: number,
    maxPct: number
  ): number {
    const price = Number(item.price);
    if (!lowestPrice || lowestPrice <= 0 || isNaN(price)) return 0;

    const diffRatio = (price - lowestPrice) / lowestPrice;

    // Only count items within defined range
    if (diffRatio < minPct || diffRatio > maxPct) return 0;

    const validDiffs = allData
      .map((i) => (Number(i.price) - lowestPrice) / lowestPrice)
      .filter((r) => r >= minPct && r <= maxPct);

    if (validDiffs.length === 0) return 0;

    const minDiff = Math.min(...validDiffs);
    const maxDiff = Math.max(...validDiffs);

    if (minDiff === maxDiff) return 1;

    return (diffRatio - minDiff) / (maxDiff - minDiff);
  }

  /**
   * Computes the total score for multiple room allocations and finds
   * the optimal unique code combinations with the highest scores.
   */
  multipleRoomTotalScoreWithCodeOptimized(
    listScorePerIndex: number[][],
    listCodePerIndexReq: string[][],
    codeRoomAvailable?: CodeRoomAvailable,
    listExcludeBasePrice?: number[]
  ): DirectCombinationResult[] {
    const topK = Number(this.configService.get<number>(ENVIRONMENT.MAX_MULTI_ROOMS_SCORES)) || 100;
    // recommended top K
    const ndim = listScorePerIndex.length;

    /** Pre-calc max remaining score for branch & bound */
    const maxRemainingScore: number[] = new Array(ndim + 1).fill(0);
    for (let i = ndim - 1; i >= 0; i--) {
      maxRemainingScore[i] = maxRemainingScore[i + 1] + Math.max(...listScorePerIndex[i]);
    }

    /** Pre-compute excluded base prices set for O(1) lookup */
    const excludedBasePriceSet = new Set(listExcludeBasePrice || []);

    /** Keep only Top-K best results (min-first) */
    const bestResults: DirectCombinationResult[] = [];

    const tryInsert = (combo: string[], score: number) => {
      // Check if combination's total base price is in excluded list
      if (excludedBasePriceSet.size > 0 && codeRoomAvailable) {
        const totalBasePrice = combo.reduce((sum, code) => {
          return sum + (codeRoomAvailable[code]?.basePrice || 0);
        }, 0);

        if (excludedBasePriceSet.has(totalBasePrice)) {
          return; // Skip combination with excluded base price
        }
      }

      if (bestResults.length < topK) {
        bestResults.push({ combination: [...combo], value: score });
        bestResults.sort((a, b) => a.value - b.value);
        return;
      }

      if (score > bestResults[0].value) {
        bestResults[0] = { combination: [...combo], value: score };
        bestResults.sort((a, b) => a.value - b.value);
      }
    };

    const backtrack = (
      index: number,
      currentCombo: string[],
      usedCodes: Set<string>,
      currentScore: number
    ) => {
      /** Branch & Bound */
      if (
        bestResults.length === topK &&
        currentScore + maxRemainingScore[index] <= bestResults[0].value
      ) {
        return;
      }

      if (index === ndim) {
        tryInsert(currentCombo, currentScore);
        return;
      }

      const codes = listCodePerIndexReq[index];
      const scores = listScorePerIndex[index];

      for (let i = 0; i < codes.length; i++) {
        const roomCode = codes[i];

        // Unique room constraint
        if (usedCodes.has(roomCode)) continue;

        // Availability constraint
        if (codeRoomAvailable && !codeRoomAvailable[roomCode]) continue;

        currentCombo.push(roomCode);
        usedCodes.add(roomCode);

        backtrack(index + 1, currentCombo, usedCodes, currentScore + scores[i]);

        currentCombo.pop();
        usedCodes.delete(roomCode);
      }
    };

    backtrack(0, [], new Set<string>(), 0);

    /** Return sorted by score desc */
    return bestResults.sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate maximum possible score from topMatchDfs data
   */
  private calculateMaxPossibleScore(topMatchDfs: any[], scoreType: DirectScoreType): number {
    if (!topMatchDfs || topMatchDfs.length === 0) return 0;

    // Find the maximum score for each request slot
    return topMatchDfs.reduce((total, matchData) => {
      if (!matchData || matchData.length === 0) return total;

      const maxScore = Math.max(...matchData.map((item: any) => item[scoreType] || 0));
      return total + maxScore;
    }, 0);
  }

  /**
   * Get score for a specific room code from topMatchDfs
   */
  private getScoreForCode(
    code: string,
    slotIndex: number,
    params: DirectOptimizationParams
  ): number {
    const matchData = params.topMatchDfs[slotIndex];
    if (!matchData || matchData.length === 0) return 0;

    const item = matchData.find((item: any) => item.productCode === code);
    return item ? item[params.scoreType] || 0 : 0;
  }

  /**
   * Calculate remaining maximum possible score for optimization pruning
   */
  private calculateRemainingMaxScore(slotIndex: number, params: DirectOptimizationParams): number {
    let remainingScore = 0;

    for (let i = slotIndex + 1; i < params.topMatchDfs.length; i++) {
      const matchData = params.topMatchDfs[i];
      if (matchData && matchData.length > 0) {
        const maxScore = Math.max(...matchData.map((item: any) => item[params.scoreType] || 0));
        remainingScore += maxScore;
      }
    }

    return remainingScore;
  }

  /**
   * Process multiple room data pipelines to generate a final list of room combinations.
   */
  async multipleRoomPipeline(
    saleStrategy: string[],
    topMatchDfs: any[],
    listRoomProductAvailable: DirectRoomProductAvailable[],
    listExcludeCombination: string[][],
    listExcludeBasePrice: number[],
    listCodeMatched: string[] | null = null,
    scoreType: DirectScoreType = 'mostPopularScore'
  ): Promise<DirectCombinationResult[] | null> {
    try {
      const maxRestricted = {
        mostPopularScore: this.LIMIT_MOST_POPULAR,
        ourTipScore: this.LIMIT_MOST_POPULAR,
        compareMatchingScore: this.LIMIT_MATCHING,
        directScore: this.LIMIT_DIRECT
      };

      // Prepare data structures
      const roomProductAvailabilityMap = new Map<string, DirectRoomProductAvailable>();

      listRoomProductAvailable.forEach((product) => {
        roomProductAvailabilityMap.set(product.code, product);
      });

      // Build rate plan code mapping for validation
      const roomProductRatePlanMap = new Map<string, string | undefined>();
      listRoomProductAvailable.forEach((product) => {
        roomProductRatePlanMap.set(product.code, product.ratePlanCode);
      });

      // Build code room available mapping
      const codeRoomAvailable: CodeRoomAvailable = {};
      listRoomProductAvailable.forEach((product) => {
        codeRoomAvailable[product.code] = {
          availableRoomIds: product.availableRoomIds,
          availableToSell: product.availableToSell,
          isRestricted: product.isRestricted,
          allocationType: product.allocationType,
          basePrice: product.basePrice || 0,
          building: product.availableRoomDetails[0].building
        };
      });

      const finalCombinationResults: DirectCombinationResult[] = [];

      // Pre-build maxCountsConstraint once (reused across iterations)
      const maxCountsConstraint: { [key: string]: number } = {};
      listRoomProductAvailable.forEach((product) => {
        maxCountsConstraint[product.code] = Math.min(product.availableToSell, 1);
      });
      const defaultMaxCount = 1;

      // Process each sale strategy type separately
      for (const type of saleStrategy) {
        const listCodePerIndexReq: string[][] = [];

        // Process each room request separately to ensure different room products
        for (let reqIndex = 0; reqIndex < topMatchDfs.length; reqIndex++) {
          const combinationData = topMatchDfs[reqIndex];
          // Filter rows matching the current sale strategy type
          const topMatchData = combinationData.filter((item: any) => item.type === type);

          if (topMatchData.length > 0) {
            listCodePerIndexReq.push(topMatchData.map((item: any) => item.productCode));
          } else {
            // If no products available for this request and type, skip this type entirely
            // this.logger.warn(`No products available for request ${reqIndex} with type ${type}`);
            continue;
          }
        }

        // Skip this type if we don't have products for all requests
        if (listCodePerIndexReq.length !== topMatchDfs.length) {
          //   this.logger.warn(
          //     `Skipping type ${type} - not enough products for all ${topMatchDfs.length} requests`
          //   );
          continue;
        }

        let combinationResults: DirectCombinationResult[] | null = null;

        // Determine whether to use optimization or direct calculation
        const totalCombination = listCodePerIndexReq.reduce((acc, list) => acc * list.length, 1);
        const shouldUseOptimization =
          scoreType === 'directScore' || scoreType === 'compareMatchingScore'
            ? totalCombination > this.MAX_COMBINATIONS
            : true;

        if (shouldUseOptimization) {
          // Use optimization algorithm for large combination spaces
          // combinationResults = runOptimizationIterative({
          //   topMatchDfs,
          //   listExcludeCombination,
          //   listExcludeBasePrice,
          //   roomProductAvailabilityMap,
          //   codeRoomAvailable,
          //   sortedCodes: listCodePerIndexReq,
          //   scoreType,
          //   defaultMaxCount,
          //   maxCountsConstraint,
          //   maxRestricted: maxRestricted[scoreType] || this.MAX_RESTRICTED
          // });
          const listScorePerIndexReq: number[][] = [];

          // Build score lookup maps once per request (O(n) instead of O(n²))
          for (let reqIndex = 0; reqIndex < topMatchDfs.length; reqIndex++) {
            const matchData = topMatchDfs[reqIndex];
            const codes = listCodePerIndexReq[reqIndex];

            // Create Map for O(1) lookup instead of O(n) find
            const scoreMap = new Map<string, number>();
            matchData.forEach((item: any) => {
              scoreMap.set(item.productCode, item[scoreType] || 0);
            });

            const scores = codes.map((code) => scoreMap.get(code) || 0);
            listScorePerIndexReq.push(scores);
          }

          combinationResults = this.multipleRoomTotalScoreWithCodeOptimized(
            listScorePerIndexReq,
            listCodePerIndexReq,
            codeRoomAvailable,
            listExcludeBasePrice
          );
        } else {
          // For small combinations, calculate scores directly - more efficient
          const listScorePerIndexReq: number[][] = [];

          // Build score lookup maps once per request (O(n) instead of O(n²))
          for (let reqIndex = 0; reqIndex < topMatchDfs.length; reqIndex++) {
            const matchData = topMatchDfs[reqIndex];
            const codes = listCodePerIndexReq[reqIndex];

            // Create Map for O(1) lookup instead of O(n) find
            const scoreMap = new Map<string, number>();
            matchData.forEach((item: any) => {
              scoreMap.set(item.productCode, item[scoreType] || 0);
            });

            const scores = codes.map((code) => scoreMap.get(code) || 0);
            listScorePerIndexReq.push(scores);
          }

          combinationResults = this.multipleRoomTotalScoreWithCodeOptimized(
            listScorePerIndexReq,
            listCodePerIndexReq,
            codeRoomAvailable,
            listExcludeBasePrice
          );
        }

        if (!combinationResults || combinationResults.length === 0) {
          continue;
        }

        // Apply validation filters
        let filteredResults = cloneDeep(combinationResults);

        if (filteredResults.length === 0) continue;

        // Add additional properties
        filteredResults.forEach((result) => {
          result.isRestricted = checkRestricted(result.combination, codeRoomAvailable);
          if (listCodeMatched) {
            result.isMatched = checkMatched(result.combination, listCodeMatched);
          }
        });

        // Use loop instead of spread operator to avoid stack overflow with large arrays
        for (const result of filteredResults) {
          finalCombinationResults.push(result);
        }
      }

      if (finalCombinationResults.length === 0) {
        this.logger.warn(
          `[multipleRoomPipeline] No combinations generated for scoreType: ${scoreType}`
        );
        return null;
      }

      // this.logger.debug(
      //   `[multipleRoomPipeline] Generated ${finalCombinationResults.length} combinations before rate plan filtering for scoreType: ${scoreType}`
      // );

      // Pre-compute excluded combination counters once
      const listRemoveCounters = listExcludeCombination.map((lst) => counter(lst));

      // Pre-compute excluded base prices set for O(1) lookup
      const excludedBasePriceSet = new Set(listExcludeBasePrice);

      // Remove duplicates and apply filters in single pass
      const uniqueResults = new Map<string, DirectCombinationResult>();

      for (const result of finalCombinationResults) {
        // Create sorted key once (reuse for deduplication)
        const sortedCombo = [...result.combination].sort();
        const key = sortedCombo.join(',');

        // Check if this is a better result for this combination
        const existing = uniqueResults.get(key);
        if (existing && result.value <= existing.value) {
          continue;
        }

        // Filter out excluded combinations
        const resultCounter = counter(result.combination);
        const isExcluded = listRemoveCounters.some((removeCounter) =>
          countersEqual(resultCounter, removeCounter)
        );

        // Check if all products in the combination have the same rate plan
        const hasSameRatePlan = checkSameRatePlan(result.combination, roomProductRatePlanMap);

        if (!isExcluded && hasSameRatePlan) {
          uniqueResults.set(key, result);
        } else if (!hasSameRatePlan) {
          // Log when rate plan validation fails
          const ratePlans = result.combination.map((code) => ({
            code,
            ratePlan: roomProductRatePlanMap.get(code)
          }));
          // this.logger.debug(
          //   `[Rate Plan Filter] Rejected combination with different rate plans: ${JSON.stringify(ratePlans)}`
          // );
        }
      }

      // Convert to array and sort once
      const finalResults = Array.from(uniqueResults.values());

      // this.logger.debug(
      //   `[multipleRoomPipeline] After rate plan filtering: ${finalResults.length} combinations remaining for scoreType: ${scoreType}`
      // );

      // finalResults.sort((a, b) => {
      //   // Non-restricted first
      //   if (a.isRestricted !== b.isRestricted) {
      //     return a.isRestricted ? 1 : -1;
      //   }
      //   // Higher score first
      //   return b.value - a.value;
      // });

      return finalResults;
    } catch (error) {
      if (error instanceof DirectProcessExecuteError) {
        throw error;
      }
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }
}
