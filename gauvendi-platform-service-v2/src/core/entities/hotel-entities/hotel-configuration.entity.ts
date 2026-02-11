import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithDeleted } from '../../database/entities/base.entity';
import { HotelConfigurationTypeEnum, RoundingModeEnum } from '../../enums/common';
import { Hotel } from './hotel.entity';

export interface HotelPricingDecimalRoundingRuleConfigValue {
  metadata?: {
    roundingMode: RoundingModeEnum;
    decimalUnits: number;
  };
}

export interface HotelPopularAiRecommendationSettingConfigValue {
  popularRate: number;
  periodRate: number;
  historyRate: number;
  priceRate: number;
}

export interface HotelOurTipAiRecommendationSettingConfigValue {
  popularity5Rate: number;
  popularity4Rate: number;
  productPopularityRate: number;
  penaltyRate: number;
}

export interface HotelPriceSettingsConfigValue {
  metadata?: {
    pullPriceDate: number;
  };
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
