import {NgModule} from "@angular/core";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {CALENDAR_FEATURE_KEY} from "@store/calendar/calendar.state";
import {CalendarReducer} from "@store/calendar/calendar.reducer";
import {CalendarEffects} from "@store/calendar/calendar.effects";

@NgModule({
  imports: [
    StoreModule.forFeature(CALENDAR_FEATURE_KEY, CalendarReducer),
    EffectsModule.forFeature([CalendarEffects])
  ]
})
export class CalendarStoreModule {
}
