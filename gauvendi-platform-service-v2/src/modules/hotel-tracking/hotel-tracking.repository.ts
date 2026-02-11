import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DbName } from '../../core/constants/db-name.constant';
import {
  HotelTracking,
  HotelTrackingTypeEnum,
} from '../../core/entities/hotel-tracking-entities/hotel-tracking.entity';

@Injectable()
export class HotelTrackingRepository extends Repository<HotelTracking> {
  constructor(
    @InjectDataSource(DbName.Postgres)
    private dataSource: DataSource,
  ) {
    super(HotelTracking, dataSource.createEntityManager());
  }

  async findByHotelCode(hotelCode: string): Promise<HotelTracking[]> {
    return this.find({
      where: { hotelCode },
      order: { createdAt: 'DESC' },
    });
  }

  async findByHotelId(hotelId: string): Promise<HotelTracking[]> {
    return this.find({
      where: { hotelId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByHotelCodeAndType(
    hotelCode: string,
    hotelTrackingType: HotelTrackingTypeEnum,
  ): Promise<HotelTracking | null> {
    return this.findOne({
      where: { hotelCode, hotelTrackingType },
    });
  }

  async findByHotelIdAndType(
    hotelId: string,
    hotelTrackingType: HotelTrackingTypeEnum,
  ): Promise<HotelTracking | null> {
    return this.findOne({
      where: { hotelId, hotelTrackingType },
    });
  }

  async upsertByHotelCodeAndType(
    data: Partial<HotelTracking> & { hotelCode: string; hotelTrackingType: HotelTrackingTypeEnum },
  ): Promise<HotelTracking> {
    const existing = await this.findByHotelCodeAndType(
      data.hotelCode,
      data.hotelTrackingType,
    );

    if (existing) {
      await this.update(existing.id, {
        metadata: data.metadata,
        isActive: data.isActive ?? existing.isActive,
      });
      const updated = await this.findOne({ where: { id: existing.id } });
      return updated!;
    }

    const entity = this.create(data);
    return this.save(entity);
  }

  async deleteByHotelCodeAndType(
    hotelCode: string,
    hotelTrackingType: HotelTrackingTypeEnum,
  ): Promise<boolean> {
    const result = await this.delete({ hotelCode, hotelTrackingType });
    return (result.affected ?? 0) > 0;
  }
}
