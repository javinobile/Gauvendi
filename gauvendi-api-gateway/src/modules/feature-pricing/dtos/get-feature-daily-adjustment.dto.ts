import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class GetFeatureDailyAdjustmentsDto {

  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}

