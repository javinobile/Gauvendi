import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import {
  CancellationFeeUnitEnum, CancellationPolicyDisplayUnitEnum, RatePlanAdjustmentType, RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoundingModeEnum,
  SellingStrategyTypeEnum
} from 'src/core/enums/common';
import { DistributionChannel } from '../enums';
import { CreateRatePlanTranslationDto } from './create-rate-plan.dto';

export class UpdateRatePlanPayloadDto {
  id: string;
  body: UpdateRatePlanDto;
}

export class UpdateRatePlanDto {
  id?: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ApiPropertyOptional({ description: 'Rate plan code', example: 'STANDARD' })
  @IsString()
  @Length(1, 50)
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Rate plan name', example: 'Standard Rate' })
  @IsString()
  @Length(1, 255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Hotel cancellation policy code' })
  @IsString()
  @IsOptional()
  hotelCxlPolicyCode?: string;

  @ApiPropertyOptional({ description: 'Payment term code' })
  @IsString()
  @IsOptional()
  paymentTermCode?: string;

  @ApiPropertyOptional({ enum: CancellationFeeUnitEnum, description: 'Cancellation fee unit' })
  @IsEnum(CancellationFeeUnitEnum)
  @IsOptional()
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @ApiPropertyOptional({ description: 'Cancellation fee value', example: 50.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cancellationFeeValue?: number;

  @ApiPropertyOptional({ description: 'Pay at hotel percentage', example: 100.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  payAtHotel?: number;

  @ApiPropertyOptional({ description: 'Pay on confirmation percentage', example: 0.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  payOnConfirmation?: number;

  @ApiPropertyOptional({ description: 'Hours prior to check-in', example: 24 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourPrior?: number;

  @ApiPropertyOptional({ enum: RatePlanStatusEnum, description: 'Rate plan status' })
  @IsEnum(RatePlanStatusEnum)
  @IsOptional()
  status?: RatePlanStatusEnum;

  @ApiPropertyOptional({ enum: RatePlanTypeEnum, description: 'Rate plan type' })
  @IsEnum(RatePlanTypeEnum)
  @IsOptional()
  type?: RatePlanTypeEnum;

  @ApiPropertyOptional({ enum: RoundingModeEnum, description: 'Rounding mode' })
  @IsEnum(RoundingModeEnum)
  @IsOptional()
  roundingMode?: RoundingModeEnum;

  @ApiPropertyOptional({ type: [String], description: 'Promo codes' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  promoCodeList?: string[];

  @ApiPropertyOptional({ description: 'Rate plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: CancellationPolicyDisplayUnitEnum, description: 'Display unit' })
  @IsEnum(CancellationPolicyDisplayUnitEnum)
  @IsOptional()
  displayUnit?: CancellationPolicyDisplayUnitEnum;

  @ApiPropertyOptional({ description: 'Mapping rate plan code' })
  @IsString()
  @IsOptional()
  mappingRatePlanCode?: string;

  @ApiPropertyOptional({ type: [String], description: 'Hotel extras code list' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hotelExtrasCodeList?: string[];

  @ApiPropertyOptional({ type: [CreateRatePlanTranslationDto], description: 'Translations' })
  @ValidateNested({ each: true })
  @Type(() => CreateRatePlanTranslationDto)
  @IsOptional()
  translationList?: CreateRatePlanTranslationDto[];

  @ApiPropertyOptional({ description: 'Adjustment value', example: 10.5 })
  @IsNumber()
  @IsOptional()
  adjustmentValue?: number;

  @ApiPropertyOptional({ enum: RatePlanAdjustmentType, description: 'Adjustment unit' })
  @IsEnum(RatePlanAdjustmentType)
  @IsOptional()
  adjustmentUnit?: RatePlanAdjustmentType;

  @ApiPropertyOptional({ description: 'Is primary rate plan', example: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'MRFC positioning mode', example: false })
  @IsBoolean()
  @IsOptional()
  mrfcPositioningMode?: boolean;

  @ApiPropertyOptional({ description: 'RFC attribute mode', example: false })
  @IsBoolean()
  @IsOptional()
  rfcAttributeMode?: boolean;

  @ApiPropertyOptional({
    type: [String],
    enum: DistributionChannel,
    description: 'Distribution channels'
  })
  @IsArray()
  @IsEnum(DistributionChannel, { each: true })
  @IsOptional()
  distributionChannelList?: DistributionChannel[];

  @ApiPropertyOptional({ enum: SellingStrategyTypeEnum, description: 'Selling strategy type' })
  @IsEnum(SellingStrategyTypeEnum)
  @IsOptional()
  sellingStrategyType?: SellingStrategyTypeEnum;

  @ApiPropertyOptional({ description: 'Market segment ID' })
  @IsUUID()
  @IsOptional()
  marketSegmentId?: string;
}

export class SellabilityDto {
  distributionChannel: DistributionChannel;
  isSellable: boolean;
}

export class UpsertSalesPlanSellAbilityDto {
  salePlanId: string;
  hotelId: string;
  sellabilityList: SellabilityDto[];
}

export class DeleteRatePlanPayloadDto {
  hotelId: string;
  id: string;
}