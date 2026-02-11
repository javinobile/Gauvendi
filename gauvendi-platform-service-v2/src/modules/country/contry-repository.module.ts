import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Country } from 'src/core/entities/core-entities/country.entity';
import { CountryRepository } from './country.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ Country], DB_NAME.POSTGRES)],
  exports: [TypeOrmModule,  CountryRepository],
  providers: [ CountryRepository]
})
export class CountryRepositoryModule {}
