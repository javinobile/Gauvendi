import { Module } from '@nestjs/common';
import { BookingGateway } from './gateways/booking.gateway';

@Module({
  providers: [BookingGateway],
  exports: [BookingGateway]
})
export class WsModule {}
