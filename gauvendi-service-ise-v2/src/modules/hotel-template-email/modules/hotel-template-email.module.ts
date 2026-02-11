import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HotelSharedModule } from 'src/modules/hotel-v2/modules/hotel-shared.module';
import { HotelTemplateEmailController } from '../controllers/hotel-template-email.controller';
import { HotelTemplateEmailService } from '../services/hotel-template-email.service';
import { HotelTemplateEmailSharedModule } from './hotel-template-email-shared.module';

@Module({
  imports: [ConfigModule, HotelTemplateEmailSharedModule, HotelSharedModule],
  providers: [HotelTemplateEmailService],
  controllers: [HotelTemplateEmailController]
})
export class HotelTemplateEmailModule {}
