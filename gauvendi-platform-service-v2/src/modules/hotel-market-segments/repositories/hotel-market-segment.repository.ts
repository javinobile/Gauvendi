import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelMarketSegment } from '@src/core/entities/hotel-entities/hotel-market-segment.entity';
import { MarketSegmentStatusEnum } from '@src/core/enums/common';
import { BadRequestException, DatabaseException } from '@src/core/exceptions';
import { BaseService } from '@src/core/services/base.service';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  HotelMarketSegmentDeleteDto,
  HotelMarketSegmentFilterDto,
  HotelMarketSegmentInputDto
} from '../dtos/hotel-market-segment.dto';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';

@Injectable()
export class HotelMarketSegmentRepository extends BaseService {
  constructor(
    @InjectRepository(HotelMarketSegment, DbName.Postgres)
    private readonly hotelMarketSegmentRepository: Repository<HotelMarketSegment>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelMarketSegments(filter: HotelMarketSegmentFilterDto): Promise<HotelMarketSegment[]> {
    try {
      const { propertyCode, idList, codeList, statusList } = filter;

      const where: FindOptionsWhere<HotelMarketSegment> = {
        hotel: { code: propertyCode }
      };

      if (idList?.length) {
        where.id = In(idList);
      }

      if (codeList?.length) {
        where.code = In(codeList);
      }

      if (statusList?.length) {
        where.status = In(statusList);
      }

      return await this.hotelMarketSegmentRepository.find({
        where
      });
    } catch (error) {
      throw new DatabaseException('get hotel market segment list error: ', error?.message);
    }
  }

  async createOrUpdateHotelMarketSegment(
    input: HotelMarketSegmentInputDto
  ): Promise<HotelMarketSegment> {
    try {
      const { id, propertyCode, code, name, description, status } = input;
      const hotel = await this.hotelRepository.findOne({ where: { code: propertyCode } });
      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }
      // Check if code already exists for this hotel (when creating or updating with different id)
      if (!id || (id && code)) {
        const existing = await this.hotelMarketSegmentRepository.findOne({
          where: { hotel: { code: propertyCode }, code }
        });

        if (existing && existing.id !== id) {
          throw new BadRequestException(
            `Market segment with code "${code}" already exists for this hotel`
          );
        }
      }
      const marketSegment: Partial<HotelMarketSegment> = {
        id: id || uuidv4(),
        hotelId: hotel.id,
        code,
        name,
        description: description || '',
        status: status || MarketSegmentStatusEnum.INACTIVE
      };
      const result = await this.hotelMarketSegmentRepository.save(marketSegment);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new DatabaseException('create or update market segment error: ', error?.message);
    }
  }

  async deleteHotelMarketSegment(filter: HotelMarketSegmentDeleteDto) {
    try {
      const { id } = filter;

      if (!id) {
        throw new BadRequestException('idList is required for deletion');
      }

      // Verify all market segments belong to the specified hotel
      const marketSegments = await this.hotelMarketSegmentRepository.find({
        where: { id }
      });

      if (!marketSegments) {
        throw new BadRequestException(
          'Market segment not found or do not belong to the specified hotel'
        );
      }

      return await this.hotelMarketSegmentRepository.remove(marketSegments);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new DatabaseException('delete market segment error: ', error?.message);
    }
  }

  async setMarketSegmentStatus(
    propertyCode: string,
    idList: string[],
    status: MarketSegmentStatusEnum
  ): Promise<HotelMarketSegment[]> {
    try {
      if (!idList?.length) {
        throw new BadRequestException('idList is required');
      }

      // Verify all market segments belong to the specified hotel
      const marketSegments = await this.hotelMarketSegmentRepository.find({
        where: { id: In(idList), hotel: { code: propertyCode } }
      });

      if (marketSegments.length !== idList.length) {
        throw new BadRequestException(
          'Some market segments not found or do not belong to the specified hotel'
        );
      }

      // Update status
      marketSegments.forEach((segment) => {
        segment.status = status;
        segment.updatedAt = new Date();
        segment.updatedBy = this.currentSystem;
      });

      return await this.hotelMarketSegmentRepository.save(marketSegments);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new DatabaseException('set market segment status error: ', error?.message);
    }
  }
}
