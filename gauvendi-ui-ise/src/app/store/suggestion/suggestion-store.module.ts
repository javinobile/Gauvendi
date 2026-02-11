import {NgModule} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {SUGGESTION_FEATURE_KEY} from "@store/suggestion/suggestion.state";
import {SuggestionReducer} from "@store/suggestion/suggestion.reducer";
import {SuggestionEffects} from "@store/suggestion/suggestion.effects";

@NgModule({
  imports: [
    StoreModule.forFeature(SUGGESTION_FEATURE_KEY, SuggestionReducer),
    EffectsModule.forFeature([SuggestionEffects])
  ]
})
export class SuggestionStoreModule {
}
