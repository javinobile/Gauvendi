import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
export class ExtraOccupancyRateDto {
  extraPeople: number;

  extraRate: number;
}

export class DailyExtraOccupancyRateDto {
  date: Date;

  rfcRatePlanId: string;

  @ValidateNested({ each: true })
  @Type(() => ExtraOccupancyRateDto)
  extraOccupancyRateList: ExtraOccupancyRateDto[];
}
