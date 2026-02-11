import { HotelConfigurationTypeEnum } from "@src/core/enums/common.enum";
import { IsNotEmpty, IsString, IsObject, IsEnum } from "class-validator";

export class CreateOrUpdateHotelConfigurationDto {
  @IsEnum(HotelConfigurationTypeEnum)
  @IsNotEmpty()
  configType: HotelConfigurationTypeEnum;

  @IsObject()
  @IsNotEmpty()
  configValue: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  hotelCode: string;
}