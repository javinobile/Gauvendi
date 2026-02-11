import { Module } from '@nestjs/common';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService],
  imports: [PlatformClientModule],
})
export class CountriesModule {}
