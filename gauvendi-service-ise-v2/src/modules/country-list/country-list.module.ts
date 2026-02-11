import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { Country } from 'src/core/entities/core-entities/country.entity';
import { CountryListController } from './country-list.controller';
import { CountryListService } from './country-list.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country], DB_NAME.POSTGRES)],
  controllers: [CountryListController],
  providers: [CountryListService]
})
export class CountryListModule {}
