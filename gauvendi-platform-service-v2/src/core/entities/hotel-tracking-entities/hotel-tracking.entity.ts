import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum HotelTrackingTypeEnum {
  DUETTO = 'DUETTO',
  COOKIEBOT = 'COOKIEBOT',
  USERCENTRICS_CMP = 'USERCENTRICS_CMP',
  META_CONVERSION_API = 'META_CONVERSION_API',
}

@Entity('hotel_tracking')
@Index(['hotelId', 'hotelTrackingType'], { unique: true })
export class HotelTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hotel_id', type: 'uuid' })
  @Index()
  hotelId: string;

  @Column({ name: 'hotel_code', type: 'varchar', length: 50 })
  @Index()
  hotelCode: string;

  @Column({
    name: 'hotel_tracking_type',
    type: 'varchar',
    length: 50,
  })
  hotelTrackingType: HotelTrackingTypeEnum;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
