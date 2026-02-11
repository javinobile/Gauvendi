import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

export class AttributeDto {
  @IsString()
  @IsOptional()
  key: string;

  @IsString()
  @IsOptional()
  value: string;
}

export class UpdateDynamicContentTranslationDataAttributeInput {
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  entityTranslationConfigCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attribute?: AttributeDto[];
}

export class UpdateDynamicContentTranslationDataInput {
  @IsString()
  @IsNotEmpty()
  localeCode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDynamicContentTranslationDataAttributeInput)
  data: UpdateDynamicContentTranslationDataAttributeInput[];
}

export class UpdateDynamicContentTranslationInput {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDynamicContentTranslationDataInput)
  localeData: UpdateDynamicContentTranslationDataInput[];
}
