import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseStatusEnum } from '@src/core/enums/common';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import { fromZonedTime } from 'date-fns-tz';
import { firstValueFrom } from 'rxjs';
import { DB_NAME } from 'src/core/constants/db.const';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import {
  Reservation,
  ReservationChannelEnum,
  ReservationStatusEnum
} from 'src/core/entities/booking-entities/reservation.entity';
import { PricingUnitEnum } from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { MewsServiceSettings } from 'src/core/entities/mews-entities/mews-service-settings.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { getCurlCommand } from 'src/core/utils/curl.util';
import { BookingRepository } from 'src/modules/booking/repositories/booking.repository';
import { HotelAmenityRepository } from 'src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { ReservationAmenityRepository } from 'src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { ReservationRepository } from 'src/modules/reservation/repositories/reservation.repository';
import { Repository } from 'typeorm';
import {
  ProductOrderDto,
  ReservationState,
  ReservationsCreateInput,
  ReservationsCreateMewsInput,
  TimeUnitPriceDto
} from '../dtos/mews-pms.dto';
import { ProductPmsDto } from '../dtos/pms.dto';
import { AbstractPmsService } from './abstract-pms.sercive';
import { PMS_MEWS_API_URI } from './mews-api.consant';
import {
  MewsTaxationsResponseDto,
  MewsTaxEnvironmentDto,
  MewsTaxEnvironmentsResponseDto,
  MewsProductDto,
  MewsProductResponseDto
} from './mews.dto';

@Injectable()
export class MewsPmsService extends AbstractPmsService {
  protected readonly logger = new Logger(MewsPmsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(HotelTax, DB_NAME.POSTGRES)
    private readonly hotelTaxRepository: Repository<HotelTax>,

    private readonly reservationAmenityRepository: ReservationAmenityRepository,
    @Inject(forwardRef(() => HotelAmenityRepository))
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    protected readonly reservationRepository: ReservationRepository,
    protected readonly bookingRepository: BookingRepository,

    @InjectRepository(MewsServiceSettings, DB_NAME.POSTGRES)
    private readonly mewsServiceSettingsRepository: Repository<MewsServiceSettings>,

    private readonly roomProductRepository: RoomProductRepository
  ) {
    super(reservationRepository, bookingRepository);
    this.baseUrl = process.env.MEWS_API || 'https://api.mews-demo.com';
  }

  async createReservationForMews(input: ReservationsCreateMewsInput) {
    const url = `${this.baseUrl}${PMS_MEWS_API_URI.CREATE_RESERVATION}`;
    this.logger.log(`Creating reservation with url: ${url}`);
    const body = await this.buildReservationCreateInput(input);

    const cmd = getCurlCommand(url, 'POST', {}, body);
    this.logger.debug(`Curl command create reservation mews: ${JSON.stringify(cmd)}`);
    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const data = response.data?.Reservations;
      this.logger.log(`Response create reservation mews success: ${JSON.stringify(data)}`);

      this.updateReservationMapping(input.booking.reservations, data);
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error creating reservation: ${JSON.stringify(err)}`);
      return {
        status: ResponseStatusEnum.ERROR,
        message: err?.Message ?? 'Error creating reservation',
        data: null
      };
    }
  }

  async updateReservationMapping(reservations: Reservation[], pmsReservations: any[]) {
    const updatedReservations: Partial<Reservation> & Pick<Reservation, 'id'>[] = reservations.map(
      (reservation) => {
        const pmsReservation = pmsReservations.find(
          (pmsReservation) => pmsReservation.Identifier === reservation.id
        )?.Reservation;
        const input: Partial<Reservation> & Pick<Reservation, 'id'> = {
          id: reservation.id,
          mappingReservationCode: pmsReservation?.Id
        };
        return input;
      }
    );
    const updatedBooking = {
      id: reservations[0].bookingId ?? '',
      mappingBookingCode: pmsReservations[0].GroupId ?? ''
    };
    await this.handleAfterPushPms(updatedReservations, updatedBooking, 'Mews');
  }

  async getAllAgeCategoriesForMews(
    input: ReservationsCreateMewsInput,
    serviceSetting: MewsServiceSettings | null
  ) {
    const { booking, connector } = input;
    const url = `${this.baseUrl}${PMS_MEWS_API_URI.GET_ALL_AGE_CATEGORIES}`;
    const body = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: connector?.refreshToken ?? '',
      Client: 'Gauvendi',
      PropertyId: booking?.hotelId ?? '',
      ServiceIds: serviceSetting?.serviceId ? [serviceSetting?.serviceId] : [],
      ActivityStates: ['Active']
    };
    const cmd = getCurlCommand(url, 'POST', {}, body);
    this.logger.debug(`Curl command age categories: ${JSON.stringify(cmd)}`);
    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      this.logger.log(`Response age categories: ${JSON.stringify(response.data)}`);
      return response.data?.AgeCategories;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting all age categories: ${JSON.stringify(err)}`);
      return [];
    }
  }

  async buildReservationCreateInput(
    input: ReservationsCreateMewsInput
  ): Promise<ReservationsCreateInput> {
    const { booking, connector } = input;
    const serviceSetting = await this.mewsServiceSettingsRepository.findOne({
      where: {
        hotelId: booking?.hotelId ?? '',
        serviceType: 'ROOM_ONLY'
      }
    });
    this.logger.log(`Service setting: ${JSON.stringify(serviceSetting)}`);
    const ageCategories = await this.getAllAgeCategoriesForMews(input, serviceSetting);
    if (!ageCategories) {
      this.logger.error(`Age categories not found`);
    }

    const customer = await this.getCustomerByEmail(input);
    const hotelTax = await this.hotelTaxRepository.findOne({
      where: {
        hotelId: booking?.hotelId ?? ''
      }
    });
    this.logger.log(`Hotel tax: ${JSON.stringify(hotelTax)}`);
    this.logger.log(`Customer: ${JSON.stringify(customer)}`);
    const reservations = input.booking.reservations;

    const roomProductMappingList: Map<string, ProductPmsDto | null> = new Map();
    const ratePlans: Map<string, RatePlan | null> = new Map();
    const roomUnitIds = input.roomProductList.flatMap((room) => room.roomIds ?? []);

    for (const reservation of reservations) {
      const roomProductMapping =
        await this.roomProductRepository.findRoomProductAndRoomUnitMappingPms({
          hotelId: booking?.hotelId ?? '',
          roomProductId: reservation.roomProductId ?? '',
          roomUnitIds: roomUnitIds
        });
      roomProductMappingList.set(reservation.id, roomProductMapping as ProductPmsDto);

      const ratePlan = await this.ratePlanRepository.findOne({
        where: {
          id: reservation.ratePlanId ?? ''
        }
      });
      ratePlans.set(reservation.id, ratePlan ?? null);
    }
    const timeUnitPricesMapping = this.getTimeUnitPrices(input, hotelTax);
    this.logger.log(`Rate plan: ${JSON.stringify(ratePlans.values())}`);
    this.logger.log(`Room product mapping: ${JSON.stringify(roomProductMappingList.values())}`);
    const productOrdersMapping = await this.getProductOrders(input);
    this.logger.log(`Product orders mapping: ${JSON.stringify(productOrdersMapping)}`);

    const body: ReservationsCreateInput = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: connector?.refreshToken ?? '',
      Client: 'Gauvendi',
      PropertyId: booking?.hotelId ?? '',
      ServiceId: serviceSetting?.serviceId ?? null,
      SendConfirmationEmail: false,
      Reservations: reservations.map((reservation) => ({
        CustomerId: customer?.Id ?? '',
        BookerId: customer?.Id ?? '',
        RequestedCategoryId:
          roomProductMappingList.get(reservation.id)?.roomProductMappingPmsCode ?? '',
        RateId: ratePlans.get(reservation.id)?.pmsMappingRatePlanCode ?? '',
        StartUtc: reservation.arrival?.toISOString() ?? '',
        EndUtc: reservation.departure?.toISOString() ?? '',
        Identifier: reservation.id ?? '',
        State:
          reservation.status === ReservationStatusEnum.CONFIRMED
            ? ReservationState.CONFIRMED
            : ReservationState.OPTIONAL,
        ProductOrders: productOrdersMapping?.get(reservation.id) ?? [],
        PersonCounts: this.getPersonCount(ageCategories, reservation),
        // TimeUnitPrices: timeUnitPricesMapping?.get(reservation.id) ?? [],
        Notes: reservation.note,
        AssignedResourceId:
          roomProductMappingList.get(reservation.id)?.roomUnitMappingPmsCode[0] ?? '',
        ...(reservation.channel === ReservationChannelEnum.SITEMINDER
          ? { Source: reservation.source }
          : {})
      }))
    };

    return body;
  }

  getTimeUnitPrices(input: ReservationsCreateMewsInput, hotelTax: HotelTax | null) {
    const { booking, currencyCode } = input;
    const reservations = booking?.reservations ?? [];
    const timeUnitPrices: Map<string, TimeUnitPriceDto[]> = new Map();
    for (const reservation of reservations) {
      const nights =
        Math.ceil(
          ((reservation.departure?.getTime() || 0) - (reservation.arrival?.getTime() || 0)) /
            (1000 * 60 * 60 * 24)
        ) || 1;
      const grossValue = (reservation.totalGrossAmount ?? 0) / nights;
      const timeUnitPrice = Array.from({ length: nights }, (_, index) => ({
        Index: index,
        Amount: {
          GrossValue: grossValue,
          Currency: currencyCode || '',
          TaxCodes: hotelTax?.mappingPmsTaxCode ? [hotelTax.mappingPmsTaxCode] : []
        }
      }));
      timeUnitPrices.set(reservation.id, timeUnitPrice);
    }
    return timeUnitPrices;
  }

  getPersonCount(ageCategories: any[], reservation: Reservation) {
    const childrenAges = reservation.childrenAges || [];

    const personCounts = ageCategories
      ?.map((ageCategory) => {
        let count = 0;
        if (ageCategory.MinimalAge === null && ageCategory.MaximalAge === null) {
          return {
            AgeCategoryId: ageCategory.Id,
            Count: reservation.adults ?? 0
          };
        }
        count =
          childrenAges.filter(
            (age) => ageCategory.MinimalAge <= age && ageCategory.MaximalAge >= age
          )?.length ?? 0;
        return {
          AgeCategoryId: ageCategory.Id,
          Count: count
        };
      })
      .filter((personCount) => personCount.Count > 0);
    return personCounts;
  }

  async getCustomerByEmail(input: ReservationsCreateMewsInput) {
    const { booking, connector, booker } = input;
    const url = `${this.baseUrl}${PMS_MEWS_API_URI.GET_ALL_CUSTOMER}`;
    const body = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: connector?.refreshToken ?? '',
      Client: 'Gauvendi',
      PropertyId: booking?.hotelId ?? '',
      Emails: booker.emailAddress ? [booker.emailAddress] : []
    };
    const cmd = getCurlCommand(url, 'POST', {}, body);
    this.logger.debug(`Curl command get customer by email: ${JSON.stringify(cmd)}`);
    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const customer = response.data?.Customers?.[0];
      if (customer) {
        return customer;
      }
      const newCustomer = await this.addCustomerForMews(input);
      return newCustomer;
    } catch (error) {
      this.logger.error(`Error getting customer by email: ${error}`);
      return null;
    }
  }

  async addCustomerForMews(input: ReservationsCreateMewsInput) {
    const { booking, connector, booker } = input;
    const url = `${this.baseUrl}${PMS_MEWS_API_URI.ADD_CUSTOMER}`;
    const body = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: connector?.refreshToken ?? '',
      Client: 'Gauvendi',
      PropertyId: booking?.hotelId ?? '',
      FirstName: booker.firstName ?? '',
      LastName: booker.lastName ?? '',
      Email: booker.emailAddress ?? '',
      Phone: booker.phoneNumber ?? ''
    };
    const cmd = getCurlCommand(url, 'POST', {}, body);
    this.logger.debug(`Curl command add customer: ${JSON.stringify(cmd)}`);
    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      return response.data;
    } catch (error) {
      this.logger.error(`Error adding customer: ${error}`);
      return [];
    }
  }

  async getProductOrders(
    input: ReservationsCreateMewsInput
  ): Promise<Map<string, ProductOrderDto[]>> {
    const { booking } = input;
    const reservations = booking?.reservations ?? [];
    const productOrders: Map<string, ProductOrderDto[]> = new Map();
    try {
      for (const [rIndex, reservation] of reservations.entries()) {
        const amenities = await this.reservationAmenityRepository.getReservationAmenities({
          reservationId: reservation.id
        });
        const amenityIds = amenities
          .map((amenity) => amenity.hotelAmenityId)
          .filter((id) => id !== null && id !== undefined);
        const hotelAmenities = await this.hotelAmenityRepository.getHotelAmenities({
          ids: amenityIds
        });
        if (!hotelAmenities?.length) {
          continue;
        }

        const arrival = reservation.arrival;
        const departure = reservation.departure;
        if (!arrival || !departure) {
          this.logger.error(`Arrival or departure is null for reservation: ${reservation.id}`);
          continue;
        }

        for (const hotelAmenity of hotelAmenities) {
          const orders = productOrders.get(reservation.id) ?? [];
          const productId = hotelAmenity.mappingHotelAmenityCode ?? '';

          const addOrder = (count: number) => {
            orders.push({
              ProductId: productId,
              Count: count ?? 1
            });
          };

          switch (hotelAmenity.pricingUnit) {
            case PricingUnitEnum.NIGHT:
            case PricingUnitEnum.ROOM:
            case PricingUnitEnum.PER_PERSON_PER_ROOM:
            case PricingUnitEnum.PERSON: {
              addOrder(1);
              break;
            }

            case PricingUnitEnum.ITEM: {
              // TODO: get count from booking
              const count = 1;
              // const count =
              //   bookingInput.bookingInformation.reservationList[rIndex]?.amenityPricingList?.find(
              //     (item) => item.hotelAmenityCode === hotelAmenity.code
              //   )?.count ?? 1;
              addOrder(count);
              break;
            }
          }

          productOrders.set(reservation.id, orders);
        }
      }
      return productOrders;
    } catch (error) {
      this.logger.error(`Error getting product orders: ${error}`);
      return new Map();
    }
  }

  private convertToUtcTimeUnits(timezone: string, date: Date) {
    // Normalize input to start of day in the given timezone
    const newDate = fromZonedTime(date, timezone);

    // Convert to ISO strings (UTC)
    const dateUtc = newDate.toISOString();

    return dateUtc;
  }

  /**
   * Get all taxations (city taxes) from Mews
   * Calls /api/connector/v1/taxations/getAll
   */
  async getMewsTaxations(accessToken: string): Promise<MewsTaxationsResponseDto> {
    const url = `${this.baseUrl}/api/connector/v1/taxations/getAll`;

    const body = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: accessToken,
      Client: 'Gauvendi'
    };

    this.logger.log(`Getting Mews taxations from: ${url}`);

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const data = response.data;
      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting Mews taxations: ${JSON.stringify(err)}`);
      throw new BadRequestException(`Error getting Mews taxations: ${JSON.stringify(err)}`);
    }
  }

  /**
   * Get all tax environments from Mews
   * Calls /api/connector/v1/taxEnvironments/getAll
   */
  async getMewsTaxEnvironments(accessToken: string): Promise<MewsTaxEnvironmentDto[]> {
    const url = `${this.baseUrl}/api/connector/v1/taxEnvironments/getAll`;

    const body = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: accessToken,
      Client: 'Gauvendi'
    };

    this.logger.log(`Getting Mews tax environments from: ${url}`);

    try {
      const response = await firstValueFrom(this.httpService.post(url, body));
      const data = response.data?.TaxEnvironments;

      this.logger.log(
        `Successfully retrieved ${data?.TaxEnvironments?.length || 0} tax environments from Mews`
      );

      return data;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting Mews tax environments: ${JSON.stringify(err)}`);
      throw new BadRequestException(`Error getting Mews tax environments: ${JSON.stringify(err)}`);
    }
  }

  /**
   * Get all products from MEWS
   * Calls /api/connector/v1/products/getAll
   */
  async getMewsProducts(accessToken: string, serviceIds: string[]): Promise<MewsProductDto[]> {
    const url = `${this.baseUrl}/api/connector/v1/products/getAll`;

    const body: any = {
      ClientToken: this.configService.get(ENVIRONMENT.MEWS_CLIENT_TOKEN) ?? '',
      AccessToken: accessToken,
      Client: 'Gauvendi',
      ServiceIds: serviceIds,
      Limitation: {
        Count: 500
      }
    };

    this.logger.log(`Getting Mews products from: ${url}`);

    try {
      const allProducts: MewsProductDto[] = [];
      let cursor: string | undefined = undefined;

      do {
        const requestBody: any = {
          ...body,
          Limitation: {
            ...body.Limitation,
            ...(cursor ? { Cursor: cursor } : {})
          }
        };

        const response = await firstValueFrom(this.httpService.post(url, requestBody));
        const data: MewsProductResponseDto = response.data;

        if (data?.Products && data.Products.length > 0) {
          allProducts.push(...data.Products);
        }

        cursor = data?.Cursor;
      } while (cursor);

      this.logger.log(`Successfully retrieved ${allProducts.length} products from Mews`);
      return allProducts;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting Mews products: ${JSON.stringify(err)}`);
      throw new BadRequestException(`Error getting Mews products: ${JSON.stringify(err)}`);
    }
  }
}
