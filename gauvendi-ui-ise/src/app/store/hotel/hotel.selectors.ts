import { selectorCurrencyCodeSelected } from '@app/state-management/router.selectors';
import {
  Hotel,
  HotelConfigurationConfigTypeEnum,
  HotelTaxSettingEnum,
  PropertyMainFont
} from '@core/graphql/generated/graphql';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HOTEL_FEATURE_KEY, HotelState } from '@store/hotel/hotel.state';

export const selectHotelState =
  createFeatureSelector<HotelState>(HOTEL_FEATURE_KEY);

export const selectorHotel = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data as Hotel
);

export const selectorNearestAvailableDailyRate = createSelector(
  selectHotelState,
  (res: HotelState) => res?.nearestAvailable?.data
);

export const selectorLocation = createSelector(
  selectHotelState,
  (res: HotelState) => res?.location?.data
);

export const selectorHotelUrl = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) => x.configType === HotelConfigurationConfigTypeEnum.LogoUrl
    )?.configValue?.content
);

export const selectorHotelRetailCategoryList = createSelector(
  selectHotelState,
  ({ hotelRetailCategory }: HotelState) =>
    hotelRetailCategory.data?.filter(
      (x) => x?.hotelRetailFeatureList?.length > 0
    )
);

export const selectorHotelRetailFeatureList = createSelector(
  selectHotelState,
  ({ hotelRetailFeature }: HotelState) => hotelRetailFeature.data
);

export const selectorHotelSuggestedFeatureList = createSelector(
  selectHotelState,
  ({ hotelSuggestedFeature }: HotelState) => hotelSuggestedFeature.data
);

export const selectorDefaultPax = createSelector(
  selectHotelState,
  (res: HotelState) =>
    +res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) => x.configType === HotelConfigurationConfigTypeEnum.DefaultPax
    )?.configValue?.value
);

export const selectorChildrenAllowedConfig = createSelector(
  selectHotelState,
  (hotel: HotelState) =>
    hotel?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) =>
        x.configType === HotelConfigurationConfigTypeEnum.ChildrenBookingAllowed
    )?.configValue?.value
);

export const selectorHotelChildPolicy = createSelector(
  selectHotelState,
  (hotel: HotelState) => {
    const foundHotel = hotel?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) => x.configType === HotelConfigurationConfigTypeEnum.ChildrenPolicy
    )?.configValue;
    return {
      maxChildrenCapacity: foundHotel?.maxChildrenCapacity,
      minChildrenAge: foundHotel?.minChildrenAge,
      maxChildrenAge: foundHotel?.maxChildrenAge,
      content: foundHotel?.content
    };
  }
);

export const selectorHotelRate = createSelector(
  selectHotelState,
  selectorCurrencyCodeSelected,
  (hotel, b) =>
    hotel.hotelSelected?.data?.baseCurrency?.currencyRateList.find(
      (x) => x?.exchangeCurrency?.code === b
    )?.rate || 1
);

export const selectorLowestPriceOpaque = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) =>
        x.configType ===
        HotelConfigurationConfigTypeEnum.RoomProductRecommendationGradedLabelSetting
    )?.configValue?.metadata['OPAQUE'] || false
);

export const selectorLowestPriceImageUrl = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected?.data?.lowestPriceImageUrl ||
    'assets/images/option-default.png'
);

export const selectorHotelAddress = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.address
);

export const selectorHotelCity = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.city
);

export const selectorCountry = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.country
);

export const selectorGauVendiLogo = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected.data?.hotelConfigurationList?.find(
      (x) =>
        x?.configType === HotelConfigurationConfigTypeEnum.GauvendiLogoFooter
    )?.configValue?.value
);

export const selectorHotelName = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.name
);

export const selectorHotelPrivacy = createSelector(
  selectHotelState,
  (res: HotelState) => {
    const foundConfig = res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) =>
        x.configType === HotelConfigurationConfigTypeEnum.PrivacyStatementUrl
    );
    return (
      foundConfig?.configValue?.metadata || foundConfig?.configValue?.content
    );
  }
);

export const selectorHotelTerms = createSelector(
  selectHotelState,
  (res: HotelState) => {
    const foundConfig = res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) => x.configType === HotelConfigurationConfigTypeEnum.TermsOfUseUrl
    );
    return (
      foundConfig?.configValue?.metadata || foundConfig?.configValue?.content
    );
  }
);

export const selectorHotelImpressum = createSelector(
  selectHotelState,
  (res: HotelState) => {
    const foundConfig = res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) => x.configType === HotelConfigurationConfigTypeEnum.ImpressumUrl
    );
    return (
      foundConfig?.configValue?.metadata || foundConfig?.configValue?.content
    );
  }
);

export const selectorHotelPhone = createSelector(
  selectHotelState,
  // (res: HotelState) => res?.hotelSelected?.data?.phoneNumber
  (res: HotelState) => {
    let out = '';
    const phoneCode = res?.hotelSelected?.data?.phoneCode;
    if (phoneCode?.length > 0) {
      out += `+${phoneCode?.replace('+', '')}`;
    }
    const phoneNumber = res?.hotelSelected?.data?.phoneNumber;
    if (phoneNumber?.length > 0) {
      out += ` ${phoneNumber}`;
    }
    return out;
  }
);

export const selectorHotelAddressState = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.state
);

export const selectorIsInclusive = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected?.data?.taxSetting === HotelTaxSettingEnum.Inclusive
);

export const selectorHotelPaymentAccount = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.paymentAccount
);

export const selectorHotelPaymentModeList = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.hotelPaymentModeList
);

export const selectorHotelMandatoryAddressMainGuest = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) =>
        x.configType === HotelConfigurationConfigTypeEnum.MandatoryGuestInput
    )?.configValue?.metadata?.mainGuest
);

export const selectorHotelTaxInformation = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected?.data?.hotelConfigurationList?.find(
      (x) => x?.configType === HotelConfigurationConfigTypeEnum.TaxInformation
    )?.configValue?.metadata
);

export const selectorHotelCityTax = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.isCityTaxIncludedSellingPrice
);

export const selectorHotelEmailAddressList = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.emailAddressList
);

export const selectorPropertyBranding = createSelector(
  selectHotelState,
  (res: HotelState) => res?.propertyBranding?.data
);

export const selectorHotelPostalCode = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.postalCode
);

export const selectorEventFeatureRecommendationList = createSelector(
  selectHotelState,
  (res: HotelState) => res?.eventFeatureRecommendationList?.data
);

export const selectorEventFeatureRecommendationListStatus = createSelector(
  selectHotelState,
  (res: HotelState) => res?.eventFeatureRecommendationList?.status
);

export const selectorPropertyMainFont = createSelector(
  selectHotelState,
  (res: HotelState) => res?.propertyMainFont?.data?.[0] as PropertyMainFont
);

export const selectorHotelAddressDisplay = createSelector(
  selectHotelState,
  (res: HotelState) => res?.hotelSelected?.data?.addressDisplay
);

export const selectorTravelProfile = createSelector(
  selectHotelState,
  (res: HotelState) => res?.eventFeatureRecommendationList?.data?.travelProfile
);

export const selectorWhitelabel = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected.data?.hotelConfigurationList?.find(
      (x) =>
        x?.configType === HotelConfigurationConfigTypeEnum.WhitelabelSetting
    )?.configValue?.metadata?.url
);

export const selectorFaviconImageUrl = createSelector(
  selectHotelState,
  (res: HotelState) =>
    res?.hotelSelected.data?.hotelConfigurationList?.find(
      (x) => x?.configType === HotelConfigurationConfigTypeEnum.FaviconImageUrl
    )?.configValue?.content
);
