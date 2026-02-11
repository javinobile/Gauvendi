import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum HotelPhotoTypeEnum {
  EMAIL_PROPERTY_COVER = 'EMAIL_PROPERTY_COVER',
  EMAIL_LOGO = 'EMAIL_LOGO',
  EMAIL_PROPERTY_PREVIEW = 'EMAIL_PROPERTY_PREVIEW'
}

export class UploadHotelFaviconDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class UploadHotelLogoDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}

export class UploadEmailGeneralImagesDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @IsEnum(HotelPhotoTypeEnum)
  hotelPhotoType: HotelPhotoTypeEnum;
}
