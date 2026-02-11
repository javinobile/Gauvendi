import { PaymentAccountOriginEnum } from '@src/core/enums/common';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HotelInformationQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  expand?: string[];

  @IsString()
  @IsOptional()
  hotelId?: string;
  
  translateTo?: string;
}

export class HotelsQueryDto {
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  expand?: string[];
}

export class GetPaymentAccountListQueryDto {
  hotelId: string;

  origin?: PaymentAccountOriginEnum;
}
