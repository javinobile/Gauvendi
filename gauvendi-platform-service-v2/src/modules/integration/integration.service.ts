import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DbName } from '@constants/db-name.constant';
import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import {
  HotelConfigurationTypeEnum,
  PropertyMarketingTypeEnum,
  PropertyTrackingTypeEnum
} from '@src/core/enums/common';
import { ResponseContentStatusEnum } from '@src/core/dtos/common.dto';
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
import { isObject } from 'lodash';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { Observable, of } from 'rxjs';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationService {
  logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    private readonly configService: ConfigService
  ) {}

  async getMarketingList(payload: GetIntegrationDto) {
    const [googleAnalytics, googleTagManager, googleAds, metaConversion] = await Promise.all([
      this.getGoogleAnalytics(payload),
      this.getGoogleTagManager(payload),
      this.getGoogleAds(payload),
      this.getMetaConversion(payload)
    ]);
    return [googleAnalytics, googleAds, googleTagManager, metaConversion];
  }

  async getGoogleAnalytics(payload: GetIntegrationDto) {
    try {
      const { hotelId } = payload;
      const config = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GOOGLE_ANALYTICS
        }
      });

      if (!config) {
        return {
          metadata: {},
          isConnected: false,
          propertyId: hotelId,
          propertyMarketingType: PropertyMarketingTypeEnum.GoogleAnalytics
        };
      }

      const metadata = config.configValue?.metadata ?? {};
      const isConnected = !!metadata?.measurementId;

      return {
        metadata: metadata,
        isConnected: isConnected,
        propertyId: config.hotelId,
        propertyMarketingType: PropertyMarketingTypeEnum.GoogleAnalytics
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get Google Analytics: ${error.message}`);
    }
  }

  async getGoogleTagManager(payload: GetIntegrationDto) {
    try {
      const { hotelId } = payload;
      const config = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GTM
        }
      });

      if (!config) {
        return {
          metadata: {},
          isConnected: false,
          propertyId: hotelId,
          propertyMarketingType: PropertyMarketingTypeEnum.GoogleTagManager
        };
      }

      const metadata = config.configValue?.metadata ?? {};
      const isConnected = metadata?.containerId && metadata?.containerId.length > 0;

      return {
        metadata: metadata,
        isConnected: isConnected,
        propertyId: config.hotelId,
        propertyMarketingType: PropertyMarketingTypeEnum.GoogleTagManager
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get Google Tag Manager: ${error.message}`);
    }
  }

  async getGoogleAds(payload: GetIntegrationDto) {
    try {
      const { hotelId } = payload;
      const config = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GOOGLE_ADS
        }
      });

      if (!config) {
        return {
          metadata: {},
          isConnected: false,
          propertyId: hotelId,
          propertyMarketingType: PropertyMarketingTypeEnum.GoogleAds
        };
      }

      const metadata = config.configValue?.metadata ?? {};
      const isConnected = metadata?.conversionId && metadata?.conversionPurchaseId;

      return {
        metadata: metadata,
        isConnected: isConnected,
        propertyId: config.hotelId,
        propertyMarketingType: PropertyMarketingTypeEnum.GoogleAds
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get Google Ads: ${error.message}`);
    }
  }

  async getMetaConversion(payload: GetIntegrationDto) {
    try {
      const { hotelId } = payload;
      const config = await this.hotelConfigurationRepository.findOne({
        where: {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.META_CONVERSION
        }
      });

      if (!config) {
        return {
          metadata: {},
          isConnected: false,
          propertyId: hotelId,
          propertyMarketingType: PropertyMarketingTypeEnum.MetaConversion
        };
      }

      const metadata = config.configValue?.metadata ?? {};
      const isConnected = !!(metadata?.pixelId && metadata?.accessToken);

      return {
        metadata: metadata,
        isConnected: isConnected,
        propertyId: config.hotelId,
        propertyMarketingType: PropertyMarketingTypeEnum.MetaConversion
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get Meta Conversion: ${error.message}`);
    }
  }

  async createOrUpdateMetaConversion(payload: CreateOrUpdateMetaConversionDto) {
    try {
      const { hotelId, metadata } = payload;

      if (!metadata?.pixelId || !metadata?.accessToken) {
        return {
          status: ResponseContentStatusEnum.ERROR,
          message: 'Pixel ID and Access Token are required'
        };
      }

      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.META_CONVERSION,
          configValue: {
            metadata: metadata as Record<string, any>
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Meta Conversion created or updated successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create or update Meta Conversion: ${error.message}`);
    }
  }

  async deleteMetaConversion(payload: DeleteMetaConversionDto) {
    try {
      const { hotelId } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.META_CONVERSION,
          configValue: {
            metadata: {}
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Meta Conversion deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete Meta Conversion: ${error.message}`);
    }
  }

  async createOrUpdateGoogleAnalytics(payload: CreateOrUpdateGoogleAnalyticsDto) {
    try {
      const { hotelId, metadata } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GOOGLE_ANALYTICS,
          configValue: {
            metadata: metadata
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Google Analytics created or updated successfully'
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create or update Google Analytics: ${error.message}`
      );
    }
  }

  async deleteGoogleAnalytics(payload: DeleteGoogleAnalyticsDto) {
    try {
      const { hotelId } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GOOGLE_ANALYTICS,
          configValue: {
            metadata: {}
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Google Analytics deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete Google Analytics: ${error.message}`);
    }
  }

  async createOrUpdateGoogleTagManager(payload: CreateOrUpdateGoogleTagManagerDto) {
    try {
      const { hotelId, metadata } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GTM,
          configValue: {
            metadata: metadata
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Google Tag Manager created or updated successfully'
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create or update Google Tag Manager: ${error.message}`
      );
    }
  }

  async deleteGoogleTagManager(payload: DeleteGoogleTagManagerDto) {
    try {
      const { hotelId } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GTM,
          configValue: {
            metadata: {}
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Google Tag Manager deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete Google Tag Manager: ${error.message}`);
    }
  }

  async createOrUpdateGoogleAds(payload: CreateOrUpdateGoogleAdsDto) {
    try {
      const { hotelId, metadata } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GOOGLE_ADS,
          configValue: {
            metadata: metadata
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Google Ads created or updated successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create or update Google Ads: ${error.message}`);
    }
  }

  async deleteGoogleAds(payload: DeleteGoogleAdsDto) {
    try {
      const { hotelId } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: HotelConfigurationTypeEnum.GOOGLE_ADS,
          configValue: {
            metadata: {}
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Google Ads deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete Google Ads: ${error.message}`);
    }
  }

  async getPropertyTrackingList(payload: PropertyTrackingListDto) {
    try {
      const { hotelId } = payload;
      // Property tracking might be stored in BRANDING_MARKETING or a separate config
      const configs = await this.hotelConfigurationRepository.find({
        where: {
          hotelId: hotelId,
          configType: In([
            HotelConfigurationTypeEnum.DUETTO_CONFIGURATION,
            HotelConfigurationTypeEnum.USERCENTRICS_CMP_SETTING,
            HotelConfigurationTypeEnum.COOKIEBOT_CONFIGURATION
          ])
        }
      });

      const results: any[] = [];
      for (const configType of [
        HotelConfigurationTypeEnum.DUETTO_CONFIGURATION,
        HotelConfigurationTypeEnum.COOKIEBOT_CONFIGURATION,
        HotelConfigurationTypeEnum.USERCENTRICS_CMP_SETTING
      ]) {
        const config = configs.find(
          (config: HotelConfiguration) => config.configType === configType
        );
        if (!config) {
          results.push({
            metadata: {},
            isConnected: false,
            propertyId: hotelId,
            propertyTrackingType: this.convertPropertyTrackingType(configType)
          });
          continue;
        }

        const metadata = config?.configValue?.metadata ?? {};
        let isConnected = false;
        switch (configType) {
          case HotelConfigurationTypeEnum.DUETTO_CONFIGURATION:
            isConnected = !!(metadata?.appId || metadata?.tld);
            break;
          case HotelConfigurationTypeEnum.USERCENTRICS_CMP_SETTING:
            isConnected = isObject(config?.configValue?.metadata); // check raw metadata is existing or not. because Usercentrics CMP (GauVendi) just stored by {}
            break;
          case HotelConfigurationTypeEnum.COOKIEBOT_CONFIGURATION:
            isConnected = !!(metadata?.cookiebotSrc || metadata?.dataCbid);
            break;
        }

        results.push({
          metadata: metadata,
          isConnected: isConnected,
          propertyId: config?.hotelId,
          propertyTrackingType: this.convertPropertyTrackingType(configType)
        });
      }
      return results;
    } catch (error) {
      throw new BadRequestException(`Failed to get property tracking list: ${error.message}`);
    }
  }

  convertPropertyTrackingType(configType: HotelConfigurationTypeEnum) {
    switch (configType) {
      case HotelConfigurationTypeEnum.DUETTO_CONFIGURATION:
        return PropertyTrackingTypeEnum.Duetto;
      case HotelConfigurationTypeEnum.USERCENTRICS_CMP_SETTING:
        return PropertyTrackingTypeEnum.UsercentricsCmp;
      case HotelConfigurationTypeEnum.COOKIEBOT_CONFIGURATION:
        return PropertyTrackingTypeEnum.Cookiebot;
    }
  }

  convertPropertyTrackingTypeToConfigType(propertyTrackingType: PropertyTrackingTypeEnum) {
    switch (propertyTrackingType) {
      case PropertyTrackingTypeEnum.Duetto:
        return HotelConfigurationTypeEnum.DUETTO_CONFIGURATION;
      case PropertyTrackingTypeEnum.UsercentricsCmp:
        return HotelConfigurationTypeEnum.USERCENTRICS_CMP_SETTING;
      case PropertyTrackingTypeEnum.Cookiebot:
        return HotelConfigurationTypeEnum.COOKIEBOT_CONFIGURATION;
      default:
        throw new BadRequestException('Invalid property tracking type');
    }
  }

  async createOrUpdatePropertyTracking(payload: CreateOrUpdatePropertyTrackingDto) {
    try {
      const { hotelId, metadata, propertyTrackingType } = payload;
      const configType = this.convertPropertyTrackingTypeToConfigType(propertyTrackingType);
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: configType,
          configValue: {
            metadata: metadata || {}
          }
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );

      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Property config created or updated successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create or update property config: ${error.message}`);
    }
  }

  async deletePropertyConfig(payload: DeletePropertyTrackingDto) {
    try {
      const { propertyTrackingType, hotelId } = payload;
      const configType = this.convertPropertyTrackingTypeToConfigType(propertyTrackingType);
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: configType,
          configValue: {}
        },
        {
          conflictPaths: ['hotelId', 'configType']
        }
      );
      return {
        status: ResponseContentStatusEnum.SUCCESS,
        data: true,
        message: 'Deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete: ${error.message}`);
    }
  }

  requestApaleoIntegration(payload: GetApaleoIntegrationDto): {
    clientId: string;
    hotelId: string;
    redirectUrl: string;
    scope: string;
    url: string;
  } {
    try {
      const { hotelId } = payload;
      const clientId = this.configService.get<string>(ENVIRONMENT.APALEO_CLIENT_ID);
      if (!clientId) {
        throw new BadRequestException('Apaleo client ID is not configured');
      }
      const redirectUrl = `${payload.origin}/callback-apaleo-popup`;
      const state = crypto.randomUUID();
      const scopes = [
        'offline_access',
        'availability.manage',
        'availability.read',
        'companies.manage',
        'companies.read',
        'distribution:reservations.manage',
        'distribution:subscriptions.manage',
        'folios.manage',
        'folios.read',
        'integration:ui-integrations.manage',
        'maintenances.manage',
        'maintenances.read',
        'openid',
        'profile',
        'rateplans.read-corporate',
        'rateplans.read-negotiated',
        'rates.manage',
        'rates.read',
        'reservations.manage',
        'reservations.read',
        'setup.manage',
        'setup.read'
      ].join(' ');

      const authorizationUrl = 'https://identity.apaleo.com/connect/authorize';
      const params = new URLSearchParams({
        response_type: 'code',
        scope: scopes,
        client_id: clientId,
        redirect_uri: redirectUrl,
        state: state
      });

      const url = `${authorizationUrl}?${params.toString()}`;

      return {
        clientId: clientId,
        hotelId: hotelId,
        redirectUrl: redirectUrl,
        scope: scopes,
        url: url
      };
    } catch (error) {
      this.logger.error(`Failed to request Apaleo integration: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to request Apaleo integration: ${error.message}`);
    }
  }
}
