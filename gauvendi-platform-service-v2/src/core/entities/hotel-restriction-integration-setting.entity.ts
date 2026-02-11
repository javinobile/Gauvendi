import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import {
  HotelRestrictionCodeEnum,
  HotelRestrictionSettingMode,
  RestrictionEntity
} from '../enums/common';

// Re-export enum for external use
export { HotelRestrictionCodeEnum };

@Entity({ name: 'hotel_restriction_integration_setting' })
@Index(['hotelId', 'ratePlanId', 'roomProductId', 'pmsMappingCode'], { unique: true })
@Index(['hotelId'])
@Index(['hotelId', 'roomProductId'])
@Index(['hotelId', 'ratePlanId', 'roomProductId', 'pmsMappingCode', 'restrictionEntity', 'restrictionCode'])
export class HotelRestrictionIntegrationSetting extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true, name: 'rate_plan_id' })
  ratePlanId: string;

  @Column({ type: 'uuid', nullable: true, name: 'room_product_id' })
  roomProductId: string;

  @Column({ type: 'text', nullable: false, name: 'pms_mapping_code' })
  pmsMappingCode: string;

  @Column({ type: 'text', nullable: false, name: 'restriction_entity' })
  restrictionEntity: RestrictionEntity;

  @Column({ type: 'text', nullable: false, name: 'restriction_code' })
  restrictionCode: HotelRestrictionCodeEnum;

  @Column({
    type: 'text',
    nullable: false,
    name: 'mode',
    default: HotelRestrictionSettingMode.NEUTRAL
  })
  mode: HotelRestrictionSettingMode;

  // relations
}
