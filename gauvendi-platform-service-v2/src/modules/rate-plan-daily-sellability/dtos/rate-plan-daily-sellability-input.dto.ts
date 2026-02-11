import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '@src/core/enums/common';
import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { DistributionChannel } from 'src/core/entities/room-product.entity';

export class RatePlanDailySellabilityInputDto {
  @ApiProperty({
    description: 'Adjustment ID (optional, for updates)',
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
  @IsNotEmpty()
  @IsUUID('4')
  hotelId: string;

  @ApiProperty({
    description: 'Rate plan ID (maps from Java salesPlanId)',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsNotEmpty()
  @IsUUID('4')
  ratePlanId: string;

  @ApiProperty({
    description: 'Distribution channel',
    enum: DistributionChannel,
    example: DistributionChannel.GV_SALES_ENGINE
  })
  @IsNotEmpty()
  distributionChannel: DistributionChannel;

  @ApiProperty({
    description: 'Whether the rate plan should be sellable',
    example: true
  })
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  isSellable?: boolean;

  @ApiProperty({
    description: 'Start date for the adjustment period',
    example: '2024-01-01'
  })
  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @ApiProperty({
    description: 'End date for the adjustment period',
    example: '2024-01-31'
  })
  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsNotEmpty()
  @IsArray()
  @OptionalArrayProperty()
  daysOfWeek?: DayOfWeek[];
}
