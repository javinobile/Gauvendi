import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { BadRequestException } from '@src/core/exceptions';
import { Repository } from 'typeorm';
import { RoomProductMappingPmsFilterDto } from '../dtos/room-product-mapping-pms.dto';

@Injectable()
export class RoomProductMappingPmsRepository {
  constructor(
    @InjectRepository(RoomProductMappingPms, DbName.Postgres)
    private readonly roomProductMappingPmsRepository: Repository<RoomProductMappingPms>
  ) {}

  getRoomProductMappings(filter: RoomProductMappingPmsFilterDto) {
    try {
      const { hotelId, mappingPmsCodes } = filter;
      const queryBuilder =
        this.roomProductMappingPmsRepository.createQueryBuilder('roomProductMappingPms');
      if (hotelId) {
        queryBuilder.where('roomProductMappingPms.hotelId = :hotelId', { hotelId });
      }
      if (mappingPmsCodes?.length) {
        queryBuilder.where(
          'roomProductMappingPms.roomProductMappingPmsCode IN (:...mappingPmsCodes)',
          {
            mappingPmsCodes
          }
        );
      }
      return queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
