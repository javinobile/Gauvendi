import { IsString } from 'class-validator';

export class HotelPaymentMethodSettingDto {
  @IsString()
  hotelId: string;

  @IsString()
  globalPaymentProviderId?: string;

  @IsString()
  globalPaymentMethodId?: string;
}
