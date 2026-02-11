import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { Hotel } from './hotel.entity';
import { RatePlan } from '../pricing-entities/rate-plan.entity';

@Entity({ name: 'hotel_payment_term' })
@Index(['hotelId'])
@Index(['hotelId', 'code'], { unique: true })
@Index(['isDefault'])
@Index(['hotelId', 'code'])
@Index(['hotelId', 'isDefault'])
export class HotelPaymentTerm extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 4000 })
  description: string;

  @NumericColumn({ nullable: true, name: 'pay_at_hotel', precision: 26, scale: 4 })
  payAtHotel: number;

  @Column({ type: 'varchar', nullable: true, name: 'pay_at_hotel_description', length: 4000 })
  payAtHotelDescription: string;

  @NumericColumn({ nullable: true, name: 'pay_on_confirmation', precision: 26, scale: 4 })
  payOnConfirmation: number;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'pay_on_confirmation_description',
    length: 4000
  })
  payOnConfirmationDescription: string;

  @Column({ type: 'boolean', nullable: false, name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ type: 'text', nullable: true, array: true, name: 'supported_payment_method_codes' })
  supportedPaymentMethodCodes: string[];

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => RatePlan, (ratePlan) => ratePlan.hotelPaymentTerm)
  ratePlans: RatePlan[];
}
