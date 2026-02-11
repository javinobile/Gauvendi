import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

export enum GoogleHotelStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

@Entity({ name: 'google_hotel' })
@Index(['hotelId'])
@Index(['hotelCode'])
@Index(['status'])
export class GoogleHotelEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'varchar', nullable: true, name: 'hotel_code', length: 255 })
  hotelCode: string;

  @Column({ type: 'int', nullable: true, name: 'total_date_count' })
  totalDateCount: number;

  @Column({ type: 'boolean', nullable: true, name: 'need_rounding' })
  needRounding: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'status', length: 255 })
  status: GoogleHotelStatusEnum;
}
