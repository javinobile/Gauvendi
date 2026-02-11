import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { RatePlan } from './rate-plan.entity';

@Entity('rate_plan_translation')
@Index(['hotelId', 'ratePlanId', 'languageCode'], { unique: true })
@Index(['hotelId', 'ratePlanId'])
@Index(['hotelId'])
@Index(['hotelId', 'languageCode'])
export class RatePlanTranslation extends BaseEntity {
  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: false })
  ratePlanId: string;

  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({
    type: 'text',
    name: 'language_code',
    nullable: false
  })
  languageCode: string;

  @Column({ type: 'text', name: 'name', nullable: false })
  name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  // relation
  @ManyToOne(() => RatePlan, (ratePlan) => ratePlan.ratePlanTranslations)
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;
}
