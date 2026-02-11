import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import Decimal from 'decimal.js';
import { filter, lastValueFrom, take } from 'rxjs';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import { PERFORMED_BY } from 'src/core/constants/common.const';
import { PAYABLE_METHOD_LIST } from 'src/core/constants/payment';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import { BookingMetaTracking } from 'src/core/entities/booking-entities/booking-meta-tracking.entity';
import {
  BookingTransaction,
  BookingTransactionStatusEnum
} from 'src/core/entities/booking-entities/booking-transaction.entity';
import { BookingUpsellInformation } from 'src/core/entities/booking-entities/booking-upsell-information.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { ReservationAmenityDate } from 'src/core/entities/booking-entities/reservation-amenity-date.entity';
import { ReservationAmenity } from 'src/core/entities/booking-entities/reservation-amenity.entity';
import { ReservationRelatedMrfc } from 'src/core/entities/booking-entities/reservation-related-mrfc.entity';
import { ReservationTimeSlice } from 'src/core/entities/booking-entities/reservation-time-slice.entity';
import {
  Reservation,
  ReservationStatusEnum
} from 'src/core/entities/booking-entities/reservation.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import {
  HotelAmenity,
  PricingUnitEnum,
  SellingTypeEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelConfigurationTypeEnum } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelPaymentMethodSetting } from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelTemplateEmailCodesEnum } from 'src/core/entities/hotel-entities/hotel-template-email.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { MappingPmsHotel } from 'src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { ExtraServiceTypeEnum } from 'src/core/enums/common';
import { PaymentModeCodeEnum } from 'src/core/enums/payment';
import { BaseService } from 'src/core/services/base.service';
import { getRangeDates } from 'src/core/utils/datetime.util';
import { RequestPaymentResponseDto } from 'src/integration/payment/dtos/request-payment.dto';
import { PaymentService } from 'src/integration/payment/payment.service';
import { PmsService } from 'src/integration/pms/services/pms.service';
import { AvailabilityService } from 'src/modules/availability/services/availability.service';
import { BookingCalculateService } from 'src/modules/booking-calculate/booking-calculate.service';
import {
  CalculateBookingPricingInputDto,
  CalculateReservationPricingInputDto
} from 'src/modules/booking-calculate/dtos/calculate-booking-pricing-input.dto';
import { BookingTransactionRepository } from 'src/modules/booking-transaction/repositories/booking-transaction.repository';
import { BookingUpsellInformationRepository } from 'src/modules/booking-upsell-information/repositories/booking-upsell-information.repository';
import { CompanyRepository } from 'src/modules/company/repositories/company.repository';
import { GuestRepository } from 'src/modules/guest/repositories/guest.repository';
import { HotelConfigurationRepository } from 'src/modules/hotel-configuration/repositories/hotel-configuration.repository';
import { HotelPaymentMethodSettingRepository } from 'src/modules/hotel-payment-method-setting/repositories/hotel-payment-method-setting.repository';
import { GlobalPaymentMethodRepository } from 'src/modules/hotel/repositories/global-payment-method.repository';
import { GlobalPaymentProviderRepository } from 'src/modules/hotel/repositories/global-payment-provider.repository';
import { HotelAmenityRepository } from 'src/modules/hotel/repositories/hotel-amenity.repository';
import { MappingPmsHotelRepository } from 'src/modules/mapping-pms-hotel/repositories/mapping-pms-hotel.repository';
import { RatePlanRepository } from 'src/modules/rate-plan/repositories/rate-plan.repository';
import { ReservationAmenityDateRepository } from 'src/modules/reservation-amenity-date/repositories/reservation-amenity-date.repository';
import { ReservationAmenityRepository } from 'src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { ReservationRelatedMrfcRepository } from 'src/modules/reservation-related-mrfc/repositories/reservation-related-mrfc.repository';
import { ReservationRoomRepository } from 'src/modules/reservation-room/repositories/reservation-room.repository';
import { ReservationTimeSliceRepository } from 'src/modules/reservation-time-slice/repositories/reservation-time-slice.repository';
import { ReservationRepository } from 'src/modules/reservation/repositories/reservation.repository';
import { RoomProductRepository } from 'src/modules/room-product/repositories/room-product.repository';
import { BookingGateway } from 'src/ws/gateways/booking.gateway';
import { v4 as uuidv4 } from 'uuid';
import {
  RequestBookingDto,
  RoomAvailabilityDto,
  WSPaymentCompleteDto
} from '../dtos/request-booking.dto';
import { BookingMetaTrackingRepository } from '../repositories/booking-meta-tracking.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { CMD } from 'src/core/constants/cmd.const';

@Injectable()
export class CreateBookingService extends BaseService {
  private readonly logger = new Logger(CreateBookingService.name);

  constructor(
    private guestRepository: GuestRepository,
    private companyRepository: CompanyRepository,
    private reservationRepository: ReservationRepository,
    private reservationRoomRepository: ReservationRoomRepository,
    private reservationTimeSliceRepository: ReservationTimeSliceRepository,
    private reservationAmenityRepository: ReservationAmenityRepository,
    private reservationAmenityDateRepository: ReservationAmenityDateRepository,
    private bookingTransactionRepository: BookingTransactionRepository,
    private paymentService: PaymentService,
    private hotelPaymentMethodSettingRepository: HotelPaymentMethodSettingRepository,
    private mappingPmsHotelRepository: MappingPmsHotelRepository,
    private hotelConfigurationRepository: HotelConfigurationRepository,
    private bookingGateway: BookingGateway,
    private bookingRepository: BookingRepository,
    private bookingMetaTrackingRepository: BookingMetaTrackingRepository,
    private globalPaymentProviderRepository: GlobalPaymentProviderRepository,
    private globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private pmsService: PmsService,
    private hotelAmenityRepository: HotelAmenityRepository,
    private availabilityService: AvailabilityService,
    private ratePlanRepository: RatePlanRepository,
    private bookingUpsellInformationRepository: BookingUpsellInformationRepository,
    private roomProductRepository: RoomProductRepository,
    private reservationRelatedMrfcRepository: ReservationRelatedMrfcRepository,
    private bookingCalculateService: BookingCalculateService,

    @Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy,
    configService: ConfigService
  ) {
    super(configService);
  }

  async processBooking(
    body: RequestBookingDto,
    hotel: Hotel,
    connector: Connector | null,
    roomAvailability: RoomAvailabilityDto[]
  ) {
    const guestData = body.bookingInformation.guestInformation;
    const guest = await this.guestRepository.createGuest(guestData, hotel.id);

    const bookingInput: Partial<Booking> = {
      id: uuidv4(),
      hotelId: hotel.id,
      mappingBookingCode: null,
      mappingChannelBookingCode: null,
      completedDate: null,
      holdExpiredDate: null,
      bookerId: null,
      specialRequest: body.bookingInformation.specialRequest ?? null,
      acceptTnc: true,
      isConfirmationEmailSent: false,
      deletedAt: null,
      createdBy: this.currentSystem,
      createdAt: new Date(),
      updatedBy: this.currentSystem,
      updatedAt: new Date(),
      reservations: []
    };
    const company = await this.companyRepository.createCompany(guestData, hotel.id);

    let booker;
    if (guestData.isBooker) {
      booker = guest;
      bookingInput.isBookForSomeoneElse = false;
    } else {
      booker = await this.guestRepository.createGuest(body.bookingInformation?.booker, hotel.id);
      bookingInput.isBookForSomeoneElse = true;
    }
    bookingInput.bookerId = booker?.id;
    const booking = await this.bookingRepository.createBooking(bookingInput);
    await this.addPricingToRequestBooking(body, hotel);

    // Save Meta Conversion API tracking data if available
    if (body.browserIp || body.userAgent || body.fbp || body.fbc) {
      await this.bookingMetaTrackingRepository.createMetaTracking({
        bookingId: booking.id,
        browserIp: body.browserIp ?? null,
        userAgent: body.userAgent ?? null,
        fbp: body.fbp ?? null,
        fbc: body.fbc ?? null
      });
    }

    await this.handleAfterCreateBooking({
      body,
      booking,
      hotel,
      connector,
      roomAvailability,
      company,
      booker,
      guest
    });

    return booking;
  }

  async addPricingToRequestBooking(body: RequestBookingDto, hotel: Hotel) {
    const bookingPricing = await this.bookingCalculateService.calculateBookingPricing({
      hotelId: hotel.id,
      isCityTaxIncluded: true,
      reservations: body.bookingInformation.reservationList.map((reservation) => ({
        adults: reservation.adult ?? 1,
        childrenAges: reservation.childrenAgeList ?? [],
        pets: reservation.pets ?? 0,
        arrival: reservation.arrival + 'T00:00:00.000Z',
        departure: reservation.departure + 'T00:00:00.000Z',
        roomProductId: reservation.roomProductId ?? '',
        ratePlanId: reservation.salesPlanId ?? '',
        amenityList: reservation.amenityList?.map((amenity) => ({
          count: amenity.count ?? 0,
          code: amenity.code ?? ''
        }))
      }))
    });
    body.bookingInformation.bookingPricing = {
      totalBaseAmount: bookingPricing.totalBaseAmount,
      totalGrossAmount: bookingPricing.totalGrossAmount,
      taxAmount: bookingPricing.taxAmount,
      cityTaxAmount: bookingPricing.cityTaxAmount,
      payOnConfirmationAmount: bookingPricing.payOnConfirmationAmount,
      payAtHotelAmount: bookingPricing.payAtHotelAmount,
      currencyCode: bookingPricing.currencyCode
    };
    body.bookingInformation.reservationList.forEach((reservation, index) => {
      const reservationPricing = bookingPricing.reservationPricingList[index];
      reservation.reservationPricing = {
        totalBaseAmount: reservationPricing.totalBaseAmount,
        totalGrossAmount: reservationPricing.totalGrossAmount,
        taxAmount: reservationPricing.taxAmount,
        cityTaxAmount: reservationPricing.cityTaxAmount,
        payOnConfirmationAmount: reservationPricing.payOnConfirmationAmount,
        payAtHotelAmount: reservationPricing.payAtHotelAmount,
        currencyCode: bookingPricing.currencyCode,
        taxDetailsMap: reservationPricing.taxDetailsMap,
        taxAccommodationDetailsMap: reservationPricing.taxAccommodationDetailsMap,
        cityTaxDetails: reservationPricing.calculatedCityTax?.taxBreakdown,
        accommodationTaxAmount: reservationPricing.totalAccommodationAmount,
        accommodationTaxAmountBySetting: reservationPricing.totalAccommodationAmountBySetting,
        dailyRoomRateList: reservationPricing.dailyRoomRateList
      };
      reservation.paymentTermCode = reservationPricing.hotelPaymentTerm?.code;
      reservation.amenityPricingList = reservationPricing.amenityPricingList.map(
        (amenityPricing) => ({
          hotelAmenityId: amenityPricing.hotelAmenity.id,
          hotelAmenityCode: amenityPricing.hotelAmenity.code,
          hotelAmenityName: amenityPricing.hotelAmenity.name,
          totalBaseAmount: amenityPricing.totalBaseAmount,
          totalGrossAmount: amenityPricing.totalGrossAmount,
          taxAmount: amenityPricing.taxAmount,
          taxDetailsMap: amenityPricing.taxDetailsMap,
          pricingUnit: amenityPricing.hotelAmenity.pricingUnit as PricingUnitEnum,
          extraServiceType:
            amenityPricing.extraServiceType ||
            (amenityPricing.isSalesPlanIncluded
              ? ExtraServiceTypeEnum.INCLUDED
              : ExtraServiceTypeEnum.MANDATORY),
          count: amenityPricing.count,
          ageCategoryPricingList: amenityPricing.ageCategoryPricingList,
          includedDates: amenityPricing.includedDates,
          linkedAmenityInfoList: amenityPricing?.linkedAmenityInfoList || [],
          sellingType: amenityPricing?.sellingType || SellingTypeEnum.SINGLE
        })
      );
    });
  }

  async handleAfterCreateBooking(input: {
    body: RequestBookingDto;
    booking: Booking;
    hotel: Hotel;
    connector: Connector | null;
    roomAvailability: RoomAvailabilityDto[];
    company: Company | null;
    booker: Guest;
    guest: Guest;
  }) {
    const { body, booking, hotel, connector, roomAvailability, company, booker, guest } = input;
    const currencyCode = body.bookingInformation.bookingPricing?.currencyCode || '';

    // get global payment provider and global payment method
    const [globalPaymentProvider, globalPaymentMethod] = await Promise.all([
      this.globalPaymentProviderRepository.getGlobalPaymentProvider({
        code: body.paymentProviderCode ?? ''
      }),
      this.globalPaymentMethodRepository.getGlobalPaymentMethod({
        code: body.bookingInformation.hotelPaymentModeCode
      })
    ]);

    // get property payment method setting
    const propertyPaymentMethodSetting =
      await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
        hotelId: hotel.id,
        globalPaymentProviderId: globalPaymentProvider?.id,
        globalPaymentMethodId: globalPaymentMethod?.id
      });

    // get mapping hotel and time slice
    const [mappingHotel, timeSlice] = await Promise.all([
      this.mappingPmsHotelRepository.getMappingPmsHotel({
        hotelId: hotel.id
      }),
      this.getTimeSlice(hotel)
    ]);

    // create reservations
    const reservations = await this.createReservation({
      body,
      hotel,
      booking,
      company,
      guest,
      timeSlice,
      roomAvailability
    });
    booking.reservations = reservations;
    // roomAvailability?.flatMap((room) => room.roomAvailability || []);
    // await this.roomAvailabilityService.assignRoomAvailability(roomAvailabilityList);

    // create reservation time slices, reservation rooms, room availability, reservation amenities
    const [reservationTimeSlices, reservationAmenityDates] = await Promise.all([
      await this.createReservationTimeSlice(
        hotel,
        reservations,
        roomAvailability,
        timeSlice,
        hotel.timeZone ?? 'UTC',
        body
      ),
      await this.handleReservationAmenity(reservations, body, roomAvailability),
      await this.createReservationRoom(reservations, roomAvailability)
    ]);
    const requestRooms = roomAvailability?.flatMap((room) => {
      return (room.roomAvailability || []).map((availability) => {
        return {
          arrival: availability.date,
          departure: availability.date,
          roomProductId: room.roomProductId ?? '',
          roomUnitIds: availability.roomUnitId ? [availability.roomUnitId] : []
        };
      });
    });
    await this.availabilityService.processUnitAvailabilityUpdate({
      hotelId: hotel.id,
      requestRooms: requestRooms
    });
    // await this.availabilityService.processUnitAvailabilityUpdate({
    //   hotelId: hotel.id,
    //   requestRooms: body.bookingInformation.reservationList?.map((reservation) => {
    //     return {
    //       arrival: reservation.arrival,
    //       departure: reservation.departure,
    //       roomProductId: reservation.roomProductId ?? '',
    //       roomUnitIds: roomAvailability?.flatMap((room) => room.roomIds ?? [])
    //       // ?.filter((roomId) => !!roomId)
    //     };
    //   })
    // });
    this.logger.log(`🚀 Done flow create booking`);

    // create upsell information
    this.handleUpsellInformation(booking, body);
    // create reservation related mrfc
    this.handleRelatedMrfc(body, booking);

    this.requestBookingPayment(
      booking,
      propertyPaymentMethodSetting,
      hotel,
      connector,
      booker,
      guest,
      currencyCode,
      mappingHotel,
      body,
      reservationTimeSlices,
      roomAvailability
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

    // Return default check-in/check-out times if configuration is missing
    return timeSlice || { CI: '14:00', CO: '12:00' };
  }

  async requestBookingPayment(
    booking: Booking,
    propertyPaymentMethodSetting: HotelPaymentMethodSetting | null,
    hotel: Hotel,
    connector: Connector | null,
    booker: Guest,
    guest: Guest,
    currencyCode: string,
    mappingHotel: MappingPmsHotel,
    bookingInput: RequestBookingDto,
    reservationTimeSlices: ReservationTimeSlice[],
    roomProductList: RoomAvailabilityDto[],
    isProposalBooking?: boolean
  ) {
    const configurationInput = {
      hotelId: hotel.id,
      configType: HotelConfigurationTypeEnum.WHITELABEL_SETTING,
      deletedAt: null
    };
    const config = await this.hotelConfigurationRepository.getHotelConfiguration({
      hotelId: hotel.id,
      configType: HotelConfigurationTypeEnum.WHITELABEL_SETTING,
      deletedAt: null
    });
    const whitelabelUrl = config ? (config?.configValue?.metadata as { url: string })?.url : '';
    const bookingTransactionInput: Partial<BookingTransaction> = {
      bookingId: booking.id,
      status: BookingTransactionStatusEnum.PAYMENT_PENDING,
      paymentMode: bookingInput.bookingInformation.hotelPaymentModeCode,
      transactionNumber: bookingInput.transactionId // PCI Proxy transaction id
    };
    const bookingTransaction = await this.handleBookingTransaction(bookingTransactionInput);
    const requestPaymentResponse = await this.paymentService.requestPayment({
      booking,
      hotel,
      booker,
      paymentModeCode: bookingInput.bookingInformation.hotelPaymentModeCode,
      paymentProviderCode: bookingInput.paymentProviderCode ?? '',
      propertyPaymentMethodSetting,
      currencyCode,
      mappingHotel,
      bookingInput,
      whitelabelUrl,
      connector,
      bookingTransaction,
      roomProductList,
      isProposalBooking
    });

    const updateBookingTransactionInput = {
      id: bookingTransaction.id,
      ...requestPaymentResponse.bookingTransactionInput
    };

    await this.handleAfterPayment(
      booking,
      updateBookingTransactionInput,
      bookingTransaction,
      bookingInput.bookingInformation.hotelPaymentModeCode,
      bookingInput.translateTo ?? 'EN',
      connector,
      mappingHotel,
      bookingInput,
      booker,
      guest,
      hotel,
      reservationTimeSlices,
      roomProductList,
      isProposalBooking
    );
    // this.handleSocketPayment(
    //   booking,
    //   updateBookingTransactionInput,
    //   requestPaymentResponse,
    //   bookingInput,
    //   connector,
    //   mappingHotel,
    //   booker,
    //   guest,
    //   bookingTransaction,
    //   hotel,
    //   reservationTimeSlices,
    //   roomProductList,
    //   isProposalBooking
    // );

    return bookingTransaction;
  }

  async handleSocketPayment(body: WSPaymentCompleteDto) {
    this.logger.debug(`🚀 Handle socket payment: ${JSON.stringify(body)}`);
    const { bookingId, paymentInfo, isProposalBooking } = body;
    const paymentStatusFromClient = this.bookingGateway.paymentStatus.get(bookingId);
    this.logger.debug(`🚀 Payment status from client: ${JSON.stringify(paymentStatusFromClient)}`);
    const bookingTransaction =
      await this.bookingTransactionRepository.getBookingTransactionByBookingId(bookingId);
    this.bookingGateway.notifyBookingPaymentStatus(
      bookingId,
      {
        status: bookingTransaction?.status,
        data: paymentInfo?.data
      },
      !paymentStatusFromClient
    );
    if (!paymentStatusFromClient) return false;

    paymentStatusFromClient
      .pipe(
        filter((data) => !!data),
        take(1)
      )
      .subscribe(async (data) => {
        if (data?.paymentStatus === BookingTransactionStatusEnum.PAYMENT_PENDING) {
          this.logger.debug(`🚀 Payment pending for booking ${bookingId}`);
          return;
        }
        let updateBookingTransactionInput: Partial<BookingTransaction> = {};
        if (bookingTransaction?.id) {
          updateBookingTransactionInput = {
            id: bookingTransaction?.id,
            status:
              (data?.paymentStatus as BookingTransactionStatusEnum) ||
              BookingTransactionStatusEnum.PAYMENT_FAILED
          };
          this.logger.debug(
            `🚀 updateBookingTransactionInput from client: ${JSON.stringify(updateBookingTransactionInput)}`
          );
          if (updateBookingTransactionInput.id) {
            await this.bookingTransactionRepository.updateBookingTransaction(
              updateBookingTransactionInput as any
            );
          }
        }

        lastValueFrom(
          this.clientProxy.send(
            { cmd: CMD.BOOKING.HANDLE_AFTER_PAYMENT },
            { bookingId, isProposalBooking }
          )
        );
        this.bookingGateway.paymentStatus.delete(bookingId);
        this.bookingGateway.notifyBookingPaymentStatus(
          bookingId,
          {
            status: updateBookingTransactionInput?.status,
            data: paymentInfo?.data
          },
          true
        );
      });

    return true;
  }

  async handleAfterPayment(
    booking: Booking,
    bookingTransactionUpdate: Partial<BookingTransaction> & Pick<BookingTransaction, 'id'>,
    bookingTransaction: BookingTransaction,
    paymentModeCode: string,
    bookingLanguage: string,
    connector: Connector | null,
    mappingHotel: MappingPmsHotel,
    bookingInput: RequestBookingDto,
    booker: Guest,
    guest: Guest,
    hotel: Hotel,
    reservationTimeSlices: ReservationTimeSlice[],
    roomProductList: RoomAvailabilityDto[],
    isProposalBooking?: boolean
  ) {
    bookingTransactionUpdate.paymentDate =
      bookingTransactionUpdate.status === BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
        ? new Date()
        : null;
    await this.bookingTransactionRepository.updateBookingTransaction(bookingTransactionUpdate);
    this.logger.debug(`🚀 Booking transaction status: ${bookingTransactionUpdate?.status}`);
    this.logger.debug(`🚀 Booking isProposalBooking: ${isProposalBooking}`);
    if (bookingTransactionUpdate?.status === BookingTransactionStatusEnum.PAYMENT_PENDING) {
      return;
    }
    if (bookingTransactionUpdate?.status === BookingTransactionStatusEnum.PAYMENT_SUCCEEDED) {
      await this.bookingRepository.updateBooking({
        id: booking.id,
        completedDate: new Date()
      });
      await this.reservationRepository.updateReservations(
        booking.reservations.map((reservation) => ({
          id: reservation.id,
          balance: (reservation.totalGrossAmount ?? 0) - (reservation.payOnConfirmationAmount ?? 0)
        }))
      );
    }
    // else {
    //   await this.reservationRepository.updateReservations(
    //     booking.reservations.map((reservation) => ({
    //       id: reservation.id,
    //       balance: reservation.totalGrossAmount ?? 0
    //     }))
    //   );
    // }
    if (!PAYABLE_METHOD_LIST.includes(paymentModeCode as PaymentModeCodeEnum)) {
      this.handleAfterCompleteBooking({
        booking,
        bookingInput,
        booker,
        guest,
        connector,
        bookingLanguage,
        roomProductList,
        hotel,
        reservationTimeSlices,
        isProposalBooking
      });
      return;
    }

    const reservations = booking.reservations;
    const ids = reservations.map((reservation) => reservation.id);
    const currentStatus = reservations[0].status;
    const statusObj = {
      [BookingTransactionStatusEnum.PAYMENT_SUCCEEDED]: ReservationStatusEnum.CONFIRMED,
      [BookingTransactionStatusEnum.PAYMENT_FAILED]: ReservationStatusEnum.PAYMENT_FAILED,
      [BookingTransactionStatusEnum.PAYMENT_PENDING]: ReservationStatusEnum.RESERVED,
      ['default']: ReservationStatusEnum.RESERVED
    };
    let status = statusObj[bookingTransactionUpdate?.status || 'default'];
    if (
      currentStatus === ReservationStatusEnum.PROPOSED &&
      bookingTransactionUpdate?.status !== BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
    ) {
      status = ReservationStatusEnum.RELEASED;
    }
    await this.reservationRepository.updateReservationStatus(ids, status);
    // if status is not confirmed or proposed, release availability
    if (status !== ReservationStatusEnum.CONFIRMED) {
      // await this.roomAvailabilityService.unassignRoomAvailability(roomAvailabilityList);
      if (isProposalBooking) {
        await lastValueFrom(
          this.clientProxy.send(
            { cmd: 'release_booking' },
            {
              bookingId: booking.id
            }
          )
        ).then((res) => res);
      } else {
        await this.availabilityService.processRoomProductReleaseAvailability({
          hotelId: hotel.id,
          requestRooms: bookingInput.bookingInformation.reservationList.map((reservation) => {
            const roomIds = roomProductList.flatMap((room) => room.roomIds ?? []);
            this.logger.debug(
              `🚀 Release availability for room product ${reservation.roomProductId} from ${reservation.arrival} to ${reservation.departure}, room unit ids: ${roomIds.join(
                ', '
              )}`
            );
            const requestRoom = {
              roomProductId: reservation.roomProductId ?? '',
              arrival: reservation.arrival,
              departure: reservation.departure,
              roomUnitIds: roomIds
            };
            return requestRoom;
          })
        });
      }
    }

    if (bookingTransactionUpdate?.status !== BookingTransactionStatusEnum.PAYMENT_SUCCEEDED) {
      this.logger.warn(`Booking ${booking.id} payment failed, skipping complete booking`);
      return;
    }
    this.handleAfterCompleteBooking({
      booking,
      bookingInput,
      booker,
      guest,
      connector,
      bookingLanguage,
      roomProductList,
      hotel,
      reservationTimeSlices,
      isProposalBooking
    });
  }

  async handleBookingTransaction(input: Partial<BookingTransaction> | null) {
    try {
      if (input?.bookingId) {
        const bt = await this.bookingTransactionRepository.getBookingTransactionByBookingId(
          input?.bookingId
        );
        if (bt) {
          return bt;
        }
      }

      const data: Partial<BookingTransaction> = {
        id: uuidv4(),
        ...input,
        createdBy: this.currentSystem,
        createdAt: new Date(),
        updatedBy: this.currentSystem,
        updatedAt: new Date(),
        deletedAt: null
      };
      const bookingTransaction =
        await this.bookingTransactionRepository.createBookingTransaction(data);
      return bookingTransaction;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async handleAfterCompleteBooking(input: {
    booking: Booking;
    bookingInput: RequestBookingDto;
    booker: Guest;
    guest: Guest;
    connector: Connector | null;
    bookingLanguage: string;
    roomProductList: RoomAvailabilityDto[];
    hotel: Hotel;
    reservationTimeSlices: ReservationTimeSlice[];
    isProposalBooking?: boolean;
  }) {
    const {
      booking,
      bookingInput,
      booker,
      connector,
      bookingLanguage,
      roomProductList,
      hotel,
      reservationTimeSlices,
      guest,
      isProposalBooking
    } = input;
    // const country = await this.countryRepository.getCountry({
    //   id: booker.countryId || ''
    // });
    // await this.pushReservationPmsService.pushReservationToPms({
    //   booking,
    //   connector,
    //   mappingHotel,
    //   bookingInput,
    //   booker,
    //   country: country || null,
    //   bookingTransaction: { ...bookingTransaction, ...bookingTransactionUpdate },
    //   hotel,
    //   reservationTimeSliceList: reservationTimeSlices
    // });
    const updatedBooking = await this.bookingRepository.getBooking(booking.id);
    if (!updatedBooking) {
      this.logger.error(`Booking ${booking.id} not found`);
      return;
    }

    // const mappingHotel = await this.mappingHotelRepository.getMappingHotel({
    //   hotelId: hotel.id,
    //   connectorId: connector?.id || ''
    // });

    // await this.pmsService.pushReservationToPms({
    //   bookingInput,
    //   booking: updatedBooking,
    //   connector,
    //   booker,
    //   guest,
    //   roomProductList,
    //   hotel,
    //   reservationTimeSlices,
    //   isProposalBooking
    // });

    await lastValueFrom(
      this.clientProxy.send(
        { cmd: 'push_reservations_to_pms' },
        {
          bookingId: booking.id,
          hotelId: hotel.id,
          isProposalBooking: isProposalBooking
        }
      )
    ).then((res) => res);

    await lastValueFrom(
      this.clientProxy.send(
        { cmd: 'send_confirm_booking_email' },
        {
          bookingId: booking.id,
          hotelTemplateEmail: HotelTemplateEmailCodesEnum.CPP_BOOKING_CONFIRMATION,
          translateTo: bookingLanguage
        }
      )
    ).then((res) => res);
  }

  async createReservation(input: {
    body: RequestBookingDto;
    hotel: Hotel;
    booking: Booking;
    company: Company | null;
    guest: Guest | null;
    timeSlice: { CI: string; CO: string };
    roomAvailability: RoomAvailabilityDto[];
  }) {
    try {
      const { body, hotel, booking, company, guest, timeSlice, roomAvailability } = input;

      const additionalGuestList = await this.createAdditionalGuestList(body, hotel.id);
      const cancelPolicyCodes = await this.getCancelPolicyCodes(body);
      return await this.reservationRepository.createReservations({
        bookingInput: body,
        hotel,
        booking,
        company,
        guest,
        timeSlice,
        additionalGuestList,
        cancelPolicyCodes,
        roomAvailability
      });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async createAdditionalGuestList(
    bookingInput: RequestBookingDto,
    hotelId: string
  ): Promise<Partial<Guest>[][]> {
    const reservationList = bookingInput.bookingInformation.reservationList;
    const additionalGuestList = bookingInput.bookingInformation.additionalGuestList || [];

    if (!additionalGuestList?.length) return [];

    const newAdditionalGuestList: Partial<Guest>[][] = [];
    const mappedGuestsForReservation = reservationList.map((_reservation, index) => {
      const additionalGuests = additionalGuestList.filter(
        (additionalGuest) => additionalGuest.reservationIdx === index
      );
      const mappedGuests: Partial<Guest>[] = [];
      const newGuests: Partial<Guest>[] = additionalGuests.map((additionalGuest) => {
        let newGuest: any = {
          id: uuidv4(),
          firstName: additionalGuest.firstName ?? '',
          lastName: additionalGuest.lastName ?? '',
          isAdult: additionalGuest.isAdult ?? true
        };

        mappedGuests.push(newGuest);

        newGuest = {
          ...newGuest,
          countryId: null,
          isBooker: false,
          emailAddress: null,
          address: null,
          city: null,
          state: null,
          postalCode: null,
          phoneNumber: null,
          countryNumber: null,
          companyPostalCode: null,
          companyCountry: null,
          companyCity: null,
          companyAddress: null,
          companyEmail: null,
          companyName: null,
          companyTaxId: null,
          hotelId: hotelId,
          softDelete: false,
          createdBy: PERFORMED_BY,
          createdDate: new Date(),
          updatedBy: PERFORMED_BY,
          updatedDate: new Date(),
          isMainGuest: false,
          isReturningGuest: false
        };

        return newGuest;
      });
      newAdditionalGuestList.push(mappedGuests);
      return newGuests;
    });
    try {
      await this.guestRepository.createGuests(mappedGuestsForReservation.flat());
      return newAdditionalGuestList;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async getCancelPolicyCodes(body: RequestBookingDto): Promise<Map<string, string | null>> {
    const reservations = body.bookingInformation.reservationList;
    const cancelPolicyCodes = new Map<string, string | null>();

    for (const reservation of reservations) {
      if (!reservation.salesPlanId) continue;

      const ratePlan = await this.ratePlanRepository.getRatePlan({
        id: reservation.salesPlanId ?? ''
      });
      if (!ratePlan) continue;

      cancelPolicyCodes.set(reservation.salesPlanId, ratePlan?.hotelCxlPolicyCode ?? null);
    }
    return cancelPolicyCodes;
  }

  async createReservationRoom(
    reservations: Reservation[],
    roomAvailability: RoomAvailabilityDto[]
  ) {
    try {
      const reservationRooms = await this.reservationRoomRepository.createReservationRooms({
        reservations,
        roomAvailability
      });
      return reservationRooms;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async createReservationTimeSlice(
    hotel: Hotel,
    reservations: Reservation[],
    roomAvailability: RoomAvailabilityDto[],
    timeSlice: { CI: string; CO: string },
    timeZone: string,
    body: RequestBookingDto
  ) {
    try {
      const reservationTimeSlices =
        await this.reservationTimeSliceRepository.createReservationTimeSlices({
          hotelId: hotel.id,
          reservations,
          roomAvailability,
          timeSlice,
          timeZone,
          bookingInput: body
        });
      return reservationTimeSlices;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async handleReservationAmenity(
    reservations: Reservation[],
    body: RequestBookingDto,
    roomAvailability: RoomAvailabilityDto[]
  ) {
    const originReservation = body.bookingInformation.reservationList;
    try {
      let currnetIndex = 0;
      const reservationAmenities: ReservationAmenity[] = originReservation.flatMap(
        (reservation, index) => {
          currnetIndex += index;
          const roomProduct = roomAvailability[index];
          const isErfcDeductAll =
            roomProduct?.roomProductCode?.startsWith('ERFC') && !roomProduct?.isErfcDeduct;
          const roomAvailabilityDates: any[] = (roomProduct?.roomAvailability || []).map(
            (room) => room.date
          );
          const firstDate = roomAvailabilityDates[0];
          const countDuplicateDate = roomAvailabilityDates?.filter(
            (date) => date === firstDate
          )?.length;

          const rv = reservations[index];
          currnetIndex += countDuplicateDate - 1;
          const amentites = reservation.amenityPricingList.flatMap((amenityPricing) => {
            // check if selling type is COMBO - distribute to linked amenity info list
            if (amenityPricing.sellingType === SellingTypeEnum.COMBO) {
              if (!amenityPricing.linkedAmenityInfoList?.length) return [];

              const comboAmenities: any[] = [];
              for (const linkedAmenityInfo of amenityPricing.linkedAmenityInfoList) {
                const hotelAmenity = linkedAmenityInfo as HotelAmenity;
                const linkedAgeCategoryPricingList = hotelAmenity.ageCategoryPricingList || [];

                // Handle age category pricing for each linked amenity
                if (linkedAgeCategoryPricingList.length <= 1) {
                  const amenity: any = {
                    id: uuidv4(),
                    reservationId: rv.id,
                    hotelAmenityId: hotelAmenity.id,
                    totalBaseAmount: new Decimal(hotelAmenity.totalBaseAmount || '0').toNumber(),
                    totalGrossAmount: new Decimal(hotelAmenity.totalGrossAmount || '0').toNumber(),
                    taxAmount: new Decimal(hotelAmenity.taxAmount || '0').toNumber(),
                    serviceChargeAmount: new Decimal(
                      hotelAmenity.serviceChargeAmount || '0'
                    ).toNumber(),
                    ageCategoryCode: linkedAgeCategoryPricingList?.[0]?.ageCategoryCode,
                    count: hotelAmenity.count,
                    includedDates: hotelAmenity.includedDates,
                    pricingUnit: hotelAmenity.pricingUnit,
                    reservationAmenityDates: [],
                    extraServiceType: amenityPricing.extraServiceType,
                    masterHotelAmenityId: amenityPricing.hotelAmenityId, // this is id of combo amenity
                    deletedAt: null,
                    createdBy: this.currentSystem,
                    createdAt: new Date(),
                    updatedBy: this.currentSystem,
                    updatedAt: new Date()
                  };
                  comboAmenities.push(amenity);
                } else {
                  const calcAgeCategoryPricing = (
                    parent: { gross: number; base: number; tax: number },
                    child: { gross: number }
                  ) => {
                    const baseRatio = parent.base / parent.gross || 0;
                    const taxRatio = parent.tax / parent.gross || 0;
                    const childBase = new Decimal(child.gross * baseRatio).toNumber();
                    const childTax = new Decimal(child.gross * taxRatio).toNumber();
                    return { childBase, childTax };
                  };

                  for (const ageCategoryPricing of linkedAgeCategoryPricingList) {
                    if (!ageCategoryPricing.count) continue;
                    // Handle both totalSellingRate and totalPrice (totalPrice might be string or Decimal)
                    const totalSellingRate =
                      ageCategoryPricing.totalSellingRate ??
                      (typeof ageCategoryPricing.totalPrice === 'string'
                        ? new Decimal(ageCategoryPricing.totalPrice || '0').toNumber()
                        : new Decimal(ageCategoryPricing.totalPrice || '0').toNumber());
                    const { childBase, childTax } = calcAgeCategoryPricing(
                      {
                        gross: new Decimal(hotelAmenity.totalGrossAmount || '0').toNumber(),
                        base: new Decimal(hotelAmenity.totalBaseAmount || '0').toNumber(),
                        tax: new Decimal(hotelAmenity.taxAmount || '0').toNumber()
                      },
                      {
                        gross: totalSellingRate
                      }
                    );
                    const amenity: any = {
                      id: uuidv4(),
                      reservationId: rv.id,
                      hotelAmenityId: hotelAmenity.id,
                      totalBaseAmount: childBase,
                      totalGrossAmount: totalSellingRate,
                      taxAmount: childTax,
                      serviceChargeAmount: new Decimal(
                        hotelAmenity.serviceChargeAmount || '0'
                      ).toNumber(),
                      ageCategoryCode: ageCategoryPricing.ageCategoryCode,
                      count: ageCategoryPricing.count,
                      pricingUnit: hotelAmenity.pricingUnit,
                      includedDates: hotelAmenity.includedDates,
                      reservationAmenityDates: [],
                      extraServiceType: amenityPricing.extraServiceType,
                      masterHotelAmenityId: amenityPricing.hotelAmenityId, // this is id of combo amenity
                      deletedAt: null,
                      createdBy: this.currentSystem,
                      createdAt: new Date(),
                      updatedBy: this.currentSystem,
                      updatedAt: new Date()
                    };
                    comboAmenities.push(amenity);
                  }
                }
              }
              return comboAmenities;
            }

            // Handle non-COMBO amenities (SINGLE or PACKAGE)
            const ageCategoryPricingList = amenityPricing.ageCategoryPricingList || [];
            if (ageCategoryPricingList.length <= 1) {
              const amenity: any = {
                id: uuidv4(),
                reservationId: rv.id,
                hotelAmenityId: amenityPricing.hotelAmenityId,
                totalBaseAmount: amenityPricing.totalBaseAmount,
                totalGrossAmount: amenityPricing.totalGrossAmount,
                taxAmount: amenityPricing.taxAmount,
                serviceChargeAmount: amenityPricing.serviceChargeAmount,
                ageCategoryCode: amenityPricing.ageCategoryPricingList?.[0]?.ageCategoryCode,
                count: amenityPricing.count,
                includedDates: amenityPricing.includedDates,
                pricingUnit: amenityPricing.pricingUnit,
                reservationAmenityDates: [],
                extraServiceType: amenityPricing.extraServiceType,
                masterHotelAmenityId: null,
                deletedAt: null,
                createdBy: this.currentSystem,
                createdAt: new Date(),
                updatedBy: this.currentSystem,
                updatedAt: new Date()
              };
              return [amenity];
            }
            const calcAgeCategoryPricing = (
              parent: { gross: number; base: number; tax: number },
              child: { gross: number }
            ) => {
              const baseRatio = parent.base / parent.gross || 0;
              const taxRatio = parent.tax / parent.gross || 0;
              const childBase = +(child.gross * baseRatio).toFixed(2);
              const childTax = +(child.gross * taxRatio).toFixed(2);
              return { childBase, childTax };
            };

            const newAmenities: any[] = [];
            for (const ageCategoryPricing of ageCategoryPricingList) {
              if (!ageCategoryPricing.count) continue;
              const { childBase, childTax } = calcAgeCategoryPricing(
                {
                  gross: amenityPricing.totalGrossAmount ?? 0,
                  base: amenityPricing.totalBaseAmount ?? 0,
                  tax: amenityPricing.taxAmount ?? 0
                },
                {
                  gross: ageCategoryPricing.totalSellingRate ?? 0
                }
              );
              const amenity: any = {
                id: uuidv4(),
                reservationId: rv.id,
                hotelAmenityId: amenityPricing.hotelAmenityId,
                totalBaseAmount: childBase,
                totalGrossAmount: ageCategoryPricing.totalSellingRate,
                taxAmount: childTax,
                serviceChargeAmount: null,
                ageCategoryCode: ageCategoryPricing.ageCategoryCode,
                count: ageCategoryPricing.count,
                pricingUnit: amenityPricing.pricingUnit,
                includedDates: amenityPricing.includedDates,
                reservationAmenityDates: [],
                extraServiceType: amenityPricing.extraServiceType,
                masterHotelAmenityId: null,
                deletedAt: null,
                createdBy: this.currentSystem,
                createdAt: new Date(),
                updatedBy: this.currentSystem,
                updatedAt: new Date()
              };
              newAmenities.push(amenity);
            }
            return newAmenities;
          });
          return amentites;
        }
      );

      const rAmenitiesResult = await this.reservationAmenityRepository.createReservationAmenities({
        reservationAmenities: structuredClone(reservationAmenities)
      });

      const hotelAmenities = await this.hotelAmenityRepository.getHotelAmenities({
        ids: rAmenitiesResult.map((rAmenity) => rAmenity.hotelAmenityId ?? '').filter(Boolean)
      });
      const addAmenityDate = (
        reservationAmenity: ReservationAmenity,
        date: string,
        count: number,
        pricePerNight: {
          totalBaseAmount: number;
          totalGrossAmount: number;
          taxAmount: number;
          serviceChargeAmount: number;
        }
      ): ReservationAmenityDate => {
        return {
          id: uuidv4(),
          reservationAmenityId: reservationAmenity.id,
          date,
          dateOfAmenity: null,
          count,
          totalBaseAmount: pricePerNight.totalBaseAmount,
          totalGrossAmount: pricePerNight.totalGrossAmount,
          taxAmount: pricePerNight.taxAmount,
          serviceChargeAmount: pricePerNight.serviceChargeAmount,
          createdBy: this.currentSystem,
          createdAt: new Date(),
          updatedBy: this.currentSystem,
          updatedAt: new Date(),
          deletedAt: null,
          reservationAmenity
        };
      };
      const mapReservations = new Map<string, string[]>();
      reservations.forEach((reservation) => {
        mapReservations.set(
          reservation.id,
          getRangeDates(reservation.arrival, reservation.departure)
        );
      });
      const reservationAmenityDates = reservationAmenities?.flatMap((reservationAmenity) => {
        const pricingUnit = hotelAmenities.find(
          (hotelAmenity) => hotelAmenity.id === reservationAmenity.hotelAmenityId
        )?.pricingUnit;
        const rangeDates = mapReservations.get(reservationAmenity.reservationId ?? '') ?? [];
        const amenityCount = reservationAmenity['count'] || 1;
        const mapped: ReservationAmenityDate[] = [];
        // const countPerNight = Math.floor(amenityCount / rangeDates.length);
        const pricePerItem = {
          totalBaseAmount:
            +((reservationAmenity.totalBaseAmount ?? 0) / amenityCount).toFixed(2) || 0,
          totalGrossAmount:
            +((reservationAmenity.totalGrossAmount ?? 0) / amenityCount).toFixed(2) || 0,
          taxAmount: +((reservationAmenity.taxAmount ?? 0) / amenityCount).toFixed(2) || 0,
          serviceChargeAmount:
            +((reservationAmenity.serviceChargeAmount ?? 0) / amenityCount).toFixed(2) || 0
        };

        switch (pricingUnit) {
          case PricingUnitEnum.NIGHT:
          case PricingUnitEnum.PERSON: {
            const includedDates: string[] = reservationAmenity['includedDates'] || [];
            let countPerNight = 0;

            if (includedDates && includedDates.length > 0) {
              countPerNight = Math.floor(amenityCount / includedDates.length);
            } else if (rangeDates && rangeDates.length > 0) {
              countPerNight = Math.floor(amenityCount / rangeDates.length);
            }

            const pricePerNight = {
              totalBaseAmount: pricePerItem.totalBaseAmount * countPerNight,
              totalGrossAmount: pricePerItem.totalGrossAmount * countPerNight,
              taxAmount: pricePerItem.taxAmount * countPerNight,
              serviceChargeAmount: pricePerItem.serviceChargeAmount * countPerNight
            };

            let dates = rangeDates;
            if (
              reservationAmenity['includedDates'] &&
              reservationAmenity['includedDates'].length > 0
            ) {
              dates = rangeDates.filter((date) =>
                reservationAmenity['includedDates']?.includes(date)
              );
            }

            dates.forEach((date) => {
              mapped.push(addAmenityDate(reservationAmenity, date, countPerNight, pricePerNight));
            });
            break;
          }
          case PricingUnitEnum.PER_PERSON_PER_ROOM:
          case PricingUnitEnum.ROOM:
          case PricingUnitEnum.ITEM: {
            const pricePerNight = {
              totalBaseAmount: reservationAmenity.totalBaseAmount ?? 0,
              totalGrossAmount: reservationAmenity.totalGrossAmount ?? 0,
              taxAmount: reservationAmenity.taxAmount ?? 0,
              serviceChargeAmount: reservationAmenity.serviceChargeAmount ?? 0
            };
            mapped.push(
              addAmenityDate(reservationAmenity, rangeDates[0], amenityCount, pricePerNight)
            );
            break;
          }
        }
        return mapped;
      });
      const rAmenityDates =
        await this.reservationAmenityDateRepository.createReservationAmenityDates(
          reservationAmenityDates
        );
      return rAmenityDates;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async handleUpsellInformation(booking: Booking, bookingInput: RequestBookingDto) {
    const [lowestPrice, bookPrice] = await Promise.all([
      this.buildLowestPrice(bookingInput, booking),
      this.buildBookPrice(bookingInput, booking)
    ]);
    const upsellInformationInput: BookingUpsellInformation = {
      id: uuidv4(),
      bookingId: booking.id,
      hotelId: booking.hotelId,
      lowestPriceOptionList: JSON.stringify(bookingInput.lowestPriceOptionList || []),
      ...lowestPrice,
      ...bookPrice,
      deletedAt: null,
      createdBy: this.currentSystem,
      createdAt: new Date(),
      updatedBy: this.currentSystem,
      updatedAt: new Date()
    };
    try {
      const upsellInformation =
        await this.bookingUpsellInformationRepository.createBookingUpsellInformation(
          upsellInformationInput
        );
      this.logger.log(`🚀 Created upsell information with id: ${upsellInformation?.id}`);
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async buildLowestPrice(bookingInput: RequestBookingDto, booking: Booking) {
    const lowestPriceList = bookingInput.lowestPriceOptionList || [];
    let outputLowestPrice: any = {
      lowestPriceTotalBaseAmount: null,
      lowestPriceTotalTaxAmount: null,
      lowestPriceTotalGrossAmount: null,
      lowestPriceAccommodationBaseAmount: null,
      lowestPriceAccommodationTaxAmount: null,
      lowestPriceAccommodationGrossAmount: null,
      lowestPriceIncludedServiceBaseAmount: null,
      lowestPriceIncludedServiceTaxAmount: null,
      lowestPriceIncludedServiceGrossAmount: null,
      lowestPriceServiceBaseAmount: null,
      lowestPriceServiceTaxAmount: null,
      lowestPriceServiceGrossAmount: null
    };
    if (!lowestPriceList.length) return outputLowestPrice;

    const lowestPrice = lowestPriceList[0];
    const [ratePlan, rfc] = await Promise.all([
      this.ratePlanRepository.getRatePlan({
        code: lowestPrice.salesPlanCode ?? '',
        hotelId: booking.hotelId ?? ''
      }),
      this.roomProductRepository.getRoomProduct({
        code: lowestPrice.roomProductCode ?? '',
        hotelId: booking.hotelId ?? ''
      })
    ]);
    if (!ratePlan || !rfc) return outputLowestPrice;

    const reservationsInput = bookingInput.bookingInformation.reservationList;
    const input: CalculateBookingPricingInputDto = {
      hotelId: booking.hotelId ?? '',
      translateTo: (bookingInput.translateTo || LanguageCodeEnum.EN) as LanguageCodeEnum,
      reservations: reservationsInput.map((reservation) => {
        const input: CalculateReservationPricingInputDto = {
          adults: reservation.adult ?? 0,
          amenityList: reservation.amenityList?.map((a) => ({
            count: a.count ?? 0,
            code: a.code ?? ''
          })),
          arrival: reservation.arrival + 'T00:00:00Z',
          departure: reservation.departure + 'T00:00:00Z',
          childrenAges: reservation.childrenAgeList ?? [],
          pets: reservation.pets ?? 0,
          roomProductId: reservation.roomProductId ?? '',
          ratePlanId: reservation.salesPlanId ?? ''
        };
        return input;
      }) as CalculateReservationPricingInputDto[]
    };
    const bookingPricing = await this.bookingCalculateService.calculateBookingPricing(input);

    if (!bookingPricing) return outputLowestPrice;

    const reservationPricingList = bookingPricing.reservationPricingList;
    const amenityPricingList = reservationPricingList?.flatMap((r) => r?.amenityPricingList);
    const accommodationBaseAmount = reservationPricingList?.reduce(
      (acc, r) => acc + r?.totalAccommodationAmountBySetting,
      0
    );
    const accommodationTaxAmount = reservationPricingList?.reduce(
      (acc, r) => acc + r?.accommodationTaxAmount,
      0
    );
    const accommodationGrossAmount = reservationPricingList?.reduce(
      (acc, r) => acc + r?.totalAccommodationAmount,
      0
    );
    const includedServices = amenityPricingList?.filter((i) => i?.isSalesPlanIncluded);
    const services = amenityPricingList?.filter((i) => !i?.isSalesPlanIncluded);
    const includedServiceBaseAmount = includedServices?.reduce(
      (acc, a) => acc + a?.totalBaseAmount,
      0
    );
    const includedServiceTaxAmount = includedServices?.reduce((acc, a) => acc + a?.taxAmount, 0);
    const includedServiceGrossAmount = includedServices?.reduce(
      (acc, a) => acc + a?.totalGrossAmount,
      0
    );
    const serviceBaseAmount = services?.reduce((acc, a) => acc + a?.totalBaseAmount, 0);
    const serviceTaxAmount = services?.reduce((acc, a) => acc + a?.taxAmount, 0);
    const serviceGrossAmount = services?.reduce((acc, a) => acc + a?.totalGrossAmount, 0);

    outputLowestPrice = {
      lowestPriceTotalBaseAmount: bookingPricing?.totalBaseAmount,
      lowestPriceTotalTaxAmount: bookingPricing?.taxAmount,
      lowestPriceTotalGrossAmount: bookingPricing?.totalGrossAmount,
      lowestPriceAccommodationBaseAmount: accommodationBaseAmount,
      lowestPriceAccommodationTaxAmount: accommodationTaxAmount,
      lowestPriceAccommodationGrossAmount: accommodationGrossAmount,
      lowestPriceIncludedServiceBaseAmount: includedServiceBaseAmount,
      lowestPriceIncludedServiceTaxAmount: includedServiceTaxAmount,
      lowestPriceIncludedServiceGrossAmount: includedServiceGrossAmount,
      lowestPriceServiceBaseAmount: serviceBaseAmount,
      lowestPriceServiceTaxAmount: serviceTaxAmount,
      lowestPriceServiceGrossAmount: serviceGrossAmount
    };
    console.log(
      '🚀 ~ CreateBookingService ~ calculateLowestPrice ~ bookingPricing:',
      outputLowestPrice
    );
    return outputLowestPrice;
  }

  async buildBookPrice(bookingInput: RequestBookingDto, booking: Booking) {
    let outputBookPrice: any = {
      bookTotalBaseAmount: null,
      bookTotalTaxAmount: null,
      bookTotalGrossAmount: null,
      bookAccommodationBaseAmount: null,
      bookAccommodationTaxAmount: null,
      bookAccommodationGrossAmount: null,
      bookIncludedServiceBaseAmount: null,
      bookIncludedServiceTaxAmount: null,
      bookIncludedServiceGrossAmount: null,
      bookServiceBaseAmount: null,
      bookServiceTaxAmount: null,
      bookServiceGrossAmount: null,
      cityTaxAmount: null
    };

    const reservationsInput = bookingInput.bookingInformation.reservationList;
    const input: CalculateBookingPricingInputDto = {
      hotelId: booking.hotelId ?? '',
      translateTo: (bookingInput.translateTo || LanguageCodeEnum.EN) as LanguageCodeEnum,
      reservations: reservationsInput.map((reservation) => {
        const input: CalculateReservationPricingInputDto = {
          adults: reservation.adult ?? 0,
          amenityList: reservation.amenityList?.map((a) => ({
            count: a.count ?? 0,
            code: a.code ?? ''
          })),
          arrival: reservation.arrival + 'T00:00:00Z',
          departure: reservation.departure + 'T00:00:00Z',
          childrenAges: reservation.childrenAgeList ?? [],
          pets: reservation.pets ?? 0,
          roomProductId: reservation.roomProductId ?? '',
          ratePlanId: reservation.salesPlanId ?? ''
        };
        return input;
      })
    };
    const bookingPricing = await this.bookingCalculateService.calculateBookingPricing(input);

    if (!bookingPricing) return outputBookPrice;

    const reservationPricingList = bookingPricing.reservationPricingList;
    const amenityPricingList = reservationPricingList?.flatMap((r) => r?.amenityPricingList);
    const accommodationBaseAmount = reservationPricingList?.reduce(
      (acc, r) => acc + r?.totalAccommodationAmountBySetting,
      0
    );
    const accommodationTaxAmount = reservationPricingList?.reduce(
      (acc, r) => acc + r?.accommodationTaxAmount,
      0
    );
    const accommodationGrossAmount = reservationPricingList?.reduce(
      (acc, r) => acc + r?.totalAccommodationAmount,
      0
    );
    const includedServices = amenityPricingList?.filter((i) => i?.isSalesPlanIncluded);
    const services = amenityPricingList?.filter((i) => !i?.isSalesPlanIncluded);
    const includedServiceBaseAmount = includedServices?.reduce(
      (acc, a) => acc + a?.totalBaseAmount,
      0
    );
    const includedServiceTaxAmount = includedServices?.reduce((acc, a) => acc + a?.taxAmount, 0);
    const includedServiceGrossAmount = includedServices?.reduce(
      (acc, a) => acc + a?.totalGrossAmount,
      0
    );
    const serviceBaseAmount = services?.reduce((acc, a) => acc + a?.totalBaseAmount, 0);
    const serviceTaxAmount = services?.reduce((acc, a) => acc + a?.taxAmount, 0);
    const serviceGrossAmount = services?.reduce((acc, a) => acc + a?.totalGrossAmount, 0);

    outputBookPrice = {
      bookTotalBaseAmount: bookingPricing?.totalBaseAmount,
      bookTotalTaxAmount: bookingPricing?.taxAmount,
      bookTotalGrossAmount: bookingPricing?.totalGrossAmount,
      bookAccommodationBaseAmount: accommodationBaseAmount,
      bookAccommodationTaxAmount: accommodationTaxAmount,
      bookAccommodationGrossAmount: accommodationGrossAmount,
      bookIncludedServiceBaseAmount: includedServiceBaseAmount,
      bookIncludedServiceTaxAmount: includedServiceTaxAmount,
      bookIncludedServiceGrossAmount: includedServiceGrossAmount,
      bookServiceBaseAmount: serviceBaseAmount,
      bookServiceTaxAmount: serviceTaxAmount,
      bookServiceGrossAmount: serviceGrossAmount,
      cityTaxAmount: bookingPricing?.cityTaxAmount
    };

    return outputBookPrice;
  }

  async handleRelatedMrfc(bookingInput: RequestBookingDto, booking: Booking) {
    const reservations = booking.reservations;
    const reservationsWithoutMrfc: Reservation[] = [];
    let roomProductIds = reservations.map((r) => r.roomProductId ?? '');
    roomProductIds = [...new Set(roomProductIds)];

    const roomProducts = await this.roomProductRepository.getRoomProducts({
      ids: roomProductIds
    });
    const roomProductMap = new Map<string, RoomProduct>(roomProducts.map((r) => [r.id, r]));

    for (const [index, reservation] of reservations.entries()) {
      const roomProduct = roomProductMap.get(reservation.roomProductId ?? '');
      if (roomProduct?.code?.startsWith('MRFC-')) continue;
      reservationsWithoutMrfc.push(reservation);
    }

    const relatedMrfcRoomProducts = await this.availabilityService.getRelatedMrfc({
      hotelId: booking.hotelId ?? '',
      roomProductIds: reservationsWithoutMrfc.map((r) => r.roomProductId ?? '')
    });
    const reservationRelatedMrfcInput: ReservationRelatedMrfc[] = reservationsWithoutMrfc
      .map((r) => {
        const relatedMrfc = relatedMrfcRoomProducts?.find(
          (mrfc) => mrfc.roomProductId === r.roomProductId
        );

        if (!relatedMrfc) return null;

        return {
          id: uuidv4(),
          reservationId: r.id,
          hotelId: r.hotelId ?? '',
          mrfcId: relatedMrfc?.relatedMrfcId ?? '',
          mrfcBaseAmount: null, //TODO
          mrfcGrossAmount: null, //TODO
          mrfcGrossAccommodationAmount: null,
          reservationGrossAmount: r.totalGrossAmount,
          reservationGrossAccommodationAmount: null, //TODO
          reservationGrossIncludedServiceAmount: null, //TODO
          reservationGrossServiceAmount: null, //TODO
          createdBy: this.currentSystem,
          createdAt: new Date(),
          updatedBy: this.currentSystem,
          updatedAt: new Date(),
          deletedAt: null
        };
      })
      .filter((r) => !!r);

    try {
      const reservationRelatedMrfc =
        await this.reservationRelatedMrfcRepository.createReservationRelatedMrfc(
          reservationRelatedMrfcInput
        );
      this.logger.log(
        `🚀 Created reservation related mrfc with ids: ${reservationRelatedMrfc?.map((r) => r.id).join(', ')}`
      );
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
