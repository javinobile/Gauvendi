import { Country } from '@entities/core-entities/country.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { DbName } from '@constants/db-name.constant';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService],
  imports: [TypeOrmModule.forFeature([Country], DbName.Postgres)],
  exports: [CountriesService]
})
export class CountriesModule {}
