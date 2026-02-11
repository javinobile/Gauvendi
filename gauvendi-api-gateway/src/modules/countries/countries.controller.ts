import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Query } from '@nestjs/common';
import { CountryQueryDto } from './countries.dto';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @CacheTTL(0) // never expired
  getCountries(@Query() query: CountryQueryDto) {
    return this.countriesService.getCountries(query);
  }
}
