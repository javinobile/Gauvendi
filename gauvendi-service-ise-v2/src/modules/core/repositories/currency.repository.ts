import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Currency } from 'src/core/entities/core-entities/currency.entity';
import { Repository } from 'typeorm';
import { CurrencyDto } from '../dtos/currency.dto';

@Injectable()
export class CurrencyRepository {
  private readonly logger = new Logger(CurrencyRepository.name);
  constructor(
    @InjectRepository(Currency, DB_NAME.POSTGRES)
    private readonly currencyRepository: Repository<Currency>
  ) {}

  async getCurrency(body: CurrencyDto): Promise<Currency | null> {
    try {
      const currency = await this.currencyRepository.findOne({
        where: {
          id: body.id
        }
      });

      return currency;
    } catch (error) {
      this.logger.error('Error getting currency', error);
      throw new BadRequestException('Error getting currency');
    }
  }
}
