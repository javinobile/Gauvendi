import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from '../../../core/dtos/common.dto';

export class RatePlanFeatureDailyRateFilterDto extends Filter {
  @ApiPropertyOptional({ 
    description: 'List of rate plan IDs to filter by',
    example: ['rate-plan-uuid-1', 'rate-plan-uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  ratePlanIdList?: string[];

  @ApiPropertyOptional({ 
    description: 'List of feature IDs to filter by',
    example: ['feature-uuid-1', 'feature-uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  featureIdList?: string[];

  @ApiPropertyOptional({ 
    description: 'List of IDs to filter by',
    example: ['uuid-1', 'uuid-2'],
    type: [String]
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  @OptionalArrayProperty()
  idList?: string[];

  @ApiPropertyOptional({ 
    description: 'Start date for filtering',
    example: '2023-12-01',
    format: 'date'
  })
  @IsDate()
  @IsOptional()
  fromDate?: Date;

  @ApiPropertyOptional({ 
    description: 'End date for filtering',
    example: '2023-12-31',
    format: 'date'
  })
  @IsDate()
  @IsOptional()
  toDate?: Date;
}
