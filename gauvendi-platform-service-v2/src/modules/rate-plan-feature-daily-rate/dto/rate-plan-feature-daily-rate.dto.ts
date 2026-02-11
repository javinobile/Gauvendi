import { ApiProperty } from '@nestjs/swagger';

export class RatePlanFeatureDailyRateDto {
  @ApiProperty({ description: 'Rate plan feature daily rate ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  ratePlanId: string;

  @ApiProperty({ description: 'Feature ID', example: 'feature-uuid' })
  featureId: string;

  @ApiProperty({ description: 'Daily rate for the feature', example: '25.50' })
  rate: string;

  @ApiProperty({ description: 'Date for the rate', example: '2023-12-01' })
  date: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Update timestamp' })
  updatedAt?: Date;
}
