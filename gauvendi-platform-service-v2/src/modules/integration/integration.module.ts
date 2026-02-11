import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';
import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { DbName } from '@constants/db-name.constant';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelConfiguration, Hotel], DbName.Postgres)],
  controllers: [IntegrationController],
  providers: [IntegrationService]
})
export class IntegrationModule {}
