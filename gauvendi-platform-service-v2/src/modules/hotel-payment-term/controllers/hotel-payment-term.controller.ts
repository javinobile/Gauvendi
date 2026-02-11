import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import {
  HotelPaymentTermFilterDto,
  HotelPaymentTermInputDto
} from '../dtos/hotel-payment-term.dto';
import { HotelPaymentTermService } from '../services/hotel-payment-term.service';

@Controller('hotel-payment-term')
export class HotelPaymentTermController {
  constructor(private readonly hotelPaymentTermService: HotelPaymentTermService) {}

  @MessagePattern({ cmd: "hotel_payment_terms_migrate_translation" })
  async hotelPaymentTermsMigrateTranslation() {
    return await this.hotelPaymentTermService.hotelPaymentTermsMigrateTranslation();
  }

  @MessagePattern({ cmd: CMD.HOTEL_PAYMENT_TERM.GET_LIST })
  async hotelPaymentTermList(@Payload() filter: HotelPaymentTermFilterDto) {
    return await this.hotelPaymentTermService.getHotelPaymentTerms(filter);
  }

  @MessagePattern({ cmd: CMD.HOTEL_PAYMENT_TERM.CREATE })
  async createHotelPaymentTerm(@Payload() input: HotelPaymentTermInputDto) {
    return await this.hotelPaymentTermService.createOrUpdateHotelPaymentTerm(input);
  }

  @MessagePattern({ cmd: CMD.HOTEL_PAYMENT_TERM.UPDATE })
  async updateHotelPaymentTerm(@Payload() input: HotelPaymentTermInputDto) {
    return await this.hotelPaymentTermService.createOrUpdateHotelPaymentTerm(input);
  }

  @MessagePattern({ cmd: CMD.HOTEL_PAYMENT_TERM.DELETE })
  async deleteHotelPaymentTerm(@Payload() input: HotelPaymentTermFilterDto) {
    return await this.hotelPaymentTermService.deleteHotelPaymentTerm(input);
  }
}
