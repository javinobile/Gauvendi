import { ArrayProperty } from "@src/core/decorators/array-property.decorator";
import { IsOptional, IsString, IsArray, IsUUID } from "class-validator";

export class CppGuestDetailFilterDto {
  @IsString()
  propertyCode: string;

  @ArrayProperty()
  idList: string[];
}

export class CppGuestDto {
  id: string;
  email?: string;
  refId?: string;
  relatedRefIdList?: string[];
  title?: string;
  fullName?: string;
  lastStayDayAgo?: number;
  lifeTimeStays?: number;
  lifeTimeStayNights?: number;
  lifeTimeSpent?: number;
  lifeTimeSpentCurrencyCode?: string;
  segment?: string;
  preference?: CppGuestPreferenceDto;
  contact?: CppGuestContactDto;
  particular?: CppGuestParticularDto;
  lifeTimeValue?: CppGuestLifeTimeValueDto;
}

export class CppGuestPreferenceDto {
  behavior?: CppGuestBehaviorDto;
  temporalInsights?: CppGuestTemporalInsightsDto;
  preferredFeatures?: CppGuestFeatureDto[];
  extraServices?: CppGuestExtraServiceDto[];
}

export class CppGuestBehaviorDto {
  bookingChannel?: string;
  bookingSource?: string;
  avgBookingLeadTime?: number;
  preferredLanguageCode?: string;
  purchaseBehavior?: string;
  frequentRoomType?: string;
}

export class CppGuestTemporalInsightsDto {
  firstBookingDate?: string;
  firstStayDate?: string;
  lastStayDate?: string;
  seasonalStayTrend?: string;
  stayAtEvents?: string;
  lastStayAtEventStartTime?: string;
  lastStayAtEventEndTime?: string;
}

export class CppGuestFeatureDto {
  code?: string;
  name?: string;
  quantity?: number;
}

export class CppGuestExtraServiceDto {
  code?: string;
  name?: string;
  quantity?: number;
}

export class CppGuestContactDto {
  personal?: CppGuestPersonalDto;
  company?: CppGuestCompanyDto;
}

export class CppGuestPersonalDto {
  email?: string;
  phoneNumber?: string;
  countryNumber?: string;
  countryCode?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export class CppGuestCompanyDto {
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export class CppGuestParticularDto {
  firstName?: string;
  lastName?: string;
  title?: string;
  gender?: string;
  dateOfBirth?: string;
  notes?: string;
}

export class CppGuestLifeTimeValueDto {
  totalReservations?: number;
  totalRoomNights?: number;
  totalPaidAmount?: number;
  totalFeatureUpsellAmount?: number;
  totalAccommodationGross?: number;
  totalServiceGross?: number;
  totalUpsellExcludingService?: number;
}

