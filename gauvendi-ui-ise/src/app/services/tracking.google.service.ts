import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  DataLayerEvents,
  DataLayerKeys,
  GoogleTrackingEvents
} from '@app/constants/datalayer.enum';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { Booking } from '@app/core/graphql/generated/graphql';
import { environment } from '@environment/environment';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';

import { BookingTransactionService } from './booking-transaction.service';

export type GoogleTracking = {
  code: string;
  sendTo?: string;
};

@Injectable({ providedIn: 'root' })
export class GoogleTrackingService {
  private readonly transactionService = inject(BookingTransactionService);
  private readonly route = inject(ActivatedRoute);

  // GTM
  gtm: GoogleTracking = null;

  // Google Analytics + Google Ads
  gaCodeList: GoogleTracking[] = [];

  previousPushedObject = new BehaviorSubject({});

  private isInitiated = false;

  async init(): Promise<void> {
    const cachedPushedObject = sessionStorage.getItem('session');
    if (cachedPushedObject?.length > 0) {
      try {
        const cached = JSON.parse(cachedPushedObject);
        this.previousPushedObject.next(cached);
      } catch (e) {
        console.error(e);
      }
    }

    if (this.isInitiated) return;

    let currentEl: HTMLElement | null = null;

    const consentEl = this.initConsentDefaultState();
    document.head.insertBefore(consentEl, document.head.firstChild);
    currentEl = consentEl;

    // ✅ GTM is available → use GTM only
    if (this.gtm?.code) {
      const gtmEl = this.initGTM();
      consentEl.insertAdjacentElement('afterend', gtmEl);
      gtmEl.insertAdjacentHTML('beforebegin', '<!-- Google Tag Manager -->');
      gtmEl.insertAdjacentHTML('afterend', '<!-- End Google Tag Manager -->');

      const noscriptEl = this.initNoScriptGTM();
      document.body.insertBefore(noscriptEl, document.body.firstChild);
      noscriptEl.insertAdjacentHTML(
        'beforebegin',
        '<!-- Google Tag Manager (noscript) -->'
      );
      noscriptEl.insertAdjacentHTML(
        'afterend',
        '<!-- End Google Tag Manager (noscript) -->'
      );

      // ✅ GTM is responsible for GA4 and Ads
      this.isInitiated = true;
      return;
    }

    // ❌ GTM not present → manually inject GA4 and Google Ads tags
    if (this.gaCodeList?.length) {
      const ga4Codes = this.gaCodeList.filter((item) =>
        this.isGA4code(item?.code)
      );
      if (ga4Codes?.length) {
        const ga4Els = this.initGA4(ga4Codes);
        ga4Els.forEach((ga4El) => {
          currentEl!.insertAdjacentElement('afterend', ga4El);
          ga4El.insertAdjacentHTML(
            'beforebegin',
            '<!-- Google tag (gtag.js) -->'
          );
          currentEl = ga4El;
        });
      }

      const gAdsCodes = this.gaCodeList.filter((item) =>
        this.isGoogleAdscode(item?.code)
      );
      if (gAdsCodes?.length) {
        const gAdsEls = this.initGoogleAds(gAdsCodes);
        gAdsEls.forEach((gAdsEl) => {
          currentEl!.insertAdjacentElement('afterend', gAdsEl);
          gAdsEl.insertAdjacentHTML(
            'beforebegin',
            '<!-- Google tag (gtag.js) -->'
          );
          currentEl = gAdsEl;
        });
      }

      // ✅ Safely init `gtag()` config only after `gtag.js` scripts are loaded
      const configScript = document.createElement('script');
      configScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      gtag('js', new Date());
      ${this.gaCodeList
        .filter(
          (item) =>
            this.isGA4code(item?.code) || this.isGoogleAdscode(item?.code)
        )
        .map((val) => `gtag('config', '${val.code}');`)
        .join('\n')}
    `;
      currentEl!.insertAdjacentElement('afterend', configScript);
    }

    this.isInitiated = true;
  }

  private initConsentDefaultState(): HTMLElement {
    const ucData = JSON.parse(localStorage.getItem('ucData') || '{}');
    let adStorage = 'granted';
    let analyticsStorage = 'granted';
    let adUserData = 'granted';
    let adPersonalization = 'granted';
    let functionalityStorage = 'granted';
    let personalizationStorage = 'granted';
    let securityStorage = 'granted';
    if (ucData?.gcm) {
      const gcm = ucData?.gcm;
      adStorage = gcm.adStorage || 'granted';
      analyticsStorage = gcm.analyticsStorage || 'granted';
      adPersonalization = gcm.adPersonalization || 'granted';
      adUserData = gcm.adUserData || 'granted';
      functionalityStorage = gcm.functionalityStorage || 'granted';
      personalizationStorage = gcm.personalizationStorage || 'granted';
      securityStorage = gcm.securityStorage || 'granted';
    }
    const scriptEl = document.createElement('script');
    scriptEl.text = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('consent', 'default', { 'ad_storage': '${adStorage}', 'analytics_storage': '${analyticsStorage}', 'ad_user_data': '${adUserData}', 'ad_personalization': '${adPersonalization}', 'functionality_storage': '${functionalityStorage}', 'personalization_storage': '${personalizationStorage}', 'security_storage': '${securityStorage}' });gtag('js', new Date());window.gtag = gtag;`;
    return scriptEl;
  }

  private initGTM(): HTMLElement {
    const scriptEl = document.createElement('script');
    scriptEl.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f); })(window,document,'script','dataLayer','${this.gtm?.code}');`;
    return scriptEl;
  }

  private initNoScriptGTM(): HTMLElement {
    const iframeEl = document.createElement('iframe');
    iframeEl.src = `https://www.googletagmanager.com/ns.html?id=${this.gtm?.code}`;
    iframeEl.height = '0';
    iframeEl.width = '0';
    iframeEl.style.display = 'none';
    iframeEl.style.visibility = 'hidden';

    const scriptEl = document.createElement('noscript');
    scriptEl.appendChild(iframeEl);
    return scriptEl;
  }

  private initGA4(items: GoogleTracking[]): HTMLElement[] {
    return items?.map((item) => {
      const scriptEl = document.createElement('script');
      scriptEl.setAttribute('async', '');
      scriptEl.src = `https://www.googletagmanager.com/gtag/js?id=${item?.code}`;
      scriptEl.onload = () => {
        // Define global gtag
        window[`gtag${item?.code}`] = function () {
          const dataLayer = (window as any).dataLayer || [];
          dataLayer.push(arguments);
        };

        // Initialize GA
        window[`gtag${item?.code}`]('js', new Date());
        window[`gtag${item?.code}`]('config', item?.code);
      };
      return scriptEl;
    });
  }

  private initGoogleAds(items: GoogleTracking[]): HTMLElement[] {
    return items?.map((item) => {
      const scriptEl = document.createElement('script');
      scriptEl.setAttribute('async', '');
      scriptEl.src = `https://www.googletagmanager.com/gtag/js?id=${item?.code}`;
      return scriptEl;
    });
  }

  async pushPageView(pageName: string): Promise<void> {
    this.pushEvent(DataLayerEvents.page, {
      [DataLayerKeys.pageName]: pageName
    });
  }

  async pushEvent(
    event: string,
    payload: object,
    subEvent?: string,
    useCache = true
  ): Promise<void> {
    // ✅ Skip if no GTM and no GA codes
    if (!this.gtm?.code && !this.gaCodeList?.length) {
      return;
    }

    // ✅ Compose payload
    const newObj = {
      ...this.getGtmBaseObj(useCache),
      ...payload
    };

    // ✅ Cache the payload if needed
    if (useCache) {
      try {
        sessionStorage.setItem('session', JSON.stringify(newObj));
      } catch (e) {
        console.warn('Failed to cache dataLayer object:', e);
      }
    }

    // ✅ Ensure GTM or gtag.js is ready before pushing
    const waitUntilReady = (): Promise<void> =>
      new Promise((resolve) => {
        const check = () => {
          const hasGTM = (window as any).dataLayer?.some(
            (d: any) => d?.event === 'gtm.js'
          );
          const hasGtag = typeof (window as any).gtag === 'function';
          console.log('🚀 ~ GoogleTrackingService ~ check ~ hasGTM:', hasGTM);
          console.log('🚀 ~ GoogleTrackingService ~ check ~ hasGtag:', hasGtag);

          if (hasGTM || hasGtag) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });

    await waitUntilReady();

    const hasGTM = !!this.gtm?.code;

    if (hasGTM) {
      // ✅ GTM present — use dataLayer
      const dataLayer = (window as any).dataLayer || [];
      const eventObj = subEvent
        ? { event, subEvent, ...newObj }
        : { event, ...newObj };
      dataLayer.push(eventObj);
      return;
    }

    const hasGtag = typeof (window as any).gtag === 'function';
    if (!hasGtag) return;

    // ✅ No GTM — use gtag.js directly
    const gtagPayload = { ...newObj?.['ecommerce'] };
    if (subEvent) gtagPayload['subEvent'] = subEvent;
    (window as any).gtag('event', event, gtagPayload);
  }

  private getGtmBaseObj(useCache = true): object {
    const queryParams = this.route.snapshot.queryParams;

    const hotelCode = queryParams[RouteKeyQueryParams.hotelCode];
    let result: object = {
      [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase()
    };

    const { checkIn, checkOut, dateRange } =
      this.transactionService.getCheckInOutDate({
        from: queryParams[RouteKeyQueryParams.checkInDate],
        to: queryParams[RouteKeyQueryParams.checkOutDate]
      });

    if (checkIn && checkOut) {
      const numberOfNights =
        this.transactionService.getNumberOfNight(dateRange);

      result = {
        ...result,
        [DataLayerKeys.checkIn]: checkIn
          ? moment(new Date(checkIn)).format('DD.MM.yyyy')
          : null,
        [DataLayerKeys.checkOut]: checkOut
          ? moment(new Date(checkOut)).format('DD.MM.yyyy')
          : null,
        [DataLayerKeys.numberOfNights]: numberOfNights
      };
    }

    const {
      totalRoom,
      adults: adult,
      children
    } = this.transactionService.getTraveler(
      queryParams[RouteKeyQueryParams.numberOfRoom]
    );

    if (totalRoom) {
      result = {
        ...result,
        [DataLayerKeys.numberOfRooms]: totalRoom
      };
    }

    if (adult) {
      result = {
        ...result,
        [DataLayerKeys.totalAdults]: adult
      };
    }

    if (children != null && children != undefined) {
      result = {
        ...result,
        [DataLayerKeys.totalChildren]: children
      };
    }

    return useCache
      ? { ...this.previousPushedObject.value, ...result }
      : { ...result };
  }

  async trackPurchaseEvent(
    hotelCode: string,
    bookingInfo: Booking,
    currency: string,
    ecommerceData: object
  ): Promise<void> {
    if (this.gtm !== null && !this.hasGtmBetaEnabled(hotelCode)) {
      const {
        bookingNumber,
        cityTaxAmount,
        payAtHotelAmount,
        payOnConfirmationAmount,
        reservationList,
        totalBaseAmount,
        totalGrossAmount
      } = bookingInfo;

      this.pushEvent(DataLayerEvents.confirmBooking, {
        [DataLayerKeys.amountWithoutTax]: totalBaseAmount || null,
        [DataLayerKeys.bookingNumber]: bookingNumber || null,
        [DataLayerKeys.cityTaxAmount]: cityTaxAmount,
        [DataLayerKeys.currency]: currency,
        [DataLayerKeys.currencyCode]: currency,
        [DataLayerKeys.ecommerce]: ecommerceData,
        [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase(),
        [DataLayerKeys.payAtHotel]: payAtHotelAmount || null,
        [DataLayerKeys.payOnConfirmation]: payOnConfirmationAmount || null,
        [DataLayerKeys.totalAmount]: totalGrossAmount || null,
        [DataLayerKeys.value]: totalGrossAmount || null,
        [DataLayerKeys.hotelExtras]: reservationList
          ?.flatMap((res) => res?.reservationAmenityList)
          ?.reduce((acc, val) => {
            if (!val) {
              return acc;
            }
            const newVal = val.reservationAmenityDateList?.reduce(
              (acc1, val1) => acc1 + +val1?.count,
              0
            );
            if (acc.some((item) => item.service === val.hotelAmenity?.name)) {
              const currentVal =
                acc.find((item) => item.service === val.hotelAmenity?.name)
                  ?.quantity ?? 0;
              return [
                ...acc,
                {
                  service: val.hotelAmenity?.name,
                  quantity: currentVal + newVal
                }
              ];
            } else {
              acc.push({
                service: val.hotelAmenity?.name,
                quantity: newVal
              });
              return acc;
            }
          }, [])
      });
    }
    this.gaCodeList?.forEach((item) => {
      if (this.isGA4code(item?.code)) {
        if (!this.isTrackingSupported(hotelCode)) {
          this.pushEvent(DataLayerEvents.purchase, {
            ...ecommerceData,
            [DataLayerKeys.ecommerce]: ecommerceData,
            send_to: item?.code
          });
        }
      }
      if (this.isGoogleAdscode(item?.code)) {
        this.pushEvent(DataLayerEvents.conversion, {
          ...ecommerceData,
          [DataLayerKeys.ecommerce]: ecommerceData,
          send_to: item?.sendTo
        });
      }
    });

    // Reset after booking completed
    this.previousPushedObject.next({});
    sessionStorage.removeItem('session');
  }

  private isGA4code(code: string): boolean {
    return code?.startsWith('G-');
  }

  private isGoogleAdscode(code: string): boolean {
    return code?.startsWith('AW-');
  }

  pushConsentUpdate(): void {
    const ucData = JSON.parse(localStorage.getItem('ucData') || '{}');
    let adStorage = 'granted';
    let analyticsStorage = 'granted';
    let adUserData = 'granted';
    let adPersonalization = 'granted';
    let functionalityStorage = 'granted';
    let personalizationStorage = 'granted';
    let securityStorage = 'granted';
    if (ucData?.gcm) {
      const gcm = ucData?.gcm;
      adStorage = gcm.adStorage || 'granted';
      analyticsStorage = gcm.analyticsStorage || 'granted';
      adPersonalization = gcm.adPersonalization || 'granted';
      adUserData = gcm.adUserData || 'granted';
      functionalityStorage = gcm.functionalityStorage || 'granted';
      personalizationStorage = gcm.personalizationStorage || 'granted';
      securityStorage = gcm.securityStorage || 'granted';
    }
    const payload = {
      ad_storage: adStorage,
      analytics_storage: analyticsStorage,
      ad_user_data: adUserData,
      ad_personalization: adPersonalization,
      functionality_storage: functionalityStorage,
      personalization_storage: personalizationStorage,
      security_storage: securityStorage
    };
    const gtag = window.window['gtag'];
    gtag('consent', 'update', payload);
  }

  private readonly devProperies = ['GV205632'];
  private readonly prodProperties = [];

  // Support property for unified Google Tracking, empty is allow all
  private readonly supportedTrackingProperties = [
    ...(environment.production ? this.prodProperties : this.devProperies)
  ];

  private isTrackingSupported(propertyCode: string) {
    if (this.supportedTrackingProperties.length == 0) {
      return true;
    }

    return (
      propertyCode !== null &&
      this.supportedTrackingProperties.includes(propertyCode?.toUpperCase())
    );
  }

  private cleanEcommerceData() {
    const dataLayer = (window as any).dataLayer || [];
    dataLayer.push({ ecommerce: null });
  }

  private hasGtmBetaEnabled(propertyCode) {
    const properties = environment.gtmBetaProperty
      ?.trim()
      ?.split(',')
      // Remove invalid property code
      ?.filter(
        (property) =>
          property.length > 0 && /^GV[\w\d]{6}$/g.test(property?.toUpperCase())
      );
    return properties?.length > 0 && properties?.includes(propertyCode);
  }

  pushGoogleTrackingEvent(
    propertyCode: string,
    event: GoogleTrackingEvents,
    payload: object
  ) {
    const hasGA4Enabled =
      this.gaCodeList?.filter((item) => this.isGA4code(item?.code))?.length > 0;
    const hasGtmBetaEnabled = this.hasGtmBetaEnabled(propertyCode);
    if (
      (hasGA4Enabled && this.isTrackingSupported(propertyCode)) ||
      hasGtmBetaEnabled
    ) {
      const body = { ecommerce: { ...payload } };
      console.log(`Push event ${event}:`);
      console.log(body);
      this.cleanEcommerceData();
      this.pushEvent(event, { ecommerce: { ...payload } }, null, false);
    }
  }
}
