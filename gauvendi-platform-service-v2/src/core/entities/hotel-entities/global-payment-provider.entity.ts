import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { GlobalPaymentProviderCodeEnum } from '../../enums/common';

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
