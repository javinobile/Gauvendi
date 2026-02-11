import { Injectable, Logger } from '@nestjs/common';
import { HotelTrackingRepository } from './hotel-tracking.repository';
import {
  HotelTracking,
  HotelTrackingTypeEnum,
} from '../../core/entities/hotel-tracking-entities/hotel-tracking.entity';
import {
  CreateOrUpdateHotelTrackingDto,
  DeleteHotelTrackingDto,
  MetaConversionApiConfig,
  HotelTrackingFilterDto,
} from './dtos/hotel-tracking.dto';
import { HotelRepository } from '../hotel/repositories/hotel.repository';

@Injectable()
export class HotelTrackingService {
  private readonly logger = new Logger(HotelTrackingService.name);

  constructor(
    private readonly hotelTrackingRepository: HotelTrackingRepository,
    private readonly hotelRepository: HotelRepository,
  ) {}

  async getHotelTrackingList(
    filter: HotelTrackingFilterDto,
  ): Promise<HotelTracking[]> {
    if (filter.hotelCode) {
      if (filter.hotelTrackingType) {
        const result = await this.hotelTrackingRepository.findByHotelCodeAndType(
          filter.hotelCode,
          filter.hotelTrackingType,
        );
        return result ? [result] : [];
      }
      return this.hotelTrackingRepository.findByHotelCode(filter.hotelCode);
    }

    if (filter.hotelId) {
      if (filter.hotelTrackingType) {
        const result = await this.hotelTrackingRepository.findByHotelIdAndType(
          filter.hotelId,
          filter.hotelTrackingType,
        );
        return result ? [result] : [];
      }
      return this.hotelTrackingRepository.findByHotelId(filter.hotelId);
    }

    return [];
  }

  async createOrUpdateHotelTracking(
    dto: CreateOrUpdateHotelTrackingDto,
  ): Promise<{ status: string; data?: HotelTracking; message?: string }> {
    try {
      // Validate Meta Conversion API config if applicable
      if (dto.hotelTrackingType === HotelTrackingTypeEnum.META_CONVERSION_API) {
        const validationError = this.validateMetaConfig(dto.metadata as MetaConversionApiConfig);
        if (validationError) {
          return { status: 'ERROR', message: validationError };
        }
      }

      // Get hotelId from hotelCode if not provided
      let hotelId = dto.hotelId;
      if (!hotelId && dto.hotelCode) {
        const hotel = await this.hotelRepository.findByCode(dto.hotelCode);
        if (hotel) {
          hotelId = hotel.id;
        }
      }

      const result = await this.hotelTrackingRepository.upsertByHotelCodeAndType({
        hotelId,
        hotelCode: dto.hotelCode,
        hotelTrackingType: dto.hotelTrackingType,
        metadata: dto.metadata,
        isActive: dto.isActive ?? true,
      });

      this.logger.log(
        `Hotel tracking ${dto.hotelTrackingType} saved for ${dto.hotelCode}`,
      );

      return { status: 'SUCCESS', data: result };
    } catch (error) {
      this.logger.error(
        `Failed to save hotel tracking: ${error.message}`,
        error.stack,
      );
      return { status: 'ERROR', message: error.message };
    }
  }

  async deleteHotelTracking(
    dto: DeleteHotelTrackingDto,
  ): Promise<{ status: string; message?: string }> {
    try {
      const deleted = await this.hotelTrackingRepository.deleteByHotelCodeAndType(
        dto.hotelCode,
        dto.hotelTrackingType,
      );

      if (deleted) {
        this.logger.log(
          `Hotel tracking ${dto.hotelTrackingType} deleted for ${dto.hotelCode}`,
        );
        return { status: 'SUCCESS' };
      }

      return { status: 'ERROR', message: 'Hotel tracking not found' };
    } catch (error) {
      this.logger.error(
        `Failed to delete hotel tracking: ${error.message}`,
        error.stack,
      );
      return { status: 'ERROR', message: error.message };
    }
  }

  async getMetaConversionConfig(
    hotelCode: string,
  ): Promise<MetaConversionApiConfig | null> {
    const tracking = await this.hotelTrackingRepository.findByHotelCodeAndType(
      hotelCode,
      HotelTrackingTypeEnum.META_CONVERSION_API,
    );

    if (!tracking || !tracking.isActive) {
      return null;
    }

    return tracking.metadata as MetaConversionApiConfig;
  }

  private validateMetaConfig(config: MetaConversionApiConfig): string | null {
    if (!config) {
      return 'Meta Conversion API configuration is required';
    }

    if (!config.pixelId || typeof config.pixelId !== 'string') {
      return 'Pixel ID is required and must be a string';
    }

    if (!config.accessToken || typeof config.accessToken !== 'string') {
      return 'Access Token is required and must be a string';
    }

    // Validate pixel ID format (should be numeric string)
    if (!/^\d+$/.test(config.pixelId)) {
      return 'Pixel ID must be a numeric string';
    }

    // Validate consent mode if provided
    if (config.consentMode && !['STRICT', 'RELAXED', 'DISABLED'].includes(config.consentMode)) {
      return 'Consent mode must be STRICT, RELAXED, or DISABLED';
    }

    return null;
  }
}
