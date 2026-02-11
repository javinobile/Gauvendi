import { FeatureDailyAdjustmentType } from '@src/core/entities/pricing-entities/feature-daily-adjustment.entity';
import { DayOfWeek, SeasonOfYear } from '@src/core/enums/common';

export interface CreateOrUpdateFeatureDailyAdjustmentsDto {
  dayList: DayOfWeek[];
  sessionOfYearList: SeasonOfYear[];
  featureId: string;
  fromDate: string;
  hotelId: string;
  adjustmentValue: number;
  adjustmentType: FeatureDailyAdjustmentType;
  toDate: string;
}
