import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from 'src/core/constants/db-name.constant';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { RoomUnitRepository } from './room-unit.repository';
@Module({
  controllers: [],
  providers: [RoomUnitRepository],
  imports: [TypeOrmModule.forFeature([RoomUnit, RoomUnitAvailability], DbName.Postgres)],
  exports: [RoomUnitRepository]
})
export class RoomUnitRepositoryModule {}
