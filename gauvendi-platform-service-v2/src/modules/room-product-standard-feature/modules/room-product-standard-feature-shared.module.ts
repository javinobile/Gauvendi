import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RoomProductStandardFeature } from 'src/core/entities/room-product-standard-feature.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { RoomProductStandardFeatureRepository } from '../repositories/room-product-retail-feature.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomProductStandardFeature], DB_NAME.POSTGRES),
    ConfigModule,
    S3Module
  ],
  providers: [RoomProductStandardFeatureRepository],
  exports: [RoomProductStandardFeatureRepository]
})
export class RoomProductStandardFeatureSharedModule {}
