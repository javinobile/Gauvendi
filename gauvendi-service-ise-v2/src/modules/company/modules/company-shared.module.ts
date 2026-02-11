import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { CompanyRepository } from '../repositories/company.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Company], DB_NAME.POSTGRES), ConfigModule],
  providers: [CompanyRepository],
  exports: [CompanyRepository]
})
export class CompanySharedModule {}
