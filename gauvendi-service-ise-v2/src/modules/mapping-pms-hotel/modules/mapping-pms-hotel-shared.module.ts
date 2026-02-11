import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { MappingPmsHotelRepository } from '../repositories/mapping-pms-hotel.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MappingPmsHotel], DB_NAME.POSTGRES), ConfigModule],
  providers: [MappingPmsHotelRepository],
  exports: [MappingPmsHotelRepository]
})
export class MappingPmsHotelSharedModule {}
