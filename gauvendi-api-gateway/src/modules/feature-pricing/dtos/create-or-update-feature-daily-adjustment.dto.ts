import { DayOfWeek, FeatureDailyAdjustmentType, SessionOfYear } from "@src/core/enums/common.enum";
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateOrUpdateFeatureDailyAdjustmentsDto {
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @IsOptional()
  dayList: DayOfWeek[];

  @IsArray()
  @IsEnum(SessionOfYear, { each: true })
  @IsOptional()
  sessionOfYearList: SessionOfYear[];

  @IsNotEmpty()
  @IsUUID()
  featureId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsNumber()
  adjustmentValue: number;

  @IsNotEmpty()
  @IsEnum(FeatureDailyAdjustmentType)
  adjustmentType: FeatureDailyAdjustmentType;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}
