import { PriorityCategoryCodeDto } from '@src/modules/ise-recommendation/ise-recommendation.dto';
import {
  BookingInformationDto,
  CreditCardInformationDto,
  LowestPriceOptionDto
} from './booking-information.dto';
import { ExtranetBookingProposalSettingInput } from './cpp-request-booking.dto';
import { BookingForm } from './booking.dto';

export enum CppBookingConfirmationType {
  PROPOSE = 'PROPOSE',
  RESERVE = 'RESERVE',
  CONFIRM = 'CONFIRM'
}

export interface RequestBookingDto {
  bookingInformation: BookingInformationDto;
  paymentProviderCode: string | null;
  creditCardInformation?: CreditCardInformationDto;
  translateTo: string | null;
  promoCodeList: string[] | null;
  lowestPriceOptionList: LowestPriceOptionDto[];

  confirmationType: CppBookingConfirmationType;
  hotelCode: string;
  priorityCategoryCodeList: PriorityCategoryCodeDto[];
  browserIp?: string | null;
  browserInfo?: any;
  userAgent?: any;
  fbp?: string;
  fbc?: string;
  origin?: string;
  transactionId?: string;
  bookingProposalSettingInput?: ExtranetBookingProposalSettingInput;
  bookingFrom?: BookingForm;
}

export class RoomAvailabilityDto {
  roomProductId: string;
  roomProductName: string;
  roomProductCode: string;
  isErfcDeduct: boolean;
  roomIds?: string[];
  roomIdsGroup?: { id: string; roomAvailabilityList: any[] }[];
  roomAvailability?: any[];
}

export interface AfterPaymentDto {
  bookingId: string;
  isAfterHandleSocketPayment?: boolean;
  isProposalBooking?: boolean;
}
