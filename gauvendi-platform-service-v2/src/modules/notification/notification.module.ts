import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { S3Module } from '@src/core/s3/s3.module';
import {
  EmailHistory,
  EmailHistorySchema
} from '@src/core/schemas/email-history/email-history.schema';
import { BookingSummaryModule } from '../booking-summary/booking-summary.module';
import { HotelAmenitySharedModule } from '../hotel-amenity/modules/hotel-amenity-shared.module';
import { HotelConfigurationSharedModule } from '../hotel-configuration/hotel-configuration-shared.module';
import { HotelTemplateEmailModule } from '../hotel-template-email/hotel-template-email.module';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { HotelsModule } from '../hotels/hotels.module';
import { PdfModule } from '../pdf/pdf.module';
import { ReservationSharedModule } from '../reservation/modules/reservation-shared.module';
import { RoomProductHotelExtraListModule } from '../room-product-hotel-extra-list/room-product-hotel-extra-list.module';
import { TranslationModule } from '../translation/translation.module';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { SendgridService } from './services/sendgrid.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([BookingProposalSetting], DbName.Postgres),
    S3Module,
    ConfigModule,
    MongooseModule.forFeature([{ name: EmailHistory.name, schema: EmailHistorySchema }]),
    BookingSummaryModule,
    HotelsModule,
    HotelRepositoryModule,
    HotelConfigurationSharedModule,
    HotelTemplateEmailModule,
    TranslationModule,
    RoomProductHotelExtraListModule,
    HotelAmenitySharedModule,
    ReservationSharedModule,
    PdfModule
  ],
  controllers: [NotificationController],
  providers: [NotificationService, SendgridService],
  exports: [NotificationService, SendgridService, TypeOrmModule]
})
export class NotificationModule {}
