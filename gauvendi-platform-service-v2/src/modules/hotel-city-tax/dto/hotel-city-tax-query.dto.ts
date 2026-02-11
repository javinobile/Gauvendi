import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { OptionalArrayProperty } from "@decorators/array-property.decorator";

export class HotelCityTaxQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  expand?: string[];
}
