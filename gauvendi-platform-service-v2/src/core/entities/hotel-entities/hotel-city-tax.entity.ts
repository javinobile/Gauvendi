import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';
import { CityTaxUnitEnum, CityTaxChargeMethodEnum, CityTaxStatusEnum } from '../../enums/common';
import { HotelCityTaxAgeGroup } from './hotel-city-tax-age-group.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';

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

  @NumericColumn({ type: 'numeric', nullable: true, name: 'value' })
  value: number;

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

  @OneToMany(() => HotelCityTaxAgeGroup, (ageGroup) => ageGroup.hotelCityTax)
  hotelCityTaxAgeGroups: HotelCityTaxAgeGroup[];
}
