import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { IsDaysOfWeekRequired } from '@src/core/decorators/date.decorator';
import { DayOfWeek } from '@src/core/enums/common.enum';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RatePlanPaymentTermDailyFilterDto {
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



export class CreateOrUpdateRatePlanPaymentTermDailyInputDto {
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
  paymentTermCode: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsNotEmpty()
  @IsArray()
  @OptionalArrayProperty()
  @IsDaysOfWeekRequired()
  daysOfWeek?: DayOfWeek[];
}

export class DeleteRatePlanPaymentTermDailyInputDto {
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

export class RatePlanPaymentTermDailyDto {
  id: string;
  hotelId: string;
  ratePlanId: string;
  paymentTermCode: string;
  date: string;
}

