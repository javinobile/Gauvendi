import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SESSION_STORAGE_KEY } from '@app/constants/storage.const';
import { AccessibilityService } from '@app/services/accessibility.service';
import { AppRouterService } from '@app/services/app-router.service';
import { CommonService } from '@app/services/common.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { HotelBrandingService } from '@app/services/hotel-branding.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { SearchBarHandlerService } from '@app/services/search-bar-handler.service';
import { loadLocation } from '@app/store/hotel/hotel.actions';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import {
  FontWeightDetailsTypeEnum,
  PropertyMainFont
} from '@core/graphql/generated/graphql';
import { environment } from '@environment/environment';
import { DropdownItem } from '@models/dropdown-item.model';
import { select, Store } from '@ngrx/store';
import {
  selectorFaviconImageUrl,
  selectorGauVendiLogo,
  selectorHotel,
  selectorHotelImpressum,
  selectorHotelPhone,
  selectorHotelPrivacy,
  selectorHotelTerms,
  selectorLocation,
  selectorPropertyBranding,
  selectorPropertyMainFont,
  selectorWhitelabel
} from '@store/hotel/hotel.selectors';
import { loadStaticContent } from '@store/multi-lang/multi-lang.actions';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { combineLatest, distinctUntilChanged, tap } from 'rxjs';
import { map, skipWhile } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteComponent implements OnInit, AfterViewInit {
  private readonly brandingService$ = inject(HotelBrandingService);
  private readonly configService$ = inject(HotelConfigService);
  private readonly route$$ = inject(ActivatedRoute);
  private readonly router$$ = inject(Router);
  private readonly searchService$$ = inject(SearchBarHandlerService);
  private readonly store = inject(Store);
  private readonly accessibilityService = inject(AccessibilityService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly appRouterService = inject(AppRouterService);
  private readonly titleService = inject(Title);

  readonly gvLogo$ = this.store.pipe(select(selectorGauVendiLogo));
  readonly impressum$ = this.store.pipe(select(selectorHotelImpressum));
  readonly phoneNumber$ = this.store.pipe(select(selectorHotelPhone));
  readonly privacy$ = this.store.pipe(select(selectorHotelPrivacy));
  readonly termOfUse$ = this.store.pipe(select(selectorHotelTerms));

  readonly currency$$ = signal(null);
  readonly locale$$ = signal({
    code: MultiLangEnum.EN,
    label: ''
  } as DropdownItem);

  readonly hotel$ = this.store.pipe(
    select(selectorHotel),
    skipWhile((data) => !data),
    tap((hotel) => {
      this.setTitle(hotel?.name);
    })
  );
  readonly branding$ = this.store.pipe(
    select(selectorPropertyBranding),
    skipWhile((data) => !data),
    tap((branding) => {
      this.brandingService$.setTheme(branding);
      this.accessibilityService.loadAccessibility();
    })
  );
  readonly font$ = this.store.pipe(
    select(selectorPropertyMainFont),
    skipWhile((data) => !data),
    tap((font) => {
      this.setFont(font);
    })
  );
  readonly faviconImageUrl$ = this.store.pipe(
    select(selectorFaviconImageUrl),
    skipWhile((data) => !data),
    tap((url) => {
      this.setFaviconImageUrl(url);
    })
  );

  readonly adType$ = this.route$$.queryParams.pipe(
    map((queryParam) => queryParam[RouteKeyQueryParams.adTypes]),
    distinctUntilChanged()
  );

  readonly utmAds$ = this.route$$.queryParams.pipe(
    map((queryParam) => [
      queryParam[RouteKeyQueryParams.utm_src],
      queryParam[RouteKeyQueryParams.utm_medium]
    ]),
    distinctUntilChanged(
      (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
    )
  );

  readonly activeSection$ = this.searchService$$.openOverlayState$.pipe(
    map((data) => !!data)
  );

  readonly isWhitelabel$ = this.store.pipe(
    select(selectorWhitelabel),
    map((url) => url?.length > 0)
  );

  locations$ = this.store.pipe(
    select(selectorLocation),
    tap((res) => {
      if (!res) return;

      sessionStorage.setItem(
        SESSION_STORAGE_KEY.LOCATION_SESSION_USER_IP,
        res?.ip
      );
      sessionStorage.setItem(
        SESSION_STORAGE_KEY.LOCATION_SESSION_USER_COUNTRY,
        res?.country
      );
      sessionStorage.setItem(
        SESSION_STORAGE_KEY.LOCATION_SESSION_USER_CITY,
        res?.city
      );
      sessionStorage.setItem(
        SESSION_STORAGE_KEY.LOCATION_SESSION_USER_REGION,
        res?.region
      );
      sessionStorage.setItem(
        SESSION_STORAGE_KEY.LOCATION_SESSION_USER_TIMEZONE,
        res?.timezone
      );
    })
  );

  showHeader = signal(true);

  ngAfterViewInit(): void {
    this.initPaypalScript();
  }

  ngOnInit(): void {
    this.initCurrency();
    this.initTranslation();
    this.handleBookingSrc();
    this.handleRouteChange();
    this.loadLocation();
  }

  loadLocation(): void {
    // Handle sessionUserId generation
    const currentSessionUserId = sessionStorage.getItem(
      SESSION_STORAGE_KEY.SESSION_USER_ID
    );
    if (!currentSessionUserId) {
      sessionStorage.setItem(SESSION_STORAGE_KEY.SESSION_USER_ID, uuidv4());
    }

    if (!environment.location?.token?.length) return;
    // Load user location
    this.store.dispatch(loadLocation());
  }

  private initCurrency(): void {
    combineLatest([
      this.hotel$,
      this.route$$.queryParams.pipe(
        map((queryParams) => queryParams[RouteKeyQueryParams.currency])
      )
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        ),
        tap(([hotel, currency]) => {
          if (!currency) {
            this.appRouterService.updateRouteQueryParams({
              [RouteKeyQueryParams.currency]: hotel?.baseCurrency?.code
            });
            this.currency$$.set(hotel?.baseCurrency?.code);
            return;
          }

          if (currency === this.currency$$()) return;

          this.currency$$.set(currency);
        })
      )
      .subscribe();
  }

  private initTranslation(): void {
    this.configService$.defaultLocale
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((locale) => {
        this.store.dispatch(loadStaticContent({ locale: locale }));
        this.reloadTranslation(locale);
      });

    this.route$$.queryParams
      .pipe(
        map((queryParams) => queryParams[RouteKeyQueryParams.lang]),
        distinctUntilChanged(),
        tap((locale) => {
          if (!!locale && locale !== this.locale$$()?.code) {
            this.locale$$.set({ code: locale, label: '' });
          }
        })
      )
      .subscribe();
  }

  private handleRouteChange(): void {
    combineLatest([this.commonService.isMobile$, this.router$$.events])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isMobile, event]) => {
        if (event?.['routerEvent'] instanceof NavigationEnd) {
          const url = event['routerEvent'].url;
          this.showHeader.set(
            !(url.includes(RouterPageKey.recommendationDetail) && isMobile)
          );
        }
      });
  }

  private reloadTranslation(locale: string): void {
    if (locale === this.locale$$()?.code) {
      const lang = this.route$$.snapshot.queryParams[RouteKeyQueryParams.lang];
      if (lang) return;

      this.appRouterService.updateRouteQueryParams({
        [RouteKeyQueryParams.lang]: locale
      });
      return;
    }

    this.locale$$.set({ code: locale, label: '' });
    this.appRouterService.updateRouteQueryParams({
      [RouteKeyQueryParams.lang]: locale
    });
    this.store.dispatch(loadStaticContent({ locale: locale }));
  }

  private handleBookingSrc(): void {
    // modify bookingSrc base on ads types
    this.adType$.subscribe((data) => {
      if (+data === 0) {
        setTimeout(() => {
          this.appRouterService.updateRouteQueryParams({
            [RouteKeyQueryParams.bookingSrc]: 'GFB'
          });
        }, 600);
      }
    });

    // modify bookingSrc base on utm ads
    this.utmAds$
      .pipe(skipWhile(([utmSrc, utmMedium]) => !utmSrc || !utmMedium))
      .subscribe((data) => {
        if (data?.length > 0) {
          const [utmSource, utmMedium] = data;
          const bookingSrc =
            this.route$$.snapshot.queryParams[RouteKeyQueryParams.bookingSrc];
          if (!(bookingSrc?.trim()?.length > 0)) {
            let source = '';
            if (utmSource?.trim()?.length > 0) {
              source += utmSource;
            }
            if (utmMedium?.trim()?.length > 0) {
              source +=
                source?.trim()?.length > 0 ? `_${utmMedium}` : utmMedium;
            }
            if (!(source?.trim()?.length > 0)) {
              source = 'Website';
            }
            setTimeout(() => {
              this.appRouterService.updateRouteQueryParams({
                [RouteKeyQueryParams.bookingSrc]: source
              });
            }, 500);
          }
        }
      });
  }

  closeBackdrop(): void {
    this.searchService$$.openOverlayState$.next(null);
    this.searchService$$.overlayRefList$
      ?.getValue()
      ?.forEach((ref) => ref?.detach());
  }

  private setFont(font: PropertyMainFont): void {
    const fontStyleEl = document.createElement('style');
    const fontName = font?.fontName.replace(/ /g, '+');
    this.configService$.hotelFontFamily.next(
      fontName || 'Roboto, Arial, Sans Serif'
    );
    if (!font?.isCustomFont) {
      fontStyleEl.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=${fontName}:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        `;
    } else {
      const config = font?.fontWeightDetailsList?.map((item) => {
        return `
            @font-face {
              font-family: '${fontName}';
              src: url('${item?.url}') format('opentype'),
              url('${item?.url}') format('woff'),
              url('${item?.url}') format('truetype'),
              url('${item?.url}') format('woff2');
              font-weight: ${this.getFontWeight(item?.type)};
            }
          `;
      });

      fontStyleEl.innerHTML = config?.join('');
    }

    if (fontName?.toUpperCase() === 'BODONISTD') {
      fontStyleEl.innerHTML += `*:not(i) {font-family: '${fontName}', Arial, sans-serif; letter-spacing: 0.5px;}`;
    } else {
      fontStyleEl.innerHTML += `*:not(i) {font-family: '${fontName}', Arial, sans-serif;}`;
    }

    fontStyleEl.id = 'custom-font-face' + new Date().getTime();
    document.head.appendChild(fontStyleEl);
  }

  private getFontWeight(fw: FontWeightDetailsTypeEnum): number {
    switch (fw) {
      case FontWeightDetailsTypeEnum.FontWeight_300:
        return 300;
      case FontWeightDetailsTypeEnum.FontWeight_500:
        return 500;
      case FontWeightDetailsTypeEnum.FontWeight_600:
        return 600;
      case FontWeightDetailsTypeEnum.FontWeight_700:
        return 700;
      default:
        return 400;
    }
  }

  private readonly configuratorService$ = inject(ConfiguratorService);

  readonly overlayBackgroundDisplayed = computed(
    () => !this.configuratorService$.isCollapse()
  );

  collapseConfigurator(): void {
    this.configuratorService$.isCollapse.set(true);
  }

  private initPaypalScript(): void {
    const clientId = environment.paypalClientId;
    if (!clientId) {
      return;
    }
    const baseCurrency = this.configService$.baseCurrency.getValue();
    const paypalJsScript = document.getElementById('paypal-js');
    if (!paypalJsScript) {
      (function (d, s, id) {
        var js,
          ref = d.getElementsByTagName(s)[0];
        if (!d.getElementById(id)) {
          js = d.createElement(s);
          js.id = id;
          js.async = false;
          js.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=${baseCurrency}`;
          ref.parentNode.insertBefore(js, ref);
        }
      })(document, 'script', 'paypal-js');
    }
  }

  private setFaviconImageUrl(url: string): void {
    if (!url) return;

    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;

    link.setAttribute('href', url);
  }

  private setTitle(title: string): void {
    if (!title) return;
    this.titleService.setTitle(title);
  }
}
