import { Module } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRate } from '@entities/core-entities/currency-rate.entity';
import { Currency } from '@entities/core-entities/currency.entity';
import { DbName } from "@constants/db-name.constant";

@Module({
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
  imports: [TypeOrmModule.forFeature([Currency, CurrencyRate], DbName.Postgres)],
})
export class CurrenciesModule {}
