import { Controller, Get } from '@nestjs/common';
import { CountryListService } from './country-list.service';

@Controller('country-list')
export class CountryListController {
  constructor(private readonly countryListService: CountryListService) {}

  @Get('')
  async getCountryList() {
    return this.countryListService.getCountryList();
  }
}
