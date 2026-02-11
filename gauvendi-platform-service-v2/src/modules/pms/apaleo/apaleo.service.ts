import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { ConnectorTypeEnum } from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { AxiosResponse } from 'axios';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';
import { RestrictionConditionType, Weekday } from 'src/core/entities/restriction.entity';
import { RedisService } from 'src/core/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import {
  RatePlanPricingMappingDto,
  RestrictionMappingDto,
  RoomProductAvailabilityMappingDto,
  RoomUnitMaintenanceMappingDto
} from '../pms.dto';
import { APALEO_APIS } from './apaleo.const';
import {
  ApaleoAccessTokenDto,
  ApaleoAvailabilityDto,
  ApaleoBlockDto,
  ApaleoBookingDto,
  ApaleoCityTaxAmountDto,
  ApaleoCityTaxDto,
  ApaleoFolioChargeDto,
  ApaleoFolioDto,
  ApaleoFolioItemDto,
  ApaleoFolioListResponseDto,
  ApaleoGetAvailabilityListDto,
  ApaleoGetAvailabilityUnitListDto,
  ApaleoGetCityTaxListDto,
  ApaleoGetRatePlanListDto,
  ApaleoGetRatePlanPricingListDto,
  ApaleoGetServiceListDto,
  ApaleoGetTaxListDto,
  ApaleoGetUnitGroupListDto,
  ApaleoGetUnitListDto,
  ApaleoMaintenanceDto,
  ApaleoPatchRatesDto,
  ApaleoPropertyDto,
  ApaleoRatePlanPricingDto,
  ApaleoRatePlanServiceDto,
  ApaleoReservationDto,
  ApaleoReservationGuestDto,
  ApaleoReservationListResponseDto,
  ApaleoServiceDto,
  ApaleoTaxDto,
  ApaleoUnitGroupDto,
  ApaleoUnitListResponseDto,
  ApaleoUpdateAvailabilityDto,
  ApaleoUpdateMaintenanceDto
} from './apaleo.dto';
import { includes } from 'lodash';
import { getCurlCommand } from '@src/core/utils/curl.util';

@Injectable()
export class ApaleoService {
  logger = new Logger(ApaleoService.name);

  /**
   * https://apaleo.dev/guides/api/rate-limiting.html
   * @description
   * The Apaleo API has a rate limit of 3500 requests per minute with 100 requests per second on average and a burst of up to 200 requests per second.
   */
  private readonly rateLimitRequestsPerMinute = 3500; // 3500 requests per minute
  private readonly rateLimitRequestsPerSecond = 100; // 100 requests per second on average
  private readonly rateLimitBurst = 200; // 200 requests per second burst
  private readonly rateLimitInterval = 60000; // 1 minute
  private readonly rateLimitIntervalBurst = 1000; // 1 second

  private readonly clientId = process.env.APALEO_CLIENT_ID;
  private readonly clientSecret = process.env.APALEO_CLIENT_SECRET;
  private readonly successStatus = [200, 201, 202, 204];
  private cacheTokenKey = 'apaleo_access_token_{propertyId}';

  constructor(
    private readonly httpService: HttpService,
    private readonly redisService: RedisService
  ) {}

  /**
   * Exchange authorization code for access token and refresh token
   * Following Java implementation: ApaleoServiceImpl.exchangeRefreshToken
   */
  async exchangeAuthorizationCode(
    authorizationCode: string,
    redirectUrl: string,
    propertyId: string
  ): Promise<ApaleoAccessTokenDto & { accountCode?: string }> {
    this.logger.log(`Exchanging authorization code for property ${propertyId}`);
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', authorizationCode);
      params.append('redirect_uri', redirectUrl);
      params.append('client_id', this.clientId!);
      params.append('client_secret', this.clientSecret!);

      const response: AxiosResponse<ApaleoAccessTokenDto> = await lastValueFrom(
        this.httpService.post(APALEO_APIS.API_URL, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      if (response.status !== 200) {
        this.logger.error(
          `Error exchanging authorization code for property ${propertyId}: ${response.statusText}`
        );
        throw new BadRequestException(response.statusText);
      }

      if (!response.data.access_token || !response.data.refresh_token) {
        this.logger.error(`Invalid token response for property ${propertyId}`);
        throw new BadRequestException('Invalid token response');
      }

      // Get current account to retrieve account code
      const account = await this.getCurrentAccount(response.data.access_token, propertyId);
      const accountCode = account?.code;

      return {
        ...response.data,
        accountCode
      };
    } catch (error) {
      this.logger.error(
        `Error exchanging authorization code for property ${propertyId}: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(
        `Failed to exchange authorization code: ${error.response?.data?.error_description || error.message}`
      );
    }
  }

  /**
   * Get current account information
   * Following Java implementation: ApaleoServiceImpl.getCurrentAccount
   */
  private async getCurrentAccount(
    accessToken: string,
    propertyId: string
  ): Promise<{ code: string } | null> {
    try {
      const url = `${this.apaleoApi}/account/v1/accounts/current`;
      const idempotencyKey = uuidv4();

      const response: AxiosResponse<{ code: string }> = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          }
        })
      );

      if (response.status === 200 && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to get current account for property ${propertyId}: ${error.message}`
      );
      return null;
    }
  }

  async getAccessToken(refreshToken: string, propertyId: string) {
    this.logger.log(`Getting access token for property ${propertyId}`);
    // step 1: get token from cache
    const cacheTokenKey = this.cacheTokenKey.replace('{propertyId}', propertyId);

    const cachedToken = await this.redisService.get(cacheTokenKey);
    if (cachedToken) {
      this.logger.log(`Token found in cache for property ${propertyId}`);
      return cachedToken;
    }

    // step 2: get token from apaleo
    this.logger.log(`Getting token from apaleo for property ${propertyId}`);
    try {
      const params = new URLSearchParams();
      params.append('client_id', this.clientId!);
      params.append('client_secret', this.clientSecret!);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');

      const response: AxiosResponse<ApaleoAccessTokenDto> = await lastValueFrom(
        this.httpService.post(APALEO_APIS.API_URL, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      if (response.status !== 200) {
        this.logger.error(
          `Error getting access token for property ${propertyId}: ${response.statusText}`
        );
        throw new Error(response.statusText);
      }

      if (!response.data.access_token) {
        this.logger.error(`No access token found in response for property ${propertyId}`);
        throw new Error('No access token found in response');
      }

      // step 3: save token to cache
      await this.redisService.set(
        cacheTokenKey,
        response.data.access_token,
        response.data.expires_in - 60 * 5
      ); // 5 minutes before expiration

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Error getting access token for property ${propertyId}: ${error}`);
      throw error;
    }
  }

  private readonly apaleoApi = process.env.APALEO_API || 'https://api.apaleo.com';

  /**
   * Common method to make HTTP requests to Apaleo API
   */
  private async makeRequest<T>(
    url: string,
    accessToken: string,
    params?: URLSearchParams
  ): Promise<T> {
    try {
      const fullUrl = params ? `${url}?${params.toString()}` : url;

      const response: AxiosResponse<T> = await lastValueFrom(
        this.httpService.get(fullUrl, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`
          }
        })
      );

      if (!this.successStatus.includes(response.status)) {
        this.logger.error(`Apaleo API error: ${response.status} - ${response.statusText}`);
        throw new Error(`Apaleo API error: ${response.status} - ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      // this.logger.error(`Error making request to Apaleo API: ${JSON.stringify(error.response.data)}`);
      throw new BadRequestException(error.response.data);
    }
  }

  /**
   * Generic recursive pagination helper
   * Fetches all pages of data from a paginated Apaleo API endpoint
   */
  private async fetchAllPagesRecursive<TResponse extends { count: number }, TItem>(
    url: string,
    accessToken: string,
    buildQueryParams: (pageNumber: number, pageSize: number) => URLSearchParams,
    extractItems: (response: TResponse) => TItem[],
    pageSize: number = 200,
    maxPages: number = 1000,
    logPrefix: string = 'items'
  ): Promise<{ items: TItem[]; count: number }> {
    const allItems: TItem[] = [];
    const MAX_PAGES = maxPages;

    // Recursive helper to fetch all pages
    const fetchPage = async (pageNumber: number): Promise<void> => {
      // Safety check to prevent infinite recursion
      if (pageNumber > MAX_PAGES) {
        this.logger.warn(
          `Reached maximum page limit (${MAX_PAGES}). Stopping pagination. Fetched ${allItems.length} ${logPrefix}.`
        );
        return;
      }

      const queryParams = buildQueryParams(pageNumber, pageSize);
      const response = await this.makeRequest<TResponse>(url, accessToken, queryParams);

      const items = extractItems(response);
      if (items.length > 0) {
        allItems.push(...items);
      }

      // Check if there are more pages to fetch
      const totalFetched = allItems.length;
      const totalCount = response.count;

      // Also check if the current page returned fewer items than pageSize (indicates last page)
      const isLastPage = items.length < pageSize;

      if (totalFetched < totalCount && !isLastPage) {
        // Calculate next page number
        const nextPageNumber = pageNumber + 1;
        this.logger.log(
          `Fetched ${totalFetched}/${totalCount} ${logPrefix}. Fetching page ${nextPageNumber}...`
        );
        await fetchPage(nextPageNumber);
      } else {
        this.logger.log(`Fetched all ${totalFetched} ${logPrefix}.`);
      }
    };

    // Start fetching from page 1
    await fetchPage(1);

    return {
      items: allItems,
      count: allItems.length
    };
  }

  private async makeMutationRequest<T>(
    url: string,
    accessToken: string,
    method: 'post' | 'put' | 'patch' | 'delete' = 'post',
    data?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await lastValueFrom(
        method === 'delete'
          ? this.httpService.delete(url, {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`
              }
            })
          : this.httpService[method](url, data, {
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`
              }
            })
      );

      if (!this.successStatus.includes(response.status)) {
        this.logger.error(`Apaleo API error: ${response.status} - ${response.statusText}`);
        throw new Error(`Apaleo API error: ${response.status} - ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      const message = error.response?.data?.messages?.join(', ') || error.message;
      this.logger.error(`Error making request to Apaleo API: ${message}`);
      throw new BadRequestException(message);
    }
  }

  /**
   * Get properties from Apaleo API
   * GET https://api.apaleo.com/inventory/v1/properties?status=Test
   */
  async getProperties(accessToken: string, status?: 'Test' | 'Live') {
    this.logger.log(`Getting properties from Apaleo API`);

    const url = APALEO_APIS.GET_PROPERTIES_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }

    return await this.makeRequest<{
      properties: ApaleoPropertyDto[];
      count: number;
    }>(url, accessToken, params);
  }

  /**
   * Get unit groups from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/inventory/v1/unit-groups?propertyId=CARDTERC&pageNumber=1&pageSize=200&expand=connectedUnitGroups
   */
  async getUnitGroups(accessToken: string, params: ApaleoGetUnitGroupListDto) {
    this.logger.log(`Getting unit groups for property ${params.propertyId}`);

    const url = APALEO_APIS.GET_UNIT_GROUP_LIST_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('propertyId', params.propertyId);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.expand && params.expand.length > 0) {
        queryParams.append('expand', params.expand.join(','));
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      unitGroups: ApaleoUnitGroupDto[];
      count: number;
    }, ApaleoUnitGroupDto>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.unitGroups || [],
      pageSize,
      1000,
      'unit groups'
    );

    return {
      unitGroups: result.items,
      count: result.count
    };
  }

  /**
   * Get units from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/inventory/v1/units?propertyId=CARDTERC&pageNumber=1&pageSize=200&expand=unitGroup
   */
  async getUnits(accessToken: string, params: ApaleoGetUnitListDto) {
    this.logger.log(`Getting units for property ${params.propertyId}`);

    const url = APALEO_APIS.GET_UNIT_LIST_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('propertyId', params.propertyId);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.expand && params.expand.length > 0) {
        queryParams.append('expand', params.expand.join(','));
      }

      if (params.unitGroupIds && params.unitGroupIds.length > 0) {
        params.unitGroupIds.forEach((id) => queryParams.append('unitGroupIds', id));
      }

      if (params.unitAttributeIds && params.unitAttributeIds.length > 0) {
        params.unitAttributeIds.forEach((id) => queryParams.append('unitAttributeIds', id));
      }

      if (params.isOccupied !== undefined) {
        queryParams.append('isOccupied', params.isOccupied.toString());
      }

      if (params.maintenanceType) {
        queryParams.append('maintenanceType', params.maintenanceType);
      }

      if (params.condition) {
        queryParams.append('condition', params.condition);
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      units: ApaleoUnitListResponseDto[];
      count: number;
    }, ApaleoUnitListResponseDto>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.units || [],
      pageSize,
      1000,
      'units'
    );

    return {
      units: result.items,
      count: result.count
    };
  }

  /**
   * Get rate plans from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/rateplan/v1/rate-plans?propertyId=CARDTERC&isDerived=false&pageNumber=1&pageSize=200&expand=unitGroup%2CcancellationPolicy
   */
  async getRatePlans(accessToken: string, params: ApaleoGetRatePlanListDto) {
    this.logger.log(`Getting rate plans for property ${params.propertyId}`);

    const url = APALEO_APIS.GET_RATE_PLAN_LIST_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('propertyId', params.propertyId);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.timeSliceTemplate) {
        queryParams.append('timeSliceTemplate', params.timeSliceTemplate);
      }

      if (params.isDerived !== undefined) {
        queryParams.append('isDerived', params.isDerived.toString());
      }

      if (params.expand && params.expand.length > 0) {
        queryParams.append('expand', params.expand.join(','));
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      ratePlans: any[];
      count: number;
    }, any>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.ratePlans || [],
      pageSize,
      1000,
      'rate plans'
    );

    return {
      ratePlans: result.items,
      count: result.count
    };
  }

  /**
   * Get rate plan pricing from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/rateplan/v1/rate-plans/CARDTERC-QRATEPLANNEW-QTEST/rates?from=2025-09-25&to=2026-09-25&pageNumber=1&pageSize=200
   */
  async getRatePlanPricing(
    accessToken: string,
    ratePlanId: string,
    params: ApaleoGetRatePlanPricingListDto
  ) {
    this.logger.log(`Getting rate plan pricing for rate plan ${ratePlanId}`);

    const url = APALEO_APIS.GET_RATE_PLAN_PRICING_LIST_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{ratePlanId}', ratePlanId);
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('from', params.from);
      queryParams.append('to', params.to);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.expand && params.expand.length > 0) {
        queryParams.append('expand', params.expand.join(','));
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      rates: ApaleoRatePlanPricingDto[];
      count: number;
    }, ApaleoRatePlanPricingDto>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.rates || [],
      pageSize,
      1000,
      'rates'
    );

    return {
      rates: result.items,
      count: result.count
    };
  }

  async patchRatePlanService(payload: {
    accessToken: string,
    serviceId: string;
    body: ApaleoRatePlanServiceDto[]
  }) {
    this.logger.log(`Patching rate plan service for rate plan ${payload.serviceId}`);

    const url = APALEO_APIS.PATCH_RATE_PLAN_SERVICE_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{serviceId}', payload.serviceId);

    return await this.makeMutationRequest<{
      rates: ApaleoRatePlanPricingDto[];
      count: number;
    }>(url, payload.accessToken, 'patch', payload.body);
  }

  async putRatePlanPricing(
    accessToken: string,
    ratePlanId: string,
    body: ApaleoRatePlanPricingDto[]
  ) {
    this.logger.log(`Getting rate plan pricing for rate plan ${ratePlanId}`);

    const url = APALEO_APIS.GET_RATE_PLAN_PRICING_LIST_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{ratePlanId}', ratePlanId);

    return await this.makeMutationRequest<{
      rates: ApaleoRatePlanPricingDto[];
      count: number;
    }>(url, accessToken, 'put', {
      rates: body
    });
  }

  /**
   * Get services from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/rateplan/v1/services?propertyId=CARDTERC&onlySoldAsExtras=true&serviceTypes=FoodAndBeverages%2CAccommodation&pageNumber=1&pageSize=200&expand=property
   */
  async getServices(accessToken: string, params: ApaleoGetServiceListDto) {
    this.logger.log(`Getting services for property ${params.propertyId}`);

    const url = APALEO_APIS.GET_SERVICE_LIST_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('propertyId', params.propertyId);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.onlySoldAsExtras !== undefined) {
        queryParams.append('onlySoldAsExtras', params.onlySoldAsExtras.toString());
      }

      if (params.serviceTypes && params.serviceTypes.length > 0) {
        for (const serviceType of params.serviceTypes) {
          queryParams.append('serviceTypes', encodeURIComponent(serviceType));
        }
      }

      if (params.expand && params.expand.length > 0) {
        queryParams.append('expand', params.expand.join(','));
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      services: ApaleoServiceDto[];
      count: number;
    }, ApaleoServiceDto>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.services || [],
      pageSize,
      1000,
      'services'
    );

    return {
      services: result.items,
      count: result.count
    };
  }

  /**
   * Get taxes from Apaleo API
   * GET https://api.apaleo.com/finance/v1/types/vat?propertyId=CARDTERC
   */
  async getApaleoTaxes(accessToken: string, params: ApaleoGetTaxListDto) {
    const url = APALEO_APIS.TAX.HOTEL_TAX.replace('{{APALEO_API}}', this.apaleoApi);
    const queryParams = new URLSearchParams();
    queryParams.append('isoCountryCode', params.isoCountryCode);
    if (params.atDate) {
      queryParams.append('atDate', params.atDate);
    }
    return await this.makeRequest<{
      vatTypes: ApaleoTaxDto[];
    }>(url, accessToken, queryParams);
  }

  /**
   * Get city taxes from Apaleo API
   * GET https://api.apaleo.com/settings/v1/city-tax?propertyId=CARDTERC
   */
  async getApaleoCityTaxes(accessToken: string, params: ApaleoGetCityTaxListDto) {
    const url = APALEO_APIS.TAX.CITY_TAX.replace('{{APALEO_API}}', this.apaleoApi);
    const queryParams = new URLSearchParams();
    queryParams.append('propertyId', params.propertyId);
    return await this.makeRequest<{
      cityTaxes: ApaleoCityTaxDto[];
      count: number;
    }>(url, accessToken, queryParams);
  }

  /**
   * Get availability from Apaleo API
   * GET https://api.apaleo.com/availability/v1/unit-groups?propertyId=CARDTERC&from=2025-09-21&to=2025-09-30&onlySellable=true&pageNumber=1&pageSize=9350
   */
  /**
   * Get availability from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/availability/v1/unit-groups?propertyId=CARDTERC&from=2025-09-21&to=2025-09-30&onlySellable=true&pageNumber=1&pageSize=200
   */
  async getAvailability(accessToken: string, params: ApaleoGetAvailabilityListDto) {
    this.logger.log(`Getting availability for property ${params.propertyId}`);

    const url = APALEO_APIS.GET_AVAILABILITY_LIST_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('propertyId', params.propertyId);
      queryParams.append('from', params.from);
      queryParams.append('to', params.to);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.onlySellable !== undefined) {
        queryParams.append('onlySellable', params.onlySellable.toString());
      }

      if (params.expand && params.expand.length > 0) {
        queryParams.append('expand', params.expand.join(','));
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      timeSlices: ApaleoAvailabilityDto[];
      count: number;
    }, ApaleoAvailabilityDto>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.timeSlices || [],
      pageSize,
      1000,
      'time slices'
    );

    return {
      timeSlices: result.items,
      count: result.count
    };
  }

  /**
   * Get availability from Apaleo API with recursive pagination
   * GET https://api.apaleo.com/availability/v1/units?propertyId=CARDTERC&from=2025-09-21&to=2025-09-30&onlySellable=true&pageNumber=1&pageSize=200
   */
  async getAvailabilityUnit(accessToken: string, params: ApaleoGetAvailabilityUnitListDto) {
    this.logger.log(`Getting availability for property ${params.propertyId}`);

    const url = APALEO_APIS.GET_AVAILABILITY_UNIT_LIST_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    );
    const pageSize = params.pageSize || 200;

    const buildQueryParams = (pageNumber: number, pageSize: number): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('propertyId', params.propertyId);
      queryParams.append('from', params.from);
      queryParams.append('to', params.to);
      queryParams.append('pageNumber', pageNumber.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (params.onlySellable !== undefined) {
        queryParams.append('onlySellable', params.onlySellable.toString());
      }

      return queryParams;
    };

    const result = await this.fetchAllPagesRecursive<{
      units: ApaleoUnitListResponseDto[];
      count: number;
    }, ApaleoUnitListResponseDto>(
      url,
      accessToken,
      buildQueryParams,
      (response) => response.units || [],
      pageSize,
      1000,
      'units'
    );

    return {
      units: result.items,
      count: result.count
    };
  }

  /**
   * Parse Apaleo availability response to match the expected format
   */
  parseApaleoAvailability(
    timeSlices: ApaleoAvailabilityDto[]
  ): RoomProductAvailabilityMappingDto[] {
    const result: RoomProductAvailabilityMappingDto[] = [];

    if (!timeSlices || !Array.isArray(timeSlices)) {
      return result;
    }

    // Process each time slice
    timeSlices.forEach((timeSlice: ApaleoAvailabilityDto) => {
      if (!timeSlice.unitGroups || !Array.isArray(timeSlice.unitGroups)) {
        return;
      }

      // Extract date from the 'from' field (hotel timezone)
      const fromDate = timeSlice.from;
      if (!fromDate) return;

      // Parse the date from ISO string and format as YYYY-MM-DD
      const date = fromDate.split('T')[0];

      // Process each unit group in this time slice
      timeSlice.unitGroups.forEach((unitGroupData: ApaleoAvailabilityDto['unitGroups'][number]) => {
        const unitGroup = unitGroupData.unitGroup;
        if (!unitGroup) return;

        result.push({
          roomProductMappingPmsCode: unitGroup.id || '',
          date: date,
          available: unitGroupData.availableCount || 0,
          adjustment: unitGroupData.allowedOverbookingCount || 0 // adjustment is allowedOverbookingCount
        });
      });
    });

    return result;
  }

  /**
   * Parse Apaleo maintenance data from availability response
   * deprecated
   */
  parseApaleoMaintenance(units: ApaleoUnitListResponseDto[]): RoomUnitMaintenanceMappingDto[] {
    const result: RoomUnitMaintenanceMappingDto[] = [];

    // if (!units || !Array.isArray(units)) {
    //   return result;
    // }

    // // Process each time slice
    // units.forEach((unit: ApaleoUnitListResponseDto) => {
    //   if (!unit.unitGroup || !unit.unitGroup.maintenance) {
    //     return;
    //   }

    //   const fromDate = timeSlice.from;
    //   const toDate = timeSlice.to;
    //   if (!fromDate || !toDate) return;

    //   // Process each unit group in this time slice
    //   timeSlice.unitGroups.forEach((unitGroupData: ApaleoAvailabilityDto['unitGroups'][number]) => {
    //     const unitGroup = unitGroupData.unitGroup;
    //     const maintenance = unitGroupData.maintenance;

    //     if (!unitGroup || !maintenance) return;

    //     // Check for maintenance issues
    //     if (maintenance.outOfService > 0) {
    //       result.push({
    //         roomUnitMappingPmsCode: unitGroup.id!,
    //         startDate: format(new Date(fromDate), DATE_FORMAT),
    //         endDate: format(new Date(toDate), DATE_FORMAT),
    //         type: RoomUnitAvailabilityStatus.BLOCKED // Map outOfService to BLOCKED
    //       });
    //     }

    //     if (maintenance.outOfOrder > 0) {
    //       result.push({
    //         roomUnitMappingPmsCode: unitGroup.id!,
    //         startDate: format(new Date(fromDate), DATE_FORMAT),
    //         endDate: format(new Date(toDate), DATE_FORMAT),
    //         type: RoomUnitAvailabilityStatus.OUT_OF_ORDER
    //       });
    //     }

    //     if (maintenance.outOfInventory > 0) {
    //       result.push({
    //         roomUnitMappingPmsCode: unitGroup.id!,
    //         startDate: format(new Date(fromDate), DATE_FORMAT),
    //         endDate: format(new Date(toDate), DATE_FORMAT),
    //         type: RoomUnitAvailabilityStatus.OUT_OF_INVENTORY
    //       });
    //     }
    //   });
    // });

    return result;
  }

  /**
   * Parse Apaleo rate plan pricing response to match the expected format
   */
  parseApaleoRatePlanPricing(
    rates: ApaleoRatePlanPricingDto[],
    ratePlanMappingPmsCode: string,
    unitGroupId: string
  ): RatePlanPricingMappingDto[] {
    const result: RatePlanPricingMappingDto[] = [];

    if (!rates || !Array.isArray(rates)) {
      return result;
    }

    rates.forEach((rate: ApaleoRatePlanPricingDto) => {
      // Apaleo rate structure
      const fromDate = rate.from;
      const toDate = rate.to;
      const price = rate.price?.amount || 0;

      if (!fromDate || !toDate) return;

      if (price === 0) return;

      if (fromDate && toDate) {
        // Generate date range for this rate period
        const date = fromDate.split('T')[0];

        result.push({
          roomProductMappingPmsCode: unitGroupId, // This might need to be mapped from unit group
          date: date,
          netPrice: price, // Assume net price for now
          grossPrice: price, // Assume same as net if no tax info
          ratePlanMappingPmsCode: ratePlanMappingPmsCode,
          pricingMode: 'Gross' // Default to Gross
        });
      }
    });

    return result;
  }

  /**
   * Parse Apaleo rate plan pricing restrictions to match the expected format
   */
  parseApaleoRatePlanRestrictions(
    rates: ApaleoRatePlanPricingDto[],
    ratePlanMappingPmsCode: string,
    hotelTimeZone: string
  ): RestrictionMappingDto[] {
    const result: RestrictionMappingDto[] = [];

    if (!rates || !Array.isArray(rates)) {
      return result;
    }

    rates.forEach((rate: ApaleoRatePlanPricingDto) => {
      const { from, to, restrictions } = rate;
      if (!restrictions) return;

      // 1️⃣ Convert to system timezone (e.g., UTC)
      if (!from || !to) return;
      const fromDate = from.split('T')[0];

      if (!fromDate) return;

      // 2️⃣ Normalize both to 00:00 UTC
      const formattedFromDate = `${format(fromDate, DATE_FORMAT)}T00:00:00Z`;
      const formattedToDate = `${format(fromDate, DATE_FORMAT)}T00:00:00Z`;

      // Map Apaleo restrictions to our restriction format
      // Helper function to create a restriction entry
      const createRestriction = (
        type: RestrictionConditionType | undefined,
        overrides: Partial<{
          minLength: number | null;
          maxLength: number | null;
        }> = {}
      ) => ({
        roomProductMappingPmsCode: undefined,
        ratePlanMappingPmsCode,
        fromDate: formattedFromDate,
        toDate: formattedToDate,
        type,
        weekdays: Object.values(Weekday),
        minLength: overrides.minLength ?? null,
        maxLength: overrides.maxLength ?? null,
        minAdv: null,
        maxAdv: null,
        minLosThrough: null,
        connectorType: ConnectorTypeEnum.APALEO
      });

      // --- Map Apaleo restrictions to our format ---

      // Boolean restriction mappings
      const booleanRestrictions: Record<string, RestrictionConditionType> = {
        closed: RestrictionConditionType.ClosedToStay,
        closedOnArrival: RestrictionConditionType.ClosedToArrival,
        closedOnDeparture: RestrictionConditionType.ClosedToDeparture
      };

      for (const [key, type] of Object.entries(booleanRestrictions)) {
        if (restrictions[key]) {
          result.push(createRestriction(type));
        }
      }

      // --- Handle Length of Stay (LOS) restrictions ---
      const { minLengthOfStay, maxLengthOfStay } = restrictions;

      if (maxLengthOfStay > 0 && !minLengthOfStay) {
        result.push(
          createRestriction(undefined, {
            maxLength: maxLengthOfStay
          })
        );
      }

      if (minLengthOfStay > 0 && !maxLengthOfStay) {
        result.push(
          createRestriction(undefined, {
            minLength: minLengthOfStay
          })
        );
      }

      if (minLengthOfStay > 0 && maxLengthOfStay > 0) {
        result.push(
          createRestriction(undefined, {
            minLength: minLengthOfStay,
            maxLength: maxLengthOfStay
          })
        );
      }
    });

    return result;
  }

  /**
   * Get folios for reservations
   * GET https://api.apaleo.com/finance/v1/folios?reservationIds={ids}&expand=charges
   */
  async getApaleoFolios(
    accessToken: string,
    reservationIds: string[]
  ): Promise<ApaleoFolioListResponseDto> {
    const url = APALEO_APIS.FINANCE.GET_FOLIOS_URL.replace('{{APALEO_API}}', this.apaleoApi);
    const queryParams = new URLSearchParams();
    queryParams.append('expand', 'charges');
    queryParams.append('reservationIds', reservationIds.join(','));
    return await this.makeRequest<ApaleoFolioListResponseDto>(url, accessToken, queryParams);
  }

  /**
   * Extract cityTax per reservation from folios
   * Similar to Java's getCityTaxPerReservation method
   */
  private getCityTaxChargesPerReservation(
    folioList: ApaleoFolioItemDto[]
  ): Map<string, ApaleoFolioChargeDto[]> {
    const cityTaxMap = new Map<string, ApaleoFolioChargeDto[]>();

    for (const folio of folioList) {
      if (!folio.reservation) {
        continue;
      }
      const reservationId = folio.reservation.id;
      const cityTaxCharges =
        folio.charges?.filter((charge) => charge.type?.toLowerCase()?.includes('citytax')) || [];

      if (cityTaxCharges.length > 0) {
        cityTaxMap.set(reservationId, cityTaxCharges);
      }
    }

    return cityTaxMap;
  }

  async getApaleoReservations(accessToken: string, params: URLSearchParams) {
    const url = APALEO_APIS.RESERVATION.GET_RESERVATION_LIST_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    );

    const response = await this.makeRequest<ApaleoReservationListResponseDto>(
      url,
      accessToken,
      params
    );

    // Check if expand contains "reservationOnly" - if so, skip cityTax sync
    const expandParam = params.get('expand');
    const expandValues = expandParam ? expandParam.split(',') : [];
    const isReservationOnly = expandValues.includes('reservationOnly');

    if (!isReservationOnly && response.reservations && response.reservations.length > 0) {
      // Get reservation IDs
      const reservationIds = response.reservations.map((res) => res.id);

      // Fetch folios with charges
      const folioResponse = await this.getApaleoFolios(accessToken, reservationIds);

      // Extract cityTax per reservation
      const cityTaxChargesPerReservation = this.getCityTaxChargesPerReservation(
        folioResponse.folios || []
      );

      // Map cityTax to reservations
      for (const reservation of response.reservations) {
        reservation.cityTaxCharges = cityTaxChargesPerReservation.get(reservation.id) || [];
      }
    }

    return response;
  }

  async getApaleoReservation(accessToken: string, reservationId: string, params: URLSearchParams) {
    const url = APALEO_APIS.RESERVATION.GET_RESERVATION_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{reservationId}', reservationId);

    const response = await this.makeRequest<ApaleoReservationDto>(url, accessToken, params);

    // Check if expand contains "reservationOnly" - if so, skip cityTax sync
    const expandParam = params.get('expand');
    const expandValues = expandParam ? expandParam.split(',') : [];
    const isReservationOnly = expandValues.includes('reservationOnly');

    if (!isReservationOnly && response) {
      // Fetch folios with charges for this reservation
      const folioResponse = await this.getApaleoFolios(accessToken, [reservationId]);

      // Extract cityTax per reservation
      const cityTaxChargesPerReservation = this.getCityTaxChargesPerReservation(
        folioResponse.folios || []
      );

      // Map cityTax to reservation
      response.cityTaxCharges = cityTaxChargesPerReservation.get(reservationId) || [];
    }

    return response;
  }

  async getApaleoBooking(accessToken: string, params: URLSearchParams) {
    const url = APALEO_APIS.BOOKING.GET_BOOKING_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{bookingId}', params.get('bookingId')!);
    return await this.makeRequest<ApaleoBookingDto>(url, accessToken);
  }

  async cancelApaleoReservation(accessToken: string, reservationId: string) {
    try {
      const url = APALEO_APIS.RESERVATION.CANCEL_RESERVATION_URL.replace(
        '{{APALEO_API}}',
        this.apaleoApi
      ).replace('{reservationId}', reservationId);
      this.redisService.set(
        `apaleo_reservation_canceled_${reservationId}`,
        JSON.stringify(reservationId),
        60 * 5 // 5 minutes
      );
      return await this.makeMutationRequest<{ message: string }>(url, accessToken, 'put');
    } catch (error) {
      throw new BadRequestException(
        JSON.stringify(error?.messages) || 'Failed to cancel reservation'
      );
    }
  }

  async getApaleoSubscriptions(input: { accessToken: string }) {
    const { accessToken } = input;
    try {
      const res = await lastValueFrom(
        this.httpService.get(APALEO_APIS.SUBSCRIPTION_WEBHOOK, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      );
      return res.data;
    } catch (err) {
      this.logger.error('❌ Failed to get subscriptions:', err.response?.data || err);
      throw new BadRequestException(err.response?.data?.messages);
    }
  }

  async updateApaleoSubscriptions(input: {
    accessToken: string;
    subscriptionId: string;
    payload: any;
  }) {
    const { accessToken, subscriptionId, payload } = input;
    try {
      const url = `${APALEO_APIS.SUBSCRIPTION_WEBHOOK}/${subscriptionId}`;
      const res = await this.makeMutationRequest<any>(url, accessToken, 'put', payload);
      this.logger.log('✅ Subscriptions updated:', res);
      return res;
    } catch (err) {
      this.logger.error(`❌ Failed to update subscriptions: ${err.response?.data?.messages}`);
      // throw new BadRequestException(err.response?.data?.messages);
    }
  }

  async registerApaleWebhook(input: { payload: any; accessToken: string }) {
    const { payload, accessToken } = input;
    try {
      const res = await lastValueFrom(
        this.httpService.post(APALEO_APIS.SUBSCRIPTION_WEBHOOK, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      );
      this.logger.log('✅ Webhook registered:', res);
      return res;
    } catch (err) {
      this.logger.error(`❌ Failed to register webhook: ${err.response?.data?.messages}`);
      throw new BadRequestException(err.response?.data?.messages);
    }
  }

  async createRatePlanRestriction(accessToken: string, input: ApaleoPatchRatesDto[]) {
    const baseUrl = APALEO_APIS.RATE.PATCH_RATES.replace('{{APALEO_API}}', this.apaleoApi);

    if (!accessToken) {
      this.logger.error('Access token is required');
      return null;
    }

    if (!input?.length) {
      this.logger.error('Input is required');
      return null;
    }

    const batchSize = 5; // safer concurrency
    const delayBetweenBatches = 2500; // ~2.5s between batches
    const maxRetries = 3;

    for (let i = 0; i < input.length; i += batchSize) {
      const batch = input.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item) => {
          const { fromDate, toDate, pmsRatePlanId } = item;
          if (!fromDate || !toDate || !pmsRatePlanId) {
            this.logger.error('From date, to date, and pms rate plan id are required');
            return;
          }

          const params = new URLSearchParams({
            ratePlanIds: pmsRatePlanId,
            from: fromDate,
            to: toDate
          });
          const finalUrl = `${baseUrl}?${params.toString()}`;

          const operations: any[] = [];
          const possibleFields: (keyof ApaleoPatchRatesDto)[] = [
            'isCTA',
            'isCTD',
            'isCTS',
            'minLength',
            'maxLength'
          ];

          // Handle invalid min/max -> force CTS
          if (
            item.minLength !== undefined &&
            item.maxLength !== undefined &&
            item.minLength > item.maxLength
          ) {
            operations.push({
              op: 'replace',
              path: this.mapOperationPath('isCTS')!,
              value: true
            });
          } else {
            for (const field of possibleFields) {
              if (item[field] !== undefined) {
                const path = this.mapOperationPath(field);
                const value = this.mapOperationValue(field, item);
                if (!path) continue;

                const op = value === undefined || value === null ? 'remove' : 'replace';
                operations.push({ op, path, ...(op === 'replace' ? { value } : {}) });
              }
            }
          }

          if (operations.length === 0) {
            this.logger.warn(`No valid restriction operations for ${pmsRatePlanId}`);
            return;
          }

          // Retry with capped exponential backoff
          let attempts = 0;
          while (attempts < maxRetries) {
            try {
              await this.makeMutationRequest(finalUrl, accessToken, 'patch', operations);
              return;
            } catch (err: any) {
              if (err.response?.status === 429) {
                const retryAfterHeader = Number(err.response.headers['retry-after']) * 1000;
                const baseDelay = retryAfterHeader || 5000;
                const backoff = Math.min(baseDelay * Math.pow(2, attempts), 60000); // cap at 60s
                this.logger.warn(
                  `Rate limit hit for ${pmsRatePlanId}. Retrying after ${Math.round(backoff)}ms (attempt ${
                    attempts + 1
                  })`
                );
                await new Promise((r) => setTimeout(r, backoff));
                attempts++;
              } else {
                this.logger.error(
                  `Error patching ${pmsRatePlanId}: ${err.message}`,
                  JSON.stringify(operations)
                );
                break;
              }
            }
          }
        })
      );

      // 🕒 Throttle batches globally
      if (i + batchSize < input.length) {
        this.logger.debug(`Throttling between batches. Waiting ${delayBetweenBatches}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    this.logger.debug(`Processed all ${input.length} items`);
  }

  private mapOperationPath(field: keyof ApaleoPatchRatesDto): string | null {
    switch (field) {
      case 'isCTA':
        return 'restrictions/closedOnArrival';
      case 'isCTD':
        return 'restrictions/closedOnDeparture';
      case 'isCTS':
        return 'restrictions/closed';
      case 'minLength':
        return 'restrictions/minLengthOfStay';
      case 'maxLength':
        return 'restrictions/maxLengthOfStay';
      default:
        return null;
    }
  }

  private mapOperationValue(field: keyof ApaleoPatchRatesDto, item: any): any {
    switch (field) {
      case 'isCTA':
      case 'isCTD':
      case 'isCTS':
        return item[field] === true; // boolean
      case 'minLength':
      case 'maxLength':
        return Number(item[field]); // numeric
      default:
        return undefined;
    }
  }

  async lockUnits(accessToken: string, reservationMappingCode: string) {
    try {
      const lockUnitsUrl =
        `${APALEO_APIS.UNIT.LOCK_UNIT.replace('{{APALEO_API}}', this.apaleoApi)}`.replace(
          '{id}',
          reservationMappingCode
        );

      const cmd = getCurlCommand(
        lockUnitsUrl,
        'PUT',
        {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        null
      );
      this.logger.debug(`Curl command lock units apaleo: ${JSON.stringify(cmd)}`);
      return await this.makeMutationRequest<{ message: string }>(lockUnitsUrl, accessToken, 'put');
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to lock units');
    }
  }

  async unlockUnits(accessToken: string, reservationMappingCode: string) {
    try {
      const unlockUnitsUrl =
        `${APALEO_APIS.UNIT.UNLOCK_UNIT.replace('{{APALEO_API}}', this.apaleoApi)}`.replace(
          '{id}',
          reservationMappingCode
        );
      const cmd = getCurlCommand(
        unlockUnitsUrl,
        'PUT',
        {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        null
      );
      this.logger.debug(`Curl command lock units apaleo: ${JSON.stringify(cmd)}`);
      return await this.makeMutationRequest<{ message: string }>(
        unlockUnitsUrl,
        accessToken,
        'put'
      );
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to unlock units');
    }
  }

  async getApaleoBlock(accessToken: string, blockId: string): Promise<ApaleoBlockDto | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('expand', 'timeSlices');
      const url = APALEO_APIS.BLOCK.GET_BLOCK_URL.replace('{{APALEO_API}}', this.apaleoApi).replace(
        '{blockId}',
        blockId
      );
      return await this.makeRequest<ApaleoBlockDto>(url, accessToken, queryParams);
    } catch (error) {
      return null;
    }
  }

  async getApaleoBlocks(
    accessToken: string,
    queryParams: URLSearchParams
  ): Promise<ApaleoBlockDto[] | null> {
    try {
      const url = APALEO_APIS.BLOCK.GET_BLOCKS_URL.replace('{{APALEO_API}}', this.apaleoApi);
      const response = await this.makeRequest<{
        blocks: ApaleoBlockDto[];
        count: number;
      }>(url, accessToken, queryParams);
      return response?.blocks || [];
    } catch (error) {
      return null;
    }
  }

  async updateApaleoAvailability(
    accessToken: string,
    unitGroupId: string,
    input: ApaleoUpdateAvailabilityDto[]
  ) {
    if (!unitGroupId) {
      this.logger.error('Unit group id is required');
      return null;
    }

    const baseUrl = APALEO_APIS.AVAILABILITY.UPDATE_AVAILABILITY_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{unitGroupId}', unitGroupId);

    if (!accessToken) {
      this.logger.error('Access token is required');
      return null;
    }

    if (!input?.length) {
      this.logger.error('Input is required');
      return null;
    }

    const batchSize = 20; // safer concurrency
    const delayBetweenBatches = 2500; // ~2.5s between batches
    const maxRetries = 5;

    this.logger.debug(
      `Updating availability for unit group ${unitGroupId} with ${input.length} time slices`
    );

    for (let i = 0; i < input.length; i += batchSize) {
      const batch = input.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (item) => {
          const { fromDate, toDate, allowedOverbooking } = item;
          if (
            !fromDate ||
            !toDate ||
            allowedOverbooking === undefined ||
            allowedOverbooking === null
          ) {
            this.logger.error('From date, to date, and allowed overbooking are required');
            return;
          }

          const params = new URLSearchParams({
            from: fromDate,
            to: toDate,
            timeSliceTemplate: 'OverNight'
          });
          const finalUrl = `${baseUrl}?${params.toString()}`;

          const operations: any[] = [];

          operations.push({
            op: 'replace',
            path: 'allowedOverbooking',
            value: allowedOverbooking
          });

          // Retry with capped exponential backoff
          let attempts = 0;
          while (attempts < maxRetries) {
            try {
              await this.makeMutationRequest(finalUrl, accessToken, 'patch', operations);
              return;
            } catch (err: any) {
              if (err.response?.status === 429) {
                const retryAfterHeader = Number(err.response.headers['retry-after']) * 1000;
                const baseDelay = retryAfterHeader || 5000;
                const backoff = Math.min(baseDelay * Math.pow(2, attempts), 60000); // cap at 60s
                this.logger.warn(
                  `Rate limit hit for ${unitGroupId}. Retrying after ${Math.round(backoff)}ms (attempt ${
                    attempts + 1
                  })`
                );
                await new Promise((r) => setTimeout(r, backoff));
                attempts++;
              } else {
                this.logger.error(
                  `Error patching ${unitGroupId}: ${err.message}`,
                  JSON.stringify(operations)
                );
                break;
              }
            }
          }
        })
      );

      // 🕒 Throttle batches globally
      if (i + batchSize < input.length) {
        this.logger.debug(`Throttling between batches. Waiting ${delayBetweenBatches}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }
    this.logger.debug(`Processed all ${input.length} items`);
  }

  async getApaleoMaintenance(
    accessToken: string,
    maintenanceId: string
  ): Promise<ApaleoMaintenanceDto | null> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('expand', 'unit');
      const url = APALEO_APIS.MAINTENANCE.GET_MAINTENANCE_URL.replace(
        '{{APALEO_API}}',
        this.apaleoApi
      ).replace('{maintenanceId}', maintenanceId);
      return await this.makeRequest<ApaleoMaintenanceDto>(url, accessToken, queryParams);
    } catch (error) {
      return null;
    }
  }

  async getApaleoMaintenances(
    accessToken: string,
    queryParams: URLSearchParams
  ): Promise<ApaleoMaintenanceDto[] | null> {
    try {
      const url = APALEO_APIS.MAINTENANCE.GET_MAINTENANCES_URL.replace(
        '{{APALEO_API}}',
        this.apaleoApi
      );
      const response = await this.makeRequest<{
        maintenances: ApaleoMaintenanceDto[];
        count: number;
      }>(url, accessToken, queryParams);
      return response?.maintenances || [];
    } catch (error) {
      return null;
    }
  }

  async updateApaleoMaintenances(accessToken: string, input: ApaleoUpdateMaintenanceDto[]) {
    try {
      const url = APALEO_APIS.MAINTENANCE.BULK_MAINTENANCES_URL.replace(
        '{{APALEO_API}}',
        this.apaleoApi
      );
      return await this.makeMutationRequest<{ ids?: string[]; messages?: string[] }>(
        url,
        accessToken,
        'post',
        {
          maintenances: input
        }
      );
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to update maintenance room unit for pms'
      );
    }
  }

  async deleteApaleoMaintenance(accessToken: string, maintenanceId: string) {
    try {
      const url = APALEO_APIS.MAINTENANCE.DELETE_MAINTENANCE_URL.replace(
        '{{APALEO_API}}',
        this.apaleoApi
      ).replace('{maintenanceId}', maintenanceId);
      this.logger.debug(`Deleting maintenance ${maintenanceId} from Apaleo`);
      return await this.makeMutationRequest<{ message: string }>(url, accessToken, 'delete');
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to delete maintenance room unit for pms'
      );
    }
  }

  async getApaleoFolio(accessToken: string, folioId: string): Promise<ApaleoFolioDto | null> {
    try {
      const queryParams = new URLSearchParams();
      const url = APALEO_APIS.FOLIO.GET_FOLIO_URL.replace('{{APALEO_API}}', this.apaleoApi).replace(
        '{folioId}',
        folioId
      );
      return await this.makeRequest<ApaleoFolioDto>(url, accessToken, queryParams);
    } catch (error) {
      return null;
    }
  }

  async syncReservationPrimaryGuest(
    accessToken: string,
    reservationId: string,
    input: ApaleoReservationGuestDto
  ) {
    const baseUrl = APALEO_APIS.RESERVATION.PATCH_RESERVATION_PRIMARY_GUEST_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{reservationId}', reservationId);
    if (!accessToken) {
      this.logger.error('Access token is required');
      return null;
    }

    if (!input) {
      this.logger.error('Input is required');
      return null;
    }

    const body: { op: string; path: string; value: string }[] = [];
    for (let key of Object.keys(input)) {
      body.push({
        op: 'replace',
        path: `/primaryGuest/${key}`,
        value: input[key] || ''
      });
    }
    return await this.makeMutationRequest(baseUrl, accessToken, 'patch', body);
  }

  async syncBooker(accessToken: string, bookingId: string, input: ApaleoReservationGuestDto) {
    const baseUrl = APALEO_APIS.BOOKING.PATCH_BOOKER_URL.replace(
      '{{APALEO_API}}',
      this.apaleoApi
    ).replace('{bookingId}', bookingId);
    if (!accessToken) {
      this.logger.error('Access token is required');
      return null;
    }

    if (!input) {
      this.logger.error('Input is required');
      return null;
    }

    const body: { op: string; path: string; value: string }[] = [];
    for (let key of Object.keys(input)) {
      body.push({
        op: 'replace',
        path: `/booker/${key}`,
        value: input[key] || ''
      });
    }
    return await this.makeMutationRequest(baseUrl, accessToken, 'patch', body);
  }
}
