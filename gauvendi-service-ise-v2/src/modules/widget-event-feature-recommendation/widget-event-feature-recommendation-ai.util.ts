import { Logger } from '@nestjs/common';

const logger = new Logger('WidgetEventFeatureRecommendationAI');

/**
 * Interface for room request data
 */
interface RoomRequest {
  adult: number;
  pets: number;
  children: number[];
}

/**
 * Interface for feature with popularity score
 */
interface FeatureItem {
  featureCode: string;
  featureName: string;
  popularityScore: number;
}

/**
 * Interface for event feature data
 */
interface EventFeature {
  name: string;
  from: string;
  to: string;
  featureList: string[];
}

/**
 * Interface for booking period
 */
interface BookingPeriod {
  arrival: string;
  departure: string;
}

/**
 * Analysis payload structure from service
 */
export interface AnalysisPayload {
  roomRequestList: RoomRequest[];
  featureList: FeatureItem[];
  numberOfFeatures: number;
  bookingPeriod: BookingPeriod;
  eventFeatureList: EventFeature[];
}

/**
 * Feature with additional metadata for processing
 */
interface ProcessedFeature extends FeatureItem {
  isEventPreferred: boolean;
  suitabilityScore: number;
}

/**
 * AI Feature Recommendation Engine
 * Implements the OpenAI prompt logic locally for fast, memory-efficient recommendations
 */
export class WidgetEventFeatureRecommendationAI {
  
  /**
   * Main function to get feature recommendations based on analysis payload
   * @param payload - Analysis payload from service
   * @returns Array of recommended feature codes
   */
  static getRecommendations(payload: AnalysisPayload): string[] {
    try {
      // Step 1: Parse Inputs & Initial Definitions
      const { maxAdultsPerRoom, totalPets, eventFeatureCodes } = this.parseInputs(payload);
      
      // Step 2: Strict Suitability Filtering (Non-Negotiable)
      const strictlySuitableFeatures = this.strictSuitabilityFilter(
        payload.featureList,
        payload.roomRequestList,
        maxAdultsPerRoom,
        totalPets
      );
      
      if (strictlySuitableFeatures.length === 0) {
        logger.warn('No strictly suitable features found');
        return [];
      }
      
      // Step 3: Prioritize Event Features
      const prioritizedFeatures = this.prioritizeEventFeatures(
        strictlySuitableFeatures,
        eventFeatureCodes
      );
      
      // Step 4: Rank by Score and Event Preference
      const rankedFeatures = this.rankFeatures(prioritizedFeatures);
      
      // Step 5: Select Top N Features
      const topFeatures = this.selectTopFeatures(rankedFeatures, payload.numberOfFeatures);
      
      return topFeatures.map(feature => feature.featureCode);
      
    } catch (error) {
      logger.error(`AI recommendation failed: ${error.message}`, error.stack);
      // Fallback: return top features by popularity score
      return payload.featureList
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, payload.numberOfFeatures)
        .map(feature => feature.featureCode);
    }
  }
  
  /**
   * Step 1: Parse inputs and calculate initial definitions
   */
  private static parseInputs(payload: AnalysisPayload) {
    const maxAdultsPerRoom = Math.max(...payload.roomRequestList.map(room => room.adult));
    const totalPets = payload.roomRequestList.reduce((sum, room) => sum + room.pets, 0);
    
    // Extract all event feature codes/names for prioritization
    const eventFeatureCodes = new Set<string>();
    payload.eventFeatureList.forEach(event => {
      event.featureList.forEach(featureName => {
        eventFeatureCodes.add(featureName);
      });
    });
    
    return {
      maxAdultsPerRoom,
      totalPets,
      eventFeatureCodes
    };
  }
  
  /**
   * Step 2: Strict Suitability Filtering
   * Features must pass ALL checks for EVERY room
   */
  private static strictSuitabilityFilter(
    featureList: FeatureItem[],
    roomRequestList: RoomRequest[],
    maxAdultsPerRoom: number,
    totalPets: number
  ): FeatureItem[] {
    return featureList.filter(feature => {
      return this.isFeatureSuitableForAllRooms(
        feature,
        roomRequestList,
        maxAdultsPerRoom,
        totalPets
      );
    });
  }
  
  /**
   * Check if a feature is suitable for all rooms in the request
   */
  private static isFeatureSuitableForAllRooms(
    feature: FeatureItem,
    roomRequestList: RoomRequest[],
    maxAdultsPerRoom: number,
    totalPets: number
  ): boolean {
    const featureName = feature.featureName.toLowerCase();
    const featureCode = feature.featureCode.toLowerCase();
    
    // Pet-Friendliness Check
    if (totalPets > 0) {
      if (featureName.includes('pet friendly') || featureCode.includes('pet')) {
        return true; // Pet-friendly features are highly relevant
      }
      // Other features must be compatible or general enough
      if (this.isIncompatibleWithPets(featureName, featureCode)) {
        return false;
      }
    }
    
    // Check suitability for each room
    for (const room of roomRequestList) {
      if (!this.isFeatureSuitableForRoom(feature, room, maxAdultsPerRoom)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if feature is suitable for a specific room
   */
  private static isFeatureSuitableForRoom(
    feature: FeatureItem,
    room: RoomRequest,
    maxAdultsPerRoom: number
  ): boolean {
    const featureName = feature.featureName.toLowerCase();
    const featureCode = feature.featureCode.toLowerCase();
    const totalOccupants = room.adult + Number(room.children?.length || 0);
    
    // Single Bed Constraint (CRITICAL)
    if (this.isSingleBedFeature(featureName, featureCode)) {
      return room.adult === 1 && Number(room.children?.length || 0) === 0;
    }
    
    // Twin Bed Constraint
    if (this.isTwinBedFeature(featureName, featureCode)) {
      return room.adult <= 2 && totalOccupants <= 2;
    }
    
    // Multi-Bedroom/Apartment Features
    const bedroomCount = this.extractBedroomCount(featureName, featureCode);
    if (bedroomCount > 0) {
      return this.isBedroomCountSuitable(bedroomCount, totalOccupants, maxAdultsPerRoom);
    }
    
    // Size-based features (S, L, XL)
    const sizeCategory = this.extractSizeCategory(featureName, featureCode);
    if (sizeCategory) {
      return this.isSizeSuitable(sizeCategory, totalOccupants, maxAdultsPerRoom);
    }
    
    // General features are usually suitable
    return true;
  }
  
  /**
   * Step 3: Prioritize Event Features
   */
  private static prioritizeEventFeatures(
    suitableFeatures: FeatureItem[],
    eventFeatureCodes: Set<string>
  ): ProcessedFeature[] {
    return suitableFeatures.map(feature => {
      const isEventPreferred = eventFeatureCodes.has(feature.featureName) || 
                              eventFeatureCodes.has(feature.featureCode);
      
      return {
        ...feature,
        isEventPreferred,
        suitabilityScore: 1.0 // All features passed suitability filter
      };
    });
  }
  
  /**
   * Step 4: Rank by Score and Event Preference
   */
  private static rankFeatures(features: ProcessedFeature[]): ProcessedFeature[] {
    return features.sort((a, b) => {
      // 1. Event Preference (highest priority)
      if (a.isEventPreferred !== b.isEventPreferred) {
        return b.isEventPreferred ? 1 : -1;
      }
      
      // 2. Popularity Score (within same preference group)
      if (a.popularityScore !== b.popularityScore) {
        return b.popularityScore - a.popularityScore;
      }
      
      // 3. Tie-breaking by feature code (alphabetical)
      return a.featureCode.localeCompare(b.featureCode);
    });
  }
  
  /**
   * Step 5: Select Top N Features
   */
  private static selectTopFeatures(
    rankedFeatures: ProcessedFeature[],
    numberOfFeatures: number
  ): ProcessedFeature[] {
    return rankedFeatures.slice(0, Math.min(numberOfFeatures, rankedFeatures.length));
  }
  
  // === HELPER METHODS FOR FEATURE ANALYSIS ===
  
  private static isSingleBedFeature(featureName: string, featureCode: string): boolean {
    return featureName.includes('single bed') || 
           featureCode.includes('sgb') ||
           featureCode.includes('single');
  }
  
  private static isTwinBedFeature(featureName: string, featureCode: string): boolean {
    return featureName.includes('twin bed') || 
           featureName.includes('twin') ||
           featureCode.includes('tb') ||
           featureCode.includes('twin');
  }
  
  private static extractBedroomCount(featureName: string, featureCode: string): number {
    const combined = `${featureName} ${featureCode}`.toLowerCase();
    
    if (combined.includes('one bedroom') || combined.includes('1 bedroom')) return 1;
    if (combined.includes('two bedroom') || combined.includes('2 bedroom')) return 2;
    if (combined.includes('three bedroom') || combined.includes('3 bedroom')) return 3;
    if (combined.includes('four bedroom') || combined.includes('4 bedroom')) return 4;
    
    return 0;
  }
  
  private static isBedroomCountSuitable(
    bedroomCount: number,
    totalOccupants: number,
    maxAdultsPerRoom: number
  ): boolean {
    // General rule: bedroom count should accommodate occupants
    // 1 bedroom: 1-2 total occupants
    // 2 bedroom: 3-4 total occupants
    // 3+ bedroom: 5+ total occupants
    
    switch (bedroomCount) {
      case 1:
        return totalOccupants <= 2;
      case 2:
        return totalOccupants >= 2 && totalOccupants <= 4;
      case 3:
        return totalOccupants >= 3 && totalOccupants <= 6;
      case 4:
        return totalOccupants >= 4;
      default:
        return true;
    }
  }
  
  private static extractSizeCategory(featureName: string, featureCode: string): string | null {
    const combined = `${featureName} ${featureCode}`.toLowerCase();
    
    if (combined.includes('xl') || combined.includes('extra large')) return 'XL';
    if (combined.includes('l - size') || combined.includes('large')) return 'L';
    if (combined.includes('s - size') || combined.includes('small')) return 'S';
    
    return null;
  }
  
  private static isSizeSuitable(
    sizeCategory: string,
    totalOccupants: number,
    maxAdultsPerRoom: number
  ): boolean {
    switch (sizeCategory) {
      case 'S':
        return totalOccupants <= 2;
      case 'L':
        return totalOccupants >= 2 && totalOccupants <= 4;
      case 'XL':
        return totalOccupants >= 3;
      default:
        return true;
    }
  }
  
  private static isIncompatibleWithPets(featureName: string, featureCode: string): boolean {
    const combined = `${featureName} ${featureCode}`.toLowerCase();
    
    // Features that might be incompatible with pets
    const incompatibleKeywords = [
      'allergy free',
      'hypoallergenic', 
      'no pets',
      'pet free'
    ];
    
    return incompatibleKeywords.some(keyword => combined.includes(keyword));
  }
}

/**
 * Main exported function for easy usage
 * @param payload - Analysis payload from service
 * @returns Array of recommended feature codes
 */
export function getAIFeatureRecommendations(payload: AnalysisPayload): string[] {
  return WidgetEventFeatureRecommendationAI.getRecommendations(payload);
}
