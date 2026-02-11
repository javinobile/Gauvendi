import { Directive, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { map } from 'rxjs/operators';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';

@Directive({
  selector: '[dirSettingDirective]',
  standalone: true,
})
export class DirSettingDirective {
  route = inject(ActivatedRoute);
  direction = signal<'rtl' | 'ltr'>('ltr');
  lang$ = this.route.queryParams.pipe(
    map(params => params[RouteKeyQueryParams.lang]),
    distinctUntilChanged()
  );

  constructor() {
    this.lang$.subscribe(data => {
      this.direction.set(data === MultiLangEnum.AR ? 'rtl' : 'ltr');
    });
  }


}
