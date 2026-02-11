import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';

export interface CreditCardInformationInput {
  cardHolder?: string | null;
  cardNumber?: string | null;
  cvv?: string | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  refPaymentMethodId?: string | null;
  transactionId?: string | null;
  type?: string | null;
}

class PhoneInfoDto {
  @IsOptional()
  @IsString()
  phoneCode: string | null;

  @IsOptional()
  @IsString()
  phoneNumber: string | null;
}

class UpdateGuestDto {
  @IsOptional()
  @IsUUID()
  id: string | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PhoneInfoDto)
  phoneInfo: PhoneInfoDto | null;

  @IsOptional()
  @IsString()
  firstName: string | null;

  @IsOptional()
  @IsString()
  lastName: string | null;

  @IsOptional()
  @IsEmail()
  emailAddress: string | null;

  @IsOptional()
  @IsString()
  address: string | null;

  @IsOptional()
  @IsString()
  countryId: string | null;

  @IsOptional()
  @IsString()
  city: string | null;

  @IsOptional()
  @IsString()
  postalCode: string | null;

  @IsOptional()
  @IsBoolean()
  isBooker: boolean | null;

  @IsOptional()
  @IsBoolean()
  isAdult: boolean | null;

  @IsOptional()
  @IsString()
  companyTaxId: string | null;

  @IsOptional()
  @IsString()
  companyName: string | null;

  @IsOptional()
  @IsString()
  companyEmail: string | null;

  @IsOptional()
  @IsString()
  companyAddress: string | null;

  @IsOptional()
  @IsString()
  companyCity: string | null;

  @IsOptional()
  @IsString()
  companyPostalCode: string | null;
}

class UpdateReservationDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateGuestDto)
  primaryGuest: UpdateGuestDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGuestDto)
  additionalGuestList: UpdateGuestDto[];

  @IsString()
  reservationNumber: string;

  @IsOptional()
  @IsString()
  guestNote: string | null;
}

class UpdateBookingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateReservationDto)
  reservationList: UpdateReservationDto[];

  @IsUUID()
  id: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateGuestDto)
  booker: UpdateGuestDto;

  @IsOptional()
  @IsString()
  specialRequest: string | null;
}

export class UpdateBookingInformationDto {
  @IsString()
  hotelCode: string;

  @IsString()
  paymentProviderCode: string;

  @IsOptional()
  @IsObject()
  creditCardInformation: CreditCardInformationInput | null;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateBookingDto)
  booking: UpdateBookingDto;
}
