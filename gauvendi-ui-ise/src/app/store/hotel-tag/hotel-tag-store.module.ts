import {NgModule} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {HOTEL_TAG_FEATURE_KEY} from "@store/hotel-tag/hotel-tag.state";
import {HotelTagReducer} from "@store/hotel-tag/hotel-tag.reducer";
import {HotelTagEffects} from "@store/hotel-tag/hotel-tag.effects";

@NgModule({
  imports: [
    StoreModule.forFeature(HOTEL_TAG_FEATURE_KEY, HotelTagReducer),
    EffectsModule.forFeature([HotelTagEffects])
  ]
})
export class HotelTagStoreModule {
}
