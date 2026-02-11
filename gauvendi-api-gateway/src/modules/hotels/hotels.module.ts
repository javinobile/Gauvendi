import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService],
  imports: [PlatformClientModule],
})
export class HotelsModule {}
