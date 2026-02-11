import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RestrictionConditionType, RestrictionSourceType, Weekday } from '../enums/common';

// Interface for tracking the source of each restriction field
export interface RestrictionSourceMap {
  minLength?: RestrictionSourceType;
  maxLength?: RestrictionSourceType;
  minAdv?: RestrictionSourceType;
  maxAdv?: RestrictionSourceType;
  minLosThrough?: RestrictionSourceType;
  maxReservationCount?: RestrictionSourceType;

  isCTA?: RestrictionSourceType;
  isCTD?: RestrictionSourceType;
}

// Re-export enums for external use
export { RestrictionConditionType, RestrictionSourceType, Weekday };

@Entity()
@Index(['hotelId', 'fromDate', 'toDate'])
@Index(['hotelId', 'type', 'fromDate', 'toDate'])
export class Restriction extends BaseEntity {
  @Column({ type: 'uuid', name: 'hotel_id', nullable: false })
  hotelId: string;

  @Column({ type: 'text', name: 'type', nullable: false })
  type: RestrictionConditionType;

  @Column({ type: 'timestamptz', name: 'from_date', nullable: true })
  fromDate: Date;

  @Column({ type: 'timestamptz', name: 'to_date', nullable: true })
  toDate: Date;

  @Column({ type: 'jsonb', name: 'weekdays', nullable: true })
  weekdays: Weekday[];

  @Column({ type: 'uuid', name: 'room_product_ids', nullable: true, array: true })
  roomProductIds: string[];

  @Column({ type: 'text', name: 'rate_plan_ids', nullable: true, array: true })
  ratePlanIds: string[];

  @Column({ type: 'integer', name: 'min_length', nullable: true })
  minLength: number;

  @Column({ type: 'integer', name: 'max_length', nullable: true })
  maxLength: number;

  @Column({ type: 'integer', name: 'min_adv', nullable: true })
  minAdv: number;

  @Column({ type: 'integer', name: 'max_adv', nullable: true })
  maxAdv: number;

  @Column({ type: 'integer', name: 'min_los_through', nullable: true })
  minLosThrough: number;

  @Column({ type: 'integer', name: 'max_reservation_count', nullable: true })
  maxReservationCount: number;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata: any;

  @Column({ type: 'jsonb', name: 'restriction_source', nullable: true })
  restrictionSource?: RestrictionSourceMap;
}

export interface RestrictionMetadata {
  isAdjusted: boolean; // false -> manual adjustment, true -> automated adjustment
  inheritedFields?: any[]; // Fields inherited from parent rate plan
  parentRestrictionId?: string; // ID of the parent restriction this was derived from
  isDerived?: boolean; // Whether this restriction was derived from a parent
}
