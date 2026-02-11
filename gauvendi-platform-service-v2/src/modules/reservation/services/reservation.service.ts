import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.const';
import { DbName } from '@src/core/constants/db-name.constant';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { ApaleoRatePlanPmsMapping } from '@src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import {
  BookingTransaction,
  BookingTransactionStatusEnum
} from '@src/core/entities/booking-entities/booking-transaction.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Guest } from '@src/core/entities/booking-entities/guest.entity';
import { ReservationAmenityDate } from '@src/core/entities/booking-entities/reservation-amenity-date.entity';
import { ReservationAmenity } from '@src/core/entities/booking-entities/reservation-amenity.entity';
import { ReservationRoom } from '@src/core/entities/booking-entities/reservation-room.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import {
  Reservation,
  ReservationChannelEnum,
  ReservationStatusEnum
} from '@src/core/entities/booking-entities/reservation.entity';
import { Country } from '@src/core/entities/core-entities/country.entity';
import { Connector } from '@src/core/entities/hotel-entities/connector.entity';
import { GlobalPaymentMethod } from '@src/core/entities/hotel-entities/global-payment-method.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelCityTax } from '@src/core/entities/hotel-entities/hotel-city-tax.entity';
import { HotelPaymentTerm } from '@src/core/entities/hotel-entities/hotel-payment-term.entity';
import { HotelTemplateEmailCodeEnum } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RatePlanExtraService } from '@src/core/entities/pricing-entities/rate-plan-extra-service.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { RoomProductExtra } from '@src/core/entities/room-product-extra.entity';
import { RoomProductMappingPms } from '@src/core/entities/room-product-mapping-pms.entity';
import { RoomProductMapping } from '@src/core/entities/room-product-mapping.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  AmenityStatusEnum,
  BookingFlow,
  ConnectorTypeEnum,
  ExtraServiceTypeEnum,
  HotelAgeCategoryCodeEnum,
  HotelConfigurationTypeEnum,
  LanguageCodeEnum,
  RatePlanExtraServiceType,
  ResponseStatusEnum,
  RoomProductExtraType,
  RoomProductType
} from '@src/core/enums/common';
import { PricingUtils } from '@src/core/modules/pricing-calculate/pricing-utils';
import { JOB_NAMES, QUEUE_NAMES_ENV } from '@src/core/queue/queue.constant';
import { RedisService } from '@src/core/redis/redis.service';
import { BaseService } from '@src/core/services/base.service';
import { processInBatches } from '@src/core/utils/batch-processor.util';
import { convertToUtcDate } from '@src/core/utils/datetime.util';
import { BookingTransactionRepository } from '@src/modules/booking-transaction/repositories/booking-transaction.repository';
import { UpdateBookingBookerInfoDto } from '@src/modules/booking/dtos/booking.dto';
import { BookingRepository } from '@src/modules/booking/repositories/booking.repository';
import { CountriesService } from '@src/modules/countries/countries.service';
import { EmailHistoryRepository } from '@src/modules/email-history/repositories/email-history.repository';
import { GlobalPaymentMethodRepository } from '@src/modules/global-payment-method/repositories/global-payment-method.repository';
import { GuestRepository } from '@src/modules/guest/repositories/guest.repository';
import { HotelAmenityRepository } from '@src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { HotelConfigurationRepository } from '@src/modules/hotel-configuration/hotel-configuration.repository';
import { HotelPaymentTermRepository } from '@src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';
import { NotificationService } from '@src/modules/notification';
import {
  ApaleoBookingDto,
  ApaleoChannelCode,
  ApaleoFolioChargeDto,
  ApaleoGuaranteeTypeMappingEnum,
  ApaleoReservationDto,
  ApaleoReservationGuestDto,
  ApaleoStatusCodeMappingEnum
} from '@src/modules/pms/apaleo/apaleo.dto';
import { ApaleoService } from '@src/modules/pms/apaleo/apaleo.service';
import { ReservationsCreatePmsDto } from '@src/modules/pms/dtos/pms.dto';
import { PmsService } from '@src/modules/pms/pms.service';
import { RatePlanSettingsService } from '@src/modules/rate-plan-settings/services/rate-plan-settings.service';
import { ReservationAmenityDateRepository } from '@src/modules/reservation-amenity-date/repositories/reservation-amenity-date.repository';
import { ReservationAmenityRepository } from '@src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { ReservationTimeSliceRepository } from '@src/modules/reservation-time-slice/repositories/reservation-time-slice.repository';
import {
  ProcessRoomUnitAvailabilityUpdateDto,
  RequestRoomsUpdateDto
} from '@src/modules/room-product-availability/room-product-availability.dto';
import { RoomProductAvailabilityService } from '@src/modules/room-product-availability/room-product-availability.service';
import { RoomProductHotelExtraListService } from '@src/modules/room-product-hotel-extra-list/room-product-hotel-extra-list.service';
import { RoomProductMappingPmsRepository } from '@src/modules/room-product-mapping-pms/repositories/room-product-mapping-pms.repository';
import { RoomProductMappingRepository } from '@src/modules/room-product-mapping/repositories/room-product-mapping.repository';
import { RoomUnitService } from '@src/modules/room-unit/room-unit.service';
import { Job, Queue } from 'bullmq';
import { addDays, format, isSameDay, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { chunk } from 'lodash';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CancelReservationInput,
  DateFilterEnum,
  PushPmsReservationInput,
  RatePlanDetailsFilterDto,
  ReleaseBookingInput,
  ReservationChannelFilterDto,
  ReservationDetailsResponseDto,
  ReservationManagementFilterDto,
  ReservationManagementResponseDto,
  ReservationPmsFilterDto,
  ReservationSourceFilterDto,
  SendCancellationReservationEmailDto,
  UpdateReservationGuestListInput,
  UpdateReservationLockUnitInput
} from '../dtos/reservation.dto';
import { ReservationRepository } from '../repositories/reservation.repository';
import { ReservationNotesService } from './reservation-notes.service';

export class ReservationService extends BaseService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly bookingTransactionRepository: BookingTransactionRepository,
    private readonly globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private readonly roomUnitService: RoomUnitService,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly roomProductMappingRepository: RoomProductMappingRepository,
    private readonly reservationAmenityRepository: ReservationAmenityRepository,
    private readonly roomProductHotelExtraListService: RoomProductHotelExtraListService,
    private readonly emailHistoryRepository: EmailHistoryRepository,
    private readonly pmsService: PmsService,
    private readonly bookingRepository: BookingRepository,
    private readonly roomProductMappingPmsRepository: RoomProductMappingPmsRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly countriesService: CountriesService,
    private readonly notificationService: NotificationService,
    private readonly reservationAmenityDateRepository: ReservationAmenityDateRepository,
    private readonly ratePlanSettingsService: RatePlanSettingsService,
    private readonly reservationTimeSliceRepository: ReservationTimeSliceRepository,
    private readonly reservationNotesService: ReservationNotesService,
    private readonly guestRepository: GuestRepository,
    private readonly apaleoService: ApaleoService,
    private readonly redisService: RedisService,

    private hotelConfigurationRepository: HotelConfigurationRepository,

    // private readonly reservationQueueEvents: ReservationQueueEvents,

    @InjectQueue(QUEUE_NAMES_ENV.RESERVATION)
    private reservationQueue: Queue,

    @InjectRepository(ApaleoRatePlanPmsMapping, DbName.Postgres)
    private readonly apaleoRatePlanPmsMappingRepository: Repository<ApaleoRatePlanPmsMapping>,

    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(BookingProposalSetting, DbName.Postgres)
    private readonly bookingProposalSettingRepository: Repository<BookingProposalSetting>,

    @InjectRepository(Hotel, DbName.Postgres)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(Connector, DbName.Postgres)
    private readonly connectorRepository: Repository<Connector>,

    @InjectRepository(ReservationRoom, DbName.Postgres)
    private readonly reservationRoomRepository: Repository<ReservationRoom>,

    @InjectRepository(RoomProductExtra, DbName.Postgres)
    private readonly roomProductExtraRepository: Repository<RoomProductExtra>,

    @InjectRepository(RatePlanExtraService, DbName.Postgres)
    private readonly ratePlanExtraServiceRepository: Repository<RatePlanExtraService>,

    @InjectRepository(HotelCityTax, DbName.Postgres)
    private readonly hotelCityTaxRepository: Repository<HotelCityTax>,

    @InjectRepository(BookingTransaction, DbName.Postgres)
    private readonly bookingTransactionCustomRepository: Repository<BookingTransaction>,

    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationCustomRepository: Repository<Reservation>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly roomProductAvailabilityService: RoomProductAvailabilityService
  ) {
    super(configService);
  }

  async getDeletedReservationDifferentPms() {
    const hotelId = '3efd68e5-043d-46ae-9f8f-6fbf91da7865';
    const fromDate = '2025-11-12';
    const toDate = '2025-11-12';
    const pmsResults = await this.pmsService.getPmsReservations({
      hotelId,
      dateFilter: DateFilterEnum.ARRIVAL,
      fromDate,
      toDate
    });

    const pmsReservations: any = pmsResults.reservations ?? [];

    const mappingReservationCodes = pmsReservations.map((item) => item.id);
    const reservations = await this.reservationRepository.findAll({
      hotelId,
      mappingReservationCodes
    });

    let differentReservationIds: string[] = [];
    for (const reservation of reservations) {
      const pmsReservation = pmsReservations.find(
        (item) => item.id === reservation.mappingReservationCode
      );
      if (pmsReservation) {
        const pmsStatus = ApaleoStatusCodeMappingEnum[pmsReservation.status];

        if (
          reservation.status === ReservationStatusEnum.CANCELLED &&
          pmsStatus !== ReservationStatusEnum.CANCELLED
        ) {
          differentReservationIds.push(reservation.id);
        }
      }
    }
  }

  async getReservationManagementList(filter: ReservationManagementFilterDto) {
    filter.relations = [
      ...(filter.relations || []),
      'reservationTimeSlices',
      'booking',
      'primaryGuest',
      'company',
      'booking.bookingProposalSetting',
      'rfc'
    ];
    const hotel = await this.hotelRepository.findOne({
      where: {
        id: filter.hotelId
      }
    });
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    filter.notInStatusList = [ReservationStatusEnum.CREATED];

    if (!filter.statusList?.includes(ReservationStatusEnum.PAYMENT_FAILED) && !filter.text) {
      filter.notInStatusList.push(ReservationStatusEnum.PAYMENT_FAILED);
    }

    const [data, count] = await this.reservationRepository.getReservationsAndCount(filter);
    if (!data?.length) return { data: [], totalPage: 0, count: 0 };
    const a = data.slice(49, 59);

    const mappedData = await this.mapReservations(data, hotel);
    return {
      data: mappedData,
      totalPage: Math.ceil(count / (filter?.pageSize || 1)),
      count: mappedData?.length
    };
  }

  async getReservationSourceList(filter: ReservationSourceFilterDto) {
    const data = await this.reservationRepository.getReservationSourceList(filter);
    return data;
  }

  async getReservationBookingFlowList(filter: ReservationManagementFilterDto) {
    const data = await this.reservationRepository.getReservationBookingFlowList(filter);
    return data;
  }

  async getReservationChannelList(filter: ReservationChannelFilterDto) {
    const data = await this.reservationRepository.getReservationChannelList(filter);
    return data;
  }

  getReservationStatusList(): ReservationStatusEnum[] {
    return Object.values(ReservationStatusEnum).filter(
      (value) => typeof value === 'string' && value !== ReservationStatusEnum.CREATED
    ) as ReservationStatusEnum[];
  }

  async getReservationList(filter: ReservationManagementFilterDto) {
    filter.relations = [
      ...(filter.relations || []),
      'reservationTimeSlices',
      'booking',
      'primaryGuest',
      'company'
    ];
    filter.relations = [...new Set(filter.relations)];

    const [data, count] = await this.reservationRepository.getReservationsAndCount(filter);
    if (!data?.length) return [];

    const mappedData = await this.mapReservations(data);
    return {
      data: mappedData,
      totalPage: Math.ceil(count / (filter?.pageSize || 1)),
      count: mappedData?.length
    };
  }

  async getReservationOverview(filter: ReservationManagementFilterDto) {
    filter.relations = ['booking'];
    const [data, count] = await this.reservationRepository.getReservationsAndCount(filter);
    return {
      data: data.map((reservation) => ({
        id: reservation.id,
        bookingFlow: reservation.bookingFlow,
        channel: reservation.channel,
        source: reservation.source,
        booking: {
          bookingNumber: reservation.booking.bookingNumber
        },
        tripPurpose: reservation.tripPurpose,
        bookingDate: reservation.bookingDate?.toISOString(),
        createdDate: reservation.createdAt?.toISOString(),
        updatedDate: reservation.updatedAt?.toISOString(),
        promoCodeList: JSON.parse(reservation.promoCode || '[]'),
        guestNote: reservation.guestNote
      })),
      totalPage: Math.ceil(count / (filter?.pageSize || 1)),
      count: data?.length
    };
  }

  async getReservationDetails(filter: ReservationManagementFilterDto) {
    filter.relations = [
      'ratePlan',
      'rfc',
      'cancellationPolicy',
      'rfc.roomProductRetailFeatures',
      'roomProductRetailFeature.retailFeature',
      'retailFeature.hotelRetailCategory',
      'reservationAmenities',
      'reservationTimeSlices'
    ];
    const data = await this.reservationRepository.getReservationDetails(filter);
    const mappedData = await this.mapReservationDetails(data);
    return {
      data: mappedData,
      totalPage: 1,
      count: (mappedData || [])?.length
    };
  }

  async getReservationGuestList(filter: ReservationManagementFilterDto) {
    filter.relations = ['primaryGuest', 'primaryGuest.country'];
    const [data, count] = await this.reservationRepository.getReservationsAndCount(filter);
    return {
      data: (data || [])?.map((reservation) => {
        const primaryGuest = reservation.primaryGuest;
        const additionalGuestList = JSON.parse(reservation.additionalGuests || '[]');
        const childrenAges = reservation.childrenAges || [];
        const childrenAdditionalGuestList = additionalGuestList
          .filter((guest: any) => guest.isAdult === false)
          .map((guest: any, childIndex: number) => {
            return {
              ...guest,
              age: childrenAges[childIndex]
            };
          });

        // if no childrenAdditionalGuestList
        // generate childrenAdditionalGuestList from childrenAges
        let totalChildrenAges = childrenAges.length;
        let totalChildrenAdditionalGuestList = childrenAdditionalGuestList.length;
        let generatedChildrenAdditionalGuestList: Partial<Guest>[] = [];

        if (totalChildrenAges > totalChildrenAdditionalGuestList) {
          generatedChildrenAdditionalGuestList = childrenAges
            .slice(totalChildrenAdditionalGuestList)
            .map((age: number) => ({
              id: uuidv4(),
              age: age,
              isAdult: false
            }));
        }

        const childrenAdditionalGuestMap = new Map(
          childrenAdditionalGuestList.map((guest: any) => [guest.id, guest])
        );

        return {
          additionalGuestList: additionalGuestList
            ?.map((guest: any) => {
              if (guest.isAdult) {
                return guest;
              }

              return childrenAdditionalGuestMap.get(guest.id) || guest;
            })
            .concat(generatedChildrenAdditionalGuestList || []),
          mainGuest: {
            id: primaryGuest?.id,
            title: null,
            gender: null,
            firstName: primaryGuest?.firstName,
            lastName: primaryGuest?.lastName,
            emailAddress: primaryGuest?.emailAddress,
            address: primaryGuest?.address,
            countryId: primaryGuest?.countryId,
            country: primaryGuest?.country,
            city: primaryGuest?.city,
            state: primaryGuest?.state,
            postalCode: primaryGuest?.postalCode,
            phoneNumber: primaryGuest?.phoneNumber,
            countryNumber: primaryGuest?.countryNumber,
            preferredLanguage: reservation.bookingLanguage || LanguageCodeEnum.EN
          }
        };
      }),
      totalPage: Math.ceil(count / (filter?.pageSize || 1)),
      count: (data || [])?.length
    };
  }

  async updateReservationGuestList(input: UpdateReservationGuestListInput) {
    const {
      hotelId,
      reservationId,
      primaryGuest: primaryGuestInput,
      additionalGuestList: additionalGuestListInput
    } = input;
    const [reservation, primaryGuest] = await Promise.all([
      await this.reservationRepository.findOne({
        id: reservationId,
        hotelId
      }),
      await this.guestRepository.findOne({
        id: primaryGuestInput.id,
        hotelId
      })
    ]);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (!primaryGuest) {
      throw new NotFoundException('Primary guest not found');
    }

    primaryGuest.firstName = primaryGuestInput.firstName;
    primaryGuest.lastName = primaryGuestInput.lastName;
    primaryGuest.emailAddress = primaryGuestInput.emailAddress;
    primaryGuest.address = primaryGuestInput.address;
    primaryGuest.countryId = primaryGuestInput.countryId;
    primaryGuest.city = primaryGuestInput.city ?? null;
    primaryGuest.state = primaryGuestInput.state ?? null;
    primaryGuest.postalCode = primaryGuestInput.postalCode ?? null;
    primaryGuest.phoneNumber = primaryGuestInput.phoneNumber;
    primaryGuest.countryNumber = primaryGuestInput.countryNumber;

    if (additionalGuestListInput && additionalGuestListInput.length > 0) {
      reservation.additionalGuests = JSON.stringify(additionalGuestListInput);
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(primaryGuest);
      await transactionalEntityManager.save(reservation);
    });

    // sync APALEO primary guest to apaleo
    // get data connector
    const dataConnector = await this.pmsService.getPmsAccessToken(hotelId);
    if (!dataConnector) {
      throw new BadRequestException(`Connector not found with ${hotelId}`);
    }
    const accessToken = await this.apaleoService.getAccessToken(
      dataConnector.refreshToken ?? '',
      hotelId ?? ''
    );
    if (!accessToken) {
      throw new BadRequestException(`Access token not found with property id ${hotelId}`);
    }
    if (reservation.mappingReservationCode) {
      const apaleoGuest = await this.buildApaleoGuest(primaryGuestInput);
      try {
        await this.apaleoService.syncReservationPrimaryGuest(
          accessToken,
          reservation.mappingReservationCode,
          apaleoGuest
        );
        this.logger.log(`Sync reservation primary guest successfully: ${reservationId}`);
      } catch (error) {
        this.logger.error(`Sync reservation primary guest failed: ${error?.message}`);
      }

      // check if it is booker also => need sync the booker to apaleo
      const booking = await this.bookingRepository.getBooking(reservation.bookingId ?? '', []);
      if (booking && !booking?.isBookForSomeoneElse) {
        try {
          await this.apaleoService.syncBooker(
            accessToken,
            booking?.mappingBookingCode ?? '',
            apaleoGuest
          );
          this.logger.log(`Sync booker successfully: ${booking?.id}`);
        } catch (error) {
          this.logger.error(`Sync booker failed: ${error?.message}`);
        }
      }
    }
    return true;
  }

  async buildApaleoGuest(primaryGuest: UpdateBookingBookerInfoDto) {
    // build input body
    const guestPmsInput: ApaleoReservationGuestDto = {
      title: '',
      gender: '',
      firstName: primaryGuest.firstName ?? '',
      middleInitial: '',
      lastName: primaryGuest.lastName ?? '',
      email: primaryGuest.emailAddress ?? '',
      phone:
        [primaryGuest.countryNumber, primaryGuest.phoneNumber].filter((i) => !!i).join('') ?? '',
      address: {
        addressLine1: primaryGuest.address ?? '',
        city: primaryGuest.city ?? '',
        postalCode: primaryGuest.postalCode ?? '',
        countryCode: primaryGuest.countryId ?? ''
      }
    };
    // SYNC data for Reservation Primary Guest
    const mappedPmsReservation: ApaleoReservationGuestDto = JSON.parse(
      JSON.stringify(guestPmsInput)
    );
    if (primaryGuest.countryId) {
      const country = await this.countriesService.getCountries({ ids: [primaryGuest.countryId] });
      if (country?.length) {
        mappedPmsReservation.address.countryCode = country[0].code ?? '';
      }
    }
    return mappedPmsReservation;
  }

  async getReservationCompany(filter: ReservationManagementFilterDto) {
    filter.relations = ['company'];
    const [data, count] = await this.reservationRepository.getReservationsAndCount(filter);
    return {
      data: (data || [])?.map((reservation) => {
        const company = reservation.company;
        return company;
      }),
      totalPage: Math.ceil(count / (filter?.pageSize || 1)),
      count: (data || [])?.length
    };
  }

  async getReservationPricingDetails(filter: ReservationManagementFilterDto) {
    filter.relations = [
      'ratePlan',
      'reservationTimeSlices',
      'hotel',
      'reservationAmenities',
      'rfc'
    ];
    const data = await this.reservationRepository.getReservationDetails(filter);
    const mappedData = await this.mapReservationPricingDetails(data);
    return {
      data: mappedData,
      totalPage: 1,
      count: (mappedData || [])?.length
    };
  }

  async getReservationEmailHistory(filter: ReservationManagementFilterDto) {
    const data = await this.emailHistoryRepository.getEmailHistoryList(filter);
    const mappedData = data?.map((emailHistory) => {
      return {
        status: emailHistory.status,
        to: emailHistory.recipient_email,
        subject: emailHistory.subject,
        deliveredDate: emailHistory.delivered_date?.toISOString()
      };
    });
    return {
      data: mappedData,
      totalPage: 1,
      count: (mappedData || [])?.length
    };
  }

  async syncPmsReservations(filter: ReservationPmsFilterDto) {
    const { reservations: pmsReservations, pmsType }: any =
      await this.pmsService.getPmsReservations(filter);

    if (!pmsReservations?.length || !pmsType) {
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'No reservations found',
        data: []
      };
    }

    return await this.handleSyncPmsReservations({
      pmsReservations,
      pmsType,
      hotelId: filter.hotelId
    });
  }

  async handleSyncPmsReservations(payload: {
    pmsReservations: ApaleoReservationDto[];
    pmsType: ConnectorTypeEnum;
    hotelId: string;
  }) {
    const { pmsReservations, pmsType, hotelId } = payload;
    let bookingIds: string[] = [];

    const bookingIdsObj = {
      [ConnectorTypeEnum.APALEO]: () => {
        return pmsReservations.map((reservation) => reservation.bookingId);
      }
    };
    bookingIds = bookingIdsObj[pmsType]();
    bookingIds = [...new Set(bookingIds)].filter((id) => !!id);
    if (!bookingIds?.length) {
      this.logger.debug('No bookings found for sync pms reservations');
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'No bookings found for sync pms reservations',
        data: []
      };
    }

    const [bookings, countries] = await Promise.all([
      this.bookingRepository.getBookings({
        bookingMappingCodes: bookingIds,
        relations: [
          'reservations',
          'reservation.primaryGuest',
          'reservation.reservationAmenities',
          'reservation.reservationTimeSlices',
          'reservation.reservationRooms'
        ]
      }),
      this.countriesService.getCountries({})
    ]);

    // Process booking IDs in batches of 50 with 100ms delay
    const pmsOriginalBookings = await processInBatches(
      bookingIds,
      10, // batch size
      50, // delay in ms
      async (bookingId) => {
        return await this.pmsService.getPmsBooking({
          hotelId: hotelId,
          bookingId: bookingId
        });
      }
    );

    let pmsBookings = pmsOriginalBookings.map((item) => item.booking)?.filter((item) => !!item);
    switch (pmsType) {
      case ConnectorTypeEnum.APALEO:
        const pmsReservationsMap = new Map<string, ApaleoReservationDto[]>();
        for (const pmsReservation of pmsReservations) {
          const newPmsReservations = pmsReservationsMap.get(pmsReservation.bookingId) || [];
          newPmsReservations.push(pmsReservation);
          pmsReservationsMap.set(pmsReservation.bookingId, newPmsReservations);
        }
        const bookingsMap = new Map<string, Booking>(
          bookings.map((item) => [item.mappingBookingCode || '', item])
        );

        let list: Job<any, any, string>[] = [];
        const pmsBookingsChunks = chunk(pmsBookings, 5);
        let allResults: string[] = [];

        for (const pmsBookingsChunk of pmsBookingsChunks) {
          // list = [];
          const existingJobs = await this.reservationQueue.getJobs([
            'waiting',
            'delayed',
            'active'
          ]);
          const existingPayloadHashes = new Set(
            existingJobs.map((job) => job?.data?.payloadHash).filter((hash) => !!hash)
          );
          const pmsCityTaxList = await this.pmsService.getPmsCityTaxList(hotelId);
          const hotelCityTaxs = await this.hotelCityTaxRepository.find({
            where: {
              hotelId
            }
          });
          for (const pmsBooking of pmsBookingsChunk) {
            const payloadHash = this.redisService.generateCacheKey('process_bookings_pms', {
              mappingBookingCode: pmsBooking.id,
              hotelId: hotelId
            });

            // Check duplicate from initial fetch OR locally processed in this batch
            const isDuplicate = existingPayloadHashes.has(payloadHash);
            if (!isDuplicate) {
              existingPayloadHashes.add(payloadHash); // Add to set to prevent dupes within this same request
            }

            const delay = isDuplicate ? 100 : 0;
            // const delay = 0;
            this.logger.log(`Delay: ${delay}`);

            const jobData = {
              pmsReservations: pmsReservationsMap.get(pmsBooking.id) || [],
              pmsBookings: [pmsBooking],
              bookings:
                bookings?.filter((booking) => booking.mappingBookingCode === pmsBooking.id) || [],
              countries,
              hotelId,
              jobType: delay > 0 ? 'delayed' : 'no-delayed',
              payloadHash,
              pmsCityTaxList,
              hotelCityTaxs
            };

            // this.updateApaleoReservations(
            //   pmsReservationsMap.get(pmsBooking.id) || [],
            //   [pmsBooking],
            //   bookings?.filter((booking) => booking.mappingBookingCode === pmsBooking.id) || [],
            //   countries,
            //   hotelId,
            //   pmsCityTaxList,
            //   hotelCityTaxs
            // );

            const job = await this.reservationQueue.add(
              JOB_NAMES.RESERVATION.PROCESS_UPDATE_RESERVATION,
              jobData,
              {
                removeOnComplete: true,
                removeOnFail: true
              }
            );

            // list.push(job);
          }

          // const result = await Promise.all(
          //   list.map((j) => j.waitUntilFinished(this.reservationQueueEvents.events))
          // );
          // allResults = [...allResults, ...result];
        }
        // this.reservationQueueEvents.events.on('completed', (jobId, result) => {
        //   console.log(`Job ${jobId} completed with result: ${result}`);
        // });
        this.logger.debug(`Result of update reservation: ${allResults?.join(', ')}`);
        break;
      default:
        break;
    }

    return {
      status: 'SUCCESS',
      message: 'Sync reservations successfully',
      data: true
    };
  }

  async cancelReservation(input: CancelReservationInput) {
    const { bookingId, reservationNumber, hotelId } = input;

    if (!bookingId || !reservationNumber || !hotelId) {
      throw new NotFoundException('Booking ID, reservation number and hotel ID are required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let reservation: Reservation | null = null;
    let booking: Booking | null = null;

    try {
      await queryRunner.startTransaction();

      // fetch reservation
      reservation = await queryRunner.manager.findOne(Reservation, {
        where: { bookingId, reservationNumber, hotelId },
        relations: ['reservationRooms', 'primaryGuest', 'reservationTimeSlices']
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      // if status is CANCELLED, return
      if (reservation.status === ReservationStatusEnum.CANCELLED) {
        return true;
      }

      // fetch booking
      booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId, hotelId }
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // update reservation status
      await queryRunner.manager.update(
        Reservation,
        { id: reservation.id },
        { status: ReservationStatusEnum.CANCELLED, balance: 0 }
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      try {
        // rollback ONLY if transaction has started
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
      } catch (rollbackErr) {
        this.logger.error('Rollback failed:', rollbackErr);
      }

      throw new BadRequestException(error?.message);
    } finally {
      await queryRunner.release();
    }

    //
    //  AFTER COMMIT → call external services
    //

    // cancel PMS
    if (booking?.hotelId && booking?.mappingBookingCode) {
      if (reservation?.mappingReservationCode) {
        await this.pmsService.cancelPmsReservation(
          booking.hotelId,
          reservation.mappingReservationCode
        );
      } else {
        this.logger.error(`No mappingReservationCode for reservation ${reservation?.id}`);
      }
    }

    // send cancellation email
    await this.notificationService.sendCancelReservationEmail({
      bookingId,
      reservation,
      translateTo: reservation?.bookingLanguage || undefined,
      hotelTemplateEmail: HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION
    });

    if (reservation?.reservationTimeSlices?.length > 0) {
      const requestRooms: RequestRoomsUpdateDto[] = reservation?.reservationTimeSlices?.map(
        (r) => ({
          roomProductId: reservation?.roomProductId ?? '',
          arrival: r.fromTime ? format(r.fromTime, DATE_FORMAT) : '',
          departure: r.fromTime ? format(addDays(new Date(r.fromTime), 1), DATE_FORMAT) : '',
          roomUnitIds:
            r.roomId !== null && r.roomId !== undefined && r.roomId !== '' ? [r.roomId] : []
        })
      );

      // release room product availability
      await this.roomProductAvailabilityService.roomProductReleaseAvailability({
        hotelId: booking?.hotelId ?? '',
        requestRooms
      });
    }

    return true;
  }

  async releaseBooking(input: ReleaseBookingInput) {
    const { bookingId } = input;

    if (!bookingId) {
      throw new NotFoundException('Booking ID is required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let reservations: Reservation[] = [];
    let booking: Booking | null = null;

    try {
      await queryRunner.startTransaction();

      // get reservations
      reservations = await queryRunner.manager.find(Reservation, {
        where: { bookingId },
        relations: ['reservationRooms', 'reservationTimeSlices', 'primaryGuest']
      });

      if (!reservations.length) {
        throw new NotFoundException('Reservations not found');
      }

      // get booking
      booking = await queryRunner.manager.findOne(Booking, {
        where: { id: bookingId }
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // update all reservations to RELEASED
      await queryRunner.manager.update(
        Reservation,
        { id: In(reservations.map((r) => r.id)) },
        { status: ReservationStatusEnum.RELEASED, balance: 0 }
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      try {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
      } catch (rollbackErr) {
        this.logger.error(`Rollback failed: ${rollbackErr}`);
      }

      throw new BadRequestException(error?.message);
    } finally {
      await queryRunner.release();
    }

    //
    // ================================================
    //   AFTER COMMIT: external calls, emails, PMS, etc.
    // ================================================
    //

    // Update local objects to reflect new status outside transaction
    reservations = reservations.map((r) => ({
      ...r,
      status: ReservationStatusEnum.RELEASED
    }));

    // send email notifications
    for (const reservation of reservations) {
      await this.notificationService.sendReleasedReservationEmail({
        bookingId,
        reservation,
        translateTo: reservation.bookingLanguage || undefined,
        hotelTemplateEmail: HotelTemplateEmailCodeEnum.RELEASED_EMAIL
      });
    }

    // cancel PMS reservations
    if (booking?.hotelId && booking?.mappingBookingCode) {
      for (const reservation of reservations) {
        if (reservation.mappingReservationCode) {
          await this.pmsService.cancelPmsReservation(
            booking.hotelId,
            reservation.mappingReservationCode
          );
        } else {
          this.logger.error(`Missing mappingReservationCode for reservation ${reservation.id}`);
        }
      }
    }

    // release room availability
    await this.roomProductAvailabilityService.roomProductReleaseAvailability({
      hotelId: booking?.hotelId ?? '',
      requestRooms: reservations.map((reservation) => {
        const roomIds = Array.from(
          new Set(
            (reservation.reservationTimeSlices?.map((rr) => rr.roomId) ?? []).filter(
              (id): id is string => !!id
            )
          )
        );
        const arrivalDate = reservation.arrival
          ? format(new Date(reservation.arrival), DATE_FORMAT)
          : '';
        const departureDate = reservation.departure
          ? format(new Date(reservation.departure), DATE_FORMAT)
          : '';
        this.logger.log(
          `Release room availability for room product ${reservation.roomProductId} from ${arrivalDate} to ${departureDate}, room unit ids: ${roomIds.join(', ')}`
        );
        return {
          roomProductId: reservation.roomProductId ?? '',
          arrival: arrivalDate,
          departure: departureDate,
          roomUnitIds: roomIds
        };
      })
    });

    return true;
  }

  async sendCancellationReservationEmail(input: SendCancellationReservationEmailDto) {
    const { hotelId, reservationId, language } = input;
    const reservation = await this.reservationRepository.getById(reservationId, hotelId, [
      'primaryGuest',
      'reservationRooms'
    ]);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (!reservation.bookingId) {
      throw new NotFoundException('Reservation bookingId not found');
    }

    await this.notificationService.sendCancelReservationEmail({
      bookingId: reservation.bookingId,
      reservation: reservation,
      translateTo: input.language || reservation.bookingLanguage || undefined,
      hotelTemplateEmail: HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION
    });

    return null;
  }

  async updateApaleoReservations(
    pmsReservations: ApaleoReservationDto[],
    pmsBookings: ApaleoBookingDto[],
    bookings: Booking[],
    countries: Country[],
    hotelId: string,
    pmsCityTaxList: any[],
    hotelCityTaxs: any[]
  ) {
    let unitGroupIds: string[] = [];
    let unitIds: string[] = [];
    let ratePlanIds: string[] = [];
    let cancellationPolicyRatePlan: any[] = [];
    let reservationAmenities: ReservationAmenity[] = [];
    let reservationAmenityDates: ReservationAmenityDate[] = [];
    let reservationMappingCodes: string[] = [];

    for (const pmsReservation of pmsReservations) {
      if (pmsReservation.id) {
        reservationMappingCodes.push(pmsReservation.id);
      }
      if (pmsReservation.unitGroup?.id) {
        unitGroupIds.push(pmsReservation.unitGroup.id);
      }
      if (pmsReservation.assignedUnits?.length) {
        for (const assignedUnit of pmsReservation.assignedUnits) {
          const { unit } = assignedUnit;
          if (unit?.id) {
            unitIds.push(unit?.id);
          }
          if (unit?.unitGroupId) {
            unitGroupIds.push(unit?.unitGroupId);
          }
        }
      }

      if (pmsReservation.ratePlan?.id) {
        ratePlanIds.push(pmsReservation.ratePlan.id);
        cancellationPolicyRatePlan.push({
          ratePlanId: pmsReservation.ratePlan.id,
          arrival: pmsReservation.arrival,
          departure: pmsReservation.departure
        });
      }
    }
    unitGroupIds = [...new Set(unitGroupIds)];
    unitIds = [...new Set(unitIds)];
    ratePlanIds = [...new Set(ratePlanIds)];
    reservationMappingCodes = [...new Set(reservationMappingCodes)];

    const [units, unitGroups, hotelAmenities, ratePlans, currentReservations, hotel] =
      await Promise.all([
        unitIds?.length
          ? this.roomUnitService.getRoomUnits({
              hotelId: hotelId,
              mappingPmsCodes: unitIds
            })
          : Promise.resolve([]),
        unitGroupIds?.length
          ? this.roomProductMappingPmsRepository.getRoomProductMappings({
              hotelId: hotelId,
              mappingPmsCodes: unitGroupIds
            })
          : Promise.resolve([]),
        this.hotelAmenityRepository.getHotelAmenityList({
          hotelId: hotelId,
          status: AmenityStatusEnum.ACTIVE
        }),
        ratePlanIds?.length
          ? this.apaleoRatePlanPmsMappingRepository.find({
              where: {
                hotelId: hotelId,
                mappingRatePlanCode: In(ratePlanIds)
              }
            })
          : Promise.resolve([]),
        reservationMappingCodes?.length
          ? this.reservationRepository.getReservationByMappingReservationCode({
              mappingReservationCodes: reservationMappingCodes
            })
          : Promise.resolve([]),
        this.hotelRepository.findOne({
          where: {
            id: hotelId
          }
        })
      ]);

    if (!hotel) {
      throw new Error('hotel not found');
    }

    // Group bookings by mappingBookingCode to handle duplicates
    const bookingsByMappingCode = new Map<string, Booking[]>();
    const mapPmsReservations = new Map<string, Reservation>();
    const mapPmsBookings = new Map<string, ApaleoBookingDto>();
    const mapUnitGroups = new Map<string, RoomProductMappingPms>();
    const mapUnits = new Map<string, RoomUnit>();
    const mapHotelAmenities = new Map<string, HotelAmenity>();
    const mapCountries = new Map<string, Country>();
    const mapRatePlans = new Map<string, ApaleoRatePlanPmsMapping>();
    const mapRatePlanCxlPolicies = new Map<string, any>();
    const mapReservationAmenities = new Map<string, ReservationAmenity>();
    const mapReservationAmenityDates = new Map<string, ReservationAmenityDate[]>();
    const mapCurrentReservations = new Map<string, Reservation[]>();

    ratePlans?.forEach((ratePlan) => {
      mapRatePlans.set(ratePlan.mappingRatePlanCode, ratePlan);
    });
    countries?.forEach((country) => {
      mapCountries.set(country.code, country);
    });
    hotelAmenities?.forEach((hotelAmenity) => {
      mapHotelAmenities.set(hotelAmenity.mappingHotelAmenityCode, hotelAmenity);
    });
    unitGroups?.forEach((unitGroup) => {
      mapUnitGroups.set(unitGroup.roomProductMappingPmsCode, unitGroup);
    });
    units?.forEach((unit) => {
      mapUnits.set(unit.mappingPmsCode, unit);
    });
    pmsBookings?.forEach((pmsBooking) => {
      mapPmsBookings.set(pmsBooking.id, pmsBooking);
    });
    for (const booking of bookings) {
      if (!booking.mappingBookingCode) continue;
      // Group bookings by mappingBookingCode to handle duplicates
      const existingBookings = bookingsByMappingCode.get(booking.mappingBookingCode) || [];
      existingBookings.push(booking);
      bookingsByMappingCode.set(booking.mappingBookingCode, existingBookings);
      for (const reservation of booking.reservations) {
        reservationAmenities.push(...(reservation.reservationAmenities || []));
        if (!reservation.mappingReservationCode) continue;
        mapPmsReservations.set(reservation.mappingReservationCode, reservation);
      }
    }

    // Create a map with only the oldest booking for each mappingBookingCode
    const mapBookings = new Map<string, Booking>();
    for (const [mappingCode, bookingList] of bookingsByMappingCode.entries()) {
      // Sort by createdAt ascending (oldest first) and pick the first one
      const sortedBookings = bookingList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });
      mapBookings.set(mappingCode, sortedBookings[0]);
    }
    for (const reservation of currentReservations) {
      if (!reservation.mappingReservationCode) continue;
      const currentReservations =
        mapCurrentReservations.get(reservation.mappingReservationCode) || [];
      currentReservations.push(reservation);
      mapCurrentReservations.set(reservation.mappingReservationCode, currentReservations);
    }

    reservationAmenityDates =
      await this.reservationAmenityDateRepository.getReservationAmenityDates({
        reservationAmenityIds: reservationAmenities?.map((item) => item.id) ?? []
      });
    const rawReservationAmenityDates = reservationAmenityDates.reduce((acc, item) => {
      const key = item.reservationAmenityId || 'unknown';
      if (!acc[key]?.length) {
        acc[key] = [item];
        return acc;
      }
      acc[key].push(item);
      return acc;
    }, {});
    delete rawReservationAmenityDates['unknown'];

    for (const key in rawReservationAmenityDates) {
      mapReservationAmenityDates.set(key, rawReservationAmenityDates[key] || []);
    }

    for (const reservationAmenity of reservationAmenities) {
      if (!reservationAmenity.hotelAmenityId) {
        continue;
      }
      if (mapReservationAmenities.has(reservationAmenity.hotelAmenityId!)) {
        continue;
      }
      mapReservationAmenities.set(reservationAmenity.hotelAmenityId!, reservationAmenity);
    }

    for (const item of cancellationPolicyRatePlan) {
      const existing = mapRatePlans.get(item.ratePlanId);
      if (!existing) continue;

      mapRatePlanCxlPolicies.set(existing.ratePlanId, {
        ratePlanId: existing.ratePlanId,
        arrival: item.arrival,
        departure: item.departure
      });
    }
    const mostBeneficialCxlPolicies =
      await this.ratePlanSettingsService.getMostBeneficialCxlPolicyReservations({
        mapRatePlanCxlPolicies: mapRatePlanCxlPolicies
      });

    const updateBookings: Partial<Booking>[] = [];
    const deletedBookings: Partial<Booking>[] = [];
    const updateBookingsMap = new Map<string, boolean>();
    const updateBookingTransactions: Partial<BookingTransaction>[] = [];
    const updateReservations: Partial<Reservation>[] = [];
    const deletedReservations: Partial<Reservation>[] = [];
    const deletedReservationRooms: Partial<ReservationRoom>[] = [];
    const deletedReservationTimeSlices: Partial<ReservationTimeSlice>[] = [];
    const updateGuests: Partial<Guest>[] = [];
    const updateReservationAmenities: Partial<ReservationAmenity>[] = [];
    const updateReservationTimeSlices: Partial<ReservationTimeSlice>[] = [];
    const updateReservationRooms: Partial<ReservationRoom>[] = [];
    const updateReservationAmenityDates: Partial<ReservationAmenityDate>[] = [];
    const deletedReservationAmenities: Partial<ReservationAmenity>[] = [];
    const deletedReservationAmenityDates: Partial<ReservationAmenityDate>[] = [];
    const updateRequestRooms: RequestRoomsUpdateDto[] = [];
    const assignedRoomUnits: ProcessRoomUnitAvailabilityUpdateDto = {
      hotelId: hotelId,
      requestRooms: []
    };
    const unassignedRoomUnits: ProcessRoomUnitAvailabilityUpdateDto = {
      hotelId: hotelId,
      requestRooms: []
    };

    // const bookingFlowOtherList = [];

    for (const pmsReservation of pmsReservations) {
      const existingBooking = mapBookings.get(pmsReservation.bookingId);
      const existingReservation = mapPmsReservations.get(pmsReservation.id);
      const existingRatePlan = mapRatePlans.get(pmsReservation.ratePlan?.id);
      const existingRoomProduct = mapUnitGroups.get(
        pmsReservation.unit?.unitGroupId || pmsReservation.unitGroup?.id
      );
      const currentReservations = mapCurrentReservations.get(pmsReservation.id) || [];

      // get departure
      const departure = format(new Date(pmsReservation.departure), DATE_FORMAT);

      for (const currentReservation of currentReservations) {
        if (currentReservation.bookingId) {
          continue;
        }

        if (
          !currentReservation.hotelId ||
          (currentReservation.hotelId === hotelId &&
            existingReservation?.id !== currentReservation.id)
        ) {
          deletedReservations.push(currentReservation);
        }
      }
      if (existingBooking) {
        // Handle duplicate bookings - soft delete all except the oldest one
        const duplicateBookings = bookingsByMappingCode.get(pmsReservation.bookingId) || [];
        if (duplicateBookings.length > 1) {
          // Sort by createdAt to find oldest
          const sortedDuplicates = duplicateBookings.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          });

          // Soft delete all except the oldest (first one)
          for (let i = 1; i < sortedDuplicates.length; i++) {
            const duplicateBooking = sortedDuplicates[i];
            if (duplicateBooking.id && duplicateBooking.id !== existingBooking.id) {
              deletedBookings.push({
                id: duplicateBooking.id,
                deletedAt: new Date(),
                updatedAt: new Date(),
                updatedBy: this.currentSystem
              });
              for (const reservation of duplicateBooking.reservations || []) {
                deletedReservations.push(reservation);
              }
            }
          }
        }

        const bookingAdded = updateBookingsMap.has(existingBooking.id);
        if (!bookingAdded) {
          updateBookings.push({
            id: existingBooking.id,
            metadata: JSON.stringify(mapPmsBookings?.get(pmsReservation.bookingId)),
            deletedAt: null as any,
            updatedAt: new Date(),
            updatedBy: this.currentSystem
          });
          updateBookingsMap.set(existingBooking.id, true);
        }
        const bookingNumber = existingBooking.bookingNumber || '';
        const count =
          (updateReservations?.filter((reservation) =>
            reservation.reservationNumber?.includes(bookingNumber)
          )?.length || 0) +
          1 +
          (existingBooking.reservations?.length ?? 0);
        const reservationNo = pmsReservation.id?.split('-').at(1);
        const newReservationNumber = `${bookingNumber}${(reservationNo ?? count).toString().padStart(2, '0')}`;
        // Booking exists - update reservation and related entities
        if (existingReservation) {
          // Update existing reservation

          let status = ApaleoStatusCodeMappingEnum[pmsReservation.status];
          let hotelPaymentModeCode =
            ApaleoGuaranteeTypeMappingEnum[pmsReservation.guaranteeType as any];

          if (
            existingReservation.channel === ReservationChannelEnum.GV_SALES_ENGINE ||
            existingReservation.channel === ReservationChannelEnum.GV_VOICE
          ) {
            if (
              existingReservation.status === ReservationStatusEnum.RELEASED ||
              existingReservation.status === ReservationStatusEnum.CANCELLED
            ) {
              status = existingReservation.status;
            }

            if (
              existingReservation.status === ReservationStatusEnum.PROPOSED &&
              ApaleoStatusCodeMappingEnum[pmsReservation.status] === ReservationStatusEnum.CONFIRMED
            ) {
              status = ReservationStatusEnum.PROPOSED;
            }

            // Update hotelPaymentModeCode if it exists
            hotelPaymentModeCode = existingReservation.hotelPaymentModeCode;
            if (
              existingReservation.status !== ReservationStatusEnum.PROPOSED &&
              !existingReservation.hotelPaymentModeCode
            ) {
              hotelPaymentModeCode =
                ApaleoGuaranteeTypeMappingEnum[pmsReservation.guaranteeType as any];
            }
          }

          const { totalNetAmount, totalGrossAmount, cityTaxAmount } =
            PricingUtils.calculateApaleoReservationPricing(pmsReservation);

          const mappingReservationChannelCode = existingReservation?.mappingChannelReservationCode;
          const cityTaxDetails: any[] = pmsReservation.hasCityTax
            ? await this.buildCityTaxDetails(
                hotelId,
                pmsReservation.cityTaxCharges || [],
                pmsCityTaxList,
                hotelCityTaxs
              )
            : [];

          let cxlPolicyCode = existingReservation.cxlPolicyCode;
          if (!existingReservation.cxlPolicyCode && existingRatePlan?.ratePlanId) {
            cxlPolicyCode = mostBeneficialCxlPolicies?.[existingRatePlan.ratePlanId] || null;
          }

          const updateReservation: Partial<Reservation> = {
            ...existingReservation,
            id: existingReservation.id,
            reservationNumber: existingReservation.reservationNumber || newReservationNumber,
            hotelId: existingReservation.hotelId,
            bookingId: existingReservation.bookingId,
            ratePlanId: existingReservation.ratePlanId || null,
            roomProductId:
              existingReservation?.roomProductId ||
              existingRoomProduct?.roomProductId ||
              existingRatePlan?.roomProductId ||
              null,
            status: status,
            arrival: convertToUtcDate('UTC', pmsReservation.arrival),
            departure: convertToUtcDate('UTC', pmsReservation.departure),
            adults: pmsReservation.adults,
            childrenAges: pmsReservation.childrenAges || [],
            cxlPolicyCode: cxlPolicyCode,
            cancellationFee: pmsReservation.cancellationFee?.fee?.amount,
            noShowFee: pmsReservation.noShowFee?.fee?.amount,
            totalGrossAmount: totalGrossAmount,
            totalBaseAmount: totalNetAmount,
            cityTaxAmount: cityTaxAmount,
            taxAmount: totalGrossAmount - totalNetAmount || 0,
            cityTaxDetails: cityTaxDetails,
            currencyCode: pmsReservation.totalGrossAmount?.currency,
            note: pmsReservation.comment,
            mappingReservationCode: pmsReservation.id,
            channel:
              pmsReservation.channelCode !== ApaleoChannelCode.Ibe
                ? 'PMS'
                : existingReservation.channel || 'GV SALES ENGINE',
            source:
              pmsReservation.channelCode !== ApaleoChannelCode.Ibe
                ? pmsReservation.channelCode
                : existingReservation.source || null,
            bookingFlow:
              pmsReservation.channelCode !== ApaleoChannelCode.Ibe
                ? BookingFlow.OTHER
                : existingReservation.bookingFlow,
            balance: -pmsReservation.balance.amount || 0,
            hotelPaymentModeCode: hotelPaymentModeCode,
            updatedAt: new Date(),
            updatedBy: this.currentSystem
          };

          updateReservations.push(updateReservation);

          // Update reservation rooms
          let assignedRoomUnitIds: string[] = [];
          let unassignedRoomUnitIds: string[] = [];

          if (pmsReservation.timeSlices.length) {
            const isChangeTimeSlices =
              pmsReservation.timeSlices.length !==
              existingReservation.reservationTimeSlices?.length;
            if (isChangeTimeSlices) {
              const currentReservationTimeSlices = existingReservation.reservationTimeSlices || [];
              let currentRoomProductId = currentReservationTimeSlices[0]?.roomProductId;
              const currentArrival = existingReservation.arrival
                ? format(new Date(existingReservation.arrival), DATE_FORMAT)
                : '';
              const currentDeparture = existingReservation.departure
                ? format(new Date(existingReservation.departure), DATE_FORMAT)
                : '';

              const rvTimeSliceRoomUnits = currentReservationTimeSlices[0]?.roomId
                ? [currentReservationTimeSlices[0]?.roomId]
                : [];

              for (const [index, reservationTimeSlice] of currentReservationTimeSlices.entries()) {
                deletedReservationTimeSlices.push({
                  id: reservationTimeSlice.id,
                  deletedAt: new Date()
                });
                if (index === 0) {
                  continue;
                }

                if (
                  reservationTimeSlice.roomId &&
                  !rvTimeSliceRoomUnits.includes(reservationTimeSlice.roomId)
                ) {
                  rvTimeSliceRoomUnits.push(reservationTimeSlice.roomId);
                }
              }
              if (currentRoomProductId) {
                unassignedRoomUnits.requestRooms.push({
                  roomProductId: currentRoomProductId,
                  arrival: currentArrival,
                  departure: currentDeparture,
                  roomUnitIds: rvTimeSliceRoomUnits
                });
              }
            }
            for (const [index, timeSlice] of (pmsReservation.timeSlices || []).entries()) {
              const existingReservationTimeSlice = isChangeTimeSlices
                ? null
                : existingReservation.reservationTimeSlices?.[index];

              if (!timeSlice) continue;
              const mapUnit = mapUnits.get(timeSlice?.unit?.id);
              const mapUnitGroup = mapUnitGroups.get(timeSlice?.unit?.unitGroupId);

              updateReservationTimeSlices.push({
                id: existingReservationTimeSlice?.id || uuidv4(),
                reservationId: existingReservation.id,
                roomId: pmsReservation.assignedUnits?.length
                  ? mapUnit?.id || existingReservationTimeSlice?.roomId
                  : null,
                roomProductId:
                  mapUnitGroup?.roomProductId ||
                  existingReservationTimeSlice?.roomProductId ||
                  null,
                fromTime: convertToUtcDate('UTC', timeSlice.from),
                toTime: convertToUtcDate('UTC', timeSlice.to),
                totalBaseAmount: timeSlice.baseAmount.netAmount ?? 0,
                totalGrossAmount: timeSlice.baseAmount.grossAmount ?? 0,
                taxAmount: timeSlice.baseAmount.grossAmount - timeSlice.baseAmount.netAmount || 0,
                updatedAt: new Date(),
                updatedBy: this.currentSystem
              });

              // Update included services
              if (timeSlice.includedServices?.length) {
                for (const service of timeSlice.includedServices) {
                  const mapHotelAmenity = mapHotelAmenities.get(service.service?.id);
                  if (!mapHotelAmenity) continue;
                  const existingReservationAmenity = existingReservation.reservationAmenities?.find(
                    (item) => item.hotelAmenityId === mapHotelAmenity.id
                  );
                  const newReservationAmenityId = existingReservationAmenity?.id || uuidv4();
                  const reservationAmenity: Partial<ReservationAmenity> = {
                    id: newReservationAmenityId,
                    reservationId: existingReservation.id,
                    hotelAmenityId: mapHotelAmenity.id,
                    totalBaseAmount: service.amount.netAmount,
                    totalGrossAmount: service.amount.grossAmount,
                    taxAmount: service.amount.grossAmount - service.amount.netAmount,
                    extraServiceType: ExtraServiceTypeEnum.INCLUDED
                  };
                  updateReservationAmenities.push(reservationAmenity);

                  const existingReservationAmenityDates = mapReservationAmenityDates.get(
                    existingReservationAmenity?.id || ''
                  );
                  const existingReservationAmenityDate = existingReservationAmenityDates?.find(
                    (item) => item.date === service.serviceDate
                  );

                  // check pms service if apply for departure date -> if true, subtract 1 day from the date
                  let date = format(new Date(service.serviceDate ?? ''), DATE_FORMAT);
                  const isApplyForDepartureDate = isSameDay(
                    new Date(service.serviceDate ?? ''),
                    new Date(departure)
                  );
                  if (isApplyForDepartureDate) {
                    date = format(subDays(new Date(date), 1), DATE_FORMAT);
                  }
                  const reservationAmenityDate: Partial<ReservationAmenityDate> = {
                    id: existingReservationAmenityDate?.id || uuidv4(),
                    reservationAmenityId: newReservationAmenityId,
                    date: date,
                    count: service.count,
                    totalBaseAmount: service.amount.netAmount,
                    totalGrossAmount: service.amount.grossAmount,
                    taxAmount: service.amount.grossAmount - service.amount.netAmount,
                    updatedAt: new Date(),
                    updatedBy: this.currentSystem
                  };
                  updateReservationAmenityDates.push(reservationAmenityDate);
                }
              }

              // If the room unit is not the same as the existing reservation room, add it to the unassigned room unit ids
              if (index !== 0) continue;
              const roomUnit = mapUnits?.get(timeSlice?.unit?.id);
              for (const reservationRoom of existingReservation.reservationRooms) {
                updateReservationRooms.push({
                  id: reservationRoom.id,
                  updatedAt: new Date(),
                  updatedBy: this.currentSystem,
                  deletedAt: new Date()
                });
                if (reservationRoom.roomId === roomUnit?.id) {
                  continue;
                }
                unassignedRoomUnitIds.push(reservationRoom.roomId as string);
              }

              if (!roomUnit) continue;
              updateReservationRooms.push({
                reservationId: existingReservation.id,
                roomId: roomUnit.id,
                updatedAt: new Date(),
                updatedBy: this.currentSystem
              });
              assignedRoomUnitIds.push(roomUnit.id);
            }
          }

          const unitGroupId = pmsReservation.assignedUnits?.at(0)?.unit?.unitGroupId;

          if (
            ApaleoStatusCodeMappingEnum[pmsReservation.status] === ReservationStatusEnum.CANCELLED
          ) {
            unassignedRoomUnitIds = [
              ...new Set([...unassignedRoomUnitIds, ...assignedRoomUnitIds])
            ].filter((item) => !!item);

            assignedRoomUnitIds = [];

            unassignedRoomUnits.requestRooms.push({
              roomProductId:
                (unitGroupId && mapUnitGroups.get(unitGroupId)?.roomProductId) ||
                existingRatePlan?.roomProductId ||
                existingReservation.roomProductId ||
                '',
              arrival: format(pmsReservation.arrival, DATE_FORMAT),
              departure: format(pmsReservation.departure, DATE_FORMAT),
              roomUnitIds: unassignedRoomUnitIds
            });
          } else {
            if (assignedRoomUnitIds.length) {
              assignedRoomUnits.requestRooms.push({
                roomProductId:
                  (unitGroupId && mapUnitGroups.get(unitGroupId)?.roomProductId) ||
                  existingRatePlan?.roomProductId ||
                  existingReservation.roomProductId ||
                  '',
                arrival: format(pmsReservation.arrival, DATE_FORMAT),
                departure: format(pmsReservation.departure, DATE_FORMAT),
                roomUnitIds: [...new Set(assignedRoomUnitIds)].filter((item) => !!item)
              });
            }

            if (unassignedRoomUnitIds.length) {
              unassignedRoomUnits.requestRooms.push({
                roomProductId:
                  (unitGroupId && mapUnitGroups.get(unitGroupId)?.roomProductId) ||
                  existingReservation.roomProductId ||
                  existingRatePlan?.roomProductId ||
                  '',
                arrival: format(pmsReservation.arrival, DATE_FORMAT),
                departure: format(pmsReservation.departure, DATE_FORMAT),
                roomUnitIds: [...new Set(unassignedRoomUnitIds)].filter((item) => !!item)
              });
            }

            if (
              existingReservation.roomProductId &&
              updateReservation.roomProductId &&
              existingReservation.roomProductId !== updateReservation.roomProductId
            ) {
              const isExistingAssign = assignedRoomUnits.requestRooms.some(
                (item) => item.roomProductId === updateReservation.roomProductId
              );
              if (!isExistingAssign) {
                assignedRoomUnits.requestRooms.push({
                  roomProductId: updateReservation.roomProductId,
                  arrival: format(pmsReservation.arrival, DATE_FORMAT),
                  departure: format(pmsReservation.departure, DATE_FORMAT),
                  roomUnitIds: []
                });
              }

              const isExistingUnassign = unassignedRoomUnits.requestRooms.some(
                (item) => item.roomProductId === existingReservation.roomProductId
              );
              if (!isExistingUnassign) {
                unassignedRoomUnits.requestRooms.push({
                  roomProductId: existingReservation.roomProductId,
                  arrival: format(pmsReservation.arrival, DATE_FORMAT),
                  departure: format(pmsReservation.departure, DATE_FORMAT),
                  roomUnitIds: []
                });
              }
            }
          }

          // Update reservation amenities (services)
          // Track which hotel amenity IDs are present in PMS services
          // current GV system handle included services -> but push to pms is extra services
          // and pms data reservation not has included services -> so we need to handle it
          const pmsServiceHotelAmenityIds = new Set<string>();

          if (pmsReservation.services?.length) {
            for (const service of pmsReservation.services) {
              const mapHotelAmenity = mapHotelAmenities.get(service.service?.id);
              if (!mapHotelAmenity) continue;

              // Track this hotel amenity as present in PMS
              pmsServiceHotelAmenityIds.add(mapHotelAmenity.id);

              // check if reservation amenity has included service type is already exists
              // skip if exists
              const existingReservationAmenity = mapReservationAmenities.get(mapHotelAmenity.id!);
              if (
                existingReservationAmenity &&
                existingReservationAmenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
              ) {
                continue;
              }

              const existingReservationAmenities =
                existingReservation.reservationAmenities?.filter(
                  (item) => item.hotelAmenityId === mapHotelAmenity.id
                ) || [];

              if (!existingReservationAmenities?.length) {
                const newReservationAmenityId = uuidv4();
                const reservationAmenity: Partial<ReservationAmenity> = {
                  id: newReservationAmenityId,
                  reservationId: existingReservation.id,
                  hotelAmenityId: mapHotelAmenity.id,
                  totalBaseAmount: service.totalAmount.netAmount,
                  totalGrossAmount: service.totalAmount.grossAmount,
                  taxAmount: service.totalAmount.grossAmount - service.totalAmount.netAmount,
                  extraServiceType: ExtraServiceTypeEnum.EXTRA
                };
                updateReservationAmenities.push(reservationAmenity);

                // Create reservation amenity dates for new service
                if (service.dates?.length) {
                  for (const serviceDate of service.dates) {
                    // check pms service if apply for departure date -> if true, subtract 1 day from the date
                    let date = format(new Date(serviceDate.serviceDate ?? ''), DATE_FORMAT);
                    const isApplyForDepartureDate = isSameDay(
                      new Date(serviceDate.serviceDate ?? ''),
                      new Date(departure)
                    );
                    if (isApplyForDepartureDate) {
                      date = format(subDays(new Date(date), 1), DATE_FORMAT);
                    }

                    const reservationAmenityDate: Partial<ReservationAmenityDate> = {
                      id: uuidv4(),
                      reservationAmenityId: newReservationAmenityId,
                      date: date,
                      count: serviceDate.count,
                      totalBaseAmount: serviceDate.amount.netAmount,
                      totalGrossAmount: serviceDate.amount.grossAmount,
                      taxAmount: serviceDate.amount.grossAmount - serviceDate.amount.netAmount,
                      updatedAt: new Date(),
                      updatedBy: this.currentSystem
                    };
                    updateReservationAmenityDates.push(reservationAmenityDate);
                  }
                }
                continue;
              }

              let totalGrossAmount = service.totalAmount.grossAmount;
              let totalBaseAmount = service.totalAmount.netAmount;
              for (const existingReservationAmenity of existingReservationAmenities) {
                // if (
                //   existingReservationAmenity.ageCategoryCode !== HotelAgeCategoryCodeEnum.DEFAULT
                // ) {
                //   totalGrossAmount =
                //     totalGrossAmount - (existingReservationAmenity.totalGrossAmount ?? 0);
                //   totalBaseAmount =
                //     totalBaseAmount - (existingReservationAmenity.totalBaseAmount ?? 0);
                //   continue;
                // }
                const reservationAmenity: Partial<ReservationAmenity> = {
                  ...existingReservationAmenity,
                  id: existingReservationAmenity.id,
                  reservationId: existingReservation.id,
                  hotelAmenityId: mapHotelAmenity.id,
                  totalBaseAmount: totalBaseAmount,
                  totalGrossAmount: totalGrossAmount,
                  taxAmount: totalGrossAmount - totalBaseAmount,
                  extraServiceType: ExtraServiceTypeEnum.EXTRA
                };
                updateReservationAmenities.push(reservationAmenity);

                const existingReservationAmenityDates = mapReservationAmenityDates.get(
                  existingReservationAmenity?.id || ''
                );

                for (const existingReservationAmenityDate of existingReservationAmenityDates ||
                  []) {
                  // check if service date is in the existing reservation amenity dates
                  const serviceDate = service.dates?.find(
                    (item) =>
                      format(new Date(item.serviceDate ?? ''), DATE_FORMAT) ===
                      format(new Date(existingReservationAmenityDate.date ?? ''), DATE_FORMAT)
                  );
                  if (!serviceDate) {
                    continue;
                  }

                  // check pms service if apply for departure date -> if true, subtract 1 day from the date
                  let date = format(new Date(serviceDate.serviceDate ?? ''), DATE_FORMAT);
                  const isApplyForDepartureDate = isSameDay(
                    new Date(serviceDate.serviceDate ?? ''),
                    new Date(departure)
                  );
                  if (isApplyForDepartureDate) {
                    date = format(subDays(new Date(date), 1), DATE_FORMAT);
                  }

                  const reservationAmenityDate: Partial<ReservationAmenityDate> = {
                    ...existingReservationAmenityDate,
                    id: existingReservationAmenityDate.id,
                    reservationAmenityId: existingReservationAmenityDate.reservationAmenityId,
                    date: date,
                    count: serviceDate.count,
                    totalBaseAmount: serviceDate.amount.netAmount,
                    totalGrossAmount: serviceDate.amount.grossAmount,
                    taxAmount: serviceDate.amount.grossAmount - serviceDate.amount.netAmount,
                    updatedAt: new Date(),
                    updatedBy: this.currentSystem
                  };
                  updateReservationAmenityDates.push(reservationAmenityDate);
                }
              }
            }
          }

          // Soft delete reservation amenities that were removed from PMS
          // Only delete amenities that are mapped to PMS services (exist in mapHotelAmenities)
          // but are not present in the current PMS services
          const existingExtraReservationAmenities = [...existingReservation.reservationAmenities];

          for (const existingReservationAmenity of existingExtraReservationAmenities) {
            // Skip if hotelAmenityId is missing
            if (!existingReservationAmenity.hotelAmenityId) {
              continue;
            }

            // Check if this amenity's hotelAmenityId is present in current PMS services
            if (!pmsServiceHotelAmenityIds.has(existingReservationAmenity.hotelAmenityId)) {
              // Only soft delete if the amenity has an id
              if (!existingReservationAmenity.id) {
                continue;
              }

              // Soft delete the reservation amenity
              deletedReservationAmenities.push({
                id: existingReservationAmenity.id
              });

              // Soft delete all related reservation amenity dates
              const existingReservationAmenityDates =
                mapReservationAmenityDates.get(existingReservationAmenity.id) || [];

              for (const existingReservationAmenityDate of existingReservationAmenityDates) {
                if (existingReservationAmenityDate.id) {
                  deletedReservationAmenityDates.push({
                    id: existingReservationAmenityDate.id
                  });
                }
              }
            }
          }
        } else {
          // Create new reservation for existing booking
          // const newChannel =
          //   ApaleoChannelCodeMappingEnum[pmsReservation.channelCode as any] || 'PMS';
          this.logger.debug(`Creating new reservation for mapping code ${existingBooking.id}`);
          const newReservationId = uuidv4();
          const primaryGuestId = uuidv4();
          const bookerId = uuidv4();

          const { totalNetAmount, totalGrossAmount, cityTaxAmount } =
            PricingUtils.calculateApaleoReservationPricing(pmsReservation);

          // Build cityTaxDetails from cityTaxCharges
          const cityTaxDetails = pmsReservation.hasCityTax
            ? await this.buildCityTaxDetails(
                hotelId,
                pmsReservation.cityTaxCharges || [],
                pmsCityTaxList,
                hotelCityTaxs
              )
            : [];

          updateReservations.push({
            id: newReservationId,
            bookingId: existingBooking.id,
            hotelId: hotelId,
            primaryGuestId: primaryGuestId,
            reservationNumber: newReservationNumber,
            ratePlanId: existingRatePlan?.ratePlanId || null,
            roomProductId:
              existingRoomProduct?.roomProductId || existingRatePlan?.roomProductId || null,
            status: ApaleoStatusCodeMappingEnum[pmsReservation.status],
            arrival: convertToUtcDate('UTC', pmsReservation.arrival),
            departure: convertToUtcDate('UTC', pmsReservation.departure),
            adults: pmsReservation.adults,
            childrenAges: pmsReservation.childrenAges || [],
            cxlPolicyCode: existingRatePlan?.ratePlanId
              ? mostBeneficialCxlPolicies?.[existingRatePlan.ratePlanId]
              : null,
            cancellationFee: pmsReservation.cancellationFee?.fee?.amount,
            noShowFee: pmsReservation.noShowFee?.fee?.amount,
            totalGrossAmount: totalGrossAmount,
            totalBaseAmount: totalNetAmount,
            taxAmount: totalGrossAmount - totalNetAmount || 0,
            cityTaxAmount: cityTaxAmount,
            cityTaxDetails: cityTaxDetails,
            currencyCode: pmsReservation.totalGrossAmount.currency,
            note: pmsReservation.comment,
            mappingReservationCode: pmsReservation.id,
            channel:
              pmsReservation.channelCode !== ApaleoChannelCode.Ibe ? 'PMS' : 'GV SALES ENGINE',
            source: pmsReservation.channelCode,
            bookingFlow: BookingFlow.OTHER,
            balance: -pmsReservation.balance.amount || 0,
            createdAt: convertToUtcDate('UTC', pmsReservation.created),
            updatedAt: new Date(),
            updatedBy: this.currentSystem,
            hotelPaymentModeCode:
              ApaleoGuaranteeTypeMappingEnum[pmsReservation.guaranteeType as any] || null
          });

          // Create related entities for new reservation
          this.createReservationRelatedEntities(
            hotelId,
            existingBooking.id,
            bookerId,
            primaryGuestId,
            newReservationId,
            pmsReservation,
            pmsBookings,
            updateBookingTransactions,
            updateReservationTimeSlices,
            updateReservationRooms,
            updateReservationAmenities,
            updateReservationAmenityDates,
            updateGuests,
            mapHotelAmenities,
            mapUnitGroups,
            mapUnits,
            mapCountries,
            updateRequestRooms,
            assignedRoomUnits
          );
        }
      } else {
        // Booking does not exist - create new booking and reservation
        const existingBooking = updateBookings.find(
          (booking) => booking.mappingBookingCode === pmsReservation.bookingId
        );
        const newBookingId = existingBooking?.id || uuidv4();
        const newReservationId = uuidv4();
        let newBookingNumber: any = String(Date.now());
        let newBookerId = '';
        const newPrimaryGuestId = uuidv4();
        const primaryGuest = pmsReservation.primaryGuest;
        const booker = pmsReservation.booker;
        if (
          primaryGuest.email === booker?.email &&
          primaryGuest.firstName === booker?.firstName &&
          primaryGuest.lastName === booker?.lastName
        ) {
          newBookerId = newPrimaryGuestId;
        } else {
          newBookerId = uuidv4();
        }

        if (!existingBooking) {
          // Create new booking
          updateBookings.push({
            id: newBookingId,
            hotelId: hotelId,
            bookerId: newBookerId,
            mappingBookingCode: pmsReservation.bookingId,
            bookingNumber: newBookingNumber,
            metadata: JSON.stringify(mapPmsBookings?.get(pmsReservation.bookingId)),
            createdAt: convertToUtcDate('UTC', pmsReservation.created),
            updatedAt: new Date(),
            updatedBy: this.currentSystem
          });
        } else {
          newBookingNumber = existingBooking.bookingNumber;
        }

        const count =
          (updateReservations?.filter((reservation) =>
            reservation.reservationNumber?.includes(newBookingNumber)
          )?.length || 0) + 1;
        const reservationNo = pmsReservation.id?.split('-').at(1);
        const newReservationNumber = `${newBookingNumber}${(reservationNo ?? count).toString().padStart(2, '0')}`;
        // const newChannel = ApaleoChannelCodeMappingEnum[pmsReservation.channelCode as any] || 'PMS';
        // Create new reservation
        const { totalNetAmount, totalGrossAmount, cityTaxAmount } =
          PricingUtils.calculateApaleoReservationPricing(pmsReservation);

        // Build cityTaxDetails from cityTaxCharges
        const cityTaxDetails = pmsReservation.hasCityTax
          ? await this.buildCityTaxDetails(
              hotelId,
              pmsReservation.cityTaxCharges || [],
              pmsCityTaxList,
              hotelCityTaxs
            )
          : [];

        updateReservations.push({
          id: newReservationId,
          bookingId: newBookingId,
          hotelId: hotelId,
          reservationNumber: newReservationNumber,
          ratePlanId: existingRatePlan?.ratePlanId || null,
          roomProductId:
            existingReservation?.roomProductId ||
            existingRoomProduct?.roomProductId ||
            existingRatePlan?.roomProductId ||
            null,
          primaryGuestId: newPrimaryGuestId,
          status: ApaleoStatusCodeMappingEnum[pmsReservation.status],
          arrival: convertToUtcDate('UTC', pmsReservation.arrival),
          departure: convertToUtcDate('UTC', pmsReservation.departure),
          adults: pmsReservation.adults,
          childrenAges: pmsReservation.childrenAges,
          cxlPolicyCode: existingRatePlan?.ratePlanId
            ? mostBeneficialCxlPolicies?.[existingRatePlan.ratePlanId]
            : null,
          cancellationFee: pmsReservation.cancellationFee?.fee?.amount,
          noShowFee: pmsReservation.noShowFee?.fee?.amount,
          totalGrossAmount: totalGrossAmount,
          totalBaseAmount: totalNetAmount,
          cityTaxAmount: cityTaxAmount,
          cityTaxDetails: cityTaxDetails,
          currencyCode: pmsReservation.totalGrossAmount.currency,
          note: pmsReservation.comment,
          channel: pmsReservation.channelCode !== ApaleoChannelCode.Ibe ? 'PMS' : 'GV SALES ENGINE',
          source: pmsReservation.channelCode,
          bookingFlow: BookingFlow.OTHER,
          balance: -pmsReservation.balance.amount || 0,
          mappingReservationCode: pmsReservation.id,
          createdAt: convertToUtcDate('UTC', pmsReservation.created),
          updatedAt: new Date(),
          updatedBy: this.currentSystem,
          hotelPaymentModeCode:
            ApaleoGuaranteeTypeMappingEnum[pmsReservation.guaranteeType as any] || null
        });

        // Create related entities for new reservation
        this.createReservationRelatedEntities(
          hotelId,
          newBookingId,
          newBookerId,
          newPrimaryGuestId,
          newReservationId,
          pmsReservation,
          pmsBookings,
          updateBookingTransactions,
          updateReservationTimeSlices,
          updateReservationRooms,
          updateReservationAmenities,
          updateReservationAmenityDates,
          updateGuests,
          mapHotelAmenities,
          mapUnitGroups,
          mapUnits,
          mapCountries,
          updateRequestRooms,
          assignedRoomUnits
        );
      }
    }

    if (deletedReservations.length) {
      const deletedReservationIds: string[] = [];
      for (const deletedReservation of deletedReservations) {
        if (!deletedReservation.id) {
          continue;
        }
        deletedReservationIds.push(deletedReservation.id);
      }
      const [reservationRooms, reservationTimeSlices] = await Promise.all([
        this.reservationRoomRepository.find({
          where: { reservationId: In(deletedReservationIds) }
        }),
        this.reservationTimeSliceRepository.findAll({ reservationIds: deletedReservationIds })
      ]);

      for (const deletedReservation of deletedReservations) {
        const findDeletedReservationTimeSlices = reservationTimeSlices.filter(
          (item) => item.reservationId === deletedReservation.id
        );
        if (findDeletedReservationTimeSlices && findDeletedReservationTimeSlices.length) {
          if (deletedReservation && deletedReservation.arrival && deletedReservation.departure) {
            const roomUnitIds = Array.from(
              new Set(
                findDeletedReservationTimeSlices
                  .map((item) => item.roomId)
                  .filter((item: string): item is string => !!item)
              )
            );

            unassignedRoomUnits.requestRooms.push({
              roomProductId: deletedReservation.roomProductId || '',
              arrival: format(deletedReservation.arrival, DATE_FORMAT),
              departure: format(deletedReservation.departure, DATE_FORMAT),
              roomUnitIds: roomUnitIds.filter((item) => !!item)
            });
          }
        }
      }

      deletedReservationRooms.push(...reservationRooms);
      deletedReservationTimeSlices.push(...reservationTimeSlices);
    }

    await this.executeBatchUpdates(
      updateBookings,
      updateBookingTransactions,
      updateReservations,
      updateGuests,
      updateReservationAmenities,
      updateReservationTimeSlices,
      updateReservationRooms,
      updateReservationAmenityDates,
      updateRequestRooms,
      assignedRoomUnits,
      unassignedRoomUnits,
      deletedReservations,
      deletedReservationRooms,
      deletedReservationTimeSlices,
      deletedBookings,
      deletedReservationAmenities,
      deletedReservationAmenityDates
    );
  }

  async getTimeSlice(hotel: Hotel): Promise<{ CI: string; CO: string }> {
    const timeSliceConfiguration = await this.hotelConfigurationRepository.getHotelConfiguration({
      hotelId: hotel.id,
      configType: HotelConfigurationTypeEnum.TIME_SLICE_CONFIGURATION,
      deletedAt: null
    });

    const timeSlice = timeSliceConfiguration?.configValue?.metadata as {
      CI: string;
      CO: string;
    };
    // hard code time slice if not found
    return timeSlice ?? { CI: '14:00', CO: '12:00' };
  }

  private async buildCityTaxDetails(
    hotelId: string,
    cityTaxCharges: ApaleoFolioChargeDto[],
    pmsCityTaxList: any[],
    hotelCityTaxs: any[]
  ) {
    const filtered = pmsCityTaxList.filter((item) =>
      hotelCityTaxs.some((hct) => hct.mappingPmsCityTaxCode === item.mappingCityTaxCode)
    );
    return cityTaxCharges.map((c) => {
      const chargedCityTaxFiltered = filtered.find(
        (item) => item.mappingCityTaxCode === c.id || item.name === c.name
      );
      return {
        ...chargedCityTaxFiltered,
        name: chargedCityTaxFiltered?.name,
        amount: c.amount.grossAmount,
        metadata: c
      };
    });
  }

  private async executeBatchUpdates(
    updateBookings: Partial<Booking>[],
    updateBookingTransactions: Partial<BookingTransaction>[],
    updateReservations: Partial<Reservation>[],
    updateGuests: Partial<Guest>[],
    updateReservationAmenities: Partial<ReservationAmenity>[],
    updateReservationTimeSlices: Partial<ReservationTimeSlice>[],
    updateReservationRooms: Partial<ReservationRoom>[],
    updateReservationAmenityDates: Partial<ReservationAmenityDate>[],
    updateRequestRooms: RequestRoomsUpdateDto[],
    assignedRoomUnits: ProcessRoomUnitAvailabilityUpdateDto,
    unassignedRoomUnits: ProcessRoomUnitAvailabilityUpdateDto,
    deletedReservations: Partial<Reservation>[],
    deletedReservationRooms: Partial<ReservationRoom>[],
    deletedReservationTimeSlices: Partial<ReservationTimeSlice>[],
    deletedBookings: Partial<Booking>[],
    deletedReservationAmenities: Partial<ReservationAmenity>[],
    deletedReservationAmenityDates: Partial<ReservationAmenityDate>[]
  ) {
    let isUpdateSuccess = false;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (unassignedRoomUnits.requestRooms.length) {
      console.log('unassignedRoomUnits', JSON.stringify(unassignedRoomUnits));

      await this.roomProductAvailabilityService.roomProductReleaseAvailability(unassignedRoomUnits);
    }

    try {
      if (updateGuests.length) {
        await queryRunner.manager.upsert(Guest, updateGuests, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      // soft delete reservation time slices
      if (deletedReservationTimeSlices.length) {
        await queryRunner.manager.softDelete(
          ReservationTimeSlice,
          deletedReservationTimeSlices.map((r) => r.id)
        );
      }

      // soft delete reservation rooms
      if (deletedReservationRooms.length) {
        await queryRunner.manager.softDelete(
          ReservationRoom,
          deletedReservationRooms.map((r) => r.id)
        );
      }

      // soft delete reservations
      if (deletedReservations.length) {
        await queryRunner.manager.softDelete(
          Reservation,
          deletedReservations.map((r) => r.id)
        );
      }

      // Use queryRunner.manager for all database operations within the transaction
      if (updateBookings.length) {
        await queryRunner.manager.upsert(Booking, updateBookings, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      // Soft delete duplicate bookings
      if (deletedBookings.length) {
        const deletedBookingIds = deletedBookings
          .map((b) => b.id)
          .filter((id): id is string => !!id);
        if (deletedBookingIds.length) {
          await queryRunner.manager.softDelete(Booking, deletedBookingIds);
        }
      }

      if (updateBookingTransactions.length) {
        await queryRunner.manager.upsert(BookingTransaction, updateBookingTransactions, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      // update reservations
      if (updateReservations.length) {
        await queryRunner.manager.upsert(Reservation, updateReservations, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      if (updateReservationAmenities.length) {
        const uniqueAmenities = Array.from(
          new Map(updateReservationAmenities.map((a) => [a.id, a])).values()
        );
        await queryRunner.manager.upsert(ReservationAmenity, uniqueAmenities, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      if (updateReservationTimeSlices.length) {
        const uniqueReservationTimeSlices = Array.from(
          new Map(updateReservationTimeSlices.map((a) => [a.id, a])).values()
        );
        await queryRunner.manager.upsert(ReservationTimeSlice, uniqueReservationTimeSlices, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      if (updateReservationRooms.length) {
        // Upsert normal rows
        const normalRows = updateReservationRooms.filter((row) => !row.deletedAt);
        if (normalRows?.length) {
          await queryRunner.manager.upsert(ReservationRoom, normalRows, {
            conflictPaths: ['id'],
            skipUpdateIfNoValuesChanged: true
          });
        }

        // Soft delete rows
        const deletedRows = updateReservationRooms.filter((row) => row.deletedAt);
        if (deletedRows?.length) {
          const deletedIds = deletedRows.map((row) => row.id);
          await queryRunner.manager.softDelete(ReservationRoom, deletedIds);
        }

        // process process_room_unit_availability_update
      }

      if (updateReservationAmenityDates.length) {
        await queryRunner.manager.upsert(ReservationAmenityDate, updateReservationAmenityDates, {
          conflictPaths: ['id'],
          skipUpdateIfNoValuesChanged: true
        });
      }

      if (deletedReservationAmenities.length) {
        await queryRunner.manager.softDelete(
          ReservationAmenity,
          deletedReservationAmenities.map((item) => item.id)
        );
      }

      if (deletedReservationAmenityDates.length) {
        await queryRunner.manager.softDelete(
          ReservationAmenityDate,
          deletedReservationAmenityDates.map((item) => item.id)
        );
      }

      // if (updateRequestRooms.length) {
      //   // start processing room unit availability update
      //   await this.roomProductAvailabilityService.processRoomUnitAvailabilityUpdate({
      //     hotelId: updateReservations[0].hotelId || '',
      //     requestRooms: updateRequestRooms
      //   });
      // }

      await queryRunner.commitTransaction();

      isUpdateSuccess = true;

      // const ids = updateReservationTimeSlices?.map((i) => i.id);
      // if (ids?.length) {
      //   const newReservationTimeSlices = await queryRunner.manager.find(ReservationTimeSlice, {
      //     where: {
      //       id: In(updateReservationTimeSlices?.map((i) => i.id))
      //     },
      //     relations: {
      //       reservation: true
      //     }
      //   });
      //   const chunkTimeSlices = chunk(newReservationTimeSlices, 50);
      //   for (const chunkTimeSlice of chunkTimeSlices) {
      //     await Promise.all(
      //       chunkTimeSlice.map((item) => {
      //         if (!item.reservation?.hotelId) {
      //           return Promise.resolve();
      //         }
      //         const hotelId = item.reservation.hotelId;
      //         const roomProductIds = item.roomProductId ? [item.roomProductId] : [];
      //         const dateRange = item.fromTime ? [format(item.fromTime, 'yyyy-MM-dd')] : [];
      //         if (!roomProductIds.length) {
      //           return Promise.resolve();
      //         }
      //         if (!dateRange.length) {
      //           return Promise.resolve();
      //         }
      //         this.logger.debug(
      //           `Trigger Update availability for room product ${item.roomProductId} in ${dateRange}`
      //         );
      //         return this.roomProductAvailabilityService.processUpdateRoomProductAvailability(
      //           hotelId,
      //           roomProductIds,
      //           dateRange
      //         );
      //       })
      //     );
      //   }
      // }
    } catch (error) {
      isUpdateSuccess = false;
      // rollback room product availability
      await this.roomProductAvailabilityService.processRoomUnitAvailabilityUpdate(
        unassignedRoomUnits,
        'updateApaleoReservations - rollback room product availability'
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    if (isUpdateSuccess) {
      if (assignedRoomUnits.requestRooms.length) {
        console.log('assignedRoomUnits', JSON.stringify(assignedRoomUnits));
        await this.roomProductAvailabilityService.processRoomUnitAvailabilityUpdate(
          assignedRoomUnits,
          'updateApaleoReservations - isUpdateSuccess'
        );
      }
    }
  }

  private createReservationRelatedEntities(
    hotelId: string,
    bookingId: string,
    bookerId: string,
    primaryGuestId: string,
    reservationId: string,
    pmsReservation: ApaleoReservationDto,
    pmsBookings: ApaleoBookingDto[],
    updateBookingTransactions: Partial<BookingTransaction>[],
    updateReservationTimeSlices: Partial<ReservationTimeSlice>[],
    updateReservationRooms: Partial<ReservationRoom>[],
    updateReservationAmenities: Partial<ReservationAmenity>[],
    updateReservationAmenityDates: Partial<ReservationAmenityDate>[],
    updateGuests: Partial<Guest>[],
    mapHotelAmenities: Map<string, HotelAmenity>,
    mapUnitGroups: Map<string, RoomProductMappingPms>,
    mapUnits: Map<string, RoomUnit>,
    mapCountries: Map<string, Country>,
    updateRequestRooms: Partial<RequestRoomsUpdateDto>[],
    assignedRoomUnits: ProcessRoomUnitAvailabilityUpdateDto
  ): void {
    const pmsBooking = pmsBookings.find((pmsBooking) => pmsBooking.id === pmsReservation.bookingId);

    // get departure
    const departure = format(new Date(pmsReservation.departure), DATE_FORMAT);

    if (pmsBooking?.paymentAccount) {
      const paymentAccount = pmsBooking.paymentAccount;
      updateBookingTransactions.push({
        id: uuidv4(),
        bookingId: bookingId,
        paymentDate: convertToUtcDate('UTC', pmsReservation.created),
        accountNumber: paymentAccount.accountNumber,
        accountHolder: paymentAccount.accountHolder,
        expiryMonth: paymentAccount.expiryMonth,
        expiryYear: paymentAccount.expiryYear,
        cardType: paymentAccount.paymentMethod,
        status: paymentAccount.isActive
          ? BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
          : BookingTransactionStatusEnum.PAYMENT_PENDING,
        createdAt: convertToUtcDate('UTC', pmsReservation.created),
        updatedAt: new Date(),
        updatedBy: this.currentSystem
      });
    }

    // Create reservation time slices
    if (pmsReservation.timeSlices.length) {
      for (const timeSlice of pmsReservation.timeSlices) {
        const mapUnit = mapUnits.get(timeSlice?.unit?.id);
        const mapUnitGroup = mapUnitGroups.get(timeSlice?.unitGroup?.id);
        if (!mapUnitGroup) continue;
        updateReservationTimeSlices.push({
          id: uuidv4(),
          reservationId: reservationId,
          roomId: mapUnit?.id,
          roomProductId: mapUnitGroup.roomProductId,
          fromTime: convertToUtcDate('UTC', timeSlice.from),
          toTime: convertToUtcDate('UTC', timeSlice.to),
          totalBaseAmount: timeSlice?.baseAmount?.netAmount || 0, // do not use totalGrossAmount for base amount
          totalGrossAmount: timeSlice?.baseAmount?.grossAmount || 0,
          taxAmount:
            timeSlice?.baseAmount?.grossAmount - timeSlice?.baseAmount?.netAmount || 0 || 0,
          createdAt: convertToUtcDate('UTC', pmsReservation.created),
          updatedAt: new Date(),
          updatedBy: this.currentSystem
        });

        if (mapUnit) {
          // updateRequestRooms.push({
          //   roomProductId: mapUnitGroup.roomProductId,
          //   arrival: format(timeSlice.from, 'yyyy-MM-dd'),
          //   departure: format(timeSlice.to, 'yyyy-MM-dd'),
          //   roomUnitIds: [mapUnit.id]
          // });

          assignedRoomUnits.requestRooms.push({
            roomProductId: mapUnitGroup.roomProductId,
            arrival: format(timeSlice.from, 'yyyy-MM-dd'),
            departure: format(timeSlice.to, 'yyyy-MM-dd'),
            roomUnitIds: [mapUnit.id]
          });
        } else {
          assignedRoomUnits.requestRooms.push({
            roomProductId: mapUnitGroup.roomProductId,
            arrival: format(timeSlice.from, 'yyyy-MM-dd'),
            departure: format(timeSlice.to, 'yyyy-MM-dd'),
            roomUnitIds: []
          });
        }

        // Create reservation amenities for included services
        if (timeSlice.includedServices?.length) {
          for (const service of timeSlice.includedServices) {
            const mapHotelAmenity = mapHotelAmenities.get(service.service?.id);
            if (!mapHotelAmenity) continue;
            const reservationAmenityId = uuidv4();
            const reservationAmenity: Partial<ReservationAmenity> = {
              id: reservationAmenityId,
              reservationId: reservationId,
              hotelAmenityId: mapHotelAmenity.id,
              totalBaseAmount: service.amount.netAmount,
              totalGrossAmount: service.amount.grossAmount,
              taxAmount: service.amount.grossAmount - service.amount.netAmount,
              extraServiceType: ExtraServiceTypeEnum.INCLUDED,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: this.currentSystem
            };
            updateReservationAmenities.push(reservationAmenity);

            // check pms service if apply for departure date -> if true, subtract 1 day from the date
            let date = format(new Date(service.serviceDate ?? ''), DATE_FORMAT);
            const isApplyForDepartureDate = isSameDay(
              new Date(service.serviceDate ?? ''),
              new Date(departure)
            );
            if (isApplyForDepartureDate) {
              date = format(subDays(new Date(date), 1), DATE_FORMAT);
            }

            // Update reservation amenity dates
            updateReservationAmenityDates.push({
              id: uuidv4(),
              reservationAmenityId: reservationAmenityId,
              date: date,
              count: service.count,
              totalBaseAmount: service.amount.netAmount,
              totalGrossAmount: service.amount.grossAmount,
              taxAmount: service.amount.grossAmount - service.amount.netAmount,
              createdAt: new Date(),
              updatedAt: new Date(),
              updatedBy: this.currentSystem
            });
          }
        }
      }
    }

    // Create reservation rooms
    if (pmsReservation.assignedUnits?.length) {
      for (const assignedUnit of pmsReservation.assignedUnits) {
        const mapUnit = mapUnits.get(assignedUnit.unit.id);
        if (!mapUnit) continue;
        updateReservationRooms.push({
          id: uuidv4(),
          reservationId: reservationId,
          roomId: mapUnit.id,
          createdAt: convertToUtcDate('UTC', pmsReservation.created),
          updatedAt: new Date(),
          updatedBy: this.currentSystem
        });
      }
    }

    // Create reservation amenities (services)
    if (pmsReservation.services?.length) {
      for (const service of pmsReservation.services) {
        if (!service) continue;
        const reservationAmenityId = uuidv4();
        const mapHotelAmenity = mapHotelAmenities.get(service.service?.id);
        if (!mapHotelAmenity) continue;

        updateReservationAmenities.push({
          id: reservationAmenityId,
          reservationId: reservationId,
          hotelAmenityId: mapHotelAmenities.get(service.service?.id)?.id || null,
          totalBaseAmount: service.totalAmount?.netAmount,
          totalGrossAmount: service.totalAmount?.grossAmount,
          createdAt: convertToUtcDate('UTC', pmsReservation.created),
          taxAmount: service.totalAmount?.grossAmount - service.totalAmount?.netAmount,
          extraServiceType: ExtraServiceTypeEnum.EXTRA,
          updatedAt: new Date(),
          updatedBy: this.currentSystem
        });

        for (const serviceDate of service.dates) {
          // check pms service if apply for departure date -> if true, subtract 1 day from the date
          let date = format(new Date(serviceDate.serviceDate ?? ''), DATE_FORMAT);
          const isApplyForDepartureDate = isSameDay(
            new Date(serviceDate.serviceDate ?? ''),
            new Date(departure)
          );
          if (isApplyForDepartureDate) {
            date = format(subDays(new Date(date), 1), DATE_FORMAT);
          }
          updateReservationAmenityDates.push({
            id: uuidv4(),
            reservationAmenityId: reservationAmenityId,
            date: date,
            count: serviceDate.count,
            totalBaseAmount: serviceDate.amount.netAmount,
            totalGrossAmount: serviceDate.amount.grossAmount,
            taxAmount: serviceDate.amount.grossAmount - serviceDate.amount.netAmount,
            createdAt: convertToUtcDate('UTC', pmsReservation.created),
            updatedAt: new Date(),
            updatedBy: this.currentSystem
          });
        }
      }
    }

    // Create guests
    const booker = pmsReservation.booker;
    const primaryGuest = pmsReservation.primaryGuest;
    const newPrimaryGuest: Partial<Guest> = {
      id: primaryGuestId,
      firstName: primaryGuest?.firstName,
      lastName: primaryGuest?.lastName,
      isBooker: true,
      isMainGuest: true,
      isReturningGuest: false,
      countryId: mapCountries.get(primaryGuest?.address?.countryCode)?.id || null,
      emailAddress: primaryGuest.email,
      phoneNumber: primaryGuest?.phone,
      address: primaryGuest?.address?.addressLine1,
      city: primaryGuest?.address?.city,
      postalCode: primaryGuest?.address?.postalCode,
      createdAt: convertToUtcDate('UTC', pmsReservation.created),
      updatedAt: new Date(),
      updatedBy: this.currentSystem,
      hotelId: hotelId
    };
    if (
      primaryGuest.email === booker?.email &&
      primaryGuest.firstName === booker?.firstName &&
      primaryGuest.lastName === booker?.lastName
    ) {
      updateGuests.push(newPrimaryGuest);
    } else {
      updateGuests.push({ ...newPrimaryGuest, isBooker: false });
      updateGuests.push({
        id: bookerId,
        firstName: booker?.firstName,
        lastName: booker?.lastName,
        isBooker: true,
        isMainGuest: false,
        isReturningGuest: false,
        countryId: mapCountries.get(booker?.address?.countryCode || '')?.id || null,
        emailAddress: booker?.email,
        phoneNumber: booker?.phone,
        address: booker?.address?.addressLine1,
        city: booker?.address?.city,
        postalCode: booker?.address?.postalCode,
        createdAt: convertToUtcDate('UTC', pmsReservation.created),
        updatedAt: new Date(),
        updatedBy: this.currentSystem,
        hotelId: hotelId
      });
    }
  }

  private async mapReservationPricingDetails(data: Reservation[]): Promise<any[]> {
    const roomIds: any[] = [];
    const allReservationAmenityIds: any[] = [];

    for (const reservation of data) {
      for (const reservationTimeSlice of reservation.reservationTimeSlices || []) {
        if (reservationTimeSlice.roomId) {
          roomIds.push(reservationTimeSlice.roomId);
        }
      }
      for (const reservationAmenity of reservation.reservationAmenities) {
        if (reservationAmenity.hotelAmenityId) {
          allReservationAmenityIds.push(reservationAmenity.id);
        }
      }
    }

    const [roomUnits, allReservationAmenities] = await Promise.all([
      this.roomUnitService.getRoomUnits({
        hotelId: data[0].hotelId || '',
        ids: roomIds
      }),
      this.reservationAmenityRepository.getReservationAmenitiesWithRelations({
        ids: allReservationAmenityIds
      })
      // Promise.all(
      //   data.map(async (reservation) => {
      //     return this.roomProductHotelExtraListService.getAvailableAmenity({
      //       hotelId: reservation.hotelId || '',
      //       roomProductCode: reservation.rfc?.code || '',
      //       salesPlanCode: reservation.ratePlan?.code || '',
      //       fromTime: reservation.arrival as any,
      //       toTime: reservation.departure as any
      //     });
      //   })
      // )
    ]);
    const allReservationAmenitiesMap = new Map<string, ReservationAmenity>(
      allReservationAmenities?.map((amenity) => [amenity.id, amenity])
    );

    return data.map((reservation, rIndex) => {
      const taxDetails = reservation.taxDetails || {};
      const accommodationTaxDetails = taxDetails?.current?.accommodationTax || [];
      const serviceTaxDetails = taxDetails?.current?.extraServiceTax || [];

      const cityTaxDetails = reservation.cityTaxDetails || [];

      return {
        reservationNumber: reservation.reservationNumber,
        salesPlan: {
          id: reservation.ratePlan?.id,
          code: reservation.ratePlan?.code,
          name: reservation.ratePlan?.name,
          roundingMode: reservation.ratePlan?.roundingMode
        },
        taxSetting: reservation.hotel?.taxSetting,
        dailyPricingList: reservation.reservationTimeSlices
          ?.map((timeSlice) => {
            const roomUnit = roomUnits.find((roomUnit) => roomUnit.id === timeSlice.roomId);
            const getDate = () => {
              if (!timeSlice.fromTime || !timeSlice.toTime) return '';
              const fromDate = timeSlice.fromTime;
              return fromDate.toISOString().split('T')[0];
            };
            const currentDate = getDate();
            return {
              date: currentDate,
              productPricingDetails: {
                price: timeSlice.totalGrossAmount,
                quantity: 1,
                amount: timeSlice.totalGrossAmount,
                unitAssigned: {
                  roomNumber: roomUnit?.roomNumber
                }
              },
              extrasPricingDetailsList: reservation.reservationAmenities
                ?.map((rAmenity) => {
                  const newReservationAmenity = allReservationAmenitiesMap.get(rAmenity.id);
                  const reservationAmenityDate: ReservationAmenityDate | null =
                    newReservationAmenity?.reservationAmenityDates?.find(
                      (date) => date.date === currentDate
                    ) || null;
                  const isInclude = rAmenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED;
                  return {
                    extras: {
                      name: newReservationAmenity?.hotelAmenity?.name,
                      pricingUnit:
                        newReservationAmenity?.pricingUnit ||
                        newReservationAmenity?.hotelAmenity?.pricingUnit
                    },
                    price:
                      newReservationAmenity?.hotelAmenity?.hotelAmenityPrices?.find(
                        (price) =>
                          price.hotelAgeCategory?.code ===
                          (newReservationAmenity.ageCategoryCode ||
                            HotelAgeCategoryCodeEnum.DEFAULT)
                      )?.price || 0,
                    quantity: reservationAmenityDate?.count || 0,
                    amount: reservationAmenityDate?.totalGrossAmount,
                    isInclude: isInclude
                  };
                })
                ?.filter((extras) => !!extras?.quantity)
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date)),
        taxAmount:
          accommodationTaxDetails?.reduce((acc, tax) => (acc || 0) + (tax.amount || 0), 0) +
          serviceTaxDetails?.reduce((acc, tax) => (acc || 0) + (tax.amount || 0), 0),
        accommodationTaxDetailsList: accommodationTaxDetails
          ?.map((tax) => ({
            name: `${tax?.name} (Accommodation)`,
            amount: tax?.amount
          }))
          ?.filter((tax) => !!tax?.name && !!tax?.amount),
        extrasTaxDetailsList: serviceTaxDetails
          ?.map((tax) => {
            return {
              name: `${tax?.name} (${tax?.hotelAmenityName || ''})`,
              amount: tax?.amount
            };
          })
          ?.filter((tax) => !!tax?.name),
        cityTaxAmount: reservation.cityTaxAmount,
        cityTaxDetailsList: cityTaxDetails
          ?.map((tax) => ({
            name: tax?.name,
            cityTaxAmount: tax?.amount,
            metadata: tax?.metadata
          }))
          ?.filter((tax) => !!tax?.name),
        totalGrossAmount: reservation.totalGrossAmount,
        paidAmount: (reservation.totalGrossAmount || 0) - (reservation.balance || 0),
        balance: reservation.balance
      };
    });
  }

  private async mapReservationDetails(
    data: Reservation[]
  ): Promise<ReservationDetailsResponseDto[]> {
    let allPaymentTermCodes: any[] = [];
    const hotelFeatureCodes: any[] = [];
    for (const reservation of data) {
      if (reservation.paymentTermCode) {
        allPaymentTermCodes.push(reservation.paymentTermCode);
      }
      const matchedFeatureCodes = JSON.parse(reservation.matchedFeature || '[]') as string[];
      if (matchedFeatureCodes?.length) {
        hotelFeatureCodes.push(...matchedFeatureCodes);
      }
      const mismatchedFeatureCodes = JSON.parse(reservation.mismatchedFeature || '[]') as string[];
      if (mismatchedFeatureCodes?.length) {
        hotelFeatureCodes.push(...mismatchedFeatureCodes);
      }
    }
    allPaymentTermCodes = [...new Set(allPaymentTermCodes)];

    const allRoomProductIds: any[] = data
      ?.filter((r) => r.rfc?.type === RoomProductType.RFC)
      ?.map((r) => r.rfc?.id);

    const allReservationAmenityIds: any[] = data
      ?.flatMap((r) => r.reservationAmenities?.map((r) => r.id))
      ?.filter((id) => !!id);

    const roomIds: any[] = data
      .flatMap((reservation) =>
        reservation.reservationTimeSlices?.map(
          (reservationTimeSlice) => reservationTimeSlice.roomId
        )
      )
      ?.filter((roomId) => !!roomId);

    const [
      allPaymentTerms,
      allRoomProducts,
      allReservationAmenities,
      allRoomUnits,
      allHotelRetailFeatures
    ] = await Promise.all([
      this.hotelPaymentTermRepository.getHotelPaymentTermsByCodes({
        codes: allPaymentTermCodes,
        hotelId: data[0].hotelId || ''
      }),
      allRoomProductIds?.length
        ? this.roomProductMappingRepository.getRoomProductMappings({
            roomProductIds: allRoomProductIds,
            hotelId: data[0].hotelId || '',
            relations: ['roomProduct']
          })
        : ([] as RoomProductMapping[]),
      allReservationAmenityIds?.length
        ? this.reservationAmenityRepository.getReservationAmenitiesWithRelations({
            ids: allReservationAmenityIds
          })
        : ([] as ReservationAmenity[]),
      roomIds?.length
        ? this.roomUnitService.getRoomUnits({
            hotelId: data[0].hotelId || '',
            ids: roomIds
          })
        : ([] as RoomUnit[]),
      hotelFeatureCodes?.length
        ? this.hotelRetailFeatureRepository.find({
            where: {
              code: In(hotelFeatureCodes),
              hotelId: data[0].hotelId || ''
            }
          })
        : ([] as HotelRetailFeature[])
    ]);

    const allPaymentTermsMap = new Map<string, HotelPaymentTerm>(
      (allPaymentTerms || []).map((paymentTerm) => [paymentTerm.code, paymentTerm])
    );
    const allHotelRetailFeaturesMap = new Map<string, HotelRetailFeature>(
      allHotelRetailFeatures.map((feature) => [feature.code, feature])
    );

    const mappedData: ReservationDetailsResponseDto[] = data.map((reservation) => {
      const paymentTerm = allPaymentTermsMap.get(reservation.paymentTermCode || '');
      const linkedRoomProduct = allRoomProducts
        ?.filter((r) => r.relatedRoomProductId === reservation.rfc?.id)
        ?.map((r) => r.roomProduct);

      const extrasList = reservation.reservationAmenities?.map((amenity) => {
        const newAmenity = allReservationAmenities?.find((a) => a?.id === amenity.id);
        const acc = newAmenity?.reservationAmenityDates?.reduce(
          (acc, date) => {
            acc.count += date.count || 0;
            return acc;
          },
          { count: 0 }
        );

        return {
          name: newAmenity?.hotelAmenity?.name || '',
          count: acc?.count || 0,
          amenityType: newAmenity?.hotelAmenity?.amenityType || ''
        };
      });

      const matchedFeatureList = JSON.parse(reservation.matchedFeature || '[]') as string[];
      const mismatchedFeatureList = JSON.parse(reservation.mismatchedFeature || '[]') as string[];
      const matchedFeatures: HotelRetailFeature[] = [];
      const mismatchedFeatures: HotelRetailFeature[] = [];
      for (const code of matchedFeatureList) {
        const feature = allHotelRetailFeaturesMap.get(code);
        if (!feature) {
          continue;
        }
        matchedFeatures.push(feature);
      }
      for (const code of mismatchedFeatureList) {
        const feature = allHotelRetailFeaturesMap.get(code);
        if (!feature) {
          continue;
        }
        mismatchedFeatures.push(feature);
      }

      const newReservation: ReservationDetailsResponseDto = {
        salesPlan: {
          id: reservation.ratePlan?.id,
          code: reservation.ratePlan?.code,
          name: reservation.ratePlan?.name
        },
        paymentTerm: {
          name: paymentTerm?.name || null,
          description: paymentTerm?.description || null
        },
        cancellationPolicy: {
          code: reservation.cancellationPolicy?.code,
          name: reservation.cancellationPolicy?.name,
          description: reservation.cancellationPolicy?.description
        },
        product: {
          id: reservation.rfc?.id,
          type: reservation.rfc?.type,
          name: reservation.rfc?.name,
          code: reservation.rfc?.code,
          space: reservation.rfc?.space,
          numberOfBedrooms: reservation.rfc?.numberOfBedrooms,
          capacityAdult: reservation.rfc?.allocatedAdultCount,
          capacityChildren: reservation.rfc?.allocatedChildCount,
          capacityDefault: reservation.rfc?.capacityDefault,
          capacityExtra: reservation.rfc?.capacityExtra,
          extraBedKid: reservation.rfc?.extraBedKid,
          extraBedAdult: reservation.rfc?.extraBedAdult,
          maximumKid: reservation.rfc?.maximumKid,
          maximumAdult: reservation.rfc?.maximumAdult,
          maximumPet: reservation.rfc?.maximumPet
        },
        linkedProductList: linkedRoomProduct
          ?.map((linkedMrfc) => ({
            name: linkedMrfc?.name,
            code: linkedMrfc?.code
          }))
          .filter((i) => !!i?.name && !!i?.code),
        matchedFeatureList: matchedFeatures,
        mismatchedFeatureList: mismatchedFeatures,
        productFeatureList: reservation.rfc?.roomProductRetailFeatures?.map((feature) => {
          const retailFeature = feature.retailFeature;
          const hotelRetailCategory = retailFeature?.hotelRetailCategory;
          return {
            name: retailFeature?.name,
            displaySequence: retailFeature?.displaySequence,
            hotelRetailCategory: {
              name: hotelRetailCategory?.name,
              displaySequence: hotelRetailCategory?.displaySequence
            }
          };
        }),
        bookingFlow: reservation.bookingFlow,
        extrasList: extrasList,
        assignedUnitList: allRoomUnits?.map((roomUnit) => ({
          roomNumber: roomUnit.roomNumber,
          roomAvailabilityList: reservation.reservationTimeSlices?.map((timeSlice) => ({
            date: timeSlice.fromTime?.toISOString()?.split('T')[0] || '',
            status: 'ASSIGNED',
            isLocked: reservation.isLocked
          }))
        })),
        isLocked: reservation.isLocked,
        guestNote: reservation.guestNote
      };
      return newReservation;
    });
    return mappedData;
  }

  private async mapReservations(
    data: Reservation[],
    hotel?: Hotel | null
  ): Promise<ReservationManagementResponseDto[]> {
    let bookingIds: any[] = data.map((reservation) => reservation.bookingId);
    bookingIds = [...new Set(bookingIds)].filter((id) => !!id);
    const timeZone = hotel?.timeZone || '';

    const bookingTransactions = await this.bookingTransactionRepository.getBookingTransactions({
      bookingIds: bookingIds
    });
    const allPaymentMethodCodes: any[] = bookingTransactions
      .flatMap((bookingTransaction) => bookingTransaction.paymentMode)
      ?.filter((code) => !!code);
    const roomIds: any[] = data
      .flatMap((reservation) =>
        reservation.reservationTimeSlices?.map(
          (reservationTimeSlice) => reservationTimeSlice.roomId
        )
      )
      ?.filter((roomId) => !!roomId);
    const [allPaymentMethods, roomUnits] = await Promise.all([
      this.globalPaymentMethodRepository.getGlobalPaymentMethodList({
        codes: allPaymentMethodCodes
      }),
      this.roomUnitService.getRoomUnits({
        hotelId: data[0].hotelId || '',
        ids: roomIds
      })
    ]);
    const allPaymentMethodsMap = new Map<string, GlobalPaymentMethod>(
      allPaymentMethods.map((paymentMethod) => [paymentMethod.code, paymentMethod])
    );

    const roomUnitsMap = new Map<string, RoomUnit>(
      roomUnits.map((roomUnit) => [roomUnit.id, roomUnit])
    );

    const groupByRoomId = (items: ReservationTimeSlice[]) => {
      const result = items.reduce<Record<string, ReservationTimeSlice[]>>((acc, item) => {
        if (!acc[item.roomId || 'unknown']) {
          acc[item.roomId || 'unknown'] = [];
        }
        acc[item.roomId || 'unknown'].push(item);
        return acc;
      }, {});
      delete result['unknown'];
      return result;
    };

    const mappedData: ReservationManagementResponseDto[] = data.map((reservation) => {
      const bookingTransaction = bookingTransactions?.find(
        (bookingTransaction) => bookingTransaction.bookingId === reservation.bookingId
      );
      // const paymentMethod = allPaymentMethods.find(
      //   (paymentMethod) => paymentMethod.code === bookingTransaction?.paymentMode
      // );
      const paymentMethod = allPaymentMethodsMap.get(reservation?.hotelPaymentModeCode || '');

      let roomList = groupByRoomId(reservation.reservationTimeSlices || []);
      const mappedRoomList = Object.values(roomList).map((item) => {
        const roomUnit = roomUnits.find((roomUnit) => roomUnit.id === item[0].roomId);
        return {
          room: {
            id: item[0].roomId || '',
            roomNumber: roomUnit?.roomNumber || '',
            roomAvailabilityList: item.map((item) => ({
              date: item.fromTime?.toISOString()?.split('T')[0] || '',
              status: 'ASSIGNED'
            }))
          }
        };
      });

      // group room time slices by room id
      let roomTimeSlices: any[] = [];
      for (const item of reservation.reservationTimeSlices || []) {
        if (!item.fromTime) continue;

        const roomUnit = roomUnitsMap.get(item.roomId || '');
        if (!item.roomId || !roomUnit) {
          roomTimeSlices.push({
            roomId: null,
            roomNumber: null,
            date: item.fromTime.toISOString()?.split('T')[0] || ''
          });
          continue;
        }

        roomTimeSlices.push({
          roomId: item.roomId,
          roomNumber: roomUnit.roomNumber,
          date: item.fromTime.toISOString()?.split('T')[0] || ''
        });
      }
      roomTimeSlices = roomTimeSlices.sort((a, b) => a.date.localeCompare(b.date));

      let promoCodeList = [];
      try {
        promoCodeList = JSON.parse(reservation.promoCode || '[]');
      } catch (error) {
        promoCodeList = [];
      }
      let additionalGuestList = [];
      try {
        additionalGuestList = JSON.parse(reservation.additionalGuests || '[]');
      } catch (error) {
        additionalGuestList = [];
      }
      let childrenAges: number[] = [];
      try {
        childrenAges = reservation.childrenAges || [];
      } catch (error) {
        childrenAges = [];
      }
      const proposalSetting = reservation.booking?.bookingProposalSetting || null;
      return {
        paymentFailed: bookingTransaction?.status === BookingTransactionStatusEnum.PAYMENT_FAILED,
        paymentStatus: bookingTransaction?.status,
        id: reservation.id,
        reservationNumber: reservation.reservationNumber,
        mappingReservationCode: reservation.mappingReservationCode,
        status: reservation.status,
        arrival: reservation.arrival?.toISOString(),
        departure: reservation.departure?.toISOString(),
        bookingFlow: reservation.bookingFlow,
        source: reservation.source,
        bookingLanguage: reservation.bookingLanguage,
        payOnConfirmationAmount: reservation.payOnConfirmationAmount,
        promoCodeList: promoCodeList,
        booking: {
          bookingNumber: reservation.booking.bookingNumber,
          id: reservation.booking.id,
          createdAt: reservation.booking.createdAt?.toISOString()
        },
        primaryGuest: {
          firstName: reservation.primaryGuest?.firstName,
          lastName: reservation.primaryGuest?.lastName,
          emailAddress: reservation.primaryGuest?.emailAddress,
          phoneNumber: reservation.primaryGuest?.phoneNumber
        },
        additionalGuest: additionalGuestList,
        proposalSetting: proposalSetting
          ? {
              validBefore: proposalSetting.validBefore
                ? proposalSetting.validBefore.toISOString()
                : null
            }
          : null,
        adult: reservation.adults,
        children: childrenAges?.length,
        childrenAges: childrenAges,
        pets: reservation.pets,
        unitAssigned: mappedRoomList?.find((item) => !!item.room.id)?.room?.roomNumber || null,
        reservationRoomList: mappedRoomList,
        roomTimeSlices: roomTimeSlices,
        isLocked: reservation.isLocked,
        totalGrossAmount: reservation.totalGrossAmount,
        totalBaseAmount: reservation.totalBaseAmount,
        balance: reservation.balance,
        paymentMethod: {
          code: paymentMethod?.code,
          name: paymentMethod?.name
        },
        channel: reservation.channel,
        createdDate: reservation.createdAt?.toISOString(),
        updatedDate: reservation.updatedAt?.toISOString(),
        isPmsPush: !!reservation.mappingReservationCode,
        isBusiness: !!reservation.companyId,
        company: {
          name: reservation.company?.name,
          id: reservation.company?.id
        },
        roomProductId: reservation.roomProductId,
        createdAt: reservation.createdAt?.toISOString(),
        roomProduct: reservation.rfc
          ? {
              id: reservation.rfc?.id,
              name: reservation.rfc?.name,
              code: reservation.rfc?.code
            }
          : null,
        ratePlan: reservation.ratePlan
          ? {
              id: reservation.ratePlan?.id,
              code: reservation.ratePlan?.code,
              name: reservation.ratePlan?.name
            }
          : null,
        note: reservation.note,
        cityTaxAmount: reservation.cityTaxAmount,
        cancellationPolicy: reservation.cxlPolicyCode
          ? {
              name: reservation.cancellationPolicy?.name,
              code: reservation.cxlPolicyCode,
              description: reservation.cancellationPolicy?.description
            }
          : null
      } as ReservationManagementResponseDto;
    });
    // .filter((item) => !item.paymentFailed);

    return mappedData;
  }

  async getRatePlanDetails(filter: RatePlanDetailsFilterDto) {
    const { idList, hotelId } = filter;
    try {
      const qb = this.ratePlanRepository.createQueryBuilder('ratePlan');
      qb.andWhere('ratePlan.hotelId = :hotelId', { hotelId });
      if (idList?.length) {
        qb.andWhere('ratePlan.id IN (:...idList)', { idList });
      }

      // Join related entities
      qb.leftJoinAndSelect('ratePlan.ratePlanExtraServices', 'ratePlanExtraService');
      qb.leftJoinAndSelect('ratePlanExtraService.extra', 'extra');
      qb.leftJoinAndSelect('ratePlan.hotelCancellationPolicy', 'hotelCancellationPolicy');
      qb.leftJoinAndSelect('ratePlan.ratePlanPaymentTermSettings', 'ratePlanPaymentTermSetting');

      const ratePlans = await qb.getMany();

      // Fetch property payment terms separately to properly map them
      const paymentTermIds = ratePlans
        .flatMap((rp) => rp.ratePlanPaymentTermSettings || [])
        .map((s) => s.hotelPaymentTermId)
        .filter((id) => id);

      let propertyPaymentTerms: Array<{ id: string; name: string; description: string }> = [];
      if (paymentTermIds.length > 0) {
        const hotelPaymentTermRepo = this.dataSource.getRepository('hotel_payment_term');
        const rawTerms = await hotelPaymentTermRepo
          .createQueryBuilder('pt')
          .where('pt.id IN (:...ids)', { ids: paymentTermIds })
          .select(['pt.id as id', 'pt.name as name', 'pt.description as description'])
          .getRawMany();

        propertyPaymentTerms = rawTerms.map((term: any) => ({
          id: term.id,
          name: term.name,
          description: term.description
        }));
      }

      // Create a map for quick lookup
      const paymentTermMap = new Map(
        propertyPaymentTerms.map((pt) => [pt.id, { name: pt.name, description: pt.description }])
      );

      // Map to the desired format
      const mappedRatePlans = ratePlans.map((ratePlan) => {
        return {
          salesPlan: {
            name: ratePlan.name,
            description: ratePlan.description
          },
          salesPlanServiceList:
            ratePlan.ratePlanExtraServices?.map((service) => ({
              service: {
                name: service.extra?.name,
                pricingUnit: service.extra?.pricingUnit
              }
            })) || [],
          salesPlanCancellationPolicy: ratePlan.hotelCancellationPolicy
            ? {
                name: ratePlan.hotelCancellationPolicy.name,
                description: ratePlan.hotelCancellationPolicy.description
              }
            : null,
          salesPlanPaymentTermSettingList:
            ratePlan.ratePlanPaymentTermSettings?.map((setting) => {
              const paymentTerm = paymentTermMap.get(setting.hotelPaymentTermId);
              return {
                isDefault: setting.isDefault,
                propertyPaymentTerm: {
                  name: paymentTerm?.name || null,
                  description: paymentTerm?.description || null
                }
              };
            }) || []
        };
      });

      return mappedRatePlans;
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to get rate plan details');
    }
  }

  async updateReservationLockUnit(input: UpdateReservationLockUnitInput) {
    const { reservationNumber, hotelId, isLocked } = input;
    try {
      const reservation = await this.reservationRepository.getReservationWithRelations({
        reservationNumber: reservationNumber,
        hotelId: hotelId,
        relations: ['reservationTimeSlices']
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      const updateReservation: Partial<Reservation> & Pick<Reservation, 'id'> = {
        id: reservation.id,
        isLocked: isLocked
      };
      const updatedReservationTimeSlices: Partial<ReservationTimeSlice>[] =
        reservation.reservationTimeSlices?.map((timeSlice) => {
          return {
            id: timeSlice.id,
            isLocked: isLocked
          };
        });
      if (!reservation.mappingReservationCode) {
        this.logger.warn(
          `Reservation mapping reservation code not found for reservation ${reservation.id} for lock/unlock unit on pms`
        );
      }
      Promise.all([
        this.reservationRepository.updateReservationList([updateReservation]),
        this.reservationTimeSliceRepository.updateReservationTimeSlices(
          updatedReservationTimeSlices
        ),
        reservation.mappingReservationCode
          ? this.pmsService.updateLockPmsUnits(hotelId, {
              lockReservations: isLocked ? [reservation.mappingReservationCode ?? ''] : [],
              unlockReservations: !isLocked ? [reservation.mappingReservationCode ?? ''] : []
            })
          : Promise.resolve([])
      ]);

      return {
        status: ResponseStatusEnum.SUCCESS,
        message: `Reservation ${isLocked ? 'locked' : 'unlocked'} successfully`,
        data: reservation
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to update reservation lock/unlock unit'
      );
    }
  }

  async releaseProposedReservation() {
    try {
      const bookingProposalSettings = await this.bookingProposalSettingRepository
        .createQueryBuilder('bps')
        .where('bps.validBefore < NOW()')
        .andWhere('bps.deletedAt IS NULL')
        .getMany();

      if (!bookingProposalSettings?.length) {
        this.logger.debug(`No proposed booking settings to release`);
        return true;
      }
      const bookingProposalSettingsMap = new Map();
      const bookingIds: string[] = [];
      const updatedBookingProposalSettings: Partial<BookingProposalSetting>[] = [];
      const proposedBookings: Booking[] = [];
      for (const setting of bookingProposalSettings || []) {
        if (!setting.bookingId) {
          continue;
        }
        bookingProposalSettingsMap.set(setting.bookingId, setting);
        bookingIds.push(setting.bookingId);
      }
      const bookings = await this.bookingRepository.getBookings({
        ids: bookingIds,
        relations: ['reservations']
      });
      for (const booking of bookings || []) {
        if (!booking.id) {
          continue;
        }

        if (booking.reservations?.[0]?.status === ReservationStatusEnum.PROPOSED) {
          proposedBookings.push(booking);
          continue;
        }

        const bookingProposalSetting = bookingProposalSettingsMap.get(booking.id);
        if (!bookingProposalSetting) {
          continue;
        }
        updatedBookingProposalSettings.push({
          id: bookingProposalSetting.id,
          deletedAt: new Date()
        });
      }
      this.logger.debug(
        `Found proposed bookings to release: ${JSON.stringify(proposedBookings?.map((booking) => booking.id))}`
      );

      if (updatedBookingProposalSettings?.length) {
        await this.bookingProposalSettingRepository.save(updatedBookingProposalSettings);
      }

      await processInBatches(
        proposedBookings,
        10, // batch size
        50, // delay in ms
        async (booking) => {
          try {
            await this.releaseBooking({
              bookingId: booking.id
            });
            const bookingProposalSetting = bookingProposalSettingsMap.get(booking.id);
            await this.bookingProposalSettingRepository.update(bookingProposalSetting.id, {
              deletedAt: new Date()
            });
          } catch (error) {
            this.logger.error(`Failed to release booking ${booking.id}: ${error?.message}`);
            return false;
          }

          return true;
        }
      );

      return true;
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to release proposed reservation');
    }
  }

  async releasePendingPayment() {
    try {
      this.logger.debug(`Start release pending payment`);
      // get 100 pending payments with created at more than or equal to 10 minutes ago
      const releasePendingPaymentTime =
        Number(this.configService.get<number>(ENVIRONMENT.RELEASE_PENDING_PAYMENT_TIME)) || 10;

      const thresholdTime = new Date(Date.now() - releasePendingPaymentTime * 60 * 1000);

      const pendingPayments = await this.bookingTransactionCustomRepository
        .createQueryBuilder('bt')
        .where('bt.status = :status', {
          status: BookingTransactionStatusEnum.PAYMENT_PENDING
        })
        .andWhere('bt.createdAt < :thresholdTime', {
          thresholdTime
        })
        .limit(100)
        .getMany();

      if (!pendingPayments?.length) {
        this.logger.debug(`No pending payments found`);
        return true;
      }
      this.logger.debug(`Found pending payments: ${pendingPayments.length}`);
      const pendingPaymentsMap = new Map<string, BookingTransaction>();
      let updateTransNow: Partial<BookingTransaction>[] = [];
      for (const payment of pendingPayments) {
        if (!payment.bookingId) {
          updateTransNow.push({
            id: payment.id,
            status: BookingTransactionStatusEnum.PAYMENT_FAILED,
            updatedAt: new Date()
          });
          continue;
        }

        pendingPaymentsMap.set(payment.bookingId, payment);
      }

      // update pending payments now
      if (updateTransNow.length) {
        await this.bookingTransactionCustomRepository.save(updateTransNow);
      }

      const bookingIds = Array.from(pendingPaymentsMap.keys());
      if (!bookingIds.length) {
        this.logger.debug(`No bookings found`);
        return true;
      }

      const reservations = await this.reservationCustomRepository.find({
        where: {
          bookingId: In(bookingIds),
          status: Not(ReservationStatusEnum.CONFIRMED),
          deletedAt: IsNull()
        },
        relations: {
          reservationTimeSlices: true
        }
      });
      if (!reservations?.length) {
        this.logger.debug(`No reservations found`);
        updateTransNow = [];
        for (const bookingId of bookingIds) {
          const payment = pendingPaymentsMap.get(bookingId);
          if (!payment) {
            continue;
          }
          updateTransNow.push({
            id: payment.id,
            status: BookingTransactionStatusEnum.PAYMENT_FAILED,
            updatedAt: new Date()
          });
        }
        await this.bookingTransactionCustomRepository.save(updateTransNow);
        return true;
      }

      // filter booking id
      let filteredBookingIds: string[] = [];
      updateTransNow = [];
      for (const reservation of reservations) {
        if (!reservation.bookingId || filteredBookingIds.includes(reservation.bookingId)) {
          continue;
        }
        filteredBookingIds.push(reservation.bookingId);
      }
      for (const bookingId of bookingIds) {
        if (filteredBookingIds.includes(bookingId)) {
          continue;
        }
        updateTransNow.push({
          id: pendingPaymentsMap.get(bookingId)?.id,
          status: BookingTransactionStatusEnum.PAYMENT_FAILED,
          updatedAt: new Date()
        });
      }

      if (updateTransNow.length) {
        await this.bookingTransactionCustomRepository.save(updateTransNow);
      }

      const requestRoomsMap: Map<
        string,
        {
          requestRooms: {
            roomProductId: any;
            arrival: any;
            departure: any;
            roomUnitIds: any[];
          }[];
          reservations: Reservation[];
        }
      > = new Map();

      for (const reservation of reservations) {
        const key = reservation.hotelId;
        if (!key) {
          continue;
        }

        if (!(reservation.arrival && reservation.departure)) {
          continue;
        }

        const currentData = requestRoomsMap.get(key) || {
          requestRooms: [],
          reservations: []
        };
        let roomIds = reservation.reservationTimeSlices.map((slice) => slice.roomId);
        roomIds = [...new Set(roomIds)];
        currentData.requestRooms.push({
          roomProductId: reservation.roomProductId,
          arrival: format(reservation.arrival, DATE_FORMAT),
          departure: format(reservation.departure, DATE_FORMAT),
          roomUnitIds: roomIds
        });
        currentData.reservations.push(reservation);
        requestRoomsMap.set(key, currentData);
      }

      for (const [hotelId, data] of requestRoomsMap.entries()) {
        try {
          const { requestRooms, reservations } = data;
          let updateBookingIds: string[] = [];
          // release availability
          for (const [index, requestRoom] of requestRooms.entries()) {
            try {
              await this.roomProductAvailabilityService.roomProductReleaseAvailability({
                hotelId,
                requestRooms: [requestRoom]
              });

              // update reservation status
              const reservation = reservations[index];
              await this.reservationCustomRepository.save({
                id: reservation.id,
                balance: 0,
                status:
                  reservation.status === ReservationStatusEnum.PROPOSED
                    ? ReservationStatusEnum.RELEASED
                    : ReservationStatusEnum.PAYMENT_FAILED,
                updatedAt: new Date()
              });
              if (reservation.bookingId) {
                updateBookingIds.push(reservation.bookingId);
              }
              this.logger.log(`Updated reservation ${reservation.id} for hotel ${hotelId}`);
            } catch (error) {
              this.logger.error(`Failed to update reservation ${reservations[index].id}`);
            }
          }

          // update booking transaction status
          updateBookingIds = Array.from(new Set(updateBookingIds));
          const updateTransactions: Partial<BookingTransaction>[] = [];
          for (const bookingId of updateBookingIds) {
            const pending = pendingPaymentsMap.get(bookingId || '');
            if (!pending) {
              continue;
            }

            updateTransactions.push({
              id: pending.id,
              status: BookingTransactionStatusEnum.PAYMENT_FAILED,
              updatedAt: new Date()
            });
          }
          const chunkTransactionSize = 50;
          const chunksTransaction = chunk(updateTransactions, chunkTransactionSize);
          for (const chunk of chunksTransaction) {
            await this.bookingTransactionCustomRepository.save(chunk);
          }
          this.logger.log(
            `Updated ${updateTransactions.length} booking transactions for hotel ${hotelId}`
          );
        } catch (error) {
          this.logger.error(
            `Failed to release pending payment for hotel ${hotelId}: ${error?.message}`
          );
        }
      }

      return true;
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to release pending payment');
    }
  }

  async generateReservationNotes(input: {
    booking: Booking;
    reservation: Reservation;
    hotel: Hotel;
    alternativeUnitIds?: string[];
  }) {
    const { booking, reservation, hotel, alternativeUnitIds } = input;
    return await this.reservationNotesService.generateNotes(
      booking,
      reservation,
      hotel,
      alternativeUnitIds
    );
  }

  async jobPullPmsReservations() {
    const hotels = await this.hotelRepository.find({
      where: {
        deletedAt: IsNull()
      },
      select: ['id', 'code', 'timeZone']
    });

    for (const hotel of hotels) {
      try {
        const now = new Date();
        const today = formatInTimeZone(now, hotel.timeZone ?? 'UTC', DATE_FORMAT);
        const tomorrow = formatInTimeZone(addDays(now, 1), hotel.timeZone ?? 'UTC', DATE_FORMAT);
        this.logger.log(`Pulling PMS reservations for hotel ${hotel.id} on ${today}`);
        await this.syncPmsReservations({
          hotelId: hotel.id,
          dateFilter: DateFilterEnum.BOOKING_DATE,
          fromDate: today,
          toDate: tomorrow
        });
      } catch (error) {
        this.logger.error(
          `Failed to pull PMS reservations for hotel ${hotel.id}: ${error?.message}`
        );
        continue;
      }
    }

    return true;
  }

  async pushPmsReservation(input: PushPmsReservationInput) {
    const { hotelId, reservationId } = input;
    const [reservation] = await Promise.all([
      this.reservationRepository.getReservationWithRelations({
        id: reservationId,
        hotelId: hotelId,
        relations: []
      })
    ]);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const createReservationInput: ReservationsCreatePmsDto = {
      bookingId: reservation.bookingId || '',
      hotelId: hotelId
    };
    const data = await this.pmsService.pushReservationToPms(createReservationInput);
    if (data?.status === ResponseStatusEnum.ERROR) {
      return {
        status: ResponseStatusEnum.ERROR,
        message: data?.message ?? 'Failed to push reservation to PMS',
        data: null
      };
    }
    return {
      status: ResponseStatusEnum.SUCCESS,
      message: `Push reservation to PMS successfully`,
      data: input
    };
  }

  async migrateReservationAmenityExtraType() {
    try {
      const reservationAmentites = await this.reservationAmenityRepository.findAll({
        relations: {
          reservation: true,
          hotelAmenity: true
        }
      });
      let extrasIds = reservationAmentites
        .map((reservation) => reservation.hotelAmenityId ?? '')
        .filter((id) => id !== null);
      extrasIds = [...new Set(extrasIds)];
      const roomProductExtras = await this.roomProductExtraRepository.find({
        where: {
          extrasId: In(extrasIds)
        },
        relations: {
          roomProduct: true
        }
      });
      const roomProductExtrasMap = new Map(
        roomProductExtras.map((roomProductExtra) => [
          `${roomProductExtra.roomProductId}-${roomProductExtra.extrasId}`,
          roomProductExtra
        ])
      );
      const ratePlanExtraServices = await this.ratePlanExtraServiceRepository.find({
        where: {
          extrasId: In(extrasIds)
        }
      });
      const ratePlanExtraServicesMap = new Map(
        ratePlanExtraServices.map((ratePlanExtraService) => [
          `${ratePlanExtraService.ratePlanId}-${ratePlanExtraService.extrasId}`,
          ratePlanExtraService
        ])
      );
      const updatedReservationAmenities: Partial<ReservationAmenity>[] = [];
      for (const reservationAmenity of reservationAmentites) {
        const hotelAmenityId = reservationAmenity.hotelAmenityId;
        const reservation = reservationAmenity.reservation;
        const roomProductId = reservation?.roomProductId;
        const ratePlanId = reservation?.ratePlanId;
        const roomProductExtra = roomProductExtrasMap.get(`${roomProductId}-${hotelAmenityId}`);
        const ratePlanExtraService = ratePlanExtraServicesMap.get(
          `${ratePlanId}-${hotelAmenityId}`
        );

        // Determine the extra service type based on priority rules
        let extraServiceType: ExtraServiceTypeEnum | null = null;

        const roomProductType = roomProductExtra?.type;
        const ratePlanType = ratePlanExtraService?.type;

        // Priority logic:
        // 1. Included and Mandatory have priority over Extra
        // 2. Included has priority over Mandatory
        // 3. Room Product has priority over Rate Plan

        // Both Room Product and Rate Plan have the extra service
        // Create composite key for switch case
        const compositeKey = `${roomProductType || 'unknown'}-${ratePlanType || 'unknown'}`;

        switch (compositeKey) {
          // Room Product INCLUDED cases
          case `${RoomProductExtraType.INCLUDED}-${RatePlanExtraServiceType.INCLUDED}`:
            // Both INCLUDED => Room Product wins (Rule 3)
            extraServiceType = ExtraServiceTypeEnum.INCLUDED;
            break;

          case `${RoomProductExtraType.INCLUDED}-${RatePlanExtraServiceType.MANDATORY}`:
            // Room Product INCLUDED, Rate Plan MANDATORY => INCLUDED wins (Rule 2)
            extraServiceType = ExtraServiceTypeEnum.INCLUDED;
            break;

          case `${RoomProductExtraType.INCLUDED}-${RatePlanExtraServiceType.EXTRA}`:
            // Room Product INCLUDED, Rate Plan EXTRA => INCLUDED wins (Rule 1 & 3)
            extraServiceType = ExtraServiceTypeEnum.INCLUDED;
            break;

          // Room Product MANDATORY cases
          case `${RoomProductExtraType.MANDATORY}-${RatePlanExtraServiceType.INCLUDED}`:
            // Room Product MANDATORY, Rate Plan INCLUDED => MANDATORY wins (Rule 3: Room Product priority)
            extraServiceType = ExtraServiceTypeEnum.MANDATORY;
            break;

          case `${RoomProductExtraType.MANDATORY}-${RatePlanExtraServiceType.MANDATORY}`:
            // Both MANDATORY => Room Product wins (Rule 3)
            extraServiceType = ExtraServiceTypeEnum.MANDATORY;
            break;

          case `${RoomProductExtraType.MANDATORY}-${RatePlanExtraServiceType.EXTRA}`:
            // Room Product MANDATORY, Rate Plan EXTRA => MANDATORY wins (Rule 1 & 3)
            extraServiceType = ExtraServiceTypeEnum.MANDATORY;
            break;

          // Room Product EXTRA cases
          case `${RoomProductExtraType.EXTRA}-${RatePlanExtraServiceType.INCLUDED}`:
            // Room Product EXTRA, Rate Plan INCLUDED => INCLUDED wins (Rule 1)
            extraServiceType = ExtraServiceTypeEnum.INCLUDED;
            break;

          case `${RoomProductExtraType.EXTRA}-${RatePlanExtraServiceType.MANDATORY}`:
            // Room Product EXTRA, Rate Plan MANDATORY => MANDATORY wins (Rule 1)
            extraServiceType = ExtraServiceTypeEnum.MANDATORY;
            break;

          case `${RoomProductExtraType.EXTRA}-${RatePlanExtraServiceType.EXTRA}`:
            // Both EXTRA => Room Product wins (Rule 3)
            extraServiceType = ExtraServiceTypeEnum.EXTRA;
            break;

          // Default: Use EXTRA as fallback
          default:
            extraServiceType =
              (roomProductType as any) || (ratePlanType as any) || ExtraServiceTypeEnum.EXTRA;
            break;
        }

        // Update the reservation amenity if type is determined
        if (extraServiceType && reservationAmenity.extraServiceType !== extraServiceType) {
          updatedReservationAmenities.push({
            id: reservationAmenity.id,
            extraServiceType,
            pricingUnit:
              reservationAmenity.pricingUnit || reservationAmenity.hotelAmenity?.pricingUnit
          });
        }
      }

      // Batch update all reservation amenities
      if (!updatedReservationAmenities.length) {
        return {
          status: ResponseStatusEnum.SUCCESS,
          message: `No reservation amenities to migrate`,
          data: null
        };
      }

      await this.reservationAmenityRepository.upsertReservationAmenities(
        updatedReservationAmenities
      );

      return {
        status: ResponseStatusEnum.SUCCESS,
        message: `Successfully migrated ${updatedReservationAmenities.length} reservation amenities`,
        data: { count: updatedReservationAmenities.length }
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to migrate reservation amenity extra type'
      );
    }
  }

  async migrateReservationStatus() {
    try {
      const bookingTransactions = await this.bookingTransactionCustomRepository.find({
        where: { status: BookingTransactionStatusEnum.PAYMENT_FAILED },
        select: {
          bookingId: true
        }
      });
      let bookingIds: string[] = bookingTransactions
        .map((bt) => bt.bookingId)
        .filter((id) => id !== null);
      bookingIds = [...new Set(bookingIds)];
      if (!bookingIds?.length) {
        return {
          status: ResponseStatusEnum.SUCCESS,
          message: `No booking transactions to migrate`,
          data: null
        };
      }
      const filter = {
        bookingIds
      };
      const reservations = await this.reservationRepository.findAll(filter);
      const updatedReservations: Partial<Reservation>[] = [];
      const byPassStatus = [ReservationStatusEnum.RELEASED, ReservationStatusEnum.PROPOSED];
      for (const reservation of reservations) {
        if (byPassStatus.includes(reservation.status)) continue;

        updatedReservations.push({
          id: reservation.id,
          status: ReservationStatusEnum.PAYMENT_FAILED
        });
      }
      await this.reservationRepository.upsertReservations(updatedReservations);
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: `Successfully migrated ${updatedReservations.length} reservations`,
        data: { count: updatedReservations.length }
      };
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to migrate reservation status');
    }
  }
  private getDeletedDates(
    existingArrival: string | Date,
    existingDeparture: string | Date,
    newArrival: string | Date,
    newDeparture: string | Date
  ): string[] {
    const existingDates = this.getDatesBetween(existingArrival, existingDeparture);
    const newDates = this.getDatesBetween(newArrival, newDeparture);

    return existingDates.filter((date) => !newDates.includes(date));
  }

  private getDatesBetween(startDate: string | Date, endDate: string | Date): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start);

    while (current < end) {
      dates.push(format(current, DATE_FORMAT));
      current = addDays(current, 1);
    }
    return dates;
  }
}
