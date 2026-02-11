import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntityWithTranslations } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';
import { EventCategory } from './event-category.entity';
import { EventFeature } from './event-feature.entity';

@Entity({ name: 'event' })
@Index(['hotelId'])
@Index(['categoryId'])
@Index(['startDate'])
@Index(['endDate'])
@Index(['isVisible'])
export class Event extends BaseEntityWithTranslations {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: false, name: 'category_id' })
  categoryId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'labels' })
  labels: string[];

  @Column({ type: 'varchar', nullable: false, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'start_date' })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: false, name: 'end_date' })
  endDate: Date;

  @Column({ type: 'varchar', nullable: true, name: 'location', length: 255 })
  location: string;

  @Column({ type: 'text', nullable: true, name: 'note' })
  note: string;

  @Column({ type: 'boolean', nullable: false, name: 'is_visible', default: false })
  isVisible: boolean;

  // Relations
  @ManyToOne(() => Hotel, { nullable: false })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => EventCategory, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: EventCategory;

  @OneToMany(() => EventFeature, (eventFeature) => eventFeature.event)
  @JoinColumn({ name: 'event_id' })
  eventFeatures: EventFeature[];  
}
