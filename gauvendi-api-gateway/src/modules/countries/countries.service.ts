import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CountryQueryDto } from "./countries.dto";

@Injectable()
export class CountriesService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy,
  ) {}

  getCountries(query: CountryQueryDto) {
    return this.hotelClient.send({ cmd: "get_countries" }, query);
  }
}
