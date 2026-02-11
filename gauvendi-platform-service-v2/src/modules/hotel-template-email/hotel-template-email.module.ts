import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelTemplateEmail } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { HotelTemplateEmailRepository } from './repositories/hotel-template-email.repository';
import { HotelTemplateEmailService } from './services/hotel-template-email.service';
import { HotelTemplateEmailController } from './controllers/hotel-template-email.controller';
import { TranslationModule } from '../translation';

@Module({
  imports: [TypeOrmModule.forFeature([HotelTemplateEmail], DbName.Postgres), TranslationModule],
  controllers: [HotelTemplateEmailController],
  providers: [HotelTemplateEmailRepository, HotelTemplateEmailService],
  exports: [HotelTemplateEmailService]
})
export class HotelTemplateEmailModule {}
