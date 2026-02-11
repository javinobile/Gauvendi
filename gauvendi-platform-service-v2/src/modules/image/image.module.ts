import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Image } from '@src/core/entities/image.entity';
import { S3Module } from '@src/core/s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Image], DbName.Postgres), S3Module],
  controllers: [ImageController],
  providers: [ImageService]
})
export class ImageModule {}
