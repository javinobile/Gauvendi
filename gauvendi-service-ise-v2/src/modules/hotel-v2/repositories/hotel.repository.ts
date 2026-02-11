import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Filter } from 'src/core/dtos/common.dto';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsRelations, Repository } from 'typeorm';
import { HotelFilterDto } from '../dtos/hotel.dto';

@Injectable()
export class HotelRepository extends BaseService {
  constructor(
    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotel(filter: HotelFilterDto) {
    try {
      const qb = this.hotelRepository.createQueryBuilder('hotel');

      if (filter.hotelCode) {
        qb.andWhere('hotel.code = :code', { code: filter.hotelCode });
      }

      if (filter.relations) {
        Filter.setQueryBuilderRelations(qb, 'hotel', filter.relations);
      }
      const result = await qb.getOne();
      if (!result) {
        throw new BadRequestException('Hotel not found');
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotels(filter: HotelFilterDto) {
    try {
      const qb = this.hotelRepository.createQueryBuilder('hotel');

      if (filter.hotelCode) {
        qb.andWhere('hotel.code = :code', { code: filter.hotelCode });
      }

      if (filter.relations) {
        Filter.setQueryBuilderRelations(qb, 'hotel', filter.relations);
      }
      if (filter.expand && filter.expand.length > 0) {
        const hasCurrency = filter.expand.includes('currency');
        const hasCurrencyRate = filter.expand.includes('currencyRate');
        
        if (hasCurrencyRate && !hasCurrency) {
          qb.leftJoinAndSelect('hotel.baseCurrency', 'baseCurrency');
        }
        
        for (const ex of filter.expand) {
          switch (ex) {
            case 'hotelConfiguration':
              qb.leftJoinAndSelect('hotel.hotelConfigurations', 'hotelConfigurations');
              break;
            case 'currency':
              qb.leftJoinAndSelect('hotel.baseCurrency', 'baseCurrency');
              break;
            case 'currencyRate':
              qb.leftJoinAndSelect('baseCurrency.currencyRates', 'currencyRates');
              break;
            case 'iconImage':
              qb.leftJoinAndSelect('hotel.iconImage', 'iconImage');
              break;
          }
        }
      }
      const result = await qb.getMany();
      if (!result) {
        throw new BadRequestException('Hotel not found');
      }

      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelByCode(hotelCode: string): Promise<Hotel> {
    if (!hotelCode) {
      throw new BadRequestException('Hotel code is required');
    }

    try {
      const hotel = await this.hotelRepository.findOne({
        where: {
          code: hotelCode
        }
      });

      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }
      return hotel;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelByIdOrCode(
    hotelId?: string,
    hotelCode?: string,
    relations?: FindOptionsRelations<Hotel>
  ): Promise<Hotel | null> {
    if (!hotelId && !hotelCode) {
      throw new BadRequestException('Hotel id or code is required');
    }

    let hotel: Hotel | null;
    if (hotelId) {
      hotel = await this.hotelRepository.findOne({
        where: {
          id: hotelId
        },
        relations: relations
      });
    } else {
      hotel = await this.hotelRepository.findOne({
        where: {
          code: hotelCode
        },
        relations: relations
      });
    }

    return hotel;
  }
}
