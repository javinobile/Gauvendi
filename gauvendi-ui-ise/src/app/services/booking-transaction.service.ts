import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppRouterService } from '@app/services/app-router.service';
import { ConfiguratorService } from '@app/services/configurator.service';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import {
  HotelTag,
  PriorityModel,
  RoomRequest,
  StayOptionSuggestion
} from '@core/graphql/generated/graphql';
import { EPriceView } from '@models/option-item.model';
import { differenceInDays, getTime, parse } from 'date-fns';
import { BehaviorSubject, Subject } from 'rxjs';

/**
 * Service providers function get value from queryParams
 */
@Injectable({
  providedIn: 'root'
})
export class BookingTransactionService {
  dateSelected$ = new BehaviorSubject(null);
  travelerSelected$ = new BehaviorSubject(null);
  travelTagSelected$ = new BehaviorSubject(null);
  occasionSelected$ = new BehaviorSubject(null);
  promoCode$ = new BehaviorSubject(null);
  clearPromoCode$ = new BehaviorSubject(null);
  isLoadMoreProductSuccess$ = new BehaviorSubject(false);
  dealInfo$ = new Subject<{ minLOS: number; maxLOS: number }>();

  dealAvgLowestPrice$ = new BehaviorSubject(0);
  directLinkSelectedDate$ = new BehaviorSubject([]);
  configuratorService = inject(ConfiguratorService);
  constructor(
    private route: ActivatedRoute,
    private appRouterService: AppRouterService
  ) {}

  // todo define query params object
  getHotelCode(queryParams): string {
    return queryParams[RouteKeyQueryParams.hotelCode];
  }

  getCurrency(queryParams): string {
    return queryParams[RouteKeyQueryParams.currency];
  }

  getArrival(queryParams): number {
    const date = queryParams[RouteKeyQueryParams.checkInDate];
    return date && getTime(parse(date, 'dd-MM-yyyy', new Date()));
  }

  getDeparture(queryParams): number {
    const date = queryParams[RouteKeyQueryParams.checkOutDate];
    return date && getTime(parse(date, 'dd-MM-yyyy', new Date()));
  }

  getListRoom(queryParams): string[] {
    const data: string = queryParams[RouteKeyQueryParams.numberOfRoom];
    return data?.split(',') || [];
  }

  getTotalRoom(queryParams): number {
    return this.getListRoom(queryParams).length;
  }

  getRoomRequestList(queryParams): RoomRequest[] {
    return this.getListRoom(queryParams).map((item) => {
      const person: string[] = item.split('-');
      return {
        adult: +person.shift(),
        childrenAgeList: person
          ?.filter((item) => !item?.startsWith('p'))
          ?.map((x) => +x),
        pets: person?.find((item) => item?.startsWith('p'))
          ? +person?.find((item) => item?.startsWith('p'))?.slice(1)
          : 0
      };
    });
  }

  getRoomRequestListFromString(value: string): RoomRequest[] {
    return value?.split(',')?.map((item) => {
      const person: string[] = item.split('-');
      return {
        adult: +person.shift(),
        childrenAgeList: person
          ?.filter((item) => !item?.startsWith('p'))
          ?.map((x) => +x),
        pets: person?.find((item) => item?.startsWith('p'))
          ? +person?.find((item) => item?.startsWith('p'))?.slice(1)
          : 0
      };
    });
  }

  getPriorityCategoryCodeList(queryParams): PriorityModel[] {
    const data: string = queryParams[RouteKeyQueryParams.customizeStay];
    const chainCategories = data?.split(',');
    return chainCategories?.map((item, idx) => {
      const features = item.split('-');
      features.shift();
      return { sequence: idx, codeList: features };
    });
  }

  getCurrentRoomConfiguration(queryParams): string {
    return queryParams[RouteKeyQueryParams.customizeStay];
  }

  getSelectedFeatures(queryParams): string[] {
    const featureList =
      queryParams[RouteKeyQueryParams.customizeStay]
        ?.split(',')
        ?.flatMap((item) => {
          const fragments = item?.split('-');
          if (!fragments?.length || fragments.length < 2) {
            return [];
          }
          if (fragments?.length === 2) {
            return [fragments[1]];
          }
          return fragments?.slice(1);
        })
        ?.filter((item) => !!item) || [];
    return featureList;
  }

  getRoomsPlan(queryParams): string[] {
    return queryParams[RouteKeyQueryParams.roomPlans]?.split('~') || [];
  }

  getPriorityCurrentRoomConfiguration(queryParams): PriorityModel[] {
    const data: string = this.getCurrentRoomConfiguration(queryParams);
    const chainCategories = data?.split(',');
    return chainCategories?.map((item, idx) => {
      const features = item.split('-');
      features.shift();
      return { sequence: idx, codeList: features };
    });
  }

  generateRoomConfiguration(queryParams): string {
    const categories = queryParams[RouteKeyQueryParams.customizeStay];
    const totalRoom: string[] =
      queryParams[RouteKeyQueryParams.numberOfRoom].split(',');
    return totalRoom
      .map((_x) => categories)
      .filter((item) => !!item)
      .join('~');
  }

  generateRoomServices(queryParams): string {
    const roomConfiguration = this.generateRoomConfiguration(queryParams);
    return roomConfiguration
      .split('~')
      .map((_x) => '')
      .join('~');
  }

  generateRoomStayOptions(queryParams, stayOptionCode): string {
    const roomConfiguration = this.generateRoomConfiguration(queryParams);
    return roomConfiguration
      .split('~')
      .map((_x) => stayOptionCode || '')
      .join('~');
  }

  generateRoomPlans(queryParams, planCode): string {
    const roomConfiguration = this.generateRoomConfiguration(queryParams);
    return roomConfiguration
      .split('~')
      .map((_x) => planCode)
      .join('~');
  }

  generateRoomEmpty(queryParams): string {
    const roomConfiguration = this.generateRoomConfiguration(queryParams);
    return roomConfiguration
      .split('~')
      .map((_x) => '')
      .join('~');
  }

  convertDateToISOFormat(date): string {
    const newDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );
    return newDate.toISOString();
  }

  getAdults(params): { adult: number; children: number[] } {
    const totalRoom: string[] = params?.toString()?.split(',');

    if (totalRoom) {
      const numberOfRoom = totalRoom
        ?.map((item) => {
          const person: string[] = item?.split('-');
          return {
            adult: +person?.shift(),
            childrenAgeList: person
              ?.filter((item) => !item?.startsWith('p'))
              ?.map((x) => +x)
              ?.sort((a, b) => (a > b ? -1 : 1))
          };
        })
        ?.map((x) => ({
          ...x,
          totalCapacity: x?.adult + x?.childrenAgeList?.length
        }))
        ?.sort((a, b) => (a?.totalCapacity > b?.totalCapacity ? 1 : -1));

      if (numberOfRoom[0]?.adult >= 6) {
        return {
          adult: 6,
          children: []
        };
      } else {
        return {
          adult: numberOfRoom[0]?.adult,
          children: numberOfRoom[0]?.childrenAgeList
            ?.slice(0, 6 - numberOfRoom[0]?.adult)
            ?.reverse()
        };
      }
    }

    return {
      adult: 1,
      children: []
    };
  }

  getPromoCode(queryParams): string {
    return queryParams[RouteKeyQueryParams.promoCode] || null;
  }

  checkChildrenAgeValid(): boolean {
    const traveler: string = this.travelerSelected$?.value;
    if (traveler) {
      const tmp = traveler
        ?.split(',')
        ?.reduce((p, c) => {
          return [...p, ...c?.split('-')];
        }, [])
        ?.filter((item) => !item?.startsWith('p'))
        ?.map((x) => JSON.parse(x));

      if (tmp?.filter((x) => x === null)?.length > 0) {
        return false;
      }
    }

    return true;
  }

  updateQueryParams(done?: () => void): void {
    if (!this.checkChildrenAgeValid()) {
      done?.();
      return;
    }

    const dateSelected: { from: string; to: string } =
      this.dateSelected$?.value;
    const traveler: string = this.travelerSelected$?.value;
    const tagSelected: HotelTag[] = this.travelTagSelected$?.value;
    const occasionSelected: HotelTag = this.occasionSelected$?.value;
    const promoCode: string = this.promoCode$?.value;
    const featureParams = this.configuratorService.featureParam();
    let queryParams = { ...this.route.snapshot.queryParams };
    queryParams = {
      ...queryParams,
      [RouteKeyQueryParams.checkInDate]: dateSelected?.from || null,
      [RouteKeyQueryParams.checkOutDate]: dateSelected?.to || null,
      [RouteKeyQueryParams.numberOfRoom]: traveler || null,
      [RouteKeyQueryParams.travelTags]:
        tagSelected?.length > 0
          ? tagSelected?.map((x) => x?.code).join(',')
          : null,
      [RouteKeyQueryParams.occasions]: occasionSelected
        ? occasionSelected?.code
        : null,
      [RouteKeyQueryParams.priceFilter]: null,
      [RouteKeyQueryParams.promoCode]: promoCode,
      [RouteKeyQueryParams.customizeStay]: featureParams || null
    };

    setTimeout(() => {
      this.appRouterService.updateRouteQueryParams(queryParams, {
        done: () => done?.()
      });
    }, 100);
  }

  getNumberOfNight(value: Date[]): number {
    if (!value) {
      return null;
    }

    const [from, to] = value;

    return !from || !to
      ? null
      : Math.abs(differenceInDays(new Date(from), new Date(to)));
  }

  getCheckInOutDate(dateSelected: { from: string; to: string }): {
    checkIn: Date | null;
    checkOut: Date | null;
    dateRange: any[];
  } {
    const from = dateSelected ? dateSelected.from : null;
    const to = dateSelected ? dateSelected.to : null;
    return {
      checkIn: (from && parse(from, 'dd-MM-yyyy', new Date())) || null,
      checkOut: (to && parse(to, 'dd-MM-yyyy', new Date())) || null,
      dateRange: [
        (from && parse(from, 'dd-MM-yyyy', new Date())) || null,
        (to && parse(to, 'dd-MM-yyyy', new Date())) || null
      ]
    };
  }

  getTraveler(value: string): {
    totalRoom: number;
    adults: number;
    children: number;
    pets: number;
  } {
    const totalRoom: string[] = value?.toString()?.split(',');

    let adult = 0;
    let children = 0;
    let pets = 0;

    totalRoom?.forEach((item) => {
      const person: string[] = item.split('-');
      adult += +person.shift();
      children += person?.filter((item) => !item?.startsWith('p')).length;
      pets += person?.find((item) => item?.startsWith('p'))
        ? +person?.find((item) => item?.startsWith('p'))?.slice(1)
        : 0;
    });

    return {
      totalRoom: totalRoom?.length,
      adults: adult,
      children,
      pets
    };
  }

  getPriceRangeFromResult(
    result: StayOptionSuggestion[],
    currencyRate: number,
    ePriceView: EPriceView
  ): {
    min: number;
    max: number;
  } {
    let min = null;
    let max = null;
    if (result?.length > 0) {
      const currentPriceRange = result.reduce(
        (stayOptionAcc, stayOptionVal) => {
          // get price range exclude sales plan has restrictions
          const availableRfcRatePlanList =
            stayOptionVal?.availableRfcList?.reduce((p, c) => {
              return [
                ...p,
                ...c?.rfcRatePlanList?.filter(
                  (x) => !(x?.restrictionValidationList?.length > 0)
                )
              ];
            }, []) || [];

          // get rfc rate plan code
          const validRfcRatePlanCode = [
            ...new Set(availableRfcRatePlanList.map((x) => x?.code))
          ];

          // get summary price all availableRfcRatePlanList
          const availableRfcs = (
            stayOptionVal?.availableRfcRatePlanList || []
          )?.filter((x) => validRfcRatePlanCode?.includes(x?.code));
          const unavailableRfcs =
            stayOptionVal?.unavailableRfcRatePlanList || [];
          const prices = [];
          availableRfcs.forEach((item) =>
            prices.push(
              item[
                ePriceView === EPriceView.PerStay
                  ? 'totalSellingRate'
                  : 'averageDailyRate'
              ]
            )
          );
          unavailableRfcs.forEach((item) =>
            prices.push(
              item[
                ePriceView === EPriceView.PerStay
                  ? 'totalSellingRate'
                  : 'averageDailyRate'
              ]
            )
          );
          return stayOptionAcc.concat(...prices);
        },
        []
      );
      min = this.parseValue(Math.min(...currentPriceRange), currencyRate);
      max = this.parseValue(Math.max(...currentPriceRange), currencyRate);
    }

    return {
      min,
      max
    };
  }

  parseValue(value: number, rate: number): number {
    return !isNaN(value) ? value * rate : null;
  }

  getAmenityServices(
    queryParams,
    index: number
  ): { code: string; count: number }[] {
    const serviceChain = queryParams[RouteKeyQueryParams.roomServices];
    const serviceList: string = serviceChain?.split('~')?.[index];

    return serviceList?.length > 0
      ? serviceList?.split(',')?.map((item) => {
          return {
            code: item?.split('-')?.[0],
            count: +item?.split('-')?.[1]
          };
        })
      : [];
  }
}
