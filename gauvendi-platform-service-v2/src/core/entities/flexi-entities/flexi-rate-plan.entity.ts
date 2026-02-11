import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('flexi_rate_plan')
export class FlexiRatePlan extends BaseEntity {
  @Column({ type: 'uuid', name: 'flexi_hotel_id' })
  @Index()
  flexiHotelId: string;

  @Column({ name: 'sales_plan_id', type: 'uuid' })
  salesPlanId: string; // GV

  @Column({ name: 'code', type: 'varchar', length: 255 })
  code: string; // flexi rate plan

  @Column({
    type: 'boolean',
    name: 'extra_service_included',
    default: false
  })
  extraServiceIncluded: boolean;
}
