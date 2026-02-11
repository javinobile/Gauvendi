import { Injectable, OnDestroy } from '@angular/core';
import {
  UcConsent,
  UcConsentServiceName,
  UcConsentServices
} from '@app/models/cookie-consent.model';
import { CookiebotSetting } from '@app/models/cookiebot.model';
import { environment } from '@environment/environment';
import {
  BehaviorSubject,
  distinctUntilChanged,
  skipWhile,
  Subject,
  takeUntil,
  tap
} from 'rxjs';

import { HotelConfigService } from './hotel-config.service';
import { GoogleTrackingService } from './tracking.google.service';

@Injectable({ providedIn: 'root' })
export class CookieConsentService implements OnDestroy {
  destroy$ = new Subject();

  constructor(
    private readonly hotelConfigService: HotelConfigService,
    private readonly googleTrackingService: GoogleTrackingService
  ) {}

  initCMP(): void {
    this.hotelConfigService.usercentricsCmpConfig$
      .pipe(
        skipWhile((config) => !config),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (isActive) => (isActive ? this.initDefaultCmp() : null)
      });
    this.hotelConfigService.cookiebotConfig$
      .pipe(
        skipWhile((config) => !config),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (config) =>
          config?.cookiebotSrc?.length > 0 && config?.dataCbid?.length > 0
            ? this.initCookiebotCmp(config)
            : null
      });
  }

  initDefaultCmp(): void {
    const script = document.createElement('script');
    script.setAttribute('id', 'usercentrics-cmp');
    script.setAttribute('src', 'https://web.cmp.usercentrics.eu/ui/loader.js');
    script.setAttribute(
      'data-draft',
      environment.production ? 'true' : 'false'
    );
    script.setAttribute('data-settings-id', 'gh5jQinnQ3xKbb');
    script.setAttribute('async', '');

    const body = document.body;
    body.appendChild(script);

    const storageKey = 'ucData';
    this.handleStorageEvent(storageKey);
  }

  private handleStorageEvent(storageKey: string): void {
    const value$$ = new BehaviorSubject(null);
    setInterval(() => {
      const ucData = localStorage.getItem(storageKey);
      value$$.next(ucData);
    }, 200);

    value$$
      .pipe(
        skipWhile((data) => !data),
        distinctUntilChanged(
          (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
        ),
        tap((data) => {
          if (data?.length > 0) {
            this.handleUcEvent(data);
          }
        })
      )
      .subscribe();
  }

  private handleUcEvent(raw: string): void {
    try {
      const consent: UcConsent = JSON.parse(raw);

      const consentUpdateObject = {};

      // const consentGcm = consent.gcm;
      // if (consentGcm) {
      //   if (consentGcm.adStorage) {
      //     consentUpdateObject['ad_storage'] = consentGcm.adStorage;
      //   }
      //   if (consentGcm.analyticsStorage) {
      //     consentUpdateObject['analytics_storage'] =
      //       consentGcm.analyticsStorage;
      //   }
      //   if (consentGcm.adUserData) {
      //     consentUpdateObject['ad_user_data'] = consentGcm.adUserData;
      //   }
      //   if (consentGcm.adPersonalization) {
      //     consentUpdateObject['ad_personalization'] =
      //       consentGcm.adPersonalization;
      //   }
      // }

      const consentServiceList: UcConsentServices = consent?.consent?.services;
      if (consentServiceList) {
        Object.values(consentServiceList).forEach((details) => {
          switch (details?.name) {
            case UcConsentServiceName.FUNCTIONALITY_STORAGE:
              consentUpdateObject['functionality_storage'] = details?.consent
                ? 'granted'
                : 'denied';
              break;
            case UcConsentServiceName.PERSONALIZATION_STORAGE:
              consentUpdateObject['personalization_storage'] = details?.consent
                ? 'granted'
                : 'denied';
              break;
            case UcConsentServiceName.SECURITY_STORAGE:
              consentUpdateObject['security_storage'] = details?.consent
                ? 'granted'
                : 'denied';
              break;
            default:
              break;
          }
        });
      }

      this.googleTrackingService.pushConsentUpdate();
    } catch (e) {
      console.error(e);
    }
  }

  initCookiebotCmp(config: CookiebotSetting): void {
    const script = document.createElement('script');
    script.setAttribute('id', 'Cookiebot');
    script.setAttribute('src', config?.cookiebotSrc);
    script.setAttribute('data-cbid', config?.dataCbid);
    // script.setAttribute('data-blockingmode', 'auto');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('async', '');

    const head = document.head;
    head.insertBefore(script, head.firstChild);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
