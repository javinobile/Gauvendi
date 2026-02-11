import { Type } from 'class-transformer';
import { Allow, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class UpdateDynamicContentTranslationDataAttributeInput {
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  entityTranslationConfigCode: string;

  @IsOptional()
  @Allow()
  attribute?: { key: string; value: string }[];
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
