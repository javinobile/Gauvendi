import {Injectable} from '@angular/core';
import {environment} from "@environment/environment";
import {select, Store} from "@ngrx/store";
import {selectorHotel} from "@store/hotel/hotel.selectors";
import {skipWhile, tap} from "rxjs/operators";
import {RouteKeyQueryParams} from "@constants/RouteKey";
import {ActivatedRoute} from "@angular/router";
import {formatDate} from "@angular/common";
import {HotelConfigService} from "@app/services/hotel-config.service";

interface DuettoTracking {
  appId?: string;
  tld?: string;
  hotelId?: string;
  startDate?: string;
  endDate?: string;
  b?: string; // booking id
  rt?: string; // room type
  rc?: string; // rate or sales plan code
  r?: number; // rate
  na?: number; // number of adults
  nc?: number; // number of children
  qq?: DuettoQuote[];
}

interface DuettoQuote {
  r?: number; // rate
  rt?: string; // room type
  rc?: string; // rate or sales plan code
}

@Injectable({
  providedIn: 'root'
})
export class DuettoService {
  hotelId: string;
  hotelName: string;
  hotelCurrency: string;
  hotelCode: string;
  hotel$ = this.store.pipe(
    select(selectorHotel),
    skipWhile(data => !data),
    tap(hotel => {
      this.hotelId = hotel?.id;
      this.hotelName = hotel?.name;
      this.hotelCurrency = hotel?.baseCurrency?.code;
      this.hotelCode = hotel?.code;
    })
  );

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private hotelConfigService: HotelConfigService
  ) {
    this.hotel$.subscribe();
  }

  trackSelectRoom(modifyData: DuettoTracking, quoutes: DuettoQuote[]): void {
    if (!environment.production) {
      return;
    }

    const scriptTag = document.getElementById('Duetto_Select');
    if (scriptTag != null) {
      document.body.removeChild(scriptTag);
    }

    const globalConfig: DuettoTracking = {...this.getGlobalConfig(), ...(modifyData || {})};
    const script = document.createElement('script');
    script.id = `Duetto_Select`;
    if (this.hotelConfigService?.duettoConfig$?.getValue()?.appId?.length > 0 && this.hotelConfigService?.duettoConfig$?.getValue()?.tld?.length > 0) {
      script.text = `
      window.duetto = {
          appId: "${globalConfig?.appId}",
          tld: "${globalConfig?.tld}",
          events: [{
            't': 's',
            'h': '${globalConfig.hotelId}',
            'sd': '${globalConfig?.startDate}',
            'ed': '${globalConfig?.endDate}',
            'cc': '${this.hotelCurrency}'
          }]
        };

        window.duetto.events.push({
          't': 'q',
          'h': '${globalConfig.hotelId}',
          'qq' : ${JSON.stringify(quoutes)},
          'sd': '${globalConfig?.startDate}',
          'ed': '${globalConfig?.endDate}'
        });
        (function () { var s = document.createElement('script'); s.type =
        'text/javascript'; s.async = true; s.src = ('https:' ==
        document.location.protocol ? 'https://' : 'http://') +
        'capture.duettoresearch.com/assets/js/duetto/duetto.js'; var n =
        document.getElementsByTagName('script')[0]; n.parentNode.insertBefore(s,
        n); })();
      `;
    }

    document.body.appendChild(script);

  }

  trackNoAvailable(modifyData: DuettoTracking): void {
    if (!environment.production) {
      return;
    }

    const scriptTag = document.getElementById('Duetto_Select');
    if (scriptTag != null) {
      document.body.removeChild(scriptTag);
    }

    const globalConfig: DuettoTracking = {...this.getGlobalConfig(), ...(modifyData || {})};
    const script = document.createElement('script');
    script.id = `Duetto_Denial`;
    if (this.hotelConfigService?.duettoConfig$?.getValue()?.appId?.length > 0 && this.hotelConfigService?.duettoConfig$?.getValue()?.tld?.length > 0) {
      script.text = `
      window.duetto = {
          appId: "${globalConfig?.appId}",
          tld: "${globalConfig?.tld}",
          events: [{
            't': 'd',
            'h': '${globalConfig.hotelId}',
            'sd': '${globalConfig?.startDate}',
            'ed': '${globalConfig?.endDate}',
            'cc': '${this.hotelCurrency}'
          }]
        };

        (function () { var s = document.createElement('script'); s.type =
        'text/javascript'; s.async = true; s.src = ('https:' ==
        document.location.protocol ? 'https://' : 'http://') +
        'capture.duettoresearch.com/assets/js/duetto/duetto.js'; var n =
        document.getElementsByTagName('script')[0]; n.parentNode.insertBefore(s,
        n); })();
      `;
    }

    document.body.appendChild(script);
  }

  trackMakeBooking(modifyData: DuettoTracking): void {
    if (!environment.production) {
      return;
    }

    const scriptTag = document.getElementById('Duetto_Booking');
    if (scriptTag != null) {
      document.body.removeChild(scriptTag);
    }

    const globalConfig: DuettoTracking = {...this.getGlobalConfig(), ...(modifyData || {})};
    const script = document.createElement('script');
    script.id = `Duetto_Booking`;
    if (this.hotelConfigService?.duettoConfig$?.getValue()?.appId?.length > 0 && this.hotelConfigService?.duettoConfig$?.getValue()?.tld?.length > 0) {
      script.text = `
      window.duetto = {
          appId: "${globalConfig?.appId}",
          tld: "${globalConfig?.tld}",
          events: [{
            't': 'b',
            'h': '${globalConfig?.hotelId}',
            'b': '${globalConfig?.b}',
            'rt': '${globalConfig?.rt}',
            'rc': '${globalConfig?.rc}',
            'r': ${globalConfig?.r},
            'na': ${globalConfig?.na},
            'nc': ${globalConfig?.nc},
            'sd': '${globalConfig?.startDate}',
            'ed': '${globalConfig?.endDate}',
            'cc': '${this.hotelCurrency}'
          }]
        };

      (function () { var s = document.createElement('script'); s.type =
      'text/javascript'; s.async = true; s.src = ('https:' ==
      document.location.protocol ? 'https://' : 'http://') +
      'capture.duettoresearch.com/assets/js/duetto/duetto.js'; var n =
      document.getElementsByTagName('script')[0]; n.parentNode.insertBefore(s,
      n); })();
      `;
    }

    document.body.appendChild(script);
  }

  removeAllScript(): void {
    const scriptTagSearch = document.getElementById('Duetto_Select');
    if (scriptTagSearch != null)
    {
      document.body.removeChild(scriptTagSearch);
    }

    const scriptTagCart = document.getElementById('Duetto_Denial');
    if (scriptTagCart != null)
    {
      document.body.removeChild(scriptTagCart);
    }

    const scriptTagConversion = document.getElementById('Duetto_Booking');
    if (scriptTagConversion != null)
    {
      document.body.removeChild(scriptTagConversion);
    }
  }

  getGlobalConfig(): DuettoTracking {
    const queryParams = this.route.snapshot.queryParams;
    const checkIn = queryParams[RouteKeyQueryParams.checkInDate];
    const checkOut = queryParams[RouteKeyQueryParams.checkOutDate];
    return {
      appId: this.hotelConfigService.duettoConfig$?.getValue()?.appId,
      tld: this.hotelConfigService.duettoConfig$?.getValue()?.tld,
      hotelId: this.hotelCode,
      startDate: checkIn ? formatDate(
        checkIn?.split('-')?.reverse()?.join('-'),
        'yyyy-MM-dd',
        'en-US'
      ) : null,
      endDate: checkOut ? formatDate(
        checkOut?.split('-')?.reverse()?.join('-'),
        'yyyy-MM-dd',
        'en-US'
      ) : null
    };
  }
}
