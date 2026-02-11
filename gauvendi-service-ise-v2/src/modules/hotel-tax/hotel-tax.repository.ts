import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { BadRequestException } from 'src/core/exceptions';
import { FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import { HotelTaxDto } from '../hotel/dtos/hotel-tax.dto';
import { HotelTaxFilterDto } from './dtos/hotel-tax.dto';

@Injectable()
export class HotelTaxRepository {
  constructor(
    @InjectRepository(HotelTax, DB_NAME.POSTGRES)
    private readonly hotelTaxRepository: Repository<HotelTax>
  ) {}

  findAll(
    filter: {
      hotelId: string;
    },
    select?: FindOptionsSelect<HotelTax>
  ): Promise<HotelTax[]> {
    const where: FindOptionsWhere<HotelTax> = {
      hotelId: filter.hotelId
    };

    return this.hotelTaxRepository.find({
      where,
      select
    });
  }

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
      throw new BadRequestException(error.message);
    }
  }

  async getHotelTaxes(hotelId: string): Promise<HotelTax[] | null> {
    try {
      const hotelTaxes = await this.hotelTaxRepository.find({
        where: { hotelId }
      });
      return hotelTaxes;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelTaxsWithTranslations(filter: HotelTaxFilterDto) {
    try {
      const { ids, translateTo } = filter;

      const qb = this.hotelTaxRepository.createQueryBuilder('hotelTax');
      if (ids?.length) {
        qb.andWhere('hotelTax.id IN (:...ids)', { ids });
      }

      const hotelTaxes = await qb.getMany();

      if (!hotelTaxes.length) return [];

      const mappedHotelTaxes = hotelTaxes.map((hotelTax) => {
        const translation = hotelTax.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        if (!translation) return hotelTax;

        return {
          ...hotelTax,
          name: translation?.name || hotelTax.name,
          description: translation?.description || hotelTax.description
        };
      });

      return mappedHotelTaxes;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
