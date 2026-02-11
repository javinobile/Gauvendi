
import { FeatureRecommendationScoreDto } from './feature-recommendation-score.dto';
import { HotelRetailFeatureImageDto } from './hotel-retail-feature-image.dto';
import { HotelRetailFeatureTranslationDto } from './hotel-retail-feature-translation.dto';
import { HotelRetailFeatureStatusEnum } from './hotel-retail.enums';
import { HotelTagDto } from './hotel-tag.dto';

import { TemplateRetailFeatureDto } from './template-retail-feature.dto';

// Forward declaration to avoid circular dependency
interface HotelRetailCategoryDto {
  id?: string;
  name?: string;
  displaySequence?: number;
  // Add other essential properties as needed
}

export class HotelRetailFeatureDto {
  id?: string;
  name?: string;
  code?: string;
  baseRate?: number;
  baseWeight?: number;
  description?: string;
  shortDescription?: string;
  hotelRetailCategoryId?: string;
  totalBaseAmount?: number;
  totalGrossAmount?: number;
  matched?: boolean = true;
  templateRetailFeature?: TemplateRetailFeatureDto;
  hotelRetailCategory?: HotelRetailCategoryDto;
  retailFeatureImageList?: HotelRetailFeatureImageDto[];
  quantity?: number;
  displaySequence?: number;
  isVisible?: boolean;
  status?: HotelRetailFeatureStatusEnum;
  translationList?: HotelRetailFeatureTranslationDto[];
  travelTag?: string[];
  occasion?: string[];
  travelTagList?: HotelTagDto[];
  occasionList?: HotelTagDto[];
  isMultiBedroom?: boolean;
  recommendationScore?: FeatureRecommendationScoreDto;
  measurementUnit?: string;

  // Custom getter method equivalent to Java's getHotelRetailCategoryDisplaySequence()
  get hotelRetailCategoryDisplaySequence(): number {
    return this.hotelRetailCategory?.displaySequence ?? 0;
  }

  // Note: The original Java class seems to have an incomplete getDisplaySequence() method
  // If there's additional logic, it should be added here
}
