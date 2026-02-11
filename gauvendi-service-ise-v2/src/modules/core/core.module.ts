import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Country } from 'src/core/entities/core-entities/country.entity';
import { Currency } from 'src/core/entities/core-entities/currency.entity';
import { CountryRepository } from './repositories/country.repository';
import { CurrencyRepository } from './repositories/currency.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Currency, Country], DB_NAME.POSTGRES)],
  exports: [TypeOrmModule, CurrencyRepository, CountryRepository],
  providers: [CurrencyRepository, CountryRepository]
})
export class CoreModule {}
