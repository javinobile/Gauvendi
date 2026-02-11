import {NgModule} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {HOTEL_FEATURE_KEY} from "@store/hotel/hotel.state";
import {HotelReducer} from "@store/hotel/hotel.reducer";
import {HotelEffects} from "@store/hotel/hotel.effects";

@NgModule({
  imports: [
    StoreModule.forFeature(HOTEL_FEATURE_KEY, HotelReducer),
    EffectsModule.forFeature([HotelEffects])
  ]
})
export class HotelStoreModule {
}
