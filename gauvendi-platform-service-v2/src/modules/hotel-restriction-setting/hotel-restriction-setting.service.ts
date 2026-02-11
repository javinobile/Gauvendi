import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { DbName } from '@src/core/constants/db-name.constant';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { HotelRestrictionIntegrationSetting } from '@src/core/entities/hotel-restriction-integration-setting.entity';
import { HotelRestrictionSetting } from '@src/core/entities/hotel-restriction-setting.entity';
import { RestrictionSourceMap } from '@src/core/entities/restriction.entity';
import {
  ConnectorTypeEnum,
  HotelRestrictionCodeEnum,
  HotelRestrictionSettingMode,
  RestrictionConditionType,
  RestrictionEntity,
  RestrictionSourceType
} from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { format } from 'date-fns';
import { In, Repository } from 'typeorm';
import { HotelConfigurationRepository } from '../hotel-configuration/hotel-configuration.repository';
import { RestrictionMappingDto } from '../pms/pms.dto';
import { PmsService } from '../pms/pms.service';
import { CreateRestrictionDto } from '../restriction/restriction.dto';
import { RestrictionService } from '../restriction/restriction.service';
import {
  GetHotelIntegrationRestrictionSettingListQuery,
  HotelIntegrationRestrictionSettingInputDto
} from './hotel-restriction-setting.dto';

@Injectable()
export class HotelRestrictionSettingService {
  logger = new Logger(HotelRestrictionSettingService.name);

  constructor(
    @InjectRepository(HotelRestrictionSetting, DbName.Postgres)
    private readonly hotelRestrictionSettingRepository: Repository<HotelRestrictionSetting>,

    @InjectRepository(HotelRestrictionIntegrationSetting, DbName.Postgres)
    private readonly hotelRestrictionIntegrationSettingRepository: Repository<HotelRestrictionIntegrationSetting>,


    private readonly hotelConfigurationRepository: HotelConfigurationRepository,

    @InjectRepository(Connector, DbName.Postgres)
    private readonly connectorRepository: Repository<Connector>,

    private readonly pmsService: PmsService,

    private readonly restrictionService: RestrictionService
  ) {}

  async getHotelIntegrationRestrictionSetting(
    query: GetHotelIntegrationRestrictionSettingListQuery
  ) {
    const { hotelId, modeList, salesPlanIdList } = query;
    const where: any = {
      hotelId: hotelId,
      mode: Array.isArray(modeList) ? In(modeList) : modeList
    };
    if (salesPlanIdList != null) {
      where.ratePlanId = In(salesPlanIdList);
    }
    const result = await this.hotelRestrictionIntegrationSettingRepository.find({
      where
    });

    return (result || []).map((item) => ({
      id: item.id,
      propertyId: item.hotelId,
      salesPlanId: item.ratePlanId,
      roomProductId: item.roomProductId,
      integrationMappingCode: item.pmsMappingCode,
      restrictionEntity: item.restrictionEntity,
      restrictionCode: item.restrictionCode,
      mode: item.mode
    }));
  }

  async upsertHotelIntegrationRestrictionSettings(
    body: HotelIntegrationRestrictionSettingInputDto[]
  ) {
    const settingList = body
      .flatMap((item) =>
        item.settingList?.map((setting) => ({
          hotelId: item.hotelId,
          restrictionEntity: item.restrictionEntity,
          restrictionCode: setting.restrictionCode,
          mode: setting.mode,
          ratePlanId: item.salesPlanId,
          roomProductId: item.roomProductId,
          pmsMappingCode: item.integrationMappingCode
        }))
      )
      .filter(Boolean); // removes undefined/null

    if (settingList.length === 0) {
      return [];
    }

    // Group settings by unique combination of hotelId, ratePlanId, roomProductId
    const uniqueCombinations = new Map<string, Array<NonNullable<(typeof settingList)[0]>>>();

    settingList.forEach((setting) => {
      if (!setting) return; // Skip null/undefined settings
      const key = `${setting.hotelId}-${setting.ratePlanId}-${setting.roomProductId}`;
      if (!uniqueCombinations.has(key)) {
        uniqueCombinations.set(key, []);
      }
      uniqueCombinations.get(key)!.push(setting);
    });

    // Process each unique combination
    for (const [key, settings] of uniqueCombinations) {
      const firstSetting = settings[0];
      if (!firstSetting) continue; // Skip if no settings
      const { hotelId, ratePlanId, roomProductId, pmsMappingCode } = firstSetting;

      // Only proceed if we have valid IDs and pmsMappingCode
      if (!hotelId || !ratePlanId || !roomProductId || !pmsMappingCode) {
        this.logger.warn(
          `Skipping deletion check for incomplete data: hotelId=${hotelId}, ratePlanId=${ratePlanId}, roomProductId=${roomProductId}, pmsMappingCode=${pmsMappingCode}`
        );
        continue;
      }

      // Check if there are existing records with different pmsMappingCode
      const existingRecords = await this.hotelRestrictionIntegrationSettingRepository.find({
        where: {
          hotelId,
          ratePlanId,
          roomProductId
        }
      });

      // Find records with different pmsMappingCode
      const recordsWithDifferentMapping = existingRecords.filter(
        (record) => record.pmsMappingCode !== pmsMappingCode
      );

      // Delete records with different pmsMappingCode
      if (recordsWithDifferentMapping.length > 0) {
        const idsToDelete = recordsWithDifferentMapping.map((record) => record.id);
        await this.hotelRestrictionIntegrationSettingRepository.delete(idsToDelete);

        this.logger.log(
          `Deleted ${idsToDelete.length} existing records with different pmsMappingCode (old: ${recordsWithDifferentMapping.map((r) => r.pmsMappingCode).join(', ')}, new: ${pmsMappingCode}) for hotelId: ${hotelId}, ratePlanId: ${ratePlanId}, roomProductId: ${roomProductId}`
        );
      }
    }

    // Now perform the upsert with the new settings
    await this.hotelRestrictionIntegrationSettingRepository.upsert(settingList as any, {
      conflictPaths: [
        'hotelId',
        'ratePlanId',
        'roomProductId',
        'pmsMappingCode',
        'restrictionEntity',
        'restrictionCode'
      ],
      skipUpdateIfNoValuesChanged: false // ensure updates even if mode changed
    });

    return settingList;
  }

  async syncPmsRestrictionSetting(body: { hotelId: string; restrictionEntity: RestrictionEntity }) {
    const { hotelId, restrictionEntity } = body;

    if (!hotelId || !restrictionEntity) {
      throw new BadRequestException('Hotel ID and restriction entity are required');
    }

    const restrictionSettings = await this.hotelRestrictionIntegrationSettingRepository.find({
      where: { hotelId, restrictionEntity, mode: HotelRestrictionSettingMode.PULL }
    });

    if (restrictionSettings.length === 0) {
      return [];
    }

    // filter restrictionSettings by pmsMappingCode
    const restrictionSettingsByPmsMappingCode = restrictionSettings.filter(
      (item) => item.pmsMappingCode.length > 0
    );
    if (restrictionSettingsByPmsMappingCode.length === 0) {
      return [];
    }

    const startDate = new Date();
    const endDate = await this.hotelConfigurationRepository.getLastSellableDate(hotelId);
    const pmsRatePlanCodes = restrictionSettingsByPmsMappingCode.map((item) => item.pmsMappingCode);

    const pmsRestrictions = await this.pmsService.getPmsRestriction({
      hotelId,
      startDate: format(startDate, DATE_FORMAT),
      endDate: format(endDate, DATE_FORMAT),
      pmsRatePlanCodes
    });

    // 4️⃣ Group restrictionSettings by integrationMappingCode for quick lookup
    const mappingMap = new Map(
      restrictionSettings.map((item) => [item.pmsMappingCode, item.roomProductId])
    );

    // 5️⃣ Map PMS restrictions to local roomProductIds
    const apaleoRestrictions = pmsRestrictions.filter(
      (r) => r.connectorType === ConnectorTypeEnum.APALEO
    );

    if (apaleoRestrictions.length > 0) {
      this.handleApaleoRestrictions(apaleoRestrictions, mappingMap, hotelId, restrictionSettings);
    }
    // handle for mews
    // const mewsRestrictions = pmsRestrictions.filter((item) => item.connectorType === ConnectorTypeEnum.MEWS);

    return true;
  }

  async handleApaleoRestrictions(
    apaleoRestrictions: RestrictionMappingDto[],
    mappingMap: Map<string, string>,
    hotelId: string,
    restrictionSettings: HotelRestrictionIntegrationSetting[]
  ) {
    const apaleoRestrictionsWithRoomProductId = [...apaleoRestrictions]
      .map((r) => ({
        ...r,
        roomProductId: mappingMap.get(r.ratePlanMappingPmsCode!)
      }))
      .filter((r) => r.roomProductId); // only keep valid mappings

    // get field need to pull from pms
    const fieldPullMap = new Map<string, HotelRestrictionCodeEnum[]>();
    restrictionSettings.forEach((item) => {
      if (item.mode === HotelRestrictionSettingMode.PULL && item.pmsMappingCode.length > 0) {
        // get or initialize array
        const restrictionCodes = fieldPullMap.get(item.roomProductId) || [];

        // add code if not exists
        if (!restrictionCodes.includes(item.restrictionCode)) {
          restrictionCodes.push(item.restrictionCode);
        }

        // set back to map
        fieldPullMap.set(item.roomProductId, restrictionCodes);
      }
    });

    const restrictionsToAdd: CreateRestrictionDto[] = apaleoRestrictionsWithRoomProductId
      .map((r) => {
        const restrictionCodes = fieldPullMap.get(r.roomProductId!);
        if (!restrictionCodes) {
          return undefined;
        }

        const restrictionSource: RestrictionSourceMap = {};

        // Helper to check numeric PMS value fields safely
        const hasValidValue = (value?: number | null) => value != null && value > 0;

        // Mapping of numeric restriction fields
        const numericRestrictions = [
          {
            field: 'minLength',
            value: r.minLength,
            code: HotelRestrictionCodeEnum.RSTR_LOS_MIN
          },
          {
            field: 'maxLength',
            value: r.maxLength,
            code: HotelRestrictionCodeEnum.RSTR_LOS_MAX
          },
          {
            field: 'minAdv',
            value: r.minAdv,
            code: HotelRestrictionCodeEnum.RSTR_MIN_ADVANCE_BOOKING
          },
          {
            field: 'maxAdv',
            value: r.maxAdv,
            code: HotelRestrictionCodeEnum.RSTR_MAX_ADVANCE_BOOKING
          },
          {
            field: 'minLosThrough',
            value: r.minLosThrough,
            code: HotelRestrictionCodeEnum.RSTR_MIN_LOS_THROUGH
          }
        ] as const;

        // Dynamically assign values to matching fields
        const result: Record<string, number | undefined> = {};
        for (const { field, value, code } of numericRestrictions) {
          if (hasValidValue(value) && restrictionCodes.includes(code)) {
            result[field] = value!;
            restrictionSource[field as keyof RestrictionSourceMap] = RestrictionSourceType.PMS;
          }
        }

        // Handle type-based restrictions
        const restrictionTypeMap: Partial<
          Record<HotelRestrictionCodeEnum, RestrictionConditionType>
        > = {
          [HotelRestrictionCodeEnum.RSTR_CLOSE_TO_ARRIVAL]:
            RestrictionConditionType.ClosedToArrival,
          [HotelRestrictionCodeEnum.RSTR_CLOSE_TO_DEPARTURE]:
            RestrictionConditionType.ClosedToDeparture,
          [HotelRestrictionCodeEnum.RSTR_CLOSE_TO_STAY]: RestrictionConditionType.ClosedToStay
        };

        let type: RestrictionConditionType | null = null;
        if (r.type != null) {
          for (const [code, conditionType] of Object.entries(restrictionTypeMap)) {
            if (restrictionCodes.includes(code as HotelRestrictionCodeEnum)) {
              type = conditionType;
              break;
            }
          }
        }

        if (!type) {
          return undefined;
        }

        return {
          roomProductIds: r.roomProductId ? [r.roomProductId] : undefined,
          hotelId,
          fromDate: r.fromDate,
          toDate: r.toDate,
          type,
          weekdays: r.weekdays,
          ...result,
          restrictionSource
        };
      })
      .filter((r) => r !== undefined);

    await this.restrictionService.handleBulkRestrictionOperation({
      restrictionsToAdd: restrictionsToAdd
    });

    return apaleoRestrictionsWithRoomProductId;
  }


  async jobPullPmsRestrictions() {
    // find hotel has connector pms
    // first, only support apaleo pms
    const connectors = await this.connectorRepository.find({
      where: {
        connectorType: ConnectorTypeEnum.APALEO
      }
    });

    this.logger.log(`Found ${connectors.length} APALEO connectors`);

    if (connectors.length === 0) {
      this.logger.warn('No connector pms found');
      return;
    }

    let processedHotels = 0;
    let failedHotels = 0;

    for (const connector of connectors) {
      const hotelId = connector.hotelId;

      if (!hotelId) {
        this.logger.warn(`Connector ${connector.id} has no hotelId, skipping`);
        continue;
      }

      this.logger.log(
        `Processing hotel ${hotelId} (${processedHotels + failedHotels + 1}/${connectors.length})`
      );

      try {
        await this.syncPmsRestrictionSetting({
          hotelId,
          restrictionEntity: RestrictionEntity.ROOM_PRODUCT_SALES_PLAN
        });

        this.logger.log(`Hotel ${hotelId} processed successfully`);
        processedHotels++;
      } catch (error) {
        this.logger.error(`Error processing hotel ${hotelId}: ${error.message}`);
        failedHotels++;
        // Continue processing other hotels
      }
    }

    this.logger.log(
      `Job completed. Processed: ${processedHotels} hotels, Failed: ${failedHotels} hotels`
    );
    return true;
  }
}
