import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class ApaleoRatePlanPmsMappingListFilter {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @OptionalArrayProperty()
  ratePlanIds?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  roomProductIds?: string[];
}

export class ApaleoRoomProductRatePlanPmsMappingInput {
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @IsUUID()
  @IsNotEmpty()
  roomProductId: string;

  @IsString()
  @IsOptional()
  mappingRatePlanCode: string;
}

export class ApaleoRoomProductRatePlanPmsMappingBulkInput {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoRoomProductRatePlanPmsMappingInput)
  mappingList?: ApaleoRoomProductRatePlanPmsMappingInput[];
}

export class ApaleoRatePlanPmsMappingInput {
  @IsUUID()
  @IsNotEmpty()
  ratePlanId: string;

  @IsString()
  @IsOptional()
  mappingRatePlanCode: string;
}

export class ApaleoRatePlanPmsMappingBulkInput {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApaleoRatePlanPmsMappingInput)
  mappingList?: ApaleoRatePlanPmsMappingInput[];
}
