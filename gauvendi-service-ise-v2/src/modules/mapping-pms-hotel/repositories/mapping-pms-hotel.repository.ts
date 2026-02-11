import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { BadRequestException, NotFoundException } from 'src/core/exceptions';
import { Repository } from 'typeorm';
import { MappingPmsHotelDto } from '../dtos/mapping-pms-hotel.dto';

@Injectable()
export class MappingPmsHotelRepository {
  constructor(
    @InjectRepository(MappingPmsHotel, DB_NAME.POSTGRES)
    private readonly mappingHotelRepository: Repository<MappingPmsHotel>
  ) {}

  async getMappingPmsHotel(body: MappingPmsHotelDto): Promise<MappingPmsHotel> {
    try {
      const mappingHotel = await this.mappingHotelRepository.findOne({
        where: {
          hotelId: body.hotelId
        },
        relations: ['connector']
      });

      if (!mappingHotel) {
        return null as any;
      }

      return mappingHotel;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
