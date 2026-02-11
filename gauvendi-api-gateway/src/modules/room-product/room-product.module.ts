import { Module } from '@nestjs/common';
import { RoomProductService } from './room-product.service';
import { RoomProductController } from './room-product.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RoomProductController],
  providers: [RoomProductService],
  imports: [PlatformClientModule],
})
export class RoomProductModule {}
