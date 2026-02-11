import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Maintenance } from '@src/core/entities/availability-entities/maintenance.entity';
import { RoomUnitAvailability } from '@src/core/entities/availability-entities/room-unit-availability.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { MewsServiceSettings } from '@src/core/entities/mews-entities/mews-service-settings.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { BadRequestException, NotFoundException } from '@src/core/exceptions';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { Helper } from '@src/core/helper/utils';
import { processInBatches } from '@src/core/utils/batch-processor.util';
import { compareCountryCodes } from '@src/core/utils/country-code.util';
import { groupByToMap, groupByToMapSingle } from '@src/core/utils/group-by.util';
import { addDays, differenceInDays, format, formatDate, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { DATE_FORMAT, DATE_TIME_ISO8601 } from 'src/core/constants/date.constant';
import { DbName } from 'src/core/constants/db-name.constant';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { HotelRestrictionSetting } from 'src/core/entities/hotel-restriction-setting.entity';
import { Restriction } from 'src/core/entities/restriction.entity';
import { RoomProductMappingPms } from 'src/core/entities/room-product-mapping-pms.entity';
import {
  AmenityAvailabilityEnum,
  ConnectorStatusEnum,
  ConnectorTypeEnum,
  HotelConfigurationTypeEnum,
  RestrictionConditionType,
  RoomProductStatus,
  RoomProductType,
  RoomUnitAvailabilityStatus,
  RoomUnitStatus,
  RoundingModeEnum
} from 'src/core/enums/common';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReservationPmsFilterDto } from '../reservation/dtos/reservation.dto';
import { ModeEnumQuery } from '../room-product-restriction/room-product-restriction.dto';
import { ApaleoPmsService } from './apaleo/apaleo-pms.service';
import { APALEO_WEBHOOK_EVENTS } from './apaleo/apaleo.const';
import {
  ApaleoExpand,
  ApaleoMaintenanceType,
  ApaleoPatchRatesDto,
  ApaleoRatePlanDto,
  ApaleoUnitGroupDto,
  ApaleoUnitListResponseDto,
  ApaleoUpdateMaintenanceDto
} from './apaleo/apaleo.dto';
import { ApaleoService } from './apaleo/apaleo.service';
import { ApaleoUtil } from './apaleo/apaleo.util';
import { ReservationsCreatePmsDto, ReservationsCreatePmsInput } from './dtos/pms.dto';
import { MewsPmsService } from './mews/mews-pms.service';
import {
  BaseMewsBodyDto,
  MewsRoomUnitDto,
  MewsRoomUnitMaintenanceDto,
  MewsTaxEnvironmentDto,
  MewsTaxRateDto,
  MewsTaxationDto
} from './mews/mews.dto';
import { MewsService } from './mews/mews.service';
import {
  AuthorizeConnectorDto,
  CreateMappingHotelDto,
  DeauthorizeConnectorDto,
  GetPmsHotelListDto,
  RatePlanPricingMappingDto,
  RatePlanPricingPushDto,
  RatePlanPricingQueryDto,
  RestrictionMappingDto,
  RestrictionQueryDto,
  RoomProductAvailabilityMappingDto,
  RoomProductMappingDto,
  RoomUnitMaintenanceMappingDto,
  RoomUnitMappingDto,
  UpdatePmsAvailabilityDto
} from './pms.dto';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { tryCatch } from 'bullmq';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RedisService } from '@src/core/redis';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';

@Injectable()
export class PmsService implements OnModuleInit {
  logger = new Logger(PmsService.name);

  constructor(
    private readonly apaleoService: ApaleoService,

    private readonly mewsService: MewsService,
    private readonly mewsPmsService: MewsPmsService,
    private readonly apaleoPmsService: ApaleoPmsService,
    private readonly redisService: RedisService,

    @InjectRepository(Connector, DbName.Postgres)
    private readonly connectorRepository: Repository<Connector>,

    @InjectRepository(MewsServiceSettings, DbName.Postgres)
    private readonly mewsServiceSettings: Repository<MewsServiceSettings>,

    @InjectRepository(HotelConfiguration, DbName.Postgres)
    private readonly hotelConfigurationRepository: Repository<HotelConfiguration>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelAmenity, DbName.Postgres)
    private readonly hotelAmenityRepository: Repository<HotelAmenity>,

    @InjectRepository(RoomUnitAvailability, DbName.Postgres)
    private readonly roomUnitAvailabilityRepository: Repository<RoomUnitAvailability>,

    @InjectRepository(Maintenance, DbName.Postgres)
    private readonly maintenanceRepository: Repository<Maintenance>,

    @InjectRepository(MappingPmsHotel, DbName.Postgres)
    private readonly mappingPmsHotelRepository: Repository<MappingPmsHotel>,

    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Booking, DbName.Postgres)
    private readonly bookingRepository: Repository<Booking>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,

    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {}

  async getPmsAccessToken(hotelId: string): Promise<Connector | null> {
    const dataConnector = await this.connectorRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.mappingPmsHotel', 'mph')
      .where('mph.hotel_id = :hotelId', { hotelId })
      .select(['c.refreshToken', 'c.connectorType', 'mph.mappingHotelCode'])
      .getOne();

    if (!dataConnector) {
      this.logger.warn(`Connector not found with ${hotelId}`);
      return null;
    }

    return dataConnector;
  }

  async getPmsConnector(filter: {
    hotelId?: string;
    mappingHotelCode?: string;
  }): Promise<Connector> {
    if (!filter.hotelId && !filter.mappingHotelCode) {
      throw new BadRequestException('Hotel id and mapping hotel code are required');
    }

    const qb = this.connectorRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.mappingPmsHotel', 'mph')
      .select(['c.refreshToken', 'c.connectorType', 'mph.mappingHotelCode', 'c.hotelId']);

    if (filter.hotelId) {
      qb.where('mph.hotel_id = :hotelId', { hotelId: filter.hotelId });
    }

    if (filter.mappingHotelCode) {
      qb.where('mph.mapping_hotel_code = :mappingHotelCode', {
        mappingHotelCode: filter.mappingHotelCode
      });
    }

    const dataConnector = await qb.getOne();

    if (!dataConnector) {
      throw new BadRequestException(`Connector not found`);
    }

    return dataConnector;
  }

  async getPmsConnectorList(filter: { hotelId: string }) {
    return this.connectorRepository.find({
      where: {
        hotelId: filter.hotelId
      }
    });
  }

  async getPmsConnectors(hotelIds: string[], relations: string[] = []) {
    try {
      const connectors = await this.connectorRepository.find({
        where: {
          hotelId: In(hotelIds)
        },
        relations: relations
      });
      return connectors;
    } catch (error) {
      this.logger.error(error.message);
      return [];
    }
  }

  async getPmsRoomProducts(hotelId: string): Promise<RoomProductMappingDto[]> {
    // get data connector
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }

    let pmsRoomProducts: RoomProductMappingDto[] = [];

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.MEWS: {
        // get configurator mews
        const configurator = await this.mewsServiceSettings.findOne({
          where: {
            hotelId
          }
        });

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        const response = await this.mewsService.getRoomProductList({
          ServiceIds: [configurator.serviceId],
          AccessToken: accessToken,
          timezone: configurator.timezone
        });

        pmsRoomProducts = response.map((item) => ({
          roomProductMappingPmsCode: item.Id,
          name: Object.values(item.Names)[0] || '',
          productCapacity: item.Capacity || 1,
          productExtraCapacity: item.ExtraCapacity || 0,
          productType: RoomProductType.MRFC, // productType pull from mews alway is MRFC
          description: item.Descriptions[Object.keys(item.Descriptions)[0]] || '',
          ordering: item.Ordering || 0,
          status: item.IsActive ? RoomProductStatus.ACTIVE : RoomProductStatus.INACTIVE,
          rawData: item
        }));

        // sort by ordering
        pmsRoomProducts.sort((a, b) => (a.ordering || 0) - (b.ordering || 0));

        return pmsRoomProducts;
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );

        // get unit groups (room products)
        const response = await this.apaleoService.getUnitGroups(apaleoAccessToken, {
          propertyId: mappingHotelCode,
          pageNumber: 1,
          pageSize: 200,
          expand: [ApaleoExpand.property]
        });

        if (response.count === 0) {
          this.logger.warn(`No room products found for property ${hotelId}`);
          return [];
        }

        pmsRoomProducts = (response.unitGroups || []).map((item) => ({
          roomProductMappingPmsCode: item.id,
          name: item.name || item.code || '',
          productCapacity: item.maxPersons || 0,
          productType: RoomProductType.MRFC,
          description: item.description || ''
        }));

        return pmsRoomProducts;
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return [];
    }
  }

  async getPmsRoomProductsAssignment(hotelId: string): Promise<any> {
    // get data connector
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      this.logger.warn(`Connector not found with ${hotelId}`);
      return [];
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.MEWS: {
        // get configurator mews
        const configurator = (await this.mewsServiceSettings.findOne({
          where: {
            hotelId
          }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        const response = await this.mewsService.getRoomProductAssignment({
          ServiceIds: [configurator.serviceId],
          AccessToken: accessToken,
          EnterpriseId: configurator.enterpriseId,
          timezone: configurator.timezone
        });

        return response;
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }

        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );

        // get room product assignments
        const response = await this.apaleoService.getUnits(apaleoAccessToken, {
          propertyId: mappingHotelCode,
          pageNumber: 1,
          pageSize: 200,
          expand: [ApaleoExpand.unitGroup]
        });

        const groupedByUnitGroup = Object.values(
          response.units
            .filter((item) => item.unitGroup?.id)
            .reduce(
              (acc, unit) => {
                const key = unit.unitGroup.id;
                if (!acc[key]) {
                  acc[key] = {
                    ...unit.unitGroup, // spread unitGroup fields at top level
                    units: []
                  };
                }
                acc[key].units.push(unit);
                return acc;
              },
              {} as Record<string, ApaleoUnitGroupDto & { units: ApaleoUnitListResponseDto[] }>
            )
        );

        return groupedByUnitGroup;
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return [];
    }
  }

  async getPmsRoomUnits(hotelId: string) {
    // get data connector
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }

    let pmsRoomUnits;

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.MEWS: {
        // get configurator mews
        const configurator = await this.mewsServiceSettings.findOne({
          where: {
            hotelId
          }
        });

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }
        const pmsRoomProducts = await this.mewsService.getRoomProductList({
          ServiceIds: [configurator.serviceId],
          AccessToken: accessToken,
          timezone: configurator.timezone
        });
        // for MEWS, we need get the space category first then filter out the room units that assigned to MEW Sservice (GVD Hotel)
        const roomProductCategoryAssignments =
          await this.mewsService.getRoomProductCategoryAssignments({
            ServiceId: configurator.serviceId,
            AccessToken: accessToken,
            EnterpriseId: configurator.enterpriseId,
            timezone: configurator.timezone,
            ResourceCategoryIds: pmsRoomProducts.map((item) => item.Id) || []
          });

        pmsRoomUnits = await this.mewsService.getRoomUnitList({
          AccessToken: accessToken,
          EnterpriseIds: [configurator.enterpriseId],
          ResourceIds: roomProductCategoryAssignments.map((item) => item.ResourceId) || []
        });

        const parseState = (state: string) => {
          switch (state) {
            case 'Dirty':
              return RoomUnitStatus.DIRTY;
            case 'Clean':
              return RoomUnitStatus.CLEAN;
            case 'Inspected':
              return RoomUnitStatus.INSPECTED;
            case 'OutOfService':
              return RoomUnitStatus.OUT_OF_SERVICE;
            case 'OutOfOrder':
              return RoomUnitStatus.OUT_OF_SERVICE;
            default:
              return RoomUnitStatus.CLEAN;
          }
        };

        const roomUnitMapping: RoomUnitMappingDto[] = pmsRoomUnits.map((item: MewsRoomUnitDto) => ({
          roomUnitMappingPmsCode: item.Id,
          name: item.Name,
          floor: item.Data.Value.FloorNumber,
          locationNotes: item.Data.Value.LocationNotes,
          status: parseState(item.State),
          rawData: item
        }));

        return roomUnitMapping || [];
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );

        // get units
        const response = await this.apaleoService.getUnits(apaleoAccessToken, {
          propertyId: mappingHotelCode,
          pageNumber: 1,
          pageSize: 200,
          expand: [ApaleoExpand.unitGroup]
        });

        const parseApaleoCondition = (condition: string) => {
          switch (condition) {
            case 'Dirty':
              return RoomUnitStatus.DIRTY;
            case 'Clean':
              return RoomUnitStatus.CLEAN;
            case 'CleanToBeInspected':
              return RoomUnitStatus.INSPECTED;
            default:
              return RoomUnitStatus.CLEAN;
          }
        };

        const roomUnitMapping: RoomUnitMappingDto[] = (response.units || []).map((item) => ({
          roomUnitMappingPmsCode: item.id,
          name: item.name,
          floor: '', // Apaleo doesn't seem to have floor info in the basic structure
          locationNotes: item.description || '',
          status: parseApaleoCondition(item.status?.condition || 'Clean'),
          roomProductMappingPmsCode: item.unitGroup?.id || ''
        }));

        return roomUnitMapping || [];
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return [];
    }
  }

  async getPmsRoomUnitsMaintenance(
    hotelId: string,
    startDate: string,
    endDate: string,
    mappingHotelCode?: string
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    // get data connector
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }

    let pmsRoomUnitMaintenance;

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.MEWS: {
        // get configurator mews
        const configurator = (await this.mewsServiceSettings.findOne({
          where: {
            hotelId
          }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        pmsRoomUnitMaintenance = await this.mewsService.getRoomUnitMaintenanceList({
          ServiceIds: [configurator.serviceId],
          AccessToken: accessToken,
          EnterpriseId: configurator.enterpriseId,
          Extent: {
            Inactive: false
          },
          StartDate: startDate,
          EndDate: endDate,
          timezone: configurator.timezone
        });

        const parseType = (type: string) => {
          switch (type) {
            case 'OutOfOrder':
            case 'InternalUse':
              return RoomUnitAvailabilityStatus.OUT_OF_ORDER;
            default:
              return RoomUnitAvailabilityStatus.AVAILABLE;
          }
        };

        const roomUnitMaintenanceMapping: RoomUnitMaintenanceMappingDto[] =
          pmsRoomUnitMaintenance.map((item: MewsRoomUnitMaintenanceDto) => ({
            roomUnitMappingPmsCode: item.AssignedResourceId,
            dates: Helper.generateDateRange(item.StartUtc, item.EndUtc),
            type: parseType(item.Type)
          }));

        return roomUnitMaintenanceMapping || [];
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        if (!mappingHotelCode) {
          return [];
        }

        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );
        if (!apaleoAccessToken) {
          return [];
        }

        const queryParams = new URLSearchParams();
        queryParams.append('expand', 'unit');
        queryParams.append('from', startDate);
        queryParams.append('to', endDate);
        queryParams.append('propertyId', mappingHotelCode);
        const data = await this.apaleoService.getApaleoMaintenances(apaleoAccessToken, queryParams);
        const parseType = (type: ApaleoMaintenanceType): RoomUnitAvailabilityStatus => {
          switch (type) {
            case ApaleoMaintenanceType.OutOfService:
              return RoomUnitAvailabilityStatus.OUT_OF_ORDER;
            case ApaleoMaintenanceType.OutOfOrder:
              return RoomUnitAvailabilityStatus.OUT_OF_ORDER;
            case ApaleoMaintenanceType.OutOfInventory:
              return RoomUnitAvailabilityStatus.OUT_OF_INVENTORY;
            default:
              return RoomUnitAvailabilityStatus.AVAILABLE;
          }
        };
        pmsRoomUnitMaintenance =
          data?.map((item) => ({
            roomUnitMappingPmsCode: item.unit.id,
            from: item.from,
            to: item.to,
            type: parseType(item.type),
            maintenancePmsCode: item.id
          })) || [];
        return pmsRoomUnitMaintenance || [];
        // const apaleoAccessToken = await this.apaleoService.getAccessToken(accessToken, hotelId);
        // // get availability
        // const response = await this.apaleoService.getAvailabilityUnit(apaleoAccessToken, {
        //   propertyId: hotelId,
        //   from: startDate,
        //   to: endDate,
        //   onlySellable: true,
        //   pageNumber: 1,
        //   pageSize: 9350,
        //   expand: []
        // });
        // // Parse Apaleo availability response to match the expected format
        // const availability = this.apaleoService.parseApaleoMaintenance(response.units);
        // return availability;
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return [];
    }
  }

  async getPmsProductAvailability(hotelId: string, startDate: string, endDate: string) {
    // get hotel connector pms
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      this.logger.warn(`Connector not found with ${hotelId}`);
      return [];
    }

    const pms = dataConnector.connectorType;

    let availability: RoomProductAvailabilityMappingDto[] = [];

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        // get configurator mews
        const configurator = (await this.mewsServiceSettings.findOne({
          where: {
            hotelId
          }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        const body: BaseMewsBodyDto = {
          ServiceId: configurator.serviceId,
          StartDate: startDate,
          EndDate: endDate,
          AccessToken: dataConnector.refreshToken,
          timezone: configurator.timezone
        };

        const response = await this.mewsService.getRoomProductAvailability({
          ...body
        });
        availability = this.mewsService.parseMewsAvailability(response, configurator.timezone);

        return availability;
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          dataConnector.refreshToken,
          mappingHotelCode
        );

        // get availability
        const response = await this.apaleoService.getAvailability(apaleoAccessToken, {
          propertyId: mappingHotelCode,
          from: startDate,
          to: endDate,
          onlySellable: true,
          pageNumber: 1,
          pageSize: 200,
          expand: []
        });

        // Parse Apaleo availability response to match the expected format
        availability = this.apaleoService.parseApaleoAvailability(response.timeSlices);

        return availability;
      }

      default:
        this.logger.log('Not handle for with :', pms);
        return [];
    }
  }

  async getPmsRestriction(query: RestrictionQueryDto): Promise<RestrictionMappingDto[]> {
    // get hotel connector pms
    const { hotelId, startDate, endDate, mode, pmsRatePlanCodes } = query;

    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      if (!dataConnector) {
        throw new BadRequestException(`Connector not found with ${hotelId}`);
      }
    }

    const pms = dataConnector.connectorType;

    let restrictions: RestrictionMappingDto[] = [];

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        // get configurator mews
        const configurator = (await this.mewsServiceSettings.findOne({
          where: {
            hotelId
          }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        let field: string | undefined = undefined;
        if (mode) {
          field =
            mode === ModeEnumQuery.CREATED
              ? 'CreatedUtc'
              : mode === ModeEnumQuery.UPDATED
                ? 'UpdatedUtc'
                : 'CollidingUtc';
        }

        // for mews, handle The interval must not exceed 100D.
        const startDateMews = startDate;
        const endDateMews = endDate;
        if (differenceInDays(endDateMews, startDateMews) > 100) {
          throw new BadRequestException('For mews, the interval must not exceed 100D.');
        }

        // get restriction
        const body: BaseMewsBodyDto = {
          ServiceIds: [configurator.serviceId],
          AccessToken: dataConnector.refreshToken,
          Extent: {
            Inactive: false
          },
          StartDate: startDate,
          EndDate: endDate,
          Limitation: {
            Count: 1000
          },
          timezone: configurator.timezone,
          ...(field ? { field } : {})
        };

        restrictions = await this.mewsService.getRestrictionList({
          ...body
        });

        return restrictions;
      }

      case ConnectorTypeEnum.APALEO: {
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }

        if (!pmsRatePlanCodes?.length) {
          throw new BadRequestException(`PMS rate plan code not found with ${hotelId}`);
        }

        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          dataConnector.refreshToken,
          mappingHotelCode
        );

        // get hotel tz
        const hotel = await this.hotelRepository.findOne({
          where: {
            id: hotelId
          },
          select: ['timeZone']
        });
        if (!hotel) {
          throw new NotFoundException(`Hotel not found with ${hotelId}`);
        }
        const hotelTimeZone = hotel.timeZone;

        const pmsRatePlanCodesSet = Array.from(new Set(pmsRatePlanCodes));
        const allRestrictions: RestrictionMappingDto[] = [];
        const batchSize = 10;
        const MAX_PAGE_SIZE = 200;

        for (let i = 0; i < pmsRatePlanCodesSet.length; i += batchSize) {
          const batch = pmsRatePlanCodesSet.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (ratePlanCode) => {
              try {
                const ratePlanPricing = await this.apaleoService.getRatePlanPricing(
                  apaleoAccessToken,
                  ratePlanCode,
                  {
                    from: startDate,
                    to: endDate,
                    pageNumber: 1,
                    pageSize: MAX_PAGE_SIZE,
                    expand: []
                  }
                );

                const restrictions = this.apaleoService.parseApaleoRatePlanRestrictions(
                  ratePlanPricing.rates,
                  ratePlanCode,
                  hotelTimeZone
                );

                allRestrictions.push(...restrictions);
              } catch (err) {
                this.logger.warn(`Error fetching rate plan ${ratePlanCode}: ${err.message}`);
              }
            })
          );
        }

        return allRestrictions;
      }

      default:
        this.logger.log('Not handle for with :', pms);
        return [];
    }
  }

  async createPmsPropertyRestriction(
    hotelId: string,
    hotelRestrictionSettings: HotelRestrictionSetting[],
    roomProductMappingPms: RoomProductMappingPms[],
    restrictions: Restriction[]
  ) {
    if (!hotelId) {
      throw new BadRequestException('Hotel id is required');
    }

    // Step 1: Get hotel connector and configurator
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const pms = dataConnector.connectorType;

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        const configurator = (await this.mewsServiceSettings.findOne({
          where: { hotelId }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        // Step 5: Build and push restrictions to Mews
        const pushResult = await this.mewsService.pushRestrictionsToMews(
          restrictions,
          hotelRestrictionSettings,
          roomProductMappingPms,
          dataConnector.refreshToken,
          configurator.serviceId,
          configurator.timezone
        );

        return {
          // restrictions: body,
          pushResult
        };
      }

      default:
        this.logger.log('Not handled PMS type:', pms);
        return [];
    }
  }

  async createPmsRatePlanRestriction(hotelId: string, restrictions: RestrictionMappingDto[]) {
    // get hotel connector pms
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const pms = dataConnector.connectorType;

    switch (pms) {
      case ConnectorTypeEnum.APALEO: {
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }

        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          dataConnector.refreshToken,
          mappingHotelCode
        );

        const apaleoRestriction: ApaleoPatchRatesDto[] = restrictions.map((restriction) => ({
          fromDate: format(new Date(restriction.fromDate!), DATE_FORMAT),
          toDate: format(new Date(restriction.toDate!), DATE_FORMAT),
          pmsRatePlanId: restriction.ratePlanMappingPmsCode!,
          isCTA: restriction.type === RestrictionConditionType.ClosedToArrival,
          isCTD: restriction.type === RestrictionConditionType.ClosedToDeparture,
          isCTS: restriction.type === RestrictionConditionType.ClosedToStay,
          minLength: restriction.minLength ?? undefined,
          maxLength: restriction.maxLength ?? undefined
        }));

        await this.apaleoService.createRatePlanRestriction(apaleoAccessToken, apaleoRestriction);

        return true;
      }

      default:
        this.logger.log('Not handle for with :', pms);
        return [];
    }
  }

  async clearPmsPropertyRestriction(
    hotelId: string,
    restrictions: Restriction[],
    roomProductMappingPms: RoomProductMappingPms[]
  ) {
    // get hotel connector pms
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const pms = dataConnector.connectorType;

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        const configurator = (await this.mewsServiceSettings.findOne({
          where: { hotelId }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        const body: BaseMewsBodyDto = {
          AccessToken: dataConnector.refreshToken,
          ServiceId: configurator.serviceId,
          timezone: configurator.timezone
        };

        const response = await this.mewsService.clearMewsRestrictions(
          body,
          restrictions,
          roomProductMappingPms
        );

        return response;
      }

      default:
        this.logger.log('Not handle for with :', pms);
        return [];
    }
  }

  async getPmsRatePlanPricing(query: RatePlanPricingQueryDto) {
    // get hotel connector pms
    const { hotelId, startDate, endDate, ratePlanMappingPmsCode } = query;

    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      if (!dataConnector) {
        throw new BadRequestException(`Connector not found with ${hotelId}`);
      }
    }

    const pms = dataConnector.connectorType;

    let ratePlanPricing: RatePlanPricingMappingDto[] = [];

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        const configurator = (await this.mewsServiceSettings.findOne({
          where: { hotelId }
        })) as MewsServiceSettings;

        if (!configurator?.enterpriseId) {
          throw new NotFoundException(`configurator not found with property id ${hotelId}`);
        }

        const body: BaseMewsBodyDto = {
          AccessToken: dataConnector.refreshToken,
          ServiceId: configurator.serviceId,
          timezone: configurator.timezone,
          Pricing: configurator.propertyPricingSetting as 'Gross' | 'Net',
          RateId: ratePlanMappingPmsCode,
          StartDate: startDate,
          EndDate: endDate
        };

        ratePlanPricing = await this.mewsService.getRatePlanPricingMapped(
          body,
          ratePlanMappingPmsCode
        );

        return ratePlanPricing;
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          dataConnector.refreshToken,
          mappingHotelCode
        );

        const [rates, ratePlan] = await Promise.all([
          // get rate plan pricing
          this.apaleoService.getRatePlanPricing(apaleoAccessToken, ratePlanMappingPmsCode, {
            from: startDate,
            to: endDate,
            pageNumber: 1,
            pageSize: 200,
            expand: []
          }),

          // get rate plan list
          this.apaleoService.getRatePlans(apaleoAccessToken, {
            propertyId: mappingHotelCode,
            pageNumber: 1,
            pageSize: 200,
            expand: [ApaleoExpand.unitGroup, ApaleoExpand.cancellationPolicy]
          })
        ]);

        // for apaleo pms, mapping 1:1 rateplanCode and roomProductCode
        const unitGroupId = ratePlan.ratePlans.find(
          (ratePlan: ApaleoRatePlanDto) => ratePlan.id === ratePlanMappingPmsCode
        )?.unitGroup.id;

        // Parse Apaleo rate plan pricing to match the expected format
        ratePlanPricing = this.apaleoService.parseApaleoRatePlanPricing(
          rates.rates,
          ratePlanMappingPmsCode,
          unitGroupId
        );

        return ratePlanPricing;
      }

      default:
        this.logger.log('Not handle for with :', pms);
        return [];
    }
  }

  async updateRatePlanService(
    hotelId: string,
    availability: AmenityAvailabilityEnum,
    serviceId: string
  ) {
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      if (!dataConnector) {
        throw new BadRequestException(`Connector not found with ${hotelId}`);
      }
    }

    const pms = dataConnector.connectorType;

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        break;
      }

      case ConnectorTypeEnum.APALEO: {
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }

        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          dataConnector.refreshToken,
          mappingHotelCode
        );

        const value = ApaleoUtil.mapAmenityAvailabilityToApaleoMode(availability);

        await this.apaleoService.patchRatePlanService({
          accessToken: apaleoAccessToken,
          body: [
            {
              from: '', // apaleo ignored
              op: 'replace',
              path: '/availability/mode',
              value: value
            }
          ],
          serviceId
        });
        break;
      }

      default:
        this.logger.log('Not handle for with :', pms);
    }
  }

  async pushPmsRatePlanPricing(hotelId: string, ratePlanPricing: RatePlanPricingPushDto[]) {
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector?.connectorType) {
      if (!dataConnector) {
        throw new BadRequestException(`Connector not found with ${hotelId}`);
      }
    }

    const pms = dataConnector.connectorType;

    switch (pms) {
      case ConnectorTypeEnum.MEWS: {
        break;
        return [];
      }

      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          dataConnector.refreshToken,
          mappingHotelCode
        );

        const ratePlanPricingMap = groupByToMap(
          ratePlanPricing,
          (item) => item.ratePlanMappingPmsCode
        );

        const results: any[] = [];
        for (const [ratePlanMappingPmsCode, pricing] of ratePlanPricingMap.entries()) {
          if (pricing.length === 0) {
            continue;
          }

          const pricingGroupByDate = groupByToMapSingle(pricing, (item) => item.date);

          const fromDate = pricing[0].date;
          const toDate = pricing[pricing.length - 1].date;
          const pricingFromApaleo = await this.apaleoService.getRatePlanPricing(
            apaleoAccessToken,
            ratePlanMappingPmsCode,
            {
              from: fromDate,
              to: toDate,
              pageNumber: 1,
              pageSize: 200,
              expand: []
            }
          );

          const ratesFromApaleo = structuredClone(pricingFromApaleo.rates);

          for (const rateFromApaleo of ratesFromApaleo) {
            const currentDate = formatDate(rateFromApaleo.from, DATE_FORMAT);
            const currentPricing = pricingGroupByDate.get(currentDate);
            if (currentPricing) {
              if (rateFromApaleo.price) {
                rateFromApaleo.price.amount = currentPricing.price;
              } else {
                rateFromApaleo.price = {
                  amount: currentPricing.price,
                  currency: currentPricing.currency
                };
              }
            }
          }
          const result = await this.apaleoService.putRatePlanPricing(
            apaleoAccessToken,
            ratePlanMappingPmsCode,
            ratesFromApaleo
          );
          results.push(result);
        }

        return [];
      }

      default:
        this.logger.log('Not handle for with :', pms);
        return [];
    }
  }

  async getPmsRatePlan(input: {
    hotelId: string;
    ratePlanId?: string;
    mappingRatePlanCodes?: string[];
    isRefreshData?: boolean;
  }): Promise<
    {
      ratePlanMappingPmsCode: string;
      name: string;
      code: string;
      description: string;
      metadata: any;
    }[]
  > {
    try {
      const { hotelId, ratePlanId, mappingRatePlanCodes, isRefreshData } = input;

      // let isHasDerived = false;

      // get data connector
      const dataConnector = await this.getPmsAccessToken(hotelId);

      if (!dataConnector) {
        throw new BadRequestException(`Connector not found with ${hotelId}`);
      }

      const accessToken = dataConnector.refreshToken;

      if (!accessToken) {
        throw new BadRequestException(`Access token not found with property id ${hotelId}`);
      }

      switch (dataConnector.connectorType) {
        case ConnectorTypeEnum.MEWS: {
          // get configurator mews
          const configurator = (await this.mewsServiceSettings.findOne({
            where: {
              hotelId
            }
          })) as MewsServiceSettings;

          if (!configurator?.enterpriseId) {
            throw new NotFoundException(`configurator not found with property id ${hotelId}`);
          }

          const response = await this.mewsService.getRatePlan({
            ServiceIds: [configurator.serviceId],
            AccessToken: accessToken
          });

          // Map to the expected format
          const ratePlans = (response || []).map((item) => ({
            ratePlanMappingPmsCode: item.metadata.Id,
            name: item.metadata.Name as string,
            code: item.metadata.ShortName || (item.metadata.Name as string),
            description: (Object.values(item.metadata.Description || {})[0] as string) || '',
            metadata: item.metadata
          }));

          return ratePlans;
        }

        case ConnectorTypeEnum.APALEO: {
          // get access token for apaleo
          const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
          if (!mappingHotelCode) {
            throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
          }
          const apaleoAccessToken = await this.apaleoService.getAccessToken(
            accessToken,
            mappingHotelCode
          );

          // get rate plans
          const response = await this.apaleoService.getRatePlans(apaleoAccessToken, {
            propertyId: mappingHotelCode,
            // isDerived: false,
            pageNumber: 1,
            pageSize: 200,
            expand: [ApaleoExpand.unitGroup, ApaleoExpand.cancellationPolicy]
          });

          // Map to the expected format
          const ratePlans = (response.ratePlans || []).map((item: ApaleoRatePlanDto) => ({
            ratePlanMappingPmsCode: item.id,
            name: item.name,
            code: item.code,
            description: item.description,
            metadata: item
          }));

          return ratePlans;
        }

        default:
          this.logger.log('Not handle for with :', dataConnector.connectorType);
          return [];
      }
    } catch (error) {
      this.logger.error('Error in getPmsRatePlans:', error);
      return [];
    }
  }

  async getPmsReservations(filter: ReservationPmsFilterDto) {
    // return {
    //   reservations: [
    //     {
    //       id: "QFLKHEHB-1",
    //       bookingId: "QFLKHEHB",
    //       status: "Confirmed",
    //       property: {
    //         id: "APALEOTEST",
    //         code: "APALEOTEST",
    //         name: "DemoStay Berlin",
    //       },
    //       ratePlan: {
    //         id: "APALEOTEST-PERSONALIZED-PERSONAL",
    //         code: "PERSONALIZED",
    //         name: "00 Personalized Flexible ",
    //         description: "Personalized",
    //         isSubjectToCityTax: true,
    //       },
    //       unitGroup: {
    //         id: "APALEOTEST-PERSONAL",
    //         code: "PERSONAL",
    //         name: "Personalized Room",
    //         description: "Personalized Room",
    //         type: "BedRoom",
    //       },
    //       unit: {
    //         id: "APALEOTEST-RPL",
    //         name: "25",
    //         description: "25",
    //         unitGroupId: "APALEOTEST-MRFC0001",
    //       },
    //       totalGrossAmount: {
    //         amount: 371,
    //         currency: "USD",
    //       },
    //       arrival: "2025-12-29T14:00:00+01:00",
    //       departure: "2025-12-30T12:00:00+01:00",
    //       created: "2025-12-08T05:52:48+01:00",
    //       modified: "2025-12-08T05:52:49+01:00",
    //       adults: 2,
    //       guestComment: "***IMPORTANT***\nBooking Source: Website\nChannel: Sales Engine\nBooking Flow: Direct\nGuest Language: EN\nProduct Name: MRFC#0001 (5 RFC Products)\nProduct Code: MRFC006\nGuaranteed Unit Features: Size 3, Bunk bed, Double bed, Villa, Size 2, Size 5, Size 6\nAlternative Units to be Assigned: (#24, #26, #27, #28, #29, #30, #31)\nAssigned Unit Locked: No\nTrip Purpose: Leisure",
    //       externalCode: "176516956707001",
    //       channelCode: "Ibe",
    //       primaryGuest: {
    //         firstName: "Testing",
    //         lastName: "Testing",
    //         email: "testingqa@gmail.com",
    //         phone: "+84123456789",
    //         address: {
    //           addressLine1: "123 Apt Main Street",
    //           postalCode: "1756",
    //           city: "Los Angeles",
    //           countryCode: "VN",
    //         },
    //       },
    //       booker: {
    //         firstName: "Testing",
    //         lastName: "Testing",
    //         email: "testingqa@gmail.com",
    //         phone: "+84123456789",
    //         address: {
    //           addressLine1: "123 Apt Main Street",
    //           postalCode: "1756",
    //           city: "Los Angeles",
    //           countryCode: "VN",
    //         },
    //       },
    //       guaranteeType: "CreditCard",
    //       cancellationFee: {
    //         id: "APALEOTEST-FLEX",
    //         code: "FLEX",
    //         name: "Flexible",
    //         description: "Free cancellation until check-in",
    //         dueDateTime: "2025-12-29T14:00:00+01:00",
    //         fee: {
    //           amount: 256,
    //           currency: "USD",
    //         },
    //       },
    //       noShowFee: {
    //         id: "APALEOTEST-NONREF",
    //         code: "NONREF",
    //         name: "Non Refundable",
    //         description: "No free no-show",
    //         fee: {
    //           amount: 256,
    //           currency: "USD",
    //         },
    //       },
    //       travelPurpose: "Leisure",
    //       balance: {
    //         amount: -391,
    //         currency: "USD",
    //       },
    //       assignedUnits: [
    //         {
    //           unit: {
    //             id: "APALEOTEST-RPL",
    //             name: "25",
    //             description: "25",
    //             unitGroupId: "APALEOTEST-MRFC0001",
    //           },
    //           timeRanges: [
    //             {
    //               from: "2025-12-29T14:00:00+01:00",
    //               to: "2025-12-30T12:00:00+01:00",
    //             },
    //           ],
    //         },
    //       ],
    //       timeSlices: [
    //         {
    //           from: "2025-12-29T14:00:00+01:00",
    //           to: "2025-12-30T12:00:00+01:00",
    //           serviceDate: "2025-12-29",
    //           ratePlan: {
    //             id: "APALEOTEST-PERSONALIZED-PERSONAL",
    //             code: "PERSONALIZED",
    //             name: "00 Personalized Flexible ",
    //             description: "Personalized",
    //             isSubjectToCityTax: true,
    //           },
    //           unitGroup: {
    //             id: "APALEOTEST-PERSONAL",
    //             code: "PERSONAL",
    //             name: "Personalized Room",
    //             description: "Personalized Room",
    //             type: "BedRoom",
    //           },
    //           unit: {
    //             id: "APALEOTEST-RPL",
    //             name: "25",
    //             description: "25",
    //             unitGroupId: "APALEOTEST-MRFC0001",
    //           },
    //           baseAmount: {
    //             grossAmount: 256,
    //             netAmount: 256,
    //             vatType: "Null",
    //             vatPercent: 0,
    //             currency: "USD",
    //           },
    //           totalGrossAmount: {
    //             amount: 256,
    //             currency: "USD",
    //           },
    //           actions: [
    //             {
    //               action: "Amend",
    //               isAllowed: true,
    //             },
    //           ],
    //         },
    //       ],
    //       services: [
    //         {
    //           service: {
    //             id: "APALEOTEST-CLEAN100",
    //             code: "CLEAN100",
    //             name: "Final Cleaning 100",
    //             description: "100",
    //             pricingUnit: "Room",
    //             defaultGrossPrice: {
    //               amount: 100,
    //               currency: "USD",
    //             },
    //           },
    //           totalAmount: {
    //             grossAmount: 100,
    //             netAmount: 93.46,
    //             vatType: "Reduced",
    //             vatPercent: 7,
    //             currency: "USD",
    //           },
    //           dates: [
    //             {
    //               serviceDate: "2025-12-29",
    //               count: 2,
    //               amount: {
    //                 grossAmount: 100,
    //                 netAmount: 93.46,
    //                 vatType: "Reduced",
    //                 vatPercent: 7,
    //                 currency: "USD",
    //               },
    //               isMandatory: false,
    //             },
    //           ],
    //         },
    //         {
    //           service: {
    //             id: "APALEOTEST-PARKING",
    //             code: "PARKING",
    //             name: "PARKING",
    //             description: "PARKING",
    //             pricingUnit: "Room",
    //             defaultGrossPrice: {
    //               amount: 15,
    //               currency: "USD",
    //             },
    //           },
    //           totalAmount: {
    //             grossAmount: 15,
    //             netAmount: 14.02,
    //             vatType: "Reduced",
    //             vatPercent: 7,
    //             currency: "USD",
    //           },
    //           dates: [
    //             {
    //               serviceDate: "2025-12-29",
    //               count: 2,
    //               amount: {
    //                 grossAmount: 15,
    //                 netAmount: 14.02,
    //                 vatType: "Reduced",
    //                 vatPercent: 7,
    //                 currency: "USD",
    //               },
    //               isMandatory: false,
    //             },
    //           ],
    //         },
    //       ],
    //       validationMessages: [
    //         {
    //           category: "OfferNotAvailable",
    //           code: "UnitGroupFullyBooked",
    //           message: "The unit group is already fully booked",
    //         },
    //       ],
    //       actions: [
    //         {
    //           action: "AmendArrival",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "AssignUnit",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "Cancel",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "LockUnit",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "RemoveCityTax",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "RemoveService",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "UnassignUnit",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "UnlockUnit",
    //           isAllowed: false,
    //           reasons: [
    //             {
    //               code: "UnlockUnitNotAllowedForReservationNotLocked",
    //               message: "Cannot unlock units for a reservation which is not locked.",
    //             },
    //           ],
    //         },
    //         {
    //           action: "AddCityTax",
    //           isAllowed: false,
    //           reasons: [
    //             {
    //               code: "AddCityTaxNotAllowedForReservationWithCityTax",
    //               message: "Cannot add the city tax to a reservation with city tax.",
    //             },
    //           ],
    //         },
    //         {
    //           action: "AmendDeparture",
    //           isAllowed: true,
    //         },
    //         {
    //           action: "CheckIn",
    //           isAllowed: false,
    //           reasons: [
    //             {
    //               code: "CheckInNotAllowedBeforeArrivalDate",
    //               message: "Cannot check-in a reservation before the arrival date.",
    //             },
    //           ],
    //         },
    //         {
    //           action: "CheckInRevert",
    //           isAllowed: false,
    //           reasons: [
    //             {
    //               code: "CheckInRevertNotAllowedForReservationNotInInHouseStatus",
    //               message: "Cannot revert check-in for a reservation which is not in status 'InHouse'.",
    //             },
    //           ],
    //         },
    //         {
    //           action: "CheckOut",
    //           isAllowed: false,
    //           reasons: [
    //             {
    //               code: "CheckOutNotAllowedForReservationNotInStatusInHouse",
    //               message: "Cannot check-out a reservation which is not in status 'InHouse'.",
    //             },
    //           ],
    //         },
    //         {
    //           action: "NoShow",
    //           isAllowed: false,
    //           reasons: [
    //             {
    //               code: "NoShowNotAllowedBeforeArrivalDate",
    //               message: "Cannot set a reservation to No-show before the arrival date.",
    //             },
    //           ],
    //         },
    //         {
    //           action: "AmendTimeSlices",
    //           isAllowed: true,
    //         },
    //       ],
    //       allFoliosHaveInvoice: false,
    //       hasCityTax: true,
    //       isPreCheckedIn: false,
    //       isOpenForCharges: true,
    //       cityTaxCharges: [
    //         {
    //           id: "QFLKHEHB-1-CITYTAX-1-1",
    //           serviceType: "CityTax",
    //           name: "CITYTAX10",
    //           translatedNames: {
    //             de: "CITYTAX10",
    //             en: "CITYTAX10",
    //           },
    //           isPosted: false,
    //           serviceDate: "2025-12-29",
    //           created: "2025-12-08T04:52:48.620572Z",
    //           amount: {
    //             grossAmount: 20,
    //             netAmount: 20,
    //             vatType: "Without",
    //             vatPercent: 0,
    //             currency: "USD",
    //           },
    //           quantity: 2,
    //           type: "CityTax",
    //         },
    //       ],
    //     }
    //   ],
    //   pmsType: ConnectorTypeEnum.APALEO
    // }
    const { hotelId, dateFilter, fromDate, toDate } = filter;
    // get data connector
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      this.logger.warn(`Connector not found with ${hotelId}`);
      return { reservations: [], pmsType: null };
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      this.logger.warn(`Access token not found with property id ${hotelId}`);
      return { reservations: [], pmsType: null };
    }

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );

        // get bookings
        const queryParams = new URLSearchParams();
        const expand = ['booker', 'actions', 'timeSlices', 'services', 'assignedUnits', 'company'];
        expand.forEach((item) => queryParams.append('expand', item));
        queryParams.append('dateFilter', dateFilter);
        queryParams.append('propertyIds', mappingHotelCode);

        // Format dates to ISO8601:2004 format for Apaleo API
        const formattedFromDate = format(parseISO(fromDate), DATE_TIME_ISO8601);
        const formattedToDate = format(parseISO(toDate), DATE_TIME_ISO8601);

        queryParams.append('from', formattedFromDate);
        queryParams.append('to', formattedToDate);
        const response = await this.apaleoService.getApaleoReservations(
          apaleoAccessToken,
          queryParams
        );
        return { reservations: response?.reservations, pmsType: ConnectorTypeEnum.APALEO };
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return { reservations: [], pmsType: dataConnector.connectorType };
    }
  }

  async getPmsBooking(filter: { hotelId: string; bookingId: string }) {
    const { hotelId, bookingId } = filter;
    // get data connector
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );

        // get booking
        const queryParams = new URLSearchParams();
        queryParams.append('bookingId', bookingId);

        const response = await this.apaleoService.getApaleoBooking(apaleoAccessToken, queryParams);
        return { booking: response, pmsType: ConnectorTypeEnum.APALEO };
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return { booking: null, pmsType: dataConnector.connectorType };
    }
  }

  async cancelPmsReservation(hotelId: string, reservationId: string) {
    const dataConnector = await this.getPmsAccessToken(hotelId);

    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }

    const accessToken = dataConnector.refreshToken;

    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }

    switch (dataConnector.connectorType) {
      case ConnectorTypeEnum.APALEO: {
        // get access token for apaleo
        const mappingHotelCode = dataConnector.mappingPmsHotel[0].mappingHotelCode;
        if (!mappingHotelCode) {
          throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
        }
        const apaleoAccessToken = await this.apaleoService.getAccessToken(
          accessToken,
          mappingHotelCode
        );

        const response = await this.apaleoService.cancelApaleoReservation(
          apaleoAccessToken,
          reservationId
        );
        return { message: response?.message, pmsType: ConnectorTypeEnum.APALEO };
      }

      default:
        this.logger.log('Not handle for with :', dataConnector.connectorType);
        return { message: null, pmsType: dataConnector.connectorType };
    }
  }

  async pushReservationToPms(body: ReservationsCreatePmsDto) {
    const { bookingId, hotelId, isProposalBooking } = body;
    const [booking, reservations, hotel, connector] = await Promise.all([
      this.bookingRepository.findOne({
        where: { id: bookingId, hotelId: hotelId },
        relations: {
          booker: true,
          reservations: true
        }
      }),
      this.reservationRepository.find({
        where: { bookingId },
        relations: {
          reservationTimeSlices: true
        }
      }),
      this.hotelRepository.findOne({
        where: { id: hotelId },
        relations: {
          baseCurrency: true
        }
      }),
      this.connectorRepository.findOne({
        where: { hotelId },
        relations: {
          mappingPmsHotel: true
        }
      })
    ]);
    if (!booking || !hotel || !connector) {
      this.logger.warn(`Booking ${bookingId} not found`);
      return;
    }

    const roomProductList =
      reservations?.map((reservation) => {
        let roomIds =
          reservation.reservationTimeSlices
            ?.flatMap((room) => room.roomId ?? '')
            .filter((room) => !!room) || [];
        roomIds = [...new Set(roomIds)];
        const newItem: any = {
          roomProductId: reservation.roomProductId ?? '',
          roomProductName: null,
          roomProductCode: null,
          isErfcDeduct: null,
          roomIds: roomIds
        };
        return newItem;
      }) ?? [];
    const input: ReservationsCreatePmsInput = {
      booking,
      connector,
      booker: booking.booker,
      roomProductList: roomProductList,
      hotel,
      reservationTimeSlices: reservations.flatMap(
        (reservation) => reservation.reservationTimeSlices
      ),
      isProposalBooking,
      currencyCode: hotel.baseCurrency?.code
    };

    const connectorType = connector?.connectorType;
    if (!(connectorType && connector.refreshToken)) {
      this.logger.warn('Connector not found');
      return;
    }

    switch (connectorType) {
      case ConnectorTypeEnum.MEWS:
        return this.mewsPmsService.createReservationForMews(input);
      case ConnectorTypeEnum.APALEO:
        if (input.booking.mappingBookingCode) {
          return this.apaleoPmsService.updateReservationForApaleo(input);
        }
        return this.apaleoPmsService.createReservationForApaleo(input);
      default:
        this.logger.warn(`Connector type ${connectorType} not supported`);
        return;
    }
  }

  async registerApaleoWebhook(hotelId: string, webhookUrl: string) {
    const dataConnector = await this.getPmsAccessToken(hotelId);

    const mappingHotelCode = dataConnector?.mappingPmsHotel[0].mappingHotelCode;
    if (!mappingHotelCode) {
      throw new BadRequestException(`Mapping hotel code not found with ${hotelId}`);
    }

    const accessToken = await this.apaleoService.getAccessToken(
      dataConnector.refreshToken,
      mappingHotelCode
    );

    const subscriptions = await this.apaleoService.getApaleoSubscriptions({ accessToken });
    const existingSubscription = subscriptions?.find(
      (subscription: any) => subscription.endpointUrl === webhookUrl
    );
    const payload = {
      endpointUrl: webhookUrl,
      events: APALEO_WEBHOOK_EVENTS,
      propertyIds: [mappingHotelCode]
    };
    this.logger.log(
      `🚀 ~ PmsService ~ registerApaleoWebhook ~ existingSubscription: ${JSON.stringify(existingSubscription)}`
    );

    if (existingSubscription) {
      return await this.apaleoService.updateApaleoSubscriptions({
        accessToken,
        subscriptionId: existingSubscription.id,
        payload
      });
    }

    return await this.apaleoService.registerApaleWebhook({
      payload,
      accessToken
    });
  }

  /**
   * Sync PMS Amenity (if pass mappingEntityCode, the list will filter exactly service from the pms)
   * @param mappingHotelCode
   * @param mappingEntityCode
   * @returns
   */
  async syncPmsAmenities(mappingHotelCode: string, mappingEntityCode?: string) {
    const dataConnector = await this.getPmsConnector({
      mappingHotelCode: mappingHotelCode
    });

    const refreshToken = dataConnector.refreshToken;

    const connectorType = dataConnector.connectorType;

    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        const accessToken = await this.apaleoService.getAccessToken(refreshToken, mappingHotelCode);
        const data = await this.apaleoService.getServices(accessToken, {
          propertyId: mappingHotelCode,
          onlySoldAsExtras: false,
          serviceTypes: [],
          pageNumber: 1,
          pageSize: 9999,
          expand: []
        });

        const services = (data?.services || [])
          ?.map((item) => ({
            code: item.code,
            mappingHotelAmenityCode: item.id,
            description: item.description,
            name: item.name,
            availability: ApaleoUtil.mapApaleoModeToAmenityAvailability(item.availability?.mode)
          }))
          .filter((item) => {
            if (mappingEntityCode) {
              return item.mappingHotelAmenityCode === mappingEntityCode;
            }
            return true;
          });

        if (services?.length > 0) {
          const servicesToUpdate = services.filter((s) => s.mappingHotelAmenityCode);

          if (servicesToUpdate.length > 0) {
            const qb = this.hotelAmenityRepository.createQueryBuilder();

            let availabilityCase = 'CASE mapping_hotel_amenity_code';
            let nameCase = 'CASE mapping_hotel_amenity_code';
            let descriptionCase = 'CASE mapping_hotel_amenity_code';

            const parameters: any = {};
            const codes: string[] = [];

            servicesToUpdate.forEach((service, index) => {
              const pCode = `code${index}`;
              const pAvail = `avail${index}`;
              const pName = `name${index}`;
              const pDesc = `desc${index}`;

              parameters[pCode] = service.mappingHotelAmenityCode;
              parameters[pAvail] = service.availability;
              parameters[pName] = service.name;
              parameters[pDesc] = service.description;

              codes.push(service.mappingHotelAmenityCode);

              availabilityCase += ` WHEN :${pCode} THEN :${pAvail}`;
              nameCase += ` WHEN :${pCode} THEN :${pName}`;
              descriptionCase += ` WHEN :${pCode} THEN :${pDesc}`;
            });

            availabilityCase += ' ELSE availability END';
            nameCase += ' ELSE name END';
            descriptionCase += ' ELSE description END';

            await qb
              .update(HotelAmenity)
              .set({
                availability: () => availabilityCase,
                name: () => nameCase,
                description: () => descriptionCase
              })
              .where(`mapping_hotel_amenity_code IN (:...codes)`, { codes })
              .setParameters(parameters)
              .execute();

            this.logger.log(
              `Updated ${servicesToUpdate.map((e) => e.mappingHotelAmenityCode).join(', ')} amenities`
            );
          }
        }
        break;
      }

      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return [];
    }
  }

  async getPmsAmenityList(hotelId: string) {
    const dataConnector = await this.getConnector(hotelId);
    const connectorType = dataConnector.connectorType;
    let services: any[] = [];

    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        const { accessToken } = await this.getConnectorAndAccessToken(hotelId);
        const data = await this.apaleoService.getServices(accessToken, {
          propertyId: dataConnector.mappingPmsHotel[0].mappingHotelCode,
          onlySoldAsExtras: false,
          serviceTypes: [],
          pageNumber: 1,
          pageSize: 200,
          expand: []
        });
        services = (data?.services || [])?.map((item) => ({
          code: item.code,
          description: item.description,
          mappingHotelAmenityCode: item.id,
          name: item.name
        }));
        break;
      }
      case ConnectorTypeEnum.MEWS: {
        const accessToken = dataConnector.refreshToken;

        // Get MEWS service settings to get serviceId
        const serviceSetting = await this.mewsServiceSettings.findOne({
          where: {
            hotelId: hotelId
          }
        });

        if (!serviceSetting?.serviceId) {
          this.logger.warn(`Service setting not found for hotel ${hotelId}`);
          break;
        }

        // Get products from MEWS API
        const products = await this.mewsPmsService.getMewsProducts(accessToken, [
          serviceSetting.serviceId
        ]);

        // Filter only active products
        // Note: Following Java implementation - both cityTaxList and amenities use the same
        // ProductListFetcher which returns all active products without filtering by type.
        // The distinction between city taxes and amenities is handled at a higher level.
        const activeProducts = products.filter((product) => product.IsActive === true);

        // Map products to amenity format
        services = activeProducts.map((product) => {
          // Get name - prefer Name, then ExternalName, then ShortName
          const name = product.Name || product.ExternalName || product.ShortName || product.Id;

          // Get code - from ShortName or Id
          const code = product.ShortName || product.Id;

          // Get description
          const description = product.Description || '';

          return {
            mappingHotelAmenityCode: product.Id,
            name: name,
            code: code,
            description: description
          };
        });
        break;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return [];
    }

    return services;
  }

  async getPmsTaxList(hotelId: string) {
    const dataConnector = await this.getConnector(hotelId);
    const connectorType = dataConnector.connectorType;
    const accessToken = dataConnector.refreshToken;
    const hotel = await this.hotelRepository.findOne({
      where: {
        id: hotelId
      },
      select: {
        country: {
          code: true
        }
      },
      relations: ['country']
    });
    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        let taxes: any[] = [];
        const data = await this.apaleoService.getApaleoTaxes(accessToken, {
          isoCountryCode: hotel?.country?.code ?? ''
        });
        taxes = (data?.vatTypes || [])?.map((item) => ({
          code: item.type,
          name: null,
          unit: 'PERCENTAGE',
          value: DecimalRoundingHelper.conditionalRounding(
            item.percent / 100,
            RoundingModeEnum.HALF_ROUND_UP,
            2
          )
        }));
        return taxes;
      }
      case ConnectorTypeEnum.MEWS: {
        // Get configuration to extract taxEnvironmentCode (following Java logic)
        const configuration = await this.mewsService.getConfiguration(accessToken);
        if (!configuration || !configuration.Enterprise) {
          this.logger.warn(`Configuration or Enterprise not found for hotel ${hotelId}`);
          return [];
        }

        const taxEnvironmentCode = configuration.Enterprise.TaxEnvironmentCode;
        if (!taxEnvironmentCode) {
          this.logger.warn(`TaxEnvironmentCode not found in configuration for hotel ${hotelId}`);
          return [];
        }

        // Get tax environments and taxations
        const taxEnvironmentList = await this.mewsPmsService.getMewsTaxEnvironments(accessToken);
        const taxationResponse = await this.mewsPmsService.getMewsTaxations(accessToken);

        if (!taxEnvironmentList || taxEnvironmentList.length === 0) {
          this.logger.warn(`Tax environment list is empty for hotel ${hotelId}`);
          return [];
        }

        // Filter tax environment by taxEnvironmentCode (following Java logic)
        const taxEnvironment = taxEnvironmentList.find((env) => env.Code === taxEnvironmentCode);

        if (!taxEnvironment) {
          this.logger.warn(
            `Tax environment with code ${taxEnvironmentCode} not found for hotel ${hotelId}`
          );
          return [];
        }

        // Get taxation codes from the matched environment (following Java logic)
        const taxationCodes = taxEnvironment.TaxationCodes || [];
        if (taxationCodes.length === 0) {
          this.logger.warn(
            `Taxation codes not found in tax environment ${taxEnvironmentCode} for hotel ${hotelId}`
          );
          return [];
        }

        // Get tax rate list from taxation response (following Java logic)
        const taxRateList = taxationResponse?.TaxRates || [];
        if (taxRateList.length === 0) {
          this.logger.warn(`Tax rate list is empty for hotel ${hotelId}`);
          return [];
        }

        // Filter tax rates that match the taxation codes (following Java logic)
        const filteredTaxRateList = taxRateList.filter((rate) =>
          taxationCodes.includes(rate.TaxationCode)
        );

        if (filteredTaxRateList.length === 0) {
          this.logger.warn(`No tax rates found for taxation codes for hotel ${hotelId}`);
          return [];
        }

        // Map to API format (following Java logic: code and value only)
        // Java uses: TaxDto.builder().code(item.getCode()).value(item.getValue()).build()
        // Note: For MEWS API, Relative taxes have value in Strategy.Value.Value, not Value.Value
        const taxList = filteredTaxRateList.map((rate) => {
          // Get value: prefer direct Value.Value, but fallback to Strategy.Value.Value for Relative taxes
          let taxValue = rate.Value?.Value;
          if (taxValue === null || taxValue === undefined || taxValue === 0) {
            taxValue = rate.Strategy?.Value?.Value ?? 0;
          }
          return {
            code: rate.Code,
            value: taxValue
          };
        });

        // Remove duplicates by code (keep first occurrence) - following Java logic
        const distinctTaxList: { code: string; value: number }[] = [];
        for (const tax of taxList) {
          if (distinctTaxList.every((item) => item.code !== tax.code)) {
            distinctTaxList.push(tax);
          }
        }

        // Map to final format with unit and name
        const taxationMap = new Map(
          (taxationResponse?.Taxations || []).map((taxation) => [
            taxation.Code,
            taxation.Name || taxation.Code
          ])
        );

        const mapped = distinctTaxList.map((tax) => {
          // Find the original rate to get strategy information
          const rate = filteredTaxRateList.find((r) => r.Code === tax.code);
          const taxValue = tax.value;

          // Determine unit based on strategy discriminator
          const unit =
            rate?.Strategy?.Discriminator === 'Flat'
              ? 'CURRENCY'
              : rate?.Strategy?.Discriminator === 'Relative' ||
                  rate?.Strategy?.Discriminator === 'Dependent'
                ? 'PERCENTAGE'
                : 'PERCENTAGE'; // Default to PERCENTAGE

          // Get taxation name from map
          const taxationCode = rate?.TaxationCode;
          const taxationName = taxationCode
            ? taxationMap.get(taxationCode) || taxationCode
            : tax.code;

          return {
            code: tax.code,
            name: taxationName,
            unit: unit,
            value: taxValue
          };
        });

        return mapped;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return [];
    }
  }

  async getPmsCityTaxList(hotelId: string) {
    const dataConnector = await this.getConnector(hotelId);
    const connectorType = dataConnector.connectorType;

    // Get hotel with country for filtering
    // const hotel = await this.hotelRepository.findOne({
    //   where: {
    //     id: hotelId
    //   },
    //   select: {
    //     country: {
    //       code: true
    //     }
    //   },
    //   relations: ['country']
    // });

    let cityTaxes: any[] = [];
    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        const { accessToken } = await this.getConnectorAndAccessToken(hotelId);
        const data = await this.apaleoService.getApaleoCityTaxes(accessToken, {
          propertyId: dataConnector.mappingPmsHotel[0].mappingHotelCode
        });
        cityTaxes = (data?.cityTaxes || [])?.map((item) => ({
          mappingCityTaxCode: item.id,
          name: item.name,
          cityTaxFullName: item.description,
          discriminator: null,
          value: DecimalRoundingHelper.conditionalRounding(
            item.value / 100,
            RoundingModeEnum.HALF_ROUND_UP,
            2
          ),
          type: item.type,
          currency: null
        }));
        break;
      }
      case ConnectorTypeEnum.MEWS: {
        const accessToken = dataConnector.refreshToken;

        // Get MEWS service settings to get serviceId
        const serviceSetting = await this.mewsServiceSettings.findOne({
          where: {
            hotelId: hotelId
          }
        });

        if (!serviceSetting?.serviceId) {
          this.logger.warn(`Service setting not found for hotel ${hotelId}`);
          break;
        }

        // Get products from MEWS API
        const products = await this.mewsPmsService.getMewsProducts(accessToken, [
          serviceSetting.serviceId
        ]);

        // Filter only active products
        const activeProducts = products.filter((product) => product.IsActive === true);

        // Map products to city tax format
        cityTaxes = activeProducts.map((product) => {
          // Get discriminator - map "Flat" to "Absolute" (following Java logic)
          let discriminator = product.Pricing?.Discriminator || null;
          if (discriminator === 'Flat') {
            discriminator = 'Absolute';
          }

          // Get value - from Pricing.Value.Value
          const taxValue = product.Pricing?.Value?.Value || product.Pricing?.Value?.Multiplier;

          // Get currency - from Pricing.Value.Currency
          const currency = product.Pricing?.Value?.Currency || null;

          // Get type - from Pricing.Value.Target
          const type = product.Pricing?.Value?.Target || null;

          // Get name - prefer Name, then ExternalName, then ShortName
          const name = product.Name || product.ExternalName || product.ShortName || product.Id;

          // Format cityTaxFullName following Java PmsCityTax.getCityTaxFullName() logic
          let cityTaxFullName = '';
          if (taxValue != null) {
            if (discriminator) {
              if (discriminator === 'Absolute') {
                // Format: "name (currency value)"
                const formattedValue = Number.isInteger(taxValue)
                  ? Math.floor(taxValue).toString()
                  : taxValue.toFixed(2);
                cityTaxFullName = `${name} (${currency || ''} ${formattedValue})`.trim();
              } else {
                // Format: "name (XX% of type)" for Relative/Dependent
                const percentageValue = taxValue * 100;
                const formattedPercentage = Number.isInteger(percentageValue)
                  ? Math.floor(percentageValue).toString()
                  : percentageValue.toFixed(2);
                cityTaxFullName = `${name} (${formattedPercentage}% of ${type || ''})`.trim();
              }
            } else {
              // No discriminator: "name (value type)"
              const formattedValue = Number.isInteger(taxValue)
                ? Math.floor(taxValue).toString()
                : taxValue.toFixed(2);
              cityTaxFullName = `${name} (${formattedValue} ${type || ''})`.trim();
            }
          }

          return {
            mappingCityTaxCode: product.Id,
            name: name,
            cityTaxFullName: cityTaxFullName,
            discriminator: discriminator,
            value: DecimalRoundingHelper.conditionalRounding(
              taxValue || 0,
              RoundingModeEnum.HALF_ROUND_UP,
              2
            ),
            type: type,
            currency: currency
          };
        });
        break;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return [];
    }
    return cityTaxes;
  }

  private async getConnectorAndAccessToken(hotelId: string) {
    const dataConnector = await this.getPmsAccessToken(hotelId);
    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }
    const accessToken = await this.apaleoService.getAccessToken(
      dataConnector.refreshToken,
      dataConnector.mappingPmsHotel[0].mappingHotelCode
    );
    return { dataConnector, accessToken };
  }

  private async getConnector(hotelId: string) {
    const dataConnector = await this.getPmsAccessToken(hotelId);
    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }
    return dataConnector;
  }

  async updateLockPmsUnits(
    hotelId: string,
    input: {
      lockReservations: string[];
      unlockReservations: string[];
    }
  ) {
    const { dataConnector, accessToken } = await this.getConnectorAndAccessToken(hotelId);
    const connectorType = dataConnector.connectorType;
    const { lockReservations, unlockReservations } = input;
    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        if (lockReservations.length) {
          await processInBatches(
            lockReservations,
            10, // batch size
            50, // delay in ms
            async (reservationMappingCode: string) => {
              return await this.apaleoService.lockUnits(accessToken, reservationMappingCode);
            }
          );
        }
        if (unlockReservations.length) {
          await processInBatches(
            unlockReservations,
            10, // batch size
            50, // delay in ms
            async (reservationMappingCode: string) => {
              return await this.apaleoService.unlockUnits(accessToken, reservationMappingCode);
            }
          );
        }
        return true;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return [];
    }
  }

  async updatePmsAvailability(hotelId: string, input: UpdatePmsAvailabilityDto[]) {
    if (!input?.length) {
      this.logger.error('Input is required');
      return;
    }

    const cleanedInput = input.filter(
      (item) =>
        item.startDate &&
        item.endDate &&
        item.adjustment !== undefined &&
        item.adjustment !== null &&
        item.pmsRoomProductMappingCode
    );
    if (cleanedInput.length !== input.length) {
      this.logger.warn('Some items are invalid and will be skipped');
    }

    const { dataConnector, accessToken } = await this.getConnectorAndAccessToken(hotelId);
    const connectorType = dataConnector.connectorType;
    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        // Group by unit group id (pmsRoomProductMappingCode)
        const unitGroupIdsGrouped: Record<string, UpdatePmsAvailabilityDto[]> = cleanedInput.reduce(
          (acc, item) => {
            if (!acc[item.pmsRoomProductMappingCode]) {
              acc[item.pmsRoomProductMappingCode] = [];
            }
            acc[item.pmsRoomProductMappingCode].push(item);
            return acc;
          },
          {} as Record<string, UpdatePmsAvailabilityDto[]>
        );

        const results: any[] = [];

        // Sequential processing using for...of
        for (const [unitGroupId, items] of Object.entries(unitGroupIdsGrouped)) {
          const apaleoInput = items.map((item) => ({
            fromDate: item.startDate,
            toDate: item.endDate,
            allowedOverbooking: item.adjustment
          }));

          const result = await this.apaleoService.updateApaleoAvailability(
            accessToken,
            unitGroupId,
            apaleoInput
          );

          if (result != null) results.push(result);
        }

        return results;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return [];
    }
  }

  async updateMaintenanceRoomUnitForPms(
    hotelId: string,
    input: RoomUnitMaintenanceMappingDto[],
    roomUnits: RoomUnit[]
  ) {
    const { dataConnector, accessToken } = await this.getConnectorAndAccessToken(hotelId);
    const connectorType = dataConnector.connectorType;
    // const newPmsRoomUnitMaintenance: RoomUnitMaintenanceMappingDto[] = [];
    // split dates to ranges
    const hotelConfiguration = await this.hotelConfigurationRepository.findOne({
      where: {
        hotelId: hotelId,
        configType: HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION
      },
      select: {
        id: true,
        configValue: true,
        hotel: {
          timeZone: true
        },
        hotelId: true
      },
      relations: ['hotel']
    });
    const timeSliceConfiguration = hotelConfiguration?.configValue?.metadata as {
      CI: string;
      CO: string;
    };
    const timezone = hotelConfiguration?.hotel?.timeZone;
    const checkInTime = timeSliceConfiguration?.CI;
    const checkOutTime = timeSliceConfiguration?.CO;
    if (!checkInTime || !checkOutTime) {
      this.logger.warn(`Time slice configuration not found for hotel ${hotelId}`);
      return false;
    }
    if (!timezone) {
      this.logger.warn(`Timezone is not set for hotel ${hotelId}`);
      return false;
    }
    const roomUnitMap = new Map<string, string>(
      roomUnits.map((item) => [item.mappingPmsCode, item.id])
    );
    const updateRoomUnitAvailabilities: Partial<RoomUnitAvailability>[] = [];
    const updateMaintenances: Partial<Maintenance>[] = [];

    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        let apaleoInput: ApaleoUpdateMaintenanceDto[] = [];
        const parseType = (type: RoomUnitAvailabilityStatus): ApaleoMaintenanceType | null => {
          switch (type) {
            case RoomUnitAvailabilityStatus.OUT_OF_INVENTORY:
              return ApaleoMaintenanceType.OutOfInventory;
            case RoomUnitAvailabilityStatus.OUT_OF_ORDER:
              return ApaleoMaintenanceType.OutOfOrder;
            default:
              return ApaleoMaintenanceType.OutOfInventory;
          }
        };
        for (const item of input) {
          if (item.type === RoomUnitAvailabilityStatus.AVAILABLE) {
            continue;
          }

          const dateBlocks = this.buildDateBlocks(item.dates, checkInTime, checkOutTime, timezone);
          if (!dateBlocks?.length) continue;

          for (const dateBlock of dateBlocks) {
            apaleoInput.push({
              unitId: item.roomUnitMappingPmsCode,
              from: dateBlock.from,
              to: dateBlock.to,
              type: parseType(item.type) as ApaleoMaintenanceType
            });
          }
        }

        const result = await this.apaleoService.updateApaleoMaintenances(accessToken, apaleoInput);
        if (result?.ids?.length) {
          for (const id of result.ids) {
            this.redisService.set(`apaleo_maintenance_created_${id}`, id, 10);
          }
          for (const [index, id] of result.ids.entries()) {
            const maintenance = apaleoInput[index];
            const roomUnitId = roomUnitMap.get(maintenance.unitId);
            if (!roomUnitId) continue;
            const newMaintenanceId = uuidv4();
            updateMaintenances.push({
              id: newMaintenanceId,
              hotelId: hotelId,
              roomUnitId: roomUnitId,
              mappingPmsCode: id
            });

            const dates = Helper.generateDateRange(
              maintenance.from,
              format(addDays(new Date(maintenance.to), -1), 'yyyy-MM-dd')
            );
            for (const date of dates) {
              updateRoomUnitAvailabilities.push({
                hotelId: hotelId,
                roomUnitId: roomUnitId,
                date: date,
                maintenanceId: newMaintenanceId
              });
            }
          }
        }
        break;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        for (const item of input) {
          if (item.type === RoomUnitAvailabilityStatus.AVAILABLE) {
            continue;
          }

          const dateBlocks = this.buildDateBlocks(item.dates, checkInTime, checkOutTime, timezone);
          if (!dateBlocks?.length) continue;

          for (const dateBlock of dateBlocks) {
            const roomUnitId = roomUnitMap.get(item.roomUnitMappingPmsCode);
            if (!roomUnitId) continue;
            const newMaintenanceId = uuidv4();
            updateMaintenances.push({
              id: newMaintenanceId,
              hotelId: hotelId,
              roomUnitId: roomUnitId,
              mappingPmsCode: null
            });

            const dateRanges = Helper.generateDateRange(dateBlock.from, dateBlock.to);
            for (const date of dateRanges) {
              updateRoomUnitAvailabilities.push({
                hotelId: hotelId,
                roomUnitId: roomUnitId,
                date: date,
                maintenanceId: newMaintenanceId
              });
            }
          }
        }
        break;
    }

    if (updateMaintenances.length) {
      await this.maintenanceRepository.save(updateMaintenances);
    }
    if (updateRoomUnitAvailabilities.length) {
      await this.roomUnitAvailabilityRepository.upsert(updateRoomUnitAvailabilities, {
        conflictPaths: ['hotelId', 'roomUnitId', 'date'],
        skipUpdateIfNoValuesChanged: true
      });
    }
    return true;
  }

  private buildDateBlocks(dates: string[], checkIn: string, checkOut: string, tz: string) {
    const sorted = [...dates].sort();
    const blocks: { start: string; end: string }[] = [];

    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];

      const nextOfPrev = format(addDays(new Date(prev), 1), 'yyyy-MM-dd');

      if (current !== nextOfPrev) {
        blocks.push({ start, end: prev });
        start = current;
      }

      prev = current;
    }

    blocks.push({ start, end: prev });

    return blocks.map((b) => {
      const fromDate = `${b.start}T${checkIn}`;
      const toDate = `${format(addDays(new Date(b.end), 1), 'yyyy-MM-dd')}T${checkOut}`;

      return {
        from: formatInTimeZone(fromZonedTime(fromDate, tz), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        to: formatInTimeZone(fromZonedTime(toDate, tz), tz, "yyyy-MM-dd'T'HH:mm:ssXXX")
      };
    });
  }

  async deleteMaintenanceRoomUnitForPms(hotelId: string, maintenanceMappingCodes: string[]) {
    const { dataConnector, accessToken } = await this.getConnectorAndAccessToken(hotelId);
    const connectorType = dataConnector.connectorType;
    switch (connectorType) {
      case ConnectorTypeEnum.APALEO: {
        await processInBatches(
          maintenanceMappingCodes,
          10, // batch size
          50, // delay in ms
          async (maintenanceMappingCode: string) => {
            return await this.apaleoService.deleteApaleoMaintenance(
              accessToken,
              maintenanceMappingCode
            );
          }
        );
        return true;
      }
      default:
        this.logger.error(`Connector type ${connectorType} not supported`);
        return true;
    }
  }

  async authorizeConnector(payload: AuthorizeConnectorDto) {
    const { connectorType, hotelCode, authorizationCode, refreshToken } = payload;
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      }
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel not found with code ${hotelCode}`);
    }
    switch (connectorType) {
      case ConnectorTypeEnum.MEWS: {
        const valid = await this.mewsService.testAccess(refreshToken!);
        if (!valid) {
          throw new BadRequestException(`Can't connect to Mews`);
        }

        const configuration = await this.mewsService.getConfiguration(refreshToken!);
        if (!configuration) {
          throw new BadRequestException(`Can't get Mews configuration`);
        }

        let configurator = await this.connectorRepository.findOne({
          where: {
            hotelId: hotel.id,
            connectorType: ConnectorTypeEnum.MEWS
          }
        });

        if (!configurator) {
          configurator = await this.connectorRepository.save({
            organisationId: hotel.organisationId,
            hotelId: hotel.id,
            connectorType: ConnectorTypeEnum.MEWS,
            refreshToken: refreshToken,
            metadata: {}
          });
        } else {
          await this.connectorRepository.update(configurator.id, {
            refreshToken: refreshToken,
            status: ConnectorStatusEnum.ACTIVE
          });
        }
        return configuration;
      }
      case ConnectorTypeEnum.APALEO: {
        if (!authorizationCode) {
          throw new BadRequestException('Authorization code is required for Apaleo');
        }
        if (!payload.redirectUrl) {
          throw new BadRequestException('Redirect URL is required for Apaleo');
        }

        // Get redirect URL from payload or use default
        const redirectUrl = payload.redirectUrl;

        // Exchange authorization code for tokens (following Java implementation)
        const tokenResponse = await this.apaleoService.exchangeAuthorizationCode(
          authorizationCode,
          redirectUrl,
          hotel.id
        );

        if (!tokenResponse.refresh_token) {
          throw new BadRequestException('Failed to get refresh token from Apaleo');
        }

        // Get properties list to return (similar to Mews configuration)
        const accessToken = tokenResponse.access_token;
        const propertiesResponse = await this.apaleoService.getProperties(accessToken);

        // Create or update connector
        let connector = await this.connectorRepository.findOne({
          where: {
            hotelId: hotel.id,
            connectorType: ConnectorTypeEnum.APALEO
          }
        });

        const connectorData: any = {
          organisationId: hotel.organisationId,
          hotelId: hotel.id,
          connectorType: ConnectorTypeEnum.APALEO,
          refreshToken: tokenResponse.refresh_token,
          status: ConnectorStatusEnum.ACTIVE
        };

        // Add account code to metadata if available
        if (tokenResponse.accountCode) {
          connectorData.metadata = {
            accountCode: tokenResponse.accountCode
          };
        }

        if (!connector) {
          connector = await this.connectorRepository.save(connectorData);
        } else {
          await this.connectorRepository.update(connector.id, connectorData);
          connector = { ...connector, ...connectorData };
        }

        return {
          properties: propertiesResponse.properties.map((p) => ({
            pmsHotelId: p.id,
            name: p.name
          }))
        };
      }
    }
  }

  private async getRefreshToken(hotelCode: string) {
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      }
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel not found with code ${hotelCode}`);
    }
    const configurator = await this.connectorRepository.findOne({
      where: {
        hotelId: hotel.id
      }
    });
    if (!configurator) {
      throw new NotFoundException(`Connector not found with hotel ${hotel.name}`);
    }
    const token = configurator.refreshToken;
    if (!token) {
      throw new BadRequestException(`Refresh token not found with hotel ${hotel.name}`);
    }
    return token;
  }

  async getPmsHotelList(payload: GetPmsHotelListDto) {
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: payload.hotelCode
      }
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel not found with code ${payload.hotelCode}`);
    }
    const connector = await this.connectorRepository.findOne({
      where: {
        hotelId: hotel.id
      }
    });
    if (!connector) {
      throw new NotFoundException(`Connector not found with hotel ${hotel.name}`);
    }
    switch (connector.connectorType) {
      case ConnectorTypeEnum.MEWS: {
        const pmsHotels = await this.mewsService.getServices({
          AccessToken: connector.refreshToken,
          Client: process.env.MEWS_CLIENT,
          ClientToken: process.env.MEWS_CLIENT_TOKEN
        });
        if (!pmsHotels) {
          throw new BadRequestException(`Can't get Mews services`);
        }
        return pmsHotels.map((item) => ({
          pmsHotelId: item.Id,
          name: item.Name
        }));
      }
      case ConnectorTypeEnum.APALEO: {
        const accessToken = await this.apaleoService.getAccessToken(
          connector.refreshToken,
          hotel.id
        );
        const pmsHotels = await this.apaleoService.getProperties(
          accessToken,
          this.configService.get(ENVIRONMENT.NODE_ENV) === 'production' ? 'Live' : 'Test'
        );
        if (!pmsHotels) {
          throw new BadRequestException(`Can't get Apaleo properties`);
        }
        return pmsHotels.properties?.map((item) => ({
          pmsHotelId: item.id,
          name: item.name
        }));
      }
    }
  }

  async createMappingPmsHotel(payload: CreateMappingHotelDto) {
    const { connectorType, hotelCode, mappingHotelCode } = payload;
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      }
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel not found with code ${hotelCode}`);
    }

    // find connector
    const connector = await this.connectorRepository.findOne({
      where: {
        hotelId: hotel.id
      }
    });
    if (!connector) {
      throw new NotFoundException(`Connector not found with hotel ${hotel.name}`);
    }

    switch (connector.connectorType) {
      case ConnectorTypeEnum.MEWS: {
        const refreshToken = await this.getRefreshToken(payload.hotelCode);
        const mewsHotels = await this.mewsService.getServices({
          AccessToken: refreshToken,
          Client: process.env.MEWS_CLIENT,
          ClientToken: process.env.MEWS_CLIENT_TOKEN,
          ServiceIds: [mappingHotelCode]
        });

        if (!mewsHotels?.length) {
          throw new BadRequestException(`Can't get Mews service`);
        }
        const mewsHotel = mewsHotels[0];

        const configuration = await this.mewsService.getConfiguration(refreshToken!);
        if (!configuration) {
          throw new BadRequestException(`Can't get Mews configuration`);
        }

        // start transaction
        this.dataSource.transaction(async (transactionalEntityManager) => {
          // create mew service settings
          await transactionalEntityManager.save(MewsServiceSettings, {
            hotelId: hotel.id,
            serviceId: mappingHotelCode,
            enterpriseId: mewsHotel.EnterpriseId,
            serviceType: 'ROOM',
            timezone: configuration.Enterprise?.TimeZoneIdentifier,
            propertyPricingSetting: configuration.Enterprise?.Pricing
          });

          // create mapping pms hotel
          await transactionalEntityManager.save(MappingPmsHotel, {
            hotelId: hotel.id,
            connectorId: connector.id,
            mappingHotelCode: mewsHotel.Name // this field is the name of the hotel in the pms showing in the UI (don't know why it's not the Id)
          });
        });
        return {};
      }
      case ConnectorTypeEnum.APALEO: {
        // start transaction
        this.dataSource.transaction(async (transactionalEntityManager) => {
          // create mapping pms hotel
          await transactionalEntityManager.save(MappingPmsHotel, {
            hotelId: hotel.id,
            connectorId: connector.id,
            mappingHotelCode: mappingHotelCode
          });
        });
        return {};
      }
      default:
        throw new BadRequestException(`Connector type ${connector.connectorType} not supported`);
    }
  }

  // deauthorizeConnector
  async deauthorizeConnector(payload: DeauthorizeConnectorDto) {
    const { connectorType, hotelCode } = payload;
    const hotel = await this.hotelRepository.findOne({
      where: {
        code: hotelCode
      }
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel not found with code ${hotelCode}`);
    }

    const connector = await this.connectorRepository.findOne({
      where: {
        hotelId: hotel.id,
        connectorType
      }
    });

    if (!connector) {
      throw new NotFoundException(`Connector not found with hotel ${hotel.name}`);
    }
    console.log(connector);

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // For MEWS, also delete the mews service settings
      if (connectorType === ConnectorTypeEnum.MEWS) {
        await transactionalEntityManager.delete(MewsServiceSettings, {
          hotelId: hotel.id
        });
        console.log('Deleted mews service settings');
      }

      // delete mapping pms hotel
      await transactionalEntityManager.delete(MappingPmsHotel, {
        hotelId: hotel.id,
        connectorId: connector.id
      });

      // Deactivate the connector
      await transactionalEntityManager.delete(Connector, {
        id: connector.id
      });
      console.log('Deleted connector');
    });

    return {
      message: 'Connector deauthorized successfully'
    };
  }
}
