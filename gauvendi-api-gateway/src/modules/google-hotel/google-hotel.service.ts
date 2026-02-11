import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PLATFORM_SERVICE } from '@src/core/clients/platform-client.module';
import { GetGoogleHotelListDto } from './google-hotel.dto';

@Injectable()
export class GoogleHotelService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformService: ClientProxy) {}

  async googleHotelOnboarding(hotelId: string) {
    return this.platformService.send({ cmd: 'google.property.onboard' }, { hotelId });
  }

  async googleHotelActivate(hotelId: string) {
    return this.platformService.send({ cmd: 'google.property.activate' }, { hotelId });
  }

  async googleHotelInitialize(hotelId: string) {
    return this.platformService.send({ cmd: 'google.property.initialize' }, { hotelId });
  }

  async googleHotelDelete(hotelId: string) {
    return this.platformService.send({ cmd: 'google.property.delete' }, { hotelId });
  }

  
}
