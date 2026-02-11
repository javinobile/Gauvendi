import { Injectable } from '@angular/core';
import { PropertyBranding } from '@core/graphql/generated/graphql';
import { themesColorConfig } from '@app/shared/directives/themes-setting/themes-setting.const';
import { ThemesSettingService } from '@app/shared/directives/themes-setting/themes-setting.service';
import { HotelConfigService } from '@app/services/hotel-config.service';

@Injectable({
  providedIn: 'root'
})
export class HotelBrandingService {
  constructor(
    private themeService: ThemesSettingService,
    private hotelConfigService: HotelConfigService
  ) {}

  setTheme(branding: PropertyBranding[]): void {
    const updateThemes = themesColorConfig;
    const themeColors = {};
    Object.keys(updateThemes).forEach((key) => {
      updateThemes[key] = this._getThemeValue(branding, key, updateThemes);
      const newKey = key
        .replace('--color-', '')
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      themeColors[newKey] = updateThemes[key];
    });
    this.hotelConfigService.themeColors$.next(themeColors);
    this.themeService.setActiveTheme(updateThemes);
  }

  _getThemeValue(
    branding: PropertyBranding[],
    key: string,
    defaultValue: { [key: string]: string }
  ): string {
    switch (key) {
      case '--color-button-normal-text':
        this.hotelConfigService.buttonTextColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-button-normal-background':
        this.hotelConfigService.buttonBgColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-primary':
        this.hotelConfigService.hotelPrimaryColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-text-primary':
        this.hotelConfigService.colorText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-text-secondary':
        this.hotelConfigService.colorSecondaryText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-category-hover-icon':
        this.hotelConfigService.categoryHoverText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-category-hover-background':
        this.hotelConfigService.categoryHoverBg$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-category-default-icon':
        this.hotelConfigService.categoryDefaultText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-category-default-background':
        this.hotelConfigService.categoryDefaultBg$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-feature-hover-icon':
        this.hotelConfigService.featureHoverText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-feature-hover-background':
        this.hotelConfigService.featureHoverBg$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-feature-default-icon':
        this.hotelConfigService.featureSelectedText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-configurator-feature-default-background':
        this.hotelConfigService.featureSelectedBg$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-outline-button-normal-text':
        this.hotelConfigService.outlineButtonText$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-outline-button-normal-background':
        this.hotelConfigService.outlineButtonBg$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-matched-background':
        this.hotelConfigService.matchBgColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-matched-text':
        this.hotelConfigService.matchTextColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-lowest-price-background':
        this.hotelConfigService.lowestBgColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-lowest-price-text':
        this.hotelConfigService.lowestTextColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-most-popular-background':
        this.hotelConfigService.mostPopularBgColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-most-popular-text':
        this.hotelConfigService.mostPopularTextColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-our-tip-background':
        this.hotelConfigService.ourTipBgColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      case '--color-our-tip-text':
        this.hotelConfigService.ourTipTextColor$.next(
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
      default:
        return (
          branding?.find((x) => x?.key === key)?.value || defaultValue[key]
        );
    }
  }
}
