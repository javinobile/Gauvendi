import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Repository } from 'typeorm';
import { MappingHotelDto } from '../dtos/mapping-hotel.dto';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';

@Injectable()
export class MappingHotelRepository {
  constructor(
    @InjectRepository(MappingPmsHotel, DB_NAME.POSTGRES)
    private readonly mappingHotelRepository: Repository<MappingPmsHotel>
  ) {}

  async getMappingHotel(body: MappingHotelDto): Promise<MappingPmsHotel> {
    const mappingHotel = await this.mappingHotelRepository.findOne({
      where: {
        hotelId: body.hotelId
      }
    });

    if (!mappingHotel) {
      throw new NotFoundException('Mapping hotel not found');
    }

    return mappingHotel;
  }
}
