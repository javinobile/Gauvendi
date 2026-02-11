import { PaymentProviderCodeEnum } from '../../../core/enums/payment';

export interface BookingV2Input {
  paymentInformation: any;
  browserAgentIp: string;
}

export interface BookingDto {
  id: string;
  bookingNumber: string;
  hotelId: string;
  booker: BookerDto;
  reservationList: ReservationDto[];
}

export interface BookerDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ReservationDto {
  currencyCode: string;
  payOnConfirmationAmount: number;
}

export interface HotelDto {
  id: string;
  name: string;
}

export interface HotelConfigurationFilter {
  hotelId: string;
  configType: string;
}

export interface HotelConfigurationDto {
  configValue: {
    metadata: {
      url?: string;
      [key: string]: any;
    };
  };
}

export interface GlobalPaymentProviderFilter {
  codeList: PaymentProviderCodeEnum[];
}

export interface GlobalPaymentProviderDto {
  id: string;
}

export interface PropertyPaymentMethodSettingFilter {
  propertyIdList: string[];
  globalPaymentProviderIdList: string[];
  statusList: string[];
}

export interface PropertyPaymentMethodSettingDto {
  metadata: {
    metadata: {
      apiKey?: string;
      merchantAccount?: string;
      urlPrefix?: string;
      [key: string]: any;
    };
  };
}

export interface BookingTransactionInput {
  id?: string;
  bookingId?: string;
  currencyCode?: string;
  status?: string;
  totalAmount?: number;
  expiryMonth?: string;
  expiryYear?: string;
  accountHolder?: string;
  accountNumber?: string;
  paymentData?: any;
  cardType?: string;
  referenceNumber?: string;
  authenticationActionData?: string;
  paymentDate?: Date;
}

export interface BookingTransactionDto {
  id: string;
}

export interface ProcessAdyenPaymentDto {
  expiryDate?: string;
  accountHolder?: string;
  maskedCardNumber?: string;
  paymentData?: any;
  paymentMethod?: string;
  pspReference?: string;
  amount?: number;
  actionMethod?: string;
  actionType?: string;
  actionUrl?: string;
  md?: string;
  paReq?: string;
  termUrl?: string;
  status?: string;
  refusalReason?: string;
}

export interface BookingPaymentActionData {
  MD?: string;
  paReq?: string;
  termUrl?: string;
}

export interface BookingPaymentAction {
  paymentData?: any;
  method?: string;
  type?: string;
  url?: string;
  data?: BookingPaymentActionData;
  paymentProviderCode?: PaymentProviderCodeEnum;
}

export interface BookingPaymentResponse {
  action?: BookingPaymentAction;
}

export interface PaymentInterfaceResponse<T> {
  data: T;
}
