import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelCityTaxAgeGroup } from 'src/core/entities/hotel-entities/hotel-city-tax-age-group.entity';
import {
  CityTaxStatusEnum,
  HotelCityTax
} from 'src/core/entities/hotel-entities/hotel-city-tax.entity';
import { BadRequestException } from 'src/core/exceptions';
import {
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository
} from 'typeorm';
import { HotelCityTaxFilterDto } from './hotel-city-tax.dto';

@Injectable()
export class HotelCityTaxRepository {
  constructor(
    @InjectRepository(HotelCityTax, DB_NAME.POSTGRES)
    private readonly hotelCityTaxRepository: Repository<HotelCityTax>,
    @InjectRepository(HotelCityTaxAgeGroup, DB_NAME.POSTGRES)
    private readonly hotelCityTaxAgeGroupRepository: Repository<HotelCityTaxAgeGroup>
  ) {}

  findAll(
    filter: {
      hotelId: string;
      fromDate?: string;
      toDate?: string;
      statuses?: CityTaxStatusEnum[];
    },
    select?: FindOptionsSelect<HotelCityTax>
  ): Promise<HotelCityTax[]> {
    const where: FindOptionsWhere<HotelCityTax> = {
      hotelId: filter.hotelId
    };

    if (filter.fromDate) {
      where.validTo = MoreThanOrEqual(new Date(filter.fromDate));
    }
    if (filter.toDate) {
      where.validTo = LessThanOrEqual(new Date(filter.toDate));
    }

    if (filter.statuses) {
      where.status = In(filter.statuses);
    }

    return this.hotelCityTaxRepository.find({
      where,
      select
    });
  }

  findAllAgeGroups(
    filter: {
      hotelId: string;
      hotelCityTaxIds?: string[];
    },
    select?: FindOptionsSelect<HotelCityTaxAgeGroup>
  ): Promise<HotelCityTaxAgeGroup[]> {
    const where: FindOptionsWhere<HotelCityTaxAgeGroup> = {};

    if (filter.hotelId) {
      where.hotelId = filter.hotelId;
    }

    if (filter.hotelCityTaxIds) {
      where.hotelCityTaxId = In(filter.hotelCityTaxIds);
    }

    return this.hotelCityTaxAgeGroupRepository.find({
      where,
      select
    });
  }

  async getHotelCityTaxsWithTranslations(filter: HotelCityTaxFilterDto) {
    try {
      const { ids, translateTo } = filter;
      const qb = this.hotelCityTaxRepository.createQueryBuilder('hotelCityTax');
      if (ids?.length) {
        qb.andWhere('hotelCityTax.id IN (:...ids)', { ids });
      }
      const hotelCityTaxes = await qb.getMany();
      if (!hotelCityTaxes.length) return [];

      const mappedHotelCityTaxes = hotelCityTaxes.map((hotelCityTax) => {
        const translation = hotelCityTax.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        if (!translation) return hotelCityTax;

        return {
          ...hotelCityTax,
          name: translation?.name || hotelCityTax.name,
          description: translation?.description || hotelCityTax.description,
          translations: hotelCityTax.translations
        };
      });
      return mappedHotelCityTaxes;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
