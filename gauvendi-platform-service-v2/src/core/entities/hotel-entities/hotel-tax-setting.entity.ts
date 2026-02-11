import { ServiceTypeEnum } from '../../enums/common';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';
import { HotelTax } from './hotel-tax.entity';

@Entity({ name: 'hotel_tax_setting' })
@Index(['hotelId'])
@Index(['serviceCode'])
@Index(['serviceType'])
@Index(['taxCode'])
@Index(['hotelId', 'serviceCode'])
@Index(['hotelId', 'serviceType'])
export class HotelTaxSetting extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: false, name: 'service_code', length: 60 })
  serviceCode: string;

  @Column({ type: 'varchar', nullable: false, name: 'service_type', length: 255 })
  serviceType: ServiceTypeEnum;

  @Column({ type: 'varchar', nullable: false, name: 'tax_code' })
  taxCode: string;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 1000 })
  description: string;

  @ManyToOne(() => Hotel, (hotel) => hotel.hotelTaxSettings)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => HotelTax, (hotelTax) => hotelTax.hotelTaxSettings)
  @JoinColumn([
    { name: 'hotel_id', referencedColumnName: 'hotelId' },
    { name: 'tax_code', referencedColumnName: 'code' }
  ])
  hotelTax: HotelTax;
}
