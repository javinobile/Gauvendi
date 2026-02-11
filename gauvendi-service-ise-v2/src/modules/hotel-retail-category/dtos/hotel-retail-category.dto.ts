import { Translation } from 'src/core/database/entities/base.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';

export class HotelRetailCategoryDto {
  id?: string;
  name?: string;
  code?: string;
  iconImageUrl?: string;
  categoryType?: string;
  displaySequence?: number;
  priceWeight?: number;
  // hotelRetailFeatureList?: HotelRetailFeatureDto[];
  hotelRetailFeatureList?: HotelRetailFeature[];
  translationList?: Translation[];
  //   setHotelRetailFeatureList?(features: HotelRetailFeatureDto[]): void;
  //   setName?(name: string): void;
}
