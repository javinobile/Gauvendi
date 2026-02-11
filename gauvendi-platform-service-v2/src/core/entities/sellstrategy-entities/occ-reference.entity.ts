import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'occ_reference' })
@Index(['hotelId'])
@Index(['date'])
@Index(['hotelId', 'date'])
export class OccReference extends BaseEntity {
  @PrimaryColumn({ type: 'uuid', name: 'hotel_id' })
  hotelId: string;

  @PrimaryColumn({ type: 'timestamptz', name: 'date' })
  date: Date;

  @Column({ type: 'float', nullable: true, name: 'occ_rate', default: 0 })
  occRate: number;
}
