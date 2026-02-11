import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  CityTaxStatusEnum,
  HotelCityTax
} from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { Repository } from 'typeorm';
import { HotelCityTaxDto } from '../dtos/hotel-city-tax.dto';

@Injectable()
export class HotelCityTaxRepository {
  private readonly logger = new Logger(HotelCityTaxRepository.name);
  constructor(
    @InjectRepository(HotelCityTax, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<HotelCityTax>
  ) {}

  async getHotelCityTax(body: HotelCityTaxDto): Promise<HotelCityTax[]> {
    try {
      const hotelCityTax = await this.hotelRepository.find({
        where: {
          hotelId: body.hotelId,
          status: body.status as CityTaxStatusEnum
        }
      });

      return hotelCityTax;
    } catch (error) {
      this.logger.error('Error getting hotel city tax', error);
      throw new BadRequestException('Error getting hotel city tax');
    }
  }
}
