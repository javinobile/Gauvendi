import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { CancellationFeeUnitEnum } from 'src/core/enums/common';
import {
  RatePlanPricingMethodologyEnum,
  RatePlanStatusEnum,
  RatePlanTypeEnum,
  RoundingModeEnum,
  SellingStrategyTypeEnum
} from 'src/core/enums/common';
import { RatePlanAdjustmentType } from 'src/core/enums/common';
import { DistributionChannel } from '../enums';

export class RatePlanTranslationDto {
  @ApiProperty({ description: 'Translation ID', example: 'uuid-123' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Language code', example: 'en' })
  @IsString()
  @Length(2, 5)
  languageCode: string;

  @ApiProperty({ description: 'Translated name', example: 'Standard Rate' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ description: 'Translated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class RatePlanDerivedSettingDto {
  @ApiProperty({ description: 'Derived setting ID', example: 'uuid-123' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Base rate plan ID', example: 'uuid-456' })
  @IsUUID()
  baseRatePlanId: string;

  @ApiProperty({ description: 'Adjustment type', example: 'PERCENTAGE' })
  @IsEnum(RatePlanAdjustmentType)
  adjustmentType: RatePlanAdjustmentType;

  @ApiProperty({ description: 'Adjustment value', example: 10.5 })
  @IsNumber()
  @Min(0)
  adjustmentValue: number;

  @ApiPropertyOptional({ description: 'Follow daily cancellation policy', example: true })
  @IsBoolean()
  @IsOptional()
  followDailyCxlPolicy?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily payment term', example: true })
  @IsBoolean()
  @IsOptional()
  followDailyPaymentTerm?: boolean;
}

export class RatePlanDto {
  @ApiProperty({ description: 'Rate plan ID', example: 'uuid-123' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  hotelId: string;

  @ApiProperty({ description: 'Rate plan code', example: 'STANDARD' })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({ description: 'Rate plan name', example: 'Standard Rate' })
  @IsString()
  @Length(1, 255)
  name: string;

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

  @ApiProperty({ enum: RatePlanStatusEnum, description: 'Rate plan status' })
  @IsEnum(RatePlanStatusEnum)
  status: RatePlanStatusEnum;

  @ApiProperty({ enum: RatePlanTypeEnum, description: 'Rate plan type' })
  @IsEnum(RatePlanTypeEnum)
  type: RatePlanTypeEnum;

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

  @ApiPropertyOptional({ description: 'Display unit' })
  @IsString()
  @IsOptional()
  displayUnit?: string;

  @ApiPropertyOptional({ description: 'Hotel cancellation policy code' })
  @IsString()
  @IsOptional()
  hotelCxlPolicyCode?: string;

  @ApiPropertyOptional({ description: 'Mapping rate plan code' })
  @IsString()
  @IsOptional()
  mappingRatePlanCode?: string;

  @ApiPropertyOptional({ description: 'Payment code' })
  @IsString()
  @IsOptional()
  paymentCode?: string;

  @ApiPropertyOptional({ description: 'Payment term code' })
  @IsString()
  @IsOptional()
  paymentTermCode?: string;

  @ApiPropertyOptional({ type: [String], description: 'Hotel extras code list' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hotelExtrasCodeList?: string[];

  @ApiPropertyOptional({ type: [RatePlanTranslationDto], description: 'Translations' })
  @ValidateNested({ each: true })
  @Type(() => RatePlanTranslationDto)
  @IsOptional()
  translationList?: RatePlanTranslationDto[];

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

  @ApiPropertyOptional({ type: RatePlanDerivedSettingDto, description: 'Derived settings' })
  @ValidateNested()
  @Type(() => RatePlanDerivedSettingDto)
  @IsOptional()
  ratePlanDerivedSetting?: RatePlanDerivedSettingDto;

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

  @ApiPropertyOptional({ description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Update timestamp' })
  updatedAt?: Date;

  includedHotelExtrasList: any[];
}
