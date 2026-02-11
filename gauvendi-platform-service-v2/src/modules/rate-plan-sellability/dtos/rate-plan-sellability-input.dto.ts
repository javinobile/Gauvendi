import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsEnum, IsOptional, IsArray } from 'class-validator';
import { DistributionChannel } from 'src/core/enums/common';

export class RatePlanSellabilityInputDto {
  @ApiProperty({
    description: 'Unique identifier for the rate plan sellability (optional for create)',
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

  @ApiProperty({
    description: 'Distribution channels',
    enum: DistributionChannel,
    isArray: true,
    example: [DistributionChannel.GV_SALES_ENGINE, DistributionChannel.GV_VOICE]
  })
  @IsArray()
  @IsEnum(DistributionChannel, { each: true })
  distributionChannelList: DistributionChannel[];

  @ApiProperty({
    description: 'Whether the rate plan is sellable for this distribution channel',
    example: true
  })
  @IsBoolean()
  isSellable: boolean;
}
