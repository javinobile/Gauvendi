
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

// Output DTO - No validation, only Swagger documentation
export class RatePlanDerivedSettingDto {

  id: string;

  
  hotelId: string;

  ratePlanId: string;

  derivedRatePlanId: string;

  followDailyPaymentTerm?: boolean;

  followDailyCxlPolicy?: boolean;

  followDailyIncludedAmenity?: boolean;

  followDailyRoomProductAvailability?: boolean;

  followDailyRestriction?: boolean;
}

// Input DTO - Based on Java validation logic
export class RatePlanDerivedSettingInput {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getHotelId(), REQUIRE_HOTEL_ID)
  hotelId: string;

  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getRatePlanId(), REQUIRE_RATE_PLAN_ID)
  ratePlanId: string;

  @IsUUID()
  @IsNotEmpty() // Java: ValidationNullObject(input.getDerivedRatePlanId(), REQUIRE_DERIVED_RATE_PLAN_ID)
  derivedRatePlanId: string;

  @IsBoolean()
  @IsOptional()
  followDailyPaymentTerm?: boolean;

  @IsBoolean()
  @IsOptional()
  followDailyCxlPolicy?: boolean;

  @IsBoolean()
  @IsOptional()
  followDailyIncludedAmenity?: boolean;

  @IsBoolean()
  @IsOptional()
  followDailyRoomProductAvailability?: boolean;

  @IsBoolean()
  @IsOptional()
  followDailyRestriction?: boolean;
}

// Filter DTO - Based on Java Filter class
export class RatePlanDerivedSettingFilter {
  @IsUUID(4, { each: true })
  @IsOptional()
  idList?: string[];

  @IsUUID(4, { each: true })
  @IsOptional()
  hotelIdList?: string[];

  @IsUUID(4, { each: true })
  @IsOptional()
  ratePlanIdList?: string[];

  @IsUUID(4, { each: true })
  @IsOptional()
  derivedRatePlanIdList?: string[];

  @IsBoolean()
  @IsOptional()
  isFollowDailyRoomProductAvailability?: boolean;

  // Pagination fields (inherited from Java Filter class)
  @IsOptional()
  pageSize?: number = 10;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  offset?: number;
}
