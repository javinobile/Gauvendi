import { HotelTagDto } from './hotel-tag.dto';
import { TemplateRetailCategoryDto } from './template-retail-category.dto';

export class TemplateRetailFeatureDto {
  id?: string;
  name?: string;
  code?: string;
  description?: string;
  shortDescription?: string;
  templateRetailCategory?: TemplateRetailCategoryDto;
  templateRetailCategoryId?: string;
  travelTag?: string[];
  occasion?: string[];
  travelTagList?: HotelTagDto[];
  occasionList?: HotelTagDto[];
}
