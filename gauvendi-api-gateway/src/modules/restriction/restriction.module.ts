import { Module } from '@nestjs/common';
import { RestrictionService } from './restriction.service';
import { RestrictionController } from './restriction.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [RestrictionController],
  providers: [RestrictionService],
  imports: [PlatformClientModule],
})
export class RestrictionModule {}
