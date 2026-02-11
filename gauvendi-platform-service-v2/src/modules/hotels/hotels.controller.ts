import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  HotelInformationQueryDto,
  UpdateHotelInformationBodyDto,
  HotelsQueryDto,
  GetPaymentAccountListQueryDto
} from './hotels.dto';
import { HotelsService } from './hotels.service';
import {
  UploadHotelFaviconDto,
  UploadEmailGeneralImagesDto,
  UploadHotelLogoDto
} from './dtos/upload-hotel-image.dto';
import { CMD } from '@src/core/constants/cmd.const';

@Controller()
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @MessagePattern({ cmd: 'get_hotels' })
  async getHotels(@Payload() payload: HotelsQueryDto) {
    return this.hotelsService.getHotels(payload);
  }

  @MessagePattern({ cmd: 'get_payment_account_list' })
  async getPaymentAccountList(@Payload() payload: GetPaymentAccountListQueryDto) {
    return this.hotelsService.getPaymentAccountList(payload);
  }

  @MessagePattern({ cmd: 'get_hotel_information' })
  async getHotelInformation(@Payload() payload: HotelInformationQueryDto) {
    return this.hotelsService.getHotelInformation(payload);
  }

  @MessagePattern({ cmd: 'get_hotel_mapping' })
  async getHotelMapping(@Payload() payload: { hotelId: string }) {
    return this.hotelsService.getHotelMapping(payload);
  }

  @MessagePattern({ cmd: 'update_hotel_information' })
  async updateHotelInformation(@Payload() payload: UpdateHotelInformationBodyDto) {
    return this.hotelsService.updateHotelInformation(payload);
  }

  @MessagePattern({ cmd: 'upload_hotel_favicon' })
  async uploadHotelFavicon(@Payload() payload: UploadHotelFaviconDto & { file: any }) {
    return this.hotelsService.uploadHotelFavicon(payload);
  }

  @MessagePattern({ cmd: 'upload_hotel_logo' })
  async uploadHotelLogo(@Payload() payload: UploadHotelLogoDto & { file: any }) {
    return this.hotelsService.uploadHotelLogo(payload);
  }

  @MessagePattern({ cmd: CMD.HOTEL.UPLOAD_EMAIL_GENERAL_IMAGES })
  async uploadEmailGeneralImages(@Payload() payload: UploadEmailGeneralImagesDto & { file: any }) {
    return this.hotelsService.uploadHotelImages(payload);
  }
}
