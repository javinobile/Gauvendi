import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import {
  HotelRestrictionCodeEnum,
  RestrictionEntity,
  HotelRestrictionSettingMode
} from '../enums/common';

// Re-export enum for external use
export { HotelRestrictionCodeEnum };

@Entity({ name: 'hotel_restriction_setting' })
@Index(['hotelId', 'restrictionEntity', 'restrictionCode'])
@Index(['hotelId'])
export class HotelRestrictionSetting extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

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
}
