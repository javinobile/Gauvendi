import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreClientsModule } from 'src/core/clients/core-clients.module';
import { DB_NAME } from 'src/core/constants/db.const';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { Event } from 'src/core/entities/hotel-entities/event.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { RedisModule } from 'src/core/modules/redis/redis.module';
import { S3Service } from 'src/core/s3/s3.service';
import { CalendarModule } from '../calendar/calendar.module';
import { WidgetEventFeatureRecommendationController } from './widget-event-feature-recommendation.controller';
import { WidgetEventFeatureRecommendationService } from './widget-event-feature-recommendation.service';
import { HotelRetailFeaturesModule } from '../hotel-retail-features/hotel-retail-features.module';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';

@Module({
  imports: [
    CoreClientsModule,
    CalendarModule,
    TypeOrmModule.forFeature(
      [Hotel, HotelRetailFeature, Event, Reservation, RoomProductRetailFeature],
      DB_NAME.POSTGRES
    ),
    ConfigModule,
    HttpModule,
    RedisModule
  ],
  controllers: [WidgetEventFeatureRecommendationController],
  providers: [WidgetEventFeatureRecommendationService, S3Service]
})
export class WidgetEventFeatureRecommendationModule {}
