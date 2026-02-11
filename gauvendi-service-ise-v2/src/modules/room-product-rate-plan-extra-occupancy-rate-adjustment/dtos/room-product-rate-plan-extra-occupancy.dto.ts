import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty } from 'class-validator';

export interface DailyRfcRatePlanExtraOccupancyRateFilter {
  fromDate: string;
  toDate: string;
  roomProductIds: string[];
  ratePlanIds: string[];
 
}

export class DailyRfcRatePlanExtraOccupancyRateFilterDto {
  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  toDate: string;

  @IsNotEmpty()
  @IsArray()
  rfcRatePlanIdList: string[];
}
