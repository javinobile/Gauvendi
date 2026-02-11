import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { DataLayerEvents, DataLayerKeys } from '@app/constants/datalayer.enum';
import { CombinationOptionItemMobileComponent } from '@app/modules/site/pages/recommendation/components/combination-option-item-mobile/combination-option-item-mobile.component';
import { OptionItemDetailComponent } from '@app/modules/site/pages/recommendation/components/option-item-detail/option-item-detail.component';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { SuggestionHandlerService } from '@app/services/suggestion-handler.service';
import { GoogleTrackingService } from '@app/services/tracking.google.service';
import { TrackingService } from '@app/services/tracking.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams, RouterPageKey } from '@constants/RouteKey';
import { RatePlan, RfcRatePlan } from '@core/graphql/generated/graphql';
import { ICombinationOptionItem } from '@models/option-item.model';
import { select, Store } from '@ngrx/store';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import { loadAvailableAmenity } from '@store/suggestion/suggestion.actions';
import {
  selectorHotelAvailableAmenities,
  selectorRatePlanList
} from '@store/suggestion/suggestion.selectors';
import { sum } from 'lodash';
import {
  distinctUntilChanged,
  map,
  Observable,
  skipWhile,
  Subject,
  takeUntil
} from 'rxjs';

@Component({
  selector: 'app-recommendation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe,
    OptionItemDetailComponent,
    CombinationOptionItemMobileComponent
  ],
  templateUrl: './recommendation-detail.component.html',
  styleUrls: ['./recommendation-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private suggestionHandlerService = inject(SuggestionHandlerService);
  private bookingTransactionService = inject(BookingTransactionService);
  protected trackingService = inject(TrackingService);
  protected googleTrackingService = inject(GoogleTrackingService);
  private store = inject(Store);
  private appRouterService = inject(AppRouterService);

  combinationOptionItemData: ICombinationOptionItem;
  isAlternativeOption = false;
  isCombinationOption$: Observable<boolean> = this.route.queryParams.pipe(
    map((queryParams) => queryParams['view'] === 'combination-option'),
    distinctUntilChanged()
  );
  availableAmenity$ = this.store.pipe(select(selectorHotelAvailableAmenities));
  destroyed$ = new Subject();

  salesPlanList$ = this.store.pipe(select(selectorRatePlanList));

  constructor() {}

  ngOnDestroy(): void {
    this.destroyed$.next(null);
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.combinationOptionItemData = JSON.parse(
      localStorage.getItem('iCombinationOptionItem')
    );
    this.isAlternativeOption = JSON.parse(
      localStorage.getItem('isAlternativeOption')
    );
    if (!this.combinationOptionItemData) {
      this.onBack();
    }

    this.route.queryParams
      .pipe(
        map((params) => params[RouteKeyQueryParams.lang]),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.suggestionHandlerService.loadRatePlanList();
      });
  }

  onSelectRatePlan(ratePlanCode: string, salesPlanList: RatePlan[]) {
    const availableRfcList =
      this.combinationOptionItemData?.metadata?.availableRfcList;
    const queryParams = this.route.snapshot.queryParams;
    const listChildren = this.bookingTransactionService
      .getRoomRequestList(queryParams)
      .map((x) => x.childrenAgeList)
      .reduce((acc, val) => acc.concat(...val), []);
    const childInRoom = (totalChild: number) =>
      listChildren.splice(0, totalChild).join('-');

    const numberOfRoom = availableRfcList
      .map((val) => {
        const adultStr = sum([
          val?.allocatedAdultCount,
          val?.allocatedExtraBedAdultCount
        ]);
        const childStr =
          val.allocatedChildCount > 0 || val.allocatedExtraBedChildCount > 0
            ? '-' +
              childInRoom(
                sum([val.allocatedChildCount, val.allocatedExtraBedChildCount])
              )
            : '';
        const petStr =
          val.allocatedPetCount > 0 ? '-p' + val.allocatedPetCount : '';
        return `${adultStr}${childStr}${petStr}`;
      })
      .join(',');

    const roomStayOptionsCode = availableRfcList
      .reduce(
        (acc) => acc + `~${this.combinationOptionItemData?.metadata?.label}`,
        ''
      )
      .substring(1);

    const roomPlans = availableRfcList
      .reduce((acc, val) => {
        const plan = val.rfcRatePlanList.find(
          (item) => item?.ratePlan?.code === ratePlanCode
        );
        return acc + `~${plan?.code}`;
      }, '')
      .substring(1);

    const rfcCodeList = availableRfcList
      .reduce((acc, val) => {
        return acc + `~${val?.code}`;
      }, '')
      .substring(1);

    const rfcRatePlans = availableRfcList.reduce((acc, curr) => {
      return curr.rfcRatePlanList.filter(
        (x) => x?.ratePlan?.code === ratePlanCode
      );
    }, []) as RfcRatePlan[];

    const amenities = rfcRatePlans.reduce((acc, curr) => {
      const temp = curr?.ratePlan?.includedHotelExtrasList || [];
      return [...acc, ...temp];
    }, []);

    const mandatoryServiceCodeList = [];

    const selectedSalesPlan = salesPlanList?.find(
      (item) => item?.code === ratePlanCode
    );
    if (selectedSalesPlan?.mandatoryHotelExtrasList?.length > 0) {
      mandatoryServiceCodeList.push(
        ...selectedSalesPlan?.mandatoryHotelExtrasList?.map(
          (item) => item?.code
        )
      );
    }

    const roomServices = availableRfcList
      ?.map((_item) => {
        const services = [
          ...new Set([
            ...(amenities?.map((amenity) => amenity?.code) || []),
            ...mandatoryServiceCodeList
          ])
        ];
        return services?.join(',');
      })
      ?.join('~');

    const selectedRfcRatePlan: RfcRatePlan =
      this.combinationOptionItemData?.metadata?.availableRfcRatePlanList?.find(
        (i) => i?.ratePlan?.code === ratePlanCode
      );
    const obj = {
      rfc_list: rfcCodeList,
      rate_plan_code: ratePlanCode,
      rate_plan_name: selectedRfcRatePlan?.ratePlan?.code,
      average_daily_rate: selectedRfcRatePlan?.averageDailyRate,
      total_selling_rate: selectedRfcRatePlan?.totalSellingRate,
      total_gross_amount: selectedRfcRatePlan?.totalGrossAmount,
      request_id:
        this.route.snapshot.queryParams[RouteKeyQueryParams.requestId],
      recommendation_id:
        this.combinationOptionItemData?.metadata?.['stayOptionUuid'],
      booking_flow: this.combinationOptionItemData?.metadata?.label
    };
    this.trackingService.track(MixpanelKeys.SelectRatePlan, obj);

    // navigation
    this.navigateToPickExtras({
      numberOfRoom,
      roomStayOptionsCode,
      rfcRatePlanCode: roomPlans,
      roomServices: roomServices !== 'undefined' ? roomServices : '',
      bookingFlow: this.combinationOptionItemData?.metadata?.label,
      rfcCodeList,
      ratePlanCode,
      recommendationId:
        this.combinationOptionItemData?.metadata?.['stayOptionUuid']
    });
  }

  navigateToPickExtras({
    numberOfRoom,
    roomStayOptionsCode,
    rfcRatePlanCode,
    roomServices,
    bookingFlow,
    rfcCodeList,
    ratePlanCode,
    recommendationId
  }): void {
    const room = rfcRatePlanCode?.split(/[_-]+/g)[0];
    const ratePlan = rfcRatePlanCode?.split(/[_-]+/g)[1];

    const hotelCode =
      this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode];

    this.googleTrackingService.pushEvent(
      DataLayerEvents.selectRecommendedOptions,
      {
        [DataLayerKeys.selectedRatePlan]: ratePlan || null,
        [DataLayerKeys.selectedRoom]: room || null,
        [DataLayerKeys.hotelCode]: hotelCode?.toLocaleUpperCase()
      }
    );

    const roomConfiguration =
      this.bookingTransactionService.generateRoomConfiguration(
        this.route.snapshot.queryParams
      );

    const queryParams = {
      ...this.route.snapshot.queryParams,
      [RouteKeyQueryParams.numberOfRoom]: numberOfRoom,
      [RouteKeyQueryParams.customizeStay]: roomConfiguration
        ? roomConfiguration
        : null,
      [RouteKeyQueryParams.roomStayOptionsCode]: roomStayOptionsCode,
      [RouteKeyQueryParams.roomPlans]: rfcRatePlanCode,
      [RouteKeyQueryParams.roomServices]: roomServices,
      [RouteKeyQueryParams.bookingFlow]: bookingFlow,
      [RouteKeyQueryParams.rfcCodes]: rfcCodeList,
      [RouteKeyQueryParams.ratePlanCode]: ratePlanCode,
      [RouteKeyQueryParams.recommendationId]: recommendationId
    };

    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);
    const locale = queryParams[RouteKeyQueryParams.lang];
    const translateTo =
      locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();
    const salesPlanCode = ratePlanCode;
    const roomProductCode = rfcCodeList?.split('~')[0];
    this.store.dispatch(
      loadAvailableAmenity({
        variables: {
          filter: {
            hotelCode,
            fromTime: arrival?.toString(),
            toTime: departure?.toString(),
            translateTo,
            salesPlanCode,
            roomProductCode,
            roomRequestList:
              this.bookingTransactionService.getRoomRequestList(queryParams)
          }
        }
      })
    );

    this.availableAmenity$
      .pipe(
        skipWhile((data) => !data),
        takeUntil(this.destroyed$)
      )
      .subscribe((data) => {
        this.appRouterService.updateRouteQueryParams(queryParams, {
          navigateUrl:
            data?.length === 0
              ? RouterPageKey.summaryPayment
              : RouterPageKey.pickExtras,
          done: () => {
            // Scroll to top
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth'
            });

            localStorage.removeItem('iCombinationOptionItem');
            localStorage.removeItem('isAlternativeOption');
          }
        });
      });
  }

  onBack(): void {
    const queryParams = {
      ...this.route.snapshot.queryParams,
      view: null
    };
    this.appRouterService.updateRouteQueryParams(queryParams, {
      navigateUrl: RouterPageKey.recommendation,
      done: () => {
        // Scroll to top
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });

        localStorage.removeItem('iCombinationOptionItem');
        localStorage.removeItem('isAlternativeOption');
      }
    });
  }
}
