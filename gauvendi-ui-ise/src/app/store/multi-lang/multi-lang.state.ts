import {ELoadingStatus} from '@app/models/loading-status.model';

export enum MultiLangEnum {
  DE = 'de',
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  IT = 'it',
  AR = 'ar',
  NL = 'nl'
}

// Mapping each language to a corresponding Euro-friendly locale
export const LocaleMapSymbolCurrency: Record<MultiLangEnum, string> = {
  [MultiLangEnum.DE]: 'de-DE',     // German (Germany)
  [MultiLangEnum.EN]: 'en-IE',     // English (Ireland)
  [MultiLangEnum.ES]: 'es-ES',     // Spanish (Spain)
  [MultiLangEnum.FR]: 'fr-FR',     // French (France)
  [MultiLangEnum.IT]: 'it-IT',     // Italian (Italy)
  [MultiLangEnum.AR]: 'ar-EG',     // Arabic (Egypt) – Note: EUR not typical, but fallback
  [MultiLangEnum.NL]: 'nl-NL'      // Dutch (Netherlands)
};

export enum SectionCodeEnum {
  ISE = 'INTERNET_SALES_ENGINE_CONTENTS',
}

export const MULTI_LANG_FEATURE_KEY = 'MULTI_LANG_STATE';

export interface MultiLangState {
  data: StaticLanguageContent[];
  status: ELoadingStatus;
  error: string;
}

export interface StaticLanguageContent {
  id: string;
  locale: {
    name: string;
    code: string;
    id: string;
  };
  entityTranslationConfig: {
    id: string;
    name: string;
    code: string;
    availableAttributeKeys: string[];
  };
  attribute: {
    key: string;
    value: string;
  }[];
}
