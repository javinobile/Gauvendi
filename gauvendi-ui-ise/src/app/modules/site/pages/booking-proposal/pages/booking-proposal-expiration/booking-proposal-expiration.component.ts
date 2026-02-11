import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {select, Store} from "@ngrx/store";
import {selectorHotelEmailAddressList, selectorHotelPhone} from "@store/hotel/hotel.selectors";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {SectionCodeEnum} from "@store/multi-lang/multi-lang.state";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";
import {RouteKeyQueryParams} from "@constants/RouteKey";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-booking-proposal-expiration',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './booking-proposal-expiration.component.html',
  styleUrls: ['./booking-proposal-expiration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingProposalExpirationComponent {
  phoneNumber$ = this.store.pipe(select(selectorHotelPhone));
  hotelEmailAddress$: Observable<string> = this.store.pipe(
    select(selectorHotelEmailAddressList),
    map(res => res && res[0])
  );

  constructor(
    private store: Store,
    private route: ActivatedRoute
  ) {
  }

  navigateToRecommendation(): void {
    window.open(`/${this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode]}`, '_self');
  }
}
