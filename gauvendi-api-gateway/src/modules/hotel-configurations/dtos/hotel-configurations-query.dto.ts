import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { HotelConfigurationTypeEnum } from "@src/core/enums/common.enum";
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class HotelConfigurationsQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  configTypeList: HotelConfigurationTypeEnum[];
}

export class HotelConfigurationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}

export class CreateOrUpdateAccessibilityIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  integration: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DeleteAccessibilityIntegrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsNotEmpty()
  integration: string;
}
