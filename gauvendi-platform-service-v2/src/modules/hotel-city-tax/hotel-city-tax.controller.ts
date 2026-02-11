import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  HotelCityTaxQueryDto,
  UpdateHotelCityTaxDto,
  DeleteHotelCityTaxDto,
  CreateHotelCityTaxDto,
  GetHotelCityTaxDto,
  HotelCityTaxInputDto
} from './hotel-city-tax.dto';
import { HotelCityTaxService } from './hotel-city-tax.service';
import { CMD } from '@src/core/constants/cmd.const';

@Controller()
export class HotelCityTaxController {
  constructor(private readonly hotelCityTaxService: HotelCityTaxService) {}

  @MessagePattern({ cmd: 'get_hotel_city_taxs' })
  getHotelCityTaxs(@Payload() query: HotelCityTaxQueryDto) {
    return this.hotelCityTaxService.getHotelCityTaxs(query);
  }

  @MessagePattern({ cmd: 'get_hotel_city_tax' })
  getHotelCityTax(@Payload() dto: GetHotelCityTaxDto) {
    return this.hotelCityTaxService.getHotelCityTax(dto);
  }

  @MessagePattern({ cmd: 'create_hotel_city_tax' })
  createHotelCityTax(@Payload() dto: CreateHotelCityTaxDto) {
    return this.hotelCityTaxService.createHotelCityTax(dto);
  }

  @MessagePattern({ cmd: 'update_hotel_city_tax' })
  updateHotelCityTax(@Payload() dto: UpdateHotelCityTaxDto) {
    return this.hotelCityTaxService.updateHotelCityTax(dto);
  }

  @MessagePattern({ cmd: 'delete_hotel_city_tax' })
  deleteHotelCityTax(@Payload() dto: DeleteHotelCityTaxDto) {
    return this.hotelCityTaxService.deleteHotelCityTax(dto);
  }

  @MessagePattern({ cmd: CMD.HOTEL_CITY_TAX.GET_PMS_CITY_TAX_LIST })
  getPmsCityTaxList(@Payload() payload: { hotelId: string }) {
    const { hotelId } = payload;
    return this.hotelCityTaxService.getPmsCityTaxList(hotelId);
  }

  @MessagePattern({ cmd: CMD.HOTEL_CITY_TAX.UPDATE_HOTEL_CITY_TAX_LIST })
  updateHotelCityTaxList(@Payload() payload: HotelCityTaxInputDto[]) {
    return this.hotelCityTaxService.updateHotelCityTaxList(payload);
  }
}
