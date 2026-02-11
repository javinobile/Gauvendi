import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DirectProcessExecuteError,
  DirectRoomProductAvailable,
  DirectFeatureItem
} from './recommendation-algorithm.types';
import { deepCopy } from './recommendation-algorithm.utils';
import OpenAI from 'openai';

// AI Scoring System Prompt for Room Product Recommendations (Optimized for GPT-4o-mini)
const AI_SCORING_SYSTEM_PROMPT = `Score hotel room products (0-1 scale) based on booking requirements.

SCORING FACTORS (weighted):
1. Room Suitability (35%): Capacity match (adults/children/pets), bedrooms fit, occupancy compliance
2. Price Fairness (25%): Lower price = better, compare within similar categories
3. Guest Preferences (20%): Feature matches, space type (SPT_*), building consistency
4. Policy Quality (10%): Refundable > non-refundable, flexibility
5. Stay Duration (10%): Long stays (7+ nights) prefer efficiency, short stays (1-3) prefer flexibility

CRITICAL PENALTIES:
- Occupancy violation → score × 0.1
- No pet support when pets requested → score × 0.2
- Capacity exceeded → score × 0.3
- No feature match → score × 0.7
- Non-refundable for short stay → score × 0.8

TIE-BREAKERS: 1) Refundable, 2) Flexible policy, 3) More feature matches, 4) Lower price

RULES:
- Use ONLY data from input JSON
- Scores must be 0-1
- Handle missing data gracefully
- Be deterministic and consistent

RESPONSE FORMAT (JSON):
{
  "scoredProducts": [
    {
      "productCode": "RFC123",
      "score": 0.85,
      "reasoning": "Good capacity match, affordable price, but non-refundable",
      "penalties": ["Non-refundable policy"],
      "bonuses": ["Perfect capacity match"]
    }
  ],
  "topRecommendation": {
    "productCode": "RFC456",
    "reason": "Best match: perfect capacity, refundable, competitive price"
  },
  "warnings": []
}`;

export interface BookingRequest {
  adults: number;
  children: number;
  pets: number;
  index?: number;
}

// AI Scoring Response Types
export interface AIScoredProduct {
  productCode: string;
  score: number;
  reasoning: string;
  penalties: string[];
  bonuses: string[];
}

export interface AITopRecommendation {
  productCode: string;
  reason: string;
}

export interface AIScoringResponse {
  scoredProducts: AIScoredProduct[];
  topRecommendation: AITopRecommendation;
  warnings: string[];
}

// Batch AI Scoring Response for multiple room requests
export interface AIBatchScoredProduct {
  roomIndex: number;
  productCode: string;
  score: number;
  reasoning: string;
  penalties: string[];
  bonuses: string[];
  isApplicable: boolean; // Whether this product fits the room request
}

export interface AIBatchScoringResponse {
  scoredProducts: AIBatchScoredProduct[];
  topRecommendations: {
    roomIndex: number;
    productCode: string;
    reason: string;
  }[];
  warnings: string[];
}

// AI Scoring Input for GPT-4o
export interface AIScoringInput {
  guestInfo: {
    adults: number;
    children: number;
    pets: number;
    roomIndex: number;
  };
  stayInfo?: {
    checkIn?: string;
    checkOut?: string;
    lengthOfStay?: number;
  };
  featureRequestList?: DirectFeatureItem[];
  spaceTypeRequestList?: string[];
  roomProducts: AIRoomProductInput[];
}

export interface AIRoomProductInput {
  code: string;
  name?: string;
  type: string;
  basePrice?: number;
  ratePlanCode?: string;
  allocationType: string;
  isRestricted: boolean;
  spaceTypeList: string[];
  featureList: string[];
  numberOfBedrooms: number;
  capacity: {
    adults: number;
    children: number;
    pets: number;
    maximum: number;
  };
  extraCapacity: {
    adults: number;
    children: number;
    pets: number;
    maximum: number;
  };
  availableRoomDetails?: {
    roomNumber: string;
    roomFloor: string;
    space: number;
    building: string;
  }[];
}

export interface RoomCapacity {
  adults: number;
  children: number;
  pets: number;
  maximum: number;
}

export interface DirectRoomProduct {
  code: string;
  type: string;
  allocationType: string;
  isRestricted: boolean;
  spaceTypeList: string[];
  capacity: RoomCapacity;
  extraCapacity: RoomCapacity;
}

export interface CapacityDataFrame {
  price: number;
  mergedIndices: number[];
  productCode: string;
  type: string;
  allocationType: string;
  spaceTypeList: string[];
  isRestricted: boolean;
  adults: number;
  children: number;
  pets: number;
  extraAdults: number;
  extraChildren: number;
  extraPets: number;
  maximumDefaultCapacity: number;
  maximumExtraCapacity: number;
  totalAdults?: number;
  totalChildren?: number;
  totalPets?: number;
  allocatedDefaultAdults?: number;
  allocatedDefaultChildren?: number;
  allocatedExtraAdults?: number;
  allocatedExtraChildren?: number;
  allocatedDefaultPets?: number;
  allocatedExtraPets?: number;
  excessDefaultAdults?: number;
  excessDefaultChildren?: number;
  excessDefaultPets?: number;
  excessExtraAdults?: number;
  excessExtraChildren?: number;
  excessExtraPets?: number;
  capacityScore?: number;
  numberOfBedrooms: number;
  availableRoomDetails: {
    roomNumber: string;
    roomFloor: string;
    space: number;
    building: string;
  }[];
  // AI Scoring fields
  aiScore?: number;
  aiReasoning?: string;
  combinedScore?: number;
}

export interface AllocationResult {
  allocatedDefaultAdults: number;
  allocatedDefaultChildren: number;
  allocatedExtraAdults: number;
  allocatedExtraChildren: number;
  allocatedDefaultPets: number;
  allocatedExtraPets: number;
}

export interface ExcessResult {
  excessDefaultAdults: number;
  excessDefaultChildren: number;
  excessDefaultPets: number;
  excessExtraAdults: number;
  excessExtraChildren: number;
  excessExtraPets: number;
}

@Injectable()
export class CapacityScoreService {
  private readonly logger = new Logger(CapacityScoreService.name);

  private openai: OpenAI;
  private readonly model = 'gpt-4o-mini';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('OPEN_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Check if AI scoring is enabled via environment configuration
   */
  isAIScoringEnabled(): boolean {
    return this.configService.get('IS_USE_AI_FOR_SCORE') === 'true';
  }

  /**
   * Call GPT-4o-mini for AI-powered room product scoring (Optimized for speed ~1s)
   */
  private async callGPT4oForScoring(userPrompt: string): Promise<string> {
    if (!this.openai) {
      throw new DirectProcessExecuteError(
        'OpenAI client not initialized. Check OPEN_API_KEY configuration.'
      );
    }

    const startTime = Date.now();

    // Optimize for speed: reduced max_tokens (512) for faster response (~1s target)
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: AI_SCORING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: {
        type: 'json_object'
      },
      max_tokens: 4096, // Reduced for faster response
      top_p: 1,
      temperature: 0, // Deterministic output
      presence_penalty: 0,
      frequency_penalty: 0
    });

    this.logger.debug(`AI Scoring - Total tokens used: ${response?.usage?.total_tokens}`);

    const output = response?.choices?.[0]?.message?.content || '';
    if (!output) {
      throw new DirectProcessExecuteError('No response from OpenAI for scoring');
    }

    const endTime = Date.now();
    const executeTime = endTime - startTime;
    this.logger.log(`AI Scoring completed in ${executeTime}ms`);

    return output;
  }

  /**
   * Parse and validate AI scoring response
   */
  private parseAIScoringResponse(responseJson: string): AIScoringResponse {
    try {
      const parsed = JSON.parse(responseJson);

      // Validate required fields
      if (!parsed.scoredProducts || !Array.isArray(parsed.scoredProducts)) {
        throw new Error('Invalid AI response: missing scoredProducts array');
      }

      // Validate each scored product
      for (const product of parsed.scoredProducts) {
        if (!product.productCode || typeof product.score !== 'number') {
          throw new Error(`Invalid scored product: ${JSON.stringify(product)}`);
        }
        // Clamp score to valid range
        product.score = Math.max(0, Math.min(1, product.score));
      }

      return {
        scoredProducts: parsed.scoredProducts || [],
        topRecommendation: parsed.topRecommendation || null,
        warnings: parsed.warnings || []
      };
    } catch (error) {
      this.logger.error(`Failed to parse AI scoring response: ${error.message}`);
      throw new DirectProcessExecuteError(`AI scoring response parsing failed: ${error.message}`);
    }
  }

  /**
   * Prepare input data for AI scoring
   */
  private prepareAIScoringInput(
    availableRoomProductList: DirectRoomProductAvailable[],
    bookingReq: BookingRequest,
    featureRequestList?: DirectFeatureItem[],
    spaceTypeRequestList?: string[],
    stayInfo?: { checkIn?: string; checkOut?: string; lengthOfStay?: number }
  ): AIScoringInput {
    // Optimize for speed: reduce token usage aggressively
    const roomProducts: AIRoomProductInput[] = availableRoomProductList.map((product) => ({
      code: product.code,
      name: product.description?.substring(0, 50), // Reduced from 100
      type: product.type,
      basePrice: product.basePrice,
      ratePlanCode: product.ratePlanCode,
      allocationType: product.allocationType,
      isRestricted: product.isRestricted,
      spaceTypeList: product.spaceTypeList,
      featureList: product.featureList.slice(0, 10), // Limit to top 10 features
      numberOfBedrooms: product.numberOfBedrooms,
      capacity: product.capacity,
      extraCapacity: product.extraCapacity,
      // Only include first room detail for token efficiency
      availableRoomDetails: product.availableRoomDetails?.slice(0, 1).map((detail) => ({
        roomNumber: detail.roomNumber,
        roomFloor: detail.roomFloor,
        space: detail.space,
        building: detail.building
      }))
    }));

    return {
      guestInfo: {
        adults: bookingReq.adults,
        children: bookingReq.children,
        pets: bookingReq.pets,
        roomIndex: bookingReq.index || 0
      },
      stayInfo,
      featureRequestList: featureRequestList?.slice(0, 5), // Limit to top 5 requested features
      spaceTypeRequestList,
      roomProducts
    };
  }

  /**
   * Main AI scoring entry point - scores room products using GPT-4o
   * Returns scores that integrate with existing capacity scoring
   */
  async getAIScores(
    availableRoomProductList: DirectRoomProductAvailable[],
    bookingReq: BookingRequest,
    featureRequestList?: DirectFeatureItem[],
    spaceTypeRequestList?: string[],
    stayInfo?: { checkIn?: string; checkOut?: string; lengthOfStay?: number }
  ): Promise<Map<string, { aiScore: number; reasoning: string }>> {
    const scoreMap = new Map<string, { aiScore: number; reasoning: string }>();

    // Return empty map if AI scoring is disabled
    if (!this.isAIScoringEnabled()) {
      this.logger.debug('AI scoring is disabled, using fallback scoring');
      return scoreMap;
    }

    try {
      // Prepare input for AI
      const scoringInput = this.prepareAIScoringInput(
        availableRoomProductList,
        bookingReq,
        featureRequestList,
        spaceTypeRequestList,
        stayInfo
      );

      // Build user prompt (Ultra-compact for speed)
      const userPrompt = `Score ${scoringInput.roomProducts.length} products for ${scoringInput.guestInfo.adults}A/${scoringInput.guestInfo.children}C/${scoringInput.guestInfo.pets}P.
${scoringInput.stayInfo ? `Stay:${JSON.stringify(scoringInput.stayInfo)}` : ''}
${scoringInput.featureRequestList?.length ? `Features:${JSON.stringify(scoringInput.featureRequestList.slice(0, 5))}` : ''}
${scoringInput.spaceTypeRequestList?.length ? `Space:${JSON.stringify(scoringInput.spaceTypeRequestList)}` : ''}
Products:${JSON.stringify(scoringInput.roomProducts)}`;

      // Call GPT-4o
      const responseJson = await this.callGPT4oForScoring(userPrompt);

      // Parse response
      const aiResponse = this.parseAIScoringResponse(responseJson);

      // Log warnings
      if (aiResponse.warnings?.length) {
        this.logger.warn(`AI Scoring warnings: ${aiResponse.warnings.join('; ')}`);
      }

      // Build score map
      for (const scoredProduct of aiResponse.scoredProducts) {
        scoreMap.set(scoredProduct.productCode, {
          aiScore: scoredProduct.score,
          reasoning: scoredProduct.reasoning || ''
        });
      }

      // Log top recommendation
      if (aiResponse.topRecommendation) {
        this.logger.log(
          `AI Top Recommendation: ${aiResponse.topRecommendation.productCode} - ${aiResponse.topRecommendation.reason}`
        );
      }

      return scoreMap;
    } catch (error) {
      this.logger.error(`AI scoring failed, falling back to traditional scoring: ${error.message}`);
      return scoreMap; // Return empty map to fallback to traditional scoring
    }
  }

  /**
   * Combine AI score with traditional capacity score
   * AI score weight: 40%, Capacity score weight: 60%
   */
  combineScores(capacityScore: number, aiScore?: number): number {
    if (aiScore === undefined || aiScore === null) {
      return capacityScore;
    }
    // Weighted combination: 60% capacity (deterministic), 40% AI (intelligent)
    return capacityScore * 0.0 + aiScore * 1.0;
  }

  /**
   * Calculate the ideal number of bedrooms based on guest count.
   * Assumption: 1 bedroom can accommodate up to 2 adults comfortably.
   */
  private calculateIdealBedrooms(adults: number, children: number): number {
    // For adults: 1 bedroom per 2 adults (couples), minimum 1 bedroom
    const bedroomsForAdults = Math.max(1, Math.ceil(adults / 2));

    // For children: assume children can share with adults or in separate beds
    // Additional bedrooms needed if children exceed adult bedroom capacity
    const totalGuests = adults + children;
    const bedroomsForGuests = Math.ceil(totalGuests / 2);

    return Math.max(bedroomsForAdults, bedroomsForGuests);
  }

  /**
   * Filter room products based on capacity and bedroom requirements from a booking request.
   */
  cleanCapacityDataframe(
    dataframe: CapacityDataFrame[],
    bookingReq: BookingRequest,
    isMatchFlow?: boolean
  ): CapacityDataFrame[] {
    try {
      // Create a deep copy to avoid modifying the original data
      let df = deepCopy(dataframe);

      // Calculate the total capacity required (adults + children)
      const capacityReq = bookingReq.adults + bookingReq.children;

      // Calculate ideal bedroom count
      const idealBedrooms = this.calculateIdealBedrooms(bookingReq.adults, bookingReq.children);

      // Filter out rooms where combined maximum capacity is insufficient
      df = df.filter(
        (room) => room.maximumDefaultCapacity + room.maximumExtraCapacity >= capacityReq
      );

      // Calculate total available capacities and filter
      df = df.map((room) => ({
        ...room,
        totalAdults: room.adults + room.extraAdults,
        totalChildren: room.children + room.extraChildren,
        totalPets: room.pets + room.extraPets
      }));

      // Filter for sufficient capacities
      df = df.filter(
        (room) =>
          room.totalAdults! >= bookingReq.adults &&
          room.totalChildren! >= bookingReq.children &&
          room.totalPets! >= bookingReq.pets
      );

      // Apply bedroom filtering: prefer rooms with appropriate bedroom count
      // Allow some flexibility: ideal bedrooms ± 1, but prioritize exact matches
      const maxAllowedBedrooms = idealBedrooms + 1; // Allow 1 extra bedroom
      const totalGuests = bookingReq.adults + bookingReq.children;

      df = df.filter((room) => {
        // If numberOfBedrooms is 0 or undefined, don't filter (legacy data)
        if (!room.numberOfBedrooms || room.numberOfBedrooms === 0) {
          return true;
        }

        // Filter out rooms with too many bedrooms (wasteful)
        // Also add stricter validation for severe under-utilization
        if (room.numberOfBedrooms > maxAllowedBedrooms && !isMatchFlow) {
          return false;
        }

        // Additional validation: reject rooms with severe under-utilization
        // For example, don't allow 1 guest in a 3+ bedroom room
        const utilizationRatio = totalGuests / room.numberOfBedrooms;
        if (room.numberOfBedrooms >= 3 && utilizationRatio < 0.6 && !isMatchFlow) {
          this.logger.warn(
            `Rejecting room ${room.productCode} with ${room.numberOfBedrooms} bedrooms for ${totalGuests} guests (utilization: ${utilizationRatio.toFixed(2)})`
          );
          return false;
        }

        return true;
      });

      return df;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Calculate the optimal allocation of guests between default and extra capacity.
   *
   * This function finds the best way to allocate adults, children, and pets between
   * a room's default capacity and extra capacity. It prioritizes:
   * 1. Maximizing total guests in default capacity (da + dc + dp)
   * 2. Maximizing adults in default capacity (da)
   * 3. Maximizing children in default capacity (dc)
   * 4. Maximizing pets in default capacity (dp)
   *
   * This ensures optimal allocation when pets consume capacity and need to be considered
   * alongside adults and children in the optimization decision.
   */
  getAllocatedCapacity(room: CapacityDataFrame, bookingReq: BookingRequest): AllocationResult {
    try {
      const reqAdults = bookingReq.adults;
      const reqChildren = bookingReq.children;
      const reqPets = bookingReq.pets;

      // Retrieve capacity limits from the room
      const maxDefCap = room.maximumDefaultCapacity;
      const maxExtCap = room.maximumExtraCapacity;

      const defAdultsCap = room.adults;
      const defChildrenCap = room.children;
      const defPetsCap = room.pets;

      const extAdultsCap = room.extraAdults || 0;
      const extChildrenCap = room.extraChildren || 0;
      const extPetsCap = room.extraPets || 0;

      // Initialize variables to track the best allocation
      // da = default adults, dc = default children, dp = default pets
      // la = extra adults, lc = extra children, lp = extra pets
      let bestScore = [-1, -1, -1, -1]; // [da + dc + dp, da, dc, dp] - start with impossible values
      let bestCombination = [0, 0, 0, 0, 0, 0]; // [da, dc, dp, la, lc, lp]

      // Exhaustive search for the best allocation combination (including pets)
      // Iterate through all possible combinations
      for (let da = 0; da <= reqAdults; da++) {
        // Skip if adults exceed default capacity
        if (da > defAdultsCap) continue;

        for (let dc = 0; dc <= reqChildren; dc++) {
          // Skip if children exceed default capacity
          if (dc > defChildrenCap) continue;

          for (let dp = 0; dp <= reqPets; dp++) {
            // Check if this allocation is valid for default capacity
            // Must satisfy individual capacity limits and total capacity limit
            if (
              da + dc <= maxDefCap && // pets excluded from capacity
              dp <= defPetsCap // pets only validated by pet limit
            ) {
              // Calculate remaining guests for extra capacity
              const la = reqAdults - da;
              const lc = reqChildren - dc;
              const lp = reqPets - dp;

              // Check if extra capacity allocation is also valid
              const totalExtraNeeded = la + lc + lp;

              // If no extra capacity needed, proceed to scoring
              if (totalExtraNeeded === 0) {
                // Valid - all guests fit in default capacity
              } else {
                // Check if extra capacity can accommodate remaining guests
                // If individual extra capacities are all 0 but maxExtCap > 0,
                // treat it as flexible allocation (allow up to maxExtCap total)
                const allIndividualZero =
                  extAdultsCap === 0 && extChildrenCap === 0 && extPetsCap === 0;

                if (allIndividualZero && maxExtCap > 0) {
                  // Flexible extra capacity: only check total constraint
                  if (totalExtraNeeded > maxExtCap) continue;
                } else {
                  // Strict extra capacity: check both individual and total constraints
                  if (
                    la > extAdultsCap ||
                    lc > extChildrenCap ||
                    lp > extPetsCap ||
                    totalExtraNeeded > maxExtCap
                  ) {
                    continue;
                  }
                }
              }

              // If we reach here, the allocation is valid - compute score
              // Priority: total default capacity, then adults, then children, then pets
              const score = [da + dc + dp, da, dc, dp];

              // Compare scores (lexicographic order)
              if (this.isBetterScore(score, bestScore)) {
                bestScore = score;
                bestCombination = [da, dc, dp, la, lc, lp];
              }
            }
          }
        }
      }

      // Validate that we found a valid allocation
      const totalAllocated =
        bestCombination[0] +
        bestCombination[1] +
        bestCombination[2] +
        bestCombination[3] +
        bestCombination[4] +
        bestCombination[5];
      const totalRequested = reqAdults + reqChildren + reqPets;

      if (totalAllocated === 0 && totalRequested > 0) {
        this.logger.warn(
          `No valid allocation found for room ${room.productCode}. ` +
            `Request: ${reqAdults}A/${reqChildren}C/${reqPets}P, ` +
            `Default: ${defAdultsCap}A/${defChildrenCap}C/${defPetsCap}P (max: ${maxDefCap}), ` +
            `Extra: ${extAdultsCap}A/${extChildrenCap}C/${extPetsCap}P (max: ${maxExtCap})`
        );
      }

      return {
        allocatedDefaultAdults: bestCombination[0],
        allocatedDefaultChildren: bestCombination[1],
        allocatedDefaultPets: bestCombination[2],
        allocatedExtraAdults: bestCombination[3],
        allocatedExtraChildren: bestCombination[4],
        allocatedExtraPets: bestCombination[5]
      };
    } catch (error) {
      this.logger.error(`When get allocated capacity. Error in ${room.productCode}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  private isBetterScore(score: number[], bestScore: number[]): boolean {
    for (let i = 0; i < score.length; i++) {
      if (score[i] > bestScore[i]) return true;
      if (score[i] < bestScore[i]) return false;
    }
    return false; // equal
  }

  /**
   * Calculate the excess (unused) capacity after guest allocation.
   */
  getExcessCapacity(room: CapacityDataFrame): ExcessResult {
    try {
      // Calculate excess for default capacity
      const excDefAdults = room.adults - (room.allocatedDefaultAdults || 0);
      const excDefChildren = room.children - (room.allocatedDefaultChildren || 0);
      const excDefPets = room.pets - (room.allocatedDefaultPets || 0);

      // Calculate excess for extra capacity
      const excExtraAdults = room.extraAdults - (room.allocatedExtraAdults || 0);
      const excExtraChildren = room.extraChildren - (room.allocatedExtraChildren || 0);
      const excExtraPets = room.extraPets - (room.allocatedExtraPets || 0);

      return {
        excessDefaultAdults: excDefAdults,
        excessDefaultChildren: excDefChildren,
        excessDefaultPets: excDefPets,
        excessExtraAdults: excExtraAdults,
        excessExtraChildren: excExtraChildren,
        excessExtraPets: excExtraPets
      };
    } catch (error) {
      this.logger.error(`When get excess capacity. Error in ${room.productCode}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Calculate a bedroom efficiency score based on how well the room's bedroom count matches the request.
   */
  private calculateBedroomScore(room: CapacityDataFrame, bookingReq: BookingRequest): number {
    // If numberOfBedrooms is not available, return neutral score
    if (!room.numberOfBedrooms || room.numberOfBedrooms === 0) {
      return 0.8; // Neutral score for legacy data
    }

    const idealBedrooms = this.calculateIdealBedrooms(bookingReq.adults, bookingReq.children);
    const actualBedrooms = room.numberOfBedrooms;

    // Calculate utilization ratio for penalizing severe under-utilization
    const totalGuests = bookingReq.adults + bookingReq.children;
    const utilizationRatio = totalGuests / actualBedrooms;

    if (actualBedrooms === idealBedrooms) {
      // Perfect match
      return 1.0;
    } else if (actualBedrooms === idealBedrooms - 1) {
      // One bedroom less (acceptable for couples)
      return 0.9;
    } else if (actualBedrooms === idealBedrooms + 1) {
      // One extra bedroom (slightly wasteful but acceptable)
      return 0.7;
    } else if (actualBedrooms > idealBedrooms + 1) {
      // Too many bedrooms - apply severe penalty for under-utilization
      // If we have 3+ bedrooms but only 1 guest, heavily penalize this
      if (utilizationRatio < 0.5) {
        return 0.1; // Severe penalty for gross under-utilization
      } else if (utilizationRatio < 0.75) {
        return 0.3; // Moderate penalty for significant under-utilization
      } else {
        return 0.4; // Standard penalty for wasteful allocation
      }
    } else {
      // Too few bedrooms (cramped)
      return 0.5;
    }
  }

  /**
   * Calculate a capacity score based on allocation efficiency, room utilization, and bedroom fit.
   */
  /**
   * Check if all rooms in availableRoomDetails have the same building.
   * Returns true if all rooms share the same building, false otherwise.
   */
  hasSameBuilding(room: CapacityDataFrame): boolean {
    try {
      const roomDetails = room.availableRoomDetails || [];

      // If no room details or only one room, return false (no bonus needed)
      if (roomDetails.length <= 1) {
        return false;
      }

      // Get the building from the first room
      const firstBuilding = roomDetails[0]?.building;
      if (!firstBuilding) {
        return false;
      }

      // Check if all rooms have the same building
      return roomDetails.every((detail) => detail.building === firstBuilding);
    } catch (error) {
      this.logger.warn(
        `Error checking building consistency for ${room.productCode}: ${error.message}`
      );
      return false;
    }
  }

  calculateCapacityScore(
    room: CapacityDataFrame,
    bookingReq: BookingRequest,
    adultsPen: number = 10,
    childrenPen: number = 6,
    petsPen: number = 3
  ): number {
    try {
      const reqA = bookingReq.adults;
      const reqC = bookingReq.children;
      const reqP = bookingReq.pets;

      const capA = room.adults || 0; // default adult capacity
      const capC = room.children || 0; // default child capacity
      const capP = room.pets || 0; // default pet capacity
      const maxDefCap = room.maximumDefaultCapacity || 0;

      const extA = room.extraAdults || 0;
      const extC = room.extraChildren || 0;
      const extP = room.extraPets || 0;
      const maxExtCap = room.maximumExtraCapacity || 0;

      // ============================================================
      // 1. HARD FILTER (Pets rules)
      // ============================================================
      if (reqP > 0) {
        const totalPetCap = capP + extP;

        if (totalPetCap === 0) return 0.01; // room does not support pets at all

        const allocatedPets = (room.allocatedDefaultPets || 0) + (room.allocatedExtraPets || 0);

        if (allocatedPets < reqP) return 0.1; // cannot host requested # pets
      }

      // ============================================================
      // 2. EFFECTIVE ALLOCATION LOGIC (fixed)
      // Use room capacity, NOT what allocation algorithm produced
      // ============================================================
      const effA = Math.min(reqA, capA); // effective default adult fit
      const effC = Math.min(reqC, capC); // effective default child fit
      const effP = Math.min(reqP, capP); // effective default pet fit

      // ============================================================
      // 3. FIT CAPACITY SCORE
      // Penalty only when room *cannot* host requested guests
      // ============================================================
      const fitCapacityScore =
        100 - (reqA - effA) * adultsPen - (reqC - effC) * childrenPen - (reqP - effP) * petsPen;

      // ============================================================
      // 4. EXTRA CAPACITY SCORE
      // Using extra beds = less ideal but acceptable
      // ============================================================
      const allocatedExtraA = room.allocatedExtraAdults || 0;
      const allocatedExtraC = room.allocatedExtraChildren || 0;
      const allocatedExtraP = room.allocatedExtraPets || 0;

      const useExtraCapacityScore =
        100 -
        allocatedExtraA * adultsPen -
        allocatedExtraC * childrenPen -
        allocatedExtraP * petsPen;

      // ============================================================
      // 5. EXCESS SCORE (Exceeding caps)
      // Rooms that surpass capacity get punished heavily
      // ============================================================
      const excessDefaultA = room.excessDefaultAdults || 0;
      const excessDefaultC = room.excessDefaultChildren || 0;
      const excessDefaultP = room.excessDefaultPets || 0;

      const excessScore =
        100 -
        excessDefaultA * adultsPen * 2 - // stronger penalty
        excessDefaultC * childrenPen * 2 -
        excessDefaultP * petsPen * 2;

      // ============================================================
      // 6. BEDROOM EFFICIENCY SCORE (balanced)
      // ============================================================
      const bedroomScore = this.calculateBedroomScore(room, bookingReq);
      // returns 0.0 → 1.0

      // ============================================================
      // 7. FINAL WEIGHTING (adjusted for realism)
      // ============================================================
      const capacityScore =
        (fitCapacityScore * 0.3 + // 30% → fit well is most important
          useExtraCapacityScore * 0.25 + // 25%
          excessScore * 0.25 + // 25%
          bedroomScore * 100 * 0.2) / // 20%
        100;

      return capacityScore < 0 ? 0 : capacityScore;
    } catch (err) {
      this.logger.error(`Error calculating capacity score for room ${room.productCode}`);
      throw new DirectProcessExecuteError(err.message);
    }
  }

  /**
   * Process a booking request to generate capacity scores for all available room products.
   */
  async capacityScore(
    availableRoomProductList: DirectRoomProductAvailable[],
    bookingReq: BookingRequest,
    index: number,
    deductAll: { [key: string]: number },
    isMatchFlow?: boolean
  ): Promise<CapacityDataFrame[] | null> {
    try {
      // Build array from available room/product list
      let capacityData: CapacityDataFrame[] = availableRoomProductList.map((item) => ({
        mergedIndices: [index],
        productCode: item.code,
        type: item.type,
        allocationType: item.allocationType,
        isRestricted: item.isRestricted,
        spaceTypeList: item.spaceTypeList,
        price: item.basePrice || 0,
        adults: item.capacity.adults || 0,
        children: item.capacity.children || 0,
        pets: item.capacity.pets || 0,
        extraAdults: item.extraCapacity.adults || 0,
        extraChildren: item.extraCapacity.children || 0,
        extraPets: item.extraCapacity.pets || 0,
        maximumDefaultCapacity: item.capacity.maximum || 0,
        maximumExtraCapacity: item.extraCapacity.maximum || 0,
        numberOfBedrooms: item.numberOfBedrooms || 0,
        availableRoomDetails: (item?.availableRoomDetails || []).map((detail) => ({
          roomNumber: detail.roomNumber,
          roomFloor: detail.roomFloor,
          space: detail.space,
          building: detail.building
        }))
      }));

      // Clean the capacity data based on booking requirements
      if (capacityData.length === 0) {
        return null;
      }

      // Remove ERFC deduct ALL from the data if available to sell > room request list
      const listRemove: string[] = [];
      // for (const [key, value] of Object.entries(deductAll)) {
      // if (value >= 1) {
      //   listRemove.push(key);
      // }
      // }

      capacityData = capacityData.filter((room) => !listRemove.includes(room.productCode));
      if (capacityData.length === 0) {
        return null;
      }

      // CRITICAL: Filter rooms based on capacity requirements (including pets)
      // This ensures rooms without pet support are excluded early when pets are requested
      capacityData = this.cleanCapacityDataframe(capacityData, bookingReq, isMatchFlow);
      if (capacityData.length === 0) {
        this.logger.warn(
          `No rooms available after capacity filtering for request: ${JSON.stringify(bookingReq)}`
        );
        return null;
      }

      // Calculate allocated capacities for each room/product
      capacityData = capacityData.map((room) => {
        const allocation = this.getAllocatedCapacity(room, bookingReq);
        return { ...room, ...allocation };
      });

      // Calculate excess capacities for each room/product
      capacityData = capacityData.map((room) => {
        const excess = this.getExcessCapacity(room);
        return { ...room, ...excess };
      });

      // Calculate the overall capacity score for each room/product
      capacityData = capacityData.map((room) => ({
        ...room,
        capacityScore: this.calculateCapacityScore(room, bookingReq, 10, 6, 3)
      }));

      return capacityData;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Enhanced capacity scoring with AI integration.
   * When IS_USE_AI_FOR_SCORE is true, combines traditional capacity scoring with AI-powered scoring.
   * AI scoring provides intelligent analysis of price fairness, guest preferences, policy quality, etc.
   */
  async capacityScoreWithAI(
    availableRoomProductList: DirectRoomProductAvailable[],
    bookingReq: BookingRequest,
    index: number,
    deductAll: { [key: string]: number },
    featureRequestList?: DirectFeatureItem[],
    spaceTypeRequestList?: string[],
    stayInfo?: { checkIn?: string; checkOut?: string; lengthOfStay?: number }
  ): Promise<CapacityDataFrame[] | null> {
    try {
      // First, get traditional capacity scores
      const capacityData = await this.capacityScore(
        availableRoomProductList,
        bookingReq,
        index,
        deductAll
      );

      if (!capacityData || capacityData.length === 0) {
        return capacityData;
      }

      // Check if AI scoring is enabled
      if (!this.isAIScoringEnabled()) {
        this.logger.debug('AI scoring disabled, returning traditional capacity scores');
        // Return capacity data with combinedScore = capacityScore
        return capacityData.map((room) => ({
          ...room,
          combinedScore: room.capacityScore
        }));
      }

      // Get AI scores for all products
      const aiScoreMap = await this.getAIScores(
        availableRoomProductList,
        bookingReq,
        featureRequestList,
        spaceTypeRequestList,
        stayInfo
      );

      // Combine scores
      const enhancedCapacityData = capacityData.map((room) => {
        const aiResult = aiScoreMap.get(room.productCode);
        const aiScore = aiResult?.aiScore;
        const aiReasoning = aiResult?.reasoning;

        // Combine traditional capacity score with AI score
        const combinedScore = this.combineScores(room.capacityScore || 0, aiScore);

        return {
          ...room,
          aiScore,
          aiReasoning,
          combinedScore
        };
      });

      // Sort by combined score (descending)
      enhancedCapacityData.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));

      // Log top 3 recommendations
      const top3 = enhancedCapacityData.slice(0, 3);
      this.logger.log(
        `AI-Enhanced Top 3 Recommendations: ${top3.map((r) => `${r.productCode}(${r.combinedScore?.toFixed(2)})`).join(', ')}`
      );

      return enhancedCapacityData;
    } catch (error) {
      this.logger.error(`AI-enhanced scoring failed: ${error.stack}`);
      // Fallback to traditional scoring
      return this.capacityScore(availableRoomProductList, bookingReq, index, deductAll);
    }
  }

  /**
   * Batch AI scoring for multiple room requests - OPTIMIZED VERSION
   *
   * This method:
   * 1. Pre-filters applicable room products for each room request
   * 2. Merges all room requests into a SINGLE AI call (saves API costs)
   * 3. Parses and splits results back to each room request
   * 4. Handles non-applicable rooms by excluding them from results
   */
  async batchCapacityScoreWithAI(
    availableRoomProductList: DirectRoomProductAvailable[],
    roomRequestList: BookingRequest[],
    deductAll: { [key: string]: number },
    featureRequestList?: DirectFeatureItem[],
    spaceTypeRequestList?: string[],
    stayInfo?: { checkIn?: string; checkOut?: string; lengthOfStay?: number }
  ): Promise<(CapacityDataFrame[] | null)[]> {
    try {
      // Step 1: Calculate traditional capacity scores for ALL room requests first
      // This also filters out non-applicable room products
      const traditionalResults: (CapacityDataFrame[] | null)[] = [];
      const applicableProductsPerRequest: Map<number, Set<string>> = new Map();

      for (let i = 0; i < roomRequestList.length; i++) {
        const bookingReq = roomRequestList[i];
        const index = bookingReq.index ?? i;

        const capacityResult = await this.capacityScore(
          availableRoomProductList,
          bookingReq,
          index,
          deductAll
        );

        traditionalResults.push(capacityResult);

        // Track which products are applicable for this room request
        if (capacityResult) {
          const applicableCodes = new Set(capacityResult.map((r) => r.productCode));
          applicableProductsPerRequest.set(index, applicableCodes);
        }
      }

      // Step 2: Check if AI scoring is enabled
      if (!this.isAIScoringEnabled()) {
        this.logger.debug('AI scoring disabled, returning traditional capacity scores');
        return traditionalResults.map((result) =>
          result ? result.map((room) => ({ ...room, combinedScore: room.capacityScore })) : null
        );
      }

      // Step 3: Build merged AI scoring input for ALL room requests
      const mergedRoomRequests: {
        roomIndex: number;
        guestInfo: { adults: number; children: number; pets: number };
        applicableProductCodes: string[];
      }[] = [];

      for (let i = 0; i < roomRequestList.length; i++) {
        const bookingReq = roomRequestList[i];
        const index = bookingReq.index ?? i;
        const applicableCodes = applicableProductsPerRequest.get(index);

        if (applicableCodes && applicableCodes.size > 0) {
          mergedRoomRequests.push({
            roomIndex: index,
            guestInfo: {
              adults: bookingReq.adults,
              children: bookingReq.children,
              pets: bookingReq.pets
            },
            applicableProductCodes: Array.from(applicableCodes)
          });
        }
      }

      // If no applicable products for any request, return traditional results
      if (mergedRoomRequests.length === 0) {
        this.logger.warn('No applicable products found for any room request');
        return traditionalResults.map((result) =>
          result ? result.map((room) => ({ ...room, combinedScore: room.capacityScore })) : null
        );
      }

      // Step 4: Get unique product codes across all requests
      const allApplicableProductCodes = new Set<string>();
      for (const req of mergedRoomRequests) {
        req.applicableProductCodes.forEach((code) => allApplicableProductCodes.add(code));
      }

      // Filter room products to only include applicable ones
      const applicableRoomProducts = availableRoomProductList.filter((p) =>
        allApplicableProductCodes.has(p.code)
      );

      // Step 5: Make a SINGLE AI call for all room requests
      const aiScoresPerRequest = await this.getBatchAIScores(
        applicableRoomProducts,
        mergedRoomRequests,
        featureRequestList,
        spaceTypeRequestList,
        stayInfo
      );

      // Step 6: Combine AI scores with traditional capacity scores
      const enhancedResults: (CapacityDataFrame[] | null)[] = [];

      for (let i = 0; i < roomRequestList.length; i++) {
        const traditionalResult = traditionalResults[i];
        const bookingReq = roomRequestList[i];
        const index = bookingReq.index ?? i;

        if (!traditionalResult) {
          enhancedResults.push(null);
          continue;
        }

        const aiScoresForRequest = aiScoresPerRequest.get(index) || new Map();

        const enhancedCapacityData = traditionalResult.map((room) => {
          const aiResult = aiScoresForRequest.get(room.productCode);
          const aiScore = aiResult?.aiScore;
          const aiReasoning = aiResult?.reasoning;

          const combinedScore = this.combineScores(room.capacityScore || 0, aiScore);

          return {
            ...room,
            aiScore,
            aiReasoning,
            combinedScore,
            hasAIScore: aiScore !== undefined && aiScore !== null // Flag for sorting
          };
        });

        // Sort: Products with AI scores FIRST, then by combined score (descending)
        enhancedCapacityData.sort((a, b) => {
          // Priority 1: Products with AI scores come first
          const aHasAI = a.hasAIScore ? 1 : 0;
          const bHasAI = b.hasAIScore ? 1 : 0;
          if (aHasAI !== bHasAI) {
            return bHasAI - aHasAI; // AI-scored products first
          }
          // Priority 2: Then sort by combined score (descending)
          return (b.combinedScore || 0) - (a.combinedScore || 0);
        });

        // Remove the temporary flag
        enhancedCapacityData.forEach((room) => {
          delete (room as any).hasAIScore;
        });

        enhancedResults.push(enhancedCapacityData);
      }

      // Log summary
      this.logger.log(
        `Batch AI Scoring completed: ${roomRequestList.length} room requests, ` +
          `${applicableRoomProducts.length} unique products, 1 AI call`
      );

      return enhancedResults;
    } catch (error) {
      this.logger.error(`Batch AI scoring failed: ${error.stack}`);
      // Fallback to traditional scoring for each request
      const fallbackResults: (CapacityDataFrame[] | null)[] = [];
      for (let i = 0; i < roomRequestList.length; i++) {
        const bookingReq = roomRequestList[i];
        const result = await this.capacityScore(
          availableRoomProductList,
          bookingReq,
          bookingReq.index ?? i,
          deductAll
        );
        fallbackResults.push(
          result ? result.map((room) => ({ ...room, combinedScore: room.capacityScore })) : null
        );
      }
      return fallbackResults;
    }
  }

  /**
   * Get batch AI scores for multiple room requests in a SINGLE API call
   * Returns a Map of roomIndex -> Map of productCode -> { aiScore, reasoning }
   */
  private async getBatchAIScores(
    applicableRoomProducts: DirectRoomProductAvailable[],
    mergedRoomRequests: {
      roomIndex: number;
      guestInfo: { adults: number; children: number; pets: number };
      applicableProductCodes: string[];
    }[],
    featureRequestList?: DirectFeatureItem[],
    spaceTypeRequestList?: string[],
    stayInfo?: { checkIn?: string; checkOut?: string; lengthOfStay?: number }
  ): Promise<Map<number, Map<string, { aiScore: number; reasoning: string }>>> {
    const resultMap = new Map<number, Map<string, { aiScore: number; reasoning: string }>>();

    try {
      // Prepare room products for AI (optimized for speed - minimal tokens)
      const roomProductsForAI: AIRoomProductInput[] = applicableRoomProducts.map((product) => ({
        code: product.code,
        name: product.description?.substring(0, 50), // Reduced for speed
        type: product.type,
        basePrice: product.basePrice,
        ratePlanCode: product.ratePlanCode,
        allocationType: product.allocationType,
        isRestricted: product.isRestricted,
        spaceTypeList: product.spaceTypeList,
        featureList: product.featureList.slice(0, 8), // Limit to 8 features
        numberOfBedrooms: product.numberOfBedrooms,
        capacity: product.capacity,
        extraCapacity: product.extraCapacity,
        // Only first room detail, truncated featureString
        availableRoomDetails: product.availableRoomDetails?.slice(0, 1).map((d) => ({
          roomNumber: d.roomNumber,
          roomFloor: d.roomFloor,
          space: d.space,
          building: d.building
        })) // Truncate feature string
      }));

      // Build batch prompt
      const batchPrompt = this.buildBatchScoringPrompt(
        roomProductsForAI,
        mergedRoomRequests,
        featureRequestList,
        spaceTypeRequestList,
        stayInfo
      );

      // Make single AI call
      const responseJson = await this.callGPT4oForScoring(batchPrompt);

      // Parse batch response
      const batchResponse = this.parseBatchAIScoringResponse(responseJson);

      // Distribute scores to each room request
      for (const scoredProduct of batchResponse.scoredProducts) {
        if (!scoredProduct.isApplicable) continue;

        let requestScores = resultMap.get(scoredProduct.roomIndex);
        if (!requestScores) {
          requestScores = new Map();
          resultMap.set(scoredProduct.roomIndex, requestScores);
        }

        requestScores.set(scoredProduct.productCode, {
          aiScore: scoredProduct.score,
          reasoning: scoredProduct.reasoning
        });
      }

      // Log top recommendations
      for (const topRec of batchResponse.topRecommendations) {
        this.logger.log(
          `Room ${topRec.roomIndex} - AI Top Recommendation: ${topRec.productCode} - ${topRec.reason}`
        );
      }

      if (batchResponse.warnings?.length) {
        this.logger.warn(`Batch AI Scoring warnings: ${batchResponse.warnings.join('; ')}`);
      }
    } catch (error) {
      this.logger.error(`getBatchAIScores failed: ${error.message}`);
    }

    return resultMap;
  }

  /**
   * Build a batch scoring prompt for multiple room requests (Optimized for GPT-4o-mini)
   */
  private buildBatchScoringPrompt(
    roomProducts: AIRoomProductInput[],
    mergedRoomRequests: {
      roomIndex: number;
      guestInfo: { adults: number; children: number; pets: number };
      applicableProductCodes: string[];
    }[],
    featureRequestList?: DirectFeatureItem[],
    spaceTypeRequestList?: string[],
    stayInfo?: { checkIn?: string; checkOut?: string; lengthOfStay?: number }
  ): string {
    // Ultra-compact batch prompt for speed
    const roomsStr = mergedRoomRequests
      .map(
        (req) =>
          `R${req.roomIndex}:${req.guestInfo.adults}A/${req.guestInfo.children}C/${req.guestInfo.pets}P→[${req.applicableProductCodes.join(',')}]`
      )
      .join('|');

    return `Batch:${mergedRoomRequests.length} rooms. Score products per room.
Rooms:${roomsStr}
${stayInfo ? `Stay:${JSON.stringify(stayInfo)}` : ''}
${featureRequestList?.length ? `Feat:${JSON.stringify(featureRequestList.slice(0, 5))}` : ''}
${spaceTypeRequestList?.length ? `Space:${JSON.stringify(spaceTypeRequestList)}` : ''}
Products:${JSON.stringify(roomProducts)}
Response:{"scoredProducts":[{"roomIndex":0,"productCode":"RFC123","score":0.85,"reasoning":"...","isApplicable":true}],"topRecommendations":[{"roomIndex":0,"productCode":"RFC456","reason":"..."}],"warnings":[]}`;
  }

  /**
   * Parse batch AI scoring response
   */
  private parseBatchAIScoringResponse(responseJson: string): AIBatchScoringResponse {
    try {
      const parsed = JSON.parse(responseJson);

      if (!parsed.scoredProducts || !Array.isArray(parsed.scoredProducts)) {
        throw new Error('Invalid batch AI response: missing scoredProducts array');
      }

      // Validate and normalize scored products
      for (const product of parsed.scoredProducts) {
        if (
          typeof product.roomIndex !== 'number' ||
          !product.productCode ||
          typeof product.score !== 'number'
        ) {
          this.logger.warn(`Invalid batch scored product: ${JSON.stringify(product)}`);
          continue;
        }
        product.score = Math.max(0, Math.min(1, product.score));
        product.isApplicable = product.isApplicable !== false; // Default to true
      }

      return {
        scoredProducts: parsed.scoredProducts || [],
        topRecommendations: parsed.topRecommendations || [],
        warnings: parsed.warnings || []
      };
    } catch (error) {
      this.logger.error(`Failed to parse batch AI scoring response: ${error.message}`);
      throw new DirectProcessExecuteError(
        `Batch AI scoring response parsing failed: ${error.message}`
      );
    }
  }
}
