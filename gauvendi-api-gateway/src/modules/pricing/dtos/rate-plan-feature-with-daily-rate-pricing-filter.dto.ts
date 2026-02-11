import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsDate, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { IsDateRangeValid } from "src/core/decorators/is-date-range-valid.decorator";
import { HotelRetailFeatureStatusEnum } from "src/core/enums/common.enum";
import { Filter } from "src/core/dtos/common.dto";

export class OrderByDateDto {
  @ApiProperty({ description: "Date to sort by" })
  @IsDateString()
  sortByDate: Date;

  @ApiPropertyOptional({ description: "Sort order", example: "asc" })
  @IsString()
  @IsOptional()
  sortByOrder?: string;
}

export class RatePlanFeatureWithDailyRateListFilterDto extends Filter {
  @ApiProperty({ description: "Hotel code", example: "HTL001" })
  @IsString()
  hotelCode: string;

  @ApiProperty({ description: "Rate plan ID" })
  @IsUUID()
  ratePlanId: string;

  @ApiPropertyOptional({ description: "List of feature IDs to filter by", type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  featureIdList?: string[];

  @ApiPropertyOptional({ description: "List of feature category IDs to filter by", type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  featureCategoryIdList?: string[];

  @ApiProperty({ description: "Start date for the filter", example: "2023-12-01" })
  @IsDate()
  fromDate: Date;

  @IsDateRangeValid("fromDate", {
    message: "End date must be after or equal to start date",
  })
  @ApiProperty({ description: "End date for the filter", example: "2023-12-31" })
  @IsDate()
  toDate: Date;

  @ApiPropertyOptional({
    description: "Feature status list to filter by",
    enum: HotelRetailFeatureStatusEnum,
    isArray: true,
    default: [HotelRetailFeatureStatusEnum.ACTIVE],
  })
  @IsArray()
  @IsEnum(HotelRetailFeatureStatusEnum, { each: true })
  @IsOptional()
  featureStatusList?: HotelRetailFeatureStatusEnum[];

  @ApiProperty({ description: "Date to sort by" })
  @IsDate()
  sortByDate: Date;

  @ApiPropertyOptional({ description: "Sort order", example: "asc" })
  @IsString()
  @IsOptional()
  sortByDateOrder?: string;
}
