import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CancellationFeeUnitEnum, CancellationPolicyDisplayUnitEnum } from 'src/core/enums/common';

export class HotelCancellationPolicyChangeDefaultInputDto {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: 'Hotel code',
    example: 'HTL001'
  })
  hotelCode: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: 'Rate plan ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  ratePlanId: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Hotel cancellation policy code',
    example: 'CXL001'
  })
  hotelCxlPolicyCode?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Hours prior to check-in for cancellation',
    example: 24,
    minimum: 0
  })
  hourPrior?: number;


  @IsOptional()
  @ApiPropertyOptional({
    description: 'Display unit for the cancellation period',
    example: 'hours'
  })
  @IsEnum(CancellationPolicyDisplayUnitEnum)
  displayUnit?: CancellationPolicyDisplayUnitEnum;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation fee value',
    example: 50.00,
    minimum: 0
  })
  cancellationFeeValue?: number;

  @IsEnum(CancellationFeeUnitEnum)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation fee unit type',
    enum: CancellationFeeUnitEnum,
    example: CancellationFeeUnitEnum.PERCENTAGE
  })
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Cancellation policy description',
    example: 'Free cancellation up to 24 hours before check-in. After that, 50% of the first night will be charged.'
  })
  description?: string;
}
