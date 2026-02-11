import { Module } from '@nestjs/common';
import { RoomUnitService } from './room-unit.service';
import { RoomUnitController } from './room-unit.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RoomUnitController],
  providers: [RoomUnitService],
  imports: [PlatformClientModule],
})
export class RoomUnitModule {}
