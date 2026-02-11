import { DbName } from '@constants/db-name.constant';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '@src/core/entities/hotel-entities/event.entity';
import { HotelEventsController } from './hotel-events.controller';
import { HotelEventsService } from './hotel-events.service';
import { EventCategory } from '@src/core/entities/hotel-entities/event-category.entity';
import { EventLabel } from '@src/core/entities/hotel-entities/event-label.entity';
import { EventFeature } from '@src/core/entities/hotel-entities/event-feature.entity';

@Module({
  controllers: [HotelEventsController],
  providers: [HotelEventsService],
  imports: [TypeOrmModule.forFeature([Event, EventCategory, EventLabel, EventFeature], DbName.Postgres)]
})
export class HotelEventsModule {}
  