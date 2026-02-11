import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OptionalArrayProperty } from 'src/core/decorators/array-property.decorator';
import { AmenityStatusEnum } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { DistributionChannel } from 'src/core/entities/room-product.entity';

export class RatePlanServicesFilter {
  @IsUUID(4, { each: true })
  @OptionalArrayProperty()
  ratePlanIdList: string[];

  @IsEnum(DistributionChannel, { each: true })
  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];
}

export class HotelAmenityFilter {
  @IsOptional()
  @IsUUID(4)
  hotelId?: string;

  @IsOptional()
  @IsUUID(4, { each: true })
  @OptionalArrayProperty()
  idList?: string[];

  @IsOptional()
  @IsString({ each: true })
  @OptionalArrayProperty()
  codeList?: string[];

  @IsOptional()
  @IsEnum(AmenityStatusEnum, { each: true })
  @OptionalArrayProperty()
  statusList?: AmenityStatusEnum[];

  @IsOptional()
  @IsEnum(DistributionChannel, { each: true })
  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];
}

export class RatePlanExtraServicesDto {
  @IsUUID()
  ratePlanId: string;

  @IsUUID()
  serviceId: string;

  @IsBoolean()
  isIncluded: boolean;

  @IsBoolean()
  isMandatory: boolean;
}
