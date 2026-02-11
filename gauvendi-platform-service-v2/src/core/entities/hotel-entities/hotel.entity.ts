import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { HotelConfiguration } from './hotel-configuration.entity';
import { Country } from '../core-entities/country.entity';
import { Currency } from '../core-entities/currency.entity';
import { FileLibrary } from '../core-entities/file-library.entity';
import {
  HotelStatusEnum,
  TaxSettingEnum,
  ServiceChargeSettingEnum,
  MeasureMetricEnum
} from '../../enums/common';
import { HotelTaxSetting } from './hotel-tax-setting.entity';
import { IdentityUser } from '../identity-entities/identity-user.entity';
import { Reservation } from '../booking-entities/reservation.entity';

@Entity({ name: 'hotel' })
@Index(['brandId'])
@Index(['iconImageId'])
@Index(['organisationId'])
@Index(['baseCurrencyId'])
@Index(['iconSymbolImageId'])
@Index(['code'])
@Index(['status'])
@Index(['name'])
export class Hotel extends BaseEntityWithDeleted {
  @Column({ type: 'uuid', nullable: true, name: 'brand_id' })
  brandId: string;

  @Column({ type: 'uuid', nullable: true, name: 'icon_image_id' })
  iconImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'email_image_id' })
  emailImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'organisation_id' })
  organisationId: string;

  @Column({ type: 'uuid', nullable: true, name: 'base_currency_id' })
  baseCurrencyId: string;

  @Column({ type: 'uuid', nullable: true, name: 'icon_symbol_image_id' })
  iconSymbolImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'custom_theme_image_id' })
  customThemeImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'background_category_image_id' })
  backgroundCategoryImageId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'status',
    length: 61,
    default: HotelStatusEnum.ACTIVE
  })
  status: HotelStatusEnum;

  @Column({ type: 'varchar', nullable: true, name: 'email_address', array: true })
  emailAddress: string[];

  @Column({ type: 'varchar', nullable: true, name: 'signature', length: 1000 })
  signature: string;

  @Column({ type: 'varchar', nullable: true, name: 'sender_name', length: 100 })
  senderName: string;

  @Column({ type: 'varchar', nullable: true, name: 'sender_email', length: 100 })
  senderEmail: string;

  @Column({ type: 'varchar', nullable: true, name: 'time_zone', length: 60 })
  timeZone: string;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'tax_setting',
    length: 60,
    default: TaxSettingEnum.INCLUSIVE
  })
  taxSetting: TaxSettingEnum;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'service_charge_setting',
    length: 60,
    default: ServiceChargeSettingEnum.INCLUSIVE
  })
  serviceChargeSetting: ServiceChargeSettingEnum;

  @Column({
    type: 'boolean',
    nullable: false,
    name: 'is_city_tax_included_selling_price',
    default: false
  })
  isCityTaxIncludedSellingPrice: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'stay_option_background_image_id' })
  stayOptionBackgroundImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'customize_stay_option_background_image_id' })
  customizeStayOptionBackgroundImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'stay_option_suggestion_image_id' })
  stayOptionSuggestionImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'signature_background_image_id' })
  signatureBackgroundImageId: string;

  @Column({ type: 'uuid', nullable: true, name: 'country_id' })
  countryId: string;

  @Column({ type: 'uuid', nullable: true, name: 'lowest_price_image_id' })
  lowestPriceImageId: string;

  @Column({ type: 'varchar', nullable: true, name: 'preferred_language_code', length: 10 })
  preferredLanguageCode: string;

  @Column({ type: 'boolean', nullable: true, name: 'initial_setup', default: false })
  initialSetup: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'phone_code', length: 15 })
  phoneCode: string;

  @Column({ type: 'varchar', nullable: true, name: 'phone_number', length: 60 })
  phoneNumber: string;

  @Column({ type: 'int', nullable: true, name: 'room_number' })
  roomNumber: number;

  @Column({ type: 'varchar', nullable: true, name: 'city', length: 255 })
  city: string;

  @Column({ type: 'varchar', nullable: true, name: 'state', length: 255 })
  state: string;

  @Column({ type: 'varchar', nullable: true, name: 'postal_code', length: 60 })
  postalCode: string;

  @Column({ type: 'varchar', nullable: true, name: 'address', length: 1000 })
  address: string;

  @Column({ type: 'text', nullable: true, name: 'address_display' })
  addressDisplay: string;

  @Column({ type: 'varchar', nullable: true, name: 'latitude', length: 255 })
  latitude: string;

  @Column({ type: 'varchar', nullable: true, name: 'longitude', length: 255 })
  longitude: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'phone', length: 60 })
  phone: string;

  @Column({ type: 'varchar', nullable: true, name: 'measure_metric', length: 60 })
  measureMetric: MeasureMetricEnum;

  @OneToMany(() => HotelConfiguration, (hotelConfiguration) => hotelConfiguration.hotel)
  hotelConfigurations: HotelConfiguration[];

  @ManyToOne(() => Country, { nullable: true, eager: false })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @ManyToOne(() => Currency, { nullable: true, eager: false })
  @JoinColumn({ name: 'base_currency_id' })
  baseCurrency: Currency;

  @ManyToOne(() => FileLibrary, { nullable: true, eager: false })
  @JoinColumn({ name: 'icon_image_id' })
  iconImage: FileLibrary;

  @ManyToOne(() => FileLibrary, { nullable: true, eager: false })
  @JoinColumn({ name: 'email_image_id' })
  emailImage: FileLibrary;

  @OneToMany(() => HotelTaxSetting, (hotelTaxSetting) => hotelTaxSetting.hotel)
  hotelTaxSettings: HotelTaxSetting[];

  @OneToMany(() => IdentityUser, (user) => user.hotel)
  users: IdentityUser[];

  @OneToMany(() => Reservation, (reservation) => reservation.hotel)
  reservations: Reservation[];
}
