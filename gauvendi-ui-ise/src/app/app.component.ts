import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScrollerService } from '@app/services/scroller.service';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { environment } from '@environment/environment';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { map } from 'rxjs/operators';
import { CommonService } from './services/common.service';
import { CookieConsentService } from './services/cookie-consent.service';

@Component({
  selector: 'app-root',
  template: ` <div
    appThemeSetting
    [dir]="(lang$ | async) === multiLangEnum.AR ? 'rtl' : 'ltr'"
    [style.--dir]="(lang$ | async) === multiLangEnum.AR ? 'rtl' : 'ltr'"
  >
    <router-outlet></router-outlet>
  </div>`
})
export class AppComponent implements OnInit, AfterViewInit {
  private readonly commonService = inject(CommonService);
  private readonly cookieConsentService = inject(CookieConsentService);
  private readonly route = inject(ActivatedRoute);
  private readonly scrollerService = inject(ScrollerService);

  currentPosition = window.scrollY;
  multiLangEnum = MultiLangEnum;

  lang$ = this.route.queryParams.pipe(
    map((params) => params[RouteKeyQueryParams.lang])
  );

  constructor() {
    this.cookieConsentService.initCMP();
  }

  ngOnInit(): void {
    this.initScripts();
    // Init 3rd-party tracking service
    window.addEventListener('scroll', () => {
      this.scrollerService.isScrollDown$.next(
        window.scrollY === 0 ? false : window.scrollY > this.currentPosition
      );
      this.currentPosition = window.scrollY > 0 ? window.scrollY : 0;
    });
  }

  initScripts() {
    const isProduction = environment.mode === 'production' ? true : false;

    const scripts = [
      isProduction
        ? 'https://pay.datatrans.com/upp/payment/js/secure-fields-2.0.0.js'
        : 'https://pay.sandbox.datatrans.com/upp/payment/js/secure-fields-2.0.0.js'
    ];
    scripts.forEach((script) => {
      const scriptElement = document.createElement('script');
      scriptElement.src = script;
      scriptElement.async = true;
      document.body.appendChild(scriptElement);
    });
  }

  ngAfterViewInit(): void {
    const isMobile =
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.commonService.isMobile$.next(window.innerWidth < 768 || isMobile);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const isMobile =
      /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.commonService.isMobile$.next(window.innerWidth < 768 || isMobile);
  }
}
