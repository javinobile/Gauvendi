import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { HotelCityTax } from './hotel-city-tax.entity';
import { Hotel } from './hotel.entity';

@Entity({ name: 'hotel_city_tax_age_group' })
@Index(['hotelId'])
@Index(['hotelCityTaxId'])
@Index(['fromAge'])
@Index(['toAge'])
@Index(['hotelCityTaxId', 'fromAge', 'toAge'])
export class HotelCityTaxAgeGroup extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_city_tax_id' })
  hotelCityTaxId: string;

  @Column({ type: 'int', nullable: true, name: 'from_age' })
  fromAge: number;

  @Column({ type: 'int', nullable: true, name: 'to_age' })
  toAge: number;

  @Column({ type: 'decimal', nullable: true, name: 'value', precision: 26, scale: 4 })
  value: number;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => HotelCityTax, { nullable: true })
  @JoinColumn({ name: 'hotel_city_tax_id' })
  hotelCityTax: HotelCityTax;
}
