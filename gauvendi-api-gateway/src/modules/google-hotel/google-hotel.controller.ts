import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { GetGoogleHotelListDto, GoogleHotelActivateDto, GoogleHotelInitializeDto, GoogleHotelOnboardingDto } from "./google-hotel.dto";
import { GoogleHotelService } from "./google-hotel.service";

@Controller("google-hotel")
export class GoogleHotelController {
  constructor(private readonly googleHotelService: GoogleHotelService) {}

  @Post("onboarding")
  async googleHotelOnboarding(@Body() body: GoogleHotelOnboardingDto) {
    const { hotelId } = body;
    return this.googleHotelService.googleHotelOnboarding(hotelId);
  }

  @Post("activate")
  async googleHotelActivate(@Body() body: GoogleHotelActivateDto) {
    const { hotelId } = body;
    return this.googleHotelService.googleHotelActivate(hotelId);
  }

  @Post("initialize")
  async googleHotelInitialize(@Body() body: GoogleHotelInitializeDto) {
    const { hotelId } = body;
    return this.googleHotelService.googleHotelInitialize(hotelId);
  }

  @Post("disconnect")
  async googleHotelDelete(@Body() body: GoogleHotelInitializeDto) {
    const { hotelId } = body;
    return this.googleHotelService.googleHotelDelete(hotelId);
  }
}
