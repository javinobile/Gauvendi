import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PERFORMED_BY } from 'src/core/constants/common.const';
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
import {
  Reservation,
  ReservationStatusEnum
} from 'src/core/entities/booking-entities/reservation.entity';
import { Connector } from 'src/core/entities/hotel-entities/connector.entity';
import {
  HotelAmenity,
  PricingUnitEnum
} from 'src/core/entities/hotel-entities/hotel-amenity.entity';
import { Hotel } from 'src/core/entities/hotel-entities/hotel.entity';
import { BaseService } from 'src/core/services/base.service';

import { BookingTransactionRepository } from 'src/modules/booking-transaction/repositories/booking-transaction.repository';
import { BookingUpsellInformationRepository } from 'src/modules/booking-upsell-information/repositories/booking-upsell-information.repository';

import { GuestRepository } from 'src/modules/guest/repositories/guest.repository';
import { HotelPaymentMethodSettingRepository } from 'src/modules/hotel-payment-method-setting/repositories/hotel-payment-method-setting.repository';
import { HotelAmenityRepository } from 'src/modules/hotel/repositories/hotel-amenity.repository';

import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { ISE_SOCKET_SERVICE } from '@src/core/client/ise-socket-client.module';
import { ISE_SOCKET_CMD } from '@src/core/constants/cmd.const';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { DB_NAME } from '@src/core/constants/db.const';
import { PAYABLE_METHOD_LIST } from '@src/core/constants/payment';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { ReservationTimeSlice } from '@src/core/entities/booking-entities/reservation-time-slice.entity';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { HotelTemplateEmailCodeEnum } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { MappingPmsHotel } from '@src/core/entities/hotel-entities/mapping-pms-hotel.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  BookingFlow,
  ExtraServiceTypeEnum,
  HotelAgeCategoryCodeEnum,
  HotelAmenityCodeSurchargeEnum,
  HotelConfigurationTypeEnum,
  HotelPaymentModeCodeEnum,
  LanguageCodeEnum,
  PaymentMethodStatusEnum,
  RoundingModeEnum,
  SellingTypeEnum
} from '@src/core/enums/common';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { Helper } from '@src/core/helper/utils';
import { CompanyRepository } from '@src/modules/company/repositories/company.repository';
import { GlobalPaymentMethodRepository } from '@src/modules/global-payment-method/repositories/global-payment-method.repository';
import { GlobalPaymentProviderRepository } from '@src/modules/global-payment-provider/repositories/global-payment-provider.repository';
import { HotelConfigurationRepository } from '@src/modules/hotel-configuration/hotel-configuration.repository';
import { MappingPmsHotelRepository } from '@src/modules/mapping-pms-hotel/repositories/mapping-pms-hotel.repository';
import { NotificationService } from '@src/modules/notification';
import { PaymentService } from '@src/modules/payment/payment.service';
import { PmsService } from '@src/modules/pms/pms.service';
import { ReservationRelatedMrfcRepository } from '@src/modules/reservation-related-mrfc/repositories/reservation-related-mrfc.repository';
import { ReservationService } from '@src/modules/reservation/services/reservation.service';
import { RoomProductAvailabilityService } from '@src/modules/room-product-availability/room-product-availability.service';
import { RoomProductRepository } from '@src/modules/room-product/room-product.repository';
import { addDays, addHours, addMinutes, format, subDays } from 'date-fns';
import Decimal from 'decimal.js';
import { lastValueFrom } from 'rxjs';
import { RatePlanRepository } from 'src/modules/rate-plan/repositories/rate-plan.repository';
import { ReservationAmenityDateRepository } from 'src/modules/reservation-amenity-date/repositories/reservation-amenity-date.repository';
import { ReservationAmenityRepository } from 'src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { ReservationRoomRepository } from 'src/modules/reservation-room/repositories/reservation-room.repository';
import { ReservationTimeSliceRepository } from 'src/modules/reservation-time-slice/repositories/reservation-time-slice.repository';
import { ReservationRepository } from 'src/modules/reservation/repositories/reservation.repository';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReservationDto } from '../dtos/booking-information.dto';
import {
  BookingForm,
  CalculateBookingPricingInputDto,
  CalculateReservationPricingInputDto
} from '../dtos/booking.dto';
import { RequestBookingDto, RoomAvailabilityDto } from '../dtos/request-booking.dto';
import { BookingMetaTrackingRepository } from '../repositories/booking-meta-tracking.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingCalculateService } from './booking-calculate.service';

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
    private bookingMetaTrackingRepository: BookingMetaTrackingRepository,

    private paymentService: PaymentService,
    private reservationService: ReservationService,

    private hotelPaymentMethodSettingRepository: HotelPaymentMethodSettingRepository,
    private mappingPmsHotelRepository: MappingPmsHotelRepository,

    private hotelConfigurationRepository: HotelConfigurationRepository,
    // private bookingGateway: BookingGateway,

    private bookingRepository: BookingRepository,
    private globalPaymentProviderRepository: GlobalPaymentProviderRepository,
    private globalPaymentMethodRepository: GlobalPaymentMethodRepository,

    private hotelAmenityRepository: HotelAmenityRepository,
    private roomProductAvailabilityService: RoomProductAvailabilityService,
    private ratePlanRepository: RatePlanRepository,
    private bookingUpsellInformationRepository: BookingUpsellInformationRepository,
    private roomProductRepository: RoomProductRepository,
    private reservationRelatedMrfcRepository: ReservationRelatedMrfcRepository,
    private notificationService: NotificationService,
    private pmsService: PmsService,

    private bookingCalculateService: BookingCalculateService,

    @InjectRepository(BookingProposalSetting, DB_NAME.POSTGRES)
    private readonly bookingProposalSettingRepository: Repository<BookingProposalSetting>,

    @Inject(ISE_SOCKET_SERVICE) private readonly iseSocketClient: ClientProxy,

    configService: ConfigService
  ) {
    super(configService);
  }

  async processBooking(
    body: RequestBookingDto,
    hotel: Hotel,
    connector: Connector | null,
    roomAvailability: RoomAvailabilityDto[],

    translateTo?: string
  ) {
    this.logger.debug(`Starting process booking for hotel ${hotel.id}`);
    const bookingFrom = body.bookingFrom;
    const guestData = body.bookingInformation.guestInformation;
    const guest = await this.guestRepository.createGuest(
      {
        ...guestData,
        preferredLanguage:
          (body.bookingFrom === 'ISE' ? translateTo : guestData.preferredLanguage) ||
          LanguageCodeEnum.EN
      },
      hotel.id,
      guestData.isBooker,
      bookingFrom === 'ISE' ? guestData.isBooker : guestData.isMainGuest
    );

    const bookingInput: Partial<Booking> = {
      id: uuidv4(),
      hotelId: hotel.id,
      mappingBookingCode: null,
      mappingChannelBookingCode: null,
      completedDate: null,
      holdExpiredDate: null,
      bookerId: null,
      specialRequest: body.bookingInformation.specialRequest ?? '',
      acceptTnc: true,
      isConfirmationEmailSent: false,
      deletedAt: null,
      createdBy: this.currentSystem,
      createdAt: new Date(),
      updatedBy: this.currentSystem,
      updatedAt: new Date(),
      reservations: []
    };
    const company = await this.companyRepository.createCompany(
      bookingFrom === BookingForm.ISE ? guestData : body.bookingInformation?.booker,
      hotel.id
    );

    const isBookForSomeoneElse = body.bookingInformation?.reservationList.some(
      (reservation) => !reservation.primaryGuest?.isBooker
    );

    let booker;

    if (bookingFrom === BookingForm.ISE) {
      if (guestData.isBooker) {
        booker = guest;
        bookingInput.isBookForSomeoneElse = false;
      } else {
        const bookerData = {
          ...body.bookingInformation?.booker,
          preferredLanguage: translateTo || LanguageCodeEnum.EN
        };
        booker = await this.guestRepository.createGuest(bookerData, hotel.id);
        bookingInput.isBookForSomeoneElse = true;
      }
    } else {
      bookingInput.isBookForSomeoneElse = isBookForSomeoneElse;
      this.logger.debug(`Company created for hotel ${hotel.id}: ${company?.id}`);
      booker = guestData?.isBooker
        ? guest
        : await this.guestRepository.createGuest(body.bookingInformation?.booker, hotel.id);
    }

    bookingInput.bookerId = booker?.id;
    const booking = await this.bookingRepository.createBooking(bookingInput);
    booking.booker = booker;

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
      guest,
      bookingFrom
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
        arrival: reservation.arrival,
        departure: reservation.departure,
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
      reservation.amenityPricingList = reservationPricing.amenityPricingList.map(
        (amenityPricing) => ({
          hotelAmenityId: amenityPricing.hotelAmenity.id,
          hotelAmenityCode: amenityPricing.hotelAmenity.code,
          hotelAmenityName: amenityPricing.hotelAmenity.name,
          totalBaseAmount: amenityPricing.totalBaseAmount,
          totalGrossAmount: amenityPricing.totalGrossAmount,
          taxAmount: amenityPricing.taxAmount,
          taxDetailsMap: amenityPricing.taxDetailsMap,
          extraServiceType:
            amenityPricing.extraServiceType ||
            (amenityPricing.isSalesPlanIncluded
              ? ExtraServiceTypeEnum.INCLUDED
              : ExtraServiceTypeEnum.MANDATORY),
          pricingUnit: amenityPricing.hotelAmenity.pricingUnit,
          count: amenityPricing.count,
          ageCategoryPricingList: amenityPricing.ageCategoryPricingList,
          includedDates: amenityPricing.includedDates,
          linkedAmenityInfoList: amenityPricing?.linkedAmenityInfoList || [],
          sellingType: amenityPricing?.sellingType || SellingTypeEnum.SINGLE
        })
      );
      reservation.paymentTermCode = reservationPricing.hotelPaymentTerm?.code;
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
    bookingFrom?: BookingForm;
  }) {
    const {
      body,
      booking,
      hotel,
      connector,
      roomAvailability,
      company,
      booker,
      guest,
      bookingFrom
    } = input;
    const currencyCode = body.bookingInformation.bookingPricing?.currencyCode || '';

    // handle for proposal booking
    let propertyPaymentMethodSetting: HotelPaymentMethodSetting | null = null;
    let bookingProposalSetting: BookingProposalSetting | null = null;
    if (body.bookingProposalSettingInput) {
      const triggerAt = new Date();
      let validBefore = new Date();
      if (body.bookingProposalSettingInput.expiredDay) {
        validBefore = addDays(validBefore, Number(body.bookingProposalSettingInput.expiredDay));
      }
      if (body.bookingProposalSettingInput.expiredHour) {
        validBefore = addHours(validBefore, Number(body.bookingProposalSettingInput.expiredHour));
      }
      if (body.bookingProposalSettingInput.expiredMinute) {
        validBefore = addMinutes(
          validBefore,
          Number(body.bookingProposalSettingInput.expiredMinute)
        );
      }
      validBefore = addMinutes(validBefore, 1);
      bookingProposalSetting = await this.bookingRepository.createProposalSetting({
        bookingId: booking.id,
        hotelId: hotel.id,
        triggerAt,
        validBefore
      });
    }

    if (body.bookingInformation.hotelPaymentModeCode) {
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
      propertyPaymentMethodSetting =
        await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
          hotelId: hotel.id,
          globalPaymentProviderId: globalPaymentProvider?.id,
          globalPaymentMethodId: globalPaymentMethod?.id,
          status: PaymentMethodStatusEnum.ACTIVE
        });
    }

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

    // create reservation time slices, reservation rooms, room availability, reservation amenities
    const reservationTimeSlices = await this.createReservationTimeSlice(
      hotel,
      reservations,
      roomAvailability,
      timeSlice,
      hotel.timeZone ?? 'UTC',
      body
    );
    const [reservationAmenityDates] = await Promise.all([
      await this.handleReservationAmenity(reservations, body, roomAvailability),
      await this.createReservationRoom(reservations, roomAvailability)
    ]);
    const requestRooms = reservationTimeSlices?.map((rt) => {
      return {
        arrival: rt.fromTime ? format(new Date(rt.fromTime), DATE_FORMAT) : '',
        departure: rt.toTime ? format(new Date(rt.toTime), DATE_FORMAT) : '',
        roomProductId: rt.roomProductId ?? '',
        roomUnitIds: rt.roomId ? [rt.roomId] : []
      };
    });
    await this.roomProductAvailabilityService.processRoomUnitAvailabilityUpdate(
      {
        hotelId: hotel.id,
        requestRooms: requestRooms
      },
      'handleAfterCreateBooking'
    );

    // create upsell information
    this.handleUpsellInformation(booking, body);
    // create reservation related mrfc
    this.handleRelatedMrfc(body, booking);

    this.requestBookingPayment({
      booking,
      propertyPaymentMethodSetting,
      hotel,
      connector,
      booker,
      guest,
      currencyCode,
      mappingHotel,
      bookingInput: body,
      reservationTimeSlices,
      roomProductList: roomAvailability,
      bookingFrom,
      bookingProposalSetting
    });
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

  async requestBookingPayment(input: {
    booking: Booking;
    propertyPaymentMethodSetting: HotelPaymentMethodSetting | null;
    hotel: Hotel;
    connector: Connector | null;
    booker: Guest;
    guest: Guest;
    currencyCode: string;
    mappingHotel: MappingPmsHotel | null;
    bookingInput: RequestBookingDto;
    reservationTimeSlices: ReservationTimeSlice[];
    roomProductList: RoomAvailabilityDto[];
    bookingFrom?: BookingForm;
    isProposalBooking?: boolean;
    bookingProposalSetting?: BookingProposalSetting | null;
  }) {
    const {
      booking,
      bookingInput,
      isProposalBooking,
      hotel,
      connector,
      mappingHotel,
      guest,
      booker,
      reservationTimeSlices,
      roomProductList,
      bookingFrom,
      bookingProposalSetting,
      propertyPaymentMethodSetting,
      currencyCode
    } = input;
    const isSkipPayment =
      bookingInput.bookingInformation.bookingFlow === BookingFlow.CALL_PRO_PLUS &&
      (bookingInput.bookingProposalSettingInput ||
        bookingInput.bookingInformation.hotelPaymentModeCode === HotelPaymentModeCodeEnum.NOGUAR);
    // if (bookingProposalSettingInput) {
    //   // await this.pmsService.pushReservationToPms({
    //   //   bookingInput,
    //   //   booking: booking,
    //   //   connector,
    //   //   booker,
    //   //   roomProductList,
    //   //   hotel,
    //   //   reservationTimeSlices
    //   // });
    //   return [];
    // }
    const config = await this.hotelConfigurationRepository.getHotelConfiguration({
      hotelId: hotel.id,
      configType: HotelConfigurationTypeEnum.WHITELABEL_SETTING,
      deletedAt: null
    });
    const whitelabelUrl = config ? (config?.configValue?.metadata as { url: string })?.url : '';

    let bookingTransaction: any = {};
    let requestPaymentResponse: any = {};
    let updateBookingTransactionInput: any = {
      id: bookingTransaction.id
    };
    if (!isSkipPayment) {
      const bookingTransactionInput: Partial<BookingTransaction> = {
        bookingId: booking.id,
        status: BookingTransactionStatusEnum.PAYMENT_PENDING,
        paymentMode: bookingInput.bookingInformation.hotelPaymentModeCode,
        transactionNumber: bookingInput.transactionId // PCI Proxy transaction id
      };
      bookingTransaction = await this.handleBookingTransaction(bookingTransactionInput);

      requestPaymentResponse = await this.paymentService.requestPayment({
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

      updateBookingTransactionInput = {
        id: bookingTransaction.id,
        ...(requestPaymentResponse.bookingTransactionInput || {})
      };

      updateBookingTransactionInput.paymentDate =
        updateBookingTransactionInput.status === BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
          ? new Date()
          : null;
      await this.bookingTransactionRepository.updateBookingTransaction(
        updateBookingTransactionInput
      );
    }

    await this.handleAfterPayment({
      bookingId: booking.id,
      isProposalBooking
    });
    await lastValueFrom(
      this.iseSocketClient.send(
        { cmd: ISE_SOCKET_CMD.PAYMENT_COMPLETE },
        {
          bookingId: booking.id,
          isProposalBooking: isProposalBooking,
          paymentInfo: requestPaymentResponse.paymentInfo
        }
      )
    );

    // this.handleSocketPayment(
    //   booking,
    //   updateBookingTransactionInput,
    //   requestPaymentResponse,
    //   bookingInput,
    //   connector,
    //   mappingHotel,
    //   booker,
    //   bookingTransaction,
    //   hotel,
    //   reservationTimeSlices,
    //   roomProductList
    // );

    return bookingTransaction;
  }

  //   handleSocketPayment(
  //     booking: Booking,
  //     updateBookingTransactionInput: Partial<BookingTransaction> & Pick<BookingTransaction, 'id'>,
  //     requestPaymentResponse: RequestPaymentResponseDto,
  //     bookingInput: RequestBookingDto,
  //     connector: Connector | null,
  //     mappingHotel: MappingPmsHotel,
  //     booker: Guest,
  //     bookingTransaction: BookingTransaction,
  //     hotel: Hotel,
  //     reservationTimeSlices: ReservationTimeSlice[],
  //     roomProductList: RoomAvailabilityDto[]
  //   ) {
  //     const paymentStatusFromClient = this.bookingGateway.paymentStatus.get(booking.id);
  //     this.bookingGateway.notifyBookingPaymentStatus(
  //       booking.id,
  //       {
  //         status: updateBookingTransactionInput?.status,
  //         data: requestPaymentResponse.paymentInfo?.data
  //       },
  //       !paymentStatusFromClient
  //     );
  //     if (!paymentStatusFromClient) return;

  //     paymentStatusFromClient
  //       .pipe(
  //         filter((data) => !!data),
  //         take(1)
  //       )
  //       .subscribe((data) => {
  //         updateBookingTransactionInput.status =
  //           (data?.paymentStatus as BookingTransactionStatusEnum) ||
  //           BookingTransactionStatusEnum.PAYMENT_FAILED;
  //         this.logger.log(
  //           `🚀 updateBookingTransactionInput from client: ${JSON.stringify(updateBookingTransactionInput)}`
  //         );
  //         this.handleAfterPayment(
  //           booking,
  //           updateBookingTransactionInput,
  //           bookingTransaction,
  //           bookingInput.bookingInformation.hotelPaymentModeCode,
  //           bookingInput.translateTo ?? 'EN',
  //           connector,
  //           mappingHotel,
  //           bookingInput,
  //           booker,
  //           hotel,
  //           reservationTimeSlices,
  //           roomProductList
  //         );
  //         this.bookingGateway.paymentStatus.delete(booking.id);
  //         this.bookingGateway.notifyBookingPaymentStatus(
  //           booking.id,
  //           {
  //             status: updateBookingTransactionInput?.status,
  //             data: requestPaymentResponse.paymentInfo?.data
  //           },
  //           true
  //         );
  //       });
  //   }

  async handleAfterPayment(input: {
    bookingId: string;
    isProposalBooking?: boolean;
    isAfterHandleSocketPayment?: boolean;
  }) {
    const { bookingId, isProposalBooking, isAfterHandleSocketPayment } = input;
    const [booking, bookingProposalSetting, bookingTransaction] = await Promise.all([
      this.bookingRepository.getBooking(bookingId, [
        'reservations',
        'reservations.reservationTimeSlices'
      ]),
      this.bookingProposalSettingRepository.findOne({
        where: {
          bookingId: bookingId
        }
      }),
      this.bookingTransactionRepository.getBookingTransactionByBookingId(bookingId)
    ]);
    if (!booking) {
      this.logger.error(`Booking not found: ${bookingId}`);
      return false;
    }

    const hotelId = booking.hotelId;
    if (!hotelId) {
      this.logger.error(`Hotel not found for booking: ${bookingId}`);
      return false;
    }

    const bookingFlow = booking.reservations?.[0].bookingFlow;
    const paymentModeCode = booking.reservations?.[0].hotelPaymentModeCode;
    const bookingLanguage = booking.reservations?.[0].bookingLanguage || 'EN';
    const bookingStatus = booking.reservations?.[0].status;

    const isSkipPayment =
      bookingFlow === BookingFlow.CALL_PRO_PLUS &&
      !isAfterHandleSocketPayment &&
      ((!!bookingProposalSetting && bookingStatus === ReservationStatusEnum.PROPOSED) ||
        paymentModeCode === HotelPaymentModeCodeEnum.NOGUAR);

    if (!isSkipPayment) {
      if (bookingTransaction?.status === BookingTransactionStatusEnum.PAYMENT_PENDING) {
        return false;
      }
      if (bookingTransaction?.status === BookingTransactionStatusEnum.PAYMENT_SUCCEEDED) {
        await this.bookingRepository.updateBooking({
          id: booking.id,
          completedDate: new Date()
        });
        await this.reservationRepository.updateReservations(
          booking.reservations.map((reservation) => ({
            id: reservation.id,
            balance:
              (reservation.totalGrossAmount ?? 0) - (reservation.payOnConfirmationAmount ?? 0)
          }))
        );
      }
      if (!PAYABLE_METHOD_LIST.includes(paymentModeCode as HotelPaymentModeCodeEnum)) {
        this.handleAfterCompleteBooking({
          booking,
          bookingLanguage,
          bookingProposalSetting,
          isProposalBooking,
          isAfterHandleSocketPayment
        });
        return false;
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
      let status = statusObj[bookingTransaction?.status || 'default'];

      this.logger.debug(
        'isProposalBooking status',
        JSON.stringify({
          currentStatus,
          bookingTransactionStatus: bookingTransaction?.status,
          status
        })
      );

      if (
        currentStatus === ReservationStatusEnum.PROPOSED &&
        bookingTransaction?.status !== BookingTransactionStatusEnum.PAYMENT_SUCCEEDED
      ) {
        status = ReservationStatusEnum.RELEASED;
      }
      await this.reservationRepository.updateReservationStatus(ids, status, isProposalBooking);

      if (status !== ReservationStatusEnum.CONFIRMED) {
        if (isProposalBooking) {
          await this.reservationService.releaseBooking({ bookingId: booking.id });
        } else {
          await this.roomProductAvailabilityService.roomProductReleaseAvailability({
            hotelId: hotelId,
            requestRooms: booking.reservations?.map((reservation) => {
              let roomIds = reservation.reservationTimeSlices
                .map((room) => room.roomId ?? '')
                .filter((id) => id !== '');
              roomIds = [...new Set(roomIds)];
              const arrivalDate = reservation.arrival
                ? format(new Date(reservation.arrival), DATE_FORMAT)
                : '';
              const departureDate = reservation.departure
                ? format(new Date(reservation.departure), DATE_FORMAT)
                : '';
              this.logger.log(
                `Release room availability handleAfterPayment for room product ${reservation.roomProductId} from ${arrivalDate} to ${departureDate}, room unit ids: ${roomIds.join(', ')}`
              );
              const requestRoom = {
                roomProductId: reservation.roomProductId ?? '',
                arrival: arrivalDate,
                departure: departureDate,
                roomUnitIds: roomIds
              };
              return requestRoom;
            })
          });
        }
      }
    }

    if (
      bookingTransaction?.status !== BookingTransactionStatusEnum.PAYMENT_SUCCEEDED &&
      !isSkipPayment
    ) {
      this.logger.warn(`Booking ${booking.id} payment failed, skipping complete booking`);
      return false;
    }

    this.handleAfterCompleteBooking({
      booking,
      bookingLanguage,
      isProposalBooking,
      bookingProposalSetting,
      isAfterHandleSocketPayment
    });
    return true;
  }

  async handleBookingTransaction(input: Partial<BookingTransaction> | null) {
    try {
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
    bookingLanguage: string;
    isProposalBooking?: boolean;
    bookingProposalSetting?: BookingProposalSetting | null;
    isAfterHandleSocketPayment?: boolean;
  }) {
    const {
      booking,
      bookingLanguage,
      bookingProposalSetting,
      isProposalBooking,
      isAfterHandleSocketPayment
    } = input;

    const updatedBooking = await this.bookingRepository.getBooking(booking.id);
    if (!updatedBooking) {
      this.logger.error(`Booking ${booking.id} not found`);
      return;
    }
    const hotelId = booking.hotelId;
    if (!hotelId) {
      this.logger.error(`Hotel not found for booking: ${booking.id}`);
      return;
    }

    await this.pmsService.pushReservationToPms({
      bookingId: booking.id,
      hotelId: hotelId,
      isProposalBooking: isProposalBooking
    });

    if (bookingProposalSetting) {
      if (isAfterHandleSocketPayment || isProposalBooking) {
        await this.notificationService.sendCppBookingConfirmationEmail({
          bookingId: booking.id,
          hotelTemplateEmail: HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
          translateTo: bookingLanguage
        });
      } else {
        const hotelConfigurations = await this.hotelConfigurationRepository.findAll({
          hotelId: hotelId
        });
        await this.notificationService.sendCppProposalBookingConfirmationEmail({
          bookingId: booking.id,
          hotelId: hotelId,
          hotelConfigurations: hotelConfigurations,
          bookingProposalSetting: bookingProposalSetting,
          translateTo: bookingLanguage
        });
      }
    } else {
      await this.notificationService.sendCppBookingConfirmationEmail({
        bookingId: booking.id,
        hotelTemplateEmail: HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
        translateTo: bookingLanguage
      });
    }

    return true;
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
      const additionalGuestList = await this.createAdditionalGuestList(
        body,
        hotel.id,
        booking.booker
      );
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
    hotelId: string,
    booker: Guest
  ): Promise<Partial<Guest>[][]> {
    const reservationList = bookingInput.bookingInformation.reservationList;
    const additionalGuestList = bookingInput.bookingInformation.additionalGuestList || [];

    if (!additionalGuestList?.length) return [];

    const newAdditionalGuestList: Partial<Guest>[][] = [];
    const mappedGuestsForReservation: Partial<Guest>[][] = [];
    for (const [index, reservation] of reservationList.entries()) {
      const additionalGuests = additionalGuestList.filter(
        (additionalGuest) => additionalGuest.reservationIdx === index
      );
      const mappedGuests: Partial<Guest>[] = [];
      const newGuests: Partial<Guest>[] = [];
      for (const additionalGuest of additionalGuests) {
        if (additionalGuest.isBooker) {
          mappedGuests.push(booker);
          continue;
        }

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
          softDelete: false,
          createdBy: PERFORMED_BY,
          createdDate: new Date(),
          updatedBy: PERFORMED_BY,
          updatedDate: new Date(),
          isMainGuest: false,
          isReturningGuest: false,
          hotelId: hotelId
        };

        newGuests.push(newGuest);
      }
      newAdditionalGuestList.push(mappedGuests);
      mappedGuestsForReservation.push(newGuests);
    }
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
      const reservationAmenities: ReservationAmenity[] = [];

      for (const [index, reservation] of originReservation.entries()) {
        const roomProduct = roomAvailability[index];
        const isErfcDeductAll =
          roomProduct?.roomProductCode?.startsWith('ERFC') && !roomProduct?.isErfcDeduct;
        const roomAvailabilityDates: any[] = (roomProduct?.roomAvailability || []).map(
          (room) => room.date
        );

        if (isErfcDeductAll) {
          const reservationAmenitiesForERFC = await this.createReservationAmenityForERFC({
            originReservation: reservation,
            reservations: reservations,
            currnetIndex: currnetIndex,
            roomAvailabilityDates: roomAvailabilityDates
          });
          reservationAmenities.push(...reservationAmenitiesForERFC);
          currnetIndex++;
          continue;
        }

        const rv = reservations[currnetIndex];
        currnetIndex++;
        // currnetIndex += countDuplicateDate - 1;
        const amentites = reservation?.amenityPricingList?.flatMap((amenityPricing) => {
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
        reservationAmenities.push(...(amentites || []));
      }
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
      for (const r of reservations) {
        const newAr = r.arrival ? format(new Date(r.arrival), DATE_FORMAT) : '';
        const newDe = r.departure ? format(subDays(new Date(r.departure), 1), DATE_FORMAT) : '';
        mapReservations.set(r.id, Helper.generateDateRange(newAr, newDe));
      }
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

        this.logger.debug(pricingUnit);
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

  async createReservationAmenityForERFC(input: {
    originReservation: ReservationDto;
    reservations: Reservation[];
    currnetIndex: number;
    roomAvailabilityDates: string[];
  }) {
    const { roomAvailabilityDates, originReservation, reservations, currnetIndex } = input;
    let amenities: any[] = [];
    try {
      const countDuplicateDateMap = new Map<string, number>();
      roomAvailabilityDates.forEach((date) => {
        countDuplicateDateMap.set(date, (countDuplicateDateMap.get(date) || 0) + 1);
      });
      const countDuplicateDate = Array.from(countDuplicateDateMap.values())[0];

      // map amenity pricing list by reservations
      const currentReservations = reservations.slice(
        currnetIndex,
        countDuplicateDate + currnetIndex
      );
      const hasChildrenReservations: Reservation[] = [];
      const hasPetsReservations: Reservation[] = [];
      let totalAdults = 0;
      for (const currentReservation of currentReservations) {
        totalAdults += currentReservation.adults || 1;
        if (currentReservation.childrenAges?.length) {
          hasChildrenReservations.push(currentReservation);
        }
        if (currentReservation.pets) {
          hasPetsReservations.push(currentReservation);
        }
      }

      const commonAmenity = () => {
        return {
          id: uuidv4(),
          reservationAmenityDates: [],
          masterHotelAmenityId: null,
          deletedAt: null,
          createdBy: this.currentSystem,
          createdAt: new Date(),
          updatedBy: this.currentSystem,
          updatedAt: new Date()
        };
      };

      const calculateAmenity = (amenityPricing: any, count: number) => {
        const totalBaseAmount = DecimalRoundingHelper.applyRounding(
          (amenityPricing.totalBaseAmount || 0) / count,
          RoundingModeEnum.NO_ROUNDING,
          2
        );
        const totalGrossAmount = DecimalRoundingHelper.applyRounding(
          (amenityPricing.totalGrossAmount || 0) / count,
          RoundingModeEnum.NO_ROUNDING,
          2
        );
        const taxAmount = DecimalRoundingHelper.applyRounding(
          (amenityPricing.taxAmount || 0) / count,
          RoundingModeEnum.NO_ROUNDING,
          2
        );
        const serviceChargeAmount = DecimalRoundingHelper.applyRounding(
          (amenityPricing.serviceChargeAmount || 0) / count,
          RoundingModeEnum.NO_ROUNDING,
          2
        );
        const newCount = (amenityPricing.count || 0) / count;

        return {
          totalBaseAmount,
          totalGrossAmount,
          taxAmount,
          serviceChargeAmount,
          newCount
        };
      };

      const buildAmenity = (
        newCommonAmenity: any,
        reservationId: string,
        amenityPricing: any,
        count: number,
        totalPersons?: {
          totalReservations: number;
          hasInReservation: number;
        }
      ) => {
        let { totalBaseAmount, totalGrossAmount, taxAmount, serviceChargeAmount, newCount } =
          calculateAmenity(amenityPricing, count);
        totalBaseAmount = totalPersons
          ? (totalBaseAmount / totalPersons.totalReservations) * totalPersons.hasInReservation
          : totalBaseAmount;
        totalGrossAmount = totalPersons
          ? (totalGrossAmount / totalPersons.totalReservations) * totalPersons.hasInReservation
          : totalGrossAmount;
        taxAmount = totalPersons
          ? (taxAmount / totalPersons.totalReservations) * totalPersons.hasInReservation
          : taxAmount;
        serviceChargeAmount = totalPersons
          ? (serviceChargeAmount / totalPersons.totalReservations) * totalPersons.hasInReservation
          : serviceChargeAmount;
        newCount = totalPersons
          ? (newCount / totalPersons.totalReservations) * totalPersons.hasInReservation
          : newCount;
        return {
          ...commonAmenity(),
          ...newCommonAmenity,
          reservationId: reservationId,
          totalBaseAmount,
          totalGrossAmount,
          taxAmount,
          serviceChargeAmount,
          count: newCount,
          includedDates: amenityPricing.includedDates,
          ...(amenityPricing.ageCategoryCode
            ? { ageCategoryCode: amenityPricing.ageCategoryCode }
            : {})
        };
      };

      for (const amenityPricing of originReservation?.amenityPricingList || []) {
        let newCommonAmenity = {
          hotelAmenityId: amenityPricing.hotelAmenityId,
          ageCategoryCode: amenityPricing.ageCategoryPricingList?.[0]?.ageCategoryCode,
          pricingUnit: amenityPricing.pricingUnit,
          extraServiceType: amenityPricing.extraServiceType
        };
        const firstReservation = currentReservations[0];
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
                reservationId: firstReservation.id,
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
                  reservationId: firstReservation.id,
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
          if (amenityPricing.count === 1) {
            const amenity: any = {
              ...commonAmenity(),
              ...newCommonAmenity,
              reservationId: firstReservation.id,
              totalBaseAmount: amenityPricing.totalBaseAmount,
              totalGrossAmount: amenityPricing.totalGrossAmount,
              taxAmount: amenityPricing.taxAmount,
              serviceChargeAmount: amenityPricing.serviceChargeAmount,
              count: amenityPricing.count,
              includedDates: amenityPricing.includedDates
            };
            amenities.push(amenity);
            continue;
          }

          // Handle for extra bed kid
          if (
            amenityPricing.hotelAmenityCode ===
            HotelAmenityCodeSurchargeEnum.EXTRA_BED_KID_AMENITY_CODE
          ) {
            const childrenRvCount = hasChildrenReservations?.length;
            for (const rv of hasChildrenReservations) {
              const amenity: any = buildAmenity(
                newCommonAmenity,
                rv.id,
                amenityPricing,
                childrenRvCount
              );
              amenities.push(amenity);
            }
            continue;
          }

          // Handle for pet
          if (amenityPricing.hotelAmenityCode === HotelAmenityCodeSurchargeEnum.PET_AMENITY_CODE) {
            const petRvCount = hasPetsReservations?.length;
            for (const rv of hasPetsReservations) {
              const amenity: any = buildAmenity(
                newCommonAmenity,
                rv.id,
                amenityPricing,
                petRvCount
              );
              amenities.push(amenity);
            }
            continue;
          }

          // Handle for other amenity
          switch (amenityPricing.pricingUnit) {
            case PricingUnitEnum.ROOM:
            case PricingUnitEnum.ITEM:
            case PricingUnitEnum.STAY:
            case PricingUnitEnum.NIGHT:
              const amenity: any = {
                ...commonAmenity(),
                ...newCommonAmenity,
                reservationId: firstReservation.id,
                totalBaseAmount: amenityPricing.totalBaseAmount,
                totalGrossAmount: amenityPricing.totalGrossAmount,
                taxAmount: amenityPricing.taxAmount,
                serviceChargeAmount: amenityPricing.serviceChargeAmount,
                count: amenityPricing.count,
                includedDates: amenityPricing.includedDates
              };
              amenities.push(amenity);
              continue;
            case PricingUnitEnum.PERSON:
            case PricingUnitEnum.PER_PERSON_PER_ROOM:
              for (const rv of currentReservations) {
                const {
                  totalBaseAmount,
                  totalGrossAmount,
                  taxAmount,
                  serviceChargeAmount,
                  newCount
                } = calculateAmenity(amenityPricing, totalAdults);
                const adults = rv.adults || 1;
                const amenity: any = {
                  ...commonAmenity(),
                  ...newCommonAmenity,
                  reservationId: rv.id,
                  totalBaseAmount: totalBaseAmount * adults,
                  totalGrossAmount: totalGrossAmount * adults,
                  taxAmount: taxAmount * adults,
                  serviceChargeAmount: serviceChargeAmount * adults,
                  count: newCount * adults,
                  includedDates: amenityPricing.includedDates
                };
                amenities.push(amenity);
              }
              continue;
            default:
              break;
          }

          // Handle for other amenity
          const rvCount = currentReservations?.length;
          for (const rv of currentReservations) {
            const amenity: any = buildAmenity(newCommonAmenity, rv.id, amenityPricing, rvCount);
            amenities.push(amenity);
          }
          continue;
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

          // Handle for age category
          switch (amenityPricing.pricingUnit) {
            case PricingUnitEnum.ROOM:
            case PricingUnitEnum.ITEM:
            case PricingUnitEnum.STAY:
            case PricingUnitEnum.NIGHT:
              const amenity: any = {
                ...commonAmenity(),
                ...newCommonAmenity,
                reservationId: firstReservation.id,
                totalBaseAmount: childBase,
                totalGrossAmount: ageCategoryPricing.totalSellingRate,
                taxAmount: childTax,
                serviceChargeAmount: amenityPricing.serviceChargeAmount,
                count: ageCategoryPricing.count,
                includedDates: amenityPricing.includedDates
              };
              amenities.push(amenity);
              continue;
            case PricingUnitEnum.PERSON:
            case PricingUnitEnum.PER_PERSON_PER_ROOM:
              const totalChildren = currentReservations.reduce(
                (total, rv) =>
                  total +
                  (rv.childrenAges?.filter(
                    (age) =>
                      age >= (ageCategoryPricing.fromAge || 0) &&
                      age <= (ageCategoryPricing.toAge || 0)
                  )?.length || 0),
                0
              );

              let selectedReservations =
                ageCategoryPricing.ageCategoryCode === HotelAgeCategoryCodeEnum.DEFAULT
                  ? currentReservations
                  : hasChildrenReservations;
              for (const rv of selectedReservations) {
                const childrenAges = rv.childrenAges?.filter(
                  (age) =>
                    age >= (ageCategoryPricing.fromAge || 0) &&
                    age <= (ageCategoryPricing.toAge || 0)
                );
                const adults = rv.adults || 1;
                const {
                  totalBaseAmount,
                  totalGrossAmount,
                  taxAmount,
                  serviceChargeAmount,
                  newCount
                } = calculateAmenity(
                  {
                    ...amenityPricing,
                    totalBaseAmount: childBase,
                    totalGrossAmount: ageCategoryPricing.totalSellingRate,
                    taxAmount: childTax,
                    count: ageCategoryPricing.count,
                    ageCategoryCode: ageCategoryPricing.ageCategoryCode
                  },
                  ageCategoryPricing.ageCategoryCode === HotelAgeCategoryCodeEnum.DEFAULT
                    ? totalAdults
                    : totalChildren
                );

                let countItem =
                  ageCategoryPricing.ageCategoryCode === HotelAgeCategoryCodeEnum.DEFAULT
                    ? adults
                    : childrenAges?.length || 1;
                const amenity: any = {
                  ...commonAmenity(),
                  ...newCommonAmenity,
                  reservationId: rv.id,
                  totalBaseAmount: totalBaseAmount * countItem,
                  totalGrossAmount: totalGrossAmount * countItem,
                  taxAmount: taxAmount * countItem,
                  serviceChargeAmount: serviceChargeAmount * countItem,
                  count: newCount * countItem,
                  includedDates: amenityPricing.includedDates,
                  ageCategoryCode: ageCategoryPricing.ageCategoryCode
                };
                amenities.push(amenity);
              }
              continue;
            default:
              break;
          }

          // Handle for child age category
          const hasChildrenAgeCategoryReservations: Reservation[] = hasChildrenReservations.filter(
            (rv) =>
              rv.childrenAges?.some(
                (age) =>
                  age >= (ageCategoryPricing.fromAge || 0) && age <= (ageCategoryPricing.toAge || 0)
              )
          );
          const hasChildrenReservationsCount = hasChildrenAgeCategoryReservations?.length;
          const personCases = [PricingUnitEnum.PERSON];
          if (personCases.includes(amenityPricing.pricingUnit as any)) {
            const totalChildren = hasChildrenAgeCategoryReservations.reduce((total, rv) => {
              const childrenAges = rv.childrenAges?.filter(
                (age) =>
                  age >= (ageCategoryPricing.fromAge || 0) && age <= (ageCategoryPricing.toAge || 0)
              );
              return total + (childrenAges?.length || 0);
            }, 0);
            for (const rv of currentReservations) {
              const childrenAges = rv.childrenAges?.filter(
                (age) =>
                  age >= (ageCategoryPricing.fromAge || 0) && age <= (ageCategoryPricing.toAge || 0)
              );
              const amenity: any = buildAmenity(
                newCommonAmenity,
                rv.id,
                {
                  ...amenityPricing,
                  totalBaseAmount: childBase,
                  totalGrossAmount: ageCategoryPricing.totalSellingRate,
                  taxAmount: childTax,
                  count: ageCategoryPricing.count,
                  ageCategoryCode: ageCategoryPricing.ageCategoryCode
                },
                hasChildrenReservationsCount,
                {
                  totalReservations: totalChildren,
                  hasInReservation: childrenAges?.length || 0
                }
              );
              amenities.push(amenity);
            }
            continue;
          }

          for (const rv of currentReservations) {
            const amenity: any = buildAmenity(
              newCommonAmenity,
              rv.id,
              {
                ...amenityPricing,
                totalBaseAmount: childBase,
                totalGrossAmount: ageCategoryPricing.totalSellingRate,
                taxAmount: childTax,
                count: ageCategoryPricing.count,
                ageCategoryCode: ageCategoryPricing.ageCategoryCode
              },
              hasChildrenReservationsCount
            );
            amenities.push(amenity);
          }
          continue;
        }
      }

      const amenitiesMap = new Map();
      for (const amenity of amenities) {
        const data = amenitiesMap.get(amenity.reservationId) || [];
        amenitiesMap.set(amenity.reservationId, [...data, amenity]);
      }
      const timeSlices = await this.reservationTimeSliceRepository.findAll({
        reservationIds: Array.from(amenitiesMap.keys())
      });

      const timeSlicesMap = new Map();
      for (const timeSlice of timeSlices) {
        const data = timeSlicesMap.get(timeSlice.reservationId) || [];
        timeSlicesMap.set(timeSlice.reservationId, [...data, timeSlice]);
      }
      const currentReservationsMap = new Map(currentReservations.map((rv) => [rv.id, rv]));
      const updateReservations: (Partial<Reservation> & Pick<Reservation, 'id'>)[] = [];
      for (const [reservationId, rvAmenities] of amenitiesMap) {
        const timeSlice = timeSlicesMap.get(reservationId);
        const currentReservation = currentReservationsMap.get(reservationId);
        const rvAmenitiesMap = new Map(
          rvAmenities.map((amenity) => [amenity.hotelAmenityId, amenity])
        );

        const extraServiceTax = currentReservation?.taxDetails?.current?.extraServiceTax;
        const accommodationTax = currentReservation?.taxDetails?.current?.accommodationTax?.map(
          (tax) => {
            return {
              ...tax,
              amount: DecimalRoundingHelper.applyRounding(
                (tax.amount || 0) / (currentReservations?.length || 1),
                RoundingModeEnum.HALF_ROUND_UP,
                2
              )
            };
          }
        );
        // TODO: Update tax details
        const newExtraServiceTax = extraServiceTax
          ?.filter((tax) => rvAmenitiesMap?.has(tax.hotelAmenityId))
          ?.map((tax) => {
            const amenitiesHasInTax = amenities?.filter(
              (amenity) => amenity.hotelAmenityId === tax.hotelAmenityId
            );
            const rvAmenity: any = rvAmenitiesMap.get(tax.hotelAmenityId);
            const totalCount = amenitiesHasInTax?.reduce(
              (total, amenity) => total + amenity.count,
              0
            );
            return {
              ...tax,
              amount: DecimalRoundingHelper.applyRounding(
                ((tax.amount || 0) / (totalCount || 1)) * (rvAmenity?.count || 1),
                RoundingModeEnum.HALF_ROUND_UP,
                2
              )
            };
          });
        const newTaxDetails = {
          current: {
            extraServiceTax: newExtraServiceTax,
            accommodationTax
          },
          original: {
            extraServiceTax: newExtraServiceTax,
            accommodationTax
          }
        };
        const rate = currentReservation?.payOnConfirmationAmount
          ? DecimalRoundingHelper.applyRounding(
              (currentReservation?.totalGrossAmount || 0) /
                (currentReservation?.payOnConfirmationAmount || 0),
              RoundingModeEnum.HALF_ROUND_UP,
              2
            )
          : 0;
        if (timeSlice) {
          const totalBaseAmount =
            rvAmenities.reduce((total, amenity) => total + amenity.totalBaseAmount, 0) +
            timeSlice.reduce((total, timeSlice) => total + timeSlice.totalBaseAmount, 0);
          const totalGrossAmount =
            rvAmenities.reduce((total, amenity) => total + amenity.totalGrossAmount, 0) +
            timeSlice.reduce((total, timeSlice) => total + timeSlice.totalGrossAmount, 0);
          const rTaxAmount =
            rvAmenities.reduce((total, amenity) => total + amenity.taxAmount, 0) +
            timeSlice.reduce((total, timeSlice) => total + timeSlice.taxAmount, 0);

          const payOnConfirmationAmount = totalGrossAmount * rate;
          const updateReservation = {
            id: reservationId,
            totalBaseAmount,
            totalGrossAmount,
            taxAmount: DecimalRoundingHelper.applyRounding(
              rTaxAmount,
              RoundingModeEnum.HALF_ROUND_UP,
              2
            ),
            payOnConfirmationAmount,
            taxDetails: newTaxDetails
          };
          updateReservations.push(updateReservation);
        }
      }
      await this.reservationRepository.updatePartialReservations(updateReservations);

      return amenities;
    } catch (error) {
      this.logger.error(error.message);
      return amenities;
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

    const roomProducts = await this.roomProductRepository.find({
      roomProductIds: roomProductIds
    });
    const roomProductMap = new Map<string, RoomProduct>(roomProducts.map((r) => [r.id, r]));

    for (const [index, reservation] of reservations.entries()) {
      const roomProduct = roomProductMap.get(reservation.roomProductId ?? '');
      if (roomProduct?.code?.startsWith('MRFC-')) continue;
      reservationsWithoutMrfc.push(reservation);
    }

    let relatedMrfcRoomProducts: any[] = [];
    try {
      relatedMrfcRoomProducts = await this.roomProductAvailabilityService.getRelatedMrfc({
        hotelId: booking.hotelId ?? '',
        roomProductIds: reservationsWithoutMrfc.map((r) => r.roomProductId ?? '')
      });
    } catch (error) {
      this.logger.error(`Failed to get related mrfc room products: ${error?.message}`);
    }
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
