import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Country } from 'src/core/entities/core-entities/country.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CountryListService {
  private readonly logger = new Logger(CountryListService.name);

  constructor(
    @InjectRepository(Country, DB_NAME.POSTGRES)
    private readonly countryRepository: Repository<Country>
  ) {}

  async getCountryList() {
    try {
      const countryList = await this.countryRepository.find({
        select: {
          id: true,
          name: true,
          code: true,
          phoneCode: true
        }
      });

      return countryList;
    } catch (error) {
      this.logger.error('Error getting country list', JSON.stringify(error));

      throw new InternalServerErrorException('Error getting country list');
    }
  }
}
