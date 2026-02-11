import { DistributionChannel, RoomProductStatus, RoomProductType } from '@src/core/enums/common.enum';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ArrayProperty, OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class SellingPriceQuery {
  @IsString()
  hotelId: string;

  @IsString()
  ratePlanId: string;

  @OptionalArrayProperty()
  roomProductIds: string[];

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;
}
export class GetSellingPriceQueryDto {
  @IsString()
  hotelId: string;

  @IsString()
  ratePlanId: string;

  @IsString()
  fromDate: string;

  @IsString()
  @IsNotEmpty()
  toDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  occupancy?: number = 1;
}

export class RefreshSellingPriceDto {
  @IsString()
  hotelId: string;

  // @IsString()
  // ratePlanId: string;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  occupancy?: number = 1;
}

export class BulkRefreshSellingPriceDto {
  @IsString()
  hotelId: string;

  @IsString()
  fromDate?: string;

  @IsString()
  toDate?: string;

  @IsString()
  roomProductId: string;

  @IsString()
  ratePlanId: string;
}

export class GetRoomProductPricingModeDto {
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsString()
  @IsOptional()
  roomProductId?: string;

  @ArrayProperty()
  @IsOptional()
  status?: RoomProductStatus[];

  @ArrayProperty()
  @IsOptional()
  distributionChannel?: DistributionChannel[];

  @ArrayProperty()
  @IsOptional()
  type?: RoomProductType[];

}

export class CalculateSellingPriceDto {
  @IsString()
  hotelId: string;

  @IsString()
  roomProductId: string;

  @IsString()
  ratePlanId: string;

  @IsString()
  fromDate: string;

  @IsString()
  toDate: string;
}

export class RoomProductPricingRequestDto {
  @IsString()
  propertyCode: string;
  
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsInt()
  @Min(1)
  totalAdult: number;

  @IsInt()
  @IsOptional()
  totalPet: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  childAgeList?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomProductRequestDto)
  roomProducts: RoomProductRequestDto[];
}

export class RoomProductRequestDto {
  @IsString()
  id: string;

  @IsString()
  code: string;

  @IsString()
  name: string;
}