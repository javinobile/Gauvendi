import {
  selectorBookingFlowSelected,
  selectorCheckInDate,
  selectorCheckOutDate,
  selectorCustomizeStaySelected,
  selectorHotelSelected,
  selectorRfcCodeDetails,
  selectorRfcCodeSelected,
  selectorRoomsConfigurationDetails,
  selectorRoomServicesSelected,
  selectorRoomsPeople,
  selectorRoomsPeopleDetails,
  selectorRoomsPlanDetails,
  selectorRoomsServicesDetails,
  selectorRoomsStayOptionDetails
} from '@app/state-management/router.selectors';
import {
  BookingFlow,
  BookingInformationInput,
  HotelAmenity,
  ReservationInput
} from '@core/graphql/generated/graphql';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { selectorHotelRetailCategoryList } from '@store/hotel/hotel.selectors';
import {
  PICK_EXTRAS_FEATURE_KEY,
  PickExtrasState
} from '@store/pick-extras/pick-extras.state';
import * as moment from 'moment';

export const selectPickExtrasState = createFeatureSelector<PickExtrasState>(
  PICK_EXTRAS_FEATURE_KEY
);

export const selectorCalculatePaymentReservation = createSelector(
  selectPickExtrasState,
  ({ calculatePaymentReservation }: PickExtrasState) =>
    calculatePaymentReservation.data
);

export const selectorRooms = createSelector(
  selectorCustomizeStaySelected,
  selectorHotelRetailCategoryList,
  selectorRfcCodeSelected,
  selectorRoomsPeople,
  (roomsSelected, retailCategories, rfcCodeSelected, roomsPeople) => {
    const result =
      roomsSelected?.split(',')?.map((y) => {
        const retailCategory = retailCategories?.find(
          (a) => a.code === y.slice(0, 2)
        );
        return {
          category: {
            code: retailCategory?.code,
            name: retailCategory?.name
          },
          features: y
            ?.split('-')
            ?.slice(1)
            .map((b) => {
              const features = retailCategory?.hotelRetailFeatureList.find(
                (i) => i.code === b
              );
              return { name: features?.name, code: features?.code };
            })
        };
      }) || null;

    return roomsPeople?.map((value, idx) => {
      return {
        people: value,
        roomFeatures: result?.[idx] || null,
        rfcCode: rfcCodeSelected?.split('~')?.[idx]
      };
    });
  }
);

export const selectorHotelAmenityIncluded = createSelector(
  selectPickExtrasState,
  ({ hotelAmenityIncluded }: PickExtrasState) => hotelAmenityIncluded?.data
);

export const amenityServicesOfRoom = (idx) =>
  createSelector(selectorRoomServicesSelected, (res) => {
    return res?.split('~')?.[idx];
  });

export const selectorSearchMatchingRfc = createSelector(
  selectPickExtrasState,
  ({ searchMatchingRfc }: PickExtrasState) => searchMatchingRfc?.data
);

export const selectorSearchMatchingRfcStatus = createSelector(
  selectPickExtrasState,
  ({ searchMatchingRfc }: PickExtrasState) => searchMatchingRfc?.status
);

export const selectorDateRange = createSelector(
  selectorCheckInDate,
  selectorCheckOutDate,
  (checkIn, checkOut) => ({ checkIn, checkOut })
);

export const summaryBookingAllRoom = createSelector(
  selectorBookingFlowSelected,
  selectorHotelSelected,
  selectorDateRange,
  selectorRoomsPeopleDetails,
  selectorRoomsPlanDetails,
  selectorRoomsConfigurationDetails,
  selectorRoomsStayOptionDetails,
  selectorRoomsServicesDetails,
  (
    bookingFlow,
    hotelCode,
    dateRange,
    numberOfRoom,
    roomsPlan,
    roomsConfiguration,
    roomsStayOption,
    roomsServices
  ) => {
    const reservationInputs: ReservationInput[] = numberOfRoom?.map(
      (item, idx) => ({
        adult: +item?.adult || 0,
        childrenAgeList: item?.childrenAgeList,
        pets: +item?.pets || 0,
        amenityList: roomsServices && roomsServices[idx],
        priorityCategoryCodeList: roomsConfiguration?.[0] || [],
        rfcRatePlanCode: roomsPlan && roomsPlan[idx],
        stayOptionCode: roomsStayOption && roomsStayOption[idx]
      })
    );

    const bookingInput: BookingInformationInput = {
      hotelCode,
      arrival: dateRange?.checkIn?.getTime(),
      departure: dateRange?.checkOut?.getTime(),
      arrivalDate: moment(dateRange?.checkIn)
        ?.startOf('dates')
        .format('yyyy-MM-DD'),
      departureDate: moment(dateRange?.checkOut)
        ?.startOf('dates')
        .format('yyyy-MM-DD'),
      bookingFlow: bookingFlow as BookingFlow,
      reservationList: reservationInputs
    };

    return bookingInput;
  }
);

export const summaryBookingAllRoomEnhanced = createSelector(
  summaryBookingAllRoom,
  selectorRfcCodeDetails,
  (bookingInfo, rfcCodeList) => {
    return {
      ...bookingInfo,
      reservationList: bookingInfo?.reservationList?.map((res, idx) => ({
        ...res,
        rfcCode: rfcCodeList[idx]
      }))
    };
  }
);

export const selectorAvailableAmenitiesByDistributionChannel = createSelector(
  selectPickExtrasState,
  ({ availableAmenityByDistributionChannel }) =>
    availableAmenityByDistributionChannel?.data as HotelAmenity[]
);

export const selectorCalculateBookingPricing = createSelector(
  selectPickExtrasState,
  ({ bookingPricing }: PickExtrasState) => bookingPricing.data
);

export const selectorSurchargeAmenityList = createSelector(
  selectPickExtrasState,
  ({ surchargeAmenityList }: PickExtrasState) => surchargeAmenityList.data
);
