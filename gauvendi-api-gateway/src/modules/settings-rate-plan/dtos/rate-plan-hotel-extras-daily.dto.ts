import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { DayOfWeek } from "@src/core/enums/common.enum";
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class RatePlanHotelExtrasDailyFilterDto {
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @OptionalArrayProperty()
  ratePlanIdList?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;
}

export class CreateOrUpdateRatePlanExtrasDailyInputDto {
  @IsOptional()
  @IsUUID("4")
  id?: string;

  @IsNotEmpty()
  @IsUUID("4")
  hotelId: string;

  @IsNotEmpty()
  @IsUUID()
  ratePlanId: string;

  @IsNotEmpty()
  @IsString({ each: true })
  @OptionalArrayProperty()
  hotelExtrasCodeList: string[];

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

export class DeleteRatePlanExtrasDailyInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @IsNotEmpty()
  @IsUUID()
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

export class RatePlanHotelExtrasDailyDto {
  id: string;
  ratePlanId: string;
  isAdjusted: boolean;
  date: string;
  hotelExtrasList: {
    id: string;
    name: string;
    code: string;
    hotelAmenityPriceList: {
      price: number;
      hotelAgeCategory: {
        name: string;
        code: string;
      };
    }[];
  }[];
}
