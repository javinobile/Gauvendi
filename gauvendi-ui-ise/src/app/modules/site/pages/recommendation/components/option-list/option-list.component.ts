import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  input,
  Output,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import { IRoomSummary } from '@app/models/common.model';
import { EDisplayMode } from '@app/models/display-mode.model';
import {
  EPriceView,
  IBundleItem,
  ICombinationOptionItem
} from '@app/models/option-item.model';
import { CommonService } from '@app/services/common.service';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { TrackingService } from '@app/services/tracking.service';
import { FilterSvgDirective } from '@app/shared/directives/filter-svg.directive';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { selectorHotelRetailFeatureList } from '@app/store/hotel/hotel.selectors';
import { Scroller } from '@app/utils/scroller.util';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { CalculateDetailsPopupPositionPipe } from '../../pipes/calculate-details-popup-position.pipe';
import { CalculateRenderedItemsPipe } from '../../pipes/calculate-rendered-items.pipe';
import { GetSpaceTypeNamePipe } from '../../pipes/get-space-type-name';
import { CombinationOptionItemComponent } from '../combination-option-item/combination-option-item.component';
import { OptionBundleComponent } from '../option-bundle/option-bundle.component';
import { OptionItemComponent } from '../option-item/option-item.component';

@Component({
  selector: 'app-option-list',
  standalone: true,
  templateUrl: './option-list.component.html',
  styleUrls: ['./option-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalculateDetailsPopupPositionPipe,
    CalculateRenderedItemsPipe,
    CombinationOptionItemComponent,
    CommonModule,
    FilterSvgDirective,
    OptionBundleComponent,
    OptionItemComponent,
    TranslatePipe,
    GetSpaceTypeNamePipe
  ],
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
export class OptionListComponent {
  private trackingService = inject(TrackingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private commonService = inject(CommonService);
  private store = inject(Store);

  @Input({ required: true }) items: ICombinationOptionItem[];
  @Input() bundles: IBundleItem[];
  @Input({ required: true }) isLowestPriceOpaque: boolean;
  @Input({ required: true }) lowestPriceImageUrl: string;
  roomSummary = input<IRoomSummary>();
  @Input() priceView: EPriceView = EPriceView.PerNight;
  @Input() displayMode: EDisplayMode = EDisplayMode.Grid;
  @Input() isMatchFlow: boolean = false;
  @Input() showTotal = true;
  @Input() buttonTextColor: string;
  @Input() buttonBgColor: string;
  @Input() configuratorHoverBg: string;
  @Input() limitNumber = 6;
  @Input() isAlternativeOption = false;
  @Output() onSelectRatePlan = new EventEmitter<{
    item: ICombinationOptionItem;
    ratePlan: any;
  }>();

  isBundleSelected = false;

  loadedMore = signal(false);

  EDisplayMode = EDisplayMode;
  itemSelectedIndex = null;
  itemSelected: ICombinationOptionItem = null;

  hotelConfigService = inject(HotelConfigService);
  colorText$ = this.hotelConfigService.colorText$;

  selectedBundle: IBundleItem = null;
  selectedSpaceType = this.commonService.selectedSpaceType;
  spaceTypeList$ = this.store.pipe(
    select(selectorHotelRetailFeatureList),
    map((data) =>
      data?.filter(
        (feature) =>
          feature?.hotelRetailCategory?.code === SpaceTypeCategoryCode
      )
    )
  );

  calculateRenderedItems(
    itemsLength: number,
    bundleLength: number,
    limitNumber: number,
    isLoadedMore: boolean = false
  ): number {
    const max = isLoadedMore ? 30 : limitNumber;

    if (itemsLength < max) {
      const total = itemsLength + bundleLength;
      return total > max ? max - bundleLength : total;
    }

    return max - bundleLength;
  }

  onBundleRatePlanSelected($event: IBundleItem, index: number, id: string) {
    this.itemSelected = $event?.items?.[0];
    this.itemSelectedIndex = index;
    this.isBundleSelected = true;
    this.selectedBundle = $event;
    setTimeout(() => {
      const bundleEl = document.getElementById(id);
      bundleEl?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 500);
  }

  selectItem(
    data: {
      item: any;
      isOpenDetail: boolean;
      view: string;
    },
    iCombinationOptionItem: ICombinationOptionItem,
    index: number
  ) {
    if (data?.isOpenDetail) {
      localStorage.setItem(
        'iCombinationOptionItem',
        JSON.stringify(iCombinationOptionItem)
      );
      localStorage.setItem(
        'isAlternativeOption',
        JSON.stringify(this.isAlternativeOption)
      );
      this.router
        .navigate([RouterPageKey.recommendationDetail], {
          queryParams: {
            ...this.route.snapshot.queryParams,
            view: data?.view
          },
          queryParamsHandling: 'merge'
        })
        .then(() => {
          // Scroll to top
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        });
    } else {
      this.isBundleSelected = false;
      this.itemSelected = iCombinationOptionItem;
      this.itemSelectedIndex = index;
      const objItem = this.getObjSelectOptionTrackMixPanel(
        iCombinationOptionItem
      );
      this.trackingService.track(MixpanelKeys.SelectSearchOption, objItem);
      Scroller.scrollToTargetElement(
        `option-item-${iCombinationOptionItem?.metadata?.['stayOptionUuid']}`,
        100
      );
    }
  }

  getObjSelectOptionTrackMixPanel(item: ICombinationOptionItem) {
    return {
      request_id:
        this.route.snapshot.queryParams[RouteKeyQueryParams.requestId],
      recommendation_id: item?.metadata['stayOptionUuid'],
      booking_flow: item?.metadata?.label,
      available_rfc_list: item?.metadata?.availableRfcList
        ?.map((i) => i?.code)
        ?.join(','),
      available_rfc_rate_plan_list: item?.metadata?.availableRfcRatePlanList
        ?.map((i) => i?.code)
        ?.join(','),
      product_feature:
        (item?.metadata?.label !== 'MATCH' &&
          item?.metadata?.availableRfcList?.map((i) => {
            return i?.retailFeatureList?.map((el) => el?.code)?.join(',');
          })) ||
        [],
      guarantee_feature:
        (item?.metadata?.label === 'MATCH' &&
          item?.metadata?.availableRfcList?.map((i) => {
            return i?.retailFeatureList
              ?.map((el) => `${el?.code}#${el?.matched ? 1 : 0}`)
              ?.join(',');
          })) ||
        []
    };
  }

  viewAlternativeOption(): void {
    const notMatchSection = document.getElementById('notMatchTitle');
    notMatchSection?.scrollIntoView({
      behavior: 'smooth'
    });
  }
}
