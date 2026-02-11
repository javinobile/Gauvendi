import {NgModule} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {MULTI_LANG_FEATURE_KEY} from "@store/multi-lang/multi-lang.state";
import {multiLangReducer} from "@store/multi-lang/multi-lang.reducer";
import {EffectsModule} from "@ngrx/effects";
import {MultiLangEffects} from "@store/multi-lang/multi-lang.effects";


@NgModule({
  imports: [
    StoreModule.forFeature(MULTI_LANG_FEATURE_KEY, multiLangReducer),
    EffectsModule.forFeature([MultiLangEffects])
  ]
})
export class MultiLangStateModule {
}
