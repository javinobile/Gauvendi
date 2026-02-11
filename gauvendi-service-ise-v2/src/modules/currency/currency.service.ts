import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Currency } from 'src/core/entities/core-entities/currency.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    @InjectRepository(Currency, DB_NAME.POSTGRES)
    private readonly currencyRepository: Repository<Currency>
  ) {}

  async getAllCurrency() {
    try {
      const currencies = await this.currencyRepository.find();
      return currencies;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async getCurrencyWithRates(currencyId: string) {
    try {
      const currency = await this.currencyRepository.findOne({
        where: {
          id: currencyId
        },
        relations: ['currencyRates', 'currencyRates.exchangeCurrency']
      });
      return currency;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
