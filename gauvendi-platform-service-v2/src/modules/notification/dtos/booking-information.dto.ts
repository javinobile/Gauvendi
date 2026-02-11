import {
  BookingSummaryCancellationPolicyDto,
  BookingSummaryPaymentTermDto,
  BookingSummaryPrimaryGuestDto
} from '../../booking/dtos/booking.dto';

/**
 * Basic booker information shown in confirmation/cancellation emails.
 */
export interface BookingInformationBookerDto {
  firstName: string | null;
  lastName: string | null;
  emailAddress: string | null;
  phoneNumber: string | null;
  countryNumber: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyCountryName: string | null;
}

/**
 * Reservation summary used in plain reservation list.
 */
export interface BookingInformationReservationSummaryDto {
  bookingDateStr: string | null; // localized date string
  paymentTerm: BookingSummaryPaymentTermDto | null;
  paymentMethod: any | null;
  cxlPolicy: BookingSummaryCancellationPolicyDto | null;

  hotelTimezone: string | null;
}

/**
 * Feature item to show in email with alternating layout.
 */
export interface MailReservationFeatureItemDto {
  isEvenIndexDirectionInEmail: boolean;
  quantity: number | null;
  name: string | null;
}

/**
 * Included service item displayed in email.
 */
export interface MailIncludedServiceItemDto {
  isEvenIndexDirectionInEmail: boolean;
  totalCount: number; // aggregated from date list counts
  hotelAmenity: {
    name: string;
  };
}

/**
 * Extra (paid) service item displayed in email.
 */
export interface MailExtraServiceItemDto {
  isEvenIndexDirectionInEmail: boolean;
  totalCount: number; // aggregated from date list counts
  hotelAmenity: {
    name: string;
    pricingUnit: string;
  };
  totalGrossAmountStr: string | undefined;
  totalBaseAmountStr: string | undefined;
  originalPriceStr: string | undefined;
}

/**
 * RFC (room feature configuration) section shown in the email.
 */
export interface MailReservationRfcDto {
  name: string | null;
  numberOfBedrooms: number | null;
  space: number | null;
  description: string | null;
  standardFeatureList: MailReservationFeatureItemDto[] | null;
  rfcImageList: any[] | null;
}

/**
 * Main mail reservation object grouped per reservation.
 */
export interface MailReservationDto {
  idx: number;
  reservation: {
    rfc: MailReservationRfcDto;
    spaceTypeMeasurementUnit: string | null;
    rfcRatePlan: {
      ratePlan: {
        name: string | null;
        description: string | null;
      };
    };
    includedServiceList: MailIncludedServiceItemDto[];
    extraServiceList: MailExtraServiceItemDto[];
    spaceTypeName: string | null;
    adult: number | null;
    children: number | null;
    childrenAgeList: number[] | null;
    pets: number | null;
    matchedFeatureList: MailReservationFeatureItemDto[] | null;
    guestNote: string | null;
    additionalGuest: any[];
    totalAccommodations: number;
  };
}

/**
 * Core booking information assembled by NotificationService.getBookingInformation.
 *
 * This shape mirrors the transformed data used for email generation, including:
 * - localized date strings (`arrivalStr`, `departureStr`, `bookingDateStr`)
 * - aggregated counts and amounts
 * - mail-friendly nested structures for RFC, features, and services
 */
export interface BookingInformationForEmailDto {
  // Basic booking identifiers and timeline
  id: string | null;
  bookingNumber: string | null;
  arrivalStr: string | null;
  departureStr: string | null;
  hotelId: string | null;
  bookingFlow: string | null;

  // Aggregations
  totalChildren: number;
  totalAdult: number;
  totalPets: number;
  childrenAgeList: number[] | null;

  // Amount strings (pre-formatted for email)
  totalGrossAmountStr: string | undefined;
  totalBaseAmountStr: string | undefined;
  taxAmount: number | null;
  bookingTaxList: any[] | null;
  cityTaxAmount: number | null;
  cityTaxList: any[] | null;
  cityTaxAmountStr: string | null;
  amountStr: string | null;
  paidAmountStr: string | undefined;
  totalAmountDueStr: string | undefined;

  // Reservation/scoping info
  spaceTypeCount: number;
  totalAccommodations: string | undefined;
  totalServices: string | undefined;

  // Booker and policy
  booker: BookingInformationBookerDto;
  primaryGuest: BookingSummaryPrimaryGuestDto | null;
  paymentTerm: BookingSummaryPaymentTermDto | null;
  cxlPolicy: BookingSummaryCancellationPolicyDto | null;

  // Reservations
  reservationList: BookingInformationReservationSummaryDto[];
  mailReservationList: MailReservationDto[];
  /** Expiry date string */
  expiryDateStr?: string;
  specialRequest: string | null;
}

/**
 * Error type for getBookingInformation failures.
 *
 * - `NotFound`: booking or reservation could not be found.
 * - `Validation`: invalid input (e.g., missing `bookingId`).
 * - `Internal`: unexpected server/database error.
 */
export type GetBookingInformationError =
  | { type: 'NotFound'; message: string }
  | { type: 'Validation'; message: string; details?: Record<string, unknown> }
  | { type: 'Internal'; message: string };
