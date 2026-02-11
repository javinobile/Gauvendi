import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { HotelConfigurationSharedModule } from '../hotel-configuration/hotel-configuration-shared.module';
import { HotelSharedModule } from '../hotel-v2/modules/hotel-shared.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { RedisModule } from 'src/core/modules/redis/redis.module';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
  imports: [
    PlatformClientModule,
    HttpModule,
    ConfigModule,
    HotelSharedModule,
    HotelConfigurationSharedModule,
    RedisModule
  ],
  exports: [CalendarService]
})
export class CalendarModule {}
