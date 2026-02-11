import { CacheTTL } from "@nestjs/cache-manager";
import { Controller, Get, Query } from "@nestjs/common";
import { CurrencyQueryDto } from "./currencies.dto";
import { CurrenciesService } from "./currencies.service";

@Controller("currencies")
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @CacheTTL(0) // never expired
  getCurrencies(@Query() query: CurrencyQueryDto) {
    console.log("getCurrencies");
    return this.currenciesService.getCurrencies(query);
  }
}
