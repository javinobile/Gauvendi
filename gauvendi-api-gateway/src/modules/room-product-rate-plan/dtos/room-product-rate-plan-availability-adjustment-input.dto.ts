import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { DayOfWeek } from '@src/core/enums/common.enum';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsUUID
} from 'class-validator';

export class RoomProductRatePlanAvailabilityAdjustmentInputDto {
  @IsUUID()
  hotelId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  rfcRatePlanIdList?: string[];

  @IsBoolean()
  isSellable: boolean;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @OptionalArrayProperty()
  daysOfWeek?: DayOfWeek[];
}
