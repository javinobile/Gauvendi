import { stringify } from 'uuid';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Guest } from './guest.entity';

@Entity({ name: 'customer_payment_gateway' })
export class CustomerPaymentGateway extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'internal_customer_id',
    nullable: true
  })
  internalCustomerId: string | null;

  // TODO -> convert to string
  @Column('uuid', {
    name: 'ref_payment_customer_id',
    nullable: true
  })
  refPaymentCustomerId: string | null;

  @Column('varchar', {
    name: 'ref_payment_method_id',
    nullable: true,
    length: 255
  })
  refPaymentMethodId: string | null;

  @Column('varchar', { name: 'payment_provider', nullable: true, length: 60 })
  paymentProvider: string | null;

  // relation
  @ManyToOne(() => Guest, (guest) => guest)
  @JoinColumn({ name: 'internal_customer_id' })
  guest: Guest;
}
