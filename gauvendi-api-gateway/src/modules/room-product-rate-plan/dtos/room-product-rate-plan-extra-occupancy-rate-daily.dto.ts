import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { IsDateString, IsNotEmpty, IsUUID } from "class-validator";

export class RoomProductRatePlanExtraOccupancyRateDailyFilter {
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsUUID("4", { each: true })
  @OptionalArrayProperty()
  roomProductRatePlanIds: string[];
}

export type RoomProductRatePlanExtraOccupancyRateDto = {
  extraPeople: number;
  extraRate: number;
};

export type RoomProductRatePlanDailyExtraOccupancyRateDto = {
  roomProductRatePlanId: string;
  date: Date;
  extraOccupancyRateList: RoomProductRatePlanExtraOccupancyRateDto[];
};
