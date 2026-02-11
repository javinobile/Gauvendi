import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { Hotel } from './hotel.entity';

export enum HotelConfigurationTypeEnum {
  DISABLE_STAY_OPTION_PRICE_CLUSTERING = 'DISABLE_STAY_OPTION_PRICE_CLUSTERING',
  DEFAULT_BOOKING_ROOM_STATUS = 'DEFAULT_BOOKING_ROOM_STATUS',
  ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING = 'ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING',
  PROPERTY_BRANDING = 'PROPERTY_BRANDING',
  LAST_OPENING_AVAILABILITY_DATE = 'LAST_OPENING_AVAILABILITY_DATE',
  PRIORITY_WEIGHT = 'PRIORITY_WEIGHT',
  BOOKING_SETTINGS = 'BOOKING_SETTINGS',
  PRICING_SETTINGS = 'PRICING_SETTINGS',
  UI_THEME_SETTINGS = 'UI_THEME_SETTINGS',
  AVAILABILITY_SETTINGS = 'AVAILABILITY_SETTINGS',
  PRICING_DECIMAL_ROUNDING_RULE = 'PRICING_DECIMAL_ROUNDING_RULE',
  FONT_FAMILY_PRIMARY = 'FONT_FAMILY_PRIMARY',
  ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING = 'ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING',
  ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING = 'ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING',
  RECEPTION_OPERATION_CLOSING = 'RECEPTION_OPERATION_CLOSING',
  ISE_PRICING_DISPLAY = 'ISE_PRICING_DISPLAY',
  WHITELABEL_SETTING = 'WHITELABEL_SETTING',
  TIME_SLICE_CONFIGURATION = 'TIME_SLICE_CONFIGURATION',
  ISE_FEATURE_SORTING_DISPLAY='ISE_FEATURE_SORTING_DISPLAY'
}





@Entity({ name: 'hotel_configuration' })
@Index(['hotelId'])
@Index(['configType'])
@Index(['hotelId', 'configType'], { unique: true })
export class HotelConfiguration extends BaseEntityWithDeleted {
  @Column({ type: 'uuid', nullable: true, name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'jsonb', nullable: true, name: 'config_value' })
  configValue: Record<string, any>;

  @Column({ type: 'varchar', nullable: false, name: 'config_type', length: 60 })
  configType: HotelConfigurationTypeEnum;

  // Relations
  @ManyToOne(() => Hotel, { nullable: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;
}
