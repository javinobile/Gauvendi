import { OptionalArrayProperty } from '@src/core/decorators/array-property.decorator';
import { DistributionChannel } from '@src/core/enums/common.enum';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID
} from 'class-validator';

export class DailyRatePlanSellabilityDto {
  propertyId: string;
  salePlanId: string;
  distributionChannel: DistributionChannel;
  date: string;
  isSellable: boolean;
  isAdjusted: boolean;
}

export class DailyRatePlanSellabilityFilterDto {

  @IsUUID('4')
  hotelId: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  @OptionalArrayProperty()
  salesPlanIdList?: string[];

  @IsOptional()
  @IsEnum(DistributionChannel, { each: true })
  @OptionalArrayProperty()
  distributionChannelList?: DistributionChannel[];

  @IsOptional()
  @IsDateString()
  fromDate: string;

  @IsOptional()
  @IsDateString()
  toDate: string;
}
