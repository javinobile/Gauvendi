import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { HotelAmenity } from './hotel-amenity.entity';
import { HotelAgeCategory } from './hotel-age-category.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';

@Entity({ name: 'hotel_amenity_price' })
@Index(['hotelAmenityId'])
@Index(['hotelAgeCategoryId'])
@Index(['hotelAmenityId', 'hotelAgeCategoryId'], { unique: true })
@Index(['price'])
export class HotelAmenityPrice extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_amenity_id' })
  hotelAmenityId: string;

  @Column({ type: 'uuid', nullable: false, name: 'hotel_age_category_id' })
  hotelAgeCategoryId: string;

  @NumericColumn({ nullable: true, name: 'price' })
  price: number;

  // Relations
  @ManyToOne(() => HotelAmenity, (hotelAmenity) => hotelAmenity.hotelAmenityPrices)
  @JoinColumn({ name: 'hotel_amenity_id' })
  hotelAmenity: HotelAmenity;

  @ManyToOne(() => HotelAgeCategory, (hotelAgeCategory) => hotelAgeCategory.hotelAmenityPrices)
  @JoinColumn({ name: 'hotel_age_category_id' })
  hotelAgeCategory: HotelAgeCategory;
}
