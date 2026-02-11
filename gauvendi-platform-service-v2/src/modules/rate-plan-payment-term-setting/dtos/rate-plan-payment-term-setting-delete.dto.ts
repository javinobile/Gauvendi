import { IsOptional, IsUUID } from 'class-validator';

export class RatePlanPaymentTermSettingDeleteDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}
