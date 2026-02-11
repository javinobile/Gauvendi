import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { HotelAmenityPrice } from './hotel-amenity-price.entity';
import { Hotel } from './hotel.entity';

export enum HotelAgeCategoryCodeEnum {
  INFANT = 'INFANT',
  CHILD = 'CHILD',
  TEENAGER = 'TEENAGER',
  ADULT = 'ADULT',
  DEFAULT = 'DEFAULT',
}

@Entity({ name: 'hotel_age_category' })
@Index(['hotelId'])
@Index(['code'])
@Index(['fromAge'])
@Index(['toAge'])
export class HotelAgeCategory extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: HotelAgeCategoryCodeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 255 })
  description: string;

  @Column({ type: 'int', nullable: true, name: 'from_age' })
  fromAge: number;

  @Column({ type: 'int', nullable: true, name: 'to_age' })
  toAge: number;


  @Column({ type: 'boolean', default: false, name: 'is_include_extra_occupancy_rate' })
  isIncludeExtraOccupancyRate: boolean;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => HotelAmenityPrice, (hotelAmenityPrice) => hotelAmenityPrice.hotelAgeCategory)
  hotelAmenityPrices: HotelAmenityPrice[];
}
