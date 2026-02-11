import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { RoomProductType } from "@src/core/enums/common.enum";
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class RatePlanProductsToSellDailyDto {
  roomProductIds: string[];
  productToSell: number;
  date: string;
}

export class RatePlanProductsToSellDailyFilterDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsOptional()
  ratePlanId: string;

  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @IsDateString()
  @IsNotEmpty()
  toDate: string;

  @IsOptional()
  @IsEnum(RoomProductType, { each: true })
  @OptionalArrayProperty()
  types: RoomProductType[];
}
