import { Logger } from '@nestjs/common';
import {
  CodeRoomAvailable,
  DirectCombinationResult,
  DirectOptimizationParams,
  DirectProcessExecuteError,
  DirectRoomProductAvailable,
  DirectScoreType
} from './recommendation-algorithm.types';

const logger = new Logger('PostprocessingUtils');

export interface RecommendationItem {
  code: string;
  allocatedRoomIndexList: number[];
  matchingScore?: number;
  matchFeatureList?: string[];
  notMatchFeatureList?: string[];
  allocatedCapacityDefault: {
    adults: number;
    children: number;
    pets: number;
  };
  allocatedCapacityExtra: {
    adults: number;
    children: number;
    pets: number;
  };
  building?: string; // Building name for grouping units with same building
}

export interface MatchOption {
  isRestricted: boolean;
  isMatched: boolean;
  averageMatchingScore: number;
  recommendationList: RecommendationItem[];
}

export interface BookingFlowResponse {
  bookingFlow: string;
  recommendationList: {
    [key: string]: RecommendationItem[];
  };
}

export interface MatchingFlowResponse {
  matchOption: MatchOption[];
}

export interface CapacityData {
  productCode: string;
  type: string;
  allocationType: string;
  spaceTypeList: string[];
  isRestricted: boolean;
  mergedIndices: number[];
  matchingScore?: number;
  matchFeatureList?: string[];
  notMatchFeatureList?: string[];
  allocatedDefaultAdults: number;
  allocatedDefaultChildren: number;
  allocatedDefaultPets: number;
  allocatedExtraAdults: number;
  allocatedExtraChildren: number;
  allocatedExtraPets: number;
  capacityScore: number;
  price: number;
  isMatched?: boolean;
  // Additional fields from capacity score
  adults?: number;
  children?: number;
  pets?: number;
  extraAdults?: number;
  extraChildren?: number;
  extraPets?: number;
  maximumDefaultCapacity?: number;
  maximumExtraCapacity?: number;
  numberOfBedrooms?: number;
  building?: string; // Building name extracted from availableRoomDetails
}

export interface ProductMatch {
  combination: string[];
  [key: string]: any;
}

/**
 * Format and parse JSON output from a generator.
 */
export function formatGenerateOutput(output: string): any {
  // Format output by replacing NaN values with null for JSON compatibility
  let formattedOutput = output.replace(/nan/g, 'null');

  // Strip JSON code block markers and any extra whitespace
  formattedOutput = formattedOutput
    .replace(/^```json\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    // Parse the formatted string into a JavaScript object
    return JSON.parse(formattedOutput);
  } catch (error) {
    logger.error(`Failed to parse JSON output: ${error.message}`);
    throw new DirectProcessExecuteError(`Invalid JSON format: ${error.message}`);
  }
}

/**
 * Process a combination of product codes with their corresponding capacity data.
 */
export function processingResponseMergedRequests(
  combination: string[],
  capacityData: CapacityData[][]
): { recommendations: RecommendationItem[]; averageMatchingScore: number } {
  const recommendations: RecommendationItem[] = [];
  const matchingScores: number[] = [];

  // Process each product code in the combination
  for (let index = 0; index < combination.length; index++) {
    const code = combination[index] ?? [];
    // Get the capacity data for the current product code
    const capacityList = capacityData[index] ?? [];
    const capacity = capacityList.find((item) => item.productCode === code);

    if (!capacity) {
      logger.error(`Capacity data not found for product code: ${code}`);
      continue;
    }

    // Format data into a recommendation object
    const recommendation: RecommendationItem = {
      code: capacity.productCode,
      allocatedRoomIndexList: capacity.mergedIndices,
      matchingScore: capacity.matchingScore,
      matchFeatureList: capacity.matchFeatureList,
      notMatchFeatureList: capacity.notMatchFeatureList,
      allocatedCapacityDefault: {
        adults: capacity.allocatedDefaultAdults,
        children: capacity.allocatedDefaultChildren,
        pets: capacity.allocatedDefaultPets
      },
      allocatedCapacityExtra: {
        adults: capacity.allocatedExtraAdults,
        children: capacity.allocatedExtraChildren,
        pets: capacity.allocatedExtraPets
      },
      building: capacity.building // Include building information
    };

    recommendations.push(recommendation);
    matchingScores.push(capacity.matchingScore || 0);
  }

  // Calculate average matching score
  const averageMatchingScore =
    matchingScores.reduce((sum, score) => sum + score, 0) / matchingScores.length;

  return { recommendations, averageMatchingScore };
}

/**
 * Process a list of top matches into a response structure.
 */
export function processingResponseMatchingFlow(topMatchData: CapacityData[]): MatchingFlowResponse {
  const response: MatchingFlowResponse = { matchOption: [] };

  // Process each item in the top matches data
  topMatchData.forEach((item) => {
    const recommendation: RecommendationItem = {
      code: item.productCode,
      allocatedRoomIndexList: item.mergedIndices || [],
      matchingScore: item.matchingScore,
      matchFeatureList: item.matchFeatureList,
      notMatchFeatureList: item.notMatchFeatureList,
      allocatedCapacityDefault: {
        adults: item.allocatedDefaultAdults,
        children: item.allocatedDefaultChildren,
        pets: item.allocatedDefaultPets
      },
      allocatedCapacityExtra: {
        adults: item.allocatedExtraAdults,
        children: item.allocatedExtraChildren,
        pets: item.allocatedExtraPets
      },
      building: item.building // Include building information
    };

    const matchOption: MatchOption = {
      isRestricted: item.isRestricted,
      isMatched: item.isMatched || false,
      averageMatchingScore: item.matchingScore || 0,
      recommendationList: [recommendation]
    };

    response.matchOption.push(matchOption);
  });

  return response;
}

/**
 * Process a list of product code combinations into a structured response.
 */
export function postprocessResponseCombination(
  listCombination: string[][],
  listTopMatchData: CapacityData[][]
): MatchingFlowResponse {
  const response: MatchingFlowResponse = { matchOption: [] };

  listCombination.forEach((combination, iRec) => {
    const listRestricted: boolean[] = [];
    const listMatch: boolean[] = [];
    const listScore: number[] = [];
    const listRecommendation: RecommendationItem[] = [];

    // Process each product code in this combination
    combination.forEach((code, index) => {
      // Get the data with details for this product code
      const productList = listTopMatchData[index];
      const product = productList.find((item) => item.productCode === code);

      if (!product) {
        throw new DirectProcessExecuteError(`Product data not found for code: ${code}`);
      }

      // Track restriction status, match status, and score
      listRestricted.push(product.isRestricted);
      listMatch.push(product.isMatched || false);
      listScore.push(product.matchingScore || 0);

      // Format product details into a recommendation object
      const recommendation: RecommendationItem = {
        code: product.productCode,
        allocatedRoomIndexList: product.mergedIndices || [],
        matchingScore: product.matchingScore,
        matchFeatureList: product.matchFeatureList,
        notMatchFeatureList: product.notMatchFeatureList,
        allocatedCapacityDefault: {
          adults: product.allocatedDefaultAdults,
          children: product.allocatedDefaultChildren,
          pets: product.allocatedDefaultPets
        },
        allocatedCapacityExtra: {
          adults: product.allocatedExtraAdults,
          children: product.allocatedExtraChildren,
          pets: product.allocatedExtraPets
        },
        building: product.building // Include building information
      };
      listRecommendation.push(recommendation);
    });

    // Create the match option with aggregated details
    const matchOption: MatchOption = {
      isRestricted: listRestricted.some((restricted) => restricted),
      isMatched: listMatch.some((matched) => matched),
      averageMatchingScore: listScore.reduce((sum, score) => sum + score, 0) / listScore.length,
      recommendationList: listRecommendation
    };

    response.matchOption.push(matchOption);
  });

  return response;
}

/**
 * Select recommended product combinations based on matching and restriction status.
 */
export function getListCombination(
  counterTopCodeMatch: { [key: string]: { [key: string]: ProductMatch } },
  counterRestrictedMatch: { [key: string]: { [key: string]: ProductMatch } },
  stayOptRecNum: number
): string[][] {
  const results: string[][] = [];

  // Merge restricted matches into top code matches
  Object.keys(counterRestrictedMatch).forEach((boolKey) => {
    if (!counterTopCodeMatch[boolKey]) {
      counterTopCodeMatch[boolKey] = {};
    }

    Object.keys(counterRestrictedMatch[boolKey]).forEach((subKey) => {
      counterTopCodeMatch[boolKey][subKey] = counterRestrictedMatch[boolKey][subKey];
    });
  });

  // First add top matched products to results
  if (counterTopCodeMatch['true']) {
    for (const value of Object.values(counterTopCodeMatch['true'])) {
      results.push(value.combination);
      if (results.length >= stayOptRecNum) {
        return results;
      }
    }
  }

  // Then add top restricted products if needed to reach target count
  for (const value of Object.values(counterRestrictedMatch)) {
    for (const subValue of Object.values(value)) {
      results.push(subValue.combination);
      if (results.length >= stayOptRecNum) {
        return results;
      }
    }
  }

  return results;
}

/**
 * Process a combination of product codes for the booking flow response.
 */
export function postprocessResponseBookingFlow(
  combination: string[],
  capacityData: CapacityData[][]
): RecommendationItem[] {
  try {
    const recommendations: RecommendationItem[] = [];

    combination.forEach((code, index) => {
      // Get capacity data for this product code
      const capacityList = capacityData[index];
      const capacity = capacityList.find((item) => item.productCode === code);

      if (!capacity) {
        throw new DirectProcessExecuteError(`Capacity data not found for product code: ${code}`);
      }

      // Format into a recommendation object
      const recommendation: RecommendationItem = {
        code: capacity.productCode,
        allocatedRoomIndexList: capacity.mergedIndices,
        allocatedCapacityDefault: {
          adults: capacity.allocatedDefaultAdults,
          children: capacity.allocatedDefaultChildren,
          pets: capacity.allocatedDefaultPets
        },
        allocatedCapacityExtra: {
          adults: capacity.allocatedExtraAdults,
          children: capacity.allocatedExtraChildren,
          pets: capacity.allocatedExtraPets
        },
        building: capacity.building // Include building information
      };
      recommendations.push(recommendation);
    });

    return recommendations;
  } catch (error) {
    logger.error(`Detail Error: ${error.stack}`);
    throw new DirectProcessExecuteError(error.message);
  }
}

/**
 * Group recommendations by building and combine units with the same building.
 * Units with the same building are sorted together to appear as combined units.
 * Returns a new BookingFlowResponse with recommendations grouped by building.
 */
export function groupRecommendationsByBuilding(response: BookingFlowResponse): BookingFlowResponse {
  try {
    const groupedResponse: BookingFlowResponse = {
      bookingFlow: response.bookingFlow,
      recommendationList: {}
    };

    // Process each key in the recommendation list
    Object.keys(response.recommendationList).forEach((key) => {
      const recommendations = response.recommendationList[key];

      // Group recommendations by building
      const buildingGroups = new Map<string, RecommendationItem[]>();
      const noBuildingGroup: RecommendationItem[] = [];

      recommendations.forEach((rec) => {
        if (rec.building) {
          if (!buildingGroups.has(rec.building)) {
            buildingGroups.set(rec.building, []);
          }
          buildingGroups.get(rec.building)!.push(rec);
        } else {
          noBuildingGroup.push(rec);
        }
      });

      // Sort and combine recommendations: group by building, prioritizing groups with multiple units
      const groupedRecommendations: RecommendationItem[] = [];

      // First, add building groups with multiple units (combined units)
      buildingGroups.forEach((groupRecs, building) => {
        if (groupRecs.length > 1) {
          // Multiple units in same building - these are combined units
          groupedRecommendations.push(...groupRecs);
        }
      });

      // Then add single-unit buildings
      buildingGroups.forEach((groupRecs, building) => {
        if (groupRecs.length === 1) {
          groupedRecommendations.push(...groupRecs);
        }
      });

      // Finally, add ungrouped recommendations (no building info)
      groupedRecommendations.push(...noBuildingGroup);

      groupedResponse.recommendationList[key] = groupedRecommendations;
    });

    return groupedResponse;
  } catch (error) {
    logger.error(`Error grouping recommendations by building: ${error.message}`);
    // Return original response if grouping fails
    return response;
  }
}

// ----------------------
// Utilities / Domain Helpers (replace with real logic)
// ----------------------

/**
 * Return the maximum possible score as the sum of the best candidate score per slot.
 * Assumes topMatchDfs is an array where each element is an array of objects that contain scoreType number.
 */
function calculateMaxPossibleScore(topMatchDfs: any[], scoreType: DirectScoreType): number {
  if (!Array.isArray(topMatchDfs) || topMatchDfs.length === 0) return 0;
  return topMatchDfs.reduce((acc, slotCandidates) => {
    if (!Array.isArray(slotCandidates) || slotCandidates.length === 0) return acc;
    const maxForSlot = Math.max(
      ...slotCandidates.map((c: any) => (typeof c[scoreType] === 'number' ? c[scoreType] : 0))
    );
    return acc + maxForSlot;
  }, 0);
}

/**
 * Get score for a code at a given slotIndex from topMatchDfs.
 * This tries a few common keys (code, id, productCode) — adapt to your data.
 */
function getScoreForCode(
  code: string,
  slotIndex: number,
  params: DirectOptimizationParams
): number {
  const slotCandidates = params.topMatchDfs[slotIndex];
  if (!Array.isArray(slotCandidates)) return 0;
  const candidate = slotCandidates.find(
    (c: any) => c.code === code || c.id === code || c.productCode === code
  );
  if (!candidate) return 0;
  const val = candidate[params.scoreType];
  return typeof val === 'number' ? val : 0;
}

/**
 * Sum of the maximum possible scores for all remaining slots after current index.
 */
function calculateRemainingMaxScore(
  currentIndex: number,
  params: DirectOptimizationParams
): number {
  const { topMatchDfs, scoreType, sortedCodes } = params;
  let total = 0;
  for (let i = currentIndex + 1; i < sortedCodes.length; i++) {
    const slotCandidates = topMatchDfs[i];
    if (!Array.isArray(slotCandidates) || slotCandidates.length === 0) continue;
    const maxForSlot = Math.max(
      ...slotCandidates.map((c: any) => (typeof c[scoreType] === 'number' ? c[scoreType] : 0))
    );
    total += maxForSlot;
  }
  return total;
}

/**
 * Basic restricted check — adapt to your real rule.
 * Example: a code is restricted if codeRoomAvailable[code]?.restricted === true
 */
function checkRestricted(combination: string[], codeRoomAvailable: CodeRoomAvailable): boolean {
  for (const code of combination) {
    const meta = codeRoomAvailable[code];
    if (meta && meta.isRestricted) return true;
  }
  return false;
}

/**
 * Basic room ids available check — returns true only if every code has roomIdsAvailable true
 */
function checkRoomIdsAvailable(
  combination: string[],
  codeRoomAvailable: CodeRoomAvailable
): boolean {
  for (const code of combination) {
    const meta = codeRoomAvailable[code];
    if (!meta || !meta.availableRoomIds) return false;
  }
  return true;
}

/**
 * Basic available-to-sell check
 */
function checkAvailableToSell(
  combination: string[],
  codeRoomAvailable: CodeRoomAvailable
): boolean {
  for (const code of combination) {
    const meta = codeRoomAvailable[code];
    if (!meta || !meta.availableToSell) return false;
  }
  return true;
}

/**
 * Basic room availability check
 */
function checkRoomAvailability(
  combination: string[],
  codeRoomAvailable: CodeRoomAvailable
): boolean {
  for (const code of combination) {
    const meta = codeRoomAvailable[code];
    if (!meta || !meta.availableToSell) return false;
  }
  return true;
}

/**
 * Count frequencies helper
 */
function counter(arr: string[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const x of arr) r[x] = (r[x] || 0) + 1;
  return r;
}

function countersEqual(a: Record<string, number>, b: Record<string, number>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

// ----------------------
// MAIN ITERATIVE BRANCH-AND-BOUND OPTIMIZER
// ----------------------

/**
 * Full iterative optimizer — returns array of DirectCombinationResult (or null)
 */
export function runOptimizationIterative(
  paramsInput: DirectOptimizationParams
): DirectCombinationResult[] | null {
  // Create a defensive copy with defaults
  const params: Required<DirectOptimizationParams> = {
    maxRestricted: paramsInput.maxRestricted ?? 100,
    ...paramsInput
  } as Required<DirectOptimizationParams>;

  // DFS stack state
  type State = {
    slotIndex: number;
    combo: string[];
    counts: Map<string, number>;
    score: number;
    maxPossibleRemaining: number;
  };

  // Precompute global upper bound
  const initialMaxScore = calculateMaxPossibleScore(params.topMatchDfs, params.scoreType);

  // Stack for iterative DFS
  const stack: State[] = [
    {
      slotIndex: 0,
      combo: [],
      counts: new Map<string, number>(),
      score: 0,
      maxPossibleRemaining: initialMaxScore
    }
  ];

  // Collect best combos separated by restricted / notRestricted to mimic original logic
  const bestCombinations = {
    restricted: [] as [string[], number][],
    notRestricted: [] as [string[], number][]
  };

  let bestScoreGlobal = Number.NEGATIVE_INFINITY;

  // Precompute set of all excluded codes (used to quickly reject combos if they contain any of them)
  const excludedCodesSet = new Set<string>();
  for (const ex of params.listExcludeCombination) {
    for (const code of ex) excludedCodesSet.add(code);
  }

  // iterative DFS
  while (stack.length > 0) {
    const state = stack.pop()!;
    const { slotIndex, combo, counts, score, maxPossibleRemaining } = state;

    // Branch-and-bound prune:
    // If even the best remaining can't beat the current global best, prune.
    if (score + maxPossibleRemaining < bestScoreGlobal) {
      continue;
    }

    // Early termination: if we already have many good notRestricted combos, we may skip exploring
    // but keep searching restricted because we maintain both. This mirrors early return in original.
    if (bestCombinations.notRestricted.length >= params.maxRestricted && slotIndex === 0) {
      // We could prune more aggressively; keep it conservative here.
    }

    // If we've assigned a code for each slot, evaluate final combo
    if (slotIndex === params.sortedCodes.length) {
      // Exclude exact combinations that match any excluded combination counters
      const listRemoveCounters = params.listExcludeCombination.map((lst) => counter(lst));
      const countCurrentCombo = counter(combo);
      if (listRemoveCounters.some((rc) => countersEqual(countCurrentCombo, rc))) {
        continue;
      }

      // If current combo contains any code from excluded combos, skip
      if (combo.some((c) => excludedCodesSet.has(c))) {
        // The original code rejected combos containing any of the codes in excluded combinations.
        continue;
      }

      // If combination length matches number of topMatchDfs (original logic), check base price exclusion
      if (combo.length === params.topMatchDfs.length) {
        const basePrices = combo.map((c) => params.codeRoomAvailable[c]?.basePrice || 0);
        const totalBasePrice = basePrices.reduce((s, v) => s + v, 0);
        if (params.listExcludeBasePrice.includes(totalBasePrice)) {
          continue;
        }
      }

      // Optional availability checks (toggle on if you want them)
      const isRoomIdsAvailable = checkRoomIdsAvailable(combo, params.codeRoomAvailable);
      const isAvailableToSell = checkAvailableToSell(combo, params.codeRoomAvailable);
      const isRoomAvailability = checkRoomAvailability(combo, params.codeRoomAvailable);

      // If you require all avail checks to pass, uncomment these:
      // if (!isRoomIdsAvailable || !isAvailableToSell || !isRoomAvailability) continue;

      const isRestricted = checkRestricted(combo, params.codeRoomAvailable);

      // store to respective bucket
      if (isRestricted) {
        // insert keeping bucket sorted by score desc and bounded by maxRestricted
        if (bestCombinations.restricted.length < params.maxRestricted) {
          bestCombinations.restricted.push([[...combo], score]);
          bestCombinations.restricted.sort((a, b) => b[1] - a[1]);
        } else if (score > bestCombinations.restricted[bestCombinations.restricted.length - 1][1]) {
          bestCombinations.restricted[bestCombinations.restricted.length - 1] = [[...combo], score];
          bestCombinations.restricted.sort((a, b) => b[1] - a[1]);
        }
      } else {
        if (bestCombinations.notRestricted.length < params.maxRestricted) {
          bestCombinations.notRestricted.push([[...combo], score]);
          bestCombinations.notRestricted.sort((a, b) => b[1] - a[1]);
        } else if (
          score > bestCombinations.notRestricted[bestCombinations.notRestricted.length - 1][1]
        ) {
          bestCombinations.notRestricted[bestCombinations.notRestricted.length - 1] = [
            [...combo],
            score
          ];
          bestCombinations.notRestricted.sort((a, b) => b[1] - a[1]);
        }
      }

      bestScoreGlobal = Math.max(bestScoreGlobal, score);
      continue;
    }

    // Prune if no chance to beat best global score (another check, similar to above)
    if (score + maxPossibleRemaining < bestScoreGlobal) continue;

    // Expand children for this slot
    const codesForSlot = params.sortedCodes[slotIndex] || [];
    for (let i = 0; i < codesForSlot.length; i++) {
      const code = codesForSlot[i];

      // Respect counts constraint
      const maxCount = params.maxCountsConstraint[code] ?? params.defaultMaxCount;
      const currentCount = counts.get(code) ?? 0;
      if (currentCount >= maxCount) continue;

      // Quick availability check using roomProductAvailabilityMap or codeRoomAvailable
      const roomMetaFromMap = params.roomProductAvailabilityMap.get(code);
      const roomMetaFromObj = params.codeRoomAvailable[code];

      // If you require available from either source, check them. Here we require either to be available true if defined
      if (
        (roomMetaFromMap && roomMetaFromMap.availableToSell === 0) ||
        (roomMetaFromObj && roomMetaFromObj.availableToSell === 0)
      ) {
        continue;
      }

      // Build new state
      const newCombo = [...combo, code];
      const newCounts = new Map(counts);
      newCounts.set(code, currentCount + 1);

      // Score delta for selecting this code at this slot
      const codeScore = getScoreForCode(code, slotIndex, params);
      const newScore = score + codeScore;

      // New remaining upper bound: calculate remaining best for slots after this one
      const remainingMax = calculateRemainingMaxScore(slotIndex, params);
      const newMaxPossibleRemaining = remainingMax;

      // Branch-and-bound: if even optimistic bound can't beat best, skip
      if (newScore + newMaxPossibleRemaining < bestScoreGlobal) {
        continue;
      }

      stack.push({
        slotIndex: slotIndex + 1,
        combo: newCombo,
        counts: newCounts,
        score: newScore,
        maxPossibleRemaining: newMaxPossibleRemaining
      });
    }
  }

  // Combine results and produce DirectCombinationResult[] with de-duplication (order-insensitive)
  const allCombinations: DirectCombinationResult[] = [];

  for (const [combo, score] of bestCombinations.restricted) {
    allCombinations.push({
      combination: combo,
      value: score,
      type: 'restricted',
      isRestricted: true
    });
  }

  for (const [combo, score] of bestCombinations.notRestricted) {
    allCombinations.push({
      combination: combo,
      value: score,
      type: 'notRestricted',
      isRestricted: false
    });
  }

  if (allCombinations.length === 0) return null;

  // sort by value desc and deduplicate by sorted combination key
  allCombinations.sort((a, b) => b.value - a.value);
  const unique = new Map<string, DirectCombinationResult>();

  for (const item of allCombinations) {
    const key = [...item.combination].sort().join(',');
    const existing = unique.get(key);
    if (!existing || item.value > existing.value) {
      unique.set(key, item);
    }
  }

  const result = Array.from(unique.values()).sort((a, b) => b.value - a.value);

  // ---------------------------------------------------
  // STEP 1: GROUP ALL CODES BY BUILDING DYNAMICALLY
  // ---------------------------------------------------
  // const buildingBuckets = new Map<string, string[]>();

  // Object.keys(params.codeRoomAvailable).forEach((code) => {
  //   const building = params.codeRoomAvailable[code]?.building ?? 'NO_BUILDING';
  //   if (!buildingBuckets.has(building)) buildingBuckets.set(building, []);
  //   buildingBuckets.get(building)!.push(code);
  // });

  // // ---------------------------------------------------
  // // STEP 2: REASSIGN COMBINATION CODES WITH BUILDING PRIORITY
  // // ---------------------------------------------------
  // const usedGlobal = new Set<string>();

  // result.forEach((item) => {
  //   const length = item.combination.length;

  //   // Count how many of each code exist in this combo
  //   const comboCount = new Map<string, number>();
  //   item.combination.forEach((code) => {
  //     comboCount.set(code, (comboCount.get(code) || 0) + 1);
  //   });

  //   const newCombo: string[] = [];

  //   // Fill newCombo respecting building order
  //   for (const [building, codes] of buildingBuckets) {
  //     for (const code of codes) {
  //       if (newCombo.length >= length) break;
  //       const remaining = comboCount.get(code) || 0;
  //       if (remaining > 0) {
  //         newCombo.push(code);
  //         comboCount.set(code, remaining - 1);
  //         usedGlobal.add(code);
  //       }
  //     }
  //     if (newCombo.length >= length) break;
  //   }

  //   console.log('Original:', item.combination, '=> Regrouped:', newCombo);
  //   item.combination = newCombo;
  // });

  // // ---------------------------------------------------
  // // STEP 3: BUILD GLOBAL TAIL (unused codes)
  // // ---------------------------------------------------
  // const tail: string[] = [];
  // for (const codes of buildingBuckets.values()) {
  //   for (const code of codes) {
  //     if (!usedGlobal.has(code)) {
  //       tail.push(code);
  //       usedGlobal.add(code);
  //     }
  //   }
  // }

  // if (tail.length > 0) {
  //   result.push({
  //     combination: tail,
  //     value: 0,
  //     type: 'tail',
  //     isRestricted: false,
  //   });
  // }

  return result;
}
