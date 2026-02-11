import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class FlexiChannelFilter {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class CreateFlexiChannel {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @IsArray()
  @Type(() => FlexiChannelMapping)
  mappings: FlexiChannelMapping[];
}

export class UpdateFlexiChannel {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @IsArray()
  @Type(() => FlexiChannelMappingUpdate)
  mappings: FlexiChannelMappingUpdate[];
}

export class FlexiChannelMapping {
  @IsNotEmpty()
  @IsString()
  mappingHotelCode: string;

  @IsOptional()
  @IsString()
  name: string;
}

export class FlexiChannelMappingUpdate {
  @IsNotEmpty()
  @IsString()
  mappingHotelCode: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  id: string;
}

export class UpdateFlexiRoomMappings {
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @IsArray()
  @Type(() => UpdateFlexiRoomMapping)
  mappings: UpdateFlexiRoomMapping[];
}

export class UpdateFlexiRoomMapping {
  @IsOptional()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFlexiRoomProductMapping)
  roomProductList: UpdateFlexiRoomProductMapping[];
}

export class UpdateFlexiRoomProductMapping {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  mappingCode: string;

  @IsOptional()
  @IsBoolean()
  extraServiceIncluded: boolean;
}

export class UpdateFlexiRatePlanMappings {
  @IsNotEmpty()
  @IsUUID()
  hotelId: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @IsArray()
  @Type(() => UpdateFlexiRatePlanMapping)
  mappings: UpdateFlexiRatePlanMapping[];
}

export class UpdateFlexiRatePlanMapping {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFlexiRoomProductMapping)
  salesPlanList: UpdateFlexiRoomProductMapping[];
}
