import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';

export enum MarketSegmentStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity({ name: 'hotel_market_segment' })
@Index(['hotelId'])
@Index(['code'])
@Index(['status'])
@Index(['hotelId', 'code'], { unique: true })
export class HotelMarketSegment extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: false, name: 'code', length: 20 })
  code: string;

  @Column({ type: 'varchar', nullable: false, name: 'name', length: 30 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 40 })
  description: string;

  @Column({ type: 'varchar', nullable: false, name: 'status', length: 10, default: MarketSegmentStatusEnum.INACTIVE })
  status: MarketSegmentStatusEnum;

  // Relations
  @ManyToOne(() => Hotel, { nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
