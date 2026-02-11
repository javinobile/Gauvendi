import { BaseEntity } from 'src/core/database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('apaleo_rate_plan_pms_mapping')
export class ApaleoRatePlanPmsMapping extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', name: 'rate_plan_id', nullable: true })
  ratePlanId: string;

  @Column({ type: 'uuid', name: 'room_product_id', nullable: true })
  roomProductId: string;

  @Column({ type: 'varchar', nullable: true, length: 60, name: 'mapping_rate_plan_code' })
  mappingRatePlanCode: string;
}
