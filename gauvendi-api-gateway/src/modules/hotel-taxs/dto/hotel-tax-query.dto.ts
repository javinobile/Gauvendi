import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";

export class HotelTaxQueryDto {
  @IsString()
  @IsNotEmpty()
  hotelCode: string;

  @OptionalArrayProperty()
  typeList?: string[];

  @OptionalArrayProperty()
  idList?: string[];

  @OptionalArrayProperty()
  sort?: string[];
}
