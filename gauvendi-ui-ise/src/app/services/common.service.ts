import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteKeyQueryParams } from '@app/constants/RouteKey';
import { IRoomSummary } from '@app/models/common.model';
import { MultiLangEnum } from '@app/store/multi-lang/multi-lang.state';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { BookingTransactionService } from './booking-transaction.service';

@Injectable({ providedIn: 'root' })
export class CommonService {
  private bookingTransactionService = inject(BookingTransactionService);
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);

  roomSummary$ = this.route.queryParams.pipe(
    map((queryParams) => queryParams[RouteKeyQueryParams.numberOfRoom]),
    distinctUntilChanged(),
    map((data) => this.bookingTransactionService.getTraveler(data))
  );

  isMobile$ = new BehaviorSubject<boolean>(false);
  currentLang = signal<string>(MultiLangEnum.EN);
  isFeatureChanged = new BehaviorSubject<boolean>(false);
  isSearchBarChanged = new BehaviorSubject<boolean>(false);
  selectedRoomSummary = new BehaviorSubject<IRoomSummary>(null);
  selectedSpaceType = signal<string>(null);
  isDirectLink = signal<boolean>(false);

  setLang(lang: string): void {
    this.currentLang.set(lang);
    this.document.documentElement.lang = lang;
  }
}
