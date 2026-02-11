import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrenciesQueryDto } from './currencies.dto';
import { CurrenciesService } from './currencies.service';

@Controller()
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}
  
  @MessagePattern({ cmd: "get_currencies" })
  async getCurrencies(@Payload() payload: CurrenciesQueryDto) {
    return this.currenciesService.getCurrencies(payload);
  }
}
