import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  NgZone,
  Output,
  ViewChild
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { EDisplayMode } from '@models/display-mode.model';
import { EPriceView, ICombinationOptionItem } from '@models/option-item.model';
import * as moment from 'moment/moment';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { IRoomSummary } from '@app/models/common.model';
import { AppRouterService } from '@app/services/app-router.service';
import { DirectCalendarComponent } from '../direct-calendar/direct-calendar.component';
import { OptionItemComponent } from '../option-item/option-item.component';

@Component({
  selector: 'app-direct-stay-option',
  standalone: true,
  imports: [
    CommonModule,
    OptionItemComponent,
    DirectCalendarComponent,
    MatIconModule,
    TranslatePipe,
    FilterSvgDirective
  ],
  templateUrl: './direct-stay-option.component.html',
  styleUrls: ['./direct-stay-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('inOutAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0.5 }),
        animate('400ms', style({ height: '100%', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '100%', opacity: 1 }),
        animate('400ms', style({ height: 0, opacity: 0 }))
      ])
    ]),
    trigger('fadeInOutAnimation', [
      transition(':enter', [
        style({ opacity: 0.5 }),
        animate('400ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('400ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class DirectStayOptionComponent {
  private zone = inject(NgZone);
  private cd = inject(ChangeDetectorRef);
  private bookingTransactionService = inject(BookingTransactionService);
  private route = inject(ActivatedRoute);
  private hotelConfigService = inject(HotelConfigService);
  private appRouterService = inject(AppRouterService);

  @ViewChild('wrapper', { static: false }) wrapperEle: ElementRef;
  @Input() specificRoom: ICombinationOptionItem;
  @Input() isLowestPriceOpaque: boolean;
  roomSummary = input<IRoomSummary>();
  @Input({ required: true }) lowestPriceImageUrl: string;
  @Input() priceView: EPriceView;
  @Input() textColor: string;
  @Input() buttonBgColor: string;
  @Input() buttonTextColor: string;
  @Input() configuratorHoverBg: string;
  @Output() selectRatePlan = new EventEmitter<string>();

  protected readonly EDisplayMode = EDisplayMode;
  observer: ResizeObserver;
  clientHeight = 0;
  itemSelected: ICombinationOptionItem = null;

  isChangeDate$ = combineLatest([
    this.bookingTransactionService.directLinkSelectedDate$?.asObservable(),
    this.route.queryParams.pipe(
      map((queryParams) => [
        queryParams[RouteKeyQueryParams.checkInDate],
        queryParams[RouteKeyQueryParams.checkOutDate]
      ]),
      distinctUntilChanged()
    )
  ]).pipe(
    map(([directSelected, currentSelect]) => {
      if (directSelected?.length > 0 && currentSelect?.length > 0) {
        if (directSelected[0] && directSelected[1]) {
          const [directCheckIn, directCheckOut] = [
            moment(new Date(directSelected[0])).format('DD-MM-yyyy'),
            moment(new Date(directSelected[1])).format('DD-MM-yyyy')
          ];
          return !(
            directCheckIn === currentSelect[0] &&
            directCheckOut === currentSelect[1]
          );
        }

        return false;
      }

      return false;
    })
  );

  layoutSetting$ = this.hotelConfigService.layoutSetting$;

  selectItem(data: { item: any; isOpenDetail: boolean; view: string }) {
    if (data?.isOpenDetail) {
      localStorage.setItem(
        'iCombinationOptionItem',
        JSON.stringify(this.specificRoom)
      );
      this.appRouterService.updateRouteQueryParams(
        {
          ...this.route.snapshot.queryParams,
          view: data?.view
        },
        {
          navigateUrl: RouterPageKey.recommendationDetail,
          done: () => {
            // Scroll to top
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });
          }
        }
      );
    } else {
      this.itemSelected = this.specificRoom;
      // observe
      this.observer?.unobserve(this.wrapperEle?.nativeElement);
      this.observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          this.zone.run(() => {
            this.clientHeight = entry.contentRect.height;
            this.cd.detectChanges();
          });
        });
      });
      this.observer.observe(this.wrapperEle?.nativeElement);
    }
  }
}
