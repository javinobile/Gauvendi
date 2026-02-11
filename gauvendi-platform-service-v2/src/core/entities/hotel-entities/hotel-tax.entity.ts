import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import { NumericColumn } from '../../decorators/numeric-column.decorator';
import { HotelTaxSetting } from './hotel-tax-setting.entity';
import { Hotel } from './hotel.entity';

@Entity({ name: 'hotel_tax' })
@Index(['hotelId'])
@Index(['hotelId', 'code'], { unique: true })
@Index(['isDefault'])
@Index(['validFrom'])
@Index(['validTo'])
@Index(['mappingPmsTaxCode'])
export class HotelTax extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: false, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: false, name: 'name', length: 255 })
  name: string;

  @NumericColumn({ nullable: false, name: 'rate', precision: 26, scale: 4 })
  rate: number;

  @Column({ type: 'date', nullable: true, name: 'valid_from' })
  validFrom: Date | null;

  @Column({ type: 'date', nullable: true, name: 'valid_to' })
  validTo: Date | null;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 1000 })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_pms_tax_code', length: 100 })
  mappingPmsTaxCode: string;

  @Column({ type: 'boolean', nullable: false, name: 'is_default', default: false })
  isDefault: boolean;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @OneToMany(() => HotelTaxSetting, (hotelTaxSetting) => hotelTaxSetting.hotelTax)
  hotelTaxSettings: HotelTaxSetting[];
}
