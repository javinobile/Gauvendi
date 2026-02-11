import { OptionalArrayProperty } from "@src/core/decorators/array-property.decorator";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

export class GetHotelEventsDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @OptionalArrayProperty()
  idList?: string[];

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  expand: string[];
}

export abstract class EventFeatureInputDto {
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsOptional()
  propertyRetailFeatureId?: string;
}

export abstract class HotelEventTranslationInputDto {
  @IsString()
  @IsNotEmpty()
  languageCode: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export abstract class UpdateHotelEventDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventFeatureInputDto)
  eventFeatureInputList?: EventFeatureInputDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HotelEventTranslationInputDto)
  translations?: HotelEventTranslationInputDto[]
}
