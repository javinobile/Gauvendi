import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RoomProductResponseDto, StayOptionRecommendationFilterDto } from '../dtos';
import { HotelConfigurationConfigTypeEnum } from 'src/modules/hotel-configuration/dtos/hotel-configuration.enums';
import { HotelRepository } from 'src/modules/hotel-v2/repositories/hotel.repository';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import {
  HotelConfiguration,
  HotelConfigurationTypeEnum
} from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { BadRequestException } from 'src/core/exceptions';
import { formatInTimeZone } from 'date-fns-tz';
import { getDay, getHours, getMinutes } from 'date-fns';
import { HotelConfigurationRepository } from 'src/modules/hotel-configuration/repositories/hotel-configuration.repository';

@Injectable()
export class RoomProductService {
  private readonly logger = new Logger(RoomProductService.name);

  constructor(
    private readonly hotelRepository: HotelRepository,
    private readonly hotelConfigurationRepository: HotelConfigurationRepository
  ) {}

  async getRoomProduct(filter: StayOptionRecommendationFilterDto): Promise<RoomProductResponseDto> {
    // 1. Input validation
    await this.validateInput(filter);

    // 2. Get hotel information and validate hotel code exists
    const hotel = await this.validateAndGetHotel(filter.hotelCode);

    // 3. Load hotel configurations
    const hotelConfigurations = await this.loadHotelConfigurations(hotel.id);

    // 4. Validate closing hours
    this.validateClosingHours(
      filter.arrival,
      filter.departure,
      hotel,
      hotelConfigurations[HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING]
    );

    // Log loaded configurations for debugging
    this.logger.log(`Hotel ${hotel.code} configurations loaded:`, {
      gradedLabelSetting: hotelConfigurations.get(
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING
      ),
      directSetting: hotelConfigurations.get(
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING
      ),
      configuratorSetting: hotelConfigurations.get(
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING
      ),
      pricingRoundingRule: hotelConfigurations.get(
        HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE
      )
    });

    // TODO: Add room product recommendation logic here

    return {
      roomProductList: []
    };
  }

  private async validateInput(filter: StayOptionRecommendationFilterDto): Promise<void> {
    // Validate date range: departure must be after arrival
    const arrivalDate = new Date(filter.arrival);
    const departureDate = new Date(filter.departure);

    if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
      throw new BadRequestException('Invalid date format. Please use valid date strings.');
    }

    if (departureDate <= arrivalDate) {
      throw new BadRequestException('Departure date must be after arrival date.');
    }

    // Validate arrival date is not in the past
    await this.validateArrivalDate(filter);

    // Validate capacity: each room must have at least 1 adult
    if (!filter.roomRequestList || filter.roomRequestList.length === 0) {
      throw new BadRequestException('At least one room request is required.');
    }

    // Validate hotel code is provided
    if (filter.hotelCode.trim() === '') {
      throw new BadRequestException('Hotel code is required.');
    }
  }

  private async validateArrivalDate(filter: StayOptionRecommendationFilterDto): Promise<void> {
    // Get hotel information for timezone validation
    const hotel = await this.validateAndGetHotel(filter.hotelCode);

    const timeZone = hotel.timeZone;
    if (!timeZone) {
      throw new BadRequestException('Hotel timezone is not configured.');
    }

    // Get current date in hotel's timezone
    const currentTimeInHotelTZ = new Date();
    const currentDateInHotelTZ = formatInTimeZone(currentTimeInHotelTZ, timeZone, 'yyyy-MM-dd');

    // Parse arrival date
    const arrivalDateStr = filter.arrival;
    const arrivalDate = new Date(arrivalDateStr);

    // Check if arrival date is in the past
    const arrivalDateInHotelTZ = formatInTimeZone(arrivalDate, timeZone, 'yyyy-MM-dd');

    if (arrivalDateInHotelTZ < currentDateInHotelTZ) {
      throw new BadRequestException('Arrival date cannot be in the past.');
    }
  }

  private validateClosingHours(
    arrivalDate: string,
    departureDate: string,
    hotel: Hotel,
    configuration: HotelConfiguration
  ) {
    const timeZone = hotel.timeZone;
    if (!timeZone) {
      throw new BadRequestException('Not ');
    }

    // Get current date in hotel's timezone
    const currentTimeInHotelTZ = new Date();
    const currentDateInHotelTZ = formatInTimeZone(currentTimeInHotelTZ, timeZone, 'yyyy-MM-dd');

    // Get arrival date
    const arrivalDateStr = arrivalDate;

    // Only check closing hours if arrival date is today in hotel timezone
    if (arrivalDateStr === currentDateInHotelTZ) {
      const hotelConfig = configuration;

      if (!hotelConfig?.configValue) {
        throw new BadRequestException('Hotel configuration not found');
      }

      const settings = hotelConfig.configValue;
      const closingHours = settings.metadata;

      if (!closingHours) {
        throw new BadRequestException('Closing hours not configured');
      }

      // Get current time details in hotel timezone
      const currentHotelTime = formatInTimeZone(
        currentTimeInHotelTZ,
        timeZone,
        'yyyy-MM-dd HH:mm:ss'
      );
      const currentHotelDate = new Date(currentHotelTime);
      const currentHour = getHours(currentHotelDate);
      const currentMinute = getMinutes(currentHotelDate);

      // Get day of week for today in hotel timezone
      const daysOfWeek = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY'
      ];
      const todayDay = daysOfWeek[getDay(currentHotelDate)];
      const closingTime = closingHours[todayDay];

      if (!closingTime) {
        throw new BadRequestException(`No closing hour configured for ${todayDay}`);
      }

      // Parse closing time (format: "HH:mm")
      const [closingHour, closingMinute] = closingTime.split(':').map(Number);

      // Check if current time is past closing hours
      if (
        currentHour > closingHour ||
        (currentHour === closingHour && currentMinute >= closingMinute)
      ) {
        throw new BadRequestException('Hotel is currently closed for check-in');
      }
    }
  }

  private async validateAndGetHotel(hotelCode: string): Promise<Hotel> {
    try {
      const hotel = await this.hotelRepository.getHotelByCode(hotelCode);
      return hotel;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(`Hotel with code '${hotelCode}' not found.`);
      }
      this.logger.error(`Error validating hotel code ${hotelCode}:`, error);
      throw new BadRequestException('Error validating hotel information.');
    }
  }

  private async loadHotelConfigurations(
    hotelId: string
  ): Promise<Map<HotelConfigurationTypeEnum, HotelConfiguration>> {
    const configTypes: HotelConfigurationTypeEnum[] = [
      HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING,
      HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING,
      HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_CONFIGURATOR_SETTING,
      HotelConfigurationTypeEnum.PRICING_DECIMAL_ROUNDING_RULE,
      HotelConfigurationTypeEnum.RECEPTION_OPERATION_CLOSING
    ];

    try {
      const configurations = await this.hotelConfigurationRepository.findAll({
        hotelId,
        configTypes: configTypes
      });

      const configMap = new Map<HotelConfigurationTypeEnum, HotelConfiguration>();
      configurations.forEach((config) => {
        if (config.configType && config.configValue) {
          configMap.set(config.configType, config);
        }
      });

      this.logger.log(`Loaded ${configMap.size} hotel configurations for hotel ${hotelId}`);
      return configMap;
    } catch (error) {
      this.logger.error(`Error loading hotel configurations for hotel ${hotelId}:`, error);
      throw new BadRequestException('Error loading hotel configuration settings.');
    }
  }
}
