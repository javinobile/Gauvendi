import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from '../../../core/dtos/common.dto';
import { RatePlanPaymentSettlementSettingModeEnum } from 'src/core/enums/common';

export class RatePlanPaymentSettlementSettingFilterDto extends Filter {
  @ApiProperty({
    description: 'List of payment settlement setting IDs to filter by',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174000']
  })
  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsUUID('4', { each: true })
  idList?: string[];

  @ApiProperty({
    description: 'List of hotel IDs to filter by (maps from Java propertyIdList)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174001']
  })
  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsUUID('4', { each: true })
  hotelIdList?: string[];

  @ApiProperty({
    description: 'List of rate plan IDs to filter by (maps from Java salesPlanIdList)',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174002']
  })
  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsUUID('4', { each: true })
  ratePlanIdList?: string[];

  @ApiProperty({
    description: 'Payment settlement mode to filter by',
    enum: RatePlanPaymentSettlementSettingModeEnum,
    required: false,
    example: RatePlanPaymentSettlementSettingModeEnum.PMS_SETTLEMENT
  })
  @IsOptional()
  @IsEnum(RatePlanPaymentSettlementSettingModeEnum)
  mode?: RatePlanPaymentSettlementSettingModeEnum;
}
