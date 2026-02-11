import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
  IsNumber
} from 'class-validator';

export class PartnerReferralRequest {
  @IsString()
  @IsOptional()
  trackingId: string;

  @IsString()
  @IsNotEmpty()
  returnUrl: string;
}

export enum PaypalIntent {
  CAPTURE = 'CAPTURE',
  AUTHORIZE = 'AUTHORIZE'
}

export class UnitAmount {
  @IsNotEmpty()
  @IsString()
  @MaxLength(3)
  currencyCode: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  @IsNotEmpty()
  value: string;
}

export class PurchaseBreakdown {
  @IsOptional()
  @ValidateNested()
  @Type(() => UnitAmount)
  itemTotal: UnitAmount;

  @IsOptional()
  @ValidateNested()
  @Type(() => UnitAmount)
  taxTotal: UnitAmount;
}

export class PurchaseUnitsAmount {
  @IsNotEmpty()
  @IsString()
  @MaxLength(3)
  currencyCode: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(32)
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PurchaseBreakdown)
  breakdown: PurchaseBreakdown;
}

export class Payee {
  @IsString()
  emailAddress: string;

  @IsString()
  @MaxLength(13)
  merchantId: string;
}

export enum UnitCategoryEnum {
  DIGITAL_GOODS = 'DIGITAL_GOODS',
  PHYSICAL_GOODS = 'PHYSICAL_GOODS',
  DONATION = 'DONATION'
}

export class PurchaseUnitItems {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  quantity: string;

  @IsOptional()
  description: string;

  @IsOptional()
  sku: string;

  @IsOptional()
  category?: UnitCategoryEnum = UnitCategoryEnum.PHYSICAL_GOODS;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UnitAmount)
  unitAmount: UnitAmount;

  @IsOptional()
  @ValidateNested()
  @Type(() => UnitAmount)
  tax: UnitAmount;
}

export class PurchaseUnits {
  @IsOptional()
  referenceId: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  customId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PurchaseUnitsAmount)
  amount: PurchaseUnitsAmount;

  @IsOptional()
  @ValidateNested()
  @Type(() => Payee)
  payee: Payee;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseUnitItems)
  items: PurchaseUnitItems[];
}

export class ApplicationContext {
  @IsOptional()
  @IsString()
  shippingPreference: string = 'NO_SHIPPING';
}

export class CreateOrdersRequest {
  @IsNotEmpty()
  intent: PaypalIntent;

  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseUnits)
  purchaseUnits: PurchaseUnits[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationContext)
  applicationContext?: ApplicationContext;
}

export class CapturePayPalOrderResponse {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'status' })
  status: string;
}