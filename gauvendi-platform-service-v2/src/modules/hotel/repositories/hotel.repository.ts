import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { FindOptionsRelations, FindOptionsSelect, IsNull, Repository } from 'typeorm';
import { DbName } from '../../../core/constants/db-name.constant';
import { HotelRetailFeatureStatusEnum } from '../../../core/entities/hotel-retail-feature.entity';

export class HotelRetailFeatureFilter {
  hotelId?: string;
  idList?: string[];
  hotelRetailCategoryIdList?: string[];
  statusList?: Set<HotelRetailFeatureStatusEnum>;
  sort?: any;
  expand?: any;
}

@Injectable()
export class HotelRepository {
  constructor(
    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>
  ) {}

  findByCode(code: string): Promise<Hotel | null> {
    return this.hotelRepository.findOne({ where: { code } });
  }

  findHotelById(
    id: string,
    relations?: string[],
    select?: FindOptionsSelect<Hotel>
  ): Promise<Hotel | null> {
    return this.hotelRepository.findOne({ where: { id, deletedAt: IsNull() }, relations, select });
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
        relations
      });
    } else {
      hotel = await this.hotelRepository.findOne({
        where: {
          code: hotelCode
        },
        relations
      });
    }

    return hotel;
  }

  async getHotelByCode(hotelCode: string): Promise<Hotel> {
    if (!hotelCode) {
      throw new BadRequestException('Hotel code is required');
    }

    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      }
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return hotel;
  }
}
