import { stringify } from 'uuid';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';

@Index(['reservationId'])
@Index(['mrfcId'])
@Index(['hotelId'])
@Index(['hotelId', 'reservationId'])
@Index(['hotelId', 'mrfcId'])
@Index(['hotelId', 'reservationId', 'mrfcId'])
@Entity({ name: 'reservation_related_mrfc' })
export class ReservationRelatedMrfc extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'hotel_id',
  })
  hotelId: string;

  @Column('uuid', {
    name: 'reservation_id',
  })
  reservationId: string;

  @Column('uuid', {
    name: 'mrfc_id',
  })
  mrfcId: string;

  @Column('decimal', {
    name: 'mrfc_base_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  mrfcBaseAmount: number | null;

  @Column('decimal', {
    name: 'mrfc_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  mrfcGrossAmount: number | null;

  @Column('decimal', {
    name: 'reservation_gross_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    default: () => "'0.0000'",
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  reservationGrossAmount: number | null;

  @Column('decimal', {
    name: 'reservation_gross_accommodation_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    default: () => "'0.0000'",
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  reservationGrossAccommodationAmount: number | null;

  @Column('decimal', {
    name: 'reservation_gross_included_service_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    default: () => "'0.0000'",
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  reservationGrossIncludedServiceAmount: number | null;

  @Column('decimal', {
    name: 'reservation_gross_service_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    default: () => "'0.0000'",
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  reservationGrossServiceAmount: number | null;

  @Column('decimal', {
    name: 'mrfc_gross_accommodation_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    default: () => "'0.0000'",
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString(),
    },
  })
  mrfcGrossAccommodationAmount: number | null;
}
