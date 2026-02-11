import {createAction, props} from '@ngrx/store';
import {StaticLanguageContent} from "@store/multi-lang/multi-lang.state";

export const loadStaticContent = createAction(
  '@sites/load static content',
  props<{ locale: string }>()
);

export const loadedStaticContentSuccessfully = createAction(
  '@sites/loaded static content successfully',
  props<{ contents: StaticLanguageContent[] }>()
);
