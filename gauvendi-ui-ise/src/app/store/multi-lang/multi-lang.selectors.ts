import {createFeatureSelector, createSelector} from '@ngrx/store';
import {MULTI_LANG_FEATURE_KEY, MultiLangState, SectionCodeEnum} from "@store/multi-lang/multi-lang.state";

export const multiLangSites = createFeatureSelector<MultiLangState>(MULTI_LANG_FEATURE_KEY);

export const selectorSectionContent = (code: SectionCodeEnum) => createSelector(
  multiLangSites,
  ({data}: MultiLangState) => {
    return data?.find(item => item?.entityTranslationConfig?.code === code)?.attribute;
  }
);
