import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Country } from 'src/core/entities/core-entities/country.entity';
import { Repository } from 'typeorm';
import { CountryDto } from './dtos/country.dto';

@Injectable()
export class CountryRepository {
  private readonly logger = new Logger(CountryRepository.name);
  constructor(
    @InjectRepository(Country, DB_NAME.POSTGRES)
    private readonly countryRepository: Repository<Country>
  ) {}

  async getCountry(body: CountryDto): Promise<Country | null> {
    try {
      const country = await this.countryRepository.findOne({
        where: {
          id: body.id
        }
      });

      return country;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllCountries(): Promise<Country[]> {
    try {
      return await this.countryRepository.find({
        select: ['id', 'code']
      });
    } catch (error) {
      this.logger.error('Error fetching all countries:', error);
      return [];
    }
  }
}
