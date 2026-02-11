import { FontWeightDetailsTypeEnum } from './hotel-configuration.enums';

export class FontWeightDetailsDto {
  url?: string;
  originalName?: string;
  contentType?: string;
  type?: FontWeightDetailsTypeEnum;
}

export class HotelMainFontDto {
  fontName?: string;
  isCustomFont?: boolean;
  fontWeightDetailsList?: FontWeightDetailsDto[];
}
