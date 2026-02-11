import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PLATFORM_SERVICE } from '@src/core/clients/platform-client.module';
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
  RequestApaleoIntegrationDto
} from './dtos/integration.dto';

@Injectable()
export class IntegrationService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy) {}

  getMarketingList(query: GetIntegrationDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.MARKETING_LIST.GET_LIST }, query);
  }

  createOrUpdateGoogleAnalytics(payload: CreateOrUpdateGoogleAnalyticsDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.GOOGLE_ANALYTICS.CREATE_OR_UPDATE }, payload);
  }

  deleteGoogleAnalytics(payload: DeleteGoogleAnalyticsDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.GOOGLE_ANALYTICS.DELETE }, payload);
  }

  createOrUpdateGoogleTagManager(payload: CreateOrUpdateGoogleTagManagerDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.GOOGLE_TAG_MANAGER.CREATE_OR_UPDATE }, payload);
  }

  deleteGoogleTagManager(payload: DeleteGoogleTagManagerDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.GOOGLE_TAG_MANAGER.DELETE }, payload);
  }

  createOrUpdateGoogleAds(payload: CreateOrUpdateGoogleAdsDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.GOOGLE_ADS.CREATE_OR_UPDATE }, payload);
  }

  deleteGoogleAds(payload: DeleteGoogleAdsDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.GOOGLE_ADS.DELETE }, payload);
  }

  createOrUpdateMetaConversion(payload: CreateOrUpdateMetaConversionDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.META_CONVERSION.CREATE_OR_UPDATE }, payload);
  }

  deleteMetaConversion(payload: DeleteMetaConversionDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.META_CONVERSION.DELETE }, payload);
  }

  getPropertyTrackingList(query: PropertyTrackingListDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.PROPERTY_TRACKING.GET_LIST }, query);
  }

  createOrUpdatePropertyTracking(payload: CreateOrUpdatePropertyTrackingDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.PROPERTY_TRACKING.CREATE_OR_UPDATE }, payload);
  }

  deletePropertyTracking(payload: DeletePropertyTrackingDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.PROPERTY_TRACKING.DELETE }, payload);
  }

  requestApaleoIntegration(payload: RequestApaleoIntegrationDto) {
    return this.hotelClient.send({ cmd: CMD.INTEGRATION.REQUEST_APALEO_INTEGRATION }, payload);
  }
}
