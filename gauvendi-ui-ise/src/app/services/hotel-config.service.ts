import { Injectable, signal } from '@angular/core';
import {
  Hotel,
  HotelTaxSettingEnum,
  PropertyBranding
} from '@app/core/graphql/generated/graphql';
import { CookiebotSetting } from '@app/models/cookiebot.model';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HotelConfigService {
  baseCurrency = new BehaviorSubject<string>(null);
  buttonBgColor$ = new BehaviorSubject<string>(null);
  buttonTextColor$ = new BehaviorSubject<string>(null);
  calendarSetting$ = new BehaviorSubject<{
    includeRate: boolean;
    includeRestriction: boolean;
  }>(null);
  categoryDefaultBg$ = new BehaviorSubject<string>(null);
  categoryDefaultText$ = new BehaviorSubject<string>(null);
  categoryHoverBg$ = new BehaviorSubject<string>(null);
  categoryHoverText$ = new BehaviorSubject<string>(null);
  colorSecondaryText$ = new BehaviorSubject<string>(null);
  colorText$ = new BehaviorSubject<string>(null);
  cookiebotConfig$ = new BehaviorSubject<CookiebotSetting>(null);
  defaultLocale = new BehaviorSubject<string>(MultiLangEnum.EN);
  defaultNation = new BehaviorSubject<string>(MultiLangEnum.EN);
  duettoConfig$ = new BehaviorSubject<{ appId: string; tld: string }>(null);
  featureHoverBg$ = new BehaviorSubject<string>(null);
  featureHoverText$ = new BehaviorSubject<string>(null);
  featureSelectedBg$ = new BehaviorSubject<string>(null);
  featureSelectedText$ = new BehaviorSubject<string>(null);
  filterMap: Map<string, string> = new Map();
  hotel$ = new BehaviorSubject<Hotel>(null);
  hotelBranding$ = new BehaviorSubject<PropertyBranding[]>(null);
  hotelFontFamily = new BehaviorSubject<string>(null);
  hotelPrimaryColor$ = new BehaviorSubject<string>(null);
  hotelTimezone = new BehaviorSubject<string>(null);
  isePricingDisplayConfig$ = new BehaviorSubject<HotelTaxSettingEnum>(
    HotelTaxSettingEnum.Inclusive
  );
  isePricingDisplayMode$ = new BehaviorSubject<string>(null);
  layoutSetting$ = new BehaviorSubject<string>('ROUND');
  lowestBgColor$ = new BehaviorSubject<string>(null);
  lowestTextColor$ = new BehaviorSubject<string>(null);
  matchBgColor$ = new BehaviorSubject<string>(null);
  matchTextColor$ = new BehaviorSubject<string>(null);
  mostPopularBgColor$ = new BehaviorSubject<string>(null);
  mostPopularTextColor$ = new BehaviorSubject<string>(null);
  ourTipBgColor$ = new BehaviorSubject<string>(null);
  ourTipTextColor$ = new BehaviorSubject<string>(null);
  outlineButtonBg$ = new BehaviorSubject<string>(null);
  outlineButtonText$ = new BehaviorSubject<string>(null);
  usercentricsCmpConfig$ = new BehaviorSubject<boolean>(false);
  dockWcagToken$ = new BehaviorSubject<string>(null);
  themeColors$ = new BehaviorSubject<{
    backgroundPrimary?: string;
    backgroundSecondary?: string;
    border?: string;
    buttonHoverBackground?: string;
    buttonHoverText?: string;
    buttonNormalBackground?: string;
    buttonNormalText?: string;
    calendarHoverBackground?: string;
    calendarHoverText?: string;
    calendarSelectedBackground?: string;
    calendarSelectedText?: string;
    configuratorBackground?: string;
    configuratorCategoryDefaultBackground?: string;
    configuratorCategoryDefaultIcon?: string;
    configuratorCategoryHoverBackground?: string;
    configuratorCategoryHoverIcon?: string;
    configuratorFeatureDefaultBackground?: string;
    configuratorFeatureDefaultIcon?: string;
    configuratorFeatureHoverBackground?: string;
    configuratorFeatureHoverIcon?: string;
    entryBarBackground?: string;
    footerBackground?: string;
    footerText?: string;
    headerBackground?: string;
    headerText?: string;
    lowestPriceBackground?: string;
    lowestPriceText?: string;
    matchedBackground?: string;
    matchedText?: string;
    mostPopularBackground?: string;
    mostPopularText?: string;
    ourTipBackground?: string;
    ourTipText?: string;
    outlineButtonHoverBackground?: string;
    outlineButtonHoverText?: string;
    outlineButtonNormalBackground?: string;
    outlineButtonNormalText?: string;
    popoverBackground?: string;
    popoverTextPrimary?: string;
    popoverTextSecondary?: string;
    primary?: string;
    productBackground?: string;
    textPrimary?: string;
    textSecondary?: string;
    [key: string]: string;
  }>(null);

  petPolicy = signal<{
    isAllowed?: boolean;
    maximumPets?: number;
  }>(null);
}
