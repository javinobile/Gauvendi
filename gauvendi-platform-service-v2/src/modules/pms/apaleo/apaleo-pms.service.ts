import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { Company } from '@src/core/entities/booking-entities/company.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import {
  ExtraServiceTypeEnum,
  HotelPaymentModeCodeEnum,
  ResponseStatusEnum
} from '@src/core/enums/common';
import { RedisService } from '@src/core/redis/redis.service';
import { formatDateTimeWithTimeZone, parseDate } from '@src/core/utils/datetime.util';
import { groupByToMapSingle } from '@src/core/utils/group-by.util';
import { CountryRepository } from '@src/modules/country/country.repository';
import { addDays, format, subDays } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DB_NAME } from 'src/core/constants/db.const';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { ApaleoRatePlanPmsMapping } from 'src/core/entities/apaleo-entities/apaleo-rate-plan-pms-mapping.entity';
import { BookingTransaction } from 'src/core/entities/booking-entities/booking-transaction.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { ReservationAmenityDate } from 'src/core/entities/booking-entities/reservation-amenity-date.entity';
import { ReservationTimeSlice } from 'src/core/entities/booking-entities/reservation-time-slice.entity';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import { HotelAmenity } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { RoomUnit } from 'src/core/entities/room-unit.entity';
import { processInBatches } from 'src/core/utils/batch-processor.util';
import { getCurlCommand } from 'src/core/utils/curl.util';
import { BookingTransactionRepository } from 'src/modules/booking-transaction/repositories/booking-transaction.repository';
import { BookingRepository } from 'src/modules/booking/repositories/booking.repository';
import { HotelAmenityRepository } from 'src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { ReservationAmenityDateRepository } from 'src/modules/reservation-amenity-date/repositories/reservation-amenity-date.repository';
import { ReservationAmenityRepository } from 'src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { ReservationRepository } from 'src/modules/reservation/repositories/reservation.repository';
import { In, Repository } from 'typeorm';
import {
  ApaleoBookReservationServiceDto,
  ApaleoCreateBookingDto,
  ApaleoCreateBookingResponseDto,
  ApaleoCreatePaymentAccountDto,
  ApaleoCreateReservationDto,
  ApaleoCreditCardDto,
  ApaleoPaymentMethod,
  ApaleoPaymentMethodMapping,
  ChannelCode,
  ReservationPricingType
} from '../dtos/apaleo-pms.dto';
import { ReservationsCreatePmsInput } from '../dtos/pms.dto';
import { AbstractPmsService } from '../mews/abstract-pms.sercive';
import {
  IDENTITY_APALEO_API_URI,
  PMS_APALEO_API_URI,
  PMS_APALEO_DISTRIBUTION_API_URI
} from './apaleo-api.contant';
import { ApaleoCompanyDto, ApaleoServiceDto } from './apaleo.dto';
import { ApaleoService } from './apaleo.service';

@Injectable()
export class ApaleoPmsService extends AbstractPmsService {
  protected readonly logger = new Logger(ApaleoPmsService.name);

  identityUrl: string;
  private cacheTokenKey = 'apaleo_access_token_{propertyId}';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => HotelAmenityRepository))
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly reservationAmenityRepository: ReservationAmenityRepository,
    private readonly reservationAmenityDateRepository: ReservationAmenityDateRepository,
    private readonly bookingTransactionRepository: BookingTransactionRepository,
    private readonly redisService: RedisService,
    private readonly countryRepository: CountryRepository,
    protected readonly reservationRepository: ReservationRepository,
    protected readonly bookingRepository: BookingRepository,
    private readonly apaleoService: ApaleoService,
    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(ApaleoRatePlanPmsMapping, DB_NAME.POSTGRES)
    private readonly apaleoRatePlanPmsMappingRepository: Repository<ApaleoRatePlanPmsMapping>,

    @InjectRepository(Company, DB_NAME.POSTGRES)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(MappingPmsHotel, DB_NAME.POSTGRES)
    private readonly mappingPmsHotelRepository: Repository<MappingPmsHotel>,

    @InjectRepository(RoomUnit, DB_NAME.POSTGRES)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(Hotel, DB_NAME.POSTGRES)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(Reservation, DB_NAME.POSTGRES)
    private readonly reservationCustomRepository: Repository<Reservation>
  ) {
    super(reservationRepository, bookingRepository);
    this.baseUrl = this.configService.get(ENVIRONMENT.PMS_APALEO_API_URL) ?? '';
    this.identityUrl = this.configService.get(ENVIRONMENT.PMS_APALEO_IDENTITY_API_URL) ?? '';
  }

  private buildHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken ?? ''}`,
      'Content-Type': 'application/json'
    };
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
      const clientId = this.configService.get(ENVIRONMENT.APALEO_CLIENT_ID) ?? '';
      const clientSecret = this.configService.get(ENVIRONMENT.APALEO_CLIENT_SECRET) ?? '';
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      const url = `${this.identityUrl}${IDENTITY_APALEO_API_URI.UPDATE_CONNECTOR}`;
      const response = await firstValueFrom(
        this.httpService.post(url, params.toString(), {
          headers
        })
      );

      if (response.status !== 200) {
        this.logger.error(
          `Error getting access token for property ${propertyId}: ${response.statusText}`
        );
        throw new BadRequestException(response.statusText);
      }

      if (!response.data.access_token) {
        this.logger.error(`No access token found in response for property ${propertyId}`);
        throw new BadRequestException('No access token found in response');
      }

      // step 3: save token to cache
      await this.redisService.set(
        cacheTokenKey,
        response.data.access_token,
        response.data.expires_in - 60 * 5
      ); // 5 minutes before expiration

      return response.data.access_token;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(
        `Error getting access token for property ${propertyId}: ${JSON.stringify(err)}`
      );
      throw new BadRequestException(err);
    }
  }

  async createReservationForApaleo(input: ReservationsCreatePmsInput) {
    const { connector, reservationTimeSlices, hotel, booking } = input;

    const url = `${this.configService.get(ENVIRONMENT.PMS_APALEO_DISTRIBUTION_API_URL)}${PMS_APALEO_DISTRIBUTION_API_URI.CREATE_BOOKING}`;

    const accessToken = await this.getAccessToken(
      connector?.refreshToken ?? '',
      booking?.hotelId ?? ''
    );

    const body = await this.buildCreateBookingInput({
      ...input,
      mappingHotelCode: connector?.mappingPmsHotel[0].mappingHotelCode ?? '',
      accessToken: accessToken
    });

    const headers = this.buildHeaders(accessToken);
    const cmd = getCurlCommand(url, 'POST', headers, body);
    this.logger.log(`Curl command create reservation apaleo: ${JSON.stringify(cmd)}`);
    try {
      const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
      const data = response.data as ApaleoCreateBookingResponseDto;
      this.logger.log(`Response create reservation apaleo success: ${JSON.stringify(data)}`);
      const outsideCases = [
        HotelPaymentModeCodeEnum.GUAWDE,
        HotelPaymentModeCodeEnum.PAYPAL,
        HotelPaymentModeCodeEnum.PMDOTH
      ];
      const paymentModeCode: any = booking?.reservations?.[0]?.hotelPaymentModeCode;
      if (paymentModeCode && outsideCases.includes(paymentModeCode)) {
        const reservationsPmsMap = new Map(
          data?.reservations?.map((item) => [item.externalId, item.id])
        );
        const updateReservations = booking.reservations.map((item, index) => {
          const mappingCode = reservationsPmsMap.get(item.id) || data?.reservations[index].id;
          return {
            ...item,
            mappingReservationCode: mappingCode
          };
        });
        const apaleoReservations = body.reservations.map((item, index) => {
          const id = reservationsPmsMap.get(item.externalId) || data?.reservations[index].id;
          return {
            ...item,
            id
          };
        });
        const mappingHotelCode = connector?.mappingPmsHotel[0].mappingHotelCode ?? '';
        await this.createApaleoPayment(
          updateReservations,
          apaleoReservations,
          accessToken,
          mappingHotelCode
        );
      }

      this.handleCacheReservation(data);
      this.updateReservationMapping(
        booking.reservations,
        data,
        reservationTimeSlices,
        hotel,
        connector
      );

      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error creating reservation: ${JSON.stringify(err)}`);
      return [];
    }
  }

  async updateReservationForApaleo(input: ReservationsCreatePmsInput) {
    const { booking, connector, reservationTimeSlices, hotel, isProposalBooking } = input;
    const url = `${this.configService.get(ENVIRONMENT.PMS_APALEO_DISTRIBUTION_API_URL)}${PMS_APALEO_DISTRIBUTION_API_URI.CREATE_BOOKING}/${booking.mappingBookingCode}`;

    const accessToken = await this.getAccessToken(
      connector?.refreshToken ?? '',
      booking?.hotelId ?? ''
    );

    const body = await this.buildCreateBookingInput({
      ...input,
      mappingHotelCode: connector?.mappingPmsHotel[0].mappingHotelCode ?? '',
      accessToken: accessToken
    });

    const reservationMap = groupByToMapSingle(
      input.booking.reservations,
      (item) => item.reservationNumber || ''
    );

    for (const reservation of body.reservations || []) {
      if (!reservation.externalId) {
        this.logger.error(`Reservation ${reservation} not found`);
        continue;
      }
      reservation['id'] = reservationMap.get(reservation.externalId)?.mappingReservationCode;
    }
    const headers = this.buildHeaders(accessToken);
    const cmd = getCurlCommand(url, 'PUT', headers, body);
    this.logger.log(`Curl command update reservation apaleo: ${JSON.stringify(cmd)}`);
    try {
      const response = await firstValueFrom(this.httpService.put(url, body, { headers }));

      const reservations = booking.reservations;
      const paymentAccount = body.paymentAccount;
      const apaleoReservations = body.reservations;
      const mappingHotelCode = connector?.mappingPmsHotel[0].mappingHotelCode ?? '';
      await this.handleUpdatePaymentAccount(reservations, accessToken, paymentAccount);
      await this.createApaleoPayment(
        reservations,
        apaleoReservations,
        accessToken,
        mappingHotelCode,
        isProposalBooking
      );

      const data = response.data as ApaleoCreateBookingResponseDto;
      this.logger.log(`Response update reservation apaleo success: ${JSON.stringify(data)}`);
      this.handleCacheReservation(data);
      this.updateReservationMapping(
        booking.reservations,
        data,
        reservationTimeSlices,
        hotel,
        connector
      );

      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error update reservation: ${JSON.stringify(err)}`);
      return [];
    }
  }

  private async handleUpdatePaymentAccount(
    reservations: Reservation[],
    accessToken: string,
    paymentAccount?: ApaleoCreatePaymentAccountDto | null
  ) {
    if (!paymentAccount) {
      this.logger.warn(`Payment account not found for reservations`);
      return false;
    }

    await processInBatches(
      reservations,
      10, // batch size
      50, // delay in ms
      async (reservation: Reservation) => {
        if (!reservation.mappingReservationCode) {
          this.logger.warn(
            `Reservation mapping reservation code not found for reservation ${reservation.id}`
          );
          return false;
        }

        const formData = [
          {
            op: 'add',
            path: '/paymentAccount',
            value: {
              accountNumber: paymentAccount.accountNumber,
              accountHolder: paymentAccount.accountHolder,
              expiryMonth: paymentAccount.expiryMonth,
              expiryYear: paymentAccount.expiryYear,
              paymentMethod: paymentAccount.paymentMethod,
              payerEmail: paymentAccount.payerEmail,
              payerReference: paymentAccount.payerReference,
              isVirtual: paymentAccount.isVirtual
            }
          }
        ];

        await this.updateReservationInfo({
          mappingReservationCode: reservation.mappingReservationCode,
          accessToken: accessToken,
          body: formData
        });

        this.logger.log(`Update payment account apaleo success for reservation ${reservation.id}`);
      }
    );
  }

  async createApaleoPayment(
    reservations: Reservation[],
    apaleoReservations: ApaleoCreateReservationDto[],
    accessToken: string,
    mappingHotelCode: string,
    isProposalBooking?: boolean
  ) {
    const reservationsMap = new Map<string, Reservation>();
    const reservationMappingCodes: string[] = [];

    for (const reservation of reservations) {
      if (!reservation.mappingReservationCode) continue;

      reservationsMap.set(reservation.mappingReservationCode, reservation);
      reservationMappingCodes.push(reservation.mappingReservationCode);
    }
    this.logger.debug(
      `Start create apaleo payment for reservations: ${reservationMappingCodes.join(', ')}`
    );

    // get folios from apaleo pms
    const folios = await this.getFolios(accessToken, reservationMappingCodes, mappingHotelCode);
    if (!folios) {
      this.logger.warn(`Folios not found for reservations`);
      return false;
    }
    const foliosMap = new Map<string, string>();
    for (const folio of folios) {
      if (!folio.reservation?.id) continue;
      foliosMap.set(folio.reservation.id, folio.id);
    }

    const bookingId = reservations[0].bookingId;
    if (!bookingId) {
      this.logger.warn(`Booking id not found for reservations`);
      return false;
    }

    const bookingTransaction =
      await this.bookingTransactionRepository.getBookingTransactionByBookingId(bookingId);
    const paymentMethod =
      ApaleoPaymentMethodMapping[bookingTransaction?.cardType?.toLowerCase() || ''] ||
      ApaleoPaymentMethod.CREDIT_CARD;

    await processInBatches(
      apaleoReservations,
      10, // batch size
      50, // delay in ms
      async (reservation: ApaleoCreateReservationDto) => {
        if (!reservation.prePaymentAmount) {
          this.logger.warn(`Pre payment amount not found for reservation ${reservation.id}`);
          return false;
        }
        // const isAuthorizedOnly = isProposalBooking || !(reservation.prePaymentAmount.amount > 0);
        if (!reservation.id) {
          this.logger.warn(
            `Reservation mapping reservation code not found to capture payment for reservation ${reservation.id}`
          );
          return false;
        }
        const folioId = foliosMap.get(reservation.id);
        if (!folioId) {
          this.logger.warn(`Folio not found for reservation ${reservation.id}`);
          return false;
        }

        const allowCaptured = reservation.prePaymentAmount.amount > 0;
        if (!allowCaptured) {
          this.logger.warn(`Pre payment amount not allowed for reservation ${reservation.id}`);
          return false;
        }

        // captured from our app
        const appReservation = reservationsMap.get(reservation.id);
        const paymentModeCode: any = appReservation?.hotelPaymentModeCode;
        const outsideCases = [
          HotelPaymentModeCodeEnum.GUAWDE,
          HotelPaymentModeCodeEnum.PAYPAL,
          HotelPaymentModeCodeEnum.PMDOTH
        ];

        const ApaleoPaymentMethodObj = {
          [HotelPaymentModeCodeEnum.GUAWDE]: ApaleoPaymentMethod.BANK_TRANSFER,
          [HotelPaymentModeCodeEnum.PAYPAL]: ApaleoPaymentMethod.PAYPAL,
          [HotelPaymentModeCodeEnum.PMDOTH]: ApaleoPaymentMethod.OTHER
        };

        if (outsideCases.includes(paymentModeCode)) {
          const formData = {
            method: ApaleoPaymentMethodObj[paymentModeCode],
            receipt: reservation.id,
            amount: {
              amount: reservation.prePaymentAmount.amount,
              currency: reservation.prePaymentAmount.currency
            }
          };
          await this.createFoliosPayment(accessToken, folioId, formData);
          this.logger.log(`Create folios payment apaleo success for reservation ${reservation.id}`);
          return true;
        }

        // authorized only and captured from apaleo
        const formData = {
          transactionReference: bookingTransaction?.referenceNumber,
          referenceType: 'PspReference',
          amount: {
            amount: reservation.prePaymentAmount.amount,
            currency: reservation.prePaymentAmount.currency
          }
        };
        // const formData = {
        //   // transactionReference: bookingTransaction?.referenceNumber,
        //   // referenceType: 'PspReference',
        //   amount: {
        //     amount: reservation.prePaymentAmount.amount,
        //     currency: reservation.prePaymentAmount.currency
        //   }
        // };
        await this.createFoliosPaymentbyAuthorization(accessToken, folioId, formData);
        this.logger.log(`Create folios payment apaleo success for reservation ${reservation.id}`);
        return true;
      }
    );
  }

  private handleCacheReservation(data: ApaleoCreateBookingResponseDto) {
    for (const reservation of data.reservations || []) {
      if (!reservation?.id) continue;
      this.redisService.set(
        `apaleo_reservation_created_${reservation.id}`,
        JSON.stringify(reservation.id),
        60 * 5 // 5 minutes
      );
    }
  }

  async updateReservationMapping(
    reservations: Reservation[],
    bookingPms: ApaleoCreateBookingResponseDto,
    reservationTimeSlices: ReservationTimeSlice[],
    hotel: Hotel,
    connector: Connector | null
  ) {
    const roomUnitIds: string[] = [];
    const assignUnitsInput: any[] = [];
    const reservationTimeSlicesMap = new Map<string, ReservationTimeSlice[]>();
    const reservationPmsMap = new Map<string, string>();
    const reservationsPms = bookingPms.reservations || [];

    for (const reservation of reservationsPms) {
      if (!(reservation?.externalId && reservation?.id)) continue;

      reservationPmsMap.set(reservation.externalId, reservation.id);
    }

    for (const reservationTimeSlice of reservationTimeSlices) {
      if (!reservationTimeSlice.roomId) continue;

      roomUnitIds.push(reservationTimeSlice.roomId);
      const key = reservationTimeSlice.reservationId ?? 'unknown';
      if (reservationTimeSlicesMap.has(key)) {
        reservationTimeSlicesMap.get(key)?.push(reservationTimeSlice);
      } else {
        reservationTimeSlicesMap.set(key, [reservationTimeSlice]);
      }
    }
    reservationTimeSlicesMap.delete('unknown');

    const roomUnits = await this.roomUnitRepository.find({
      where: {
        id: In(roomUnitIds)
      }
    });
    const roomUnitsMap = new Map<string, RoomUnit>(
      roomUnits.map((roomUnit) => [roomUnit.id ?? '', roomUnit])
    );

    const updatedReservations: Partial<Reservation> & Pick<Reservation, 'id'>[] = [];
    for (const [index, reservation] of reservations.entries()) {
      const mappingReservationCode =
        reservationPmsMap.get(reservation.reservationNumber || '') || reservationsPms[index]?.id;
      const reservationTimeSlices = reservationTimeSlicesMap.get(reservation.id) ?? [];

      const input: Partial<Reservation> & Pick<Reservation, 'id'> = {
        id: reservation.id,
        mappingReservationCode: mappingReservationCode,
        companyId: reservation.companyId,
        updatedAt: new Date()
      };

      updatedReservations.push(input);

      for (const timeSlice of reservationTimeSlices) {
        const roomUnit = roomUnitsMap.get(timeSlice.roomId ?? '');
        if (!roomUnit?.mappingPmsCode) continue;

        assignUnitsInput.push({
          id: mappingReservationCode,
          unitId: roomUnit.mappingPmsCode,
          from: formatDateTimeWithTimeZone({
            date: timeSlice.fromTime,
            timeZone: hotel.timeZone ?? ''
          }),
          to: formatDateTimeWithTimeZone({
            date: timeSlice.toTime,
            timeZone: hotel.timeZone ?? ''
          }),
          lockUnit: timeSlice.isLocked
        });
      }
    }

    const updatedBooking: Partial<Booking> & Pick<Booking, 'id'> = {
      id: reservations[0].bookingId ?? '',
      mappingBookingCode: bookingPms.id
    };

    await this.handleAfterPushPms(updatedReservations, updatedBooking, 'apaleo');
    this.assignCompanyToReservation(updatedReservations, hotel, connector);
    await this.assignUnits(assignUnitsInput, hotel.id, connector);

    for (const reservation of reservations) {
      const updatedReservation = updatedReservations.find((r) => r.id === reservation.id);
      if (!updatedReservation) continue;

      reservation.mappingReservationCode = updatedReservation['mappingReservationCode'];
    }

    this.handleLockUnit(reservations, hotel.id, connector);
  }

  private async assignCompanyToReservation(
    reservations: Partial<Reservation>[],
    hotel: Hotel,
    connector: Connector | null
  ) {
    for (const reservation of reservations) {
      if (!reservation?.companyId) continue;

      const apaleoCompanyId = await this.getApaleoCompanyId(
        reservation.companyId,
        hotel,
        connector
      );
      if (!apaleoCompanyId) {
        this.logger.warn(`Error assigning company`);
        return;
      }
      const url = `${this.baseUrl}${PMS_APALEO_API_URI.UPDATE_RESERVATION}`.replace(
        '{id}',
        reservation.mappingReservationCode ?? ''
      );
      const body = [
        {
          op: 'replace',
          path: '/company/Id',
          value: apaleoCompanyId
        }
      ];
      const accessToken = await this.getAccessToken(connector?.refreshToken ?? '', hotel.id ?? '');
      if (!accessToken) {
        this.logger.warn(
          `No access token found for hotel ${hotel.id} and connector ${connector?.id}`
        );
        return;
      }
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.patch(url, body, { headers }));
      const data = response.data as any;
      this.logger.log(
        `Response assign company to reservation apaleo success for reservation ${reservation.id}`
      );
      return data;
    }
  }

  private async getApaleoCompanyId(
    companyId: string | null,
    hotel: Hotel,
    connector: Connector | null
  ) {
    if (!companyId) {
      this.logger.warn(`Company id not found`);
      return null;
    }
    const accessToken = await this.getAccessToken(connector?.refreshToken ?? '', hotel.id ?? '');
    const [mappingPmsHotel, bookingCompany] = await Promise.all([
      this.mappingPmsHotelRepository.findOne({
        where: {
          hotelId: hotel.id,
          connectorId: connector?.id
        }
      }),
      this.companyRepository.findOne({ where: { id: companyId } })
    ]);
    if (!bookingCompany) {
      this.logger.warn(`Company not found`);
      return null;
    }
    if (!accessToken || !mappingPmsHotel) {
      this.logger.warn(
        `No access token found for hotel ${hotel.id} and connector ${connector?.id}`
      );
      return null;
    }
    const companies = await this.getCompanyFromApaleo(
      accessToken,
      mappingPmsHotel?.mappingHotelCode ?? ''
    );

    const company = companies?.find((company) => company.taxId === bookingCompany.taxId);

    if (!company) {
      // create company in apaleo
      const companyId = await this.createCompanyInApaleo(
        accessToken,
        bookingCompany,
        mappingPmsHotel?.mappingHotelCode ?? ''
      );
      if (!companyId) {
        this.logger.warn(`Error creating company in apaleo`);
        return null;
      }
      return companyId;
    }

    return company.id;
  }

  // get company from apaleo
  private async getCompanyFromApaleo(
    accessToken: string,
    hotelMappingCode: string
  ): Promise<ApaleoCompanyDto[] | null> {
    try {
      const url = `${this.baseUrl}${PMS_APALEO_API_URI.GET_COMPANY}`;
      const params = new URLSearchParams({
        propertyId: hotelMappingCode
      });
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.get(url, { headers, params }));
      const data = response.data?.companies as ApaleoCompanyDto[];
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting company from apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  // create company in apaleo
  private async createCompanyInApaleo(
    accessToken: string,
    company: Company,
    hotelMappingCode: string
  ): Promise<string | null> {
    try {
      const country = await this.countryRepository.getCountry({ id: company.country ?? '' });
      const url = `${this.baseUrl}${PMS_APALEO_API_URI.CREATE_COMPANY}`;
      const body: ApaleoCompanyDto = {
        //maxLength: 10
        // minLength: 3
        // pattern: ^[a-zA-Z0-9_]*$
        // make taxId to code maxLength 10, if not, make name trim to code maxLength 10 from last character
        code: company.taxId?.substring(0, 10) || company.name?.trim().substring(-10) || '',
        propertyId: hotelMappingCode,
        name: company.name ?? '',
        taxId: company.taxId ?? '',
        address: {
          addressLine1: company.address ?? '',
          postalCode: company.postalCode ?? '',
          city: company.city ?? '',
          countryCode: country?.code ?? ''
        },
        invoicingEmail: company.email ?? '',
        canCheckOutOnAr: true
      };
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
      return response.data?.id as string;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error creating company in apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  private async assignUnits(assignUnitsInput: any[], hotelId: string, connector: Connector | null) {
    const assignUnitsUrl = `${this.baseUrl}${PMS_APALEO_API_URI.ASSIGN_UNITS}`;
    const accessToken = await this.getAccessToken(connector?.refreshToken ?? '', hotelId ?? '');

    if (!accessToken) {
      this.logger.error(
        `No access token found for hotel ${hotelId} and connector ${connector?.id}`
      );
      return;
    }

    await processInBatches(
      assignUnitsInput,
      10, // batch size
      50, // delay in ms
      async (assignUnit: any) => {
        try {
          const url = assignUnitsUrl
            .replace('{id}', assignUnit.id)
            .replace('{unitId}', assignUnit.unitId);
          const body = assignUnit;
          const headers = this.buildHeaders(accessToken);
          const cmd = getCurlCommand(url, 'PUT', headers, body);
          this.logger.debug(`Curl command assign units apaleo: ${JSON.stringify(cmd)}`);
          const response = await firstValueFrom(this.httpService.put(url, body, { headers }));
          const data = response.data as ApaleoCreateBookingResponseDto;
          this.logger.log(`Response assign units apaleo success: ${JSON.stringify(data)}`);
          this.redisService.set(
            `apaleo_reservation_unit_assigned_${assignUnit.id}`,
            JSON.stringify(assignUnit.id),
            15 // 15 seconds
          );

          return true;
        } catch (error) {
          const err = error.response?.data;
          this.logger.error(`Error assigning units: ${JSON.stringify(err)}`);
          return false;
        }
      }
    );
  }

  private async handleLockUnit(
    reservations: Reservation[],
    hotelId: string,
    connector: Connector | null
  ) {
    const accessToken = await this.getAccessToken(connector?.refreshToken ?? '', hotelId ?? '');
    if (!accessToken) {
      this.logger.error(
        `No access token found for hotel ${hotelId} and connector ${connector?.id}`
      );
      return;
    }

    await processInBatches(
      reservations,
      10, // batch size
      50, // delay in ms
      async (reservation: Reservation) => {
        console.debug(
          `Reservation lock unit apaleo: ${JSON.stringify({
            reservationId: reservation.id,
            mappingReservationCode: reservation.mappingReservationCode,
            isLocked: reservation.isLocked
          })}`
        );
        if (!reservation.mappingReservationCode) {
          this.logger.warn(
            `Reservation mapping reservation code not found for reservation ${reservation.id}`
          );
          return false;
        }

        try {
          if (reservation.isLocked) {
            await this.apaleoService.lockUnits(accessToken, reservation.mappingReservationCode);
          } else {
            await this.apaleoService.unlockUnits(accessToken, reservation.mappingReservationCode);
          }
          return true;
        } catch (error) {
          const err = error.response?.data;
          this.logger.error(`Error lock/unlock units: ${JSON.stringify(err)}`);
          return false;
        }
      }
    );
  }

  async updateReservationInfo({
    mappingReservationCode,
    accessToken,
    body
  }: {
    mappingReservationCode: string;
    accessToken: string;
    body: any;
  }) {
    try {
      const url = `${this.baseUrl}${PMS_APALEO_API_URI.UPDATE_RESERVATION}`.replace(
        '{id}',
        mappingReservationCode
      );
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.patch(url, body, { headers }));
      const data = response.data as any;
      this.logger.log(
        `Response update reservation apaleo success for reservation ${mappingReservationCode}`
      );
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error update reservation apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async getFolios(
    accessToken: string,
    reservationMappingCodes: string[],
    mappingHotelCode: string
  ) {
    try {
      const url = `${this.baseUrl}${PMS_APALEO_API_URI.GET_FOLIOS}`;
      const queryParams = new URLSearchParams();
      queryParams.set('propertyIds', mappingHotelCode);
      queryParams.append('reservationIds', reservationMappingCodes.join(','));
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(
        this.httpService.get(url, { headers, params: queryParams })
      );
      const data = response.data as any;
      this.logger.log(`Response get folios apaleo success for reservation`);
      return data?.folios;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error get folios apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async createFoliosPayment(accessToken: string, folioId: string, body: any) {
    try {
      const url = `${this.baseUrl}${PMS_APALEO_API_URI.CREATE_FOLIOS_PAYMENT}`.replace(
        '{foliosId}',
        folioId
      );
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
      const data = response.data as any;
      this.logger.log(`Response create folios payment apaleo success for reservation`);
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error create folios payment apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async createFoliosPaymentbyAuthorization(accessToken: string, folioId: string, body: any) {
    try {
      const url =
        `${this.baseUrl}${PMS_APALEO_API_URI.CREATE_FOLIOS_PAYMENT_BY_AUTHORIZATION}`.replace(
          '{foliosId}',
          folioId
        );
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
      const data = response.data as any;
      this.logger.log(`Response create folios payment apaleo success for reservation`);
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error create folios payment apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async createFoliosPaymentbyPaymentAccount(accessToken: string, folioId: string, body: any) {
    try {
      const url =
        `${this.baseUrl}${PMS_APALEO_API_URI.CREATE_FOLIOS_PAYMENT_BY_PAYMENT_ACCOUNT}`.replace(
          '{foliosId}',
          folioId
        );
      const headers = this.buildHeaders(accessToken);
      const response = await firstValueFrom(this.httpService.post(url, body, { headers }));
      const data = response.data as any;
      this.logger.log(`Response create folios payment apaleo success for reservation`);
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error create folios payment apaleo: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async buildCreateBookingInput(
    input: ReservationsCreatePmsInput & { mappingHotelCode: string; accessToken: string }
  ): Promise<ApaleoCreateBookingDto> {
    const { booker, booking } = input;
    const currencyCode = booking.hotelId ? await this.getCurrencyCode(booking.hotelId) : '';
    if (!currencyCode) {
      throw new Error(`Currency code not found for hotel ${booking.hotelId}`);
    }
    const countryCode = booker.countryId ? await this.getCountryCode(booker.countryId) : '';

    const bookingTransaction = await this.getTransactionReference(input);
    const paymentAccount = this.buildPaymentAccount(input, bookingTransaction);
    const creditCard = this.buildCreditCard(input, bookingTransaction);
    const reservations = await this.buildReservations(input, currencyCode);
    const transactionReference =
      paymentAccount && paymentAccount ? bookingTransaction?.referenceNumber : null;

    const body: ApaleoCreateBookingDto = {
      ...(paymentAccount ? { paymentAccount } : {}),
      ...(creditCard ? { creditCard } : {}),
      ...(transactionReference ? { transactionReference } : {}),
      booker: {
        firstName: booker.firstName ?? '',
        lastName: booker.lastName ?? '',
        email: booker.emailAddress ?? '',
        phone: booker.phoneNumber ?? '',
        address: {
          addressLine1: booker.address ?? '',
          addressLine2: booker.companyAddress ?? '',
          city: booker.city ?? '',
          postalCode: booker.postalCode ?? '',
          countryCode: countryCode
        },
        company: {
          name: booker.companyName ?? '',
          taxId: booker.companyTaxId ?? ''
        }
      },
      // comment: '',
      channelCode: ChannelCode.Ibe,
      source: null,
      bookerComment: booking.specialRequest ?? '',
      reservations
    };
    return body;
  }

  private async getTransactionReference(
    input: ReservationsCreatePmsInput
  ): Promise<BookingTransaction | null> {
    const { booking } = input;
    const bookingTransaction =
      await this.bookingTransactionRepository.getBookingTransactionByBookingId(booking.id);
    return bookingTransaction;
  }

  private buildPaymentAccount(
    input: ReservationsCreatePmsInput,
    bookingTransaction: BookingTransaction | null
  ): ApaleoCreatePaymentAccountDto | null {
    const { booker } = input;
    if (!bookingTransaction?.accountNumber) {
      return null;
    }

    return {
      accountNumber: bookingTransaction?.accountNumber ?? '',
      accountHolder: bookingTransaction?.accountHolder ?? '',
      expiryMonth: bookingTransaction?.expiryMonth ?? '',
      expiryYear: bookingTransaction?.expiryYear ?? '',
      paymentMethod: bookingTransaction?.cardType ?? '',
      payerEmail: booker.emailAddress ?? '',
      payerReference: booker.id ?? '',
      isVirtual: false
    };
  }

  private buildCreditCard(
    input: ReservationsCreatePmsInput,
    bookingTransaction: BookingTransaction | null
  ): ApaleoCreditCardDto | null {
    const { booker } = input;

    if (!bookingTransaction?.accountNumber) {
      return null;
    }

    return {
      cardNumber: bookingTransaction?.accountNumber ?? '',
      cvc: '',
      cardHolder: bookingTransaction?.accountHolder ?? '',
      expiryMonth: bookingTransaction?.expiryMonth ?? '',
      expiryYear: bookingTransaction?.expiryYear ?? '',
      cardType: bookingTransaction?.cardType ?? 'card',
      payerEmail: booker.emailAddress ?? ''
    };
  }

  private async buildReservations(
    input: ReservationsCreatePmsInput & { mappingHotelCode: string; accessToken: string },
    currencyCode: string
  ): Promise<ApaleoCreateReservationDto[]> {
    const { booking, booker, hotel, reservationTimeSlices } = input;
    const reservations = booking.reservations;
    const reservationTimeSlicesMap = reservationTimeSlices?.reduce(
      (pre, cur) => {
        const key = cur.reservationId ?? 'unknown';
        if (pre.hasOwnProperty(key)) {
          pre[key].push(cur);
        } else {
          pre[key] = [cur];
        }
        return pre;
      },
      {} as Record<string, ReservationTimeSlice[]>
    );
    delete reservationTimeSlicesMap['unknown'];

    const reservationsMapped: ApaleoCreateReservationDto[] = await Promise.all(
      reservations.map(async (reservation) => {
        const reservationTimeSlicesMapped = reservationTimeSlicesMap[reservation.id] ?? [];

        const ratePlanId = await this.getRatePlanId(reservation);
        const { services, includedServiceAmounts } = await this.buildReservationServices(
          {
            ...reservation,
            mappingHotelCode: input.mappingHotelCode,
            accessToken: input.accessToken
          },
          currencyCode
        );

        const primaryGuest = reservation.primaryGuest || booking.booker;

        const guestCountryCode = reservation.primaryGuest?.countryId
          ? await this.getCountryCode(reservation.primaryGuest.countryId)
          : '';
        const reservationMap: ApaleoCreateReservationDto = {
          arrival: formatDateTimeWithTimeZone({
            date: reservation.arrival,
            timeZone: hotel.timeZone ?? ''
          }),
          departure: formatDateTimeWithTimeZone({
            date: reservation.departure,
            timeZone: hotel.timeZone ?? ''
          }),
          adults: reservation.adults ?? 0,
          childrenAges: reservation.childrenAges || [],
          // comment: reservation.note || '',
          externalId: reservation.reservationNumber || '',
          guestComment: reservation.note || '',
          // externalCode: reservation.reservationNumber || '',
          channelCode: ChannelCode.Ibe,
          source: null,
          pricingType: ReservationPricingType.BeforeTaxesWithVat,
          primaryGuest: {
            firstName: primaryGuest?.firstName ?? '',
            lastName: primaryGuest?.lastName ?? '',
            email: primaryGuest?.emailAddress ?? '',
            phone: primaryGuest?.phoneNumber ?? '',
            address: {
              addressLine1: primaryGuest?.address ?? '',
              city: primaryGuest?.city ?? '',
              postalCode: primaryGuest?.postalCode ?? '',
              countryCode: guestCountryCode ?? ''
            },
            preferredLanguage: primaryGuest?.preferredLanguage ?? '',
            company: {
              name: booker.companyName ?? '',
              taxId: booker.companyTaxId ?? ''
            }
          },
          prePaymentAmount: {
            amount: reservation.payOnConfirmationAmount ?? 0,
            currency: currencyCode
          },
          additionalGuests: JSON.parse(reservation.additionalGuests ?? '[]')?.map((guest: any) => ({
            firstName: guest.firstName ?? '',
            lastName: guest.lastName ?? '',
            email: guest.emailAddress ?? '',
            phone: guest.phoneNumber ?? '',
            address: {
              addressLine1: guest.address ?? '',
              city: guest.city ?? '',
              postalCode: guest.postalCode ?? '',
              countryCode: guest.countryId ?? ''
            }
          })),
          // guaranteeType: '',
          travelPurpose: reservation.tripPurpose ?? '',
          timeSlices: reservationTimeSlicesMapped.map((timeSlice, index) => ({
            ratePlanId: ratePlanId,
            totalAmount: {
              amount: timeSlice.totalGrossAmount ?? 0,
              currency: currencyCode
            }
          })),
          services,
          companyId: '',
          corporateCode: '',
          promoCode: reservation.promoCode ?? '',
          cityTaxAmount: 0,
          reservationCityTaxList: []
        };
        return reservationMap;
      })
    );
    return reservationsMapped;
  }

  private async getRatePlanId(reservation: Reservation): Promise<string> {
    const [salesPlanMapping, ratePlan] = await Promise.all([
      this.apaleoRatePlanPmsMappingRepository.findOne({
        where: {
          hotelId: reservation.hotelId ?? '',
          ratePlanId: reservation.ratePlanId ?? '',
          roomProductId: reservation.roomProductId ?? ''
        }
      }),
      this.ratePlanRepository.findOne({
        where: {
          id: reservation?.ratePlanId!
        }
      })
    ]);
    this.logger.log(
      ` rate plan mapping code: ${JSON.stringify(salesPlanMapping?.mappingRatePlanCode)} and ${JSON.stringify(ratePlan?.pmsMappingRatePlanCode)}`
    );
    return (salesPlanMapping?.mappingRatePlanCode || ratePlan?.pmsMappingRatePlanCode) ?? '';
  }

  private async buildReservationServices(
    reservation: Reservation & { mappingHotelCode: string; accessToken: string },
    currencyCode: string
  ): Promise<{ services: ApaleoBookReservationServiceDto[]; includedServiceAmounts: number[] }> {
    const reservationAmenities = await this.reservationAmenityRepository.getReservationAmenities({
      reservationId: reservation.id
    });

    let pmsServices: ApaleoServiceDto[] = [];

    try {
      pmsServices =
        (
          await this.apaleoService.getServices(reservation.accessToken, {
            propertyId: reservation.mappingHotelCode,
            onlySoldAsExtras: false,
            serviceTypes: [],
            pageNumber: 1,
            pageSize: 200,
            expand: []
          })
        )?.services ?? [];
    } catch (error) {
      this.logger.error(`Error getting services for reservation: ${reservation.id}`);
      pmsServices = [];
    }

    if (!reservationAmenities.length) {
      this.logger.log(`No amenities found for reservation: ${reservation.id}`);
      return { services: [], includedServiceAmounts: [] };
    }

    const hotelAmenityIds: string[] = [];
    const reservationAmenityIds: string[] = [];

    for (const amenity of reservationAmenities) {
      if (amenity.hotelAmenityId) {
        hotelAmenityIds.push(amenity.hotelAmenityId);
      }
      if (amenity.id) {
        reservationAmenityIds.push(amenity.id);
      }
    }

    const [amenityDates, hotelAmenities] = await Promise.all([
      this.reservationAmenityDateRepository.getReservationAmenityDates({
        reservationAmenityIds: reservationAmenityIds,
        relations: ['reservationAmenity']
      }),
      this.hotelAmenityRepository.getHotelAmenities({
        ids: hotelAmenityIds,
        hotelId: reservation.hotelId ?? ''
      })
    ]);

    const amenityDatesMap = amenityDates.reduce(
      (pre, cur) => {
        const key = cur.reservationAmenityId ?? 'unknown';
        if (pre.hasOwnProperty(key)) {
          pre[key].push(cur);
        } else {
          pre[key] = [cur];
        }
        return pre;
      },
      {} as Record<string, ReservationAmenityDate[]>
    );
    delete amenityDatesMap['unknown'];

    const hotelAmenitiesMap = new Map<string, HotelAmenity>(
      hotelAmenities.map((hotelAmenity) => [hotelAmenity.id ?? '', hotelAmenity])
    );

    // Create a map from pmsServices for quick lookup by service id

    let services: ApaleoBookReservationServiceDto[] = [];
    const includedServiceAmountMap = new Map<string, number>();

    for (const reservationAmenity of reservationAmenities) {
      const hotelAmenity = hotelAmenitiesMap.get(reservationAmenity.hotelAmenityId ?? '');
      if (!hotelAmenity?.mappingHotelAmenityCode) {
        continue;
      }

      const amenityDates = amenityDatesMap[reservationAmenity.id] ?? [];
      const service: ApaleoBookReservationServiceDto = {
        serviceId: hotelAmenity?.mappingHotelAmenityCode ?? '',
        dates: amenityDates.map((x) => {
          const isIncluded =
            x?.reservationAmenity?.extraServiceType === ExtraServiceTypeEnum.INCLUDED;
          if (isIncluded) {
            const totalAmount = includedServiceAmountMap.get(x.date ?? '');
            includedServiceAmountMap.set(
              x.date ?? '',
              (totalAmount ?? 0) + (x?.totalGrossAmount ?? 0)
            );
          }
          return {
            serviceDate: x.date ?? '',
            count: x.count ?? undefined,
            amount: {
              amount: x?.totalGrossAmount ?? 0,
              currency: currencyCode
            }
          };
        })
      };
      services.push(service);
    }

    services = Object.values(
      services.reduce(
        (pre, cur) => {
          const key = cur.serviceId;
          if (!pre.hasOwnProperty(key)) {
            pre[key] = cur;
            return pre;
          }

          if (!pre[key].dates) {
            pre[key].dates = cur.dates || [];
            return pre;
          }

          for (const date of cur.dates || []) {
            const existingDateIndex = pre[key].dates.findIndex(
              (x) => x.serviceDate === date.serviceDate
            );
            if (existingDateIndex === -1) {
              pre[key].dates.push(date);
              continue;
            }
            const existingDate = pre[key].dates[existingDateIndex];
            pre[key].dates[existingDateIndex] = {
              serviceDate: date.serviceDate,
              count: (existingDate.count ?? 0) + (date.count ?? 0),
              amount: {
                amount: (existingDate.amount?.amount ?? 0) + (date.amount?.amount ?? 0),
                currency: currencyCode
              }
            };
          }
          return pre;
        },
        {} as Record<string, ApaleoBookReservationServiceDto>
      )
    );

    const pmsServicesMap = groupByToMapSingle(pmsServices, (item) => item.id);

    // Handle availability mode and postNextDay for each service
    for (const service of services) {
      const pmsService = pmsServicesMap.get(service.serviceId);
      if (!pmsService || !service.dates?.length) {
        continue;
      }

      // If availability mode is 'Arrival': merge all dates into earliest date
      // If availability mode is 'Departure': merge all dates into latest date
      const availabilityMode = pmsService.availability?.mode;
      if (availabilityMode === 'Arrival' || availabilityMode === 'Departure') {
        const sortedDates = [...service.dates].sort((a, b) =>
          a.serviceDate.localeCompare(b.serviceDate)
        );

        const fromDate = reservation.arrival
          ? format(reservation.arrival, DATE_FORMAT)
          : sortedDates[0].serviceDate;
        const toDate = reservation.departure
          ? format(subDays(reservation.departure, 1), DATE_FORMAT)
          : sortedDates[sortedDates.length - 1].serviceDate;

        const targetDate =
          availabilityMode === 'Arrival'
            ? fromDate // earliest date
            : toDate; // latest date

        const totalAmount = service.dates.reduce(
          (sum, dateItem) => sum + (dateItem.amount?.amount ?? 0),
          0
        );

        const totalCount = service.dates.reduce((sum, dateItem) => sum + (dateItem.count ?? 0), 0);

        service.dates = [
          {
            serviceDate: targetDate,
            count: totalCount > 0 ? totalCount : undefined,
            amount: {
              amount: totalAmount,
              currency: currencyCode
            }
          }
        ];
      }

      // If pmsService.postNextDay is true, add 1 day to all service dates
      if (pmsService.postNextDay && service.dates) {
        service.dates = service.dates.map((dateItem) => {
          const nextDay = addDays(parseDate(dateItem.serviceDate), 1);

          return {
            ...dateItem,
            serviceDate: format(nextDay, DATE_FORMAT)
          };
        });
      }
    }

    return { services, includedServiceAmounts: Array.from(includedServiceAmountMap.values()) };
  }

  private async getCountryCode(countryId: string): Promise<string> {
    const country = await this.countryRepository.getCountry({ id: countryId });
    return country?.code ?? '';
  }

  private async getCurrencyCode(hotelId: string): Promise<string> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: ['baseCurrency']
    });
    return hotel?.baseCurrency?.code ?? '';
  }
}
