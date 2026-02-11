import { formatDate } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { environment } from '@environment/environment';
import { select, Store } from '@ngrx/store';
import { selectorHotel } from '@store/hotel/hotel.selectors';
import { Observable } from 'rxjs';
import { skipWhile, tap } from 'rxjs/operators';

interface SojernTracking {
  hd1?: string;
  hd2?: string;
  hc1?: string;
  hs1?: string;
  hpr?: string;
  hr?: number;
  hpid?: string;
  t?: number;
  hp?: number;
  hcu?: string;
  hconfno?: string;
  sha256_eml?: string;
  sha1_eml?: string;
  md5_eml?: string;
  ccid?: string;
}

interface ITrackingConf {
  hotelCode: string;
  trackingSearchId: string;
  trackingCardId: string;
  trackingConversionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SojernService {
  hotelId: string;
  hotelName: string;
  hotelCurrency: string;
  hotelCode: string;
  hotel$ = this.store.pipe(
    select(selectorHotel),
    skipWhile((data) => !data),
    tap((hotel) => {
      this.hotelId = hotel?.id;
      this.hotelName = hotel?.name;
      this.hotelCurrency = hotel?.baseCurrency?.code;
      this.hotelCode = hotel?.code;
    })
  );
  trackingConf: ITrackingConf[] = [];
  readonly jsonUrl = 'assets/sojern.json';
  readonly hotelUsingNewSojern = [
    'GVBISHAR', // harry's home Bischofshofen
    'GVFRAPLA', // Plaza Hotel & Living
    'GVGEMFER', // Gemünder Ferienpark Salzberg
    'GVVILHAR', // harry’s home Villach
    'GVBLNHAR', // harry’s home Berlin
    'GVVALGAS', // Citizentral Gascons
    'GVVALJUR', // Citizentral Juristas
    'GVSPRHAR', // harry’s home Zürich-Limmattal
    'GVQFBOBE', // Oberkirch
    'GVMECCIT', // Meckenheim
    'GV664283' // Docents Collection
  ];

  isProduction = !!environment.production;

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private httpBackend: HttpBackend
  ) {
    if (this.isProduction) {
      this.hotel$.subscribe();
      this.getJSON().subscribe((data) => {
        this.trackingConf = data;
      });
    }
  }

  public getJSON(): Observable<any> {
    const httpClient = new HttpClient(this.httpBackend);
    return httpClient.get(this.jsonUrl);
  }

  trackingSearch(data: SojernTracking): void {
    const hotelTrackingConf = this.trackingConf?.find(
      (x) => x?.hotelCode?.toUpperCase() === this.hotelCode?.toUpperCase()
    );
    if (!this.isProduction || !hotelTrackingConf) {
      return;
    }
    const dataTracking = { ...this.getBaseObjTracking(), ...data };
    const scriptTag = document.getElementById('Sojern_Search');
    if (scriptTag != null) {
      document.body.removeChild(scriptTag);
    }

    const script = this.getSearchPixelScript(
      dataTracking,
      hotelTrackingConf?.trackingSearchId
    );

    document.body.appendChild(script);
  }

  trackingShoppingCart(data: SojernTracking): void {
    const hotelTrackingConf = this.trackingConf?.find(
      (x) => x?.hotelCode?.toUpperCase() === this.hotelCode?.toUpperCase()
    );
    if (!this.isProduction || !hotelTrackingConf) {
      return;
    }
    const dataTracking = { ...this.getBaseObjTracking(), ...data };
    const scriptTag = document.getElementById('Sojern_Cart');
    if (scriptTag != null) {
      document.body.removeChild(scriptTag);
    }

    const script = this.getShoppingCartPixelScript(
      dataTracking,
      hotelTrackingConf?.trackingCardId
    );

    document.body.appendChild(script);
  }

  trackingConversion(data: SojernTracking): void {
    const hotelTrackingConf = this.trackingConf?.find(
      (x) => x?.hotelCode?.toUpperCase() === this.hotelCode?.toUpperCase()
    );
    if (!this.isProduction || !hotelTrackingConf) {
      return;
    }
    const dataTracking = { ...this.getBaseObjTracking(), ...data };
    const scriptTag = document.getElementById('Sojern_Conversion');
    if (scriptTag != null) {
      document.body.removeChild(scriptTag);
    }

    const script = this.getConversionPixelScript(
      dataTracking,
      hotelTrackingConf?.trackingConversionId
    );

    document.body.appendChild(script);
  }

  removeAllScript(): void {
    const scriptTagSearch = document.getElementById('Sojern_Search');
    if (scriptTagSearch != null) {
      document.body.removeChild(scriptTagSearch);
    }

    const scriptTagCart = document.getElementById('Sojern_Cart');
    if (scriptTagCart != null) {
      document.body.removeChild(scriptTagCart);
    }

    const scriptTagConversion = document.getElementById('Sojern_Conversion');
    if (scriptTagConversion != null) {
      document.body.removeChild(scriptTagConversion);
    }
  }

  private getBaseObjTracking(): SojernTracking {
    const queryParams = this.route.snapshot.queryParams;
    const checkIn = queryParams[RouteKeyQueryParams.checkInDate];
    const checkOut = queryParams[RouteKeyQueryParams.checkOutDate];
    const rooms = queryParams[RouteKeyQueryParams.numberOfRoom];
    const currency = queryParams[RouteKeyQueryParams.currency];

    return {
      hd1: checkIn
        ? formatDate(
            checkIn?.split('-')?.reverse()?.join('-'),
            'yyyy-MM-dd',
            'en-US'
          )
        : null,
      hd2: checkOut
        ? formatDate(
            checkOut?.split('-')?.reverse()?.join('-'),
            'yyyy-MM-dd',
            'en-US'
          )
        : null,
      hc1: sessionStorage.getItem('locationSessionUserCity'),
      hs1: sessionStorage.getItem('locationSessionUserCountry'),
      hpr: this.hotelName,
      hr: rooms?.split(',')?.length || null,
      hpid: this.hotelCode?.toLowerCase(),
      hcu: currency || this.hotelCurrency,
      t:
        this.getRoomList(rooms)?.reduce((acc, curr) => acc + curr?.adult, 0) +
          this.getRoomList(rooms)?.reduce(
            (acc, curr) => [...acc, ...curr?.childrenAgeList],
            []
          )?.length || 0
    };
  }

  private getRoomList(
    traveler: string
  ): { adult: number; childrenAgeList: number[] }[] {
    return traveler
      ?.toString()
      ?.split(',')
      ?.map((item) => {
        const person: string[] = item?.split('-');
        return {
          adult: +person?.shift(),
          childrenAgeList: person?.map((x) => +x)
        };
      });
  }

  private getSearchPixelScript(
    dataTracking: SojernTracking,
    trackingSearchId: string
  ): HTMLScriptElement {
    const script = document.createElement('script');
    script.id = `Sojern_Search`;
    if (this.hotelUsingNewSojern.includes(this.hotelCode?.toUpperCase())) {
      script.text = `(function () {
                  var params = {
                  hd1: "${dataTracking?.hd1 || ''}",
                  hd2: "${dataTracking?.hd2 || ''}",
                  hc1: "${dataTracking?.hc1 || ''}",
                  hs1: "${dataTracking?.hs1 || ''}",
                  hpr: "${dataTracking?.hpr || ''}",
                  hr: ${dataTracking?.hr || null},
                  hpid: "${dataTracking?.hpid || ''}",
                  t: ${dataTracking?.t || null},
                  sha256_eml: "${dataTracking?.sha256_eml || ''}",
                  sha1_eml: "${dataTracking?.sha1_eml || ''}",
                  md5_eml: "${dataTracking?.md5_eml || ''}",
                  ccid: "${dataTracking?.ccid || ''}",
                  pt: "SEARCH"
                  };

                  params.et = {"HOME_PAGE":null,"SEARCH":"hs","PRODUCT":"hpr","SHOPPING_CART":"hcart","CONVERSION":"hc","TRACKING":null}[params.pt] || '';
                  try{params = Object.assign({}, sjrn_params, params);}catch(e){}
                  var paramsArr = [];
                  for(key in params) { paramsArr.push(key + '=' + encodeURIComponent(params[key])) };

                  var pl = document.createElement('iframe');
                  pl.type = 'text/html';
                  pl.setAttribute('style','height:0; width: 0; display:none;');
                  pl.async = true;
                  pl.src = "https://static.sojern.com/cip/c/266.html?f_v=cp_v3_js&p_v=1&" + paramsArr.join('&');
                  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pl);
                })();`;
    } else {
      script.text = `(function () {
                  var params = {
                  hd1: "${dataTracking?.hd1 || ''}",
                  hd2: "${dataTracking?.hd2 || ''}",
                  hc1: "${dataTracking?.hc1 || ''}",
                  hs1: "${dataTracking?.hs1 || ''}",
                  hpr: "${dataTracking?.hpr || ''}",
                  hr: ${dataTracking?.hr || null},
                  hpid: "${dataTracking?.hpid || ''}",
                  t: ${dataTracking?.t || null},
                  sha256_eml: "${dataTracking?.sha256_eml || ''}",
                  sha1_eml: "${dataTracking?.sha1_eml || ''}",
                  md5_eml: "${dataTracking?.md5_eml || ''}",
                  ccid: "${dataTracking?.ccid || ''}"
                  };

                  try{params = Object.assign({}, sjrn_params, params);}catch(e){}
                  var cid = [];
                  var paramsArr = [];
                  var cidParams = [];
                  var pl = document.createElement('iframe');
                  var defaultParams = {"vid":"hot","et":"hs"};
                  for(key in defaultParams) { params[key] = defaultParams[key]; };
                  for(key in cidParams) { cid.push(params[cidParams[key]]); };
                  params.cid = cid.join('|');
                  for(key in params) { paramsArr.push(key + '=' + encodeURIComponent(params[key])) };
                  pl.type = 'text/html';
                  pl.setAttribute('style','height:0; width: 0; display:none;');
                  pl.async = true;
                  pl.src = 'https://static.sojern.com/cip/w/s?id=${trackingSearchId}&f_v=v6_js&p_v=1&' + paramsArr.join('&');
                  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pl);
                  })();`;
    }
    return script;
  }

  private getShoppingCartPixelScript(
    dataTracking: SojernTracking,
    trackingCardId: string
  ): HTMLScriptElement {
    const script = document.createElement('script');
    script.id = `Sojern_Cart`;
    if (this.hotelUsingNewSojern.includes(this.hotelCode?.toUpperCase())) {
      script.text = `(function () {
                  var params = {
                  hd1: "${dataTracking?.hd1 || ''}",
                  hd2: "${dataTracking?.hd2 || ''}",
                  hc1: "${dataTracking?.hc1 || ''}",
                  hs1: "${dataTracking?.hs1 || ''}",
                  hpr: "${dataTracking?.hpr || ''}",
                  hr: ${dataTracking?.hr || null},
                  hpid: "${dataTracking?.hpid || ''}",
                  t: ${dataTracking?.t || null},
                  hp: ${dataTracking?.hp || null},
                  hcu: "${dataTracking?.hcu || ''}",
                  sha256_eml: "${dataTracking?.sha256_eml || ''}",
                  sha1_eml: "${dataTracking?.sha1_eml || ''}",
                  md5_eml: "${dataTracking?.md5_eml || ''}",
                  ccid: "${dataTracking?.ccid || ''}",
                  pt: "SHOPPING_CART"
                  };

                  params.et = {"HOME_PAGE":null,"SEARCH":"hs","PRODUCT":"hpr","SHOPPING_CART":"hcart","CONVERSION":"hc","TRACKING":null}[params.pt] || '';
                  try{params = Object.assign({}, sjrn_params, params);}catch(e){}
                  var paramsArr = [];
                  for(key in params) { paramsArr.push(key + '=' + encodeURIComponent(params[key])) };

                  var pl = document.createElement('iframe');
                  pl.type = 'text/html';
                  pl.setAttribute('style','height:0; width: 0; display:none;');
                  pl.async = true;
                  pl.src = "https://static.sojern.com/cip/c/266.html?f_v=cp_v3_js&p_v=1&" + paramsArr.join('&');
                  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pl);
                })();`;
    } else {
      script.text = `(function () {
                  var params = {
                  hd1: "${dataTracking?.hd1 || ''}",
                  hd2: "${dataTracking?.hd2 || ''}",
                  hc1: "${dataTracking?.hc1 || ''}",
                  hs1: "${dataTracking?.hs1 || ''}",
                  hpr: "${dataTracking?.hpr || ''}",
                  hr: ${dataTracking?.hr || null},
                  hpid: "${dataTracking?.hpid || ''}",
                  t: ${dataTracking?.t || null},
                  hp: ${dataTracking?.hp || null},
                  hcu: "${dataTracking?.hcu || ''}",
                  sha256_eml: "${dataTracking?.sha256_eml || ''}",
                  sha1_eml: "${dataTracking?.sha1_eml || ''}",
                  md5_eml: "${dataTracking?.md5_eml || ''}",
                  ccid: "${dataTracking?.ccid || ''}"
                  };

                  try{params = Object.assign({}, sjrn_params, params);}catch(e){}
                  var cid = [];
                  var paramsArr = [];
                  var cidParams = [];
                  var pl = document.createElement('iframe');
                  var defaultParams = {"vid":"hot","et":"hcart"};
                  for(key in defaultParams) { params[key] = defaultParams[key]; };
                  for(key in cidParams) { cid.push(params[cidParams[key]]); };
                  params.cid = cid.join('|');
                  for(key in params) { paramsArr.push(key + '=' + encodeURIComponent(params[key])) };
                  pl.type = 'text/html';
                  pl.setAttribute('style','height:0; width: 0; display:none;');
                  pl.async = true;
                  pl.src = 'https://static.sojern.com/cip/w/s?id=${trackingCardId}&f_v=v6_js&p_v=1&' + paramsArr.join('&');
                  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pl);
                  })();`;
    }
    return script;
  }

  private getConversionPixelScript(
    dataTracking: SojernTracking,
    trackingConversionId: string
  ): HTMLScriptElement {
    const script = document.createElement('script');
    script.id = `Sojern_Conversion`;
    if (this.hotelUsingNewSojern.includes(this.hotelCode?.toUpperCase())) {
      script.text = `(function () {
                  var params = {
                  hd1: "${dataTracking?.hd1 || ''}",
                  hd2: "${dataTracking?.hd2 || ''}",
                  hc1: "${dataTracking?.hc1 || ''}",
                  hs1: "${dataTracking?.hs1 || ''}",
                  hpr: "${dataTracking?.hpr || ''}",
                  hr: ${dataTracking?.hr || null},
                  hpid: "${dataTracking?.hpid || ''}",
                  t: ${dataTracking?.t || null},
                  hp: ${dataTracking?.hp || null},
                  hcu: "${dataTracking?.hcu || ''}",
                  hconfno: "${dataTracking?.hconfno || ''}",
                  sha256_eml: "${dataTracking?.sha256_eml || ''}",
                  sha1_eml: "${dataTracking?.sha1_eml || ''}",
                  md5_eml: "${dataTracking?.md5_eml || ''}",
                  ccid: "${dataTracking?.ccid || ''}",
                  pt: "CONVERSION"
                  };

                  params.et = {"HOME_PAGE":null,"SEARCH":"hs","PRODUCT":"hpr","SHOPPING_CART":"hcart","CONVERSION":"hc","TRACKING":null}[params.pt] || '';
                  try{params = Object.assign({}, sjrn_params, params);}catch(e){}
                  var paramsArr = [];
                  for(key in params) { paramsArr.push(key + '=' + encodeURIComponent(params[key])) };

                  var pl = document.createElement('iframe');
                  pl.type = 'text/html';
                  pl.setAttribute('style','height:0; width: 0; display:none;');
                  pl.async = true;
                  pl.src = "https://static.sojern.com/cip/c/266.html?f_v=cp_v3_js&p_v=1&" + paramsArr.join('&');
                  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pl);
                })();`;
    } else {
      script.text = `(function () {
                  var params = {
                  hd1: "${dataTracking?.hd1 || ''}",
                  hd2: "${dataTracking?.hd2 || ''}",
                  hc1: "${dataTracking?.hc1 || ''}",
                  hs1: "${dataTracking?.hs1 || ''}",
                  hpr: "${dataTracking?.hpr || ''}",
                  hr: ${dataTracking?.hr || null},
                  hpid: "${dataTracking?.hpid || ''}",
                  t: ${dataTracking?.t || null},
                  hp: ${dataTracking?.hp || null},
                  hcu: "${dataTracking?.hcu || ''}",
                  hconfno: "${dataTracking?.hconfno || ''}",
                  sha256_eml: "${dataTracking?.sha256_eml || ''}",
                  sha1_eml: "${dataTracking?.sha1_eml || ''}",
                  md5_eml: "${dataTracking?.md5_eml || ''}",
                  ccid: "${dataTracking?.ccid || ''}"
                  };

                  try{params = Object.assign({}, sjrn_params, params);}catch(e){}
                  var cid = [];
                  var paramsArr = [];
                  var cidParams = [];
                  var pl = document.createElement('iframe');
                  var defaultParams = {"vid":"hot","et":"hc"};
                  for(key in defaultParams) { params[key] = defaultParams[key]; };
                  for(key in cidParams) { cid.push(params[cidParams[key]]); };
                  params.cid = cid.join('|');
                  for(key in params) { paramsArr.push(key + '=' + encodeURIComponent(params[key])) };
                  pl.type = 'text/html';
                  pl.setAttribute('style','height:0; width: 0; display:none;');
                  pl.async = true;
                  pl.src = 'https://static.sojern.com/cip/w/s?id=${trackingConversionId}&f_v=v6_js&p_v=1&' + paramsArr.join('&');
                  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(pl);
                  })();`;
    }
    return script;
  }
}
