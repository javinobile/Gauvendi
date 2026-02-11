import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';

class PhoneInfoDto {
  @IsString()
  @IsOptional()
  phoneCode?: string | null;

  @IsString()
  @IsOptional()
  phoneNumber?: string | null;
}

export class GuestDto {
  @IsOptional()
  @IsUUID()
  id: string | null;

  @IsOptional()
  @IsString()
  firstName: string | null;

  @IsOptional()
  @IsString()
  lastName: string | null;

  @IsOptional()
  @IsEmail()
  emailAddress: string | null;

  @IsString()
  @IsOptional()
  countryId?: string | null;

  @IsOptional()
  @IsString()
  city: string | null;

  @IsOptional()
  @IsString()
  state: string | null;

  @IsOptional()
  @IsString()
  postalCode: string | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PhoneInfoDto)
  phoneInfo: PhoneInfoDto | null;

  @IsOptional()
  @IsString()
  address: string | null;

  @IsOptional()
  @IsBoolean()
  isBooker?: boolean;

  @IsOptional()
  @IsNumber()
  reservationIdx?: number;

  @IsOptional()
  @IsBoolean()
  isAdult?: boolean;

  // Company info (nullable)
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
  companyCountry: string | null;

  @IsOptional()
  @IsString()
  companyName: string | null;

  @IsOptional()
  @IsString()
  companyPostalCode: string | null;

  @IsOptional()
  @IsString()
  companyTaxId: string | null;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsBoolean()
  isMainGuest?: boolean;
}
