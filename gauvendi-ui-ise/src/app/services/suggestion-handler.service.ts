import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRouterService } from '@app/services/app-router.service';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  BookingFlow,
  HotelRetailCategoryExpandEnum,
  HotelRetailFeatureExpandEnum,
  LanguageCode,
  RoomRequest,
  WidgetEventFeatureRecommendationListFilter
} from '@core/graphql/generated/graphql';
import { ELoadingStatus } from '@models/loading-status.model';
import { Store } from '@ngrx/store';
import { loadHotelTagList } from '@store/hotel-tag/hotel-tag.actions';
import {
  loadHotelRetailCategoryList,
  loadHotelRetailFeatureList,
  loadHotelSuggestedFeatureList,
  loadWidgetEventFeatureRecommendationList
} from '@store/hotel/hotel.actions';
import { MultiLangEnum } from '@store/multi-lang/multi-lang.state';
import {
  loadCombinedAccommodationList,
  loadDirectStayOption,
  loadRatePlanList,
  loadStayOptionRecommendationListV2,
  resetDirectStayOption
} from '@store/suggestion/suggestion.actions';
import { parse, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { CartService } from './cart.service';

@Injectable({
  providedIn: 'root'
})
export class SuggestionHandlerService {
  private appRouterService = inject(AppRouterService);
  private bookingTransactionService = inject(BookingTransactionService);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private readonly cartService = inject(CartService);

  constructor() {}

  loadCombinedAccommodationList(): void {
    const cart = this.cartService.getCart();
    if (!cart?.length) {
      return;
    }

    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = this.bookingTransactionService.getHotelCode(queryParams);
    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);
    const promoCode = this.bookingTransactionService.getPromoCode(queryParams);
    const locale = queryParams[RouteKeyQueryParams.lang];
    const translateTo =
      locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();
    const priorityCategoryCodeList =
      this.bookingTransactionService.getPriorityCategoryCodeList(queryParams);
    const bookingFlow =
      priorityCategoryCodeList?.length > 0
        ? BookingFlow.Match
        : BookingFlow.Direct;
    const roomRequestList: RoomRequest[] = cart?.map((item) => ({
      adult: item?.adults,
      childrenAgeList: item?.children,
      pets: item?.pets
    }));

    const arrivalDateTime =
      this.bookingTransactionService.convertDateToISOFormat(new Date(arrival));
    const departureDateTime =
      this.bookingTransactionService.convertDateToISOFormat(
        new Date(departure)
      );

    const spaceTypeRequestList =
      queryParams[RouteKeyQueryParams.spaceTypes]
        ?.split(',')
        ?.filter((item) => item?.length > 0) ?? null;

    this.store.dispatch(
      loadCombinedAccommodationList({
        variables: {
          filter: {
            hotelCode,
            arrival: arrivalDateTime,
            departure: departureDateTime,
            promoCodeList: promoCode ? [promoCode] : null,
            translateTo,
            priorityCategoryCodeList,
            bookingFlow,
            roomRequestList,
            isCombination: true,
            spaceTypeRequestList
          }
        }
      })
    );
  }

  loadAvailableStayOptions(status?: ELoadingStatus): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = this.bookingTransactionService.getHotelCode(queryParams);
    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);
    const promoCode = this.bookingTransactionService.getPromoCode(queryParams);
    const roomRequestList =
      this.bookingTransactionService.getRoomRequestList(queryParams);

    const locale = queryParams[RouteKeyQueryParams.lang];
    const translateTo =
      locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();
    const priorityCategoryCodeList =
      this.bookingTransactionService.getPriorityCategoryCodeList(queryParams);

    // const tabIndex = index ?? this.cartService.getActiveTab(queryParams);
    // const cartItem = this.cartService.getCartByIdx(tabIndex);
    // if (!cartItem) {
    //   return;
    // }
    // const { adults, children, pets } = cartItem;

    // prevent user deletes custom query params
    setTimeout(() => {
      const updateQueryParams = {
        ...this.route.snapshot.queryParams,
        [RouteKeyQueryParams.customize]:
          (priorityCategoryCodeList?.length > 0 && 1) || null
      };
      this.appRouterService.updateRouteQueryParams(updateQueryParams);
    }, 100);

    if (this.bookingTransactionService.checkChildrenAgeValid()) {
      // const roomRequestList = [{ adult, childrenAgeList, pets } as RoomRequest];
      if (arrival && departure) {
        const arrivalDateTime =
          this.bookingTransactionService.convertDateToISOFormat(
            new Date(arrival)
          );
        const departureDateTime =
          this.bookingTransactionService.convertDateToISOFormat(
            new Date(departure)
          );

        const travelTags =
          this.route.snapshot.queryParams[RouteKeyQueryParams.travelTags];
        const occasions =
          this.route.snapshot.queryParams[RouteKeyQueryParams.occasions];
        const directRoomCode =
          this.route.snapshot.queryParams[RouteKeyQueryParams.specificRoom];

        const spaceTypeRequestList =
          queryParams[RouteKeyQueryParams.spaceTypes]
            ?.split(',')
            ?.filter((item) => item?.length > 0) ?? null;

        const isMatchFlow = priorityCategoryCodeList?.length > 0;
        if (isMatchFlow) {
          this.store.dispatch(
            loadStayOptionRecommendationListV2({
              variables: {
                filter: {
                  hotelCode,
                  translateTo,
                  arrival: arrivalDateTime,
                  departure: departureDateTime,
                  roomRequestList,
                  priorityCategoryCodeList,
                  travelTagCodeList: travelTags ? travelTags.split(',') : [],
                  occasionCodeList: occasions ? [occasions] : [],
                  promoCodeList: promoCode ? [promoCode] : null,
                  bookingFlow:
                    priorityCategoryCodeList?.length > 0
                      ? BookingFlow.Match
                      : BookingFlow.Direct,
                  spaceTypeRequestList,
                  splitToDoubleRooms: false
                }
              },
              isMatchFlow: true,
              status: status || ELoadingStatus.loading
            })
          );
        } else {
          this.store.dispatch(
            loadStayOptionRecommendationListV2({
              variables: {
                filter: {
                  hotelCode,
                  translateTo,
                  arrival: arrivalDateTime,
                  departure: departureDateTime,
                  roomRequestList,
                  priorityCategoryCodeList,
                  travelTagCodeList: travelTags ? travelTags.split(',') : [],
                  occasionCodeList: occasions ? [occasions] : [],
                  promoCodeList: promoCode ? [promoCode] : null,
                  bookingFlow:
                    priorityCategoryCodeList?.length > 0
                      ? BookingFlow.Match
                      : BookingFlow.Direct,
                  spaceTypeRequestList,
                  splitToDoubleRooms: false
                }
              },
              isMatchFlow: false,
              status: status || ELoadingStatus.loading
            })
          );
        }

        if (directRoomCode && !(priorityCategoryCodeList?.length > 0)) {
          this.store.dispatch(
            loadDirectStayOption({
              variables: {
                filter: {
                  hotelCode,
                  translateTo,
                  arrival: arrivalDateTime,
                  departure: departureDateTime,
                  roomRequest: {
                    adult: roomRequestList?.[0]?.adult,
                    childrenAgeList: roomRequestList?.[0]?.childrenAgeList,
                    pets: roomRequestList?.[0].pets
                  },
                  promoCodeList: promoCode ? [promoCode] : null,
                  dedicatedProductCode: directRoomCode
                }
              }
            })
          );
        } else {
          this.store.dispatch(resetDirectStayOption());
        }

        this.store.dispatch(
          loadRatePlanList({
            variables: {
              filter: {
                hotelCode,
                arrival: arrivalDateTime,
                departure: departureDateTime,
                translateTo
              }
            }
          })
        );

        this.cartService.storeSearchSnapshot(this.route.snapshot.queryParams);

        setTimeout(() => {
          // add request_id into query param for tracking
          this.appRouterService.updateRouteQueryParams({
            ...this.route.snapshot.queryParams,
            [RouteKeyQueryParams.requestId]: uuidv4()
          });
        }, 150);
        this.bookingTransactionService.isLoadMoreProductSuccess$.next(false);
      }
    }
  }

  loadRatePlanList(rfcCode?: string): void {
    const queryParams = this.route.snapshot.queryParams;
    const hotelCode = this.bookingTransactionService.getHotelCode(queryParams);
    const arrival = this.bookingTransactionService.getArrival(queryParams);
    const departure = this.bookingTransactionService.getDeparture(queryParams);
    const salesPlanCode = queryParams[RouteKeyQueryParams.ratePlanCode];

    const locale = this.route.snapshot.queryParams[RouteKeyQueryParams.lang];

    if (arrival && departure) {
      const arrivalDateTime =
        this.bookingTransactionService.convertDateToISOFormat(
          new Date(arrival)
        );
      const departureDateTime =
        this.bookingTransactionService.convertDateToISOFormat(
          new Date(departure)
        );

      const translateTo =
        locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();

      this.store.dispatch(
        loadRatePlanList({
          variables: {
            filter: {
              hotelCode,
              arrival: arrivalDateTime,
              departure: departureDateTime,
              translateTo,
              rfcCode,
              code: salesPlanCode
            }
          }
        })
      );
    }
  }

  initConfigurator(locale: LanguageCode) {
    this.loadHotelRetailFeatureList(locale);
    this.loadHotelRetailCategoryList(locale);
  }

  loadWidgetEventFeatureRecommendationList(
    filter?: WidgetEventFeatureRecommendationListFilter
  ) {
    if (filter) {
      this.store.dispatch(
        loadWidgetEventFeatureRecommendationList({
          variables: {
            filter
          }
        })
      );
      return;
    }

    const queryParams = this.route.snapshot.queryParams;
    const locale = queryParams[RouteKeyQueryParams.lang];
    const translateTo =
      locale === MultiLangEnum.EN ? null : locale?.toLocaleUpperCase();
    const checkInDate = queryParams[RouteKeyQueryParams.checkInDate];
    const checkOutDate = queryParams[RouteKeyQueryParams.checkOutDate];
    const propertyCode =
      this.bookingTransactionService.getHotelCode(queryParams);
    const promoCode = this.bookingTransactionService.getPromoCode(queryParams);
    const roomRequestList =
      this.bookingTransactionService.getRoomRequestList(queryParams);

    if (!checkInDate || !checkOutDate) {
      return;
    }

    const fromDate = this.bookingTransactionService
      .convertDateToISOFormat(parse(checkInDate, 'dd-MM-yyyy', new Date()))
      .split('T')[0]; // Only keep the date part before T

    const toDate = this.bookingTransactionService
      .convertDateToISOFormat(
        subDays(parse(checkOutDate, 'dd-MM-yyyy', new Date()), 1)
      )
      .split('T')[0]; // Only keep the date part before T

    this.store.dispatch(
      loadWidgetEventFeatureRecommendationList({
        variables: {
          filter: {
            fromDate,
            toDate,
            promoCode,
            propertyCode,
            roomRequestList,
            translateTo
          }
        }
      })
    );
  }

  loadHotelRetailCategoryList(translateTo: LanguageCode) {
    this.store.dispatch(
      loadHotelRetailCategoryList({
        variables: {
          filter: {
            hotelCode:
              this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
            expand: [
              HotelRetailCategoryExpandEnum.RetailFeature,
              HotelRetailCategoryExpandEnum.IconImage
            ],
            sort: ['displaySequence:asc'],
            translateTo
          }
        }
      })
    );
  }

  loadHotelRetailFeatureList(translateTo: LanguageCode) {
    this.store.dispatch(
      loadHotelRetailFeatureList({
        variables: {
          filter: {
            hotelCode:
              this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
            expand: [HotelRetailFeatureExpandEnum.MainFeatureImage],
            sort: ['displaySequence:asc'],
            translateTo
          }
        }
      })
    );
  }

  loadHotelSuggestedFeatureList(translateTo: LanguageCode) {
    this.store.dispatch(
      loadHotelSuggestedFeatureList({
        variables: {
          filter: {
            propertyCode:
              this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
            translateTo
          }
        }
      })
    );
  }

  loadHotelTagList(translateTo: LanguageCode): void {
    this.store.dispatch(
      loadHotelTagList({
        variables: {
          filter: {
            hotelCode:
              this.route.snapshot.queryParams[RouteKeyQueryParams.hotelCode],
            translateTo
          }
        }
      })
    );
  }
}
