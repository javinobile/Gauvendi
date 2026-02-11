import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from '../../../core/dtos/common.dto';

export class RatePlanExtraServiceFilterDto extends Filter {
  @ApiProperty({
    description: 'List of rate plan IDs to filter by',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174001']
  })
  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsUUID('4', { each: true })
  ratePlanIdList?: string[];

  @ApiProperty({
    description: 'List of service IDs to filter by',
    type: [String],
    required: false,
    example: ['123e4567-e89b-12d3-a456-426614174002']
  })
  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  serviceIdList?: string[];

  @ApiProperty({
    description: 'Filter by service type',
    required: false,
    example: 'INCLUDED',
    enum: ['INCLUDED', 'EXTRA', 'MANDATORY']
  })
  @IsOptional()
  type?: string;
}
