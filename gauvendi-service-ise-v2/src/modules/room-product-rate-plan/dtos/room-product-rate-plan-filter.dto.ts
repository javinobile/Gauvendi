import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';
import { RatePlanStatusEnum } from 'src/core/entities/pricing-entities/rate-plan.entity';

export class RoomProductRatePlanFilterDto extends Filter {
  @IsOptional()
  @OptionalArrayProperty()
  @IsUUID('4', { each: true })
  idList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsString({ each: true })
  codeList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsUUID('4', { each: true })
  hotelIdList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsUUID('4', { each: true })
  roomProductIdList?: string[];

  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  ratePlanIdList?: string[];

  @IsOptional()
  @IsBoolean()
  isAutomatePricing?: boolean;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsInt()
  guestCount?: number;

  @IsOptional()
  @IsEnum(RatePlanStatusEnum, { each: true })
  @OptionalArrayProperty()
  ratePlanStatusList?: RatePlanStatusEnum[];

  @IsOptional()
  @OptionalArrayProperty()
  @IsString({ each: true })
  promoCodeList?: string[];

  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;
}
