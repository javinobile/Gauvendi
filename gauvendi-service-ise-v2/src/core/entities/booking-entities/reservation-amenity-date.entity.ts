import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ReservationAmenity } from './reservation-amenity.entity';

@Index(['reservationAmenityId'])
@Entity({ name: 'reservation_amenity_date' })
export class ReservationAmenityDate extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'reservation_amenity_id',
    nullable: true
  })
  reservationAmenityId: string | null;

  @Column('int', { name: 'count', nullable: true })
  count: number | null;

  @Column('bigint', { name: 'date_of_amenity', nullable: true })
  dateOfAmenity: string | null;

  @Column('decimal', {
    name: 'total_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  totalBaseAmount: number | null;

  @Column('decimal', {
    name: 'total_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  totalGrossAmount: number | null;

  @Column('decimal', {
    name: 'tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  taxAmount: number | null;

  @Column('decimal', {
    name: 'service_charge_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  serviceChargeAmount: number | null;

  @Column('date', { name: 'date', nullable: true })
  date: string | null;

  //relations
  @ManyToOne(
    () => ReservationAmenity,
    (reservationAmenity) => reservationAmenity.reservationAmenityDates,
    {
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT'
    }
  )
  @JoinColumn([{ name: 'reservation_amenity_id', referencedColumnName: 'id' }])
  reservationAmenity: ReservationAmenity;
}
