import { Module } from '@nestjs/common';
import { PlatformClientModule } from '../../core/clients/platform-client.module';
import { PropertyTrackingController } from './property-tracking.controller';
import { PropertyTrackingService } from './property-tracking.service';

@Module({
  imports: [PlatformClientModule],
  controllers: [PropertyTrackingController],
  providers: [PropertyTrackingService],
  exports: [PropertyTrackingService],
})
export class PropertyTrackingModule {}
