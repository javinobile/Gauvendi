import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { CancellationFeeUnitEnum } from 'src/core/entities/hotel-entities/hotel-cancellation-policy.entity';

export class HotelCancellationPolicyTranslationDto {
  @IsString()
  @IsOptional()
  languageCode?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class HotelCancellationPolicyDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsOptional()
  hotelId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  cancellationType?: string;

  @IsString()
  @IsOptional()
  mappingCancellationPolicyCode?: string;

  @IsNumber()
  @IsOptional()
  hourPrior?: number;

  @IsString()
  @IsOptional()
  displayUnit?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  cancellationFeeValue?: number;

  @IsEnum(CancellationFeeUnitEnum)
  @IsOptional()
  cancellationFeeUnit?: CancellationFeeUnitEnum;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotelCancellationPolicyTranslationDto)
  @IsOptional()
  translationList?: HotelCancellationPolicyTranslationDto[];
}
