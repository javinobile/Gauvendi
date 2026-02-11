import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConnectorTypeEnum } from '@src/core/enums/common';
import { AxiosResponse } from 'axios';
import { addDays, format, startOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { lastValueFrom } from 'rxjs';
import { DATE_FORMAT } from 'src/core/constants/date.constant';
import {
  HotelRestrictionCodeEnum,
  HotelRestrictionSetting
} from 'src/core/entities/hotel-restriction-setting.entity';
import {
  Restriction,
  RestrictionConditionType,
  Weekday
} from 'src/core/entities/restriction.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import { Helper } from '../../../core/helper/utils';
import {
  RatePlanMappingDto,
  RatePlanPricingMappingDto,
  RestrictionMappingDto,
  RoomProductAvailabilityMappingDto
} from '../pms.dto';
import { MewsApiConstants } from './mews-api.consant';
import {
  BaseMewsBodyDto,
  MewsConfigurationResponseDto,
  MewsDeleteRestrictionDto,
  MewsRatePlanPricingResponseDto,
  MewsRatePlanResponseDto,
  MewsResourcesBodyDto,
  MewsRestrictionDto,
  MewsRestrictionResponseDto,
  MewsRoomProductAssignmentDto,
  MewsRoomProductAssignmentResponseDto,
  MewsRoomProductAvailabilityResponseDto,
  MewsRoomProductDto,
  MewsRoomProductResponseDto,
  MewsRoomUnitDto,
  MewsRoomUnitMaintenanceDto,
  MewsRoomUnitMaintenanceResponseDto,
  MewsRoomUnitResponseDto,
  MewsServiceDto,
  MewsServicesResponseDto
} from './mews.dto';

@Injectable()
export class MewsService {
  logger = new Logger(MewsService.name);

  private readonly clientId = process.env.MEWS_CLIENT;
  private readonly clientToken = process.env.MEWS_CLIENT_TOKEN;
  mewsApi = process.env.MEWS_API || 'https://api.mews-demo.com';

  private readonly defaultLimitCount = 1000;

  private readonly ActivityStates = ['Active'];

  constructor(private readonly httpService: HttpService) {}

  async testAccess(accessToken: string) {
    this.logger.log(`Testing access to Mews`);

    // step 1:
    const response = await lastValueFrom(
      this.httpService.post(
        MewsApiConstants.TEST_ACCESS_URL.replace('{{MEWS_API}}', this.mewsApi),
        {
          Client: this.clientId,
          ClientToken: this.clientToken,
          AccessToken: accessToken
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    );

    if (response.status === 200) {
      this.logger.log(`Access to Mews is successful`);
      return true;
    } else {
      this.logger.error(`Error testing access to Mews: ${response.statusText}`);
      return false;
    }
  }

  async getRoomProductList(body: BaseMewsBodyDto): Promise<MewsRoomProductDto[]> {
    const { ServiceIds, ActivityStates, AccessToken } = body;

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      return [];
    }

    if (!ServiceIds) {
      this.logger.error(`Service ID is required`);
      return [];
    }

    const clientId = this.clientId;
    const clientToken = this.clientToken;
    if (!clientId || !clientToken) {
      this.logger.error(`Mews client credentials are not configured`);
      return [];
    }

    const states = ActivityStates && ActivityStates.length ? ActivityStates : this.ActivityStates;
    const count = this.defaultLimitCount;

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      ServiceIds: ServiceIds,
      ActivityStates: [...states],
      Limitation: {
        Count: count
      }
    };

    this.logger.log(`Start call GET_PRODUCT_URL with ${JSON.stringify(initialRequest)}`);

    const all: MewsRoomProductDto[] = await Helper.paginateByCursor<
      BaseMewsBodyDto,
      MewsRoomProductDto,
      MewsRoomProductResponseDto
    >({
      initialRequest,
      callApi: async (requestBody) => {
        const response: AxiosResponse<MewsRoomProductResponseDto> = await lastValueFrom(
          this.httpService.post(
            MewsApiConstants.GET_PRODUCT_URL.replace('{{MEWS_API}}', this.mewsApi),
            requestBody,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );

        if (response.status !== 200) {
          this.logger.error(`Error getting room product availability: ${response.statusText}`);
          // Return an empty, terminal response to stop pagination gracefully
          return { ResourceCategories: [], Cursor: undefined } as MewsRoomProductResponseDto;
        }
        return response.data;
      },
      extract: (data) => ({ items: data.ResourceCategories ?? [], cursor: data.Cursor }),
      applyCursor: (req, cursor) => {
        this.logger.log(`This api has cursor: ${cursor}`);
        return {
          ...req,
          Limitation: {
            ...req.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };
      },
      maxIterations: 1000
    });

    return (all || []).filter((i) => i.IsActive);
  }

  parseMewsAvailability(
    data: MewsRoomProductAvailabilityResponseDto,
    timezone: string
  ): RoomProductAvailabilityMappingDto[] {
    if (
      !data ||
      !Array.isArray(data.TimeUnitStartsUtc) ||
      !Array.isArray(data.CategoryAvailabilities)
    ) {
      throw new Error('Invalid input structure');
    }

    const timeUnits = data.TimeUnitStartsUtc;
    const result: RoomProductAvailabilityMappingDto[] = [];

    for (const category of data.CategoryAvailabilities) {
      const { CategoryId, Availabilities = [], Adjustments = [] } = category;

      if (
        typeof CategoryId !== 'string' ||
        !Array.isArray(Availabilities) ||
        !Array.isArray(Adjustments)
      ) {
        console.warn(`Skipping malformed CategoryId: ${CategoryId}`);
        continue;
      }

      for (let i = 0; i < timeUnits.length; i++) {
        const dateUtc = timeUnits[i];

        const available = Availabilities[i] ?? 0;
        const adjustment = Adjustments[i] ?? 0;

        if (!dateUtc) {
          console.warn(`Skipping empty date at index ${i}`);
          continue;
        }

        // Convert UTC date to hotel local timezone, then format as YYYY-MM-DD
        const utcDate = new Date(dateUtc);
        const localDate = toZonedTime(utcDate, timezone);
        const date = format(localDate, 'yyyy-MM-dd');

        result.push({
          roomProductMappingPmsCode: CategoryId,
          date,
          available: available,
          adjustment
        });
      }
    }

    return result;
  }

  async getRoomProductAvailability(
    body: BaseMewsBodyDto
  ): Promise<MewsRoomProductAvailabilityResponseDto> {
    const { ServiceId, AccessToken, StartDate, EndDate, timezone } = body;

    if (!timezone) {
      this.logger.error(`Timezone is required`);
      return {
        CategoryAvailabilities: [],
        TimeUnitStartsUtc: []
      };
    }

    if (!StartDate || !EndDate) {
      this.logger.error(`Start date and end date are required`);
      return {
        CategoryAvailabilities: [],
        TimeUnitStartsUtc: []
      };
    }

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      return {
        CategoryAvailabilities: [],
        TimeUnitStartsUtc: []
      };
    }

    if (!ServiceId) {
      this.logger.error(`Service ID is required`);
      return {
        CategoryAvailabilities: [],
        TimeUnitStartsUtc: []
      };
    }

    const clientId = this.clientId;
    const clientToken = this.clientToken;
    if (!clientId || !clientToken) {
      this.logger.error(`Mews client credentials are not configured`);
      return {
        CategoryAvailabilities: [],
        TimeUnitStartsUtc: []
      };
    }

    const { startUtc, endUtc } = this.convertToUtcTimeUnits(timezone, StartDate, EndDate);

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      ServiceId,
      LastTimeUnitStartUtc: endUtc,
      FirstTimeUnitStartUtc: startUtc
    };

    this.logger.log(`Start call GET_PRODUCT_URL with ${JSON.stringify(initialRequest)}`);

    const response: AxiosResponse<MewsRoomProductAvailabilityResponseDto> = await lastValueFrom(
      this.httpService.post(
        MewsApiConstants.GET_AVAILABILITY_URL.replace('{{MEWS_API}}', this.mewsApi),
        initialRequest,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    if (response.status !== 200) {
      this.logger.error(`Error getting room product availability: ${response.statusText}`);
      // Return an empty, terminal response to stop pagination gracefully
      return {
        CategoryAvailabilities: [],
        TimeUnitStartsUtc: []
      };
    }
    return response.data;
  }

  async getRoomUnitList(body: MewsResourcesBodyDto): Promise<MewsRoomUnitDto[]> {
    const { AccessToken, EnterpriseIds, ResourceIds } = body;

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      return [];
    }

    const clientId = this.clientId;
    const clientToken = this.clientToken;
    if (!clientId || !clientToken) {
      this.logger.error(`Mews client credentials are not configured`);
      return [];
    }

    const initialRequest: MewsResourcesBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      EnterpriseIds: EnterpriseIds,
      ResourceIds: ResourceIds || undefined,
      Limitation: {
        Count: this.defaultLimitCount
      }
    };

    this.logger.log(`Start call GET_ROOM_UNIT_URL with ${JSON.stringify(initialRequest)}`);

    const all: MewsRoomUnitDto[] = await Helper.paginateByCursor<
      BaseMewsBodyDto,
      MewsRoomUnitDto,
      MewsRoomUnitResponseDto
    >({
      initialRequest,
      callApi: async (requestBody) => {
        const response: AxiosResponse<MewsRoomUnitResponseDto> = await lastValueFrom(
          this.httpService.post(
            MewsApiConstants.GET_ROOM_UNIT_URL.replace('{{MEWS_API}}', this.mewsApi),
            requestBody,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );

        if (response.status !== 200) {
          this.logger.error(`Error getting room unit list: ${response.statusText}`);
          // Return an empty, terminal response to stop pagination gracefully
          return { Resources: [], Cursor: undefined } as MewsRoomUnitResponseDto;
        }
        return response.data;
      },
      extract: (data) => ({ items: data.Resources ?? [], cursor: data.Cursor }),
      applyCursor: (req, cursor) => {
        this.logger.log(`This api has cursor: ${cursor}`);
        return {
          ...req,
          Limitation: {
            ...req.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };
      },
      maxIterations: 1000
    });

    return (all || []).filter((i) => i.IsActive);
  }

  async getRoomUnitMaintenanceList(body: BaseMewsBodyDto): Promise<MewsRoomUnitMaintenanceDto[]> {
    const { AccessToken, EnterpriseId, Extent, StartDate, EndDate, timezone } = body;

    if (!timezone) {
      this.logger.error(`Timezone is required`);
      return [];
    }

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      return [];
    }

    if (!EnterpriseId) {
      this.logger.error(`Enterprise ID is required`);
      return [];
    }

    if (!Extent) {
      this.logger.error(`Extent is required`);
      return [];
    }

    if (!StartDate || !EndDate) {
      this.logger.error(`Start date and end date are required`);
      return [];
    }

    const { startUtc, endUtc } = this.convertToUtcTimeUnits(timezone, StartDate, EndDate);

    const initialRequest: BaseMewsBodyDto = {
      Client: this.clientId,
      ClientToken: this.clientToken,
      AccessToken: AccessToken,
      EnterpriseId,
      Extent,
      CollidingUtc: {
        StartUtc: startUtc,
        EndUtc: endUtc
      }
    };

    this.logger.log(
      `Start call GET_ROOM_UNIT_MAINTENANCE_URL with ${JSON.stringify(initialRequest)}`
    );

    const all: MewsRoomUnitMaintenanceDto[] = await Helper.paginateByCursor<
      BaseMewsBodyDto,
      MewsRoomUnitMaintenanceDto,
      MewsRoomUnitMaintenanceResponseDto
    >({
      initialRequest,
      callApi: async (requestBody) => {
        const response: AxiosResponse<MewsRoomUnitMaintenanceResponseDto> = await lastValueFrom(
          this.httpService.post(
            MewsApiConstants.GET_ROOM_UNIT_MAINTENANCE_URL.replace('{{MEWS_API}}', this.mewsApi),
            requestBody,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );

        if (response.status !== 200) {
          this.logger.error(`Error getting room unit maintenance: ${response.statusText}`);
          // Return an empty, terminal response to stop pagination gracefully
          return { ResourceBlocks: [], Cursor: undefined } as MewsRoomUnitMaintenanceResponseDto;
        }
        return response.data;
      },
      extract: (data) => ({ items: data.ResourceBlocks ?? [], cursor: data.Cursor }),
      applyCursor: (req, cursor) => {
        this.logger.log(`This api has cursor: ${cursor}`);
        return {
          ...req,
          Limitation: {
            ...req.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };
      },
      maxIterations: 1000
    });

    return (all || []).filter((i) => i.IsActive);
  }

  async getRestrictionList(body: BaseMewsBodyDto): Promise<RestrictionMappingDto[]> {
    const {
      AccessToken,
      ServiceIds,
      Extent,
      ResourceCategoryIds,
      StartDate,
      EndDate,
      timezone,
      field
    } = body;

    if (!timezone) {
      this.logger.error(`Timezone is required`);
      return [];
    }

    if (!StartDate || !EndDate) {
      this.logger.error(`Start date and end date are required`);
      return [];
    }

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      return [];
    }

    if (!ServiceIds) {
      this.logger.error(`Service ID is required`);
      return [];
    }

    if (!Extent) {
      this.logger.error(`Extent is required`);
      return [];
    }

    const { startUtc, endUtc } = this.convertToUtcTimeUnits(timezone, StartDate, EndDate);

    const initialRequest: BaseMewsBodyDto = {
      Client: this.clientId,
      ClientToken: this.clientToken,
      AccessToken: AccessToken,
      ServiceIds,
      ResourceCategoryIds,
      Origin: 'Integration', // for third party integration
      Extent,
      ...(field
        ? {
            [field]: {
              StartUtc: startUtc,
              EndUtc: endUtc
            }
          }
        : {}),
      Limitation: {
        Count: 1000
      }
    };

    this.logger.log(`Start call GET_RESTRICTIONS_URL with ${JSON.stringify(initialRequest)}`);

    const all: MewsRestrictionDto[] = await Helper.paginateByCursor<
      BaseMewsBodyDto,
      MewsRestrictionDto,
      MewsRestrictionResponseDto
    >({
      initialRequest,
      callApi: async (requestBody) => {
        const response: AxiosResponse<MewsRestrictionResponseDto> = await lastValueFrom(
          this.httpService.post(
            MewsApiConstants.GET_RESTRICTIONS_URL.replace('{{MEWS_API}}', this.mewsApi),
            requestBody,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );

        if (response.status !== 200) {
          this.logger.error(`Error getting room unit maintenance: ${response.statusText}`);
          // Return an empty, terminal response to stop pagination gracefully
          return { Restrictions: [], Cursor: undefined } as MewsRestrictionResponseDto;
        }
        return response.data;
      },
      extract: (data) => ({ items: data.Restrictions ?? [], cursor: data.Cursor }),
      applyCursor: (req, cursor) => {
        this.logger.log(`This api has cursor: ${cursor}`);
        return {
          ...req,
          Limitation: {
            ...req.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };
      },
      maxIterations: 1000
    });

    // parse restriction
    if (all.length > 0) {
      return this.parseMewsRestriction(all, timezone);
    }
    return [];
  }

  parseMewsRestriction(data: MewsRestrictionDto[], timezone: string): RestrictionMappingDto[] {
    const results: RestrictionMappingDto[] = [];

    for (const restriction of data) {
      const mappedRestriction = this.mapSingleMewsRestriction(restriction, timezone);
      results.push(mappedRestriction);
    }

    return results;
  }

  private mapSingleMewsRestriction(
    restriction: MewsRestrictionDto,
    timezone: string
  ): RestrictionMappingDto {
    const { Conditions, ServiceId, Exceptions } = restriction;
    let type: RestrictionConditionType;
    switch (Conditions.Type) {
      case 'Stay':
        type = RestrictionConditionType.ClosedToStay;
        break;
      case 'Start':
        type = RestrictionConditionType.ClosedToArrival;
        break;
      case 'End':
        type = RestrictionConditionType.ClosedToDeparture;
        break;
    }

    // Convert UTC dates to hotel local timezone, then format as YYYY-MM-DD
    let fromDate: string | undefined;
    let toDate: string | undefined;

    if (Conditions.StartUtc) {
      const utcStartDate = new Date(Conditions.StartUtc);
      const localStartDate = toZonedTime(utcStartDate, timezone);
      fromDate = format(startOfDay(localStartDate), 'yyyy-MM-dd');
    }

    if (Conditions.EndUtc) {
      const utcEndDate = new Date(Conditions.EndUtc);
      const localEndDate = toZonedTime(utcEndDate, timezone);
      toDate = format(startOfDay(localEndDate), 'yyyy-MM-dd');
    }

    return {
      roomProductMappingPmsCode: Conditions.ResourceCategoryId,
      ratePlanMappingPmsCode: Conditions.ExactRateId,
      fromDate,
      toDate,
      type,
      weekdays: Conditions.Days as Weekday[],
      minLength:
        type !== RestrictionConditionType.ClosedToStay
          ? this.parseIsoDurationToDays(Exceptions.MinLength)
          : undefined,
      maxLength: Exceptions.MaxLength
        ? this.parseIsoDurationToDays(Exceptions.MaxLength)
        : undefined,
      minAdv: Exceptions.MinAdvance
        ? this.parseIsoDurationToDays(Exceptions.MinAdvance)
        : undefined,
      maxAdv: Exceptions.MaxAdvance
        ? this.parseIsoDurationToDays(Exceptions.MaxAdvance)
        : undefined,
      minLosThrough:
        type === RestrictionConditionType.ClosedToStay
          ? this.parseIsoDurationToDays(Exceptions.MinLength)
          : this.parseIsoDurationToDays(Exceptions.MinAdvance),
      connectorType: ConnectorTypeEnum.MEWS
    };
  }

  private generateDatesForSpecificDays(
    startDate: Date,
    endDate: Date,
    allowedDays: string[]
  ): string[] {
    const dates: string[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Convert allowed days to day indices (0 = Sunday, 1 = Monday, etc.)
    const allowedDayIndices = allowedDays
      .map((day) => {
        const index = dayNames.findIndex((d) => d.toLowerCase() === day.toLowerCase());
        return index !== -1 ? index : null;
      })
      .filter((index) => index !== null);

    if (allowedDayIndices.length === 0) {
      // If no valid days specified, fall back to all dates in range
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = addDays(startDate, i);
        dates.push(currentDate.toISOString().split('T')[0]);
      }
      return dates;
    }

    // Generate dates that fall on allowed days
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = addDays(startDate, i);
      const dayOfWeek = currentDate.getDay();

      if (allowedDayIndices.includes(dayOfWeek)) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }
    }

    return dates;
  }

  private parseIsoDurationToDays(duration: string | null): number | null {
    if (!duration) return null;

    try {
      // Handle ISO 8601 duration format: P[n]Y[n]M[n]DT[n]H[n]M[n]S
      // Examples: "P0M3DT0H0M0S", "P1DT12H30M", "PT24H"

      // Extract days
      const dayMatch = duration.match(/P(?:\d+Y)?(?:\d+M)?(\d+)D/i);
      let days = dayMatch ? parseInt(dayMatch[1], 10) : 0;

      // Extract hours and convert to days (24 hours = 1 day)
      const hourMatch = duration.match(/T(?:\d+H)?(\d+)H/i) || duration.match(/PT(\d+)H/i);
      if (hourMatch) {
        const hours = parseInt(hourMatch[1], 10);
        days += Math.ceil(hours / 24); // Round up partial days
      }

      // Extract minutes and convert to days (1440 minutes = 1 day)
      const minuteMatch = duration.match(/(\d+)M(?:\d+S)?$/i);
      if (minuteMatch && !hourMatch) {
        // Only if no hours specified to avoid double counting
        const minutes = parseInt(minuteMatch[1], 10);
        days += Math.ceil(minutes / 1440); // Round up partial days
      }

      return days;
    } catch (error) {
      this.logger.warn(`Failed to parse ISO duration: ${duration}`, error);
      return null;
    }
  }

  async pushRestriction(
    payload: any
  ): Promise<{ success: boolean; data?: any; error?: string; resourceCategoryId?: string }> {
    const { AccessToken, ServiceId, Data } = payload;

    if (!AccessToken || !ServiceId || !Data) {
      const errorMsg = 'AccessToken, ServiceId, and Data are required for pushing restrictions';
      this.logger.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Extract ResourceCategoryId for logging purposes
    const resourceCategoryId = Data.length > 0 ? Data[0].ResourceCategoryId : 'unknown';

    const requestBody: BaseMewsBodyDto = {
      Client: this.clientId,
      ClientToken: this.clientToken,
      AccessToken: AccessToken,
      ServiceId,
      Data
    };

    try {
      const response = await this.httpService.axiosRef.post(
        MewsApiConstants.SET_RESTRICTIONS_URL.replace('{{MEWS_API}}', this.mewsApi),
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // this.logger.log(
      //   `✅ Successfully pushed ${Data.length} restrictions for ResourceCategoryId: ${resourceCategoryId}. Response status: ${response.status}`,
      // );
      return {
        success: true,
        data: response.data,
        resourceCategoryId
      };
    } catch (error) {
      const errorMsg = `Failed to push restrictions for ResourceCategoryId: ${resourceCategoryId} - ${error.response?.data?.Message || error.message}`;
      this.logger.warn(`⚠️ ${errorMsg}`, error.response?.data || error.message);
      return {
        success: false,
        error: errorMsg,
        resourceCategoryId
      };
    }
  }

  /**
   * Push restrictions in parallel with individual error handling per ResourceCategoryId
   * Logs warnings for failed ResourceCategoryIds instead of throwing errors
   */
  async pushRestrictionsParallel(
    restrictions: any[],
    accessToken: string,
    serviceId: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    if (restrictions.length === 0) {
      this.logger.warn('No restrictions to push to Mews');
      return { successCount: 0, failureCount: 0, results: [] };
    }

    this.logger.log(`🚀 Starting parallel push of ${restrictions.length} restrictions to Mews`);

    // Group restrictions by ResourceCategoryId for better error tracking
    const groupedByResourceCategory = new Map<string, any[]>();

    for (const restriction of restrictions) {
      const resourceCategoryId = restriction.ResourceCategoryId || 'null';
      if (!groupedByResourceCategory.has(resourceCategoryId)) {
        groupedByResourceCategory.set(resourceCategoryId, []);
      }
      groupedByResourceCategory.get(resourceCategoryId)!.push(restriction);
    }

    // Create payloads for each ResourceCategoryId group
    const payloads = Array.from(groupedByResourceCategory.entries()).map(
      ([resourceCategoryId, restrictionGroup]) => ({
        AccessToken: accessToken,
        ServiceId: serviceId,
        Data: restrictionGroup,
        resourceCategoryId
      })
    );

    this.logger.log(
      `📦 Grouped ${restrictions.length} restrictions into ${payloads.length} ResourceCategoryId groups for parallel processing`
    );

    // Execute all pushes in parallel
    const results = await Promise.allSettled(
      payloads.map(async (payload) => {
        const result = await this.pushRestriction(payload);
        return {
          ...result,
          restrictionCount: payload.Data.length
        };
      })
    );

    // Process results and log detailed information
    let successCount = 0;
    let failureCount = 0;
    const processedResults: Array<{
      success: boolean;
      resourceCategoryId?: string;
      restrictionCount?: number;
      data?: any;
      error?: string;
    }> = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { success, resourceCategoryId, restrictionCount, data, error } = result.value;

        if (success) {
          successCount += restrictionCount;
          // this.logger.log(`✅ Successfully pushed ${restrictionCount} restrictions for ResourceCategoryId: ${resourceCategoryId}`);
          processedResults.push({ success: true, resourceCategoryId, restrictionCount, data });
        } else {
          failureCount += restrictionCount;
          // this.logger.warn(`⚠️ Failed to push ${restrictionCount} restrictions for ResourceCategoryId: ${resourceCategoryId}. Error: ${error}`);
          processedResults.push({ success: false, resourceCategoryId, restrictionCount, error });
        }
      } else {
        failureCount++;
        // this.logger.warn(`⚠️ Promise rejected for restriction group. Error: ${result.reason}`);
        processedResults.push({ success: false, error: result.reason });
      }
    }

    // Summary logging
    this.logger.debug(
      `📊 Parallel push summary: ${successCount} successful, ${failureCount} failed out of ${restrictions.length} total restrictions`
    );

    // if (failureCount > 0) {
    //   this.logger.warn(`⚠️ ${failureCount} restrictions failed to push across ${processedResults.filter(r => !r.success).length} ResourceCategoryId groups. Individual warnings logged above.`);
    // }

    return { successCount, failureCount, results: processedResults };
  }

  /**
   * Direct method to push restriction data array to Mews
   * Handles the exact format you provided in your example
   */
  async pushRestrictionDataDirect(
    restrictionData: any[],
    accessToken: string,
    serviceId: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    this.logger.log(
      `🔄 Direct push of ${restrictionData.length} pre-formatted restrictions to Mews`
    );

    // Log the restriction data being pushed
    restrictionData.forEach((restriction, index) => {
      this.logger.log(
        `📋 Restriction ${index + 1}: Type=${restriction.Type}, ResourceCategoryId=${restriction.ResourceCategoryId}, DateRange=${restriction.StartUtc} to ${restriction.EndUtc}`
      );
    });

    return await this.pushRestrictionsParallel(restrictionData, accessToken, serviceId);
  }

  /**
   * Push restrictions to Mews with 4-level restriction handling
   * Follows rules in mews-restriction.md with Property, Room Product, Sales Plan, and Room Product + Sales Plan levels
   */
  async pushRestrictionsToMews(
    restrictions: Restriction[],
    hotelRestrictionSettings: HotelRestrictionSetting[],
    roomProductMappingPms: RoomProductMappingPms[],
    accessToken: string,
    serviceId: string,
    timezone: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    try {
      this.logger.log(`🚀 Starting restriction push for ${restrictions.length} restrictions`);

      // Extract restriction type flags from hotel settings
      const restrictionFlags = this.extractRestrictionFlags(hotelRestrictionSettings);

      if (restrictions.length === 0) {
        this.logger.warn(`No restrictions provided for push`);
        return { successCount: 0, failureCount: 0, results: [] };
      }

      // Filter restrictions based on enabled types
      const filteredRestrictions = this.filterRestrictionsBySettings(
        restrictions,
        restrictionFlags
      );

      if (filteredRestrictions.length === 0) {
        this.logger.warn(`No restrictions match enabled settings`);
        return { successCount: 0, failureCount: 0, results: [] };
      }

      this.logger.log(`📋 Processing ${filteredRestrictions.length} restrictions across 4 levels`);

      // Process each restriction level
      const results = await Promise.all([
        this.processPropertyLevelRestrictions(
          filteredRestrictions,
          accessToken,
          serviceId,
          timezone
        ),
        this.processRoomProductLevelRestrictions(
          filteredRestrictions,
          roomProductMappingPms,
          accessToken,
          serviceId,
          timezone
        )
        // this.processSalesPlanLevelRestrictions(filteredRestrictions, accessToken, serviceId, timezone),
        // this.processRoomProductSalesPlanLevelRestrictions(
        //   filteredRestrictions,
        //   roomProductMappingPms, // TODO: wait rate_plan table
        //   accessToken,
        //   serviceId,
        //   timezone,
        // ),
      ]);

      // Aggregate results
      const aggregatedResult = results.reduce(
        (acc, result) => ({
          successCount: acc.successCount + result.successCount,
          failureCount: acc.failureCount + result.failureCount,
          results: [...acc.results, ...result.results]
        }),
        { successCount: 0, failureCount: 0, results: [] }
      );

      this.logger.log(
        `✅ Push operation completed for service ${serviceId}: ${aggregatedResult.successCount} successful, ${aggregatedResult.failureCount} failed`
      );

      return aggregatedResult;
    } catch (error) {
      this.logger.error('Critical error in pushRestrictionsToMews:', error);
      return {
        successCount: 0,
        failureCount: 0,
        results: [{ success: false, error: error.message }]
      };
    }
  }

  /**
   * Extract restriction type flags from hotel settings
   */
  private extractRestrictionFlags(hotelRestrictionSettings: HotelRestrictionSetting[]) {
    return {
      isPushMinLos: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_LOS_MIN
      ),
      isPushMaxLos: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_LOS_MAX
      ),
      isPushMinLosThrough: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_MIN_LOS_THROUGH
      ),
      isPushClosedToArrival: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_ARRIVAL
      ),
      isPushClosedToDeparture: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_DEPARTURE
      ),
      isPushClosedToStay: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY
      ),
      isPushMaxAdv: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_MAX_ADVANCE_BOOKING
      ),
      isPushMinAdv: hotelRestrictionSettings.some(
        (s) => s.restrictionCode === HotelRestrictionCodeEnum.RSTR_MIN_ADVANCE_BOOKING
      )
    };
  }

  /**
   * Get all restrictions for the hotel and date range
   * Note: This should be called from a service that has access to the Restriction repository
   * The restrictions should be passed as parameter to pushRestrictionsToMews instead
   */
  private async getRestrictionsForPush(
    hotelId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Restriction[]> {
    // This method should be removed and restrictions should be passed as parameter
    // to avoid circular dependencies between PMS module and Restriction module
    this.logger.warn(
      'getRestrictionsForPush should be removed - pass restrictions as parameter instead'
    );
    return Promise.resolve([]);
  }

  /**
   * Filter restrictions based on enabled settings
   */
  private filterRestrictionsBySettings(
    restrictions: Restriction[],
    flags: {
      isPushMinLos: boolean;
      isPushMaxLos: boolean;
      isPushMinLosThrough: boolean;
      isPushClosedToArrival: boolean;
      isPushClosedToDeparture: boolean;
      isPushClosedToStay: boolean;
      isPushMaxAdv: boolean;
      isPushMinAdv: boolean;
    }
  ): Restriction[] {
    return restrictions.filter((restriction) => {
      // Filter based on restriction type and enabled flags
      if (restriction.minLength && flags.isPushMinLos) return true;
      if (restriction.maxLength && flags.isPushMaxLos) return true;
      if (restriction.minLosThrough && flags.isPushMinLosThrough) return true;
      if (
        restriction.type === RestrictionConditionType.ClosedToArrival &&
        flags.isPushClosedToArrival
      )
        return true;
      if (
        restriction.type === RestrictionConditionType.ClosedToDeparture &&
        flags.isPushClosedToDeparture
      )
        return true;
      if (restriction.type === RestrictionConditionType.ClosedToStay && flags.isPushClosedToStay)
        return true;
      if (restriction.maxAdv && flags.isPushMaxAdv) return true;
      if (restriction.minAdv && flags.isPushMinAdv) return true;
      return false;
    });
  }

  /**
   * Process Property-level restrictions (roomProductIds = null, ratePlanIds = null)
   */
  private async processPropertyLevelRestrictions(
    restrictions: Restriction[],
    accessToken: string,
    serviceId: string,
    timezone: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    const propertyRestrictions = restrictions.filter((r) => !r.roomProductIds && !r.ratePlanIds);

    if (propertyRestrictions.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    this.logger.log(`🏨 Processing ${propertyRestrictions.length} property-level restrictions`);

    const restrictionData = this.buildPropertyLevelRestrictions(propertyRestrictions, timezone);
    return await this.pushRestrictionsParallel(restrictionData, accessToken, serviceId);
  }

  /**
   * Process Room Product-level restrictions (roomProductIds != null, ratePlanIds = null)
   */
  private async processRoomProductLevelRestrictions(
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[],
    accessToken: string,
    serviceId: string,
    timezone: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    const roomProductRestrictions = restrictions.filter(
      (r) => r.roomProductIds && r.roomProductIds.length > 0 && !r.ratePlanIds
    );

    if (roomProductRestrictions.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    this.logger.log(
      `🏠 Processing ${roomProductRestrictions.length} room product-level restrictions`
    );

    const restrictionData = this.buildRoomProductLevelRestrictions(
      roomProductRestrictions,
      roomProductMappingPms,
      timezone
    );
    return await this.pushRestrictionsParallel(restrictionData, accessToken, serviceId);
  }

  /**
   * Process Sales Plan-level restrictions (roomProductIds = null, ratePlanIds != null)
   */
  private async processSalesPlanLevelRestrictions(
    restrictions: Restriction[],
    accessToken: string,
    serviceId: string,
    timezone: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    const salesPlanRestrictions = restrictions.filter(
      (r) => !r.roomProductIds && r.ratePlanIds && r.ratePlanIds.length > 0
    );

    if (salesPlanRestrictions.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    this.logger.log(`💰 Processing ${salesPlanRestrictions.length} sales plan-level restrictions`);

    const restrictionData = this.buildSalesPlanLevelRestrictions(salesPlanRestrictions, timezone);
    return await this.pushRestrictionsParallel(restrictionData, accessToken, serviceId);
  }

  /**
   * Process Room Product + Sales Plan-level restrictions (roomProductIds != null, ratePlanIds != null)
   */
  private async processRoomProductSalesPlanLevelRestrictions(
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[],
    accessToken: string,
    serviceId: string,
    timezone: string
  ): Promise<{ successCount: number; failureCount: number; results: any[] }> {
    const combinedRestrictions = restrictions.filter(
      (r) =>
        r.roomProductIds && r.roomProductIds.length > 0 && r.ratePlanIds && r.ratePlanIds.length > 0
    );

    if (combinedRestrictions.length === 0) {
      return { successCount: 0, failureCount: 0, results: [] };
    }

    this.logger.log(
      `🏠💰 Processing ${combinedRestrictions.length} room product + sales plan-level restrictions`
    );

    const restrictionData = this.buildRoomProductSalesPlanLevelRestrictions(
      combinedRestrictions,
      roomProductMappingPms,
      timezone
    );
    return await this.pushRestrictionsParallel(restrictionData, accessToken, serviceId);
  }

  /**
   * Group restrictions by consecutive dates with the same value
   * This ensures each date range with different values gets separate restriction objects
   */
  // Legacy method - no longer needed with new Restriction entity approach
  // Kept for reference but should be removed in future cleanup

  // Legacy methods - no longer needed with new Restriction entity approach
  // Kept for reference but should be removed in future cleanup

  /**
   * Map Restriction entity to Mews type and exceptions
   * Uses the new Restriction entity structure instead of old RestrictionCode enum
   */
  private mapRestrictionToMewsType(restriction: Restriction): {
    type: 'Stay' | 'Start' | 'End';
    exceptions: any;
  } | null {
    const exceptions: any = {};

    // Handle LOS restrictions (minLength, maxLength, minLosThrough)
    if (restriction.minLength) {
      exceptions.MinLength = this.convertDaysToIsoDuration(restriction.minLength);
    }
    if (restriction.maxLength) {
      exceptions.MaxLength = this.convertDaysToIsoDuration(restriction.maxLength);
    }
    if (restriction.minLosThrough) {
      exceptions.MinLength = this.convertDaysToIsoDuration(restriction.minLosThrough);
    }

    // Handle advance booking restrictions (minAdv, maxAdv)
    if (restriction.minAdv) {
      exceptions.MinAdvance = this.convertDaysToIsoDuration(restriction.minAdv);
    }
    if (restriction.maxAdv) {
      exceptions.MaxAdvance = this.convertDaysToIsoDuration(restriction.maxAdv);
    }

    // Determine type based on restriction condition type
    let type: 'Stay' | 'Start' | 'End';
    switch (restriction.type) {
      case RestrictionConditionType.ClosedToArrival:
        type = 'Start';
        break;
      case RestrictionConditionType.ClosedToDeparture:
        type = 'End';
        break;
      case RestrictionConditionType.ClosedToStay:
        type = 'Stay';
        break;
      default:
        // For LOS restrictions, default to Start
        type = 'Start';
        break;
    }

    // If no exceptions were set, this restriction doesn't map to Mews
    if (Object.keys(exceptions).length === 0) {
      this.logger.warn(`Restriction ${restriction.id} has no mappable values for Mews`);
      return {
        type,
        exceptions: {}
      };
    }

    return {
      type,
      exceptions
    };
  }

  private convertDaysToIsoDuration(days: number): string {
    // Convert days to ISO 8601 duration format  P[n]Y[n]M[n]DT[n]H[n]M[n]S
    // Examples: "P0M3DT0H0M0S", "P1DT12H30M", "PT24H"
    return `P0M${days}DT0H0M0S`;
  }

  private batchRestrictions(restrictions: any[], batchSize: number): any[][] {
    const batches: any[][] = [];
    for (let i = 0; i < restrictions.length; i += batchSize) {
      batches.push(restrictions.slice(i, i + batchSize));
    }
    return batches;
  }

  // Four restriction level functions as per mews-restriction.md guide

  /**
   * Build Property Level Restrictions
   * ExactRateId = null, ResourceCategoryId = null
   */
  buildPropertyLevelRestrictions(restrictions: Restriction[], timezone: string): any[] {
    const results: any[] = [];

    for (const restriction of restrictions) {
      const mewsMapping = this.mapRestrictionToMewsType(restriction);
      if (!mewsMapping) continue;

      const { startUtc, endUtc } = this.convertToUtcTimeUnits(
        timezone,
        format(restriction.fromDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT),
        format(restriction.toDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT)
      );

      const restrictionPayload = {
        Type: mewsMapping.type,
        ExactRateId: null,
        ResourceCategoryId: null,
        StartUtc: startUtc,
        EndUtc: endUtc,
        Days: this.buildDaysObjectFromWeekdays(restriction.weekdays),
        ...mewsMapping.exceptions
      };

      results.push(restrictionPayload);
    }

    return results;
  }

  /**
   * Build Room Product Level Restrictions
   * Only ResourceCategoryId present, mapped from room product code
   */
  buildRoomProductLevelRestrictions(
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[],
    timezone: string
  ): any[] {
    const results: any[] = [];

    for (const restriction of restrictions) {
      if (!restriction.roomProductIds || restriction.roomProductIds.length === 0) continue;

      const mewsMapping = this.mapRestrictionToMewsType(restriction);
      if (!mewsMapping) continue;

      // Create restriction for each room product
      for (const roomProductId of restriction.roomProductIds) {
        const mapping = roomProductMappingPms.find((m) => m.roomProductId === roomProductId);
        if (!mapping) {
          this.logger.warn(`No PMS mapping found for room product ${roomProductId}`);
          continue;
        }

        const { startUtc, endUtc } = this.convertToUtcTimeUnits(
          timezone,
          format(restriction.fromDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT),
          format(restriction.toDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT)
        );

        const restrictionPayload = {
          Type: mewsMapping.type,
          ExactRateId: null,
          ResourceCategoryId: mapping.roomProductMappingPmsCode,
          StartUtc: startUtc,
          EndUtc: endUtc,
          Days: this.buildDaysObjectFromWeekdays(restriction.weekdays),
          ...mewsMapping.exceptions
        };

        results.push(restrictionPayload);
      }
    }

    this.logger.log(
      `🔄 Built ${results.length} room product restriction payloads from ${restrictions.length} restrictions`
    );
    return results;
  }

  /**
   * Build Sales Plan Level Restrictions
   * Only ExactRateId present, mapped from rate plan code
   */
  buildSalesPlanLevelRestrictions(restrictions: Restriction[], timezone: string): any[] {
    const results: any[] = [];

    for (const restriction of restrictions) {
      if (!restriction.ratePlanIds || restriction.ratePlanIds.length === 0) continue;

      const mewsMapping = this.mapRestrictionToMewsType(restriction);
      if (!mewsMapping) continue;

      // Create restriction for each rate plan
      for (const ratePlanId of restriction.ratePlanIds) {
        const { startUtc, endUtc } = this.convertToUtcTimeUnits(
          timezone,
          format(restriction.fromDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT),
          format(restriction.toDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT)
        );

        const restrictionPayload = {
          Type: mewsMapping.type,
          ExactRateId: ratePlanId, // Using ratePlanId directly as PMS code
          ResourceCategoryId: null,
          StartUtc: startUtc,
          EndUtc: endUtc,
          Days: this.buildDaysObjectFromWeekdays(restriction.weekdays),
          ...mewsMapping.exceptions
        };

        results.push(restrictionPayload);
      }
    }

    this.logger.log(
      `🔄 Built ${results.length} sales plan restriction payloads from ${restrictions.length} restrictions`
    );
    return results;
  }

  /**
   * Build Room Product + Sales Plan Level Restrictions
   * Both ExactRateId and ResourceCategoryId present
   */
  buildRoomProductSalesPlanLevelRestrictions(
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[],
    timezone: string
  ): any[] {
    const results: any[] = [];

    for (const restriction of restrictions) {
      if (
        !restriction.roomProductIds ||
        restriction.roomProductIds.length === 0 ||
        !restriction.ratePlanIds ||
        restriction.ratePlanIds.length === 0
      )
        continue;

      const mewsMapping = this.mapRestrictionToMewsType(restriction);
      if (!mewsMapping) continue;

      // Create restriction for each combination of room product and rate plan
      for (const roomProductId of restriction.roomProductIds) {
        const mapping = roomProductMappingPms.find((m) => m.roomProductId === roomProductId);
        if (!mapping) {
          this.logger.warn(`No PMS mapping found for room product ${roomProductId}`);
          continue;
        }

        for (const ratePlanId of restriction.ratePlanIds) {
          const { startUtc, endUtc } = this.convertToUtcTimeUnits(
            timezone,
            format(restriction.fromDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT),
            format(restriction.toDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT)
          );

          const restrictionPayload = {
            Type: mewsMapping.type,
            ExactRateId: ratePlanId, // Using ratePlanId directly as PMS code
            ResourceCategoryId: mapping.roomProductMappingPmsCode,
            StartUtc: startUtc,
            EndUtc: endUtc,
            Days: this.buildDaysObjectFromWeekdays(restriction.weekdays),
            ...mewsMapping.exceptions
          };

          results.push(restrictionPayload);
        }
      }
    }

    this.logger.log(
      `🔄 Built ${results.length} combined room product + sales plan restriction payloads from ${restrictions.length} restrictions`
    );
    return results;
  }

  // Legacy methods - no longer needed with new Restriction entity approach
  // Kept for reference but should be removed in future cleanup

  private buildDaysObject(allDays: boolean = true): any {
    return {
      Monday: allDays,
      Tuesday: allDays,
      Wednesday: allDays,
      Thursday: allDays,
      Friday: allDays,
      Saturday: allDays,
      Sunday: allDays
    };
  }

  /**
   * Build Days object from weekdays array or default to all days if null
   */
  private buildDaysObjectFromWeekdays(weekdays: Weekday[] | null | undefined): any {
    if (!weekdays || weekdays.length === 0) {
      // Default to all days if no weekdays specified
      return this.buildDaysObject(true);
    }

    return {
      Monday: weekdays.includes(Weekday.Monday),
      Tuesday: weekdays.includes(Weekday.Tuesday),
      Wednesday: weekdays.includes(Weekday.Wednesday),
      Thursday: weekdays.includes(Weekday.Thursday),
      Friday: weekdays.includes(Weekday.Friday),
      Saturday: weekdays.includes(Weekday.Saturday),
      Sunday: weekdays.includes(Weekday.Sunday)
    };
  }

  // Legacy method - filtering is now handled in filterRestrictionsBySettings method

  /**
   * Group and batch restrictions for optimal API performance
   * Groups by ResourceCategoryId and/or ExactRateId to minimize API calls
   */
  groupAndBatchRestrictions(restrictions: any[]): any[][] {
    // Group by resource category and rate combination
    const grouped = new Map<string, any[]>();

    for (const restriction of restrictions) {
      const key = `${restriction.ResourceCategoryId || 'null'}_${restriction.ExactRateId || 'null'}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(restriction);
    }

    // Convert to array and batch each group
    const groupedArrays = Array.from(grouped.values());
    const batches: any[][] = [];

    for (const group of groupedArrays) {
      const groupBatches = this.batchRestrictions(group, 100);
      batches.push(...groupBatches);
    }

    return batches;
  }

  /**
   * Send restrictions to Mews with proper error handling and logging
   */
  async sendRestrictionsToMews(
    restrictions: any[],
    accessToken: string,
    serviceId: string
  ): Promise<void> {
    if (restrictions.length === 0) {
      this.logger.warn('No restrictions to send to Mews');
      return;
    }

    const batches = this.groupAndBatchRestrictions(restrictions);
    this.logger.log(
      `Sending ${restrictions.length} restrictions in ${batches.length} optimized batches to Mews`
    );

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const payload = {
          AccessToken: accessToken,
          ServiceId: serviceId,
          Data: batch
        };

        await this.pushRestriction(payload);
        successCount += batch.length;
        this.logger.log(
          `Batch ${i + 1}/${batches.length}: Successfully pushed ${batch.length} restrictions`
        );

        // Rate limiting protection
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        errorCount += batch.length;
        this.logger.error(
          `Batch ${i + 1}/${batches.length}: Failed to push ${batch.length} restrictions:`,
          error
        );

        // Continue with other batches even if one fails
        continue;
      }
    }

    this.logger.log(`Restriction push summary: ${successCount} successful, ${errorCount} failed`);

    if (errorCount > 0) {
      throw new Error(
        `Failed to push ${errorCount} out of ${restrictions.length} restrictions to Mews`
      );
    }
  }

  /**
   * Build clear restriction data from Restriction entities
   * Maps room product IDs to ResourceCategoryId and rate plan IDs to ExactRateId
   */
  private buildClearRestrictionData(
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[],
    timezone: string
  ): MewsDeleteRestrictionDto[] {
    const results: MewsDeleteRestrictionDto[] = [];

    for (const restriction of restrictions) {
      const mewsMapping = this.mapRestrictionToMewsType(restriction);
      if (!mewsMapping) continue;

      const { startUtc, endUtc } = this.convertToUtcTimeUnits(
        timezone,
        format(restriction.fromDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT),
        format(restriction.toDate, DATE_FORMAT) || format(new Date(), DATE_FORMAT)
      );

      const daysObject = this.buildDaysObjectFromWeekdays(restriction.weekdays);

      // Handle property-level restrictions (no room products or rate plans)
      if (
        (!restriction.roomProductIds || restriction.roomProductIds.length === 0) &&
        (!restriction.ratePlanIds || restriction.ratePlanIds.length === 0)
      ) {
        results.push({
          Type: mewsMapping.type,
          StartUtc: startUtc,
          EndUtc: endUtc,
          Days: daysObject
        });
      }

      // Handle room product level restrictions
      if (restriction.roomProductIds && restriction.roomProductIds.length > 0) {
        for (const roomProductId of restriction.roomProductIds) {
          const mapping = roomProductMappingPms.find((m) => m.roomProductId === roomProductId);
          if (!mapping) {
            this.logger.warn(`No PMS mapping found for room product ${roomProductId}`);
            continue;
          }

          // Room product only (no rate plans)
          if (!restriction.ratePlanIds || restriction.ratePlanIds.length === 0) {
            results.push({
              Type: mewsMapping.type,
              ResourceCategoryId: mapping.roomProductMappingPmsCode,
              StartUtc: startUtc,
              EndUtc: endUtc,
              Days: daysObject
            });
          } else {
            // Room product + rate plan combinations
            for (const ratePlanId of restriction.ratePlanIds) {
              results.push({
                Type: mewsMapping.type,
                ExactRateId: ratePlanId,
                ResourceCategoryId: mapping.roomProductMappingPmsCode,
                StartUtc: startUtc,
                EndUtc: endUtc,
                Days: daysObject
              });
            }
          }
        }
      } else if (restriction.ratePlanIds && restriction.ratePlanIds.length > 0) {
        // Rate plan only (no room products)
        for (const ratePlanId of restriction.ratePlanIds) {
          results.push({
            Type: mewsMapping.type,
            ExactRateId: ratePlanId,
            StartUtc: startUtc,
            EndUtc: endUtc,
            Days: daysObject
          });
        }
      }
    }

    this.logger.log(
      `🔄 Built ${results.length} clear restriction payloads from ${restrictions.length} restrictions`
    );
    return results;
  }

  async clearMewsRestrictions(
    body: BaseMewsBodyDto,
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[]
  ): Promise<void> {
    const { ServiceId, AccessToken, timezone } = body;

    if (!timezone) {
      this.logger.error(`Timezone is required`);
      throw new Error(`Timezone is required`);
    }

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      throw new Error(`AccessToken is required`);
    }

    if (!ServiceId) {
      this.logger.error(`Service ID is required`);
      throw new Error(`Service ID is required`);
    }

    const clientId = this.clientId;
    const clientToken = this.clientToken;
    if (!clientId || !clientToken) {
      this.logger.error(`Mews client credentials are not configured`);
      throw new Error(`Mews client credentials are not configured`);
    }

    this.logger.log(`Clearing restrictions for ${restrictions.length} restrictions`);

    // Build clear restriction data from restrictions
    const Data: MewsDeleteRestrictionDto[] = this.buildClearRestrictionData(
      restrictions,
      roomProductMappingPms,
      timezone
    );

    if (Data.length === 0) {
      this.logger.warn('No restriction data to clear');
      return;
    }

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      ServiceId,
      Data
    };

    this.logger.log(`Start call CLEAR_RESTRICTIONS_URL with ${Data.length} restrictions to clear`);

    try {
      const response: AxiosResponse<any> = await lastValueFrom(
        this.httpService.post(
          MewsApiConstants.CLEAR_RESTRICTIONS_URL.replace('{{MEWS_API}}', this.mewsApi),
          initialRequest,
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );

      if (response.status !== 200) {
        throw new Error(`Error when clearing restrictions: ${response.statusText}`);
      }
      this.logger.log(`Successfully cleared restrictions`);
    } catch (error) {
      this.logger.error(`Error when clearing restrictions: ${error}`);
      throw new Error(`Error when clearing restrictions: ${error}`);
    }
  }

  async getRoomProductCategoryAssignments(
    body: BaseMewsBodyDto
  ): Promise<MewsRoomProductAssignmentDto[]> {
    const { AccessToken, EnterpriseId, ResourceCategoryIds } = body;
    const clientId = this.clientId;
    const clientToken = this.clientToken;

    if (!AccessToken || !EnterpriseId || !ResourceCategoryIds || ResourceCategoryIds.length === 0) {
      this.logger.error('AccessToken, EnterpriseId and ResourceCategoryIds are required');
      return [];
    }

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      EnterpriseId: EnterpriseId,
      EnterpriseIds: [EnterpriseId],
      ResourceCategoryIds: ResourceCategoryIds,
      ActivityStates: this.ActivityStates,
      Limitation: {
        Count: this.defaultLimitCount
      }
    };

    this.logger.log(
      `Start call GET_ROOM_PRODUCT_ASSIGNMENT_URL with ${JSON.stringify(initialRequest)}`
    );

    const all: MewsRoomProductAssignmentDto[] = await Helper.paginateByCursor<
      BaseMewsBodyDto,
      MewsRoomProductAssignmentDto,
      MewsRoomProductAssignmentResponseDto
    >({
      initialRequest,
      callApi: async (requestBody) => {
        const response: AxiosResponse<MewsRoomProductAssignmentResponseDto> = await lastValueFrom(
          this.httpService.post(
            MewsApiConstants.GET_ROOM_PRODUCT_ASSIGNMENT_URL.replace('{{MEWS_API}}', this.mewsApi),
            requestBody,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );

        if (response.status !== 200) {
          this.logger.error(
            `Error getting room product category assignments: ${response.statusText}`
          );
          return {
            ResourceCategoryAssignments: [],
            Cursor: undefined
          } as MewsRoomProductAssignmentResponseDto;
        }
        return response.data;
      },
      extract: (data) => ({ items: data.ResourceCategoryAssignments ?? [], cursor: data.Cursor }),
      applyCursor: (req, cursor) => {
        this.logger.log(`This api has cursor: ${cursor}`);
        return {
          ...req,
          Limitation: {
            ...req.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };
      }
    });

    this.logger.log(`getRoomProductCategoryAssignments result: ${all.length} assignments found`);
    return all;
  }

  async getRoomProductAssignment(body: BaseMewsBodyDto): Promise<{
    categories: Array<{ Id: string; Type: string; Name: string }>;
    assignments: Array<{ ResourceId: string; CategoryId: string }>;
    roomUnits: Array<{ Id: string; Name: string; FloorNumber: string }>;
    categoryAssignmentMap: { [categoryId: string]: string[] };
  }> {
    this.logger.log('Starting getRoomProductAssignment process');

    try {
      // Step 1: Get room product categories and room units in parallel
      const [categories, roomUnits] = await Promise.all([
        this.getRoomProductList(body),
        this.getRoomUnitList(body)
      ]);

      if (categories.length === 0) {
        this.logger.warn('No room product categories found');
        return {
          categories: [],
          assignments: [],
          roomUnits: this.filterAndMapRoomUnits(roomUnits),
          categoryAssignmentMap: {}
        };
      }

      // Extract category IDs for the assignments call
      const categoryIds = categories.map((category) => category.Id);

      // Step 2: Get room product assignments using the category IDs
      const assignmentBody: BaseMewsBodyDto = {
        ...body,
        ResourceCategoryIds: categoryIds
      };

      const assignments = await this.getRoomProductCategoryAssignments(assignmentBody);

      // Step 3: Filter and map data
      const filteredCategories = this.filterAndMapCategories(categories);
      const filteredAssignments = this.filterAndMapAssignments(assignments);
      const filteredRoomUnits = this.filterAndMapRoomUnits(roomUnits);
      const categoryAssignmentMap = this.createCategoryAssignmentMap(assignments);

      this.logger.log(
        `getRoomProductAssignment completed: ${filteredCategories.length} categories, ${filteredAssignments.length} assignments, ${filteredRoomUnits.length} room units`
      );

      return {
        categories: filteredCategories,
        assignments: filteredAssignments,
        roomUnits: filteredRoomUnits,
        categoryAssignmentMap
      };
    } catch (error) {
      this.logger.error('Error in getRoomProductAssignment:', error);
      throw error;
    }
  }

  /**
   * Creates a mapping from category ID to array of resource IDs (room unit IDs)
   * @param assignments - Array of room product assignments
   * @returns Object with categoryId as key and array of resourceIds as value
   */
  private createCategoryAssignmentMap(assignments: MewsRoomProductAssignmentDto[]): {
    [categoryId: string]: string[];
  } {
    const categoryMap: { [categoryId: string]: string[] } = {};

    assignments.forEach((assignment) => {
      if (assignment.IsActive) {
        const { CategoryId, ResourceId } = assignment;

        if (!categoryMap[CategoryId]) {
          categoryMap[CategoryId] = [];
        }

        categoryMap[CategoryId].push(ResourceId);
      }
    });

    this.logger.log(
      `Created category assignment map with ${Object.keys(categoryMap).length} categories`
    );

    return categoryMap;
  }

  /**
   * Filters active categories and maps to simplified structure
   * @param categories - Array of room product categories
   * @returns Filtered and mapped categories with only Id, Type, Name
   */
  private filterAndMapCategories(
    categories: MewsRoomProductDto[]
  ): Array<{ Id: string; Type: string; Name: string }> {
    return categories
      .filter((category) => category.IsActive)
      .map((category) => ({
        Id: category.Id,
        Type: category.Type,
        Name:
          category.Names['en-US'] ||
          Object.values(category.Names)[0] ||
          category.ShortNames['en-US'] ||
          Object.values(category.ShortNames)[0] ||
          ''
      }));
  }

  /**
   * Filters active assignments and maps to simplified structure
   * @param assignments - Array of room product assignments
   * @returns Filtered and mapped assignments with only ResourceId, CategoryId
   */
  private filterAndMapAssignments(
    assignments: MewsRoomProductAssignmentDto[]
  ): Array<{ ResourceId: string; CategoryId: string }> {
    return assignments
      .filter((assignment) => assignment.IsActive)
      .map((assignment) => ({
        ResourceId: assignment.ResourceId,
        CategoryId: assignment.CategoryId
      }));
  }

  /**
   * Filters active room units and maps to simplified structure
   * @param roomUnits - Array of room units
   * @returns Filtered and mapped room units with only Id, Name, FloorNumber
   */
  private filterAndMapRoomUnits(
    roomUnits: MewsRoomUnitDto[]
  ): Array<{ Id: string; Name: string; FloorNumber: string }> {
    return roomUnits
      .filter((roomUnit) => roomUnit.IsActive)
      .map((roomUnit) => ({
        Id: roomUnit.Id,
        Name: roomUnit.Name,
        FloorNumber: roomUnit.Data?.Value?.FloorNumber || ''
      }));
  }

  // for mews unit time
  private convertToUtcTimeUnits(timezone: string, startDate: string, endDate: string) {
    // Normalize input to start of day in the given timezone
    const start = fromZonedTime(startOfDay(new Date(startDate)), timezone);
    const end = fromZonedTime(startOfDay(new Date(endDate)), timezone);

    // Convert to ISO strings (UTC)
    const startUtc = start.toISOString();
    const endUtc = end.toISOString();

    return {
      startUtc,
      endUtc
    };
  }

  async getRatePlanPricing(body: BaseMewsBodyDto): Promise<MewsRatePlanPricingResponseDto> {
    const { AccessToken, RateId, StartDate, EndDate, timezone, Pricing } = body;
    const clientId = this.clientId;
    const clientToken = this.clientToken;

    if (!AccessToken || !RateId) {
      this.logger.error('AccessToken, EnterpriseId and RatePlanIds are required');
      return {} as MewsRatePlanPricingResponseDto;
    }

    if (!StartDate || !EndDate) {
      this.logger.error('Start date and end date are required');
      return {} as MewsRatePlanPricingResponseDto;
    }

    if (!timezone) {
      this.logger.error('Timezone is required');
      return {} as MewsRatePlanPricingResponseDto;
    }

    const { startUtc, endUtc } = this.convertToUtcTimeUnits(timezone, StartDate, EndDate);

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      RateId: RateId,
      Limitation: {
        Count: this.defaultLimitCount
      },
      FirstTimeUnitStartUtc: startUtc,
      LastTimeUnitStartUtc: endUtc
    };

    this.logger.log(`Start call GET_RATE_PLAN_PRICING_URL with ${JSON.stringify(initialRequest)}`);

    const response: AxiosResponse<MewsRatePlanPricingResponseDto> = await lastValueFrom(
      this.httpService.post(
        MewsApiConstants.GET_RATE_PLAN_PRICING_URL.replace('{{MEWS_API}}', this.mewsApi),
        initialRequest,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    if (response.status !== 200) {
      this.logger.error(`Error getting rate plan pricing: ${response.statusText}`);
      return {} as MewsRatePlanPricingResponseDto;
    }

    this.logger.log(
      `Successfully retrieved rate plan pricing with ${response.data.CategoryPrices?.length || 0} categories`
    );
    return response.data;
  }

  async getRatePlanPricingMapped(
    body: BaseMewsBodyDto,
    ratePlanMappingPmsCode: string
  ): Promise<RatePlanPricingMappingDto[]> {
    const response = await this.getRatePlanPricing(body);

    if (!response.CategoryPrices) {
      this.logger.warn('No pricing data received from Mews');
      return [];
    }

    if (!body.timezone) {
      this.logger.error('Timezone is required for rate plan pricing mapping');
      return [];
    }

    const pricingMode = body.Pricing || 'Gross';
    return this.mapRatePlanPricing(response, ratePlanMappingPmsCode, pricingMode, body.timezone);
  }

  private mapRatePlanPricing(
    response: MewsRatePlanPricingResponseDto,
    ratePlanMappingPmsCode: string,
    pricingMode: 'Gross' | 'Net' = 'Gross',
    timezone: string
  ): RatePlanPricingMappingDto[] {
    const result: RatePlanPricingMappingDto[] = [];

    if (!response.CategoryPrices || !response.DatesUtc) {
      this.logger.warn('No category prices or dates found in Mews response');
      return result;
    }

    // Process each category (room product)
    response.CategoryPrices.forEach((categoryPrice) => {
      const { CategoryId, Prices, AmountPrices } = categoryPrice;

      // Process each date
      response.DatesUtc.forEach((dateUtc, dateIndex) => {
        // Convert UTC date to hotel local timezone, then format as YYYY-MM-DD
        const utcDate = new Date(dateUtc);
        const localDate = toZonedTime(utcDate, timezone);
        const date = format(localDate, 'yyyy-MM-dd');

        let netPrice = 0;
        let grossPrice = 0;

        // Determine prices based on available data
        if (AmountPrices && AmountPrices[dateIndex]) {
          // Use detailed amount prices if available
          const amountPrice = AmountPrices[dateIndex];
          netPrice = amountPrice.NetValue || 0;
          grossPrice = amountPrice.GrossValue || 0;
        } else if (Prices && Prices[dateIndex] !== undefined) {
          // Fallback to simple prices array
          const price = Prices[dateIndex];
          if (pricingMode === 'Net') {
            netPrice = price;
            grossPrice = price; // Assume same if no tax info available
          } else {
            grossPrice = price;
            netPrice = price; // Assume same if no tax info available
          }
        }

        // Only add entry if we have valid pricing data
        if (netPrice > 0 || grossPrice > 0) {
          result.push({
            roomProductMappingPmsCode: CategoryId,
            date: date,
            netPrice: netPrice,
            grossPrice: grossPrice,
            ratePlanMappingPmsCode: ratePlanMappingPmsCode,
            pricingMode: pricingMode
          });
        }
      });
    });

    this.logger.log(`Mapped ${result.length} pricing entries from Mews response`);
    return result;
  }

  async getRatePlan(body: BaseMewsBodyDto): Promise<RatePlanMappingDto[]> {
    const { AccessToken, ServiceIds } = body;
    const clientId = this.clientId;
    const clientToken = this.clientToken;

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      ServiceIds: ServiceIds,
      Limitation: {
        Count: this.defaultLimitCount
      },
      ActivityStates: this.ActivityStates
    };

    const response: AxiosResponse<MewsRatePlanResponseDto> = await lastValueFrom(
      this.httpService.post(
        MewsApiConstants.GET_RATE_PLAN_URL.replace('{{MEWS_API}}', this.mewsApi),
        initialRequest,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    if (response.status !== 200) {
      this.logger.error(`Error getting rate plan: ${response.statusText}`);
      return [] as RatePlanMappingDto[];
    }

    const rates = response.data.Rates.map((rate) => ({
      ratePlanMappingPmsCode: rate.Id,
      name: rate.Names['en-US'] || Object.values(rate.Names)[0] || rate.ShortName || '',
      metadata: rate
    }));

    return rates;
  }

  /**
   * Get Mews configuration including Enterprise and Service details
   * Calls /api/connector/v1/configuration/get
   */
  async getConfiguration(accessToken: string): Promise<MewsConfigurationResponseDto | null> {
    this.logger.log(`Getting Mews configuration`);

    if (!accessToken) {
      this.logger.error(`AccessToken is required`);
      return null;
    }

    const clientId = this.clientId;
    const clientToken = this.clientToken;
    if (!clientId || !clientToken) {
      this.logger.error(`Mews client credentials are not configured`);
      return null;
    }

    const requestBody: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: accessToken
    };

    const response: AxiosResponse<MewsConfigurationResponseDto> = await lastValueFrom(
      this.httpService.post(
        MewsApiConstants.TEST_ACCESS_URL.replace('{{MEWS_API}}', this.mewsApi),
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    );

    if (response.status === 200) {
      this.logger.log(
        `Successfully retrieved Mews configuration for Enterprise: ${response.data.Enterprise?.Name}`
      );
      return response.data;
    } else {
      this.logger.error(`Error getting Mews configuration: ${response.statusText}`);
      throw new Error(`Error getting Mews configuration: ${response.statusText}`);
    }
  }

  /**
   * Get all services from Mews
   * Calls /api/connector/v1/services/getAll
   */
  async getServices(body: BaseMewsBodyDto): Promise<MewsServiceDto[]> {
    const { AccessToken, EnterpriseIds, ServiceIds } = body;

    if (!AccessToken) {
      this.logger.error(`AccessToken is required`);
      return [];
    }

    const clientId = this.clientId;
    const clientToken = this.clientToken;
    if (!clientId || !clientToken) {
      this.logger.error(`Mews client credentials are not configured`);
      return [];
    }

    const initialRequest: BaseMewsBodyDto = {
      Client: clientId,
      ClientToken: clientToken,
      AccessToken: AccessToken,
      ...(EnterpriseIds && EnterpriseIds.length > 0 ? { EnterpriseIds } : {}),
      ...(ServiceIds && ServiceIds.length > 0 ? { ServiceIds } : {}),
      Limitation: {
        Count: this.defaultLimitCount
      }
    };

    this.logger.log(`Start call GET_SERVICES_URL with ${JSON.stringify(initialRequest)}`);

    const all: MewsServiceDto[] = await Helper.paginateByCursor<
      BaseMewsBodyDto,
      MewsServiceDto,
      MewsServicesResponseDto
    >({
      initialRequest,
      callApi: async (requestBody) => {
        const response: AxiosResponse<MewsServicesResponseDto> = await lastValueFrom(
          this.httpService.post(
            MewsApiConstants.GET_SERVICES_URL.replace('{{MEWS_API}}', this.mewsApi),
            requestBody,
            {
              headers: { 'Content-Type': 'application/json' }
            }
          )
        );

        if (response.status !== 200) {
          this.logger.error(`Error getting services: ${response.statusText}`);
          return { Services: [], Cursor: undefined } as MewsServicesResponseDto;
        }
        return response.data;
      },
      extract: (data) => ({ items: data.Services ?? [], cursor: data.Cursor }),
      applyCursor: (req, cursor) => {
        this.logger.log(`This api has cursor: ${cursor}`);
        return {
          ...req,
          Limitation: {
            ...req.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };
      },
      maxIterations: 1000
    });

    return (all || []).filter((s) => s.IsActive);
  }
}
