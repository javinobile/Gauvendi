import { Controller, Get } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('')
  getAllCurrency() {
    return this.currencyService.getAllCurrency();
  }
}
