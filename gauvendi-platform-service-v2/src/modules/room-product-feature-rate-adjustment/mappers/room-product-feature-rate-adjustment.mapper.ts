import { Injectable } from '@nestjs/common';
import { RoomProductFeatureRateAdjustment } from '../../../core/entities/room-product-feature-rate-adjustment.entity';
import { RoomProductFeatureRateAdjustmentDto } from '../dto';

@Injectable()
export class RoomProductFeatureRateAdjustmentMapper {
  entityToDto(entity: RoomProductFeatureRateAdjustment): RoomProductFeatureRateAdjustmentDto | null {
    if (!entity) return null;

    return {
      id: entity.id,
      hotelId: entity.hotelId,
      roomProductId: entity.roomProductId,
      featureId: entity.featureId,
      roomProductRatePlanId: entity.roomProductRatePlanId,
      rateAdjustment: entity.rateAdjustment?.toString() || '0',
      date: entity.date,
      rateOriginal: entity.rateOriginal?.toString() || '0',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  entitiesToDtos(entities: RoomProductFeatureRateAdjustment[]): RoomProductFeatureRateAdjustmentDto[] {
    if (!entities || entities.length === 0) return [];
    return entities.map(entity => this.entityToDto(entity)).filter(dto => dto !== null) as RoomProductFeatureRateAdjustmentDto[];
  }
}
