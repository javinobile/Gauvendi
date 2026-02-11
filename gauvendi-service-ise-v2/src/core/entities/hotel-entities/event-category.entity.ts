import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'event_category' })
@Index(['name'])
export class EventCategory extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'image_id' })
  imageId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;
}
