import { DayOfWeek } from "@src/core/enums/common.enum";
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateOrUpdateRatePlanFeatureDailyRateDto {

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  dayList: DayOfWeek[];

  @IsNotEmpty()
  @IsUUID()
  featureId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsNotEmpty()
  @IsNumber()
  rate: number;

  @IsOptional()
  ratePlanId: string;

  @IsOptional()
  @IsArray()
  ratePlanIdList?: string[];
}
