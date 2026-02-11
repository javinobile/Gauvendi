import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

export enum GlobalPaymentProviderCodeEnum {
  PAYPAL = 'PAYPAL',
  APALEO_PAY = 'APALEO_PAY',
  GAUVENDI_PAY = 'GAUVENDI_PAY',
  MEWS_PAYMENT = 'MEWS_PAYMENT',
  ADYEN = 'ADYEN',
  OPI = 'OPI',
  ONE_PAY = 'ONE_PAY',
}

@Entity({ name: 'global_payment_provider' })
@Index(['code'])
@Index(['name'])
export class GlobalPaymentProvider extends BaseEntity {
  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: GlobalPaymentProviderCodeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;
}
