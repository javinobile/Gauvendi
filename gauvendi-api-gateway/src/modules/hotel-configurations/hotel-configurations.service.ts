import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { CreateOrUpdateAccessibilityIntegrationDto, DeleteAccessibilityIntegrationDto, HotelConfigurationDto, HotelConfigurationsQueryDto } from "./dtos/hotel-configurations-query.dto";
import { HotelOperationsQueryDto } from "./dtos/hotel-operation-query.dto";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { UpdateHotelOperationBodyDto } from "./dtos/update-hotel-operation.dto";
import { CreateOrUpdateHotelConfigurationDto } from "./dtos/create-or-update-hotel-configuration.dto";
import { UpdateHotelLastAvailabilityDateDto } from "./dtos/update-hotel-last-availability-date.dto";
import { CMD } from "@src/core/constants/cmd.const";
import { HotelConfigurationsMigrationDto } from "./dtos/hotel-configurations-migration.dto";

@Injectable()
export class HotelConfigurationsService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  async getHotelConfigurations(payload: HotelConfigurationsQueryDto) {
    return this.hotelClient.send({ cmd: "get_hotel_configurations" }, payload);
  }

  async getHotelOperations(payload: HotelOperationsQueryDto) {
    return this.hotelClient.send({ cmd: "get_hotel_operations" }, payload);
  }

  async updateHotelOperation(body: UpdateHotelOperationBodyDto) {
    return this.hotelClient.send({ cmd: "update_hotel_operation" }, body);
  }

  async createOrUpdateHotelConfiguration(payload: CreateOrUpdateHotelConfigurationDto) {
    return this.hotelClient.send({ cmd: "create_or_update_hotel_configuration" }, payload);
  }

  async updateHotelLastAvailabilityDate(payload: UpdateHotelLastAvailabilityDateDto) {
    return this.hotelClient.send({ cmd: "update_hotel_last_availability_date" }, payload);
  }

  getAccessibilityIntegration(query: HotelConfigurationDto) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_CONFIGURATION.GET_HOTEL_ACCESSIBILITY_INTEGRATION }, query);
  }

  createOrUpdateAccessibilityIntegration(payload: CreateOrUpdateAccessibilityIntegrationDto) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_CONFIGURATION.CREATE_OR_UPDATE_HOTEL_ACCESSIBILITY_INTEGRATION }, payload);
  }

  deleteAccessibilityIntegration(payload: DeleteAccessibilityIntegrationDto) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_CONFIGURATION.DELETE_HOTEL_ACCESSIBILITY_INTEGRATION }, payload);
  }

  async getMetaConversionConfig(hotelCode: string) {
    return this.hotelClient.send({ cmd: "get_meta_conversion_config" }, { hotelCode });
  }

  async migrateHotelConfigurations(payload: HotelConfigurationsMigrationDto) {
    return this.hotelClient.send({ cmd: CMD.HOTEL_CONFIGURATION.MIGRATE_HOTEL_CONFIGURATIONS }, payload);
  }
}
