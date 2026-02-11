import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';

export enum CityTaxUnitEnum {
  PER_PERSON_PER_NIGHT = 'PER_PERSON_PER_NIGHT',
  PER_PERSON_PER_STAY_FIXED = 'PER_PERSON_PER_STAY_FIXED',
  PERCENTAGE_ON_GROSS_AMOUNT_ROOM = 'PERCENTAGE_ON_GROSS_AMOUNT_ROOM',
  PERCENTAGE_ON_NET_AMOUNT_ROOM = 'PERCENTAGE_ON_NET_AMOUNT_ROOM',
  FIXED_ON_GROSS_AMOUNT_ROOM = 'FIXED_ON_GROSS_AMOUNT_ROOM',
  PER_ROOM_PER_NIGHT = 'PER_ROOM_PER_NIGHT'
}

export enum CityTaxChargeMethodEnum {
  PAY_ON_CONFIRMATION = 'PAY_ON_CONFIRMATION',
  PAY_AT_HOTEL = 'PAY_AT_HOTEL'
}

export enum CityTaxStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING'
}

@Entity({ name: 'hotel_city_tax' })
@Index(['hotelId'])
@Index(['code'])
@Index(['status'])
@Index(['unit'])
@Index(['chargeMethod'])
@Index(['validFrom'])
@Index(['validTo'])
@Index(['hotelId', 'status'])
export class HotelCityTax extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'unit', length: 60 })
  unit: CityTaxUnitEnum;

  @Column({ type: 'decimal', nullable: true, name: 'value', precision: 26, scale: 4 })
  value: string;

  @Column({ type: 'varchar', nullable: true, name: 'charge_method', length: 100 })
  chargeMethod: CityTaxChargeMethodEnum;

  @Column({ type: 'date', nullable: true, name: 'valid_from' })
  validFrom: Date;

  @Column({ type: 'date', nullable: true, name: 'valid_to' })
  validTo: Date;

  @Column({ type: 'varchar', nullable: true, name: 'status', length: 60 })
  status: CityTaxStatusEnum;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 1000 })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_pms_city_tax_code', length: 100 })
  mappingPmsCityTaxCode: string;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
