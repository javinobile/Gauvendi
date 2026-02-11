// Query DTOs
export class GetHotelRetailCategoriesDto {
  hotelId: string;
}

export class GetHotelRetailFeaturesDto {
  hotelId: string;

  categoryIds?: string[];

  featureIds?: string[];

  isVisible?: boolean;

  isGetAllRoomProductRetailFeatures?: boolean;

  // Pagination
  limit?: number;

  offset?: number;
}

// Update DTOs
export class UpdateRetailFeatureDto {
  id: string;

  isVisible?: boolean;

  baseWeight?: number;

  baseRate?: number;

  isSuggestedPrice?: boolean;

  displaySequence?: number;
}

export class BulkUpdateRetailFeaturesDto {
  features: UpdateRetailFeatureDto[];
}

export class UpdateCategoryPriceWeightDto {
  categoryId: string;

  priceWeight: number;
}

export class UpdateRetailVisibilityDto {
  featureId: string;

  isVisible: boolean;
}

// Translation DTOs
export class FeatureTranslationDto {
  languageCode: string;

  name?: string;

  description?: string;

  measurementUnit?: string;
}

export class UpdateRetailInfoDto {
  id: string;

  name?: string;

  description?: string;

  shortDescription?: string;

  imageUrl?: string;

  baseRate?: number;

  baseWeight?: number;

  displaySequence?: number;

  measurementUnit?: string;

  isVisible?: boolean;

  translations?: FeatureTranslationDto[];
}

export class UpdateStandardInfoDto {
  id: string;

  name?: string;

  description?: string;

  shortDescription?: string;

  imageUrl?: string;

  displaySequence?: number;

  translations?: FeatureTranslationDto[];
}

export class CreateStandardFeatureDto {
  code: string;

  name: string;

  description: string;

  iconImageUrl: string;
}

export class CreateRetailFeatureDto {
  code: string;

  name: string;

  hotelRetailCategoryId: string;

  description: string;

  iconImageUrl: string;
}

export class BulkCreateStandardFeatureDto {
  hotelId: string;

  templates: CreateStandardFeatureDto[];
}

export enum ActionRetailFeatureForEnum {
  ROOM_UNIT = 'ROOM_UNIT',
  ROOM_PRODUCT = 'ROOM_PRODUCT'
}

export class BulkCreateRetailFeatureDto {
  hotelId: string;

  templates: CreateRetailFeatureDto[];

  createFor: ActionRetailFeatureForEnum;
}

export class GetStandardFeaturesDto {
  hotelId: string;

  ids?: string[];

  // Pagination
  limit?: number;

  offset?: number;
}

// Response DTOs
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface BulkUpdateResponse {
  updated: number;
  failed: number;
  errors?: string[];
}

export class DeleteRetailFeatureDto {
  id: string;
  actionFor?: ActionRetailFeatureForEnum;
}
