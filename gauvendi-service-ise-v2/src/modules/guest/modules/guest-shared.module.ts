import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { S3Module } from 'src/core/s3/s3.module';
import { GuestRepository } from '../repositories/guest.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Guest], DB_NAME.POSTGRES), ConfigModule, S3Module],
  providers: [GuestRepository],
  exports: [GuestRepository]
})
export class GuestSharedModule {}
