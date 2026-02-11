import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WidgetEventFeatureRecommendationDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsString()
  @IsNotEmpty()
  fromDate: string;

  @IsString()
  @IsNotEmpty()
  toDate: string;

  @IsString()
  @IsOptional()
  promoCode?: string;

  @IsNumber()
  @IsNotEmpty()
  totalAdults: number;

  @IsNumber()
  @IsOptional()
  numberOfFeatures?: number = 3;

  @IsNumber()
  @IsNotEmpty()
  totalPets: number;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  childAgeList: Array<number>;

  @IsString()
  @IsOptional()
  translateTo?: string;
}

export interface EventMessageResult {
  eventMessage: string;
  travelSegmentMessage: string;
}

export interface FeatureRecommendationRequest {
  code: string;
  name: string;
  type: string;
  popularity: number;
  selection: number;
}

export interface RecommendationFeatureHistoryDto {
  code: string;
  count: number;
}

// RecommendationHistory is now directly an array of RecommendationFeatureHistoryDto
export type RecommendationHistoryDto = RecommendationFeatureHistoryDto[];

export interface EventFeatureRequest {
  name: string;
  from: string;
  to: string;
  featureList: string[];
}

/**
 * Feature Recommendation Model API - TypeScript Interfaces
 * Base URL: http://127.0.0.1:8000
 */

// ============== REQUEST INTERFACES ==============

export interface RoomRequest {
  index: string;
  adults: number; // >= 0
  children: number; // >= 0
  pets: number; // >= 0
}

export interface BookingPeriod {
  arrival: string; // Format: YYYY-MM-DD
  departure: string; // Format: YYYY-MM-DD
}

export interface FeatureEvent {
  name: string;
  from: string; // Format: YYYY-MM-DD
  to: string; // Format: YYYY-MM-DD
  featureList: Feature[] | [];
}

export interface Feature {
  name: string;
  code: string;
  type: string;
  popularity: number; // >= 0
  selection: number; // >= 0
}

export interface IFeatureRecommendationRequest {
  roomRequestList: RoomRequest[]; // min 1 item
  bookingPeriod: BookingPeriod;
  featureRecommendationNumber: number; // > 0
  eventFeatureList: FeatureEvent[]; // can be empty []
  featureList: Feature[]; // min 1 item
}

// ============== RESPONSE INTERFACES ==============

export interface RecommendedFeature {
  name: string;
  code: string;
}

export interface FeatureRecommendationResponse {
  status: 'success' | 'error';
  data: RecommendedFeature[] | null;
  generateTimeResponse: number;
  errorLog: string | null;
}

export interface HealthCheckResponse {
  status: 'healthy';
}

// ============== API ENDPOINTS ==============

export const API_ENDPOINTS = {
  RECOMMENDED_FEATURES: '/recommended_features',
  HEALTH: '/health'
} as const;

// ============== EXAMPLE USAGE ==============

/*
// Example request:
const request: FeatureRecommendationRequest = {
  roomRequestList: [
    { index: "0", adults: 2, children: 0, pets: 0 }
  ],
  bookingPeriod: {
    arrival: "2025-12-10",
    departure: "2025-12-15"
  },
  featureRecommendationNumber: 3,
  eventFeatureList: [],
  featureList: [
    { name: "Ocean view", code: "VW_OCEAN", type: "Retail", popularity: 5, selection: 10 },
    { name: "King bed", code: "BD_KING", type: "Retail", popularity: 3, selection: 8 },
    { name: "Balcony", code: "OS_BALCON", type: "Retail", popularity: 2, selection: 5 }
  ]
};

// Example API call:
const response = await fetch('http://127.0.0.1:8000/recommended_features', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
});

const data: FeatureRecommendationResponse = await response.json();
*/
