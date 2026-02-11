import { HotelTagType } from './hotel-retail.enums';
import { HotelTagTranslationDto } from './hotel-tag-translation.dto';

// Forward declaration to avoid circular dependency
interface HotelRetailFeatureDto {
  id?: string;
  name?: string;
  // Add other essential properties as needed
}

export class HotelTagDto {
  id?: string;
  hotelId?: string;
  type?: HotelTagType;
  code?: string;
  name?: string;
  matched?: boolean;
  translationList?: HotelTagTranslationDto[];
  assignedFeatureList?: HotelRetailFeatureDto[];
}
