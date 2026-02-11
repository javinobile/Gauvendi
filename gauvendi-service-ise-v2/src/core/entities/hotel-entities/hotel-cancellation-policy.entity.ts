import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';
import { Reservation } from '../booking-entities/reservation.entity';
import { RatePlan } from '../pricing-entities/rate-plan.entity';

export enum CancellationTypeEnum {
  FREE = 'FREE',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
  NON_REFUNDABLE = 'NON_REFUNDABLE'
}

export enum CancellationPolicyDisplayUnitEnum {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK'
}

export enum CancellationFeeUnitEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  NIGHTS = 'NIGHTS'
}

@Entity({ name: 'hotel_cancellation_policy' })
@Index(['hotelId'])
@Index(['code'])
@Index(['cancellationType'])
@Index(['isDefault'])
@Index(['hourPrior'])
export class HotelCancellationPolicy extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 255 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'cancellation_type', length: 60 })
  cancellationType: CancellationTypeEnum;

  @Column({ type: 'int', nullable: true, name: 'hour_prior' })
  hourPrior: number;

  @Column({ type: 'varchar', nullable: true, name: 'display_unit', length: 60 })
  displayUnit: CancellationPolicyDisplayUnitEnum;

  @Column({
    type: 'decimal',
    nullable: true,
    name: 'cancellation_fee_value',
    precision: 26,
    scale: 4
  })
  cancellationFeeValue: number;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'cancellation_fee_unit',
    length: 60,
    default: CancellationFeeUnitEnum.PERCENTAGE
  })
  cancellationFeeUnit: CancellationFeeUnitEnum;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 4000 })
  description: string;

  @Column({ type: 'boolean', nullable: false, name: 'is_default', default: false })
  isDefault: boolean;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => Reservation, (reservation) => reservation.cancellationPolicy)
  reservations: Reservation[];

  @OneToMany(() => RatePlan, (ratePlan) => ratePlan.hotelCancellationPolicy)
  ratePlans: RatePlan[];
}
