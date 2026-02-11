import { Module } from '@nestjs/common';
import { S3Module } from 'src/core/s3/s3.module';
import { HotelConfigurationSharedModule } from 'src/modules/hotel-configuration/hotel-configuration-shared.module';
import { HotelSharedModule } from 'src/modules/hotel-v2/modules/hotel-shared.module';
import { RoomProductController } from '../controllers/room-product.controller';
import { RoomProductService } from '../services/room-product.service';

@Module({
  imports: [S3Module, HotelConfigurationSharedModule, HotelSharedModule],
  controllers: [RoomProductController],
  providers: [RoomProductService],
  exports: [RoomProductService]
})
export class RoomProductModule {}
