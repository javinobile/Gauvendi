import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CountriesQueryDto } from './countries.dto';
import { CountriesService } from './countries.service';

@Controller()
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}
  
  @MessagePattern({ cmd: "get_countries" })
  async getCurrencies(@Payload() payload: CountriesQueryDto) {
    return this.countriesService.getCountries(payload);
  }
}
