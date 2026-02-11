import {NgModule} from '@angular/core';
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {BOOKING_SUMMARY_FEATURE_KEY} from "@store/booking-summary/booking-summary.state";
import {BookingSummaryReducer} from "@store/booking-summary/booking-summary.reducer";
import {BookingSummaryEffects} from "@store/booking-summary/booking-summary.effects";


@NgModule({
  imports: [
    StoreModule.forFeature(BOOKING_SUMMARY_FEATURE_KEY, BookingSummaryReducer),
    EffectsModule.forFeature([BookingSummaryEffects])
  ]
})
export class BookingSummaryStoreModule {
}
