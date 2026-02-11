import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { OptionalArrayProperty } from "src/core/decorators/array-property.decorator";
import { Filter } from "../../../core/dtos/common.dto";

export class HotelTaxFilterDto extends Filter {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: "Property ID (Hotel ID)",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  })
  hotelCode: string;

  @IsUUID(4, { each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: "List of property tax IDs",
    type: [String],
    example: ["b2c3d4e5-f6g7-8901-bcde-f23456789012", "c3d4e5f6-g7h8-9012-cdef-g34567890123"],
  })
  @OptionalArrayProperty()
  idList?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional({
    description: "Set of service codes",
    type: [String],
    example: ["CITY_TAX", "TOURIST_TAX", "VAT"],
  })
  @OptionalArrayProperty()
  serviceCodeList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  typeList?: string[];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: "Language code to translate to",
    example: "en",
    maxLength: 10,
  })
  translateTo?: string;
}
