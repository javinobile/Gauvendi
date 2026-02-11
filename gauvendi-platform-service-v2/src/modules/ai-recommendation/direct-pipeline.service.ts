import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RfcAllocationSetting } from '@src/core/enums/common';
import OpenAI from 'openai';
import { CapacityScoreService } from './capacity-score.service';
import { DirectProductPipelineService, RoomRequest } from './direct-product-pipeline.service';
import { MergedRequestsService } from './merged-requests.service';
import { OurTipService } from './our-tip.service';
import {
  BookingFlowResponse,
  CapacityData,
  groupRecommendationsByBuilding,
  processingResponseMergedRequests
} from './postprocessing.utils';
import { PriceJumpService } from './price-jump.service';
import { RecommendationAlgorithmService } from './recommendation-algorithm.service';
import {
  DirectBookingHistoryItem,
  DirectEventItem,
  DirectFeatureItem,
  DirectProcessExecuteError,
  DirectRoomProductAvailable
} from './recommendation-algorithm.types';
import {
  applyEventToFeatureList,
  calculateFinalScore,
  calculateMatchingAndPopularityScore,
  counter,
  filteringTopMatch,
  getObjectInformation,
  prioritizeRoomRequests
} from './recommendation-algorithm.utils';
import { RecommendationPipelineService } from './recommendation-pipeline.service';
import { chunk, cloneDeep } from 'lodash';
import {
  HotelOurTipAiRecommendationSettingConfigValue,
  HotelPopularAiRecommendationSettingConfigValue
} from '@src/core/entities/hotel-entities/hotel-configuration.entity';

// Equivalent of USER_CONTENT in Python
const USER_CONTENT = `
{featureNotMatchContext}
### The client has requested a room with the following features: {featureRequestContext}.
`;

const SYSTEM_CONTENT = `You are a hotel feature evaluator. Your task is to identify features that are **semantically similar** to the requested ones from a given list of hotel room features.
### Evaluation Criteria:
- **Based on the feature name**, identify features that share a meaningful relationship with the requested features, considering different levels of similarity:
  - **Strong equivalence (Highly Similar):** Features that directly fulfill the request with high precision.
  - **Partial relevance (Moderately Similar):** Features that capture key aspects of the request but may differ slightly in function or intent.
  - **Loose association (Marginally Similar):** Features that share a vague or indirect relationship with the request but might still be relevant in certain contexts.
- Do **not** rely on surface-level word matching. Focus on **functional meaning and conceptual alignment**.
- **Exclude contradictory or conflicting features** (e.g., "Away from Elevator" must not match with "Close to Elevator").
- **Exclude irrelevant features**, even if they contain similar words.

### Output Format:
- Return results as a JSON object where:
- **Key:** The requested feature.
- **Value:** A list of all feature codes that have a meaningful similarity at any level.
`;

export interface SalesStrategy {
  mostPopular: string[];
  ourTip: string[];
  direct: string[];
  match?: string[];
}

export interface DirectFlowInput {
  featureList: DirectFeatureItem[];
  salesStrategy: SalesStrategy;
  roomRequestList: RoomRequest[];
  featureRequestList?: DirectFeatureItem[];
  eventFeatureList: DirectEventItem[];
  lowestPriceList: string[];
  lowestPrice: number;
  bookingHistoryList: DirectBookingHistoryItem[];
  stayOptionRecommendationNumber: number;
  availableRoomProductList: DirectRoomProductAvailable[];
  priceJump?: boolean;
  mergedRequest?: boolean;
  spaceTypeRequestList?: string[];
  popularConfig?: HotelPopularAiRecommendationSettingConfigValue;
  ourTipConfig?: HotelOurTipAiRecommendationSettingConfigValue;
}

export interface DirectFlowResponse {
  stayOptionRecommendationList: BookingFlowResponse[];
}

export interface DirectFlowResult {
  response: DirectFlowResponse;
  executeTime: number;
}

export class InputValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputValueError';
  }
}

@Injectable()
export class DirectPipelineService {
  private readonly logger = new Logger(DirectPipelineService.name);
  private openai: OpenAI | undefined;
  model = 'gpt-4o-mini';

  constructor(
    private readonly recommendationPipelineService: RecommendationPipelineService,
    private readonly ourTipService: OurTipService,
    private readonly directProductPipelineService: DirectProductPipelineService,
    private readonly capacityScoreService: CapacityScoreService,
    private readonly configService: ConfigService,
    private readonly mergedRequestsService: MergedRequestsService,
    private readonly recommendationAlgorithmService: RecommendationAlgorithmService,
    private readonly priceJumpService: PriceJumpService
  ) {
    const apiKey = this.configService.get('OPEN_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      this.logger.verbose(`initial openai with key present`);
    } else {
      this.logger.warn('OPEN_API_KEY not found, AI features in DirectPipelineService will be disabled.');
    }
  }

  async messageOpenAI(userPrompt: string): Promise<string> {
    if (!this.openai) {
      this.logger.warn('OpenAI client not initialized. Returning empty response.');
      return '{}'; // Return empty JSON-like string to avoid parsing errors downstream
    }

    const startTime = Date.now();
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_CONTENT },
          { role: 'user', content: userPrompt }
        ],
        response_format: {
          type: 'json_object'
        },
        max_tokens: 512,
        top_p: 1,
        temperature: 0,
        presence_penalty: 0,
        frequency_penalty: 0
      });

      const output = response?.choices?.[0]?.message?.content || 'No response from OpenAI';

      const endTime = Date.now();
      const executeTime = endTime - startTime;
      this.logger.log(`Message OpenAI execute in ${executeTime}ms`);
      return output;
    } catch (error) {
      this.logger.error(`Error calling OpenAI: ${error.message}`);
      return '{}';
    }
  }

  /**
   * Remove duplicate features from the feature list.
   */
  private removeDuplicateFeature(listFeat: DirectFeatureItem[]): DirectFeatureItem[] {
    const seen = new Set<string>();
    return listFeat.filter((feat) => {
      if (seen.has(feat.code)) {
        return false;
      }
      seen.add(feat.code);
      return true;
    });
  }

  private getFeatureAvailableInProductAndRequest(
    processedRoomProducts: DirectRoomProductAvailable[],
    featureRequestList: DirectFeatureItem[]
  ) {
    try {
      // Step 1: Extract product codes and features
      const exploded: { code: string; feature: string }[] = [];
      processedRoomProducts.forEach((product) => {
        product.featureList.forEach((feature) => {
          exploded.push({ code: product.code, feature });
        });
      });

      // Step 2: Build a set of all features (from product + requested list)
      const featureSet = new Set<string>();
      exploded.forEach((e) => featureSet.add(e.feature));
      featureRequestList.forEach((f) => featureSet.add(f.code));

      const listFeatAvailable = Array.from(featureSet).sort();

      // Step 3: Create one-hot encoded map
      const productFeatMap: {
        [productCode: string]: { [feature: string]: number };
      } = {};

      processedRoomProducts.forEach((product) => {
        if (!productFeatMap[product.code]) {
          productFeatMap[product.code] = {};
        }

        listFeatAvailable.forEach((feature) => {
          productFeatMap[product.code][feature] = product.featureList.includes(feature) ? 1 : 0;
        });
      });

      return { listFeatAvailable, productFeatMap };
    } catch (error) {
      console.error('Detail Error:', error);
      throw new Error('ProcessExecuteError: ' + (error as Error).message);
    }
  }

  private async matchFlowGeneratePipeline(
    processedRoomProducts: DirectRoomProductAvailable[],
    featureRequestList: DirectFeatureItem[],
    hotelFeatureList: DirectFeatureItem[]
  ): Promise<any> {
    // Step 1: Find features actually available in the hotel's room inventory
    const { listFeatAvailable, productFeatMap } = this.getFeatureAvailableInProductAndRequest(
      processedRoomProducts,
      featureRequestList
    );

    // Step 2: Get features available but not explicitly requested
    const requestedCodes = new Set(featureRequestList.map((f) => f.code));
    const featureNotMatchList = listFeatAvailable.filter((item) => !requestedCodes.has(item));

    // Step 3: Create a lookup dictionary for feature details
    const featureDict: Map<string, { code: string; name: string; popularity: number }> = new Map();
    hotelFeatureList.forEach((feature) => {
      if (featureDict.has(feature.code)) {
        return;
      }
      featureDict.set(feature.code, {
        code: feature.code,
        name: feature.name,
        popularity: feature.popularity
      });
    });

    const uniqueFeatureRequestList = [...new Set(featureRequestList.map((f) => f.code))];

    // step 4: convert feature request to string
    const featureRequestListString = uniqueFeatureRequestList.join(',');

    // step 5: convert feature not match list to string
    // Initialize the context with a header
    let featureContext = '### The list of features is as follows (feature code: feature name):\n';

    // Add each feature with its code to the context
    for (const code of featureNotMatchList) {
      const f = featureDict.get(code);
      if (!f) {
        continue;
      }
      featureContext += `${f.code}: ${f.name}. \n`;
    }

    // step 6: format user prompt
    const userPrompt = this.formatUserPrompt(featureRequestListString, featureContext);

    // step 7: message openai
    const output = await this.messageOpenAI(userPrompt);

    // Step 8: Extract the JSON response containing feature matches
    const match = output.match(/\{.*\}/s);

    if (!match) {
      throw new Error(`Something wrong in output format. Output: ${output}`);
    }

    const cleanJson = match[0];
    let outputJson: Record<string, string[]>;

    try {
      outputJson = JSON.parse(cleanJson);
    } catch (err) {
      throw new Error(`Failed to parse JSON from OpenAI output. Output: ${cleanJson}`);
    }

    // Step 9: Flatten the JSON structure into a list of matched feature codes
    const featurePriorityMatchList: string[] = [];
    for (const value of Object.values(outputJson)) {
      featurePriorityMatchList.push(...value);
    }

    return featurePriorityMatchList;
  }

  private formatUserPrompt(featureRequestContext: string, featureNotMatchContext: string): string {
    // Clone template (no need for deepcopy in TS since strings are immutable)
    let userContent = USER_CONTENT;

    // Replace placeholders with actual context
    userContent = userContent.replace('{featureRequestContext}', featureRequestContext);
    userContent = userContent.replace('{featureNotMatchContext}', featureNotMatchContext);

    return userContent.trim();
  }

  /**
   * Generate validation tips for capacity allocation mismatches and other issues.
   */
  private generateCapacityAllocationTips(
    capacityDataList: CapacityData[][],
    roomRequestList: RoomRequest[],
    selectedCombination: string[]
  ): string[] {
    const tips: string[] = [];

    try {
      for (let i = 0; i < roomRequestList.length; i++) {
        const request = roomRequestList[i];
        const totalGuestsInRequest = request.adults + request.children;

        // Find the capacity data for this request index
        const capacityForRequest = capacityDataList[i];
        if (!capacityForRequest) continue;

        // Check if the selected room products have capacity allocation issues
        for (const selectedProduct of selectedCombination) {
          const roomCapacity = capacityForRequest.find((c) => c.productCode === selectedProduct);
          if (!roomCapacity) continue;

          // Check for bedroom under-utilization
          if (roomCapacity.numberOfBedrooms && roomCapacity.numberOfBedrooms >= 3) {
            const utilizationRatio = totalGuestsInRequest / roomCapacity.numberOfBedrooms;

            if (utilizationRatio < 0.5) {
              tips.push(
                `Room ${selectedProduct} has ${roomCapacity.numberOfBedrooms} bedrooms but is allocated to only ${totalGuestsInRequest} guest(s). Consider allocating more guests or selecting a smaller room to optimize space utilization.`
              );
            } else if (utilizationRatio < 0.7) {
              tips.push(
                `Room ${selectedProduct} with ${roomCapacity.numberOfBedrooms} bedrooms might be under-utilized with ${totalGuestsInRequest} guest(s). Consider if a smaller room would be more suitable.`
              );
            }
          }

          // Check for capacity mismatch where total allocated is much less than available
          const totalAllocated =
            (roomCapacity.allocatedDefaultAdults || 0) +
            (roomCapacity.allocatedDefaultChildren || 0) +
            (roomCapacity.allocatedExtraAdults || 0) +
            (roomCapacity.allocatedExtraChildren || 0);
          const totalAvailable =
            (roomCapacity.adults || 0) +
            (roomCapacity.children || 0) +
            (roomCapacity.extraAdults || 0) +
            (roomCapacity.extraChildren || 0);

          if (totalAvailable > 0 && totalAllocated / totalAvailable < 0.3) {
            tips.push(
              `Room ${selectedProduct} has significant unused capacity (${totalAvailable - totalAllocated} out of ${totalAvailable} spaces unused). Consider combining multiple room requests or selecting a more appropriately sized room.`
            );
          }
        }
      }

      // Check for scenarios where multiple small requests could be combined
      if (roomRequestList.length > 1) {
        const totalGuests = roomRequestList.reduce(
          (sum, req) => sum + req.adults + req.children,
          0
        );
        const averageGuestsPerRoom = totalGuests / roomRequestList.length;

        if (averageGuestsPerRoom < 2) {
          tips.push(
            `You have multiple small room requests (average ${averageGuestsPerRoom.toFixed(1)} guests per room). Consider combining some requests into larger rooms for better value and space utilization.`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error generating capacity allocation tips: ${error.message}`);
    }

    return tips;
  }

  /**
   * Add popularity metrics to booking history for better recommendations.
   */
  private addPopularityListToProductHistory(
    listFeat: DirectFeatureItem[],
    listFeatEvent: DirectEventItem[],
    listRoomProductAvailable: DirectRoomProductAvailable[],
    listBookingHistory: DirectBookingHistoryItem[]
  ): DirectBookingHistoryItem[] {
    try {
      const result: DirectBookingHistoryItem[] = [];

      // Count event feature occurrences across all events
      // If multiple events have the same feature, it gets higher priority
      const counterEventFeat: string[] = [];
      for (const event of listFeatEvent) {
        counterEventFeat.push(...event.featureList);
      }
      const countEventFeatMap = counter(counterEventFeat);

      // Apply event feature to create new featureList information with updated popularity
      const listFeatApplyEvent = applyEventToFeatureList(countEventFeatMap, listFeat);

      // Create mapping of feature codes to their updated popularity
      const featPopularity: { [key: string]: number } = {};
      listFeatApplyEvent.forEach((item) => {
        featPopularity[item.code] = item.popularity;
      });

      // Convert booking history list to dictionary for faster lookups
      const bookingHistory: {
        [key: string]: { sameBookingPeriod: number; totalHistoryBookingTime: number };
      } = {};
      listBookingHistory.forEach((booking) => {
        bookingHistory[booking.productCode] = {
          sameBookingPeriod: booking.sameBookingPeriod,
          totalHistoryBookingTime: booking.totalHistoryBookingTime
        };
      });

      // Process each room product to create enhanced history records
      for (const product of listRoomProductAvailable) {
        // Get feature list for this product
        const productFeatureList = product.featureList;

        // Calculate feature popularity for all features in this product
        const listFeatPopularity = getObjectInformation(productFeatureList, featPopularity);

        // Look up history for this product code
        const history = bookingHistory[product.code] || {};

        // Create enhanced history record
        result.push({
          productCode: product.code,
          // Use existing booking history or default to 0
          sameBookingPeriod: history.sameBookingPeriod || 0,
          totalHistoryBookingTime: history.totalHistoryBookingTime || 0,
          // Add new fields for product popularity
          productPopularity: listFeatPopularity.reduce((sum, popularity) => sum + popularity, 0),
          featurePopularityList: listFeatPopularity
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Detail error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  async matchFlow(data: DirectFlowInput): Promise<any[]> {
    try {
      const {
        featureList,
        salesStrategy,
        roomRequestList,
        eventFeatureList,
        lowestPriceList, // not use for match flow
        bookingHistoryList, // not use for match flow
        stayOptionRecommendationNumber,
        availableRoomProductList,
        priceJump = false,
        mergedRequest = false,
        spaceTypeRequestList = [], // not use for match flow
        featureRequestList = []
      } = data;

      // const response: MatchFlowResponse[] = [];
      const minimumMatchingPercentage = 0;

      // Step 1: Preprocess input data
      let processedRoomProducts = data.availableRoomProductList;

      if (processedRoomProducts.length === 0) {
        this.logger.log('[Return] Model return empty value ...');
        return [];
      }

      const processedFeatures = this.removeDuplicateFeature(data.featureList);

      // Use available space types if none requested
      const finalSpaceTypeReq = [];

      // Get deduct all room types (using reduce for better performance)
      const deductAll: { [key: string]: number } = processedRoomProducts.reduce(
        (acc, item) => {
          if (item.allocationType === RfcAllocationSetting.ALL) {
            acc[item.code] = item.availableRoomIds.length;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Step 2: Calculate capacity scores for each room request
      // Check if AI scoring is enabled for enhanced recommendations
      // current model is not good, do not use it
      const IS_USE_AI_FOR_SCORE = this.configService.get('IS_USE_AI_FOR_SCORE') === 'true';
      const capacityData: CapacityData[][] = [];

      // Use batch processing when AI scoring is enabled for better efficiency
      if (IS_USE_AI_FOR_SCORE) {
        // Ensure all booking requests have their index set
        this.logger.log(`[Match Flow] roomRequestList: use batch AI scoring for capacity score`);
        const bookingRequestsWithIndex = roomRequestList.map((req, index) => ({
          ...req,
          index: req.index ?? index
        }));

        // Use batch AI scoring method for all room requests at once
        const batchResults = await this.capacityScoreService.batchCapacityScoreWithAI(
          processedRoomProducts,
          bookingRequestsWithIndex,
          deductAll,
          featureRequestList, // Pass feature requests for AI analysis
          finalSpaceTypeReq, // Pass space type preferences
          undefined // Stay info can be added later if available
        );

        // Process batch results
        for (let i = 0; i < batchResults.length; i++) {
          const capacityResult = batchResults[i];

          if (!capacityResult) {
            this.logger.log(`[Return] Model return empty value for request ${i}...`);
            return [];
          }

          // Convert CapacityDataFrame to CapacityData
          // Use combinedScore when AI scoring is enabled for better recommendations
          const capacityDataConverted: CapacityData[] = capacityResult.map((item) => ({
            productCode: item.productCode,
            type: item.type,
            allocationType: item.allocationType,
            spaceTypeList: item.spaceTypeList,
            isRestricted: item.isRestricted,
            mergedIndices: item.mergedIndices,
            allocatedDefaultAdults: item.allocatedDefaultAdults || 0,
            allocatedDefaultChildren: item.allocatedDefaultChildren || 0,
            allocatedDefaultPets: item.allocatedDefaultPets || 0,
            allocatedExtraAdults: item.allocatedExtraAdults || 0,
            allocatedExtraChildren: item.allocatedExtraChildren || 0,
            allocatedExtraPets: item.allocatedExtraPets || 0,
            // Use combined score (AI + capacity) for better recommendations
            capacityScore: item.combinedScore || item.capacityScore || 0,
            adults: item.adults,
            children: item.children,
            pets: item.pets,
            extraAdults: item.extraAdults,
            extraChildren: item.extraChildren,
            extraPets: item.extraPets,
            maximumDefaultCapacity: item.maximumDefaultCapacity,
            maximumExtraCapacity: item.maximumExtraCapacity,
            price: item.price || 0
          }));

          capacityData.push(capacityDataConverted);
        }
      } else {
        // Traditional scoring: process each room request individually
        this.logger.log(`[Match Flow] roomRequestList: use traditional scoring for capacity score`);
        for (let i = 0; i < roomRequestList.length; i++) {
          const bookingReq = roomRequestList[i];

          const capacityResult = await this.capacityScoreService.capacityScore(
            processedRoomProducts,
            bookingReq,
            i,
            deductAll,
            true
          );

          if (!capacityResult) {
            this.logger.log('[Return] Model return empty value ...');
            return [];
          }

          // Convert CapacityDataFrame to CapacityData
          const capacityDataConverted: CapacityData[] = capacityResult.map((item) => ({
            productCode: item.productCode,
            type: item.type,
            allocationType: item.allocationType,
            spaceTypeList: item.spaceTypeList,
            isRestricted: item.isRestricted,
            mergedIndices: item.mergedIndices,
            allocatedDefaultAdults: item.allocatedDefaultAdults || 0,
            allocatedDefaultChildren: item.allocatedDefaultChildren || 0,
            allocatedDefaultPets: item.allocatedDefaultPets || 0,
            allocatedExtraAdults: item.allocatedExtraAdults || 0,
            allocatedExtraChildren: item.allocatedExtraChildren || 0,
            allocatedExtraPets: item.allocatedExtraPets || 0,
            capacityScore: item.capacityScore || 0,
            adults: item.adults,
            children: item.children,
            pets: item.pets,
            extraAdults: item.extraAdults,
            extraChildren: item.extraChildren,
            extraPets: item.extraPets,
            maximumDefaultCapacity: item.maximumDefaultCapacity,
            maximumExtraCapacity: item.maximumExtraCapacity,
            price: item.price || 0
          }));

          capacityData.push(capacityDataConverted);
        }
      }

      const IS_USE_AI_FOR_MATCHFLOW = this.configService.get('IS_USE_AI_FOR_MATCHFLOW') === 'true';
      const featurePriorityMatchList = IS_USE_AI_FOR_MATCHFLOW
        ? await this.matchFlowGeneratePipeline(
          processedRoomProducts,
          featureRequestList,
          processedFeatures
        )
        : [];

      const startTime = Date.now();
      let listMergedRequestsDfs: CapacityData[][][] = [];
      let topMergedIndices: number[][][] = [];

      if (roomRequestList.length > 1) {
        const mergedRequestsResult = await this.mergedRequestsService.getMergedRequests(
          roomRequestList,
          processedRoomProducts,
          salesStrategy.match || []
        );

        listMergedRequestsDfs = mergedRequestsResult.mergedCapacityDfs;
        topMergedIndices = mergedRequestsResult.mergedIndices;

        // Include default (non-merged) option as first choice
        listMergedRequestsDfs.unshift(capacityData);
        topMergedIndices.unshift(capacityData.map((_, index) => [index]));
      } else {
        listMergedRequestsDfs = [capacityData];
        topMergedIndices = [capacityData.map((_, index) => [index])];
      }

      const newListMergedRequestsDfs: CapacityData[][][] = [];
      for (const mergedRequestsDfs of listMergedRequestsDfs) {
        const hasRoomLessThan50 = mergedRequestsDfs?.some((item) => item.length < 50);
        if (!hasRoomLessThan50 && newListMergedRequestsDfs?.length === 0) {
          newListMergedRequestsDfs.push(mergedRequestsDfs);
          continue;
        }
      }
      listMergedRequestsDfs = newListMergedRequestsDfs?.length
        ? newListMergedRequestsDfs
        : listMergedRequestsDfs;

      for (let i = 0; i < listMergedRequestsDfs.length; i++) {
        listMergedRequestsDfs[i] = listMergedRequestsDfs[i].map((item, reqIndex) => {
          const filtered = item.filter((capacity) => {
            const totalAllocated =
              (capacity.allocatedDefaultAdults || 0) +
              (capacity.allocatedExtraAdults || 0) +
              (capacity.allocatedDefaultChildren || 0) +
              (capacity.allocatedExtraChildren || 0) +
              (capacity.allocatedDefaultPets || 0) +
              (capacity.allocatedExtraPets || 0);

            if (totalAllocated === 0) {
              this.logger.warn(
                `Filtering out room ${capacity.productCode} for request ${reqIndex} - no guests allocated`
              );
            }

            return totalAllocated > 0;
          });
          return filtered;
        });
      }

      let combinationDfs: any[] = [];
      let listResultCapacityDfs: any[][] = [];

      for (let idxGroup = 0; idxGroup < listMergedRequestsDfs.length; idxGroup++) {
        // const mergedReqDfs = listMergedRequestsDfs[idxGroup];
        // const mergedIndices = topMergedIndices[idxGroup];

        // let topMatchDfs: any[] = [];
        // let listCodeMatched: string[] = [];

        const mergedReqDfs = listMergedRequestsDfs[idxGroup];
        const mergedIndices = topMergedIndices[idxGroup];

        const CHUNK_SIZE = 100; // 👈 chỉnh theo khả năng DB / CPU

        let topMatchDfs: any[] = [];
        let listCodeMatched: string[] = [];

        const chunks = chunk(mergedReqDfs, CHUNK_SIZE);

        for (const chunk of chunks) {
          const results = await Promise.all(
            chunk.map(async (mergedReqDf) => {
              // Deep clone capacity data to avoid mutations
              const capacityDataCopy = cloneDeep(mergedReqDf);

              // Match products to requested features
              const prodMatchDf = await this.getMatchingProduct(
                featureRequestList,
                featurePriorityMatchList,
                processedRoomProducts,
                processedFeatures,
                eventFeatureList,
                capacityDataCopy
              );

              // Apply final scores
              const totalMatchDf = prodMatchDf.map((row) => {
                const { similarityScore, compareMatchingScore, matchingScore, isMatched } =
                  calculateFinalScore(row, featureRequestList);

                return {
                  ...row,
                  similarityScore,
                  compareMatchingScore,
                  matchingScore,
                  // Override isMatched if capacity requirements are not met
                  isMatched: isMatched !== undefined ? isMatched : row.isMatched
                };
              });

              // Filter top matches
              const topMatchDf = filteringTopMatch(
                totalMatchDf,
                false,
                stayOptionRecommendationNumber
              );

              // Track matched product codes
              const matchedCodes = topMatchDf
                .filter(
                  (row: any) =>
                    row.isMatched && row.compareMatchingScore >= minimumMatchingPercentage
                )
                .map((row: any) => row.productCode);

              return {
                topMatchDf,
                matchedCodes
              };
            })
          );

          // collect results
          topMatchDfs.push(...results.map((r) => r.topMatchDf));
          listCodeMatched.push(...results.flatMap((r) => r.matchedCodes));
        }

        // Store processed matches
        listResultCapacityDfs.push(topMatchDfs);

        // Deduplicate codes
        listCodeMatched = Array.from(new Set(listCodeMatched));

        // Generate optimal room combinations
        let combinationDf = await this.recommendationAlgorithmService.multipleRoomPipeline(
          salesStrategy.match || [],
          topMatchDfs,
          processedRoomProducts,
          [[]], // No exclusions
          [], // No exclusions
          listCodeMatched,
          'compareMatchingScore'
        );

        if (!combinationDf) {
          continue;
        }

        // Rename score column
        combinationDf = combinationDf.map((row: any) => {
          if ('value' in row) {
            row.compareMatchingScore = row.value;
            delete row.value;
          }
          return {
            ...row,
            idxGroup: idxGroup,
            mergedIndices: mergedIndices
          };
        });

        for (const row of combinationDf) {
          combinationDfs.push(row);
        }
      }

      // === Handle case with no results ===
      if (combinationDfs.length === 0) {
        return [];
      }

      let dictCombination: any;

      if (priceJump) {
        const codeBasePrice: Record<string, number> = {};
        for (const product of availableRoomProductList) {
          const basePrice = product.basePrice || 0;
          codeBasePrice[product.code] = basePrice;
        }

        const matchDf = combinationDfs.map((row) => ({
          ...row,
          basePrice: this.directProductPipelineService.calculateBasePrice(
            row.combination,
            codeBasePrice
          ),
          // Ensure idxGroup exists (standardized field name)
          idxGroup: row.idxGroup ?? 0,
          isMatched: row.isMatched ?? false
        }));

        dictCombination = await this.priceJumpService.priceJumpExecute(
          priceJump,
          matchDf,
          [],
          stayOptionRecommendationNumber,
          'popular',
          'compareMatchingScore'
        );
      } else {
        // Top matches across all combinations
        const topMatchDf = filteringTopMatch(combinationDfs, true, stayOptionRecommendationNumber);

        dictCombination = {
          combination: topMatchDf.map((r) => r.combination),
          idxGroup: topMatchDf.map((r) => r.idxGroup),
          isMatched: topMatchDf.map((r) => r.isMatched),
          isRestricted: topMatchDf.map((r) => r.isRestricted)
        };
      }

      const listCombination = dictCombination.combination ?? [];
      const listIdxGroup = dictCombination.idxGroup ?? [];
      const listIsMatched = dictCombination.isMatched ?? [];
      const listIsRestricted = dictCombination.isRestricted ?? [];

      // === Final response formatting ===
      const result: any[] = [];
      for (let i = 0; i < listCombination.length; i++) {
        const combination = listCombination[i];
        const idxGroup = listIdxGroup[i];
        const match = listIsMatched[i];
        const restricted = listIsRestricted[i];

        const { recommendations, averageMatchingScore } = processingResponseMergedRequests(
          combination,
          listResultCapacityDfs[idxGroup] ?? []
        );

        const option = {
          isRestricted: restricted,
          isMatched: match,
          averageMatchingScore: averageMatchingScore,
          recommendationList: recommendations
        };

        result.push(option);
      }

      this.logger.log('Match flow execute successful !');
      this.logger.debug(
        `\nMatch flow: ${JSON.stringify(result.map((r) => r.recommendationList.map((r) => r.code)))}`
      );

      return result;
    } catch (error) {
      this.logger.error(`Detail error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  async getMatchingProduct(
    featureRequestList: DirectFeatureItem[],
    featureSimilarityList: string[],
    processedRoomProducts: DirectRoomProductAvailable[],
    hotelFeatureList: DirectFeatureItem[],
    hotelEventFeatureList: DirectEventItem[],
    capacityList: CapacityData[]
  ) {
    try {
      // 1. Retrieve available features & one-hot encoded matrix
      const { listFeatAvailable, productFeatMap } = this.getFeatureAvailableInProductAndRequest(
        processedRoomProducts,
        featureRequestList
      );

      // 2. Filter products to those in capacity
      const capacityProductCodes = new Set(capacityList.map((c) => c.productCode));
      const filteredProductFeat: Record<string, Record<string, number>> = {};
      for (const [code, feats] of Object.entries(productFeatMap)) {
        if (capacityProductCodes.has(code)) {
          filteredProductFeat[code] = feats;
        }
      }

      // 3. Aggregate event feature counts
      const eventFeatCounter: Record<string, number> = {};
      for (const event of hotelEventFeatureList) {
        for (const feat of event.featureList) {
          eventFeatCounter[feat] = (eventFeatCounter[feat] || 0) + 1;
        }
      }

      // 4. Apply event to features (dummy: identity function, implement as needed)
      const listFeatApplyEvent = applyEventToFeatureList(
        new Map(Object.entries(eventFeatCounter)),
        hotelFeatureList
      );

      // 5. Build feature dictionary
      const dictFeat: Record<string, { code: string; name: string; popularity: number }> = {};
      for (const feature of listFeatApplyEvent) {
        dictFeat[feature.code] = {
          code: feature.code,
          name: feature.name,
          popularity: feature.popularity
        };
      }

      const listFeatPopularity = listFeatAvailable.map((code) => dictFeat[code]?.popularity || 0);

      // 6. Weight product feature matrix by popularity
      const productFeatPopularity: Record<string, Record<string, number>> = {};
      for (const [code, feats] of Object.entries(filteredProductFeat)) {
        productFeatPopularity[code] = {};
        listFeatAvailable.forEach((feat, idx) => {
          const base = feats[feat] || 0;
          const weight = listFeatPopularity[idx] || 0;
          productFeatPopularity[code][feat] = base * weight;
        });
      }

      // 7. Compute matching + popularity scores
      const productMatchArray = calculateMatchingAndPopularityScore(
        dictFeat,
        featureRequestList,
        productFeatPopularity
      );

      // Convert array to Record for easier access
      let productMatch: Record<string, any> = {};
      productMatchArray.forEach((item) => {
        productMatch[item.productCode] = item;
      });

      // 8. Similarity score if similarity features provided
      if (featureSimilarityList.length > 0) {
        const dictCodeFeat: Record<string, string> = {};
        for (const [name, info] of Object.entries(dictFeat)) {
          dictCodeFeat[info.code] = name;
        }

        const listFeatSimilarityCode = featureSimilarityList.map((code) => dictCodeFeat[code]);

        const listFeatSimilarityPopularity = listFeatSimilarityCode.map(
          (code) => dictFeat[code]?.popularity || 0
        );
        const totalSimilarityPopularity = listFeatSimilarityPopularity.reduce((a, b) => a + b, 0);

        for (const [code, feats] of Object.entries(productFeatPopularity)) {
          let score = 0;
          for (const code of listFeatSimilarityCode) {
            score += feats[code] || 0;
          }
          const similarityScore =
            totalSimilarityPopularity > 0 ? score / totalSimilarityPopularity : 0;
          if (!productMatch[code]) productMatch[code] = { productCode: code };
          productMatch[code]['similarityScore'] = similarityScore;
        }
      }

      // 9. Merge scores with capacity
      const merged: CapacityData[] = capacityList.map((cap) => {
        const scores = productMatch[cap.productCode] || {};
        return { ...cap, ...scores };
      });

      return merged;
    } catch (error) {
      this.logger.error(`Detail error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }

  /**
   * Main orchestrator for the direct flow recommendation system.
   */
  async directFlow(data: DirectFlowInput): Promise<DirectFlowResponse> {
    try {
      // Validate input data first
      if (!data) {
        throw new Error('Input data is required');
      }
      if (!data.roomRequestList?.length) {
        throw new Error('Room requests are required');
      }

      // Extract and validate required input data
      const {
        featureList: listFeat,
        salesStrategy: saleStrategy,
        roomRequestList: listRoomReq,
        eventFeatureList: listFeatEvent,
        lowestPriceList: listLowestPrice,
        lowestPrice: lowestPrice,
        bookingHistoryList: listBookingHistory,
        stayOptionRecommendationNumber: stayOptRcmNumber,
        availableRoomProductList: listRoomProductAvailable,
        priceJump = false,
        mergedRequest = true,
        spaceTypeRequestList: listSpaceTypeReq = []
      } = data;
    } catch (error) {
      throw new InputValueError(error.message);
    }

    // Initialize the default response structure
    const response: DirectFlowResponse = {
      stayOptionRecommendationList: [
        { bookingFlow: 'mostPopular', recommendationList: {} },
        { bookingFlow: 'ourTip', recommendationList: {} },
        { bookingFlow: 'direct', recommendationList: {} }
      ]
    };

    try {
      const startTime = Date.now();

      let processedRoomProducts = cloneDeep(data.availableRoomProductList);

      if (processedRoomProducts.length === 0) {
        return response;
      }

      const processedFeatures = this.removeDuplicateFeature(data.featureList);

      // Use available space types if none requested
      let finalSpaceTypeReq = [];

      // Enhance booking history with popularity metrics
      const enhancedBookingHistory = this.addPopularityListToProductHistory(
        processedFeatures,
        data.eventFeatureList,
        processedRoomProducts,
        data.bookingHistoryList
      );

      // Get deduct all room types (using reduce for better performance)
      const deductAll: { [key: string]: number } = processedRoomProducts.reduce(
        (acc, item) => {
          if (item.allocationType === RfcAllocationSetting.ALL) {
            acc[item.code] = item.availableRoomIds.length;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Step 2: Prioritize and sort room requests
      // Priority order: Pets first (rarest constraint), then children, then adults-only
      // This ensures requests with stricter requirements get processed first
      const prioritizedRoomRequests = prioritizeRoomRequests(data.roomRequestList);

      this.logger.log(
        `Prioritized room requests: Pets first, then children, then adults-only. ` +
        `Processing order: ${prioritizedRoomRequests.map((r, i) => `${i}: ${r.adults}A/${r.children}C/${r.pets}P`).join(', ')}`
      );

      // Step 3: Calculate capacity scores for each room request (in priority order)
      const capacityData: CapacityData[][] = [];

      for (let i = 0; i < prioritizedRoomRequests.length; i++) {
        const bookingReq = prioritizedRoomRequests[i];

        const capacityResult = await this.capacityScoreService.capacityScore(
          processedRoomProducts,
          bookingReq,
          i,
          deductAll
        );

        if (!capacityResult) {
          return response;
        }

        // Convert CapacityDataFrame to CapacityData
        const capacityDataConverted: CapacityData[] = capacityResult.map((item) => {
          // Extract building from availableRoomDetails
          // If all rooms have the same building (checked in capacity scoring), use that building
          // Otherwise, use the first room's building for grouping purposes
          let building: string = 'NO_BUILDING';
          if (item.availableRoomDetails && item.availableRoomDetails.length > 0) {
            const firstBuilding = item.availableRoomDetails[0]?.building || 'NO_BUILDING';
            // Check if all rooms have the same building
            const allSameBuilding = item.availableRoomDetails.every(
              (detail) => detail.building === firstBuilding
            );
            // Use building if all rooms share the same building, or if there's only one room
            if (allSameBuilding || item.availableRoomDetails.length === 1) {
              building = firstBuilding ?? 'NO_BUILDING';
            }
          }

          return {
            productCode: item.productCode,
            type: item.type,
            allocationType: item.allocationType,
            spaceTypeList: item.spaceTypeList,
            isRestricted: item.isRestricted,
            mergedIndices: item.mergedIndices,
            allocatedDefaultAdults: item.allocatedDefaultAdults || 0,
            allocatedDefaultChildren: item.allocatedDefaultChildren || 0,
            allocatedDefaultPets: item.allocatedDefaultPets || 0,
            allocatedExtraAdults: item.allocatedExtraAdults || 0,
            allocatedExtraChildren: item.allocatedExtraChildren || 0,
            allocatedExtraPets: item.allocatedExtraPets || 0,
            capacityScore: item.capacityScore || 0,
            price: item.price || 0,
            adults: item.adults,
            children: item.children,
            pets: item.pets,
            extraAdults: item.extraAdults,
            extraChildren: item.extraChildren,
            extraPets: item.extraPets,
            maximumDefaultCapacity: item.maximumDefaultCapacity,
            maximumExtraCapacity: item.maximumExtraCapacity,
            numberOfBedrooms: item.numberOfBedrooms,
            building // Include building information
          };
        });

        capacityData.push(capacityDataConverted);
      }
      // Step 4: Generate "Most Popular" recommendations
      let listExcludeCombination: string[][] = [data.lowestPriceList];

      const mostPopularResult = await this.recommendationPipelineService.pipelineMostPopular(
        processedRoomProducts,
        enhancedBookingHistory,
        capacityData,
        data.salesStrategy.mostPopular,
        listExcludeCombination,
        prioritizedRoomRequests,
        data.lowestPrice,
        data.popularConfig
      );

      // Step 5: Generate "Our Tip" recommendations
      listExcludeCombination = listExcludeCombination.concat(mostPopularResult.combinations);
      const listExcludeBasePrice = [mostPopularResult.basePrice];

      const ourTipResult = await this.ourTipService.pipelineOurTip(
        processedRoomProducts,
        capacityData,
        data.salesStrategy.ourTip,
        enhancedBookingHistory,
        listExcludeCombination,
        listExcludeBasePrice,
        prioritizedRoomRequests,
        data.lowestPrice
      );
      // Step 6: Generate "Direct Product" recommendations
      listExcludeCombination = listExcludeCombination.concat(ourTipResult.combinations);
      listExcludeBasePrice.push(ourTipResult.basePrice);

      const directResult = await this.directProductPipelineService.pipelineDirectProduct(
        prioritizedRoomRequests,
        finalSpaceTypeReq,
        data.priceJump ?? true,
        data.stayOptionRecommendationNumber,
        data.salesStrategy.direct,
        listExcludeCombination,
        listExcludeBasePrice,
        processedRoomProducts,
        capacityData,
        enhancedBookingHistory
      );
      // Generate capacity allocation tips based on the selected combinations
      let allTips: string[] = [];

      try {
        // Collect tips from all recommendation types
        if (
          mostPopularResult.response.recommendationList &&
          typeof mostPopularResult.response.recommendationList === 'object' &&
          Object.keys(mostPopularResult.response.recommendationList).length > 0
        ) {
          const mostPopularCombination = mostPopularResult.combinations[0] || [];
          const mostPopularTips = this.generateCapacityAllocationTips(
            capacityData,
            prioritizedRoomRequests,
            mostPopularCombination
          );
          allTips.push(...mostPopularTips);
        }

        if (
          ourTipResult.response.recommendationList &&
          typeof ourTipResult.response.recommendationList === 'object' &&
          Object.keys(ourTipResult.response.recommendationList).length > 0
        ) {
          const ourTipCombination = ourTipResult.combinations[0] || [];
          const ourTips = this.generateCapacityAllocationTips(
            capacityData,
            prioritizedRoomRequests,
            ourTipCombination
          );
          allTips.push(...ourTips);
        }

        if (
          directResult.response.recommendationList &&
          typeof directResult.response.recommendationList === 'object' &&
          Object.keys(directResult.response.recommendationList).length > 0
        ) {
          const directCombination = directResult.combinations[0] || [];
          const directTips = this.generateCapacityAllocationTips(
            capacityData,
            prioritizedRoomRequests,
            directCombination
          );
          allTips.push(...directTips);
        }

        // Remove duplicates and limit to top 3 most important tips
        allTips = [...new Set(allTips)].slice(0, 3);
      } catch (tipError) {
        this.logger.error(`Error generating tips: ${tipError.message}`);
      }

      // Combine all recommendation types into the final response
      let finalResponse: DirectFlowResponse = {
        stayOptionRecommendationList: [
          mostPopularResult.response,
          ourTipResult.response,
          directResult.response
        ]
      };

      // Group recommendations by building to combine units with same building
      finalResponse.stayOptionRecommendationList = finalResponse.stayOptionRecommendationList.map(
        (flowResponse) => groupRecommendationsByBuilding(flowResponse)
      );

      // Add tips to the response if any were generated
      if (allTips.length > 0) {
        (finalResponse as any).capacityAllocationTips = allTips;
      }

      this.logger.log('Feature Recommendation Model execute successful !');
      this.logger.debug(
        `\nMost popular: ${JSON.stringify(mostPopularResult.combinations)}\n` +
        `Our tip: ${JSON.stringify(ourTipResult.combinations)}\n` +
        `Direct: ${JSON.stringify(directResult.combinations)}`
      );

      this.logger.debug(
        `⏱️ [Direct Flow] Total time: ${((Date.now() - startTime) / 1000).toFixed(3)} seconds`
      );

      return finalResponse;
    } catch (error) {
      this.logger.error(`Detail Error: ${error.stack}`);
      throw new DirectProcessExecuteError(error.message);
    }
  }
}
