import { ApiProperty } from "@nestjs/swagger";
import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { RatePlanStatusEnum } from "@src/core/enums/common.enum";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class RatePlanListDto {
  @ApiProperty()
  @IsUUID("4", { each: true })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [value];
  })
  hotelIds: string[];
}

export class MarketSegmentListDto extends RatePlanListDto {
  @OptionalArrayProperty()
  ids?: string[];
}

export class SalesPlanSellabilityListDto extends RatePlanListDto {
  @OptionalArrayProperty()
  ratePlanIds?: string[];
}

export class AvailableSalesPlanToDeriveListDto extends RatePlanListDto {
  @IsOptional()
  @IsEnum(RatePlanStatusEnum)
  status?: RatePlanStatusEnum
}

export class MappingHotelListDto extends RatePlanListDto {}
