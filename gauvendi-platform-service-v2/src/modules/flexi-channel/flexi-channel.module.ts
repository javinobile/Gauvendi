import { Module } from '@nestjs/common';
import { FlexiChannelService } from './flexi-channel.service';
import { FlexiChannelController } from './flexi-channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlexiHotel } from '@src/core/entities/flexi-entities/flexi-hotel.entity';
import { FlexiRatePlan } from '@src/core/entities/flexi-entities/flexi-rate-plan.entity';
import { FlexiRoomType } from '@src/core/entities/flexi-entities/flexi-room-type.entity';
import { DbName } from '@src/core/constants/db-name.constant';
import { GoogleHotelEntity } from '@src/core/entities/google-entities/google-hotel.entity';

@Module({
  controllers: [FlexiChannelController],
  providers: [FlexiChannelService],
  imports: [TypeOrmModule.forFeature([FlexiHotel, FlexiRatePlan, FlexiRoomType, GoogleHotelEntity], DbName.Postgres)]
})
export class FlexiChannelModule {}
