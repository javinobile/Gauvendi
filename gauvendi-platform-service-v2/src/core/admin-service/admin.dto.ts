export interface MasterTemplateResponse {
  id: string;
  iconImageId: string;
  imageUrl: string;
  code: string;
  name: string;
  description: string;
  displaySequence: number;
}

export interface MasterTemplateTranslationResponse {
  templateFeatureId: string;
  languageCode: string;
  name: string;
  description: string;
  measurementUnit: string;
}

export interface AdminResponseDto<T> {
  count: number;
  totalPage: number;
  data: T[];
}
