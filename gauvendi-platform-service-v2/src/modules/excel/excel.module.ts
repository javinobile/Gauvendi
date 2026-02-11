import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HotelRepositoryModule } from '../hotel/modules/hotel-repository.module';
import { ReservationAmenitySharedModule } from '../reservation-amenity/modules/reservation-amenity-shared.module';
import { ReservationModule } from '../reservation/modules/reservation.module';
import { RoomProductSharedModule } from '../room-product/room-product-shared.module';
import { ExcelController } from './controllers/excel.controller';
import { ExcelExportService } from './services/excel-export.service';
import { ExcelImportService } from './services/excel-import.service';
import { ExcelValidatorService } from './services/excel-validator.service';
import { ExcelService } from './services/excel.service';

@Module({
  imports: [
    ConfigModule,
    HotelRepositoryModule,
    RoomProductSharedModule,
    ReservationModule,
    ReservationAmenitySharedModule,

  ],
  controllers: [ExcelController],
  providers: [ExcelService, ExcelImportService, ExcelExportService, ExcelValidatorService],
  exports: [ExcelService, ExcelImportService, ExcelExportService, ExcelValidatorService]
})
export class ExcelModule {}
