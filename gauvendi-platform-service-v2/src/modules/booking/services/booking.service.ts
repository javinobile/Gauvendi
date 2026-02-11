import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import {
  BookingFlow,
  LanguageCodeEnum,
  ResponseStatusEnum,
  RfcAllocationSetting,
  RoomProductType
} from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { getNights } from '@src/core/utils/datetime.util';
import { ConnectorRepository } from '@src/modules/connector/repositories/connector.repository';
import { GlobalPaymentMethodRepository } from '@src/modules/global-payment-method/repositories/global-payment-method.repository';
import { GlobalPaymentProviderRepository } from '@src/modules/global-payment-provider/repositories/global-payment-provider.repository';
import { GuestDto } from '@src/modules/guest/dtos/guest.dto';
import { GuestRepository } from '@src/modules/guest/repositories/guest.repository';
import { HotelPaymentMethodSettingRepository } from '@src/modules/hotel-payment-method-setting/repositories/hotel-payment-method-setting.repository';
import { HotelRepository } from '@src/modules/hotel/repositories/hotel.repository';
import { ApaleoService } from '@src/modules/pms/apaleo/apaleo.service';
import { PmsService } from '@src/modules/pms/pms.service';
import { ReservationTimeSliceRepository } from '@src/modules/reservation-time-slice/repositories/reservation-time-slice.repository';
import { ReservationService } from '@src/modules/reservation/services/reservation.service';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ReservationDto } from '../dtos/booking-information.dto';
import { BookingFilterDto, BookingForm, UpdateBookingBookerInfoDto } from '../dtos/booking.dto';
import { ConfirmBookingProposalInputDto } from '../dtos/confirm-booking-proposal.dto';
import { CppRequestBookingInputDto } from '../dtos/cpp-request-booking.dto';
import {
  AfterPaymentDto,
  RequestBookingDto,
  RoomAvailabilityDto
} from '../dtos/request-booking.dto';
import { BookingMetaTrackingRepository } from '../repositories/booking-meta-tracking.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingValidatorService } from './booking-validator.service';
import { CreateBookingService } from './create-booking.service';
import { PaymentProviderCodeEnum } from '@src/core/enums/payment';
import { BookingTransaction } from '@src/core/entities/booking-entities/booking-transaction.entity';
import { MappingPmsHotelRepository } from '@src/modules/mapping-pms-hotel/repositories/mapping-pms-hotel.repository';
import { ReservationStatusEnum } from '@src/core/entities/booking-entities/reservation.entity';
import { ReservationRepository } from '@src/modules/reservation/repositories/reservation.repository';
import { DB_NAME } from '@src/core/constants/db.const';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { DATE_FORMAT } from '@src/core/constants/date.constant';
import { format } from 'date-fns';
import { RoomProduct } from '@src/core/entities/room-product.entity';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly guestRepository: GuestRepository,
    private readonly connectorRepository: ConnectorRepository,
    private readonly hotelRepository: HotelRepository,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,
    private readonly bookingValidatorService: BookingValidatorService,
    private readonly createBookingService: CreateBookingService,
    private readonly pmsService: PmsService,
    private readonly apaleoService: ApaleoService,
    private readonly reservationService: ReservationService,
    private bookingMetaTrackingRepository: BookingMetaTrackingRepository,
    private reservationTimeSliceRepository: ReservationTimeSliceRepository,
    private globalPaymentProviderRepository: GlobalPaymentProviderRepository,
    private globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private hotelPaymentMethodSettingRepository: HotelPaymentMethodSettingRepository,
    private mappingPmsHotelRepository: MappingPmsHotelRepository,
    private reservationRepository: ReservationRepository,

    @InjectRepository(BookingProposalSetting, DB_NAME.POSTGRES)
    private bookingProposalSettingRepository: Repository<BookingProposalSetting>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private roomProductRepository: Repository<RoomProduct>
  ) {}

  async cppRequestBooking(body: CppRequestBookingInputDto): Promise<any> {
    if (!body.reservationList?.length) {
      throw new BadRequestException('Reservation list is required');
    }

    const reservations = body.reservationList.map((item) => {
      const result: ReservationDto = {
        adult: item.adults || 1,
        childrenAgeList: item.childrenAgeList || [],
        pets: item.pets || 0,
        arrival: item.arrival,
        departure: item.departure,
        amenityList:
          item.amenityList?.map((amenity) => ({
            code: amenity.code,
            count: amenity.quantity || 1
          })) || [],
        roomProductId: item.roomProductId || null,
        salesPlanId: item.salesPlanId,
        primaryGuest: item.primaryGuest
          ? ({
              ...item.primaryGuest,
              phoneInfo:
                item.primaryGuest.phoneCode && item.primaryGuest.phoneNumber
                  ? {
                      phoneCode: item.primaryGuest.phoneCode,
                      phoneNumber: item.primaryGuest.phoneNumber
                    }
                  : null
            } as GuestDto)
          : body.booker,
        priorityCategoryCodeList: [{ codeList: item.matchedFeatureCodeList || [], sequence: 0 }],
        rfcRatePlanCode: '', // don't use this field
        stayOptionCode: '', // don't use this field
        tripPurpose: '', // don't use this field
        channel: 'GV VOICE',

        isLocked: item.isLocked,
        assignedUnitIdList: item.assignedUnitIdList || null
      };

      return result;
    });

    const firstReservationData =
      body.reservationList && body.reservationList.length > 0 ? body.reservationList.at(0) : null;

    if (!firstReservationData) {
      throw new BadRequestException('First reservation data is required');
    }

    const promoCodeList = body.reservationList.map((item) => item.promoCode || '').filter(Boolean);
    const priorityCategoryCodeList = reservations
      .map((item) => item.priorityCategoryCodeList || [])
      .flat();

    body.booker.preferredLanguage = body.bookingLanguage;

    const requestBookingDto: RequestBookingDto = {
      bookingInformation: {
        booker: body.booker,

        reservationList: reservations,
        hotelCode: body.propertyCode,
        guestInformation: reservations?.at(0)?.primaryGuest as any,
        hotelPaymentModeCode: body.hotelPaymentModeCode,
        specialRequest: body.specialRequest || null,
        bookingFlow: BookingFlow.CALL_PRO_PLUS,
        currencyCode: firstReservationData?.currencyCode,
        source: 'OPERATOR',
        bookingPricing: null,

        additionalGuestList:
          body.reservationList?.flatMap((reservation, rIndex) =>
            (reservation.additionalGuestList || [])?.map(
              (guest) =>
                ({
                  firstName: guest.firstName,
                  lastName: guest.lastName,
                  isAdult: guest.isAdult ?? true,
                  address: guest.address,
                  countryId: guest.countryId,
                  city: guest.city,
                  reservationIdx: rIndex
                }) as any
            )
          ) || []
      },

      confirmationType: body.confirmationType,
      hotelCode: body.propertyCode,
      lowestPriceOptionList: [],
      paymentProviderCode: body.paymentProviderCode,
      promoCodeList: promoCodeList,
      translateTo: body.bookingLanguage || null,
      priorityCategoryCodeList: priorityCategoryCodeList,
      creditCardInformation: body.creditCardInformation,
      bookingProposalSettingInput: body.bookingProposalSettingInput
    };

    const booking = await this.requestBooking(requestBookingDto);

    return {
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        booker: {
          firstName: booking.booker.firstName,
          lastName: booking.booker.lastName
        },
        reservationList: booking.reservations.map((reservation) => ({
          id: reservation.id,
          reservationNumber: reservation.reservationNumber,
          roomProductId: reservation.roomProductId,
          roomProductName: reservation.roomProductName,
          roomProductCode: reservation.roomProductCode,
          roomIds: reservation.roomIds
        }))
      }
    };
  }

  async requestBooking(body: RequestBookingDto): Promise<any> {
    const hotel = await this.hotelRepository.getHotelByCode(body.hotelCode);
    this.logger.debug(`Starting request booking for hotel ${hotel.id}`);
    const connector = await this.connectorRepository.getConnector({
      hotelId: hotel.id,
      relations: {
        mappingPmsHotel: true
      }
    });

    this.logger.debug(`Connector found for hotel ${hotel.id}: ${connector?.id}`);
    const roomAvailabilityList = await this.bookingValidatorService.validateBookingRequest(
      body,
      hotel
    );

    this.logger.debug(`Room availability list validated for hotel ${hotel.id}`);
    const reservationAssignedUnitIds = body.bookingInformation.reservationList?.map(
      (r) => r.assignedUnitIdList ?? []
    );
    const roomAvailabilityToUpdate = this.buildRoomAvailabilityList(
      roomAvailabilityList,
      reservationAssignedUnitIds,
      body
    );
    const reservationList = body.bookingInformation.reservationList;
    this.logger.debug(`Room availability to update for hotel ${hotel.id}`);
    const roomProducts = await this.roomProductRepository.find({
      where: {
        id: In(reservationList.map((r) => r.roomProductId))
      },
      relations: {
        roomProductAssignedUnits: true
      },
      select: {
        id: true,
        code: true,
        type: true,
        rfcAllocationSetting: true,
        roomProductAssignedUnits: {
          id: true
        }
      }
    });
    const roomProductsMap = new Map(roomProducts.map((rp) => [rp.id, rp]));
    for (const [index, reservation] of reservationList.entries()) {
      const currentRoomAvailability = roomAvailabilityToUpdate[index];
      const roomAvailability = currentRoomAvailability?.roomAvailability?.length;

      let nights = getNights(new Date(reservation.arrival), new Date(reservation.departure));
      const roomProduct = roomProductsMap.get(reservation.roomProductId || '');
      const isErfcDeductAll =
        roomProduct?.rfcAllocationSetting === RfcAllocationSetting.ALL &&
        roomProduct?.type === RoomProductType.ERFC;
      if (isErfcDeductAll) {
        nights = nights * roomProduct?.roomProductAssignedUnits?.length;
      }
      if (nights !== roomAvailability) {
        throw new BadRequestException('Room availability does not match the number of nights');
      }
    }

    const booking = await this.createBookingService.processBooking(
      body,
      hotel,
      connector,
      roomAvailabilityToUpdate,
      body.translateTo || undefined
    );
    return booking;
  }

  async handleAfterPayment(body: AfterPaymentDto) {
    const { bookingId, isProposalBooking } = body;
    return await this.createBookingService.handleAfterPayment({
      bookingId,
      isProposalBooking,
      isAfterHandleSocketPayment: body.isAfterHandleSocketPayment
    });
  }

  async cppConfirmPaymentBooking(body: ConfirmBookingProposalInputDto): Promise<any> {
    const {
      booking: bookingInput,
      hotelCode,
      hotelId,
      bookingPageUrl,
      browserAgentIp,
      browserInfo,
      creditCardInformation,
      hotelPaymentAccountType,
      translateTo,
      paymentProviderCode,
      // Meta Conversion API tracking fields
      userAgent,
      fbp,
      fbc
    } = body;

    const bookingFrom = BookingForm.ISE;

    if (!hotelCode && !hotelId) {
      throw new BadRequestException('Hotel code or hotel id is required');
    }

    const hotel = await this.hotelRepository.getHotelByIdOrCode(hotelId, hotelCode, {
      baseCurrency: true
    });
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    if (!bookingInput.id) {
      throw new BadRequestException('Booking id is required');
    }

    const booking = await this.bookingRepository.getBooking(bookingInput.id);
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Save Meta Conversion API tracking data if available
    if (browserAgentIp || userAgent || fbp || fbc) {
      const existingMetaTracking = await this.bookingMetaTrackingRepository.getByBookingId(
        booking.id
      );
      if (!existingMetaTracking) {
        await this.bookingMetaTrackingRepository.createMetaTracking({
          bookingId: booking.id,
          browserIp: browserAgentIp ?? null,
          userAgent: userAgent ?? null,
          fbp: fbp ?? null,
          fbc: fbc ?? null
        });
      }
    }

    if (!booking.reservations.length) {
      throw new BadRequestException('Reservations not found');
    }

    const reservationTimeslice = await this.reservationTimeSliceRepository.getReservationTimeSlices(
      booking.reservations.map((reservation) => reservation.id)
    );

    if (!reservationTimeslice.length) {
      throw new BadRequestException('Reservation time slice not found');
    }

    const roomAvailabilityList =
      await this.bookingValidatorService.validateRoomAndProductAvailabilityProposal(
        {
          bookingInformation: {
            reservationList: booking.reservations.map((reservation) => {
              const reservationTimeSlice = reservationTimeslice.find(
                (timeSlice) => timeSlice.reservationId === reservation.id
              );
              return {
                roomProductId: reservation.roomProductId,
                arrival: reservation.arrival ? format(reservation.arrival, DATE_FORMAT) : null,
                departure: reservation.departure
                  ? format(reservation.departure, DATE_FORMAT)
                  : null,
                roomUnitId: reservationTimeSlice?.roomId
              };
            })
          }
        } as any,
        hotel
      );

    const roomAvailabilityToUpdate = this.buildRoomAvailabilityList(roomAvailabilityList);
    for (const [index, reservation] of booking.reservations.entries()) {
      let roomAvailabilityDates: any[] = (
        roomAvailabilityToUpdate[index]?.roomAvailability || []
      ).map((room) => room.date);
      roomAvailabilityDates = [...new Set(roomAvailabilityDates || [])];
      const roomAvailability = roomAvailabilityDates?.length;
      const nights = getNights(reservation.arrival, reservation.departure);
      if (nights !== roomAvailability) {
        throw new BadRequestException('Room availability does not match the number of nights');
      }
    }

    const connector = await this.connectorRepository.getConnector({
      hotelId: hotel.id,
      relations: {
        mappingPmsHotel: true
      }
    });
    const [globalPaymentProvider, globalPaymentMethod] = await Promise.all([
      this.globalPaymentProviderRepository.getGlobalPaymentProvider({
        code: paymentProviderCode ?? ''
      }),
      this.globalPaymentMethodRepository.getGlobalPaymentMethod({
        code: bookingInput.hotelPaymentModeCode ?? ''
      })
    ]);
    const propertyPaymentMethodSetting =
      await this.hotelPaymentMethodSettingRepository.getHotelPaymentMethodSetting({
        hotelId: hotel.id,
        globalPaymentProviderId: globalPaymentProvider?.id,
        globalPaymentMethodId: globalPaymentMethod?.id
      });

    if (!bookingInput.booker) {
      throw new BadRequestException('Booker is required');
    }

    const booker = await this.guestRepository.createGuest(bookingInput.booker, hotel.id, true);

    for (const reservation of booking.reservations) {
      const inputReservation = bookingInput.reservationList?.find(
        (inputReservation) => inputReservation.reservationNumber === reservation.reservationNumber
      );
      const newGuests: GuestDto[] = [];
      if (inputReservation?.primaryGuest) {
        const primaryGuestId = inputReservation.primaryGuest.id || uuidv4();
        newGuests.push({
          ...inputReservation.primaryGuest,
          hotelId: hotel.id,
          id: primaryGuestId,
          isMainGuest: true,
          isBooker: booker.id === primaryGuestId
        });
      }

      if (inputReservation?.additionalGuestList?.length) {
        const additionalGuests: any[] = inputReservation.additionalGuestList.map((guest) => ({
          ...guest,
          hotelId: hotel.id,
          id: guest.id || uuidv4()
        }));
        newGuests.push(...additionalGuests);
        reservation.additionalGuests = JSON.stringify(additionalGuests);
      }

      reservation.hotelPaymentModeCode = bookingInput.hotelPaymentModeCode || null;
      await this.guestRepository.createAdditionalGuestsV2(newGuests, hotel.id);
    }

    await this.reservationRepository.updateReservations(booking.reservations);

    // const additionalGuests: Partial<Guest>[] = [];

    // for (const additionalGuest of bookingInput.additionalGuestList || []) {
    //   if (additionalGuest && !additionalGuest.id) {
    //     additionalGuests.push({
    //       firstName: additionalGuest.firstName ?? '',
    //       lastName: additionalGuest.lastName ?? '',
    //       hotelId: hotel.id
    //     });
    //   }
    // }

    const reservationTimeSlices =
      await this.reservationTimeSliceRepository.getReservationTimeSlices(
        booking.reservations.map((reservation) => reservation.id)
      );

    const mappingHotel = await this.mappingPmsHotelRepository.getMappingPmsHotel({
      hotelId: hotel.id
    });

    if (!hotel.baseCurrency) {
      throw new BadRequestException('Hotel base currency not found');
    }

    await this.bookingProposalSettingRepository.update(booking.id, {
      deletedAt: new Date()
    });

    await this.reservationRepository.updateReservationStatus(
      booking.reservations.map((reservation) => reservation.id),
      ReservationStatusEnum.CONFIRMED,
      true
    );

    // await this.bookingRepository.updateBooking({
    //   id: booking.id,
    //   acceptTnc: acceptTnc || false
    // });
    let bookingTransaction: BookingTransaction | null = null;
    if (paymentProviderCode === PaymentProviderCodeEnum.PAYPAL) {
      bookingTransaction = await this.createBookingService.requestBookingPayment({
        booking,
        propertyPaymentMethodSetting,
        hotel,
        connector,
        booker: booker,
        guest: booker,
        currencyCode: hotel.baseCurrency.code,
        mappingHotel,
        bookingInput: {
          bookingInformation: {
            reservationList: booking.reservations.map((reservation) => ({
              roomProductId: reservation.roomProductId ?? '',
              arrival: reservation.arrival?.toISOString() ?? '',
              departure: reservation.departure?.toISOString() ?? '',
              adult: reservation.adults ?? 0,
              childrenAgeList: reservation.childrenAges ?? [],
              pets: reservation.pets ?? 0,
              amenityList: []
            })),
            hotelPaymentModeCode: bookingInput.hotelPaymentModeCode ?? ''
          },
          creditCardInformation: {
            cardHolder: creditCardInformation?.cardHolder ?? null,
            cardNumber: creditCardInformation?.cardNumber ?? null,
            cvv: creditCardInformation?.cvv ?? null,
            expiryMonth: creditCardInformation?.expiryMonth ?? null,
            expiryYear: creditCardInformation?.expiryYear ?? null,
            refPaymentMethodId: creditCardInformation?.refPaymentMethodId ?? null,
            type: creditCardInformation?.type ?? null
          },
          translateTo: translateTo ?? LanguageCodeEnum.EN,
          paymentProviderCode: globalPaymentProvider?.code,
          ...body
        } as unknown as RequestBookingDto,
        reservationTimeSlices,
        roomProductList: roomAvailabilityList,
        bookingFrom,
        isProposalBooking: true
      });

      return {
        booking: {
          ...booking,
          orderId: bookingTransaction?.transactionNumber ?? null
        }
      };
    }

    this.createBookingService.requestBookingPayment({
      booking,
      propertyPaymentMethodSetting,
      hotel,
      connector,
      booker,
      guest: booker,
      currencyCode: hotel.baseCurrency.code,
      mappingHotel,
      bookingInput: {
        bookingInformation: {
          reservationList: booking.reservations.map((reservation) => ({
            roomProductId: reservation.roomProductId ?? '',
            arrival: reservation.arrival?.toISOString() ?? '',
            departure: reservation.departure?.toISOString() ?? '',
            adult: reservation.adults ?? 0,
            childrenAgeList: reservation.childrenAges ?? [],
            pets: reservation.pets ?? 0,
            amenityList: []
          })),
          hotelPaymentModeCode: bookingInput.hotelPaymentModeCode ?? ''
        },
        creditCardInformation: {
          cardHolder: creditCardInformation?.cardHolder ?? null,
          cardNumber: creditCardInformation?.cardNumber ?? null,
          cvv: creditCardInformation?.cvv ?? null,
          expiryMonth: creditCardInformation?.expiryMonth ?? null,
          expiryYear: creditCardInformation?.expiryYear ?? null,
          refPaymentMethodId: creditCardInformation?.refPaymentMethodId ?? null,
          type: creditCardInformation?.type ?? null
        },
        translateTo: translateTo ?? LanguageCodeEnum.EN,
        paymentProviderCode: globalPaymentProvider?.code,
        ...body
      } as unknown as RequestBookingDto,
      reservationTimeSlices,
      roomProductList: roomAvailabilityList,
      bookingFrom,
      isProposalBooking: true
    });

    return booking;
  }

  private buildRoomAvailabilityList(
    roomAvailabilityList: RoomAvailabilityDto[],
    reservationAssignedUnitIds?: string[][],
    body?: RequestBookingDto
  ) {
    // Since the first item in roomAvailabilityList is already the lowest price,
    // we don't need to call rfcRoomBasePriceViewService.getRfcRoomBasePriceView
    const result = roomAvailabilityList.map((item, index) => {
      const assignedUnitIds = reservationAssignedUnitIds?.[index] || [];
      const allUnitIds = item.roomIdsGroup?.map((room) => room.id);
      const roomIds = this.getRoomIds(item, assignedUnitIds);
      if (body) {
        body.bookingInformation.reservationList[index].alternativeUnitIds = allUnitIds?.filter(
          (id) => !roomIds?.includes(id)
        );
      }
      return {
        roomProductId: item.roomProductId,
        roomProductName: item.roomProductName,
        roomProductCode: item.roomProductCode,
        isErfcDeduct: item.isErfcDeduct,
        roomIds: roomIds,
        roomAvailability: this.getRoomAvailability(item, assignedUnitIds)
      };
    }) as RoomAvailabilityDto[];

    return result;
  }

  private getRoomIds(item: RoomAvailabilityDto, assignedUnitIds: string[]) {
    // If assigned unit ids are provided, return the room ids that are assigned
    if (assignedUnitIds.length) {
      return item.roomIdsGroup
        ?.filter((room) => assignedUnitIds.includes(room.id))
        .map((room) => room.id);
    }

    if (item.roomProductCode?.startsWith('RFC')) {
      return [item.roomIdsGroup?.[0]?.id];
    }

    if (item.roomProductCode?.startsWith('ERFC') && !item.isErfcDeduct) {
      return item.roomIdsGroup?.map((room) => room.id);
    }

    // For other cases (not RFC and not ERFC without deduct),
    // since the first item is already the lowest price, use the first room
    return item.roomIdsGroup?.length ? [item.roomIdsGroup[0].id] : [];
  }

  private getRoomAvailability(item: RoomAvailabilityDto, assignedUnitIds: string[]): any[] {
    // If assigned unit ids are provided, return the room availability that are assigned
    if (assignedUnitIds.length) {
      return (
        item.roomIdsGroup
          ?.filter((room) => assignedUnitIds.includes(room.id))
          .flatMap((room) => room.roomAvailabilityList) ?? []
      );
    }

    if (item.roomProductCode?.startsWith('RFC')) {
      return item.roomIdsGroup?.[0]?.roomAvailabilityList ?? [];
    }

    if (item.roomProductCode?.startsWith('ERFC') && !item.isErfcDeduct) {
      return item.roomIdsGroup?.flatMap((room) => room.roomAvailabilityList) ?? [];
    }

    // Since the first item is already the lowest price, use the first room's availability
    return item.roomIdsGroup?.[0]?.roomAvailabilityList ?? [];
  }

  async getBookingDetails(filter: BookingFilterDto) {
    try {
      const { relations } = filter;
      if (!relations?.length) {
        filter.relations = [
          'booker',
          'reservations',
          'reservation.reservationRooms',
          'bookingTransactions'
        ];
      }
      const bookings = await this.bookingRepository.getBookings(filter);
      const roomIds = bookings
        .flatMap(
          (booking) =>
            booking.reservations?.flatMap(
              (reservation) =>
                reservation.reservationRooms?.map((reservationRoom) => reservationRoom.roomId) || []
            ) || []
        )
        .filter((roomId) => !!roomId);
      let roomUnits: RoomUnit[] = [];
      if (roomIds?.length) {
        roomUnits = await this.roomUnitRepository.find({
          where: {
            id: In(roomIds)
          }
        });
      }

      const roomUnitsMap = new Map(roomUnits.map((roomUnit) => [roomUnit.id, roomUnit]));
      const mappedBookings = bookings.map((booking) =>
        this.mapBookingToTargetFormat(booking, roomUnitsMap)
      );
      return mappedBookings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private mapBookingToTargetFormat(booking: Booking, roomUnitsMap: Map<string, RoomUnit>) {
    // Calculate totals from reservations
    const totalBaseAmount =
      booking.reservations?.reduce((sum, res) => sum + (res.totalBaseAmount || 0), 0) || null;
    const totalGrossAmount =
      booking.reservations?.reduce((sum, res) => sum + (res.totalGrossAmount || 0), 0) || null;
    const serviceChargeAmount =
      booking.reservations?.reduce((sum, res) => sum + (res.serviceChargeAmount || 0), 0) || null;
    const taxAmount =
      booking.reservations?.reduce((sum, res) => sum + (res.taxAmount || 0), 0) || null;
    const balance = booking.reservations?.reduce((sum, res) => sum + (res.balance || 0), 0) || null;

    // Calculate total adults and children
    const totalAdult = booking.reservations?.reduce((sum, res) => sum + (res.adults || 0), 0) || 0;
    const totalChildren =
      booking.reservations?.reduce((sum, res) => {
        const childrenAges = res.childrenAges || [];
        return sum + childrenAges.length;
      }, 0) || 0;

    // Get arrival and departure from first reservation
    const firstReservation = booking.reservations?.[0];
    const arrival = firstReservation?.arrival ? firstReservation.arrival.toISOString() : null;
    const departure = firstReservation?.departure ? firstReservation.departure.toISOString() : null;
    const bookingLanguage = firstReservation?.bookingLanguage || null;
    const bookingFlow = firstReservation?.bookingFlow || null;
    const hotelPaymentModeCode = firstReservation?.hotelPaymentModeCode || null;

    // Map reservations
    const reservationList =
      booking.reservations?.map((reservation) => ({
        id: reservation.id,
        status: reservation.status,
        reservationRoomList:
          reservation.reservationRooms?.map((reservationRoom) => {
            const roomUnit = roomUnitsMap.get(reservationRoom.roomId || '');
            return {
              room: {
                roomNumber: roomUnit?.roomNumber || ''
              }
            };
          }) || []
      })) || [];

    // Map booker
    const booker = booking.booker
      ? {
          firstName: booking.booker.firstName || '',
          lastName: booking.booker.lastName || ''
        }
      : null;

    // Parse metadata if it exists
    let bookingMetadataList = [];
    try {
      if (booking.metadata) {
        bookingMetadataList = JSON.parse(booking.metadata);
      }
    } catch (e) {
      // If metadata is not valid JSON, keep as empty array
      bookingMetadataList = [];
    }

    return {
      id: booking.id,
      specialRequest: booking.specialRequest,
      bookingLanguage: bookingLanguage,
      bookingNumber: booking.bookingNumber || '',
      totalBaseAmount: totalBaseAmount,
      totalGrossAmount: totalGrossAmount,
      serviceChargeAmount: serviceChargeAmount,
      taxAmount: taxAmount,
      balance: balance,
      status: firstReservation?.status || '',
      bookingFlow: bookingFlow,
      hotelPaymentModeCode: hotelPaymentModeCode,
      hotelPaymentMode: null, // This might need to be fetched from a separate table
      totalAdult: totalAdult,
      totalChildren: totalChildren,
      reservationList: reservationList,
      bookingMetadataList: bookingMetadataList,
      guaranteeType: null, // This might need to be mapped from payment terms or other fields
      arrival: arrival,
      departure: departure,
      booker: booker,
      bookingTransactionList: booking.bookingTransactions || []
    };
  }

  async getBookingOverview(filter: BookingFilterDto) {
    const { relations } = filter;
    if (!relations?.length) {
      filter.relations = ['reservations'];
    }
    try {
      const bookings = await this.bookingRepository.getBookings(filter);
      const mappedBookings = bookings.map((booking) => ({
        reservationList:
          booking.reservations?.map((reservation) => ({
            id: reservation.id,
            reservationNumber: reservation.reservationNumber
          })) || [],
        isBookForSomeoneElse: booking.isBookForSomeoneElse || false,
        createdDate: booking.createdAt?.toISOString() || null,
        updatedDate: booking.updatedAt?.toISOString() || null
      }));
      return mappedBookings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getBookerInfo(filter: BookingFilterDto) {
    try {
      const { relations } = filter;
      if (!relations?.length) {
        filter.relations = ['booker', 'booker.country', 'reservations'];
      }
      const bookings = await this.bookingRepository.getBookings(filter);
      const bookers = bookings.map((booking) => {
        const booker = booking.booker;
        const reservation = booking.reservations?.[0];
        return {
          id: booker.id,
          firstName: booker.firstName,
          lastName: booker.lastName,
          emailAddress: booker.emailAddress,
          address: booker.address,
          countryId: booker.countryId,
          country: booker.country
            ? {
                name: booker.country.name
              }
            : null,
          city: booker.city,
          postalCode: booker.postalCode,
          phoneNumber: booker.phoneNumber,
          countryNumber: booker.countryNumber,
          title: null, // Not available in Guest entity
          gender: null, // Not available in Guest entity
          preferredLanguage: reservation?.bookingLanguage || LanguageCodeEnum.EN, // Not available in Guest entity - could be derived from booking language
          state: booker.state
        };
      });

      return bookers;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateBookerInfo(bookingNumber: string, input: UpdateBookingBookerInfoDto) {
    try {
      const booking = await this.bookingRepository.getBookingByNumber(bookingNumber);
      if (!booking) {
        throw new BadRequestException(`Booking not found with booking number ${bookingNumber}`);
      }
      await this.guestRepository.upsertGuests([input]);
      // sync APALEO primary guest to apaleo
      const guest = await this.guestRepository.findOne({ id: input.id });
      const hotelId = guest?.hotelId;
      if (hotelId) {
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
        const apaleoGuest = await this.reservationService.buildApaleoGuest(input);
        // SYNC BOOKER
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
        // SYNC RESERVATIONS PRIMARY GUEST
        if (!booking.isBookForSomeoneElse) {
          for (const reservation of booking.reservations ?? []) {
            if (reservation.mappingReservationCode) {
              try {
                await this.apaleoService.syncReservationPrimaryGuest(
                  accessToken,
                  reservation.mappingReservationCode ?? '',
                  apaleoGuest
                );
                this.logger.log(
                  `Sync reservation primary guest successfully: ${reservation.mappingReservationCode}`
                );
              } catch (error) {
                this.logger.error(`Sync reservation primary guest failed: ${error?.message}`);
              }
            }
          }
        }
      }
      return {
        status: ResponseStatusEnum.SUCCESS,
        message: 'Booker info updated successfully',
        data: true
      };
    } catch (error) {
      throw new BadRequestException('Failed to update booker info');
    }
  }

  async getBookingPaymentMethods(filter: BookingFilterDto) {
    try {
      const { relations } = filter;
      if (!relations?.length) {
        filter.relations = ['bookingTransactions', 'bookingTransaction.paymentMethod'];
      }
      const bookings = await this.bookingRepository.getBookings(filter);
      const paymentMethods = bookings.flatMap((booking) => {
        return booking.bookingTransactions.map((transaction) => {
          return {
            paymentMethod: transaction.paymentMethod,
            bookingTransaction: transaction
          };
        });
      });
      return paymentMethods;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
