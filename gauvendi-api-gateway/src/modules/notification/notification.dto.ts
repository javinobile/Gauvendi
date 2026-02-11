import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class SendConfirmBookingEmailDto {
  @IsUUID()
  bookingId: string;

  @IsOptional()
  @IsString()
  translateTo?: string;

  @IsOptional()
  @IsString()
  hotelTemplateEmail?: string;

  @IsOptional()
  @IsUUID()
  hotelId?: string;
}

export class DownloadBookingConfirmationPdfDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsString()
  @IsNotEmpty()
  reservationNumber: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  isOriginPdf?: boolean;
}

export class SendTestEmailDto {
  @IsUUID()
  @IsOptional()
  hotelId?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsString()
  hotelTemplateEmail?: string;

  @IsOptional()
  @IsEmail()
  toEmail?: string;
}
