import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { DailyRateUnitDto } from '../../pricing/dtos/daily-rate-unit.dto';

export class HotelRetailCategoryDto {
  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Category code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Display sequence' })
  @IsNumber()
  @IsOptional()
  displaySequence?: number;
}

export class HotelRetailFeatureDto {
  @ApiProperty({ description: 'Feature ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Feature code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Feature name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Base rate for the feature' })
  @IsNumber()
  @IsOptional()
  baseRate?: number;

  // @ApiPropertyOptional({ description: 'Base weight' })
  // @IsNumber()
  // @IsOptional()
  // baseWeight?: number;

  // @ApiPropertyOptional({ description: 'Feature type' })
  // @IsEnum(FeatureTypeEnum)
  // @IsOptional()
  // type?: FeatureTypeEnum;

  // @ApiPropertyOptional({ description: 'Feature description' })
  // @IsString()
  // @IsOptional()
  // description?: string;

  // @ApiPropertyOptional({ description: 'Short description' })
  // @IsString()
  // @IsOptional()
  // shortDescription?: string;

  // @ApiPropertyOptional({ description: 'Quantity' })
  // @IsNumber()
  // @IsOptional()
  // quantity?: number;

  // @ApiPropertyOptional({ description: 'Hotel retail category ID' })
  // @IsUUID()
  // @IsOptional()
  // hotelRetailCategoryId?: string;

  // @ApiPropertyOptional({ description: 'Display sequence' })
  // @IsNumber()
  // @IsOptional()
  // displaySequence?: number;

  // @ApiPropertyOptional({ description: 'Is visible flag' })
  // @IsBoolean()
  // @IsOptional()
  // isVisible?: boolean;

  // @ApiPropertyOptional({ description: 'Feature status' })
  // @IsEnum(HotelRetailFeatureStatusEnum)
  // @IsOptional()
  // status?: HotelRetailFeatureStatusEnum;

  @ApiPropertyOptional({ description: 'Hotel retail category' })
  @IsOptional()
  hotelRetailCategory?: HotelRetailCategoryDto;

  @ApiPropertyOptional({ description: 'Daily rate unit list', type: [DailyRateUnitDto] })
  @IsArray()
  @IsOptional()
  dailyRateUnitList?: DailyRateUnitDto[];

  // @ApiPropertyOptional({ description: 'Travel tags' })
  // @IsArray()
  // @IsOptional()
  // travelTag?: string[];

  // @ApiPropertyOptional({ description: 'Occasions' })
  // @IsArray()
  // @IsOptional()
  // occasion?: string[];

  // @ApiPropertyOptional({ description: 'Is multi-bedroom' })
  // @IsBoolean()
  // @IsOptional()
  // isMultiBedroom?: boolean;

  // @ApiPropertyOptional({ description: 'Icon image URL' })
  // @IsString()
  // @IsOptional()
  // iconImageUrl?: string;

  // @ApiPropertyOptional({ description: 'Measurement unit' })
  // @IsString()
  // @IsOptional()
  // measurementUnit?: string;
}
