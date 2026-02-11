import { Module } from '@nestjs/common';
import { CityTaxCalculateService } from './city-tax-calculate.service';

@Module({
  providers: [CityTaxCalculateService],
  exports: [CityTaxCalculateService]
})
export class CityTaxCalculateModule {}
