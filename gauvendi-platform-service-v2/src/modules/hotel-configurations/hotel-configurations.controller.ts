import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HotelConfigurationsService } from './hotel-configurations.service';
import {
  CreateOrUpdateAccessibilityIntegrationDto,
  CreateOrUpdateHotelConfigurationDto,
  DeleteAccessibilityIntegrationDto
} from './dtos/create-or-update-hotel-configuration.dto';
import { HotelConfigurationsQueryDto } from './dtos/hotel-configurations-query.dto';
import { HotelOperationsQueryDto } from './dtos/hotel-operation-query.dto';
import { UpdateHotelOperationBodyDto } from './dtos/update-hotel-operation.dto';
import { UpdateHotelLastAvailabilityDateDto } from './dtos/update-hotel-last-availability-date.dto';
import { CMD } from '@src/core/constants/cmd.const';

@Controller()
export class HotelConfigurationsController {
  constructor(private readonly hotelConfigurationsService: HotelConfigurationsService) {}

  @MessagePattern({ cmd: 'get_hotel_configurations' })
  async getHotelConfigurations(@Payload() payload: HotelConfigurationsQueryDto) {
    return this.hotelConfigurationsService.getHotelConfigurations(payload);
  }

  @MessagePattern({ cmd: 'create_or_update_hotel_configuration' })
  async createOrUpdateHotelConfiguration(@Payload() payload: CreateOrUpdateHotelConfigurationDto) {
    return this.hotelConfigurationsService.createOrUpdateHotelConfiguration(payload);
  }

  @MessagePattern({ cmd: 'get_hotel_operations' })
  async getHotelOperations(@Payload() payload: HotelOperationsQueryDto) {
    return this.hotelConfigurationsService.getHotelOperations(payload);
  }

  @MessagePattern({ cmd: 'update_hotel_operation' })
  async updateHotelOperation(@Payload() payload: UpdateHotelOperationBodyDto) {
    return this.hotelConfigurationsService.updateHotelOperation(payload);
  }

  @MessagePattern({ cmd: 'update_hotel_last_availability_date' })
  async updateHotelLastAvailabilityDate(@Payload() payload: UpdateHotelLastAvailabilityDateDto) {
    return this.hotelConfigurationsService.updateHotelLastAvailabilityDate(payload);
  }

  @MessagePattern({ cmd: CMD.HOTEL_CONFIGURATION.GET_HOTEL_ACCESSIBILITY_INTEGRATION })
  async getHotelAccessibilityIntegration(@Payload() payload: { hotelId: string }) {
    return this.hotelConfigurationsService.getHotelAccessibilityIntegration(payload);
  }

  @MessagePattern({ cmd: CMD.HOTEL_CONFIGURATION.CREATE_OR_UPDATE_HOTEL_ACCESSIBILITY_INTEGRATION })
  async createOrUpdateAccessibilityIntegration(
    @Payload() payload: CreateOrUpdateAccessibilityIntegrationDto
  ) {
    return this.hotelConfigurationsService.createOrUpdateAccessibilityIntegration(payload);
  }

  @MessagePattern({ cmd: CMD.HOTEL_CONFIGURATION.DELETE_HOTEL_ACCESSIBILITY_INTEGRATION })
  async deleteAccessibilityIntegration(@Payload() payload: DeleteAccessibilityIntegrationDto) {
    return this.hotelConfigurationsService.deleteAccessibilityIntegration(payload);
  }

  @MessagePattern({ cmd: CMD.HOTEL_CONFIGURATION.MIGRATION_HOTEL_CONFIGURATIONS })
  async migrationHotelConfigurations() {
    return this.hotelConfigurationsService.migrationHotelConfigurations();
  }
}
