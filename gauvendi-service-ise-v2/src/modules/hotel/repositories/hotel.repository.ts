import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { Repository } from 'typeorm';
import { HotelDto } from '../dtos/hotel.dto';

@Injectable()
export class HotelRepository {
  constructor(
    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>
  ) {}

  async getHotel(body: HotelDto): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: {
        ...(body.hotelCode && { code: body.hotelCode }),
        ...(body.hotelId && { id: body.hotelId })
      }
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
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
