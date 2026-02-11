import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from '../../../core/dtos/common.dto';

export class RatePlanPaymentTermSettingFilterDto extends Filter {
  @IsOptional()
  @IsUUID()
  hotelId?: string;

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  idList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  hotelIdList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  ratePlanIdList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  hotelPaymentTermIdList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  supportedPaymentMethodCodes?: string[];

  @ApiProperty({
    description: 'Filter by default payment term status',
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
