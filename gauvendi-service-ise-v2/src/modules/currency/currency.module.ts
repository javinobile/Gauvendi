import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { Currency } from 'src/core/entities/core-entities/currency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Currency], DB_NAME.POSTGRES)],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService]
})
export class CurrencyModule {}
