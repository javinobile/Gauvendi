import { Module } from '@nestjs/common';
import { GoogleHotelService } from './google-hotel.service';
import { GoogleHotelController } from './google-hotel.controller';
import { GoogleInterfaceClientModule } from '@src/core/client/google-interface-client.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleHotelEntity } from '@src/core/entities/google-entities/google-hotel.entity';
import { DbName } from '@src/core/constants/db-name.constant';

@Module({
  controllers: [GoogleHotelController],
  providers: [GoogleHotelService],
  imports: [GoogleInterfaceClientModule, TypeOrmModule.forFeature([GoogleHotelEntity], DbName.Postgres)]
})
export class GoogleHotelModule {}
