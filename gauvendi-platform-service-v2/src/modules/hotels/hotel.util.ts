import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelConfigurationTypeEnum, LanguageCodeEnum } from '@src/core/enums/common';

export function transformHotelToResponse(hotel: Hotel, s3CdnUrl: string | undefined, translateTo?: string) {
  const {
    hotelConfigurations,
    emailAddress,
    emailImageId,
    iconImageId,
    countryId,
    baseCurrencyId,
    brandId,
    backgroundCategoryImageId,
    ...restHotel
  } = hotel;

  // Find specific configurations
  const brandingMarketing = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.BRANDING_MARKETING
  );
  const termsConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.TERMS_OF_USE_URL
  );
  const privacyConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL
  );
  const impressumConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.IMPRESSUM_URL
  );
  const logoConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.LOGO_URL
  );
  const faviconConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.FAVICON_IMAGE_URL
  );
  const childrenPolicyConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.CHILDREN_POLICY
  );
  const defaultPaxConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.DEFAULT_PAX
  );
  const logoUrlConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.LOGO_URL
  );
  const timeSliceConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION
  );
  const brandingMarketingConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.BRANDING_MARKETING
  );
  const ibeHomeUrlConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.WHITELABEL_SETTING
  );
  const taxInformationConfig = hotelConfigurations?.find(
    (config) => config.configType === HotelConfigurationTypeEnum.TAX_INFORMATION
  );

  let taxInformation: any = null;

  if(taxInformationConfig) {
    const configValue = taxInformationConfig.configValue;
    if(configValue.metadata) {
      taxInformation = configValue?.metadata?.[translateTo || LanguageCodeEnum.EN];
    }
  }

  // Compute derived fields
  const phone =
    hotel.phoneCode && hotel.phoneNumber ? `+${hotel.phoneCode} ${hotel.phoneNumber}` : null;

  const hotelWebsiteUrl = {
    defaultUrl: logoUrlConfig?.configValue?.content
  };

  // Extract configuration values
  const childAgeTo = childrenPolicyConfig?.configValue?.maxChildrenAge;
  const childAgeFrom = childrenPolicyConfig?.configValue?.minChildrenAge;
  const defaultPax = parseInt(defaultPaxConfig?.configValue?.value);

  return {
    ...hotel,
    id: hotel.id,
    name: hotel.name,
    code: hotel.code,
    preferredLanguage: hotel.preferredLanguageCode,
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    taxInformation: taxInformation,
    roomNumber: hotel.roomNumber,
    status: hotel.status,
    phoneCode: hotel.phoneCode,
    phoneNumber: hotel.phoneNumber,
    postalCode: hotel.postalCode,
    measureMetric: hotel.measureMetric,
    phone,
    addressDisplay: hotel.addressDisplay,
    emailAddressList: hotel.emailAddress,
    senderName: hotel.senderName,
    senderEmail: hotel.senderEmail,
    propertyImageCoverUrl: brandingMarketing?.configValue?.metadata?.hotelImageCoverUrl,
    propertyImagePreviewUrl: brandingMarketing?.configValue?.metadata?.hotelImagePreviewUrl,
    hotelTermAndConditionUrl: termsConfig?.configValue?.metadata,
    hotelPrivacyPolicyUrl: privacyConfig?.configValue?.metadata,
    hotelImpressumUrl: impressumConfig?.configValue?.metadata,
    hotelTimeSliceConfiguration: timeSliceConfig?.configValue?.metadata,
    brandingMarketing: brandingMarketingConfig?.configValue?.metadata,
    hotelWebsiteUrl,
    timeZone: hotel.timeZone,
    childAgeTo,
    childAgeFrom,
    defaultPax,
    country: hotel.country,
    baseCurrency: hotel.baseCurrency,
    iconImageUrl: s3CdnUrl + '/' + hotel.iconImage?.url,
    emailImageUrl: s3CdnUrl + '/' + hotel.emailImage?.url,
    hotelFaviconUrl: {
      defaultUrl: faviconConfig?.configValue?.content
    },
    hotelTaxSettings: hotel.hotelTaxSettings,
    ibeHomeUrl: ibeHomeUrlConfig?.configValue?.metadata?.url
  };
}
