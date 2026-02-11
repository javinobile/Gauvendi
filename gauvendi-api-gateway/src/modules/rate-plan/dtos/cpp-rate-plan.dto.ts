import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { RoomRequestDto } from "@src/core/dtos/room-request.dto";
import { Type } from "class-transformer";
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";



export class CppRatePlanFilterDto {
  @IsDateString()
  arrival: string;

  @IsDateString()
  departure: string;

  @IsString({ each: true })
  @OptionalArrayProperty()
  featureCodeList: string[];

  @IsString({ each: true })
  @OptionalArrayProperty()
  promoCodeList?: string[];

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomRequestDto)
  roomRequestList: RoomRequestDto[];

  @IsString({ each: true })
  @OptionalArrayProperty()
  promoCodes?: string[];

  @IsString()
  @IsOptional()
  translateTo?: string;
}

export interface CppRatePlanResultDto {
  id: string;
  name: string;
  code: string;
  description: string;
  promoCodeList: string[];
  availableProducts: number;
  appliedPromoCodeList: string[] | null;
}
