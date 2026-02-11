import { Module } from '@nestjs/common';
import { RoomProductFeatureRateAdjustmentRepository } from '../repositories/room-product-feature-rate-adjustment.repository';
import { RoomProductFeatureRateAdjustmentController } from '../controllers/room-product-feature-rate-adjustment.controller';
import { RoomProductFeatureRateAdjustmentMapper } from '../mappers/room-product-feature-rate-adjustment.mapper';
import { RoomProductFeatureRateAdjustmentRepositoryModule } from './room-product-feature-rate-adjustment-repository.module';

@Module({
  imports: [RoomProductFeatureRateAdjustmentRepositoryModule],
  providers: [ ],
  controllers: [RoomProductFeatureRateAdjustmentController],
  exports: []
})
export class RoomProductFeatureRateAdjustmentModule {}
