import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import {
  Hotel,
  HotelConfiguration,
  HotelConfigurationConfigTypeEnum,
  HotelExpandEnum
} from '@app/core/graphql/generated/graphql';
import { CookiebotSetting } from '@app/models/cookiebot.model';
import { LayoutSetting } from '@app/models/layout.model';
import { PricingDisplayModeEnum } from '@app/models/option-item.model';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { loadHotel } from '@app/store/hotel/hotel.actions';
import { selectorHotel } from '@app/store/hotel/hotel.selectors';
import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import { select, Store } from '@ngrx/store';
import { map, skipWhile, tap } from 'rxjs';

export const ConfigGuard: CanActivateFn = (route, _state) => {
  const store$$ = inject(Store);
  const googleTracking$$ = inject(GoogleTrackingService);
  const commonService = inject(CommonService);
  const configService$$ = inject(HotelConfigService);
  const hotelInfo = configService$$.hotel$.value;

  const propertyCode: string = route.queryParams[RouteKeyQueryParams.hotelCode];

  if (!hotelInfo) {
    store$$.dispatch(
      loadHotel({
        variables: {
          filter: {
            hotelCode: propertyCode?.toUpperCase(),
            expand: [
              HotelExpandEnum.Country,
              HotelExpandEnum.Currency,
              HotelExpandEnum.CurrencyRate,
              HotelExpandEnum.HotelConfiguration,
              HotelExpandEnum.IconImage
            ],
            pageSize: 1,
            pageIndex: 0
          }
        }
      })
    );
  }

  return store$$.pipe(
    select(selectorHotel),
    skipWhile((data) => !data),
    map((data) => {
      // get current domain
      const currentDomain = window.location.origin;
      // get current pathname
      const pathname = window.location.pathname;
      // get current query params
      const queryParams = window.location.search;

      const whiteLabel = data?.hotelConfigurationList?.find(
        (x) =>
          x?.configType === HotelConfigurationConfigTypeEnum.WhitelabelSetting
      )?.configValue?.metadata?.url as string;

      // not whitelabel -> continue
      if (!whiteLabel) {
        return data;
      }

      // has whitelabel -> check whitelabel
      if (whiteLabel?.length > 0) {
        // whitelabel === current domain -> continue
        if (currentDomain === whiteLabel) {
          return data;
        }
        // direct to white label
        window.location.href = `${whiteLabel}${pathname}${queryParams ? queryParams : ''}`;
        return false;
      }

      return data;
    }),
    tap((hotel: Hotel) => {
      configService$$.baseCurrency.next(hotel?.baseCurrency?.code);
      configService$$.defaultNation.next(
        hotel?.country?.code || MultiLangEnum.EN
      );
      configService$$.hotelTimezone.next(hotel?.timeZone);

      if (hotel?.hotelConfigurationList?.length > 0) {
        const configs = hotel?.hotelConfigurationList;

        configs?.forEach((config: HotelConfiguration) => {
          switch (config?.configType) {
            // Default Language
            case HotelConfigurationConfigTypeEnum.DefaultLanguage:
              const queryLang = route.queryParams[RouteKeyQueryParams.lang];
              const locale =
                queryLang ||
                config?.configValue?.content?.toLocaleLowerCase() ||
                MultiLangEnum.EN;
              commonService.setLang(locale);
              configService$$.defaultLocale.next(locale);
              break;
            // GTM
            case HotelConfigurationConfigTypeEnum.Gtm:
              const code = config?.configValue?.value;
              if (code?.length > 0) {
                googleTracking$$.gtm = {
                  code
                };
              }
              break;
            // GA
            case HotelConfigurationConfigTypeEnum.GoogleAnalytics:
              const codeList = config?.configValue?.metadata?.data;
              if (codeList?.length > 0) {
                googleTracking$$.gaCodeList = [...codeList];
              }
              break;
            // Duetto
            case HotelConfigurationConfigTypeEnum.DuettoConfiguration:
              const duettoConfig = config?.configValue?.metadata;
              if (
                duettoConfig?.appId?.length > 0 &&
                duettoConfig?.tld?.length > 0
              ) {
                configService$$.duettoConfig$.next(duettoConfig);
              }
              break;
            // Cookiebot
            case HotelConfigurationConfigTypeEnum.CookiebotConfiguration:
              const cookiebotConfig: CookiebotSetting =
                config?.configValue?.metadata;
              const isCookiebotConfigValid =
                cookiebotConfig?.cookiebotSrc?.length > 0 &&
                cookiebotConfig?.dataCbid?.length > 0;
              configService$$.cookiebotConfig$.next(
                isCookiebotConfigValid ? cookiebotConfig : {}
              );
              break;
            // GauVendi Cookie Consent
            case HotelConfigurationConfigTypeEnum.UsercentricsCmpSetting:
              configService$$.usercentricsCmpConfig$.next(true);
              break;
            // Layout Setting
            case HotelConfigurationConfigTypeEnum.LayoutSetting:
              const layoutSetting: LayoutSetting =
                config?.configValue?.metadata;
              if (layoutSetting?.style?.length > 0) {
                if (layoutSetting.style !== 'ROUND') {
                  document.body.setAttribute('layout', layoutSetting.style);
                }
                configService$$.layoutSetting$.next(layoutSetting.style);
              }
              break;
            // Calendar setting
            case HotelConfigurationConfigTypeEnum.IseCalendarAdditionalInformationDisplay:
              const calendarSetting = config?.configValue?.metadata;
              if (!!calendarSetting) {
                configService$$.calendarSetting$.next(calendarSetting);
              }
              break;
            case HotelConfigurationConfigTypeEnum.IsePricingDisplay:
              const pricingDisplayMode = config?.configValue?.metadata?.mode;
              if (pricingDisplayMode) {
                configService$$.isePricingDisplayConfig$.next(
                  pricingDisplayMode || PricingDisplayModeEnum.DEFAULT
                );
              }
              configService$$.isePricingDisplayMode$.next(
                config?.configValue?.metadata?.defaultPricingDisplay
              );
              break;
            case HotelConfigurationConfigTypeEnum.PetPolicy:
              const petPolicy = config?.configValue?.metadata;
              configService$$.petPolicy.set(petPolicy);
              break;
            case HotelConfigurationConfigTypeEnum.DockWcag:
              const dockWcagToken = config?.configValue?.metadata?.token;
              if (dockWcagToken) {
                configService$$.dockWcagToken$.next(dockWcagToken);
              }
              break;
          }
        });

        googleTracking$$.init();

        if (!configService$$.cookiebotConfig$.value) {
          configService$$.cookiebotConfig$.next({});
        }
      }
    }),
    map((data) => !!data)
  );
};
