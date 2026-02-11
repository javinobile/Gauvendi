import { ReservationPricingDto } from "./reservation-pricing.dto";

export class HotelCityTaxDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  rate: number;
}

export class HotelTaxDto {
  id?: string;
  hotelId?: string;
  name?: string;
  code?: string;
  rate?: number;
  amount?: number;
}

export interface BookingPricingDto {
  hotelId: string; // UUID → string
  reservationPricingList: ReservationPricingDto[];
  totalGrossAmount: number;
  totalBaseAmount: number;
  averageDailyRate: number;
  taxAmount: number;
  currencyCode: string;
  payOnConfirmationAmount: number;
  payAtHotelAmount: number;
  totalSellingRate: number;
  totalSellingRateBySetting: number;
  cityTaxAmount: number;
  adrSubTotal: number;
  adrSubTotalBySetting: number;
  bookingAccommodationTaxAmount: number;
  bookingAccommodationTaxList: HotelTaxDto[];
  bookingExtraServiceTaxAmount: number;
  bookingExtraServiceTaxList: HotelTaxDto[];
  bookingTaxList: HotelTaxDto[];
  bookingCityTaxList: HotelCityTaxDto[];
  translateTo?: string;
}
