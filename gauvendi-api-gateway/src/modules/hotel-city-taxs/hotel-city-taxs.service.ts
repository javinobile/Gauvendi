import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CreateHotelCityTaxDto } from "./dto/create-hotel-city-tax.dto";
import { HotelCityTaxInputDto, UpdateHotelCityTaxDto } from "./dto/update-hotel-city-tax.dto";
import { HotelCityTaxQueryDto } from "./dto/hotel-city-tax-query.dto";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";

@Injectable()
export class HotelCityTaxsService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  getHotelCityTaxs(query: HotelCityTaxQueryDto) {
    return this.hotelClient.send({ cmd: "get_hotel_city_taxs" }, query);
  }

  getHotelCityTax(id: string, hotelCode: string) {
    return this.hotelClient.send({ cmd: "get_hotel_city_tax" }, { id, hotelCode });
  }

  createHotelCityTax(dto: CreateHotelCityTaxDto) {
    return this.hotelClient.send({ cmd: "create_hotel_city_tax" }, dto);
  }

  updateHotelCityTax(id: string, dto: UpdateHotelCityTaxDto) {
    return this.hotelClient.send({ cmd: "update_hotel_city_tax" }, { id, ...dto });
  }

  deleteHotelCityTax(id: string, hotelCode: string) {
    return this.hotelClient.send({ cmd: "delete_hotel_city_tax" }, { id, hotelCode });
  }

  getPmsCityTaxList(hotelId: string) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_CITY_TAX.GET_PMS_CITY_TAX_LIST }, hotelId);
  }

  updateHotelCityTaxList(dto: HotelCityTaxInputDto[]) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_CITY_TAX.UPDATE_HOTEL_CITY_TAX_LIST }, dto);
  }
}
