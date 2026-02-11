import { Module } from '@nestjs/common';
import { CmSiteminderService } from './cm-siteminder.service';
import { CmSiteminderController } from './cm-siteminder.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [CmSiteminderController],
  providers: [CmSiteminderService],
  exports: [CmSiteminderService],
  imports: [HttpModule, ConfigModule],
})
export class CmSiteminderModule {}
