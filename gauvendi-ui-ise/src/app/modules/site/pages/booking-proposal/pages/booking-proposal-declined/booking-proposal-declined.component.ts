import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {select, Store} from "@ngrx/store";
import {MultiLangEnum} from "@store/multi-lang/multi-lang.state";
import {distinctUntilChanged, map, skipWhile} from "rxjs/operators";
import {ActivatedRoute} from "@angular/router";
import {selectorHotelEmailAddressList, selectorHotelPhone} from "@store/hotel/hotel.selectors";
import {Observable} from "rxjs";
import {RouteKeyQueryParams} from "@constants/RouteKey";
import {loadCppBookingSummary} from '@store/booking-summary/booking-summary.actions';
import {Booking} from "@core/graphql/generated/graphql";
import {selectorCppBookingSummary} from '@store/booking-summary/booking-summary.selectors';
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {DateWithLocalePipe} from "@app/shared/pipes/date-with-locale.pipe";
import {loadStaticContent} from "@store/multi-lang/multi-lang.actions";

@Component({
  selector: 'app-booking-proposal-declined',
  standalone: true,
  imports: [CommonModule, TranslatePipe, DateWithLocalePipe],
  templateUrl: './booking-proposal-declined.component.html',
  styleUrls: ['./booking-proposal-declined.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingProposalDeclinedComponent implements OnInit {
  phoneNumber$ = this.store.pipe(select(selectorHotelPhone));
  hotelEmailAddress$: Observable<string> = this.store.pipe(
    select(selectorHotelEmailAddressList),
    map(res => res && res[0])
  );
  cancelledDate$: Observable<string> = this.store.pipe(
    select(selectorCppBookingSummary),
    skipWhile(data => !data),
    map((data: Booking) => data ? data?.cancelledDate : null)
  )
  locale$ = this.route.queryParams.pipe(
    map(queryParam => queryParam[RouteKeyQueryParams.lang] || MultiLangEnum.EN),
    distinctUntilChanged()
  );

  constructor(
    private store: Store,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    const id: string = this.route.snapshot.queryParams[RouteKeyQueryParams.paymentId];
    this.route.queryParams.pipe(
      map(queryParams => queryParams[RouteKeyQueryParams.lang] || MultiLangEnum.EN),
      distinctUntilChanged(),
    ).subscribe(lang => {
      this.store.dispatch(
        loadStaticContent({
          locale: lang
        }),
      );

      this.store.dispatch(loadCppBookingSummary({
        variables: {
          filter: {
            bookingId: id,
            translateTo: lang === MultiLangEnum.EN ? null : lang?.toLocaleUpperCase()
          },
        },
      }));
    });
  }


  navigateToRecommendation(): void {
    window.open(`/${this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode]}`, '_self');
  }
}
