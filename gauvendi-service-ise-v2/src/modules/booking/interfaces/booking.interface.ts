export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  countryId: string;
  city: string;
  state: string;
  postalCode: string;
  phoneCode: string;
  phoneNumber: string;
  address: string;
  isBooker: boolean;
  companyEmail?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  companyName?: string;
  companyPostalCode?: string;
  companyTaxId?: string;
}

export interface CustomerPaymentGateway {
  id: string;
  guestId: string;
  pmsGuestId: string;
  paymentMethodReference: string;
}

export interface BookingV2 {
  id: string;
  hotelCode: string;
  bookingFlow: string;
  source: string;
  specialRequest?: string;
  bookingLanguage: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingTransaction {
  id: string;
  bookingId: string;
  paymentMethodId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

export interface ReservationV2 {
  id: string;
  bookingId: string;
  hotelCode: string;
  arrival: Date;
  departure: Date;
  adult: number;
  children: number;
  pets: number;
  status: string;
  tripPurpose: string;
}

export interface ReservationRoom {
  id: string;
  reservationId: string;
  roomCode: string;
  roomTypeCode: string;
  ratePlanCode: string;
  stayOptionCode: string;
}

export interface ReservationTimeSlice {
  id: string;
  reservationId: string;
  date: Date;
  roomAmount: number;
  roomCode: string;
}

export interface ReservationAmenity {
  id: string;
  reservationId: string;
  amenityCode: string;
  quantity: number;
}

export interface ReservationAmenityDate {
  id: string;
  reservationAmenityId: string;
  date: Date;
  amount: number;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  taxId: string;
}

export interface BookingUpsellInformation {
  id: string;
  bookingId: string;
  lowestPriceAmount: number;
  bookingAmount: number;
  currency: string;
}
