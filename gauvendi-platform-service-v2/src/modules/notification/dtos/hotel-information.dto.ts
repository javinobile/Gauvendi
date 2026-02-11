/**
 * Country information structure
 */
export interface HotelCountryDto {
  /** Country ID */
  id: string;
  /** Country name */
  name: string;
  /** Country code (e.g., 'US', 'DE') */
  code: string;
}

/**
 * Base currency information structure
 */
export interface HotelBaseCurrencyDto {
  /** Currency ID */
  id: string;
  /** Currency name */
  name: string;
  /** Currency code (e.g., 'USD', 'EUR') */
  code: string;
  /** Currency symbol (e.g., '$', '€') */
  symbol: string;
}

/**
 * Social media information structure
 */
export interface HotelSocialMediaDto {
  /** Facebook URL */
  facebook?: string;
  /** Instagram URL */
  instagram?: string;
  /** Twitter URL */
  twitter?: string;
  /** LinkedIn URL */
  linkedin?: string;
  /** YouTube URL */
  youtube?: string;
}

/**
 * Branding and marketing information structure
 */
export interface HotelBrandingMarketingDto {
  /** Hotel cover image URL */
  hotelImageCoverUrl: string | null;
  /** Hotel preview image URL */
  hotelImagePreviewUrl: string | null;
  /** Google Maps URL */
  googleMapUrl: string | null;
  /** Social media links */
  socialMedia: HotelSocialMediaDto | null;
}

/**
 * Main response structure for getHotelInformation function
 */
export interface HotelInformationDto {
  /** Hotel unique identifier */
  id: string;
  /** Hotel name */
  name: string;
  /** Hotel code */
  code: string;
  /** Sender name for emails */
  senderName: string;
  /** Sender email address */
  senderEmail: string;
  /** Check-in time (e.g., '15:00') */
  checkInTime?: string;
  /** Check-out time (e.g., '11:00') */
  checkOutTime?: string;
  /** List of hotel email addresses */
  emailAddressList: string[];
  /** Whether to include hotel email in booking confirmation */
  isIncludeHotelEmailInBookingConfirmation: boolean;
  /** Email image URL */
  emailImageUrl?: string;
  /** Icon image URL */
  iconImageUrl?: string;
  /** Hotel address */
  address: string;
  /** Hotel city */
  city: string;
  /** Hotel state/province */
  state: string;
  /** Hotel postal code */
  postalCode: string;
  /** Hotel phone number (formatted with country code) */
  phone?: string;
  /** Hotel timezone */
  timeZone: string;
  /** Country information */
  country: HotelCountryDto;
  /** Base currency information */
  baseCurrency: HotelBaseCurrencyDto;
  /** Hotel website URL */
  hotelWebsiteUrl?: string;
  /** Terms and conditions URL */
  hotelTermAndConditionUrl?: string;
  /** Privacy policy URL */
  hotelPrivacyPolicyUrl?: string;
  /** Impressum URL */
  hotelImpressumUrl?: string;
  /** Property cover image URL */
  propertyImageCoverUrl: string | null;
  /** Property preview image URL */
  propertyImagePreviewUrl: string | null;
  /** Measurement metric system */
  measureMetric: string;
  /** Tax information */
  taxInformation?: any;
  /** Tax settings */
  taxSetting?: any;
  /** Branding and marketing information */
  brandingMarketing: HotelBrandingMarketingDto;
  /** Terms of use URL */
  termsOfUseUrl?: string;
  /** Privacy statement URL */
  privacyStatementUrl?: string;
  /** Impressum URL */
  impressumUrl?: string;
  /** IBE home URL */
  ibeHomeUrl?: string;
}
