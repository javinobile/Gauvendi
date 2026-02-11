import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Hotel } from './hotel.entity';

export enum PaymentAccountOriginEnum {
  SALES_ENGINE = 'SALES_ENGINE',
  EXTRANET = 'EXTRANET',
  PMS = 'PMS',
  MOBILE_APP = 'MOBILE_APP',
}

export enum PaymentAccountTypeEnum {
  ADYEN = 'ADYEN',
  STRIPE = 'STRIPE',
  MEWS_PAYMENT = 'MEWS_PAYMENT',
  PAYPAL = 'PAYPAL',
  SQUARE = 'SQUARE',
  GAUVENDI_PAY = 'GAUVENDI_PAY',
}

export enum PaymentEnvironmentEnum {
  TEST = 'TEST',
  LIVE = 'LIVE',
  SANDBOX = 'SANDBOX',
  PRODUCTION = 'PRODUCTION',
}

@Entity({ name: 'hotel_payment_account' })
@Index(['hotelId'])
@Index(['origin'])
@Index(['type'])
@Index(['environment'])
@Index(['subMerchantId'])
@Index(['hotelId', 'type'])
@Index(['hotelId', 'origin'])
export class HotelPaymentAccount extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'payment_id', length: 255 })
  paymentId: string;

  @Column({ type: 'varchar', nullable: true, name: 'origin', length: 60 })
  origin: PaymentAccountOriginEnum;

  @Column({ type: 'varchar', nullable: true, name: 'payment_api_key', length: 1000 })
  paymentApiKey: string;

  @Column({ type: 'varchar', nullable: true, name: 'merchant', length: 255 })
  merchant: string;

  @Column({ type: 'varchar', nullable: true, name: 'live_endpoint_url_prefix', length: 255 })
  liveEndpointUrlPrefix: string;

  @Column({ type: 'varchar', nullable: true, name: 'environment', length: 40 })
  environment: PaymentEnvironmentEnum;

  @Column({ type: 'varchar', nullable: true, name: 'type', length: 60 })
  type: PaymentAccountTypeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'sub_merchant_id', length: 60 })
  subMerchantId: string;

  @Column({ type: 'decimal', nullable: true, name: 'fee_fixed_amount', precision: 26, scale: 4 })
  feeFixedAmount: string;

  @Column({ type: 'decimal', nullable: true, name: 'fee_percentage', precision: 26, scale: 4 })
  feePercentage: string;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
