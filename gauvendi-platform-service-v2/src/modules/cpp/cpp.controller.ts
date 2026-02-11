import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { CppService } from './cpp.service';
import { CppCalculateRoomProductPriceFilterDto, CppSmartFindingPromoCodeFilterDto } from './dtos/cpp-calculate-room-product-price.dto';
import { CppCalendarRoomProductFilterDto } from './dtos/cpp-calendar-room-product.dto';
import { CppRatePlanFilterDto } from './dtos/cpp-rate-plan.dto';
import { CppSearchGuestFilterDto } from './dtos/cpp-search-guest.dto';
import { CppGuestDetailFilterDto } from './dtos/cpp-guest-detail.dto';
import { IseRecommendedOffersDto } from './dtos/ise-recommended-offers.dto';
import { CppAssignRoomToProductInputDto } from './dtos/cpp-assign-room-to-product.dto';

@Controller('cpp')
export class CppController {
  constructor(private readonly cppService: CppService) {}

  @MessagePattern({ cmd: CMD.RATE_PLAN.GET_CPP_RATE_PLANS })
  async getCPPRatePlans(@Payload() filterDto: CppRatePlanFilterDto) {
    return this.cppService.getCPPRatePlans(filterDto);
  }
  @MessagePattern({ cmd: CMD.ROOM_PRODUCT.GET_CPP_CALENDAR_ROOM_PRODUCTS })
  getCPPCalendarRoomProducts(@Payload() payload: CppCalendarRoomProductFilterDto) {
    return this.cppService.getCPPCalendarRoomProducts(payload);
  }

  @MessagePattern({ cmd: CMD.ROOM_PRODUCT.GET_CPP_CALCULATE_ROOM_PRODUCT_PRICE_LIST_V2 })
  getCppCalculateRoomProductPriceListV2(@Payload() payload: CppCalculateRoomProductPriceFilterDto) {
    return this.cppService.getCppCalculateRoomProductPriceListV2(payload);
  }
  
  @MessagePattern({ cmd: CMD.RATE_PLAN.CPP_SMART_FINDING_PROMO_CODE })
  async cppSmartFindingPromoCode(@Payload() filterDto: CppSmartFindingPromoCodeFilterDto) {
    return this.cppService.cppSmartFindingPromoCode(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CPP_SEARCH_GUEST })
  async cppSearchGuest(@Payload() filterDto: CppSearchGuestFilterDto) {
    return this.cppService.cppSearchGuest(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CPP_GUEST_DETAIL })
  async cppGuestDetail(@Payload() filterDto: CppGuestDetailFilterDto) {
    return this.cppService.cppGuestDetail(filterDto);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.ISE_RECOMMENDED_OFFERS })
  async iseRecommendedOffers(@Payload() body: IseRecommendedOffersDto) {
    return this.cppService.iseRecommendedOffers(body);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN.CPP_ASSIGN_ROOM_TO_PRODUCTS })
  async cppAssignRoomToProducts(@Payload() body: CppAssignRoomToProductInputDto) {
    return this.cppService.cppAssignRoomToProducts(body);
  }
}
