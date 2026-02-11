import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

export enum PaymentMethodStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

@Entity({ name: 'hotel_payment_method_setting' })
@Index(['hotelId'])
@Index(['globalPaymentMethodId'])
@Index(['globalPaymentProviderId'])
@Index(['status'])
@Index(['hotelId', 'globalPaymentMethodId'])
@Index(['hotelId', 'globalPaymentProviderId'])
@Index(['hotelId', 'globalPaymentMethodId', 'globalPaymentProviderId'], { unique: true })
export class HotelPaymentMethodSetting extends BaseEntityWithDeleted {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'global_payment_method_id' })
  globalPaymentMethodId: string;

  @Column({ type: 'uuid', nullable: true, name: 'global_payment_provider_id' })
  globalPaymentProviderId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', nullable: true, name: 'status', length: 60 })
  status: PaymentMethodStatusEnum;
}
