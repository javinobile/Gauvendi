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
import { RatePlanDerivedSettingInput } from 'src/core/dtos/rate-plan-derived-setting.dto';
import { CancellationFeeUnitEnum, CancellationPolicyDisplayUnitEnum } from 'src/core/enums/common';
import {
  RatePlanPricingMethodologyEnum,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoundingModeEnum,
  SellingStrategyTypeEnum
} from 'src/core/enums/common';
import { RatePlanAdjustmentType } from 'src/core/enums/common';
import { DistributionChannel } from '../enums';

export class CreateRatePlanTranslationDto {
  @ApiProperty({ description: 'Language code', example: 'en' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 5)
  languageCode: string;

  @ApiProperty({ description: 'Translated name', example: 'Standard Rate' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ description: 'Translated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateRatePlanDto {
  id?: string;

  @ApiProperty({ description: 'Rate plan ID', example: 'uuid-123' })
  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @ApiProperty({ description: 'Rate plan code', example: 'STANDARD' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  code: string;

  @ApiProperty({ description: 'Rate plan name', example: 'Standard Rate' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: 'Hotel cancellation policy code', example: 'CXL_POLICY_001' })
  @IsString()
  @IsNotEmpty()
  hotelCxlPolicyCode: string;

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

  @ApiPropertyOptional({
    enum: RatePlanStatusEnum,
    description: 'Rate plan status',
    default: RatePlanStatusEnum.ACTIVE
  })
  @IsEnum(RatePlanStatusEnum)
  @IsOptional()
  status?: RatePlanStatusEnum;

  @ApiPropertyOptional({
    enum: RatePlanTypeEnum,
    description: 'Rate plan type',
    default: RatePlanTypeEnum.PUBLIC
  })
  @IsEnum(RatePlanTypeEnum)
  @IsOptional()
  type?: RatePlanTypeEnum;

  @ApiPropertyOptional({
    enum: RoundingModeEnum,
    description: 'Rounding mode',
    default: RoundingModeEnum.NO_ROUNDING
  })
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

  @ApiPropertyOptional({ description: 'Display unit' })
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

  @ApiPropertyOptional({ enum: RatePlanPricingMethodologyEnum, description: 'Pricing methodology' })
  @IsEnum(RatePlanPricingMethodologyEnum)
  @IsOptional()
  pricingMethodology?: RatePlanPricingMethodologyEnum;

  @ApiPropertyOptional({ type: RatePlanDerivedSettingInput, description: 'Derived settings' })
  @ValidateNested()
  @Type(() => RatePlanDerivedSettingInput)
  @IsOptional()
  ratePlanDerivedSetting?: RatePlanDerivedSettingInput;

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
