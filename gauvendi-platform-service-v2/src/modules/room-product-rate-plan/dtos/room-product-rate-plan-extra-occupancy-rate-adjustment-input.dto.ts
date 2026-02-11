import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { Weekday } from '@src/core/enums/common';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsUUID
} from 'class-validator';

export class RoomProductRatePlanExtraOccupancyRateAdjustmentInput {
  @IsUUID()
  rfcRatePlanId: string;

  @IsUUID()
  hotelId: string;

  @IsInt()
  extraPeople: number;

  @IsNumber()
  extraRate: number;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsEnum(Weekday, { each: true })
  @OptionalArrayProperty()
  dayList: Weekday[];
}
