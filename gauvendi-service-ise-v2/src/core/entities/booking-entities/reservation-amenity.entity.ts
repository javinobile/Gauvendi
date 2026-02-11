import { ExtraServiceTypeEnum } from 'src/core/enums/common';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { HotelAmenity, PricingUnitEnum } from '../hotel-entities/hotel-amenity.entity';
import { ReservationAmenityDate } from './reservation-amenity-date.entity';
import { Reservation } from './reservation.entity';

@Index(['reservationId'])
@Index(['hotelAmenityId'])
@Index(['masterHotelAmenityId'])
@Entity({ name: 'reservation_amenity' })
export class ReservationAmenity extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'reservation_id',
    nullable: true
  })
  reservationId: string | null;

  @Column('uuid', {
    name: 'hotel_amenity_id',
    nullable: true
  })
  hotelAmenityId: string | null;

  @Column('varchar', {
    name: 'extra_service_type',
    nullable: true,
    length: 60
  })
  extraServiceType: ExtraServiceTypeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'pricing_unit', length: 60 })
  pricingUnit?: PricingUnitEnum;

  @Column('uuid', {
    name: 'master_hotel_amenity_id',
    nullable: true
  })
  masterHotelAmenityId: string | null;

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

  @Column('varchar', { name: 'age_category_code', nullable: true, length: 60 })
  ageCategoryCode: string | null;

  //relations
  @OneToMany(
    () => ReservationAmenityDate,
    (reservationAmenityDate) => reservationAmenityDate.reservationAmenity
  )
  reservationAmenityDates: ReservationAmenityDate[];

  @ManyToOne(() => Reservation, (reservation) => reservation.reservationAmenities)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @ManyToOne(() => HotelAmenity, (hotelAmenity) => hotelAmenity.id)
  @JoinColumn({ name: 'hotel_amenity_id' })
  hotelAmenity: HotelAmenity;
}
