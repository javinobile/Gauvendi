import { DATE_FORMAT } from '@constants/date.constant';
import { DbName } from '@constants/db-name.constant';
import { HotelConfiguration } from '@entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@entities/hotel-entities/hotel.entity';
import { HotelConfigurationTypeEnum, LanguageCodeEnum } from '@enums/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@src/core/redis/redis.service';
import { Cache } from 'cache-manager';
import { format } from 'date-fns';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import { RoomProductAvailabilityService } from '../room-product-availability/room-product-availability.service';
import { RoomProductPricingMethodDetailService } from '../room-product-rate-plan/room-product-pricing-method-detail/room-product-pricing-method-detail.service';
import { RoomUnitService } from '../room-unit/room-unit.service';
import {
  CreateOrUpdateAccessibilityIntegrationDto,
  CreateOrUpdateHotelConfigurationDto,
  DeleteAccessibilityIntegrationDto
} from './dtos/create-or-update-hotel-configuration.dto';
import {
  HotelConfigurationsCacheQueryDto,
  HotelConfigurationsQueryDto
} from './dtos/hotel-configurations-query.dto';
import { HotelOperationsQueryDto } from './dtos/hotel-operation-query.dto';
import { UpdateHotelLastAvailabilityDateDto } from './dtos/update-hotel-last-availability-date.dto';
import { UpdateHotelOperationBodyDto } from './dtos/update-hotel-operation.dto';
import { ResponseContentStatusEnum } from '@src/core/dtos/common.dto';
import { HotelConfigurationRepository } from '../hotel-configuration/hotel-configuration.repository';

@Injectable()
export class HotelConfigurationsService {
  logger = new Logger(HotelConfigurationsService.name);
  constructor(
    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly roomProductAvailabilityService: RoomProductAvailabilityService,
    private readonly roomProductPricingMethodDetailService: RoomProductPricingMethodDetailService,
    private readonly roomUnitService: RoomUnitService,
    private readonly redisService: RedisService,
    private readonly hotelConfigurationCustomRepository: HotelConfigurationRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async getHotelConfigurations(payload: HotelConfigurationsQueryDto) {
    const where: FindOptionsWhere<HotelConfiguration> = { hotel: { code: payload.hotelCode } };
    if (Array.isArray(payload.configTypeList) && payload.configTypeList.length > 0) {
      where.configType = In(payload.configTypeList);
    }
    return this.hotelConfigurationRepository.find({
      where
    });
  }

  async getHotelOperations(payload: HotelOperationsQueryDto) {
    const configTypeList = [
      HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING,
      HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING_PMS_SYNC,
      HotelConfigurationTypeEnum.DEFAULT_BOOKING_ROOM_STATUS,
      HotelConfigurationTypeEnum.DEFAULT_PAX,
      HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT,
      HotelConfigurationTypeEnum.MANDATORY_GUEST_INPUT,
      HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION
    ];

    // Use QueryBuilder to join hotel and configurations in one query
    const result = await this.hotelRepository.findOne({
      where: { code: payload.hotelCode, hotelConfigurations: { configType: In(configTypeList) } },
      relations: ['hotelConfigurations']
    });

    if (!result) {
      throw new Error(`Hotel with code ${payload.hotelCode} not found`);
    }

    const configs = result.hotelConfigurations || [];

    // Initialize variables
    let timeSliceArrivalTime = '';
    let timeSliceDepartureTime = '';
    let isRequireMainGuestAddress = false;

    // Process each configuration based on its type
    for (const hotelConfig of configs) {
      switch (hotelConfig.configType) {
        case HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION: {
          const configValueMetaData = hotelConfig.configValue?.metadata;

          if (configValueMetaData && Object.keys(configValueMetaData).length > 0) {
            timeSliceArrivalTime = configValueMetaData['CI']
              ? configValueMetaData['CI'].toString()
              : '';
            timeSliceDepartureTime = configValueMetaData['CO']
              ? configValueMetaData['CO'].toString()
              : '';
          }
          break;
        }

        case HotelConfigurationTypeEnum.MANDATORY_GUEST_INPUT: {
          const configValueMetaData = hotelConfig.configValue?.metadata;

          if (configValueMetaData && Object.keys(configValueMetaData).length > 0) {
            try {
              const requireMainGuestAddress = configValueMetaData['mainGuest'];

              if (requireMainGuestAddress) {
                const isRequiredPostalCode = Boolean(requireMainGuestAddress['postalCode']);
                const isRequiredCity = Boolean(requireMainGuestAddress['city']);
                const isRequiredCountry = Boolean(requireMainGuestAddress['country']);
                const isRequiredAddress = Boolean(requireMainGuestAddress['address']);

                if (
                  isRequiredPostalCode &&
                  isRequiredCity &&
                  isRequiredCountry &&
                  isRequiredAddress
                ) {
                  isRequireMainGuestAddress = true;
                }
              }
            } catch (error) {
              console.error('Error processing MANDATORY_GUEST_INPUT configuration:', error);
            }
          }
          break;
        }
      }
    }

    const defaultPax = configs.find(
      (config) => config.configType === HotelConfigurationTypeEnum.DEFAULT_PAX
    )?.configValue?.value;
    const defaultStayNight = configs.find(
      (config) => config.configType === HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT
    )?.configValue?.value;

    return {
      id: result.id,
      name: result.name,
      code: payload.hotelCode,
      defaultPax: defaultPax !== null && defaultPax !== undefined ? Number(defaultPax) : null,
      defaultStayNight:
        defaultStayNight !== null && defaultStayNight !== undefined
          ? Number(defaultStayNight)
          : null,
      isRequireMainGuestAddress,
      timeSliceArrivalTime,
      timeSliceDepartureTime
    };
  }

  async updateHotelOperation(payload: UpdateHotelOperationBodyDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the existing hotel
      const existingHotel = await this.hotelRepository.findOne({
        where: { code: payload.code },
        relations: ['hotelConfigurations']
      });
      if (!existingHotel) {
        throw new NotFoundException(`Hotel with code ${payload.code} not found`);
      }

      await this.updateHotelConfigurations(
        queryRunner,
        existingHotel.id,
        existingHotel.hotelConfigurations,
        payload
      );

      await queryRunner.commitTransaction();

      // Xóa cache sau khi update thành công
      await this.hotelConfigurationCustomRepository.clearHotelConfigCache(existingHotel.id, [
        HotelConfigurationTypeEnum.DEFAULT_PAX,
        HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT,
        HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION
      ]);

      return {
        message: 'Hotel operations updated successfully',
        data: {}
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update hotel operations: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private async updateHotelConfigurations(
    queryRunner: any,
    hotelId: string,
    hotelConfigurations: HotelConfiguration[],
    payload: UpdateHotelOperationBodyDto
  ) {
    const allowTypes = [
      HotelConfigurationTypeEnum.DEFAULT_PAX,
      HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT,
      HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION,
      HotelConfigurationTypeEnum.MANDATORY_GUEST_INPUT
    ];

    for (const type of allowTypes) {
      const existingConfig = hotelConfigurations.find((c) => c.configType === type);
      if (existingConfig) {
        let configValue = existingConfig?.configValue || {};
        switch (type) {
          case HotelConfigurationTypeEnum.DEFAULT_PAX:
            configValue.value = payload.defaultPax;
            break;

          case HotelConfigurationTypeEnum.DEFAULT_STAY_NIGHT:
            configValue.value = payload.defaultStayNight;
            break;

          case HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION:
            configValue.metadata.CI = payload.timeSliceArrivalTime;
            configValue.metadata.CO = payload.timeSliceDepartureTime;
            break;

          case HotelConfigurationTypeEnum.MANDATORY_GUEST_INPUT:
            configValue.metadata.mainGuest.postalCode = payload.isRequireMainGuestAddress;
            configValue.metadata.mainGuest.city = payload.isRequireMainGuestAddress;
            configValue.metadata.mainGuest.country = payload.isRequireMainGuestAddress;
            configValue.metadata.mainGuest.address = payload.isRequireMainGuestAddress;
            break;
        }
        await queryRunner.manager.update(
          HotelConfiguration,
          { id: existingConfig.id },
          { configValue }
        );
      }
    }
  }

  async createOrUpdateHotelConfiguration(payload: CreateOrUpdateHotelConfigurationDto) {
    const existingConfig = await this.hotelConfigurationRepository.findOne({
      where: { hotel: { code: payload.hotelCode }, configType: payload.configType }
    });

    let hotelId: string;

    if (existingConfig) {
      hotelId = existingConfig.hotelId;
      await this.hotelConfigurationRepository.update(existingConfig.id, {
        configValue: payload.configValue
      });
    } else {
      const hotel = await this.hotelRepository.findOne({ where: { code: payload.hotelCode } });
      if (!hotel) {
        throw new NotFoundException(`Hotel with code ${payload.hotelCode} not found`);
      }
      hotelId = hotel.id;
      const newConfig = new HotelConfiguration();
      newConfig.hotelId = hotel.id;
      newConfig.configType = payload.configType;
      newConfig.configValue = payload.configValue;
      await this.hotelConfigurationRepository.save(newConfig);
    }

    // Xóa cache sau khi update thành công
    await this.hotelConfigurationCustomRepository.clearHotelConfigCache(hotelId, [
      payload.configType
    ]);

    return { success: true };
  }

  async updateHotelLastAvailabilityDate(payload: UpdateHotelLastAvailabilityDateDto) {
    const existingConfig = await this.hotelConfigurationRepository.findOne({
      where: {
        hotel: { code: payload.hotelCode },
        configType: HotelConfigurationTypeEnum.LAST_OPENING_AVAILABILITY_DATE
      }
    });

    if (existingConfig) {
      const existingLastDate = existingConfig.configValue?.value;
      const updateData: Partial<HotelConfiguration> = {
        configValue: {
          ...(existingConfig.configValue || {}),
          value: payload.lastAvailabilityDate
        }
      };

      await this.triggerUpdateRoomProductAvailability(
        existingConfig.hotelId,
        payload.lastAvailabilityDate,
        existingConfig.configValue?.value
      );

      await this.hotelConfigurationRepository.update(existingConfig.id, updateData);

      // Xóa cache sau khi update thành công (nếu config này được cache)
      // await this.clearHotelConfigCache(existingConfig.hotelId, [
      //   HotelConfigurationTypeEnum.LAST_OPENING_AVAILABILITY_DATE
      // ]);

      return { success: true };
    } else {
      const hotel = await this.hotelRepository.findOne({ where: { code: payload.hotelCode } });
      if (!hotel) {
        throw new NotFoundException(`Hotel with code ${payload.hotelCode} not found`);
      }
      const newConfig = new HotelConfiguration();
      newConfig.hotelId = hotel.id;
      newConfig.configType = HotelConfigurationTypeEnum.LAST_OPENING_AVAILABILITY_DATE;
      newConfig.configValue = {
        metadata: null,
        value: payload.lastAvailabilityDate,
        content: null
      };

      await this.triggerUpdateRoomProductAvailability(hotel.id, payload.lastAvailabilityDate, null);
      await this.hotelConfigurationRepository.save(newConfig);

      // Xóa cache sau khi tạo mới thành công (nếu config này được cache)
      // await this.clearHotelConfigCache(hotel.id, [
      //   HotelConfigurationTypeEnum.LAST_OPENING_AVAILABILITY_DATE
      // ]);

      return { success: true };
    }
  }

  private async triggerUpdateRoomProductAvailability(
    hotelId: string,
    lastAvailabilityDate: string,
    existingLastAvailabilityDate: string | null
  ) {
    const key = `hotel:last-availability-date:${hotelId}`;
    const cachedLastAvailabilityDate = (await this.redisService.get(key)) || null;
    this.logger.debug(
      `Cached last availability date for hotel ${hotelId}: ${cachedLastAvailabilityDate}`
    );

    if (!lastAvailabilityDate) {
      this.logger.warn(
        `No last availability date to trigger update room product availability for hotel ${hotelId}`
      );
      return;
    }

    if (
      existingLastAvailabilityDate &&
      new Date(lastAvailabilityDate) <= new Date(existingLastAvailabilityDate)
    ) {
      this.logger.warn(
        `Last availability date ${lastAvailabilityDate} is before or equal to existing last availability date ${existingLastAvailabilityDate} for hotel ${hotelId}`
      );
      return;
    }

    // if have cached last availability date and it is different from the last availability date,
    // get from date to redis cache last availability date
    const startDate = cachedLastAvailabilityDate
      ? format(new Date(cachedLastAvailabilityDate), DATE_FORMAT)
      : format(new Date(), DATE_FORMAT);

    if (
      (existingLastAvailabilityDate !== lastAvailabilityDate ||
        existingLastAvailabilityDate === null) &&
      existingLastAvailabilityDate !== null &&
      new Date(lastAvailabilityDate) > new Date(existingLastAvailabilityDate)
    ) {
      const today = startDate;
      const endDate = format(new Date(lastAvailabilityDate), DATE_FORMAT);

      await this.roomUnitService.generateRoomUnitAvailability(hotelId, today, endDate);

      await this.roomProductAvailabilityService.generateRoomProductAvailability({
        hotelId,
        fromDate: today,
        toDate: endDate
      });

      await this.roomProductPricingMethodDetailService.triggerAllRoomProductPricingMethodDetail({
        hotelId: hotelId,
        from: today,
        to: endDate,

        ratePlanIds: []
      });

      const key = `hotel:last-availability-date:${hotelId}`;
      await this.redisService.set(key, lastAvailabilityDate, 6 * 30 * 24 * 60 * 60); // cache for 6 months
    }
  }

  async getHotelAccessibilityIntegration(payload: { hotelId: string }) {
    try {
      const { hotelId } = payload;
      const configTypes = [HotelConfigurationTypeEnum.DOCK_WCAG];
      const hotelConfigurations = await this.hotelConfigurationRepository.find({
        where: {
          hotelId: hotelId,
          configType: In(configTypes)
        }
      });
      const newData = hotelConfigurations.map((config) => {
        const metadata = config.configValue?.metadata ?? {};
        const isConnected =
          metadata?.token && (metadata?.acceptTnc === 'true' || metadata?.acceptTnc === true);
        return {
          metadata: metadata,
          isConnected: isConnected,
          propertyId: config.hotelId,
          integration: config.configType
        };
      });
      return newData;
    } catch (error) {
      throw new BadRequestException(
        `Failed to get hotel accessibility integration: ${error.message}`
      );
    }
  }

  async createOrUpdateAccessibilityIntegration(payload: CreateOrUpdateAccessibilityIntegrationDto) {
    try {
      const { hotelId, integration, metadata } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: integration as HotelConfigurationTypeEnum,
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
        message: 'Hotel accessibility integration created or updated successfully'
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create or update hotel accessibility integration: ${error.message}`
      );
    }
  }

  async deleteAccessibilityIntegration(payload: DeleteAccessibilityIntegrationDto) {
    try {
      const { hotelId, integration } = payload;
      await this.hotelConfigurationRepository.upsert(
        {
          hotelId: hotelId,
          configType: integration as HotelConfigurationTypeEnum,
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
        message: 'Hotel accessibility integration deleted successfully'
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete hotel accessibility integration: ${error.message}`
      );
    }
  }

  async migrationHotelConfigurations() {
    const configs = await this.hotelConfigurationRepository.find({
      where: {
        configType: In([
          HotelConfigurationTypeEnum.TERMS_OF_USE_URL,
          HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL,
          HotelConfigurationTypeEnum.IMPRESSUM_URL
        ])
      }
    });
    for (const config of configs) {
      if (
        config.configType === HotelConfigurationTypeEnum.TERMS_OF_USE_URL ||
        config.configType === HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL ||
        config.configType === HotelConfigurationTypeEnum.IMPRESSUM_URL
      ) {
        const value = config.configValue?.metadata;
        if (!value.englishUrl && value[LanguageCodeEnum.EN]) {
          value.englishUrl = value[LanguageCodeEnum.EN];
        }

        if (!value.arabicUrl && value[LanguageCodeEnum.AR]) {
          value.arabicUrl = value[LanguageCodeEnum.AR];
        }

        if (!value.frenchUrl && value[LanguageCodeEnum.FR]) {
          value.frenchUrl = value[LanguageCodeEnum.FR];
        }

        if (!value.germanUrl && value[LanguageCodeEnum.DE]) {
          value.germanUrl = value[LanguageCodeEnum.DE];
        }

        if (!value.spanishUrl && value[LanguageCodeEnum.ES]) {
          value.spanishUrl = value[LanguageCodeEnum.ES];
        }

        if (!value.italianUrl && value[LanguageCodeEnum.IT]) {
          value.italianUrl = value[LanguageCodeEnum.IT];
        }
      }

      await this.hotelConfigurationRepository.save(config);
    }

    return true;
  }
}
