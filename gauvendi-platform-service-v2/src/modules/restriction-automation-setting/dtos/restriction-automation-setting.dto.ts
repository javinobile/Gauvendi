import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { Filter } from '@src/core/dtos/common.dto';
import {
  RestrictionAutomationSettingRules,
  RestrictionAutomationSettings,
  RestrictionAutomationSettingTypeEnum
} from '@src/core/entities/restriction-automation-setting.entity';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class RestrictionAutomationSettingFilterDto extends Filter {
  @IsUUID()
  hotelId: string;

  @IsUUID()
  @IsOptional()
  referId?: string;

  @OptionalArrayProperty()
  @IsEnum(RestrictionAutomationSettingTypeEnum, { each: true })
  types?: RestrictionAutomationSettingTypeEnum[];
}

export class RestrictionAutomationSettingInputDto {
  @IsUUID()
  hotelId: string;

  @IsEnum(RestrictionAutomationSettingTypeEnum)
  type: RestrictionAutomationSettingTypeEnum;

  @IsUUID()
  referenceId: string;

  @IsBoolean()
  @IsOptional()
  isEnabled: boolean;

  @IsOptional()
  @IsObject()
  rules?: RestrictionAutomationSettingRules;

  @IsOptional()
  @IsObject()
  settings?: RestrictionAutomationSettings;
}
