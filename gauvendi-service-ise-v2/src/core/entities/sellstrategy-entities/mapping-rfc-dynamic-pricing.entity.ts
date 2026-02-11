import { Column, Entity, Index, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hotel } from '../hotel-entities/hotel.entity';
import { RatePlan } from '../pricing-entities/rate-plan.entity';
import { RoomProduct } from '../room-product.entity';

@Entity({ name: 'mapping_rfc_dynamic_pricing' })
@Index(['hotelId'])
@Index(['ratePlanId'])
@Index(['roomProductId'])
export class MappingRfcDynamicPricing extends BaseEntity {

  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'rate_plan_id' })
  ratePlanId: string;

  @Column({ type: 'uuid', nullable: true, name: 'room_product_id' })
  roomProductId: string;

  @Column({ type: 'varchar', nullable: true, name: 'mapping_pms_rate_plan_code', length: 60 })
  mappingPmsRatePlanCode: string;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => RatePlan, { nullable: true })
  @JoinColumn({ name: 'rate_plan_id' })
  ratePlan: RatePlan;

  @ManyToOne(() => RoomProduct, { nullable: true })
  @JoinColumn({ name: 'room_product_id' })
  roomProduct: RoomProduct;
}
