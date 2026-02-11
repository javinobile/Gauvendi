import { PaymentAccountTypeEnum } from '@src/core/enums/common';
import { GuestDto } from '@src/modules/guest/dtos/guest.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { PaymentProviderCodeEnum } from 'src/core/enums/payment';
// CreditCardInformationInput interface from update-booking-information.dto.ts
export interface CreditCardInformationInput {
  cardHolder: string | null;
  cardNumber: string | null;
  cvv: string | null;
  expiryMonth: string | null;
  expiryYear: string | null;
  refPaymentMethodId: string | null;
  transactionId: string | null;
  type: string | null;
}

// BookingInput DTO structure
class ReservationInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  reservationNumber?: string;

  @IsOptional()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => PersonInputDto)
  additionalGuestList?: PersonInputDto[];

  @IsOptional()
  @IsObject()
  primaryGuest?: any;
}

class PersonInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  isAdult?: boolean;
}

export class BookingInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsBoolean()
  acceptTnc?: boolean;

  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @IsString()
  arrival?: string;

  @IsOptional()
  @IsString()
  departure?: string;

  @IsOptional()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ReservationInputDto)
  reservationList?: ReservationInputDto[];

  @IsOptional()
  @IsString()
  specialRequest?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonInputDto)
  primaryGuest?: PersonInputDto;

  @IsOptional()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => PersonInputDto)
  additionalGuestList?: PersonInputDto[];

  @IsOptional()
  @IsString()
  hotelPaymentModeCode?: string;

  @IsOptional()
  @IsString()
  bookingFlow?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  bookingLanguage?: string;

  @IsOptional()
  @IsString()
  strongestPaymentTermsCode?: string;

  @IsOptional()
  @IsString()
  strongestCxlPolicyCode?: string;

  @IsOptional()
  hourPrior?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  cancelledBy?: string;

  @IsOptional()
  @IsString()
  cancelledReason?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuestDto)
  booker?: GuestDto;

  @IsOptional()
  @IsBoolean()
  isUpdateAvailability?: boolean;
}

export class ConfirmBookingProposalInputDto {
  @IsOptional()
  @IsString()
  hotelCode?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @ValidateNested()
  @Type(() => BookingInputDto)
  booking: BookingInputDto;

  @IsOptional()
  @IsObject()
  creditCardInformation?: CreditCardInformationInput;

  @IsOptional()
  @IsEnum(PaymentAccountTypeEnum)
  hotelPaymentAccountType?: PaymentAccountTypeEnum;

  @IsOptional()
  @IsString()
  translateTo?: string;

  @IsOptional()
  @IsBoolean()
  acceptTnc?: boolean;

  @IsOptional()
  @IsEnum(PaymentProviderCodeEnum)
  paymentProviderCode?: PaymentProviderCodeEnum;

  @IsOptional()
  @IsString()
  bookingPageUrl?: string;

  browserAgentIp?: string;

  @IsOptional()
  @IsObject()
  browserInfo?: any;

  @IsOptional()
  @IsString()
  origin?: string;

  // Meta Conversion API tracking fields
  @IsOptional()
  @IsString()
  userAgent?: string | null;

  @IsOptional()
  @IsString()
  fbp?: string | null; // Facebook Pixel cookie (_fbp)

  @IsOptional()
  @IsString()
  fbc?: string | null; // Facebook Click ID cookie (_fbc)
}
