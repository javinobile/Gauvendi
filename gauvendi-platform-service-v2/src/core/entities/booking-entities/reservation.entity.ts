import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { HotelCancellationPolicy } from '../hotel-entities/hotel-cancellation-policy.entity';
import { Hotel } from '../hotel-entities/hotel.entity';
import { RatePlan } from '../pricing-entities/rate-plan.entity';
import { RoomProduct } from '../room-product.entity';
import { Booking } from './booking.entity';
import { Company } from './company.entity';
import { Guest } from './guest.entity';
import { ReservationAmenity } from './reservation-amenity.entity';
import { ReservationRoom } from './reservation-room.entity';
import { ReservationTimeSlice } from './reservation-time-slice.entity';

export enum ReservationStatusEnum {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED',
  COMPLETED = 'COMPLETED',
  PROPOSED = 'PROPOSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CREATED = 'CREATED',
  NO_SHOW = 'NO_SHOW'
}

export enum ReservationChannelEnum {
  GV_VOICE = 'GV VOICE',
  GV_SALES_ENGINE = 'GV SALES ENGINE',
  PMS = 'PMS',
  SITEMINDER = 'SITEMINDER'
}

@Index('reservation_booking_id_fk', ['bookingId'], {})
@Index('reservation_reservation_number_index', ['reservationNumber'], {})
@Index('index_reservation_arrival', ['arrival'], {})
@Index('index_reservation_departure', ['departure'], {})
@Index(
  'reservation_soft_delete_status_booking_id_reservation_id',
  ['deletedAt', 'status', 'bookingId', 'id'],
  {}
)
@Index('index_reservation_hotel_id', ['hotelId'], {})
@Index('idx_hotelId_status_arrival_departure', ['hotelId', 'status', 'arrival', 'departure'], {})
@Index('idx_channel', ['channel'], {})
@Index('idx_payment_mode', ['hotelPaymentModeCode'], {})
@Index('idx_mapping_reservation_code', ['mappingReservationCode'], {})
@Index('idx_hotelId_reservationNumber', ['hotelId', 'reservationNumber'], {})
@Entity({ name: 'reservation' })
export class Reservation extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'hotel_id',
    nullable: true
  })
  hotelId: string | null;

  @Column('uuid', {
    name: 'booking_id',
    nullable: true
  })
  bookingId: string | null;

  @Column('varchar', { name: 'reservation_number', nullable: true, length: 60 })
  reservationNumber: string | null;

  @Column('varchar', { name: 'trip_purpose', nullable: true, length: 255 })
  tripPurpose: string | null;

  @Column('varchar', {
    name: 'mapping_reservation_code',
    nullable: true,
    length: 255
  })
  mappingReservationCode: string | null;

  @Column('varchar', {
    name: 'mapping_channel_reservation_code',
    nullable: true,
    length: 100
  })
  mappingChannelReservationCode: string | null;

  @Column('timestamptz', { name: 'arrival', nullable: true })
  arrival: Date | null;

  @Column('timestamptz', { name: 'departure', nullable: true })
  departure: Date | null;

  @Column('varchar', { name: 'booking_flow', nullable: true, length: 60 })
  bookingFlow: string | null;

  @Column('varchar', { name: 'channel', nullable: true, length: 60 })
  channel: string | null;

  @Column('text', { name: 'source', nullable: true })
  source: string | null;

  @Column('varchar', {
    name: 'status',
    nullable: true,
    length: 60,
    default: ReservationStatusEnum.RESERVED
  })
  status: ReservationStatusEnum;

  @Column('varchar', { name: 'booking_language', nullable: true, length: 5 })
  bookingLanguage: string | null;

  @Column('uuid', {
    name: 'rate_plan_id',
    nullable: true
  })
  ratePlanId: string | null;

  @Column('uuid', {
    name: 'market_segment_id',
    nullable: true
  })
  marketSegmentId: string | null;

  @Column('varchar', { name: 'rate_plan_type', nullable: true, length: 60 })
  ratePlanType: string | null;

  @Column('uuid', {
    name: 'room_product_id',
    nullable: true
  })
  roomProductId: string | null;

  @Column('int', { name: 'adults', nullable: true })
  adults: number | null;

  @Column('int', {
    name: 'children_ages',
    array: true,
    nullable: true
  })
  childrenAges: number[] | null;

  @Column('int', { name: 'pets', nullable: true, default: () => "'0'" })
  pets: number | null;

  @Column('uuid', {
    name: 'primary_guest_id',
    nullable: true
  })
  primaryGuestId: string | null;

  @Column('text', { name: 'additional_guests', nullable: true })
  additionalGuests: string | null;

  @Column('uuid', {
    name: 'company_id',
    nullable: true
  })
  companyId: string | null;

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

  @Column('jsonb', { name: 'tax_details', nullable: true })
  taxDetails: any | null;

  @Column('decimal', {
    name: 'city_tax_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  cityTaxAmount: number | null;

  @Column('jsonb', { name: 'city_tax_details', nullable: true })
  cityTaxDetails: any[] | null;

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
    name: 'pay_on_confirmation_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  payOnConfirmationAmount: number | null;

  @Column('decimal', {
    name: 'pay_at_hotel_amount',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  payAtHotelAmount: number | null;

  @Column('decimal', {
    name: 'balance',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  balance: number | null;

  @Column('timestamptz', { name: 'booking_date', nullable: true })
  bookingDate: Date | null;

  @Column('timestamptz', { name: 'released_date', nullable: true })
  releasedDate: Date | null;

  @Column('varchar', { name: 'cancelled_by', nullable: true, length: 50 })
  cancelledBy: string | null;

  @Column('timestamptz', { name: 'cancelled_date', nullable: true })
  cancelledDate: Date | null;

  @Column('text', { name: 'cancelled_reason', nullable: true })
  cancelledReason: string | null;

  @Column('decimal', {
    name: 'cancellation_fee',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  cancellationFee: number | null;

  @Column('varchar', { name: 'cxl_policy_code', nullable: true })
  cxlPolicyCode: string | null;

  @Column('decimal', {
    name: 'no_show_fee',
    nullable: true,
    precision: 26,
    scale: 4,
    transformer: {
      from: (value) => value && parseFloat(value),
      to: (value) => value && value.toString()
    }
  })
  noShowFee: number | null;

  @Column('varchar', { name: 'matched_feature', nullable: true, length: 2000 })
  matchedFeature: string | null;

  @Column('varchar', {
    name: 'mismatched_feature',
    nullable: true,
    length: 2000
  })
  mismatchedFeature: string | null;

  @Column('varchar', { name: 'currency_code', nullable: true, length: 16 })
  currencyCode: string | null;

  @Column('varchar', { name: 'payment_term_code', nullable: true, length: 50 })
  paymentTermCode: string | null;

  @Column('varchar', {
    name: 'hotel_payment_mode_code',
    nullable: true,
    length: 60
  })
  hotelPaymentModeCode: string | null;

  @Column('varchar', { name: 'promo_code', nullable: true, length: 2000 })
  promoCode: string | null;

  @Column('int', { name: 'hour_prior', nullable: true })
  hourPrior: number | null;

  @Column('boolean', { name: 'is_locked', nullable: true, default: false })
  isLocked: boolean | null;

  @Column('text', { name: 'note', nullable: true })
  note: string | null;

  @Column('varchar', { name: 'guest_note', nullable: true, length: 4000 })
  guestNote: string | null;

  @ManyToOne(() => Booking, (booking) => booking.reservations, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT'
  })
  @JoinColumn([{ name: 'booking_id', referencedColumnName: 'id' }])
  booking: Booking;

  @OneToMany(() => ReservationTimeSlice, (reservationTimeSlice) => reservationTimeSlice.reservation)
  reservationTimeSlices: ReservationTimeSlice[];

  @OneToMany(() => ReservationRoom, (reservationRoom) => reservationRoom.reservation)
  reservationRooms: ReservationRoom[];

  @ManyToOne(() => RoomProduct, (roomProduct) => roomProduct.id)
  @JoinColumn([{ name: 'room_product_id', referencedColumnName: 'id' }])
  rfc: RoomProduct;

  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.id)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;

  @OneToMany(() => ReservationAmenity, (reservationAmenity) => reservationAmenity.reservation)
  @JoinColumn({ name: 'id' })
  reservationAmenities: ReservationAmenity[];

  @ManyToOne(() => Guest, (primaryGuest) => primaryGuest)
  @JoinColumn({ name: 'primary_guest_id' })
  primaryGuest: Guest;

  @ManyToOne(() => Company, (company) => company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(
    () => HotelCancellationPolicy,
    (hotelCancellationPolicy) => hotelCancellationPolicy.reservations
  )
  @JoinColumn([
    { name: 'hotel_id', referencedColumnName: 'hotelId' },
    { name: 'cxl_policy_code', referencedColumnName: 'code' }
  ])
  cancellationPolicy: HotelCancellationPolicy;

  @ManyToOne(() => Hotel, (hotel) => hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column('varchar', { name: 'pdf_url', nullable: true, length: 255 })
  pdfUrl?: string;
}
