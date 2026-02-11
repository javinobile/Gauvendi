import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'event_label' })
export class EventLabel extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, name: 'name', length: 255 })
  name: string;
}
