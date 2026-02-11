import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';

export enum FlexiChannelType {
  SITEMINDER = 'SITEMINDER',
  GOOGLE_HOTEL = 'GOOGLE_HOTEL'
}

@Entity('flexi_hotel')
export class FlexiHotel extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, default: FlexiChannelType.SITEMINDER })
  type: FlexiChannelType;
}
