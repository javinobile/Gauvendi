import { IsString } from 'class-validator';

export class PropertyPaymentMethodSettingDto {
  @IsString()
  propertyId: string;

  @IsString()
  globalPaymentProviderId?: string;

  @IsString()
  globalPaymentMethodId?: string;
}
