import { Module } from '@nestjs/common';
import { PlatformClientModule } from '@src/core/clients/platform-client.module';
import { HotelAgeCategoriesService } from './hotel-age-categories.service';
import { HotelAgeCategoriesController } from './hotel-age-categories.controller';

@Module({
  controllers: [HotelAgeCategoriesController],
  providers: [HotelAgeCategoriesService],
  imports: [PlatformClientModule],
})
export class HotelAgeCategoriesModule {}
