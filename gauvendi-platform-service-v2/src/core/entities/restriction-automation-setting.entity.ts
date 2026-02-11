// restriction-automation.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

export enum RestrictionAutomationSettingTypeEnum {
  ROOM_PRODUCT = 'ROOM_PRODUCT',
  RATE_PLAN = 'RATE_PLAN'
}

export enum GapModeEnum {
  FILLING = 'FILLING', // Fill the gap with reduced length of stay
  MAXIMUM = 'MAXIMUM', // Fill the gap with maximum length of stay

  // default
  DEFAULT = 'DEFAULT',
}

export enum WeekdayEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface RestrictionAutomationSettings {
  minLOS?: number; // minimum length of stay
  maxLOS?: number; // maximum length of stay
  minLOSThrough?: {
    [key in WeekdayEnum]: number;
  }; // minimum length of stay through
  maxLOSThrough?: {
    [key in WeekdayEnum]: number;
  }; // maximum length of stay through
  minAdv?: number; // minimum advance booking
  maxAdv?: number; // maximum advance booking
  isCTA?: boolean; // is Closed To Arrival
  isCTD?: boolean; // is Closed To Departure
  gapMode?: GapModeEnum; // gap mode
  [key: string]: any; // allow future extension
}

export interface RestrictionAutomationSettingRules {
  occupancyThreshold?: {
    // occupancy threshold
    operator: 'lt' | 'lte' | 'eq' | 'gte' | 'gt'; // <, <=, =, >=, >
    value: number; // % occupancy
  };
  [key: string]: any; // allow future extension
}

@Index('ras_unique_idx', ['hotelId', 'type', 'referenceId'], { unique: true })
@Index('ras_hotel_id_idx', ['hotelId'])
@Index('ras_hotel_id_type_idx', ['hotelId', 'type'])
@Index('ras_reference_id_idx', ['referenceId'])
@Entity('restriction_automation_setting')
export class RestrictionAutomationSetting extends BaseEntity {
  @Column({ type: 'uuid', nullable: false, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'text', nullable: false, name: 'type' })
  type: RestrictionAutomationSettingTypeEnum;

  @Column({ type: 'uuid', nullable: false, name: 'reference_id' })
  referenceId: string;

  @Column({ default: true, name: 'is_enabled' })
  isEnabled: boolean;

  // Store all automation rules as JSON
  @Column({ type: 'jsonb', nullable: true, name: 'rules' })
  rules: RestrictionAutomationSettingRules;

  // Store global settings separately
  @Column({ type: 'jsonb', nullable: true, name: 'settings' })
  settings: RestrictionAutomationSettings;

  @OneToOne(() => RoomProduct, (roomProduct) => roomProduct.roomProductRestrictionAutomateSetting)
  @JoinColumn({ name: 'reference_id', referencedColumnName: 'id' })
  roomProduct: RoomProduct;
}
