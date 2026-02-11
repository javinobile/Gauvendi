import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Filter } from "@src/core/dtos/common.dto";
import { MarketSegmentStatusEnum } from "@src/core/enums/common";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class HotelMarketSegmentFilterDto extends Filter {

  @IsString()
  @IsNotEmpty()
  propertyCode: string;

  @IsUUID("4")
  @OptionalArrayProperty()
  idList?: string[];

  @IsString({ each: true })
  @OptionalArrayProperty()
  codeList?: string[];

  @IsEnum(MarketSegmentStatusEnum, { each: true })
  @OptionalArrayProperty()
  statusList?: MarketSegmentStatusEnum[];
}

export class HotelMarketSegmentInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;


  @IsString()
  @IsNotEmpty()
  propertyCode: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MarketSegmentStatusEnum)
  @IsOptional()
  status?: MarketSegmentStatusEnum;
}

export class SetMarketSegmentStatusDto {

  @IsString()
  @IsNotEmpty()
  propertyCode: string;

  @IsUUID("4")
  @IsNotEmpty()
  @OptionalArrayProperty()
  idList: string[];

  @IsEnum(MarketSegmentStatusEnum)
  @IsNotEmpty()
  status: MarketSegmentStatusEnum;
}


export class HotelMarketSegmentDeleteDto {
  @IsUUID("4")
  @IsNotEmpty()
  id: string;
}