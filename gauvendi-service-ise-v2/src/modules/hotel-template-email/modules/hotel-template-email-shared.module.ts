import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelTemplateEmail } from 'src/core/entities/hotel-entities/hotel-template-email.entity';
import { HotelTemplateEmailRepository } from '../repositories/hotel-template-email.repository';

@Module({
  imports: [TypeOrmModule.forFeature([HotelTemplateEmail], DB_NAME.POSTGRES), ConfigModule],
  providers: [HotelTemplateEmailRepository],
  exports: [HotelTemplateEmailRepository]
})
export class HotelTemplateEmailSharedModule {}
