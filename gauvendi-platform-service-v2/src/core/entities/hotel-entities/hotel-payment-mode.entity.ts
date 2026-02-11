import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';
import { HotelPaymentModeCodeEnum } from '../../enums/common';


@Entity({ name: 'hotel_payment_mode' })
@Index(['hotelId'])
@Index(['code'])
@Index(['hotelId', 'code'], { unique: true })
export class HotelPaymentMode extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: false, name: 'code', length: 60 })
  code: HotelPaymentModeCodeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  // Relations
  @ManyToOne(() => Hotel, { nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
