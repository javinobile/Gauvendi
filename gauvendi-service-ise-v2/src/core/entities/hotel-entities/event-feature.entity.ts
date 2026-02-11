import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Event } from './event.entity';

@Entity({ name: 'event_feature' })
@Index(['eventId'])
@Index(['hotelRetailFeatureId'])
export class EventFeature extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'event_id' })
  eventId: string;

  @Column({ type: 'uuid', nullable: true, name: 'hotel_retail_feature_id' })
  hotelRetailFeatureId: string;

  // Relations
  @ManyToOne(() => Event, (event) => event.eventFeatureList)
  @JoinColumn({ name: 'event_id' })
  event: Event;
}
