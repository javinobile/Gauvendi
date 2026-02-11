import { IsString } from 'class-validator';

export class GlobalPaymentMethodDto {
  @IsString()
  code: string;
}
