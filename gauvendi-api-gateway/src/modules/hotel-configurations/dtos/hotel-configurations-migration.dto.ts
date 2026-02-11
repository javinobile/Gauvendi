import { HotelConfigurationTypeEnum } from "@src/core/enums/common.enum";
import { IsNotEmpty, IsString, IsObject, IsEnum, IsUUID } from "class-validator";

export class HotelConfigurationsMigrationDto {
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}
