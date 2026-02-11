import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelPaymentTermFilterDto, HotelPaymentTermInputDto } from "./hotel-payment-term.dto";

@Injectable()
export class HotelPaymentTermService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  migrateTranslation() {
    return this.clientProxy.send({ cmd: "hotel_payment_terms_migrate_translation" }, {});
  }

  getHotelPaymentTermList(query: HotelPaymentTermFilterDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_PAYMENT_TERM.GET_LIST }, query);
  }

  createHotelPaymentTerm(body: HotelPaymentTermInputDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_PAYMENT_TERM.CREATE }, body);
  }

  updateHotelPaymentTerm(body: HotelPaymentTermInputDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_PAYMENT_TERM.UPDATE }, body);
  }

  deleteHotelPaymentTerm(body: HotelPaymentTermFilterDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_PAYMENT_TERM.DELETE }, body);
  }
}
