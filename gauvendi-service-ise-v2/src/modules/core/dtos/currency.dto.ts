import { IsString } from 'class-validator';

export class CurrencyDto {
  @IsString()
  id: string;
}
