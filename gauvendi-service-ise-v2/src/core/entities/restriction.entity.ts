import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../database/entities/base.entity';
import { RoomProduct } from './room-product.entity';

export enum RestrictionConditionType {
  ClosedToStay = 'ClosedToStay',
  ClosedToArrival = 'ClosedToArrival',
  ClosedToDeparture = 'ClosedToDeparture',
}

export enum Weekday {
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
}

@Entity()
@Index(['hotelId'])
@Index(['hotelId', 'type'])
@Index(['hotelId', 'fromDate', 'toDate'])
@Index(['hotelId', 'type', 'fromDate', 'toDate'])
@Index(['hotelId', 'type', 'fromDate', 'toDate', 'weekdays'])
@Index(['hotelId', 'type', 'fromDate', 'toDate', 'roomProductIds'])
@Index(['hotelId', 'type', 'fromDate', 'toDate', 'ratePlanIds'])
@Index(['hotelId', 'type', 'fromDate', 'toDate', 'roomProductIds', 'ratePlanIds'])
export class Restriction extends BaseEntity {
  @Column({ type: 'varchar', name: 'hotel_id', length: 36, nullable: false })
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
}
