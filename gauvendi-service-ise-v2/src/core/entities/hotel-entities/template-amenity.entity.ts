import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';

export enum AmenityTypeEnum {
  SERVICE = 'SERVICE',
  AMENITY = 'AMENITY',
  MEAL_PLAN = 'MEAL_PLAN',
}

export enum PricingUnitEnum {
  PERSON = 'PERSON',
  ROOM = 'ROOM',
  ITEM = 'ITEM',
}

export enum AmenityAvailabilityEnum {
  DAILY = 'DAILY',
  ONLY_ON_ARRIVAL = 'ONLY_ON_ARRIVAL',
  ONLY_ON_DEPARTURE = 'ONLY_ON_DEPARTURE',
}

@Entity({ name: 'template_amenity' })
@Index(['code'])
@Index(['name'])
@Index(['amenityType'])
@Index(['pricingUnit'])
@Index(['availability'])
@Index(['displaySequence'])
export class TemplateAmenity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true, name: 'icon_image_id' })
  iconImageId: string;

  @Column({ type: 'varchar', nullable: true, name: 'name', length: 255 })
  name: string;

  @Column({ type: 'varchar', nullable: true, name: 'code', length: 60 })
  code: string;

  @Column({ type: 'varchar', nullable: true, name: 'description', length: 500 })
  description: string;

  @Column({ type: 'varchar', nullable: true, name: 'amenity_type', length: 60 })
  amenityType: AmenityTypeEnum;

  @Column({ type: 'varchar', nullable: true, name: 'pricing_unit', length: 60 })
  pricingUnit: PricingUnitEnum;

  @Column({ type: 'varchar', nullable: true, name: 'availability', length: 60 })
  availability: AmenityAvailabilityEnum;

  @Column({ type: 'boolean', nullable: true, name: 'post_next_day' })
  postNextDay: boolean;

  @Column({ type: 'int', nullable: true, name: 'display_sequence' })
  displaySequence: number;
}
