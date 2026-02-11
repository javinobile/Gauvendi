import { ApiProperty } from '@nestjs/swagger';

export class RatePlanExtraServiceDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({ description: 'Rate plan ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  ratePlanId: string;

  @ApiProperty({ description: 'Service ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  serviceId: string;

  @ApiProperty({
    description: 'Service type',
    example: 'INCLUDED',
    enum: ['INCLUDED', 'EXTRA', 'MANDATORY']
  })
  type: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt?: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt?: Date;
}
