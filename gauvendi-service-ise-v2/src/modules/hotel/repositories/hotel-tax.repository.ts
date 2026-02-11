import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { DB_NAME } from 'src/core/constants/db.const';
import {
  CityTaxStatusEnum,
  HotelCityTax
} from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelTaxSetting } from 'src/core/entities/hotel-entities/hotel-tax-setting.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { Repository } from 'typeorm';
import { HotelTaxDto } from '../dtos/hotel-tax.dto';

@Injectable()
export class HotelTaxRepository {
  private readonly logger = new Logger(HotelTaxRepository.name);

  constructor(
    @InjectRepository(HotelTax, DB_NAME.POSTGRES)
    private readonly hotelTaxRepository: Repository<HotelTax>,
    @InjectRepository(HotelCityTax, DB_NAME.POSTGRES)
    private readonly hotelCityTaxRepository: Repository<HotelCityTax>,
    @InjectRepository(HotelTaxSetting, DB_NAME.POSTGRES)
    private readonly hotelTaxSettingRepository: Repository<HotelTaxSetting>
  ) {}

  async getHotelTax(body: HotelTaxDto): Promise<HotelTax | null> {
    try {
      const hotelTax = await this.hotelTaxRepository.findOne({
        where: {
          hotelId: body.hotelId,
          isDefault: true
        }
      });

      return hotelTax;
    } catch (error) {
      this.logger.error('Error getting hotel tax', error);
      throw new BadRequestException('Error getting hotel tax');
    }
  }

  async getHotelTaxes(hotelId: string): Promise<HotelTax[] | null> {
    try {
      const hotelTaxes = await this.hotelTaxRepository.find({
        where: { hotelId }
      });
      return hotelTaxes;
    } catch (error) {
      this.logger.error('Error getting hotel taxes', error);
      throw new BadRequestException('Error getting hotel taxes');
    }
  }

  async getHotelTaxSettings(hotelId: string): Promise<HotelTaxSetting[]> {
    try {
      const hotelTaxSettings = await this.hotelTaxSettingRepository
        .createQueryBuilder('h')
        .leftJoin('h.hotelTax', 'ht', 'ht.taxCode = h.code')
        .where('h.hotelId = :hotelId', { hotelId })
        .andWhere('h.softDelete = false')
        .getMany();

      return hotelTaxSettings;
    } catch (error) {
      this.logger.error('Error getting hotel tax settings', error);
      throw new BadRequestException('Error getting hotel tax settings');
    }
  }

  async getHotelCityTaxes(hotelId: string): Promise<HotelCityTax[]> {
    try {
      const hotelCityTaxes = await this.hotelCityTaxRepository.find({
        where: {
          hotelId,
          status: CityTaxStatusEnum.ACTIVE
        }
      });

      return hotelCityTaxes;
    } catch (error) {
      this.logger.error('Error getting hotel city taxes', error);
      throw new BadRequestException('Error getting hotel city taxes');
    }
  }
}
