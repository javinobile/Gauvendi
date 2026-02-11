import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';

export class AvailableAmenityDto {
  @IsString()
  @IsNotEmpty()
  hotelCode?: string;

  hotelId?: string;

  @IsString()
  @IsNotEmpty()
  fromTime: string;

  @IsString()
  @IsNotEmpty()
  toTime: string;

  @IsString()
  @IsNotEmpty()
  roomProductCode: string;

  @IsString()
  @IsNotEmpty()
  salesPlanCode: string;

  @IsString()
  @IsOptional()
  translateTo?: string;

  @OptionalArrayProperty()
  distributionChannelList?: string[];

  @IsOptional()
  @OptionalArrayProperty()
  childrenAges?: number[];

  @IsOptional()
  @IsInt()
  adults?: number;

  @IsOptional()
  @IsInt()
  pets?: number;
}

export interface HotelAmenityResponse {
  id: string;
  name: string;
  code: string;
  description: string;
  amenityType: string;
  pricingUnit: string;
  iconImageUrl: string;
  totalBaseAmount: number;
  totalGrossAmount: number;
  taxAmount: number;
  serviceChargeAmount: number;
  baseRate: string | null;
  hotelAmenityPriceList: {
    hotelAgeCategory: {
      code: string;
      name: string;
      fromAge: number;
      toAge: number;
    };
    price: number;
  }[];

  /** logic field for the type of the amenity */
  type?: string;
}
