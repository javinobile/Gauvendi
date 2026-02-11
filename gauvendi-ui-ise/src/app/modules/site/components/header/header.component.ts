import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '@app/apis/hotel.service';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { Hotel } from '@app/core/graphql/generated/graphql';
import { DropdownItem } from '@app/models/dropdown-item.model';
import { ChangeLanguageCurrencyComponent } from '@app/modules/site/components/change-language-currency/change-language-currency.component';
import { OverlayMobileDirective } from '@app/modules/site/directives/overlay-mobile.directive';
import { SelectLangAndCurrencyDirective } from '@app/modules/site/directives/select-lang-and-currency.directive';
import { AppRouterService } from '@app/services/app-router.service';
import { CommonService } from '@app/services/common.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { selectorLanguage } from '@app/state-management/router.selectors';
import { selectorHotelUrl } from '@app/store/hotel/hotel.selectors';
import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import { Store } from '@ngrx/store';
import { map, pipe, tap } from 'rxjs';
import { CalendarComponent } from '../calendar/calendar.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CalendarComponent,
    SelectLangAndCurrencyDirective,
    OverlayMobileDirective
  ]
})
export class HeaderComponent {
  private readonly hotelService$$ = inject(HotelService);
  private readonly store$$ = inject(Store);
  private readonly commonService = inject(CommonService);
  private readonly appRouterService = inject(AppRouterService);

  @Input() currency: string;
  @Input() hotel: Hotel;
  @Input() locale: DropdownItem;

  readonly hotelUrl$ = this.store$$.select(pipe(selectorHotelUrl));

  readonly localeList = signal([
    { code: MultiLangEnum.EN, label: '(EN) English' },
    { code: MultiLangEnum.DE, label: '(DE) Deutsch' },
    { code: MultiLangEnum.FR, label: '(FR) Français' },
    { code: MultiLangEnum.ES, label: '(ES) Español' },
    { code: MultiLangEnum.IT, label: '(IT) Italiano' },
    { code: MultiLangEnum.AR, label: '(AR) اَلْعَرَبِيَّةُ' },
    { code: MultiLangEnum.NL, label: '(NL) Dutch' }
  ]);

  readonly currencyList$ = this.hotelService$$.currencyList().pipe(
    tap((currencyList) => {
      const hasSupportedCurrency = currencyList.some(
        (currency) => currency.code === this.currency
      );

      if (hasSupportedCurrency) return;

      const baseCurrency = this.hotel.baseCurrency.code;
      this.appRouterService.updateRouteQueryParams({
        [RouteKeyQueryParams.currency]: baseCurrency || MultiLangEnum.EN
      });
    })
  );

  readonly popUpComponent = ChangeLanguageCurrencyComponent;
  readonly connectedPosition$ = this.store$$
    .select(selectorLanguage)
    .pipe(
      map((lang) =>
        lang?.toLocaleLowerCase() === 'ar'
          ? [
              new ConnectionPositionPair(
                { originX: 'start', originY: 'top' },
                { overlayX: 'center', overlayY: 'top' },
                35,
                30,
                'top-left'
              )
            ]
          : [
              new ConnectionPositionPair(
                { originX: 'end', originY: 'bottom' },
                { overlayX: 'end', overlayY: 'top' },
                -35,
                20,
                'bottom-right'
              )
            ]
      )
    );

  private readonly configuratorService$ = inject(ConfiguratorService);

  readonly isMobile$ = this.commonService.isMobile$;

  readonly overlayBackgroundDisplayed = computed(
    () => !this.configuratorService$.isCollapse()
  );

  collapseConfigurator(): void {
    this.configuratorService$.isCollapse.set(true);
  }
}
