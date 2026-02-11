import { CategoryTypeEnum } from './hotel-retail.enums';

// Forward declaration to avoid circular dependency
interface TemplateRetailFeatureDto {
  id?: string;
  name?: string;
  // Add other essential properties as needed
}

export class TemplateRetailCategoryDto {
  id?: string;
  name?: string;
  code?: string;
  categoryType?: CategoryTypeEnum;
  iconImageUrl?: string;
  templateRetailFeatureList?: TemplateRetailFeatureDto[];
}
