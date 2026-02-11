import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CppService } from "./cpp.service";
import { CppGuestDetailFilterDto } from "./dtos/cpp-guest-detail.dto";
import { CppSearchGuestFilterDto } from "./dtos/cpp-search-guest.dto";
import { CppSmartFindingPromoCodeQueryDto } from "./dtos/cpp-smart-finding-promo-code.dto";
import { IseRecommendedOffersDto } from "./dtos/ise-recommended-offers.dto";
import { CppAssignRoomToProductInputDto } from "./dtos/cpp-assign-room-to-product.dto";

@Controller("cpp")
export class CppController {
  constructor(private readonly cppService: CppService) {}

  @Get("smart-finding-promo-code")
  cppSmartFindingPromoCode(@Query() query: CppSmartFindingPromoCodeQueryDto) {
    return this.cppService.cppSmartFindingPromoCode(query);
  }

  @Get("search-guest")
  cppSearchGuest(@Query() query: CppSearchGuestFilterDto) {
    return this.cppService.cppSearchGuest(query);
  }

  @Get("guest-detail")
  cppGuestDetail(@Query() query: CppGuestDetailFilterDto) {
    return this.cppService.cppGuestDetail(query);
  }

  @Post("ise-recommended-offers")
  async iseRecommendedOffers(@Body() body: IseRecommendedOffersDto) {
    return this.cppService.iseRecommendedOffers(body);
  }

  @Post("assign-room-to-products")
  async cppAssignRoomToProducts(@Body() body: CppAssignRoomToProductInputDto) {
    return this.cppService.cppAssignRoomToProducts(body);
  }
}
