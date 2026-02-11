import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { RoomProductRetailFeatureRepository } from '../repositories/room-product-retail-feature.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomProductRetailFeature], DB_NAME.POSTGRES),
    ConfigModule,
    S3Module
  ],
  providers: [RoomProductRetailFeatureRepository],
  exports: [RoomProductRetailFeatureRepository]
})
export class RoomProductRetailFeatureSharedModule {}
