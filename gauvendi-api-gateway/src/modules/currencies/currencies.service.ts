import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CurrencyQueryDto } from "./currencies.dto";

@Injectable()
export class CurrenciesService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy
  ) {}

  getCurrencies(query: CurrencyQueryDto) {
    return this.hotelClient.send({ cmd: "get_currencies" }, query);
  }
}
