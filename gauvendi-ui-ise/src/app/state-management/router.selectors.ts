import { RouteKeyQueryParams } from '@constants/RouteKey';
import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { parse } from 'date-fns';
import * as moment from 'moment';

export const selectRouter = createFeatureSelector<RouterReducerState>('router');

export const {
  selectCurrentRoute, // select the current route
  selectQueryParams, // select the current route query params
  selectQueryParam, // factory function to select a query param
  selectRouteParams, // select the current route params
  selectRouteParam, // factory function to select a route param
  selectRouteData, // select the current route data
  selectUrl // select the current url
} = getRouterSelectors(selectRouter);

export const selectorHotelSelected = selectQueryParam(
  RouteKeyQueryParams.hotelCode
);
export const selectorCurrencyCodeSelected = selectQueryParam(
  RouteKeyQueryParams.currency
);
export const selectorCheckInDateCodeSelected = selectQueryParam(
  RouteKeyQueryParams.checkInDate
);
export const selectorCheckOutDateCodeSelected = selectQueryParam(
  RouteKeyQueryParams.checkOutDate
);
export const selectorNumberOfRoomCodeSelected = selectQueryParam(
  RouteKeyQueryParams.numberOfRoom
);
export const selectorIsCustomizeCodeSelected = selectQueryParam(
  RouteKeyQueryParams.customize
);
export const selectorCustomizeStaySelected = selectQueryParam(
  RouteKeyQueryParams.customizeStay
);
export const selectorRoomPlanSelected = selectQueryParam(
  RouteKeyQueryParams.roomPlans
);
export const selectorRoomServicesSelected = selectQueryParam(
  RouteKeyQueryParams.roomServices
);
export const selectorRoomStayOptionSelected = selectQueryParam(
  RouteKeyQueryParams.roomStayOptionsCode
);
export const selectorBookingFlowSelected = selectQueryParam(
  RouteKeyQueryParams.bookingFlow
);
export const selectorRfcCodeSelected = selectQueryParam(
  RouteKeyQueryParams.rfcCodes
);
export const selectorSalesPlanCode = selectQueryParam(
  RouteKeyQueryParams.ratePlanCode
);
export const selectorLanguage = selectQueryParam(RouteKeyQueryParams.lang);

export const selectorTotalRooms = createSelector(
  selectorNumberOfRoomCodeSelected,
  (res) => res?.split(',').length
);

export const selectorRoomsPeople = createSelector(
  selectorNumberOfRoomCodeSelected,
  (numberOfRoom) => {
    const totalRoom: string[] = numberOfRoom?.split(',');

    return totalRoom?.map((item) => {
      const people: string[] = item.split('-');
      const adults = +people.shift();
      const children =
        people.filter((item) => !item?.startsWith('p')).length || 0;
      const pets = +people.find((item) => item?.startsWith('p'))?.slice(1) || 0;
      return { adults, children, pets };
    });
  }
);

export const selectorSummaryBarBooking = createSelector(
  selectorCheckInDateCodeSelected,
  selectorCheckOutDateCodeSelected,
  selectorNumberOfRoomCodeSelected,
  (from, to, numberOfRoom) => {
    const totalRoom: string[] = numberOfRoom?.split(',');

    let adult = 0;
    let children = 0;
    let pets = 0;

    totalRoom?.forEach((item) => {
      const person: string[] = item.split('-');
      adult += +person.shift();
      children += person.filter((item) => !item?.startsWith('p')).length;
      pets += person.find((item) => item?.startsWith('p'))
        ? +person.find((item) => item?.startsWith('p'))?.slice(1)
        : 0;
    });

    const offsetCkIn =
      from && parse(from, 'dd-MM-yyyy', new Date()).getTimezoneOffset();
    const offsetCkOut =
      to && parse(to, 'dd-MM-yyyy', new Date()).getTimezoneOffset();

    return {
      checkIn:
        (from &&
          moment(from, 'DD-MM-yyyy').add(offsetCkIn, 'minutes').toDate()) ||
        null,
      checkOut:
        (to && moment(to, 'DD-MM-yyyy').add(offsetCkOut, 'minutes').toDate()) ||
        null,
      dateRange: [
        (from && parse(from, 'dd-MM-yyyy', new Date())) || null,
        (to && parse(to, 'dd-MM-yyyy', new Date())) || null
      ],
      totalRoom: `${totalRoom?.length}`,
      adult,
      children,
      pets
    };
  }
);

export const selectorCurrentPage = createSelector(selectUrl, (url) =>
  url?.split('?').shift().substr(1)
);

export const selectorCheckInDate = createSelector(
  selectorCheckInDateCodeSelected,
  (date) => (date && moment(date, 'DD-MM-yyyy').toDate()) || null
);

export const selectorCheckOutDate = createSelector(
  selectorCheckOutDateCodeSelected,
  (date) => (date && moment(date, 'DD-MM-yyyy').toDate()) || null
);

export const selectorRoomsPeopleDetails = createSelector(
  selectorNumberOfRoomCodeSelected,
  (data) => {
    const rooms: string[] = data?.split(',');
    return rooms?.map((x) => {
      const roomDetails = x.split('-');
      return {
        adult: roomDetails?.shift(),
        childrenAgeList: roomDetails
          ?.filter((item) => !item?.startsWith('p'))
          ?.map((item) => +item),
        pets: +roomDetails
          ?.find((item) => item?.startsWith('p'))
          ?.replace('p', '')
      };
    });
  }
);

export const selectorRoomsPlanDetails = createSelector(
  selectorRoomPlanSelected,
  (data) => data?.split('~')
);

export const selectorRfcCodeDetails = createSelector(
  selectorRfcCodeSelected,
  (data) => data?.split('~')
);

export const selectorRoomsConfigurationDetails = createSelector(
  selectorCustomizeStaySelected,
  (data) =>
    data
      ?.split('~')
      ?.map((x) =>
        x
          ?.split(',')
          .map((c, idx) => ({ codeList: c.split('-').slice(1), sequence: idx }))
      )
);

export const selectorRoomsStayOptionDetails = createSelector(
  selectorRoomStayOptionSelected,
  (data) => data?.split('~')
);

export const selectorRoomsServicesDetails = createSelector(
  selectorRoomServicesSelected,
  (data) => {
    return data?.split('~')?.map((services) =>
      ((services.length && services?.split(',')) || [])?.map((details) => {
        const [code, count] = details.split('-');
        return { code, count: +count };
      })
    );
  }
);

export const selectorGetQueryParams = createSelector(
  selectUrl,
  selectQueryParams,
  (url, params) => ({ url, params })
);
