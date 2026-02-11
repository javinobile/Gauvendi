import { Logger } from '@nestjs/common';
import {
  FeatureRecommendationRequest,
  EventFeatureRequest
} from './widget-event-feature-recommendation.dto';

const logger = new Logger('WidgetEventFeatureRecommendationUtil');

/**
 * Interface for feature with calculated score
 */
export interface FeatureWithScore {
  name: string;
  code: string;
  score: number;
}

/**
 * Interface for feature counter from events
 */
interface FeatureCounter {
  [key: string]: number;
}

/**
 * Result interface for feature list with score function
 */
export interface FeatureListWithScoreResult {
  listFeatHighPop: FeatureWithScore[];
  listFeatRcm: string[];
}

/**
 * Convert a list of features into a formatted context string and a feature recommendation list.
 *
 * This function performs the following steps:
 *   1. Applies event-based modifications to the feature list using applyEventToFeatureList.
 *   2. Converts the updated feature list into a processable array.
 *   3. Calculates a popularity score for each feature by combining its normalized popularity
 *      (scaled from 0 to 1) and a min-max normalized selection score.
 *   4. Sorts the features by the computed popularity score and selects the top_k features.
 *   5. From the top features, extracts the top features with the highest popularity scores to form
 *      a feature recommendation list.
 *   6. Returns the formatted feature results.
 *
 * @param listFeat - List of feature objects
 * @param listFeatEvent - List of event objects, each containing a "featureList" key
 * @param featRcmNumber - Number of features to recommend
 * @param topK - The number of top features to select from the sorted list (default: 25)
 * @returns Object containing high popularity features list and recommendation codes
 */
export function featureListWithScore(
  listFeat: FeatureRecommendationRequest[],
  listFeatEvent: EventFeatureRequest[],
  featRcmNumber: number,
  topK: number = 25
): FeatureListWithScoreResult {
  try {
    // Aggregate all event-based features from listFeatEvent
    const counterFeatEvent = aggregateEventFeatures(listFeatEvent);

    // Apply event adjustments to the original feature list
    const listFeatApplyEvent = applyEventToFeatureList(counterFeatEvent, listFeat);

    // Calculate min and max selection values for normalization
    const selectionValues = listFeatApplyEvent.map((feat) => feat.selection);
    const minSelection = Math.min(...selectionValues);
    const maxSelection = Math.max(...selectionValues);

    // Calculate combined popularity score for each feature
    const featuresWithScore = listFeatApplyEvent.map((feature) => {
      const score = calculatePopularityScore(feature, minSelection, maxSelection);
      return {
        name: feature.name,
        code: feature.code,
        score: score
      };
    });

    // Sort features by score in descending order and select top_k features
    const topFeaturesArray = featuresWithScore.sort((a, b) => b.score - a.score).slice(0, topK);

    // From the top features, select the top ones as the feature recommendation list
    const sortedRecommendations = topFeaturesArray
      .sort((a, b) => b.score - a.score)
      .slice(0, featRcmNumber);

    const listFeatRcm = sortedRecommendations.map((feat) => feat.code);

    return {
      listFeatHighPop: topFeaturesArray,
      listFeatRcm: listFeatRcm
    };
  } catch (error) {
    logger.error(`Feature list with score calculation error: ${error.message}`, error.stack);
    throw new Error(`Feature processing failed: ${error.message}`);
  }
}

/**
 * Aggregate event features into a counter map
 * @param listFeatEvent - List of event feature requests
 * @returns Counter object with feature names and their occurrence count
 */
function aggregateEventFeatures(listFeatEvent: EventFeatureRequest[]): FeatureCounter {
  const counterFeatEvent: FeatureCounter = {};

  for (const event of listFeatEvent) {
    if (event.featureList && Array.isArray(event.featureList)) {
      for (const feature of event.featureList) {
        if (feature && feature.trim()) {
          counterFeatEvent[feature] = (counterFeatEvent[feature] || 0) + 1;
        }
      }
    }
  }

  return counterFeatEvent;
}

/**
 * Apply event modifications to the feature list
 * This function adjusts feature selection counts based on event occurrences
 *
 * @param counterFeatEvent - Counter of features from events
 * @param listFeat - Original feature list
 * @returns Modified feature list with event adjustments
 */
function applyEventToFeatureList(
  counterFeatEvent: FeatureCounter,
  listFeat: FeatureRecommendationRequest[]
): FeatureRecommendationRequest[] {
  return listFeat.map((feature) => {
    // Find matching event features by name (assuming event features use names, not codes)
    const eventCount = counterFeatEvent[feature.name] || 0;

    // Apply event boost to selection score
    // This is a simplified approach - you may want to adjust the boost logic based on requirements
    const adjustedSelection = feature.selection + eventCount * 2; // Boost factor of 2 for event features

    return {
      ...feature,
      selection: adjustedSelection
    };
  });
}

/**
 * Calculate popularity score for a feature
 * Combines normalized popularity (60%) and normalized selection score (40%)
 *
 * @param feature - Feature to calculate score for
 * @param minSelection - Minimum selection value for normalization
 * @param maxSelection - Maximum selection value for normalization
 * @returns Calculated popularity score
 */
function calculatePopularityScore(
  feature: FeatureRecommendationRequest,
  minSelection: number,
  maxSelection: number
): number {
  // Normalize the popularity score by dividing by 5
  const popularityScore = feature.popularity / 5;

  // Scale the selection score using min-max normalization
  let selectionScore: number;

  if (minSelection === maxSelection) {
    // Handle edge case where all selection values are the same
    selectionScore = Math.min(1, Math.max(0, minSelection));
  } else {
    selectionScore = feature.selection / maxSelection;
  }

  // If the selection score is not a valid number, return the popularity score only
  if (isNaN(selectionScore) || !isFinite(selectionScore)) {
    return popularityScore;
  }

  // Combine the popularity score (60%) and selection score (40%)
  return popularityScore * 0.6 + selectionScore * 0.4;
}

/**
 * Helper function to validate feature list input
 * @param listFeat - Feature list to validate
 * @returns Boolean indicating if the list is valid
 */
export function validateFeatureList(listFeat: FeatureRecommendationRequest[]): boolean {
  if (!Array.isArray(listFeat) || listFeat.length === 0) {
    return false;
  }

  return listFeat.every(
    (feature) =>
      feature &&
      typeof feature.code === 'string' &&
      typeof feature.name === 'string' &&
      typeof feature.popularity === 'number' &&
      typeof feature.selection === 'number'
  );
}

/**
 * Helper function to validate event feature list input
 * @param listFeatEvent - Event feature list to validate
 * @returns Boolean indicating if the list is valid
 */
export function validateEventFeatureList(listFeatEvent: EventFeatureRequest[]): boolean {
  if (!Array.isArray(listFeatEvent)) {
    return false;
  }

  return listFeatEvent.every(
    (event) => event && typeof event.name === 'string' && Array.isArray(event.featureList)
  );
}
