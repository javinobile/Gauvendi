import { Injectable, Logger } from '@nestjs/common';
import { HotelMarketSegment } from '@src/core/entities/hotel-entities/hotel-market-segment.entity';
import {
  HotelMarketSegmentDeleteDto,
  HotelMarketSegmentFilterDto,
  HotelMarketSegmentInputDto,
  SetMarketSegmentStatusDto
} from '../dtos/hotel-market-segment.dto';
import { HotelMarketSegmentRepository } from '../repositories/hotel-market-segment.repository';

@Injectable()
export class HotelMarketSegmentService {
  private readonly logger = new Logger(HotelMarketSegmentService.name);

  constructor(private readonly hotelMarketSegmentRepository: HotelMarketSegmentRepository) {}

  async getHotelMarketSegments(filter: HotelMarketSegmentFilterDto): Promise<HotelMarketSegment[]> {
    try {
      const data = await this.hotelMarketSegmentRepository.getHotelMarketSegments(filter);
      return data;
    } catch (error) {
      this.logger.error('getHotelMarketSegments error: ', error);
      throw error;
    }
  }

  async createOrUpdateHotelMarketSegment(input: HotelMarketSegmentInputDto) {
    try {
      const result =
        await this.hotelMarketSegmentRepository.createOrUpdateHotelMarketSegment(input);

      return result;
    } catch (error) {
      this.logger.error('createOrUpdateHotelMarketSegment error: ', error);
      throw error;
    }
  }

  async deleteHotelMarketSegment(body: HotelMarketSegmentDeleteDto) {
    try {
      const result = await this.hotelMarketSegmentRepository.deleteHotelMarketSegment(body);
      return result;
    } catch (error) {
      this.logger.error('deleteHotelMarketSegment error: ', error);
      throw error;
    }
  }

  async setMarketSegmentStatus(payload: SetMarketSegmentStatusDto) {
    try {
      const result = await this.hotelMarketSegmentRepository.setMarketSegmentStatus(
        payload.propertyCode,
        payload.idList,
        payload.status
      );

      return result;
    } catch (error) {
      this.logger.error('setMarketSegmentStatus error: ', error);
      throw error;
    }
  }
}
