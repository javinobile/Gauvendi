import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { CreateHotelTaxDto } from "./dto/create-hotel-tax.dto";
import { HotelTaxQueryDto } from "./dto/hotel-tax-query.dto";
import { SetDefaultHotelTaxDto } from "./dto/set-default-hotel-tax.dto";
import { HotelTaxInputDto, UpdateHotelTaxDto } from "./dto/update-hotel-tax.dto";

@Injectable()
export class HotelTaxsService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  getHotelTaxs(query: HotelTaxQueryDto) {
    return this.hotelClient.send({ cmd: "get_hotel_taxs" }, query);
  }

  getHotelTax(id: string, propertyCode: string) {
    return this.hotelClient.send({ cmd: "get_hotel_tax" }, { id, propertyCode });
  }

  createHotelTax(dto: CreateHotelTaxDto) {
    return this.hotelClient.send({ cmd: "create_hotel_tax" }, dto);
  }

  updateHotelTax(id: string, dto: UpdateHotelTaxDto) {
    return this.hotelClient.send({ cmd: "update_hotel_tax" }, { id, ...dto });
  }

  deleteHotelTax(id: string, hotelCode: string) {
    return this.hotelClient.send({ cmd: "delete_hotel_tax" }, { id, hotelCode });
  }

  setDefaultHotelTax(dto: SetDefaultHotelTaxDto) {
    return this.hotelClient.send({ cmd: "set_default_hotel_tax" }, dto);
  }

  getPmsTaxList(hotelId: string) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_TAX.GET_PMS_TAX_LIST }, hotelId);
  }

  updateHotelTaxList(dto: HotelTaxInputDto[]) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_TAX.UPDATE_HOTEL_TAX_LIST }, dto);
  }
}
