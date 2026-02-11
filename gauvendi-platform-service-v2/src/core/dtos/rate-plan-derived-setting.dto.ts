import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { RatePlanDerivedSettingInheritedFields } from '../enums/common';
import { OptionalArrayProperty } from '../decorators/array-property.decorator';

// Output DTO - No validation, only Swagger documentation
export class RatePlanDerivedSettingDto {
  @ApiProperty({ description: 'Derived setting ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  hotelId: string;

  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  ratePlanId: string;

  @ApiProperty({ description: 'Derived rate plan ID', example: 'derived-rate-plan-uuid' })
  derivedRatePlanId: string;

  @ApiPropertyOptional({ description: 'Follow daily payment term', example: true })
  followDailyPaymentTerm?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily cancellation policy', example: true })
  followDailyCxlPolicy?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily included amenity', example: false })
  followDailyIncludedAmenity?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily room product availability', example: true })
  followDailyRoomProductAvailability?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily restriction', example: false })
  followDailyRestriction?: boolean;
}

// Input DTO - Based on Java validation logic
export class RatePlanDerivedSettingInput {
  @ApiPropertyOptional({ description: 'Derived setting ID for updates', example: 'uuid-123' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ description: 'Hotel ID', example: 'hotel-uuid' })
  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getHotelId(), REQUIRE_HOTEL_ID)
  hotelId: string;

  @ApiProperty({ description: 'Rate plan ID', example: 'rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getRatePlanId(), REQUIRE_RATE_PLAN_ID)
  ratePlanId: string;

  @ApiProperty({ description: 'Derived rate plan ID', example: 'derived-rate-plan-uuid' })
  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getDerivedRatePlanId(), REQUIRE_DERIVED_RATE_PLAN_ID)
  derivedRatePlanId: string;

  @ApiPropertyOptional({ description: 'Follow daily payment term', example: true })
  @IsBoolean()
  @IsOptional()
  followDailyPaymentTerm?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily cancellation policy', example: true })
  @IsBoolean()
  @IsOptional()
  followDailyCxlPolicy?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily included amenity', example: false })
  @IsBoolean()
  @IsOptional()
  followDailyIncludedAmenity?: boolean;

  @ApiPropertyOptional({ description: 'Follow daily room product availability', example: true })
  @IsBoolean()
  @IsOptional()
  followDailyRoomProductAvailability?: boolean;

  @ApiPropertyOptional({
    description: 'Inherited restriction fields',
    example: ['minLength', 'maxLength']
  })
  @IsOptional()
  inheritedRestrictionFields?: RatePlanDerivedSettingInheritedFields[];

  @ApiPropertyOptional({ description: 'Follow daily restriction', example: false })
  @IsBoolean()
  @IsOptional()
  followDailyRestriction?: boolean;
}

// Filter DTO - Based on Java Filter class
export class RatePlanDerivedSettingFilter {
  @OptionalArrayProperty()
  ratePlanIds?: string[];

  @IsUUID()
  @IsOptional()
  hotelId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'List of IDs to filter by',
    example: ['uuid-1', 'uuid-2']
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  idList?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of hotel IDs to filter by',
    example: ['hotel-uuid-1', 'hotel-uuid-2']
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  hotelIdList?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of rate plan IDs to filter by',
    example: ['rate-plan-uuid-1', 'rate-plan-uuid-2']
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  ratePlanIdList?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'List of derived rate plan IDs to filter by',
    example: ['derived-uuid-1', 'derived-uuid-2']
  })
  @IsUUID(4, { each: true })
  @IsOptional()
  derivedRatePlanIdList?: string[];

  @ApiPropertyOptional({
    description: 'Filter by follow daily room product availability flag',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isFollowDailyRoomProductAvailability?: boolean;

  // Pagination fields (inherited from Java Filter class)
  @ApiPropertyOptional({ description: 'Page size', example: 10, default: 10 })
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Offset for pagination', example: 0 })
  @IsOptional()
  offset?: number;
}
