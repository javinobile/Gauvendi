import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { ResponseStatusEnum, RoomUnitAvailabilityStatus } from '@src/core/enums/common';
import { JOB_NAMES, QUEUE_NAMES_ENV } from '@src/core/queue/queue.constant';
import { RedisService } from '@src/core/redis/redis.service';
import { BlockSharedService } from '@src/modules/block/services/block-shared.service';
import { ReservationService } from '@src/modules/reservation/services/reservation.service';
import { RoomUnitService } from '@src/modules/room-unit/room-unit.service';
import { Queue } from 'bullmq';
import { chunk } from 'lodash';
import { Repository } from 'typeorm';
import { ApaleoMaintenanceType } from '../apaleo/apaleo.dto';
import { ApaleoService } from '../apaleo/apaleo.service';
import { PmsService } from '../pms.service';
// import { ApaleoBookingQueueEvents } from './apaleo-booking-queue-events';
import { ApaleoWebhookPayloadDto } from './apaleo-webhook.dto';
@Injectable()
export class ApaleoWebhookService {
  private readonly logger = new Logger(ApaleoWebhookService.name);

  constructor(
    private readonly pmsService: PmsService,
    private readonly reservationService: ReservationService,
    private readonly apaleoService: ApaleoService,
    private readonly blockSharedService: BlockSharedService,
    private readonly roomUnitService: RoomUnitService,
    private readonly redisService: RedisService,
    // private readonly apaleoBookingQueueEvents: ApaleoBookingQueueEvents,

    @InjectQueue(QUEUE_NAMES_ENV.APALEO_BOOKING)
    private apaleoBookingQueue: Queue,

    @InjectRepository(Booking, DbName.Postgres)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(MappingPmsHotel, DbName.Postgres)
    private readonly mappingPmsHotelRepository: Repository<MappingPmsHotel>
  ) {}

  // onModuleInit() {
  //   this.handleApaleoReservationCreatedQueue({
  //     mappingEntityCode: 'XGEPIFRK-1',
  //     mappingHotelCode: 'APALEOTEST'
  //   });
  // }

  async handleApaleoServiceChanged(body: ApaleoWebhookPayloadDto) {
    const { mappingEntityCode, mappingHotelCode } = body;

    await this.pmsService.syncPmsAmenities(mappingHotelCode, mappingEntityCode);
  }

  async handleApaleoReservationCreated(body: ApaleoWebhookPayloadDto, type?: 'created') {
    const mappingPmsHotel = await this.mappingPmsHotelRepository.findOne({
      where: {
        mappingHotelCode: body.mappingHotelCode
      }
    });
    if (!mappingPmsHotel) {
      this.logger.warn(`No mappingPmsHotel ${mappingPmsHotel}`);
    }
    const bookingMapCode: string = body.mappingEntityCode.split('-').at(0) || '';
    if (!bookingMapCode) {
      this.logger.warn(`No bookingMapCode ${bookingMapCode}`);
      return;
    }
    this.bookingRepository.findOne({
      where: {
        hotelId: mappingPmsHotel?.hotelId,
        mappingBookingCode: bookingMapCode
      }
    });
    const payloadHash = this.redisService.generateCacheKey('apaleo_booking', {
      mappingBookingCode: body.mappingEntityCode.split('-').at(0),
      mappingHotelCode: body.mappingHotelCode
    });

    const existingJobs = await this.apaleoBookingQueue.getJobs(['waiting', 'delayed', 'active']);
    const isDuplicate = existingJobs.some((job) => job.data?.payloadHash === payloadHash);
    // deplay more 1s if using credit card
    const delay = isDuplicate ? 100 : 0; // 1s if same payload
    // const delay = 0;
    this.logger.log(`Delay: ${delay}`);
    const job = await this.apaleoBookingQueue.add(
      JOB_NAMES.APALEO_BOOKING.PROCESS_APALEO_BOOKING_CREATED,
      {
        body,
        payloadHash,
        type,
        jobType: delay > 0 ? 'delayed' : 'no-delayed'
      },
      {
        removeOnComplete: true,
        removeOnFail: 100
      }
    );

    // const result = await job.waitUntilFinished(this.apaleoBookingQueueEvents.events);

    return true;
  }

  async handleApaleoReservationCreatedQueue(body: ApaleoWebhookPayloadDto, type?: 'created') {
    const { mappingEntityCode, mappingHotelCode } = body;
    const dataConnector = await this.pmsService.getPmsConnector({
      mappingHotelCode: mappingHotelCode
    });

    const refreshToken = dataConnector.refreshToken;

    const accessToken = await this.apaleoService.getAccessToken(refreshToken, mappingHotelCode);
    if (!accessToken) {
      return {
        status: ResponseStatusEnum.ERROR,
        message: 'Failed to get access token',
        data: false
      };
    }

    const params = new URLSearchParams();
    const expand = ['booker', 'timeSlices', 'services', 'assignedUnits', 'company'];
    expand.forEach((item) => params.append('expand', item));
    const reservation = await this.apaleoService.getApaleoReservation(
      accessToken,
      mappingEntityCode,
      params
    );
    await this.reservationService.handleSyncPmsReservations({
      pmsReservations: [reservation],
      pmsType: dataConnector.connectorType,
      hotelId: dataConnector.hotelId
    });

    // handle update blocks from apaleo
    const queryParams = new URLSearchParams();
    queryParams.append('groupId', reservation.bookingId);
    queryParams.append('unitGroupIds', reservation.unitGroup.id);
    queryParams.append('expand', 'timeSlices');
    const blocks = await this.apaleoService.getApaleoBlocks(accessToken, queryParams);
    if (blocks?.length) {
      const chunkedBlocks = chunk(blocks, 10);
      for (const chunk of chunkedBlocks) {
        await Promise.all(
          chunk.map((block) =>
            this.blockSharedService.handleBlockFromApaleoBlock(block, dataConnector.hotelId)
          )
        );
      }
    }
    return {
      status: ResponseStatusEnum.SUCCESS,
      message: 'Reservation created successfully',
      data: true
    };
  }

  async handleApaleoBlockEvents(body: ApaleoWebhookPayloadDto) {
    const { mappingEntityCode, mappingHotelCode } = body;
    const dataConnector = await this.pmsService.getPmsConnector({
      mappingHotelCode: mappingHotelCode
    });

    const refreshToken = dataConnector.refreshToken;

    const accessToken = await this.apaleoService.getAccessToken(refreshToken, mappingHotelCode);
    if (!accessToken) {
      return {
        status: ResponseStatusEnum.ERROR,
        message: 'Failed to get access token',
        data: false
      };
    }

    const block = await this.apaleoService.getApaleoBlock(accessToken, mappingEntityCode);
    if (!block) {
      await this.blockSharedService.deleteBlockFromApaleoBlock(
        mappingEntityCode,
        dataConnector.hotelId
      );
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'Block deleted successfully',
        data: true
      };
    }

    await this.blockSharedService.handleBlockFromApaleoBlock(block, dataConnector.hotelId);

    return {
      status: ResponseStatusEnum.SUCCESS,
      message: 'Block created successfully',
      data: true
    };
  }

  async handleApaleoMaintenanceEvents(body: ApaleoWebhookPayloadDto) {
    const { mappingEntityCode, mappingHotelCode } = body;
    const dataConnector = await this.pmsService.getPmsConnector({
      mappingHotelCode: mappingHotelCode
    });

    const refreshToken = dataConnector.refreshToken;
    const accessToken = await this.apaleoService.getAccessToken(refreshToken, mappingHotelCode);
    if (!accessToken) {
      return {
        status: ResponseStatusEnum.ERROR,
        message: 'Failed to get access token',
        data: false
      };
    }
    const maintenance = await this.apaleoService.getApaleoMaintenance(
      accessToken,
      mappingEntityCode
    );
    if (!maintenance) {
      await this.roomUnitService.deleteRoomUnitsMaintenance(dataConnector.hotelId, [
        mappingEntityCode
      ]);
      this.logger.log(
        `Maintenance ${mappingEntityCode} deleted successfully for hotel ${dataConnector.hotelId}`
      );
      return true;
    }

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

    await this.roomUnitService.updateRoomUnitsMaintenance({
      hotelId: dataConnector.hotelId,
      maintenanceRoomUnits: [
        {
          roomUnitMappingPmsCode: maintenance.unit.id,
          from: maintenance.from,
          to: maintenance.to,
          type: parseType(maintenance.type),
          maintenancePmsCode: maintenance.id
        }
      ]
    });
    this.logger.log(
      `Maintenance ${maintenance.id} updated successfully for hotel ${dataConnector.hotelId}`
    );
    return true;
  }

  async handleApaleoFolioEvents(body: ApaleoWebhookPayloadDto) {
    const { mappingEntityCode, mappingHotelCode } = body;
    const dataConnector = await this.pmsService.getPmsConnector({
      mappingHotelCode: mappingHotelCode
    });

    const refreshToken = dataConnector.refreshToken;
    const accessToken = await this.apaleoService.getAccessToken(refreshToken, mappingHotelCode);
    if (!accessToken) {
      return {
        status: ResponseStatusEnum.ERROR,
        message: 'Failed to get access token',
        data: false
      };
    }
    const folio = await this.apaleoService.getApaleoFolio(accessToken, mappingEntityCode);
    const reservationMappingCode = folio?.reservation?.id;
    const hotelMappingCode = folio?.property?.id;
    if (!reservationMappingCode || !hotelMappingCode) {
      this.logger.warn(
        `Failed to get reservation mapping code or hotel mapping code for folio ${mappingEntityCode}`
      );
      return false;
    }

    await this.handleApaleoReservationCreated({
      mappingEntityCode: reservationMappingCode,
      mappingHotelCode: hotelMappingCode
    });
    return true;
  }
}
