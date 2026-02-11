import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { BadRequestException } from '@src/core/exceptions';
import { Repository } from 'typeorm';
import { RoomProductMappingFilterDto } from '../dtos/room-product-mapping.dto';

@Injectable()
export class RoomProductMappingRepository {
  constructor(
    @InjectRepository(RoomProductMapping, DbName.Postgres)
    private readonly roomProductMappingRepository: Repository<RoomProductMapping>
  ) {}

  getRoomProductMappings(filter: RoomProductMappingFilterDto) {
    try {
      const { hotelId, roomProductIds } = filter;
      const queryBuilder =
        this.roomProductMappingRepository.createQueryBuilder('roomProductMapping');
      if (hotelId) {
        queryBuilder.where('roomProductMapping.hotelId = :hotelId', { hotelId });
      }
      if (roomProductIds?.length) {
        queryBuilder.where('roomProductMapping.relatedRoomProductId IN (:...roomProductIds)', {
          roomProductIds
        });
      }
      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
