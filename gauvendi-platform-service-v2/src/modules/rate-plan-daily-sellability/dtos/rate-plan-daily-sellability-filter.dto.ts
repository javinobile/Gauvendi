import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsUUID, IsBoolean, IsDateString } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from '../../../core/dtos/common.dto';
import { DistributionChannel } from 'src/core/entities/room-product.entity';

export class RatePlanDailySellabilityFilterDto extends Filter {
  @ApiProperty({
    description: 'Hotel ID to filter by (maps from Java propertyId)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsOptional()
  @IsUUID('4')
  hotelId?: string;

  @ApiProperty({
    description: 'List of adjustment IDs to filter by',
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
    description: 'List of distribution channels to filter by',
    type: [String],
    required: false,
    example: [DistributionChannel.GV_SALES_ENGINE],
    enum: DistributionChannel,
    isArray: true
  })
  @IsOptional()
  @OptionalArrayProperty()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  distributionChannelList?: DistributionChannel[];

  @ApiProperty({
    description: 'Filter by sellability status',
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;

  @ApiProperty({
    description: 'Filter from date (inclusive)',
    required: false,
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    description: 'Filter to date (inclusive)',
    required: false,
    example: '2024-01-31'
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
