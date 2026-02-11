import { IsString } from 'class-validator';

export class GlobalPaymentProviderDto {
  @IsString()
  code: string;
}
