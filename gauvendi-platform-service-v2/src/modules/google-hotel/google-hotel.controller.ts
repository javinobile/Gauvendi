import { Controller } from '@nestjs/common';
import { GoogleHotelService } from './google-hotel.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('google-hotel')
export class GoogleHotelController {
  constructor(private readonly googleHotelService: GoogleHotelService) {}

  @MessagePattern({ cmd: 'google.property.onboard' })
  async googleHotelOnboarding(@Payload() payload: {hotelId: string}) {
    const { hotelId } = payload;
    return this.googleHotelService.googleHotelOnboarding(hotelId);
  }

  @MessagePattern({ cmd: 'google.property.delete' })
  async googleHotelDelete(@Payload() payload: {hotelId: string}) {
    const { hotelId } = payload;
    return this.googleHotelService.googleHotelDelete(hotelId);
  }

  @MessagePattern({ cmd: 'google.property.activate' })
  async googleHotelActivate(@Payload() payload: {hotelId: string}) {
    const { hotelId } = payload;
    return this.googleHotelService.googleHotelActivate(hotelId);
  }


  @MessagePattern({ cmd: 'google.property.initialize' })
  async googleHotelInitialize(@Payload() payload: {hotelId: string}) {
    const { hotelId } = payload;
    return this.googleHotelService.googleHotelInitialize(hotelId);
  }
}
