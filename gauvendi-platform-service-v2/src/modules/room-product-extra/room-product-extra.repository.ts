import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlanDailyExtraService } from '@src/core/entities/rate-plan-daily-extra-service.entity';
import { RoomProductExtraType } from '@src/core/enums/common';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { BaseService } from 'src/core/services/base.service';
import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, In, Repository } from 'typeorm';

@Injectable()
export class RoomProductExtraRepository extends BaseService {
  constructor(
    @InjectRepository(RoomProductExtra, DB_NAME.POSTGRES)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,
    configService: ConfigService
  ) {
    super(configService);
  }

  findAll(
    filter: {
      extrasCodes?: string[];
      extrasIds?: string[];
      roomProductIds?: string[];
      hotelIds?: string[];
      types?: RoomProductExtraType[];
    },
    select?: FindOptionsSelect<RoomProductExtra>,
    relations?: FindOptionsRelations<RoomProductExtra>
  ): Promise<RoomProductExtra[]> {
    const where: FindOptionsWhere<RoomProductExtra> = {};
    if (filter.extrasCodes && filter.extrasCodes.length > 0) {
      where.extra = {
        code: In(filter.extrasCodes)
      };
    }
    if (filter.extrasIds && filter.extrasIds.length > 0) {
      where.extrasId = In(filter.extrasIds);
    }
    if (filter.roomProductIds && filter.roomProductIds.length > 0) {
      where.roomProductId = In(filter.roomProductIds);
    }
    if (filter.hotelIds && filter.hotelIds.length > 0) {
      where.hotelId = In(filter.hotelIds);
    }
    if (filter.types && filter.types.length > 0) {
      where.type = In(filter.types);
    }
    return this.roomProductExtraRepository.find({
      where,
      select,
      relations
    });
  }

  findByExtrasIds(extrasIds: string[]): Promise<RoomProductExtra[]> {
    return this.roomProductExtraRepository.find({
      where: {
        extrasId: In(extrasIds)
      }
    });
  }
}
