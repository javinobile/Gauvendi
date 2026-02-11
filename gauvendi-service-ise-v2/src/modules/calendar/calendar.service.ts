import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import {
  HotelConfiguration,
  HotelConfigurationTypeEnum
} from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RatePlanTypeEnum } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { HotelConfigurationFilterDto } from '../hotel-configuration/dtos/hotel-configuration-filter.dto';
import { HotelConfigurationRepository } from '../hotel-configuration/repositories/hotel-configuration.repository';
import { HotelRepository } from '../hotel-v2/repositories/hotel.repository';
import {
  CalendarAvailabilityPerDateDto,
  CalendarAvailabilityQueryDto,
  CalendarDirectRestrictionQueryDto,
  CalendarQueryDto,
  CalendarRestrictionDto,
  CalendarRestrictionQueryDto,
  CalendarRoomProductAvailabilityQueryDto,
  CalendarRoomProductDto,
  CalendarRoomProductQueryDto,
  CalendarRoomProductSellabilityQueryDto,
  LowestPriceResponseDto,
  SellabilityCalendarZip
} from './calendar.dto';
import { RoomProductType } from 'src/core/entities/room-product.entity';
import { RedisService } from 'src/core/modules/redis/redis.service';
import { format } from 'date-fns';
import { DATE_FORMAT } from 'src/core/constants/date.constant';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy,
    private readonly hotelRepository: HotelRepository,
    private readonly hotelConfigurationRepository: HotelConfigurationRepository,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {}

  async getAvailability(query: CalendarQueryDto) {
    const { propertyCode, fromDate, toDate, totalAdult, totalPet, childAgeList, promoCode } = query;

    try {
      // get hotel id by property code
      const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }

      // get availability type sale strategy by hotel configuration
      const allowedRoomProductTypeList = await this.getAvailabilityTypeSaleStrategy(hotel);

      // get availability by room product type
      const body: CalendarAvailabilityQueryDto = {
        hotelId: hotel.id,
        fromDate,
        childAgeList: childAgeList || [],
        toDate,
        totalAdult,
        totalPet,
        types: allowedRoomProductTypeList as string[]
      };

      // Generate cache key for the request
      const cacheKey = this.generateCacheKey('room_products_calendar', {
        propertyCode,
        fromDate,
        toDate,
        totalAdult: totalAdult.toString(),
        totalPet: totalPet?.toString(),
        childAgeList: childAgeList?.join(',')
      });

      // Get cached result from Redis
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const availabilityResponse = await lastValueFrom(
        this.platformClient.send({ cmd: 'get_room_products_calendar' }, body)
      ).then(
        (data) =>
          data as {
            roomProductsWithCapacity: CalendarRoomProductDto[];
            availabilityPerDate: CalendarAvailabilityPerDateDto[];
          }
      );

      // Set cached result in Redis
      await this.setCachedResult(cacheKey, availabilityResponse); // Cache for 15 seconds

      return availabilityResponse;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to get availability',
        error?.status
      );
    }
  }

  async getAvailabilityByChunks(query: CalendarQueryDto) {
    const chunks = this.splitDateRangeIntoChunks(
      new Date(query.fromDate),
      new Date(query.toDate),
      30
    );

    // get hotel id by property code
    const hotel = await this.hotelRepository.getHotelByCode(query.propertyCode);

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // get availability type sale strategy by hotel configuration
    const allowedRoomProductTypeList = await this.getAvailabilityTypeSaleStrategy(hotel);

    let response: {
      roomProductsWithCapacity: CalendarRoomProductDto[];
      availabilityPerDate: CalendarAvailabilityPerDateDto[];
    } = {
      roomProductsWithCapacity: [],
      availabilityPerDate: []
    };

    await Promise.all(
      chunks.map((chunk) =>
        lastValueFrom(
          this.platformClient.send(
            { cmd: 'get_room_products_calendar' },
            {
              hotelId: hotel.id,
              fromDate: format(chunk.fromDate, DATE_FORMAT),
              toDate: format(chunk.toDate, DATE_FORMAT),
              totalAdult: query.totalAdult,
              totalPet: query.totalPet,
              childAgeList: query.childAgeList || [],
              promoCode: query.promoCode,
              types: allowedRoomProductTypeList as string[]
            }
          )
        ).then((data) => {
          response.roomProductsWithCapacity.push(...data.roomProductsWithCapacity);
          response.availabilityPerDate.push(...data.availabilityPerDate);
        })
      )
    );
    return response;
  }

  async getRestriction(query: CalendarRestrictionQueryDto) {
    const { propertyCode, fromDate, toDate } = query;

    try {
      // get hotel id by property code
      const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

      // Generate cache key for the request
      const cacheKey = this.generateCacheKey('restriction_calendar', {
        propertyCode,
        fromDate,
        toDate
      });

      // Get cached result from Redis
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // get restriction by hotel id
      const restriction = await lastValueFrom(
        this.platformClient.send(
          { cmd: 'get_restriction_calendar' },
          { hotelId: hotel.id, startDate: fromDate, endDate: toDate }
        )
      ).then((data) => data as CalendarRestrictionDto[]);

      // Set cached result in Redis
      await this.setCachedResult(cacheKey, restriction); // Cache for 15 seconds

      return restriction;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to get restriction',
        error?.status
      );
    }
  }

  async getDirectRestriction(query: CalendarDirectRestrictionQueryDto) {
    const { propertyCode, fromDate, toDate, roomProductIds } = query;

    try {
      // get hotel id by property code
      const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

      // get restriction by hotel id
      const restriction = await lastValueFrom(
        this.platformClient.send(
          { cmd: 'get_restriction_calendar_direct' },
          { hotelId: hotel.id, startDate: fromDate, endDate: toDate, roomProductIds }
        )
      ).then((data) => data as CalendarRestrictionDto[]);

      return restriction;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to get restriction',
        error?.status
      );
    }
  }

  async getAvailabilityTypeSaleStrategy(hotel: Hotel) {
    // get availability type sale strategy by hotel configuration
    const configurationInput = {
      hotelId: hotel.id,
      configTypes: [
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING,
        HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING
      ]
    } as HotelConfigurationFilterDto;

    const propertyConfigList = await this.hotelConfigurationRepository.findAll(configurationInput);

    // 2. Map by configType
    const propertyConfigMap = new Map(
      propertyConfigList.filter((c) => c.configType).map((c) => [c.configType, c])
    );

    // 4. Allowed list
    const allowedRoomProductTypeList = new Set();

    if (propertyConfigList.length > 0) {
      const mostPopularList = this.getAllowedTypeList(
        propertyConfigMap.get(
          HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING
        ) as HotelConfiguration,
        'MOST_POPULAR'
      );
      const directList = this.getAllowedTypeList(
        propertyConfigMap.get(
          HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING
        ) as HotelConfiguration,
        'DIRECT'
      );

      mostPopularList.forEach((v) => allowedRoomProductTypeList.add(v));
      directList.forEach((v) => allowedRoomProductTypeList.add(v));
    }
    const directListConfig = propertyConfigMap.get(
      HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_DIRECT_SETTING
    ) as HotelConfiguration;
    const directList = Object.keys(directListConfig.configValue?.metadata)
      .filter((key) => directListConfig.configValue?.metadata[key] === true)
      .map((key) => key as RoomProductType);
    directList.forEach((v) => allowedRoomProductTypeList.add(v));

    return Array.from(allowedRoomProductTypeList);
  }

  private getAllowedTypeList(config: HotelConfiguration, flow: string): RoomProductType[] {
    const metadata = config.configValue?.metadata as Record<string, any>;
    if (!metadata) return [];

    if (metadata[flow]) {
      return Object.keys(metadata[flow])
        .filter((key) => metadata[flow][key] === true)
        .map((key) => key as RoomProductType);
    }

    return [];
  }

  async getSellabilityByChunks(query: CalendarRoomProductSellabilityQueryDto) {
    const chunkSize = +this.configService.get('CALENDAR_DAILY_CHUNK_SIZE') || 7;
    const chunks = this.splitDateRangeIntoChunks(
      new Date(query.fromDate),
      new Date(query.toDate),
      chunkSize
    );

    const allResults = await Promise.all(
      chunks.map((chunk) =>
        this.getSellability({
          ...query,
          fromDate: format(chunk.fromDate, DATE_FORMAT),
          toDate: format(chunk.toDate, DATE_FORMAT)
        })
      )
    );

    // flatten LowestPriceResponseDto[][] into LowestPriceResponseDto[]
    return allResults;
  }

  async getSellability(query: CalendarRoomProductSellabilityQueryDto) {
    if (!query.propertyCode) {
      throw new BadRequestException('Property code is required');
    }

    try {
      // Generate cache key for the request
      // const cacheKey = this.generateCacheKey('lowest_price_calendar', {
      //   propertyCode: query.propertyCode,
      //   fromDate: query.fromDate,
      //   toDate: query.toDate,
      //   totalAdult: query.totalAdult,
      //   totalPet: query.totalPet,
      //   childAgeList: query.childAgeList,
      //   ratePlanTypes: query.ratePlanTypes?.join(','),
      //   roomProductCodes: query.roomProductCodes?.join(',')
      // });

      // // Get cached result from Redis
      // const cachedResult = await this.getCachedResult(cacheKey);
      // if (cachedResult) {
      //   return cachedResult;
      // }

      query.ratePlanTypes = [RatePlanTypeEnum.PUBLIC];
      const lowestPriceResponse = await lastValueFrom(
        this.platformClient.send({ cmd: 'get_lowest_price_calendar' }, query)
      ).then(
        (data) =>
          data as {
            items: LowestPriceResponseDto[];
            sellabilityCalendarZip?: SellabilityCalendarZip;
          }
      );

      // Set cached result in Redis
      // await this.setCachedResult(cacheKey, lowestPriceResponse); // Cache for 15 seconds

      return lowestPriceResponse;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to get sellability',
        error?.status
      );
    }
  }

  async getSpecificRoomProducts(query: CalendarRoomProductQueryDto) {
    const { propertyCode, fromDate, toDate, dedicatedProductCodeList } = query;

    try {
      // get hotel id by property code
      const hotel = await this.hotelRepository.getHotelByCode(propertyCode);

      // get availability by room product type
      const body: CalendarRoomProductAvailabilityQueryDto = {
        hotelId: hotel.id,
        fromDate,
        toDate,
        roomProductCodeList: dedicatedProductCodeList
      };

      const availabilityResponse = await lastValueFrom(
        this.platformClient.send({ cmd: 'get_calendar_specific_room_product' }, body)
      ).then(
        (data) =>
          data as {
            roomProductsWithCapacity: CalendarRoomProductDto[];
            availabilityPerDate: CalendarAvailabilityPerDateDto[];
          }
      );

      return availabilityResponse;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to get availability',
        error?.status
      );
    }
  }

  /**
   * Get cached result from Redis
   */
  private async getCachedResult(cacheKey: string): Promise<any | null> {
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      this.logger.warn(`Cache get failed for key ${cacheKey}: ${error.message}`);
      return null;
    }
  }

  splitDateRangeIntoChunks(fromDate: Date, toDate: Date, chunkSize = 7) {
    const chunks: { fromDate: Date; toDate: Date }[] = [];

    let cursor = new Date(fromDate);
    cursor.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(0, 0, 0, 0);

    while (cursor <= end) {
      const chunkStart = new Date(cursor);

      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + chunkSize - 1);

      if (chunkEnd > end) {
        chunkEnd.setTime(end.getTime());
      }

      chunks.push({
        fromDate: chunkStart,
        toDate: chunkEnd
      });

      // move cursor to next segment
      cursor.setDate(cursor.getDate() + chunkSize);
    }

    return chunks;
  }

  /**
   * Generate consistent cache key for caching queries
   */
  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    return this.redisService.generateCacheKey(prefix, params);
  }

  /**
   * Set cached result in Redis
   */
  private async setCachedResult(cacheKey: string, data: any): Promise<void> {
    await this.redisService.setCachedResult(cacheKey, data);
  }
}
