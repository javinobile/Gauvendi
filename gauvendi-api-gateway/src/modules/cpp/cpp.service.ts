import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CppGuestDetailFilterDto } from "./dtos/cpp-guest-detail.dto";
import { CppSearchGuestFilterDto } from "./dtos/cpp-search-guest.dto";
import { CppSmartFindingPromoCodeQueryDto } from "./dtos/cpp-smart-finding-promo-code.dto";
import { IseRecommendedOffersDto } from "./dtos/ise-recommended-offers.dto";
import { BookingFlow } from "@src/core/enums/common.enum";
import { CppAssignRoomToProductInputDto } from "./dtos/cpp-assign-room-to-product.dto";

@Injectable()
export class CppService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy
  ) {}

  cppSmartFindingPromoCode(query: CppSmartFindingPromoCodeQueryDto) {
    return this.hotelClient.send({ cmd: "cpp_smart_finding_promo_code" }, query);
  }

  cppSearchGuest(query: CppSearchGuestFilterDto) {
    return this.hotelClient.send({ cmd: "cpp_search_guest" }, query);
  }

  cppGuestDetail(query: CppGuestDetailFilterDto) {
    return this.hotelClient.send({ cmd: "cpp_guest_detail" }, query);
  }

  iseRecommendedOffers(body: IseRecommendedOffersDto) {
    return this.hotelClient.send({ cmd: "ise_recommended_offers" }, {
      ...body,
      bookingFlow: BookingFlow.DIRECT,
    });
  }

  cppAssignRoomToProducts(body: CppAssignRoomToProductInputDto) {
    return this.hotelClient.send({ cmd: "cpp_assign_room_to_products" }, body);
  }
}

