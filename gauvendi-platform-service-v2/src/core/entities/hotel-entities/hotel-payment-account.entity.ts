import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { Hotel } from './hotel.entity';
import {
  PaymentAccountOriginEnum,
  PaymentAccountTypeEnum,
  PaymentEnvironmentEnum
} from '../../enums/common';


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

  @NumericColumn({ nullable: true, name: 'fee_fixed_amount', precision: 26, scale: 4 })
  feeFixedAmount: number;

  @NumericColumn({ nullable: true, name: 'fee_percentage', precision: 26, scale: 4 })
  feePercentage: number;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
