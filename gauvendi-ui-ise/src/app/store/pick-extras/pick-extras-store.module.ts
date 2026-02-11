import {NgModule} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {PICK_EXTRAS_FEATURE_KEY} from "@store/pick-extras/pick-extras.state";
import {PickExtrasReducer} from "@store/pick-extras/pick-extras.reducer";
import {PickExtrasEffects} from "@store/pick-extras/pick-extras.effects";

@NgModule({
  imports: [
    StoreModule.forFeature(PICK_EXTRAS_FEATURE_KEY, PickExtrasReducer),
    EffectsModule.forFeature([PickExtrasEffects])
  ]
})
export class PickExtrasStoreModule {
}
