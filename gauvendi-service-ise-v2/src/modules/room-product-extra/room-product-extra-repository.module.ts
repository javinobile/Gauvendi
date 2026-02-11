import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductExtra } from 'src/core/entities/room-product-extra.entity';
import { RoomProductExtraRepository } from './room-product-extra.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RoomProductExtra], DB_NAME.POSTGRES), ConfigModule],
  providers: [RoomProductExtraRepository],
  exports: [RoomProductExtraRepository]
})
export class RoomProductExtraRepositoryModule {}
