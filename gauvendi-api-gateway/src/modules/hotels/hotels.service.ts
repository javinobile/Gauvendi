import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CompleteOnboardingHotelDto, GetPaymentAccountListQueryDto, HotelInformationQueryDto, HotelsQueryDto } from "./dtos/hotel-information-query.dto";
import { UpdateHotelInformationBodyDto } from "./dtos/update-hotel-information.dto";
import { UploadHotelFaviconDto, UploadHotelImageDto, UploadHotelLogoDto } from "./dtos/upload-hotel-image.dto";
import { CreateHotelDto } from "./dtos/create-hotel.dto";
import { Auth0Payload } from "@src/core/auth/jwt.strategy";

@Injectable()
export class HotelsService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  getHotels(query: HotelsQueryDto, user: Auth0Payload) {
    return this.hotelClient.send({ cmd: "get_hotels" }, {...query, organisationId: user.organisation_id});
  }

  create(body: CreateHotelDto) {
    return this.hotelClient.send({ cmd: "create_hotel" }, body);
  }

  getPaymentAccountList(query: GetPaymentAccountListQueryDto) {
    return this.hotelClient.send({ cmd: "get_payment_account_list" }, query);
  }

  getHotelInformation(query: HotelInformationQueryDto) {
    return this.hotelClient.send({ cmd: "get_hotel_information" }, query);
  }

  getHotelMapping(hotelId: string) {
    return this.hotelClient.send({ cmd: "get_hotel_mapping" }, { hotelId });
  }

  updateHotelInformation(body: UpdateHotelInformationBodyDto) {
    return this.hotelClient.send({ cmd: "update_hotel_information" }, body);
  }
  
  completeOnboarding(body: CompleteOnboardingHotelDto) {
    return this.hotelClient.send({ cmd: "complete_onboarding_hotel" }, body);
  }

  uploadHotelFavicon(body: UploadHotelFaviconDto, file: any) {
    return this.hotelClient.send({ cmd: "upload_hotel_favicon" }, { ...body, file });
  }

  uploadHotelLogo(body: UploadHotelLogoDto, file: any) {
    return this.hotelClient.send({ cmd: "upload_hotel_logo" }, { ...body, file });
  }

  uploadEmailGeneralImages(body: UploadHotelImageDto, file: any) {
    return this.hotelClient.send({ cmd: "upload_email_general_images" }, { ...body, file });
  }
}
