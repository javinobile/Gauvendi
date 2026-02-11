import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { DeleteHotelAmenityDto, GetCppExtrasServiceListQueryDto, HotelAmenityInputDto, UploadHotelAmenityImageDto } from "./hotel-amenity.dto";

@Injectable()
export class HotelAmenityService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy) {}

  uploadHotelAmenityImage(body: UploadHotelAmenityImageDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.UPLOAD_IMAGE }, body);
  }

  createHotelAmenity(body: HotelAmenityInputDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.CREATE }, body);
  }

  updateHotelAmenity(body: HotelAmenityInputDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.UPDATE }, body);
  }

  deleteHotelAmenity(body: DeleteHotelAmenityDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.DELETE }, body);
  }

  getCppExtrasServiceList(query: GetCppExtrasServiceListQueryDto) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.GET_CPP_EXTRAS_SERVICE_LIST }, query);
  }

  getPmsAmenityList(hotelId: string) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.GET_PMS_AMENITY_LIST }, hotelId);
  }

  updateHotelAmenityList(dto: HotelAmenityInputDto[]) {
    return this.clientProxy.send({ cmd: CMD.HOTEL_AMENITY.UPDATE_HOTEL_AMENITY_LIST }, dto);
  }
}
