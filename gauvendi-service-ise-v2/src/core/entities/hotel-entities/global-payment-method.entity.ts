import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

@Entity({ name: 'global_payment_method' })
@Index(['code'])
@Index(['name'])
export class GlobalPaymentMethod extends BaseEntityWithDeleted {
  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, name: 'supported_payment_provider_codes' })
  supportedPaymentProviderCodes: string[];
}
