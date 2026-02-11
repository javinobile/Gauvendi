import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Filter } from '../../../core/dtos/common.dto';
import { RatePlanTypeEnum } from 'src/core/enums/common';

export class SmartFindingPromoCodeFilterDto extends Filter {
  @ApiProperty({ description: 'Property/Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'Search query', example: 'PROMO' })
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class SmartFindingPromoCodeDto {
  @ApiProperty({ description: 'Promo code', example: 'SUMMER2024' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Sales plan ID', example: 'uuid-123' })
  @IsUUID()
  salesPlanId: string;

  @ApiProperty({ description: 'Sales plan code', example: 'STANDARD' })
  @IsString()
  salesPlanCode: string;

  @ApiProperty({ description: 'Sales plan name', example: 'Standard Rate' })
  @IsString()
  salesPlanName: string;

  @ApiPropertyOptional({ enum: RatePlanTypeEnum, description: 'Rate plan type' })
  @IsEnum(RatePlanTypeEnum)
  @IsOptional()
  type?: RatePlanTypeEnum;
}
