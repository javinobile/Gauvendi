import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { Translation } from 'src/core/database/entities/base.entity';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { Filter } from 'src/core/dtos/common.dto';
import {
  AmenityAvailabilityEnum,
  AmenityStatusEnum,
  AmenityTypeEnum,
  DistributionChannelEnum,
  IsePricingDisplayModeEnum,
  PricingUnitEnum,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';

export class HotelExtrasListPricingFilterDto extends Filter {
  @IsNotEmpty()
  @IsUUID('4')
  hotelId: string;

  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannelEnum[];

  @OptionalArrayProperty()
  statusList?: AmenityStatusEnum[];

  @IsOptional()
  @IsEnum(AmenityTypeEnum)
  amenityType?: AmenityTypeEnum;

  @OptionalArrayProperty()
  ids?: string[];

  @OptionalArrayProperty()
  sellingTypeList?: SellingTypeEnum[];

  @OptionalArrayProperty()
  codeList?: string[];

  isExclLinkedAmenity?: boolean;
}

export class HotelExtrasListPricingResponseDto {
  id: string;
  name: string;
  code: string;
  description: string;
  baseRate: number;
  amenityType: AmenityTypeEnum;
  pricingUnit: PricingUnitEnum;
  iconImageUrl: string;
  displaySequence: number;
  availability: AmenityAvailabilityEnum;
  postNextDay: boolean;
  totalGrossAmount: number;
  mappingHotelAmenityCode: string;
  translationList: Translation[];
  status: AmenityStatusEnum;
  isePricingDisplayMode: IsePricingDisplayModeEnum;
  distributionChannelList: DistributionChannelEnum[];
  linkedAmenityList: string[];
  hotelAmenityPrices: {
    id: string;
    hotelAmenityId: string;
    hotelAgeCategoryId: string;
    price: number;
    hotelAgeCategory?: {
      id?: string;
      name?: string;
      code?: string;
    };
  }[];
}
