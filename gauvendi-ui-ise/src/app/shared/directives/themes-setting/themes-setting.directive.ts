import {Directive, ElementRef, Inject, OnDestroy, OnInit} from '@angular/core';
import {themesColorConfig} from './themes-setting.const';
import {DOCUMENT} from '@angular/common';
import {Subscription} from 'rxjs';
import {ThemesSettingService} from './themes-setting.service';

@Directive({
  selector: '[appThemeSetting]'
})
export class ThemesSettingDirective implements OnInit, OnDestroy {
  private themes: object = themesColorConfig;
  private themeServiceSubscription: Subscription;

  constructor(
    @Inject(DOCUMENT) private document: any,
    private elementRef: ElementRef,
    private themeService: ThemesSettingService,
  ) {
  }

  ngOnInit(): void {
    this.updateTheme(this.themes);
    this.themeService.getActiveTheme()
      .subscribe(themes => {
        this.themes = themes;
        this.updateTheme(this.themes);
      });
  }

  updateTheme(themes: object): void {
    const element = this.elementRef.nativeElement;
    for (const key of Object.keys(themes)) {
      element.style.setProperty(key, themes[key]);
      this.document.body.style.setProperty(key, themes[key]);
    }
  }

  ngOnDestroy() {
    if (this.themeServiceSubscription) {
      this.themeServiceSubscription.unsubscribe();
    }
  }
}
