import { Currency } from "@entities/core-entities/currency.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DbName } from "@constants/db-name.constant";
import { CurrenciesQueryDto } from "./currencies.dto";

@Injectable()
export class CurrenciesService {
  constructor(
    @InjectRepository(Currency, DbName.Postgres)
    private readonly currencyRepository: Repository<Currency>,
  ) {}

  async getCurrencies(payload: CurrenciesQueryDto) {
    return this.currencyRepository.find({ where: {} });
  }
}
