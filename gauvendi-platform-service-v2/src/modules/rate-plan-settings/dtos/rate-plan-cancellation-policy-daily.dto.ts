import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { DayOfWeek } from '@src/core/enums/common';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RatePlanCancellationPolicyDailyFilterDto {
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  ratePlanIdList?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;
}

export class CreateOrUpdateRatePlanCancellationPolicyDailyInputDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsNotEmpty()
  @IsUUID('4')
  hotelId: string;

  @IsNotEmpty()
  @IsUUID('4')
  ratePlanId: string;

  @IsNotEmpty()
  @IsString()
  cxlPolicyCode: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsNotEmpty()
  @IsArray()
  @OptionalArrayProperty()
  daysOfWeek?: DayOfWeek[];
}

export class DeleteRatePlanCancellationPolicyDailyInputDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsNotEmpty()
  @IsUUID('4')
  hotelId: string;

  @IsNotEmpty()
  @IsUUID('4')
  ratePlanId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsNotEmpty()
  @IsArray()
  @OptionalArrayProperty()
  daysOfWeek?: DayOfWeek[];
}

export class RatePlanCxlPolicyDailyDto {
  id: string;
  hotelId: string;
  ratePlanId: string;
  cxlPolicyCode: string;
  date: string;
  isAdjusted: boolean;
}
