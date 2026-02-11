import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class RatePlanCancellationPolicyDailyDto {
  @IsUUID()
  id: string;

  @IsUUID()
  hotelId: string;

  @IsUUID()
  ratePlanId: string;

  @IsString()
  cxlPolicyCode: string;

  @IsDateString()
  date: string;

  @IsBoolean()
  @IsOptional()
  isAdjusted?: boolean;
}

export class RatePlanCancellationPolicyDailyFilter {
  @IsUUID()
  hotelId?: string;

  @IsUUID(4, { each: true })
  ratePlanIdList?: string[];

  @IsUUID(4, { each: true })
  idList?: string[];

  @IsDateString()
  fromDate?: string;

  @IsDateString()
  toDate?: string;
}


