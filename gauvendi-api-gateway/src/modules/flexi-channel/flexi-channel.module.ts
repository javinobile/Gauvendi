import { Module } from '@nestjs/common';
import { FlexiChannelService } from './flexi-channel.service';
import { FlexiChannelController } from './flexi-channel.controller';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';

@Module({
  controllers: [FlexiChannelController],
  providers: [FlexiChannelService],
  imports: [PlatformClientModule]
})
export class FlexiChannelModule {}
