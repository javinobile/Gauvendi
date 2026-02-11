
import { Module } from '@nestjs/common';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { PmsController } from './pms.controller';
import { PmsService } from './pms.service';

@Module({
  controllers: [PmsController],
  providers: [PmsService],
  imports: [PlatformClientModule],
})
export class PmsModule {}
