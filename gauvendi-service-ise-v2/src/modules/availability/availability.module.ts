import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { PlatformClientModule } from 'src/core/clients/platform-client.module';
import { AvailabilityService } from './services/availability.service';
import { RoomRepository } from './repositories/room.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomUnit], DB_NAME.POSTGRES),
    HttpModule,
    ConfigModule,
    PlatformClientModule
  ],
  providers: [AvailabilityService, RoomRepository],
  exports: [TypeOrmModule, AvailabilityService, RoomRepository]
})
export class AvailabilityModule {}
