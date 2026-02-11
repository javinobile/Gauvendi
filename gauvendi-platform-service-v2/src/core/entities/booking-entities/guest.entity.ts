import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { Reservation } from './reservation.entity';
import { Country } from '../core-entities/country.entity';
import { Booking } from './booking.entity';
import { Hotel } from '../hotel-entities/hotel.entity';

@Entity({ name: 'guest' })
@Index(['countryId'])
export class Guest extends BaseEntityWithDeleted {
  @Column('uuid', {
    name: 'country_id',
    nullable: true
  })
  countryId: string | null;

  @Column('varchar', { name: 'first_name', nullable: true, length: 255 })
  firstName: string | null;

  @Column('varchar', { name: 'last_name', nullable: true, length: 255 })
  lastName: string | null;

  @Column('varchar', { name: 'email_address', nullable: true, length: 255 })
  emailAddress: string | null;

  @Column('varchar', { name: 'address', nullable: true, length: 512 })
  address: string | null;

  @Column('varchar', { name: 'city', nullable: true, length: 255 })
  city: string | null;

  @Column('varchar', { name: 'state', nullable: true, length: 50 })
  state: string | null;

  @Column('varchar', { name: 'postal_code', nullable: true, length: 20 })
  postalCode: string | null;

  @Column('varchar', { name: 'phone_number', nullable: true, length: 255 })
  phoneNumber: string | null;

  @Column('varchar', { name: 'country_number', nullable: true, length: 20 })
  countryNumber: string | null;

  @Column('varchar', {
    name: 'company_postal_code',
    nullable: true,
    length: 255
  })
  companyPostalCode: string | null;

  @Column('varchar', { name: 'company_country', nullable: true, length: 255 })
  companyCountry: string | null;

  @Column('varchar', { name: 'company_city', nullable: true, length: 255 })
  companyCity: string | null;

  @Column('varchar', { name: 'company_address', nullable: true, length: 4000 })
  companyAddress: string | null;

  @Column('varchar', { name: 'company_email', nullable: true, length: 255 })
  companyEmail: string | null;

  @Column('varchar', { name: 'company_name', nullable: true, length: 1000 })
  companyName: string | null;

  @Column('varchar', { name: 'company_tax_id', nullable: true, length: 255 })
  companyTaxId: string | null;

  @Column('boolean', {
    name: 'is_main_guest',
    nullable: true,
    default: false
  })
  isMainGuest: boolean | null;

  @Column('boolean', {
    name: 'is_booker',
    nullable: true,
    default: false
  })
  isBooker: boolean | null;

  @Column('boolean', {
    name: 'is_returning_guest',
    nullable: true,
    default: false
  })
  isReturningGuest: boolean | null;

  @Column('uuid', { name: 'hotel_id', nullable: true })
  hotelId: string | null;

  @Column('varchar', { name: 'preferred_language', nullable: true })
  preferredLanguage: string | null;

  //relations
  @OneToMany(() => Reservation, (reservation) => reservation.primaryGuest)
  reservations: Reservation[];

  @OneToMany(() => Booking, (booking) => booking.booker)
  bookings: Booking[];

  @ManyToOne(() => Country, (country) => country)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @ManyToOne(() => Hotel, (hotel) => hotel)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel | null;
}
