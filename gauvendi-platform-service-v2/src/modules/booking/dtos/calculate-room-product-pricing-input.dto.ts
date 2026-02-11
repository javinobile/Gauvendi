import { HotelPricingDecimalRoundingRuleDto } from '@src/core/dtos/hotel-pricing-decimal-rounding-rule.dto';
import { HotelCityTaxAgeGroup } from '@src/core/entities/hotel-entities/hotel-city-tax-age-group.entity';
import { AmenityWithType } from '@src/core/modules/amenity-calculate/amenity-data-provider.service';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { HotelAmenityPrice } from 'src/core/entities/hotel-entities/hotel-amenity-price.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTax } from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { CalculateReservationAmenityInputDto } from './booking.dto';

export class RoomProductInputDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsInt()
  allocatedAdultCount?: number;

  @IsOptional()
  @IsInt()
  allocatedChildCount?: number;

  @IsOptional()
  @IsInt()
  allocatedExtraBedAdultCount?: number;

  @IsOptional()
  @IsInt()
  allocatedExtraBedChildCount?: number;

  @IsOptional()
  @IsInt()
  allocatedPetCount?: number;
}

export class CalculateRoomProductPricingInputDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roomProductRatePlanIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomProductInputDto)
  roomProductInputs?: RoomProductInputDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  childrenAges?: number[];

  @IsOptional()
  @IsInt()
  adult?: number;

  @IsOptional()
  @IsInt()
  pets?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ratePlanIds?: string[];

  @IsOptional()
  @IsBoolean()
  isSellableOnIBE?: boolean; // mặc định true (set trong service/controller nếu undefined)

  @IsOptional()
  @IsBoolean()
  skipRounding?: boolean;

  @IsOptional()
  @IsString()
  translateTo?: string;

  hotel: Hotel;
  fromDate: string;
  toDate: string;

  taxSettingList: {
    accommodationTaxes: HotelTaxSetting[]; // Rate Plan;
    extrasTaxes: HotelTaxSetting[]; // extra;
  };
  ratePlans: RatePlan[];
  roomProducts: RoomProduct[];
  pricingDecimalRoundingRule: HotelPricingDecimalRoundingRuleDto;
  amenityList?: CalculateReservationAmenityInputDto[];
  serviceChargeRate: number;
  serviceChargeTaxRate: number;
  hotelCityTaxList?: HotelCityTax[];
  isCalculateCityTax?: boolean;
  // amenities
  hotelAmenities: HotelAmenity[];
  hotelAmenityPrices: HotelAmenityPrice[];
  bookingRatePlanAmenities: AmenityWithType[];
  bookingRoomProductAmenities: AmenityWithType[];
  hotelCityTaxAgeGroups?: HotelCityTaxAgeGroup[];
}
