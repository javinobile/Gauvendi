import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IntegrationService } from './integration.service';
import { CMD } from '@src/core/constants/cmd.const';
import {
  CreateOrUpdateGoogleAnalyticsDto,
  CreateOrUpdateGoogleAdsDto,
  CreateOrUpdateGoogleTagManagerDto,
  CreateOrUpdateMetaConversionDto,
  CreateOrUpdatePropertyTrackingDto,
  DeleteGoogleAnalyticsDto,
  DeleteGoogleAdsDto,
  DeleteGoogleTagManagerDto,
  DeleteMetaConversionDto,
  DeletePropertyTrackingDto,
  GetIntegrationDto,
  PropertyTrackingListDto,
  GetApaleoIntegrationDto
} from './dtos/integration.dto';

@Controller()
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @MessagePattern({ cmd: CMD.INTEGRATION.REQUEST_APALEO_INTEGRATION })
  async requestApaleoIntegration(@Payload() payload: GetApaleoIntegrationDto) {
    return this.integrationService.requestApaleoIntegration(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.MARKETING_LIST.GET_LIST })
  async getMarketingList(@Payload() payload: GetIntegrationDto) {
    return this.integrationService.getMarketingList(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.GOOGLE_ANALYTICS.CREATE_OR_UPDATE })
  async createOrUpdateGoogleAnalytics(@Payload() payload: CreateOrUpdateGoogleAnalyticsDto) {
    return this.integrationService.createOrUpdateGoogleAnalytics(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.GOOGLE_ANALYTICS.DELETE })
  async deleteGoogleAnalytics(@Payload() payload: DeleteGoogleAnalyticsDto) {
    return this.integrationService.deleteGoogleAnalytics(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.GOOGLE_TAG_MANAGER.CREATE_OR_UPDATE })
  async createOrUpdateGoogleTagManager(@Payload() payload: CreateOrUpdateGoogleTagManagerDto) {
    return this.integrationService.createOrUpdateGoogleTagManager(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.GOOGLE_TAG_MANAGER.DELETE })
  async deleteGoogleTagManager(@Payload() payload: DeleteGoogleTagManagerDto) {
    return this.integrationService.deleteGoogleTagManager(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.GOOGLE_ADS.CREATE_OR_UPDATE })
  async createOrUpdateGoogleAds(@Payload() payload: CreateOrUpdateGoogleAdsDto) {
    return this.integrationService.createOrUpdateGoogleAds(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.GOOGLE_ADS.DELETE })
  async deleteGoogleAds(@Payload() payload: DeleteGoogleAdsDto) {
    return this.integrationService.deleteGoogleAds(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.META_CONVERSION.CREATE_OR_UPDATE })
  async createOrUpdateMetaConversion(@Payload() payload: CreateOrUpdateMetaConversionDto) {
    return this.integrationService.createOrUpdateMetaConversion(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.META_CONVERSION.DELETE })
  async deleteMetaConversion(@Payload() payload: DeleteMetaConversionDto) {
    return this.integrationService.deleteMetaConversion(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.PROPERTY_TRACKING.GET_LIST })
  async getPropertyTrackingList(@Payload() payload: PropertyTrackingListDto) {
    return this.integrationService.getPropertyTrackingList(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.PROPERTY_TRACKING.CREATE_OR_UPDATE })
  async createOrUpdatePropertyTracking(@Payload() payload: CreateOrUpdatePropertyTrackingDto) {
    return this.integrationService.createOrUpdatePropertyTracking(payload);
  }

  @MessagePattern({ cmd: CMD.INTEGRATION.PROPERTY_TRACKING.DELETE })
  async deletePropertyTracking(@Payload() payload: DeletePropertyTrackingDto) {
    return this.integrationService.deletePropertyConfig(payload);
  }
}
