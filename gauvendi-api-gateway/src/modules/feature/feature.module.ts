import { Module } from '@nestjs/common';
import { FeatureService } from './feature.service';
import { FeatureController } from './feature.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  imports: [PlatformClientModule],
})
export class FeatureModule {}
