import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductMappingPmsRepository } from '../repositories/room-product-mapping-pms.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RoomProductMappingPms], DbName.Postgres)],
  providers: [RoomProductMappingPmsRepository],
  exports: [RoomProductMappingPmsRepository]
})
export class RoomProductMappingPmsSharedModule {}
