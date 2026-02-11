import { Country } from '@entities/core-entities/country.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DbName } from '@constants/db-name.constant';
import { CountriesQueryDto } from './countries.dto';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country, DbName.Postgres)
    private readonly countryCountryRepository: Repository<Country>
  ) { }

  async getCountries(payload: CountriesQueryDto) {
    const where: any = {

    }
    if (payload.ids?.length) {
      where.id = In(payload.ids);
    }
    return this.countryCountryRepository.find({ where });
  }
}
