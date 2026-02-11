import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';

export enum HotelRestrictionCodeEnum {
  RSTR_AVAILABLE_PERIOD = 'RSTR_AVAILABLE_PERIOD',
  RSTR_CLOSE_TO_ARRIVAL = 'RSTR_CLOSE_TO_ARRIVAL',
  RSTR_CLOSE_TO_DEPARTURE = 'RSTR_CLOSE_TO_DEPARTURE',
  RSTR_CLOSE_TO_STAY_SELLABILITY = 'RSTR_CLOSE_TO_STAY_SELLABILITY',
  RSTR_CLOSE_TO_STAY = 'RSTR_CLOSE_TO_STAY',
  RSTR_LOS_MAX = 'RSTR_LOS_MAX',
  RSTR_LOS_MIN = 'RSTR_LOS_MIN',
  RSTR_MAX_ADVANCE_BOOKING = 'RSTR_MAX_ADVANCE_BOOKING',
  RSTR_MIN_ADVANCE_BOOKING = 'RSTR_MIN_ADVANCE_BOOKING',
  RSTR_MIN_LOS_THROUGH = 'RSTR_MIN_LOS_THROUGH',
  RSTR_STAY_THROUGH_DAY = 'RSTR_STAY_THROUGH_DAY',
}

export enum RestrictionEntity {
  PROPERTY = 'PROPERTY',
  ROOM_PRODUCT = 'ROOM_PRODUCT',
  SALES_PLAN = 'SALES_PLAN',
  ROOM_PRODUCT_SALES_PLAN = 'ROOM_PRODUCT_SALES_PLAN',
}

export enum HotelRestrictionSettingMode {
  NEUTRAL = 'NEUTRAL',
  PULL = 'PULL',
  PUSH = 'PUSH',
}

@Entity({ name: 'hotel_restriction_setting' })
@Index(['hotelId', 'restrictionEntity', 'restrictionCode'])
@Index(['hotelId'])
export class HotelRestrictionSetting extends BaseEntity {
  @Column({ type: 'varchar', nullable: false, name: 'hotel_id', length: 36 })
  hotelId: string;

  @Column({ type: 'text', nullable: false, name: 'restriction_entity' })
  restrictionEntity: RestrictionEntity;

  @Column({ type: 'text', nullable: false, name: 'restriction_code' })
  restrictionCode: HotelRestrictionCodeEnum;

  @Column({ type: 'text', nullable: false, name: 'mode', default: HotelRestrictionSettingMode.NEUTRAL })
  mode: HotelRestrictionSettingMode;
}