import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  HotelTaxQueryDto,
  UpdateHotelTaxDto,
  DeleteHotelTaxDto,
  CreateHotelTaxDto,
  GetHotelTaxDto,
  SetDefaultHotelTaxDto,
  HotelTaxInputDto
} from './hotel-taxs.dto';
import { HotelTaxsService } from './hotel-taxs.service';
import { CMD } from '@src/core/constants/cmd.const';

@Controller()
export class HotelTaxsController {
  constructor(private readonly hotelTaxsService: HotelTaxsService) {}

  @MessagePattern({ cmd: 'get_hotel_taxs' })
  getHotelTaxs(@Payload() query: HotelTaxQueryDto) {
    return this.hotelTaxsService.getHotelTaxs(query);
  }

  @MessagePattern({ cmd: 'get_hotel_tax' })
  getHotelTax(@Payload() dto: GetHotelTaxDto) {
    return this.hotelTaxsService.getHotelTax(dto);
  }

  @MessagePattern({ cmd: 'create_hotel_tax' })
  createHotelTax(@Payload() dto: CreateHotelTaxDto) {
    return this.hotelTaxsService.createHotelTax(dto);
  }

  @MessagePattern({ cmd: 'update_hotel_tax' })
  updateHotelTax(@Payload() dto: UpdateHotelTaxDto) {
    return this.hotelTaxsService.updateHotelTax(dto);
  }

  @MessagePattern({ cmd: 'delete_hotel_tax' })
  deleteHotelTax(@Payload() dto: DeleteHotelTaxDto) {
    return this.hotelTaxsService.deleteHotelTax(dto);
  }

  @MessagePattern({ cmd: 'set_default_hotel_tax' })
  setDefaultHotelTax(@Payload() dto: SetDefaultHotelTaxDto) {
    return this.hotelTaxsService.setDefaultHotelTax(dto);
  }

  @MessagePattern({ cmd: CMD.HOTEL_TAX.GET_PMS_TAX_LIST })
  getPmsTaxList(@Payload() payload: { hotelId: string }) {
    const { hotelId } = payload;
    return this.hotelTaxsService.getPmsTaxList(hotelId);
  }

  @MessagePattern({ cmd: CMD.HOTEL_TAX.UPDATE_HOTEL_TAX_LIST })
  updateHotelTaxList(@Payload() payload: HotelTaxInputDto[]) {
    return this.hotelTaxsService.updateHotelTaxList(payload);
  }
}
