import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class DynamicContentTranslationFilterDto {
  @IsUUID()
  hotelId: string;

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  localeCodes?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  entityIds?: string[];

  @IsOptional()
  @IsString()
  entityCode?: string;
}

export class DynamicContentTranslationDto {
  id: string;
  entityId: string;
  localeCode: string;
  entityTranslationConfigCode: string;
  attribute: any[] | null;
  entityMetadata: any;
}
