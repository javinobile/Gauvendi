import { OverlayModule } from '@angular/cdk/overlay';
import { CurrencyPipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, isDevMode, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TimeZoneInterceptor } from '@app/interceptors/time-zone.interceptor';
import { ThemesSettingModule } from '@app/shared/directives/themes-setting/themes-setting.module';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { StateManagementModule } from '@app/state-management/state-management.module';
import { environment } from '@environment/environment';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { BookingSummaryStoreModule } from '@store/booking-summary/booking-summary-store.module';
import { CalendarStoreModule } from '@store/calendar/calendar-store.module';
import { HotelStoreModule } from '@store/hotel/hotel-store.module';
import { PickExtrasStoreModule } from '@store/pick-extras/pick-extras-store.module';
import { SuggestionStoreModule } from '@store/suggestion/suggestion-store.module';
import { inject } from '@vercel/analytics';
import SwiperCore, { Navigation, Pagination } from 'swiper';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localeNl from '@angular/common/locales/nl';
import localeEs from '@angular/common/locales/es';
import localeAr from '@angular/common/locales/ar';

SwiperCore.use([Navigation]);
SwiperCore.use([Pagination]);

registerLocaleData(localeDe, 'de-DE');
registerLocaleData(localeFr, 'fr-FR');
registerLocaleData(localeIt, 'it-IT');
registerLocaleData(localeNl, 'nl-NL');
registerLocaleData(localeEs, 'es-ES');
registerLocaleData(localeAr, 'ar-EG');

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    BookingSummaryStoreModule,
    BrowserAnimationsModule,
    BrowserModule,
    CalendarStoreModule,
    HotelStoreModule,
    HttpClientModule,
    OverlayModule,
    PickExtrasStoreModule,
    StateManagementModule,
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: !isDevMode() }),
    SuggestionStoreModule,
    ThemesSettingModule
  ],
  providers: [
    CurrencyPipe,
    TranslatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: TimeZoneInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        inject({
          mode: environment.mode === 'production' ? 'production' : 'development'
        });
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
