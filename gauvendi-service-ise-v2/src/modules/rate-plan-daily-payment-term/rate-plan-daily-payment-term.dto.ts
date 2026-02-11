import { IsDateString, IsString, IsUUID } from 'class-validator';

export class RatePlanDailyPaymentTermDto {
  @IsUUID()
  id: string;

  @IsUUID()
  hotelId: string;

  @IsUUID()
  ratePlanId: string;

  @IsString()
  paymentTermCode: string;

  @IsDateString()
  date: string;
}

export class RatePlanDailyPaymentTermFilter {
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
