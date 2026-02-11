import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomProductMappingRepository } from '../repositories/room-product-mapping.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RoomProductMapping], DbName.Postgres)],
  providers: [RoomProductMappingRepository],
  exports: [RoomProductMappingRepository]
})
export class RoomProductMappingSharedModule {}
