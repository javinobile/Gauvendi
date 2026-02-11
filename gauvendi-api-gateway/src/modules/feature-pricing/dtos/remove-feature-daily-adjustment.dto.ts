import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class RemoveFeatureDailyAdjustmentsDto {

  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsUUID()
  featureId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}