import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class RatePlanSellabilityDeleteDto {
  @ApiProperty({
    description:
      'Unique identifier for the rate plan sellability (optional - can delete by composite key)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiProperty({
    description: 'Hotel ID (maps from Java propertyId)',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID('4')
  hotelId: string;

  @ApiProperty({
    description: 'Rate plan ID (maps from Java salesPlanId)',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsUUID('4')
  ratePlanId: string;
}
