import { Logger } from '@nestjs/common';
import {
  CodeRoomAvailable,
  DirectBookingHistoryItem,
  DirectCapacityItem,
  DirectFeatureItem,
  DirectScoreRow
} from './recommendation-algorithm.types';
import { RoomRequest } from './direct-product-pipeline.service';
import { cloneDeep } from 'lodash';

const logger = new Logger('RecommendationAlgorithmUtils');

/**
 * Calculate a normalized score based on a given value and the min/max of a specified array column.
 */
export function calculateMinMaxScore(
  value: number | null | undefined,
  data: any[],
  column: string
): number {
  if (value !== null && value !== undefined) {
    const values = data.map((item) => item[column]).filter((v) => v !== null && v !== undefined);

    if (values.length === 0) return 0;

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    if (minVal === maxVal) {
      return Math.min(1, Math.max(0, minVal));
    } else {
      return value / maxVal;
    }
  } else {
    return 0;
  }
}

/**
 * Combine multiple score components into a final direct score.
 */
export function calculateDirectScore(row: DirectScoreRow): number {
  const popularScore = row.popularScore;
  const capacityScore = row.capacityScore * 5; // buff for capacity score
  const mergedCount = row.mergedIndices?.length || 0;

  return popularScore * capacityScore * mergedCount;
}

/**
 * Combine multiple score components into a final most popular score.
 */
export function calculateMostPopularScore(row: DirectScoreRow): number {
  const popularScore = row.popularScore;
  const historyScore = row.historyScore;
  const periodScore = row.periodScore;
  const capacityScore = row.capacityScore;

  return (0.3 * periodScore + 0.3 * historyScore + popularScore * 0.4) * capacityScore;
}

/**
 * Check if combination matches the provided codes
 */
export function checkMatched(combination: string[], listCodeMatched: string[]): boolean {
  return combination.some((code) => listCodeMatched.includes(code));
}

/**
 * Check if any room in combination is restricted
 */
export function checkRestricted(
  combination: string[],
  codeRoomAvailable: CodeRoomAvailable
): boolean {
  return combination.some((code) => codeRoomAvailable[code]?.isRestricted || false);
}

/**
 * Check if all room products in a combination have the same rate plan code
 */
export function checkSameRatePlan(
  combination: string[],
  roomProductRatePlanMap: Map<string, string | undefined>
): boolean {
  if (combination.length === 0) return true;
  if (combination.length === 1) return true; // Single product always valid

  // Get rate plan codes for all products in combination
  const ratePlanCodes = combination.map((code) => roomProductRatePlanMap.get(code));

  // Count how many products have rate plan codes
  const withRatePlan = ratePlanCodes.filter((code) => code !== undefined);

  // If no products have rate plan codes, allow the combination (for backward compatibility)
  if (withRatePlan.length === 0) return true;

  // If some products have rate plan and some don't, we need to check:
  // - If all products have rate plan: all must be the same
  // - If only some have rate plan: allow it (they might be from different sources)
  if (withRatePlan.length === ratePlanCodes.length) {
    // All products have rate plan codes - they must all be the same
    const firstRatePlanCode = withRatePlan[0];
    return withRatePlan.every((code) => code === firstRatePlanCode);
  }

  // Mixed case: some have rate plan, some don't - allow for now
  // This handles edge cases where some products might not have rate plan data
  return true;
}

/**
 * Count occurrences of items in an array (similar to Python's Counter)
 */
export function counter<T>(items: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  items.forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });
  return counts;
}

/**
 * Check if two counters are equal
 */
export function countersEqual<T>(counter1: Map<T, number>, counter2: Map<T, number>): boolean {
  if (counter1.size !== counter2.size) return false;

  for (const [key, value] of counter1.entries()) {
    if (counter2.get(key) !== value) return false;
  }

  return true;
}

/**
 * Sort array and get indices
 */
export function sortWithIndices<T>(arr: T[], compareFunction?: (a: T, b: T) => number): number[] {
  const indices = arr.map((_, index) => index);
  indices.sort((a, b) => {
    if (compareFunction) {
      return compareFunction(arr[a], arr[b]);
    }
    return arr[a] < arr[b] ? -1 : arr[a] > arr[b] ? 1 : 0;
  });
  return indices;
}

/**
 * Deep copy object
 */
export function deepCopy<T>(obj: T): T {
  return cloneDeep(obj);
}

/**
 * Get environment variable with default value
 */
export function getEnv(key: string, defaultValue: string | number): string | number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof defaultValue === 'number') {
    const numValue = parseInt(value, 10);
    return isNaN(numValue) ? defaultValue : numValue;
  }

  return value;
}

/**
 * Merge arrays of booking history and capacity data
 */
export function mergeDataFrames(
  capacityData: DirectCapacityItem[],
  bookingHistoryData: DirectBookingHistoryItem[]
): any[] {
  const bookingHistoryMap = new Map<string, DirectBookingHistoryItem>();
  bookingHistoryData.forEach((item) => {
    bookingHistoryMap.set(item.productCode, item);
  });

  return capacityData.map((capacity) => {
    const booking = bookingHistoryMap.get(capacity.productCode);
    return {
      ...capacity,
      ...booking,
      sameBookingPeriod: booking?.sameBookingPeriod || 0,
      totalHistoryBookingTime: booking?.totalHistoryBookingTime || 0,
      productPopularity: booking?.productPopularity || 0
    };
  });
}

/**
 * Get object information from feature list based on feature mapping
 */
export function getObjectInformation(
  featureList: string[],
  featureMapping: { [key: string]: number }
): number[] {
  return featureList.map((feature) => featureMapping[feature] || 0);
}

/**
 * Apply event features to update the feature list with higher popularity
 */
export function applyEventToFeatureList(
  countEventFeat: Map<string, number>,
  listFeat: DirectFeatureItem[]
): DirectFeatureItem[] {
  // formula is: 4 + addition - 1, popularity + addition
  return listFeat.map((feat) => {
    if (countEventFeat.has(feat.name)) {
      const popularity = feat.popularity;
      const addition = countEventFeat.get(feat.name) || 0;

      return {
        ...feat,
        popularity: Math.max(4 + addition - 1, popularity + addition)
      };
    }
    return feat;
  });
}

export function buildCounter(list: string[]): Record<string, number> {
  return list.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

export function calculateMatchingAndPopularityScore(
  dictFeat: Record<string, { code: string; name: string; popularity: number }>,
  listFeatReq: DirectFeatureItem[],
  productFeatPopularity: Record<string, Record<string, number>>
): any[] {
  // Get unique requested features and their counts
  const listUniFeatReq = [...new Set(listFeatReq.map((feat) => feat.code))];
  const dictFeatReq = buildCounter(listFeatReq.map((feat) => feat.code));

  // Build priority map: lower priority number = higher importance
  const priorityMap = new Map<string, number>();
  listFeatReq.forEach((feat) => {
    if (feat.priority !== undefined && !priorityMap.has(feat.code)) {
      priorityMap.set(feat.code, feat.priority);
    }
  });

  const results: any[] = [];

  for (const [productCode, features] of Object.entries(productFeatPopularity)) {
    // Count matched features with priority weighting
    let featureMatch = 0;
    let priorityWeightedMatch = 0;
    const matchFeatureList: string[] = [];
    const notMatchFeatureList: string[] = [];

    for (const featureCode of listUniFeatReq) {
      const featPopularity = features[featureCode];
      if (featPopularity !== null && featPopularity !== undefined) {
        featureMatch++;

        // Apply priority weighting with special boost for space types (SPT_)
        // Priority 0 + SPT_: 4x weight, Priority 0: 3x, Priority 1: 2x, Priority 2+: 1x
        const priority = priorityMap.get(featureCode) ?? 999;
        let priorityWeight = 1.0;
        if (priority === 0) {
          priorityWeight = featureCode.startsWith('SPT_') ? 4.0 : 3.0;
        } else if (priority === 1) {
          priorityWeight = 2.0;
        }
        priorityWeightedMatch += priorityWeight;

        // Always add to matchFeatureList, use code from dictFeat if available, otherwise use featureCode
        matchFeatureList.push(dictFeat[featureCode]?.code || featureCode);
      } else {
        // Always add to notMatchFeatureList, use code from dictFeat if available, otherwise use featureCode
        notMatchFeatureList.push(dictFeat[featureCode]?.code || featureCode);
      }
    }

    // Calculate total possible priority weight
    let totalPriorityWeight = 0;
    for (const featureCode of listUniFeatReq) {
      const priority = priorityMap.get(featureCode) ?? 999;
      let priorityWeight = 1.0;
      if (priority === 0) {
        priorityWeight = featureCode.startsWith('SPT_') ? 4.0 : 3.0;
      } else if (priority === 1) {
        priorityWeight = 2.0;
      }
      totalPriorityWeight += priorityWeight;
    }

    // A product is considered matched only if it has at least one feature match
    // AND meets critical capacity requirements (checked via capacity score)
    const isMatched = featureMatch > 0;

    // Use priority-weighted matching score instead of simple ratio
    const defaultMatchingScore =
      totalPriorityWeight > 0 ? priorityWeightedMatch / totalPriorityWeight : 0;

    // Combination Score with priority weighting
    let combinationScore = 0;
    if (
      listUniFeatReq.length === listFeatReq.length &&
      listUniFeatReq.every((f) => listFeatReq.some((feat) => feat.code === f))
    ) {
      combinationScore = 0.99;
    } else {
      for (const [feature, count] of Object.entries(dictFeatReq)) {
        if (features[feature] !== undefined) {
          // Apply priority weighting to combination score with SPT_ boost
          const priority = priorityMap.get(feature) ?? 999;
          let priorityBoost = 1.0;
          if (priority === 0) {
            priorityBoost = feature.startsWith('SPT_') ? 4.0 : 3.0;
          } else if (priority === 1) {
            priorityBoost = 2.0;
          }
          combinationScore += (features[feature] || 0) * count * priorityBoost;
        }
      }

      // Normalize by weighted popularity sum
      const listFeatPopularity = listFeatReq.map((feat) => {
        const popularity = dictFeat[feat.code]?.popularity || 0;
        const priority = feat.priority ?? 999;
        let priorityBoost = 1.0;
        if (priority === 0) {
          priorityBoost = feat.code.startsWith('SPT_') ? 4.0 : 3.0;
        } else if (priority === 1) {
          priorityBoost = 2.0;
        }
        return popularity * priorityBoost;
      });
      const popularitySum = listFeatPopularity.reduce((a, b) => a + b, 0);
      if (popularitySum > 0) {
        combinationScore = combinationScore / popularitySum;
      }
    }

    // Product Popularity Score (min-max normalization)
    const totalPopularity = Object.values(features).reduce((a, b) => a + b, 0);
    const maxFeatPop = Math.max(
      ...Object.values(productFeatPopularity).map((f) =>
        Object.values(f).reduce((a, b) => a + b, 0)
      )
    );
    const productPopularityScore = maxFeatPop > 0 ? totalPopularity / maxFeatPop : 0;

    results.push({
      productCode,
      isMatched,
      matchFeatureList,
      notMatchFeatureList,
      defaultMatchingScore,
      combinationScore,
      productPopularityScore
    });
  }

  return results;
}

export function calculateFinalScore(
  row: any,
  listFeatReq: DirectFeatureItem[]
): {
  similarityScore: number;
  compareMatchingScore: number;
  matchingScore: number;
  isMatched?: boolean;
} {
  // Extract scores from row
  const capacityScore = row.capacityScore ?? 0;
  const combinationScore = row.combinationScore ?? 0;
  const defMatchingScore = row.defaultMatchingScore ?? 0;
  const prodPopularityScore = row.productPopularityScore ?? 0;
  const similarityScore = row.similarityScore ?? 0;
  const mergedIndices: any[] = row.mergedIndices ?? [];
  let isMatched = row.isMatched ?? false;

  // Unique requested features
  const listUniqueFeatCodeReq = listFeatReq.map((feat) => feat.code);
  const listUniqueFeatReq = Array.from(new Set(listUniqueFeatCodeReq));

  // CRITICAL: If capacity score is very low (< 0.15), mark as not matched
  // This happens when rooms don't meet critical requirements like pet support
  if (capacityScore < 0.15) {
    isMatched = false;
  }

  // Extra score = weighted sum of popularity, similarity, combination * capacity
  const extraScore =
    (0.5 * prodPopularityScore + 0.3 * similarityScore + 0.2 * combinationScore) * capacityScore;

  // Compare score = accounts for multiple rooms and normalizes by feature count
  const compareMatchingScore =
    mergedIndices.length * (defMatchingScore + extraScore / listUniqueFeatReq.length);

  // Matching score capped at 1.0
  const matchingScore = Math.min(
    1,
    compareMatchingScore / Math.max(1, mergedIndices.length) // prevent div by 0
  );

  return {
    similarityScore,
    compareMatchingScore,
    matchingScore,
    isMatched
  };
}

export function filteringTopMatch(
  totalMatchArr: any[],
  getTop: boolean = true,
  stayOptRcmNumber: number = 12
): any[] {
  // Clone input array (avoid mutating original)
  let topMatchArr = [...totalMatchArr];

  // Sort by isMatched (desc), isRestricted (asc), compareMatchingScore (desc)
  topMatchArr.sort((a, b) => {
    if (a.isMatched !== b.isMatched) {
      return b.isMatched ? 1 : -1; // matched first
    }
    if (a.isRestricted !== b.isRestricted) {
      return a.isRestricted ? 1 : -1; // unrestricted first
    }
    return b.compareMatchingScore - a.compareMatchingScore; // higher score first
  });

  if (getTop) {
    // Create a map to remove duplicate combinations (order-independent)
    const seen = new Set<string>();
    const uniqueArr: any[] = [];

    for (const item of topMatchArr) {
      const key = JSON.stringify([...new Set(item.combination)].sort());
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArr.push(item);
      }
    }

    // Limit to requested number
    return uniqueArr.slice(0, stayOptRcmNumber);
  }

  return topMatchArr;
}

/**
 * Prioritize and sort room requests by constraint complexity.
 * Priority order: Pets first (rarest constraint), then children, then adults-only.
 * This ensures requests with stricter requirements get processed first for better room allocation.
 *
 * @param roomRequests - Array of room requests to prioritize
 * @returns Sorted array of room requests in priority order
 */
export function prioritizeRoomRequests(roomRequests: RoomRequest[]): RoomRequest[] {
  return [...roomRequests].sort((a, b) => {
    // Priority 1: Requests with pets (pet-friendly rooms are rarer)
    const aHasPets = (a.pets || 0) > 0;
    const bHasPets = (b.pets || 0) > 0;
    if (aHasPets && !bHasPets) return -1;
    if (!aHasPets && bHasPets) return 1;

    // Priority 2: Requests with children (need more space)
    const aHasChildren = (a.children || 0) > 0;
    const bHasChildren = (b.children || 0) > 0;
    if (aHasChildren && !bHasChildren) return -1;
    if (!aHasChildren && bHasChildren) return 1;

    // Priority 3: If both have pets, prioritize more pets
    if (aHasPets && bHasPets) {
      const petDiff = (b.pets || 0) - (a.pets || 0);
      if (petDiff !== 0) return petDiff;
    }

    // Priority 4: If both have children, prioritize more children
    if (aHasChildren && bHasChildren) {
      const childrenDiff = (b.children || 0) - (a.children || 0);
      if (childrenDiff !== 0) return childrenDiff;
    }

    // Priority 5: If both have same constraints, prioritize more adults (larger groups)
    return (b.adults || 0) - (a.adults || 0);
  });
}
