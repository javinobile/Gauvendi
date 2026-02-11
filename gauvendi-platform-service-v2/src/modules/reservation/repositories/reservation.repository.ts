import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { DB_NAME } from '@src/core/constants/db.const';
import { Filter } from '@src/core/dtos/common.dto';
import { Guest } from '@src/core/entities/booking-entities/guest.entity';
import {
  Reservation,
  ReservationStatusEnum
} from '@src/core/entities/booking-entities/reservation.entity';
import { HotelTax } from '@src/core/entities/hotel-entities/hotel-tax.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import {
  ReservationFilterDateType,
  RfcAllocationSetting,
  RoomProductType
} from '@src/core/enums/common';
import { BadRequestException } from '@src/core/exceptions';
import { BaseService } from '@src/core/services/base.service';
import { convertToUtcDate, setTimeFromTimeSlice } from '@src/core/utils/datetime.util';
import { ReservationDto } from '@src/modules/booking/dtos/booking-information.dto';
import { BookingForm } from '@src/modules/booking/dtos/booking.dto';
import { CppBookingConfirmationType } from '@src/modules/booking/dtos/cpp-request-booking.dto';
import { GuestRepository } from '@src/modules/guest/repositories/guest.repository';
import {
  Brackets,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  Not,
  Repository
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateReservationDto,
  ReservationChannelFilterDto,
  ReservationManagementFilterDto,
  ReservationSourceFilterDto
} from '../dtos/reservation.dto';
import { ReservationNotesService } from '../services/reservation-notes.service';

@Injectable()
export class ReservationRepository extends BaseService {
  private readonly logger = new Logger(ReservationRepository.name);

  constructor(
    @InjectRepository(Reservation, DbName.Postgres)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(HotelTax, DB_NAME.POSTGRES)
    private hotelTaxRepository: Repository<HotelTax>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    private readonly reservationNotesService: ReservationNotesService,
    private readonly guestRepository: GuestRepository,
    configService: ConfigService
  ) {
    super(configService);
  }

  async createReservations(body: CreateReservationDto): Promise<Reservation[]> {
    try {
      const {
        bookingInput,
        hotel,
        booking,
        company,
        guest,
        timeSlice,
        additionalGuestList,
        cancelPolicyCodes,
        roomAvailability
      } = body;
      const reservationList = bookingInput.bookingInformation.reservationList;
      const booker = booking.booker;
      const bookingFrom = bookingInput.bookingFrom;

      const roomProductIds = reservationList.map((reservation) => reservation.roomProductId);

      let taxCodes: string[] = [];
      for (const reservation of reservationList) {
        if (reservation.amenityPricingList?.length) {
          for (const amenityPricing of reservation.amenityPricingList) {
            if (amenityPricing?.taxDetailsMap) {
              taxCodes.push(...Object.keys(amenityPricing.taxDetailsMap));
            }
          }
        }
        if (reservation.reservationPricing?.taxDetailsMap) {
          taxCodes.push(...Object.keys(reservation.reservationPricing.taxDetailsMap));
        }
      }

      taxCodes = [...new Set(taxCodes)];

      const priorityCategoryCodes = Array.from(
        new Set(
          reservationList.flatMap(
            (reservation) =>
              reservation.priorityCategoryCodeList?.flatMap(
                (priorityCategoryCode) => priorityCategoryCode.codeList
              ) || []
          )
        )
      );

      const [hotelTaxes, roomProducts, hotelRetailFeatures] = await Promise.all([
        this.hotelTaxRepository.find({
          where: {
            code: In(taxCodes)
          }
        }),
        this.roomProductRepository.find({
          where: {
            hotelId: hotel.id,
            id: In(roomProductIds),
            deletedAt: IsNull()
          },
          relations: {
            roomProductRetailFeatures: true
          },
          select: {
            id: true,
            isLockedUnit: true,
            roomProductRetailFeatures: true,
            code: true,
            rfcAllocationSetting: true,
            type: true
          }
        }),
        priorityCategoryCodes && priorityCategoryCodes.length
          ? this.hotelRetailFeatureRepository.find({
              where: {
                hotelId: hotel.id,
                code: In(priorityCategoryCodes)
              },
              select: {
                id: true,
                code: true
              }
            })
          : Promise.resolve([])
      ]);

      const roomProductsMap = new Map(
        roomProducts.map((roomProduct) => [roomProduct.id, roomProduct])
      );
      const hotelTaxMap = new Map(hotelTaxes.map((hotelTax) => [hotelTax.code, hotelTax]));

      const reservations: Partial<Reservation>[] = [];
      let count = 0;
      for (const [index, reservation] of reservationList?.entries()) {
        count++;
        const roomAvaiOfReservation = roomAvailability[index] || [];
        const isErfcDeductAll =
          roomAvaiOfReservation?.roomProductCode?.startsWith('ERFC') &&
          !roomAvaiOfReservation?.isErfcDeduct;
        const roomAvailabilityDates: any[] = (roomAvaiOfReservation?.roomAvailability || []).map(
          (room) => room.date
        );

        // Create arrival date with check-in time from timeSlice.CI
        const arrival = convertToUtcDate(
          hotel.timeZone ?? 'UTC',
          setTimeFromTimeSlice(reservation.arrival, timeSlice?.CI)
        );

        const departure = convertToUtcDate(
          hotel.timeZone ?? 'UTC',
          setTimeFromTimeSlice(reservation.departure, timeSlice?.CO)
        );

        const roomProduct = roomProductsMap.get(reservation.roomProductId || '');
        if (!roomProduct) {
          throw new BadRequestException('Room product not found');
        }
        let isLocked = false;
        if (reservation.isLocked !== undefined && reservation.isLocked !== null) {
          isLocked = reservation.isLocked;
        } else {
          isLocked = roomProduct.isLockedUnit || false;
        }

        const taxDetails = this.buildTaxDetails({ reservation, hotelTaxMap });
        const cityTaxDetails = this.buildCityTaxDetails({ reservation });

        const priorityCategories = hotelRetailFeatures.filter((item) =>
          priorityCategoryCodes.includes(item.code)
        );

        const roomProductFeatureIds = roomProduct.roomProductRetailFeatures?.map(
          (feature) => feature.retailFeatureId
        );

        const matchedPriorityCategories = priorityCategories.filter((item) =>
          roomProductFeatureIds.includes(item.id)
        );

        const mismatchedPriorityCategories = priorityCategories.filter(
          (item) => !roomProductFeatureIds.includes(item.id)
        );

        if (!isErfcDeductAll) {
          const statusObj = {
            [CppBookingConfirmationType.PROPOSE]: ReservationStatusEnum.PROPOSED,
            [CppBookingConfirmationType.RESERVE]: ReservationStatusEnum.RESERVED,
            [CppBookingConfirmationType.CONFIRM]: ReservationStatusEnum.CONFIRMED
          };
          let status =
            statusObj[bookingInput.confirmationType || CppBookingConfirmationType.RESERVE];
          if (bookingInput.bookingProposalSettingInput) {
            status = ReservationStatusEnum.PROPOSED;
          }

          let primaryGuest;
          if (bookingFrom !== BookingForm.ISE) {
            if (reservation?.primaryGuest?.isBooker) {
              primaryGuest = booker;
            } else {
              primaryGuest = await this.guestRepository.createGuest(
                reservation?.primaryGuest,
                hotel.id
              );
            }
          }
          let balance = reservation?.reservationPricing?.totalGrossAmount;
          // no need this one, because booking from CPP no charge amount (It will be updated in flow confirm booking from ISE or Credit card payment success)
          // switch (status) {
          //   case ReservationStatusEnum.PROPOSED:
          //   case ReservationStatusEnum.RESERVED:
          //   case ReservationStatusEnum.CONFIRMED: {
          //     balance = reservation.reservationPricing?.totalGrossAmount;
          //     break;
          //   }
          //   default:
          //     break;
          // }

          const newReservation: Partial<Reservation> = {
            id: uuidv4(),
            hotelId: hotel.id,
            bookingId: booking.id,
            reservationNumber: `${booking.bookingNumber}${count.toString().padStart(2, '0')}`,
            tripPurpose: reservation.tripPurpose,
            mappingReservationCode: null, // TODO
            mappingChannelReservationCode: null, // TODO
            arrival: arrival,
            departure: departure,
            bookingFlow: bookingInput.bookingInformation.bookingFlow,
            channel: reservation.channel ?? 'GV SALES ENGINE',
            source: bookingInput.bookingInformation.source,
            status: status,
            bookingLanguage: bookingInput.translateTo ?? 'EN',
            ratePlanId: reservation.salesPlanId ?? null,
            marketSegmentId: null, // TODO
            ratePlanType: null, // TODO
            roomProductId: reservation.roomProductId ?? null,
            adults: reservation.adult,
            childrenAges: reservation.childrenAgeList,
            pets: reservation.pets,
            primaryGuestId: guest?.id ?? primaryGuest?.id ?? body.booking?.booker?.id,
            primaryGuest: primaryGuest,
            additionalGuests: JSON.stringify(additionalGuestList[index] || []),
            companyId: company?.id ?? null,
            totalBaseAmount: reservation.reservationPricing?.totalBaseAmount ?? null,
            taxAmount: reservation.reservationPricing?.taxAmount ?? null,
            cityTaxAmount: reservation.reservationPricing?.cityTaxAmount ?? null,
            serviceChargeAmount: 0,
            totalGrossAmount: reservation.reservationPricing?.totalGrossAmount ?? null,
            payOnConfirmationAmount:
              reservation.reservationPricing?.payOnConfirmationAmount ?? null,
            payAtHotelAmount: reservation.reservationPricing?.payAtHotelAmount ?? null,
            balance: balance,
            bookingDate: new Date(),
            releasedDate: null,
            cancelledBy: null,
            cancelledDate: null,
            cancelledReason: null,
            cancellationFee: null,
            cxlPolicyCode: cancelPolicyCodes.get(reservation.salesPlanId ?? '') ?? null,
            noShowFee: null,
            matchedFeature: JSON.stringify(matchedPriorityCategories.map((item) => item.code)),
            mismatchedFeature: JSON.stringify(
              mismatchedPriorityCategories.map((item) => item.code)
            ),

            currencyCode: bookingInput.bookingInformation.bookingPricing?.currencyCode ?? null,
            paymentTermCode: reservation.paymentTermCode,
            hotelPaymentModeCode: bookingInput.bookingInformation.hotelPaymentModeCode,
            promoCode: JSON.stringify(bookingInput.promoCodeList || []),
            hourPrior: null,
            isLocked: isLocked,
            note: null,
            createdBy: this.currentSystem,
            createdAt: new Date(),
            updatedBy: this.currentSystem,
            updatedAt: new Date(),
            deletedAt: null,
            taxDetails: taxDetails,
            cityTaxDetails: cityTaxDetails,
            guestNote: null
          };

          reservations.push(newReservation);
          continue;
        }

        const { reservationsForERFC, newCount } = await this.createReservationsForERFC({
          reservation: reservation,
          body: body,
          roomAvailabilityDates: roomAvailabilityDates,
          arrival: arrival,
          departure: departure,
          additionalGuests: additionalGuestList[index],
          isLocked: isLocked,
          taxDetails: taxDetails,
          cityTaxDetails: cityTaxDetails,
          count: count
        });

        count = newCount - 1;
        reservations.push(...reservationsForERFC);
      }

      let currentIndex = 0;
      let previousIsErfcDeductAll = true;
      for (const [index, reservation] of reservations.entries()) {
        const roomProduct = roomProductsMap.get(reservation.roomProductId || '');
        const isErfcDeductAll =
          roomProduct?.type === RoomProductType.ERFC &&
          roomProduct?.rfcAllocationSetting === RfcAllocationSetting.ALL;
        if ((!isErfcDeductAll || !previousIsErfcDeductAll) && index !== 0) {
          currentIndex++;
        }
        previousIsErfcDeductAll = isErfcDeductAll;

        const alternativeUnitIds =
          bookingInput.bookingInformation.reservationList[currentIndex]?.alternativeUnitIds || [];
        const reservationNotes = await this.reservationNotesService.generateNotes(
          booking,
          reservation as Reservation,
          hotel,
          isErfcDeductAll ? [] : alternativeUnitIds
        );
        reservation.note = reservationNotes;
      }

      const result: Reservation[] = [];
      for (const reservation of reservations) {
        const data = await this.reservationRepository.save(reservation);
        result.push(data);
      }

      for (const savedReservation of result) {
        const inputReservation = reservations.find(
          (reservation) => reservation.id === savedReservation.id
        );
        if (inputReservation) {
          savedReservation.primaryGuest = inputReservation.primaryGuest || booking.booker;
        }
      }

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async createReservationsForERFC(input: {
    reservation: ReservationDto;
    body: CreateReservationDto;
    roomAvailabilityDates: string[];
    arrival: Date;
    departure: Date;
    additionalGuests: Partial<Guest>[];
    isLocked: boolean;
    taxDetails: any;
    cityTaxDetails: any[];
    count: number;
  }) {
    const {
      reservation,
      body,
      roomAvailabilityDates,
      arrival,
      departure,
      isLocked,
      taxDetails,
      cityTaxDetails,
      count,
      additionalGuests
    } = input;
    const { booking, hotel, bookingInput, company, guest, cancelPolicyCodes } = body;
    const booker = booking.booker;
    let additionalAdultGuests: Partial<Guest>[] = [];
    let additionalChildrenGuests: Partial<Guest>[] = [];
    let reservations: Partial<Reservation>[] = [];
    let newCount = count;
    try {
      for (const guest of additionalGuests || []) {
        if (guest['isAdult']) {
          additionalAdultGuests.push(guest);
          continue;
        }

        additionalChildrenGuests.push(guest);
      }
      // Create a reservation for ERFC Deduct All
      const firstDate = roomAvailabilityDates[0];
      const countDuplicateDate = roomAvailabilityDates?.filter(
        (date) => date === firstDate
      )?.length;
      const totalReservations = countDuplicateDate;

      // Helper function to distribute guest counts evenly
      const distributeGuestCount = (totalCount: number, totalParts: number): number[] => {
        const baseCount = Math.floor(totalCount / totalParts);
        const remainder = totalCount % totalParts;
        const counts = Array(totalParts).fill(baseCount);

        // Distribute remainder to first few reservations
        for (let i = 0; i < remainder; i++) {
          counts[i] += 1;
        }

        return counts;
      };

      // Helper function to distribute children ages evenly
      const distributeChildrenAges = (
        childrenAgeList: number[],
        totalParts: number
      ): number[][] => {
        const result: number[][] = Array(totalParts)
          .fill(null)
          .map(() => []);

        // Distribute children ages round-robin style
        childrenAgeList.forEach((age, index) => {
          const reservationIndex = index % totalParts;
          result[reservationIndex].push(age);
        });

        return result;
      };

      // Distribute guest information across reservations
      const adultsDistribution = distributeGuestCount(reservation.adult, totalReservations);
      const petsDistribution = distributeGuestCount(reservation.pets, totalReservations);
      const childrenAgesDistribution = distributeChildrenAges(
        reservation.childrenAgeList || [],
        totalReservations
      );

      const totalBaseAmount =
        (reservation.reservationPricing?.totalBaseAmount ?? 0) / totalReservations;
      const totalTaxAmount = (reservation.reservationPricing?.taxAmount ?? 0) / totalReservations;
      const totalCityTaxAmount =
        (reservation.reservationPricing?.cityTaxAmount ?? 0) / totalReservations;
      const totalGrossAmount =
        (reservation.reservationPricing?.totalGrossAmount ?? 0) / totalReservations;
      const payOnConfirmationAmount =
        (reservation.reservationPricing?.payOnConfirmationAmount ?? 0) / totalReservations;
      const payAtHotelAmount =
        (reservation.reservationPricing?.payAtHotelAmount ?? 0) / totalReservations;
      const balance =
        (reservation.reservationPricing?.totalGrossAmount ?? 0) -
        (reservation.reservationPricing?.payOnConfirmationAmount ?? 0) / totalReservations;

      const commonReservationInfo: Partial<Reservation> = {
        hotelId: hotel.id,
        bookingId: booking.id,
        tripPurpose: reservation.tripPurpose,
        mappingReservationCode: null, // TODO
        mappingChannelReservationCode: null, // TODO
        arrival: arrival,
        departure: departure,
        bookingFlow: bookingInput.bookingInformation.bookingFlow,
        channel: reservation.channel ?? 'GV SALES ENGINE',
        source: bookingInput.bookingInformation.source,
        status: ReservationStatusEnum.RESERVED,
        bookingLanguage: bookingInput.translateTo ?? 'EN',
        ratePlanId: reservation.salesPlanId ?? null,
        marketSegmentId: null, // TODO
        ratePlanType: null, // TODO
        roomProductId: reservation.roomProductId ?? null,
        companyId: company?.id ?? null,
        totalBaseAmount: totalBaseAmount,
        taxAmount: totalTaxAmount,
        cityTaxAmount: totalCityTaxAmount,
        serviceChargeAmount: 0,
        totalGrossAmount: totalGrossAmount,
        payOnConfirmationAmount: payOnConfirmationAmount,
        payAtHotelAmount: payAtHotelAmount,
        balance: balance,
        bookingDate: booking.createdAt,
        releasedDate: null,
        cancelledBy: null,
        cancelledDate: null,
        cancelledReason: null,
        cancellationFee: null,
        cxlPolicyCode: cancelPolicyCodes.get(reservation.salesPlanId ?? '') ?? null,
        noShowFee: null,
        matchedFeature: JSON.stringify(
          reservation.priorityCategoryCodeList?.flatMap(
            (priorityCategoryCode) => priorityCategoryCode.codeList
          ) || []
        ),
        currencyCode: bookingInput.bookingInformation.bookingPricing?.currencyCode ?? null,
        paymentTermCode: reservation.paymentTermCode,
        hotelPaymentModeCode: bookingInput.bookingInformation.hotelPaymentModeCode,
        promoCode: JSON.stringify(bookingInput.promoCodeList || []),
        hourPrior: null,
        isLocked: isLocked,
        note: null,
        createdBy: this.currentSystem,
        updatedBy: this.currentSystem,
        taxDetails: taxDetails,
        cityTaxDetails: cityTaxDetails.map((cityTax) => ({
          ...cityTax,
          amount: cityTax.amount / totalReservations
        })),
        deletedAt: null,
        mismatchedFeature: null,
        guestNote: null
      };

      Array.from({ length: totalReservations }).forEach((_, reservationIndex) => {
        const adults = adultsDistribution[reservationIndex];
        const pets = petsDistribution[reservationIndex];
        const childrenAges = childrenAgesDistribution[reservationIndex];
        const adultsAdditionalCount = reservationIndex === 0 ? adults - 1 : adults;
        const newAdditionalGuests = [
          ...(reservationIndex === 0 ? [guest] : []),
          ...(additionalAdultGuests.slice(0, adultsAdditionalCount) || []),
          ...(additionalChildrenGuests.slice(0, childrenAges.length) || [])
        ];
        const newPrimaryGuest = newAdditionalGuests[0] || guest || booker;
        additionalAdultGuests = additionalAdultGuests.slice(adultsAdditionalCount);
        additionalChildrenGuests = additionalChildrenGuests.slice(childrenAges.length);
        const realadditionalGuests = newAdditionalGuests.slice(1) || [];
        const additionalGuestsStr = JSON.stringify(realadditionalGuests);
        const newReservation: Partial<Reservation> = {
          ...commonReservationInfo,
          id: uuidv4(),
          reservationNumber: `${booking.bookingNumber}${newCount.toString().padStart(2, '0')}`,
          adults: adults,
          pets: pets,
          childrenAges: childrenAges,
          additionalGuests: additionalGuestsStr,
          primaryGuestId: newPrimaryGuest?.id,
          primaryGuest: newPrimaryGuest as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        reservations.push(newReservation);
        newCount++;
      });

      return { reservationsForERFC: reservations, newCount: newCount };
    } catch (error) {
      this.logger.error(`Error creating reservations for ERFC: ${error?.message}`);
      return { reservationsForERFC: reservations, newCount: newCount };
    }
  }

  async updateReservationStatus(
    reservationIds: string[],
    status: ReservationStatusEnum,
    isProposalBooking?: boolean
  ) {
    try {
      const updateReservations: Partial<Reservation>[] = reservationIds.map((id) => ({
        id,
        status
      }));
      if (isProposalBooking) {
        const reservations = await this.reservationRepository.find({
          where: {
            id: In(reservationIds)
          },
          select: {
            id: true,
            note: true
          }
        });
        const reservationsMap = new Map<string, Reservation>(
          reservations.map((reservation) => [reservation.id, reservation])
        );

        for (const [index, reservation] of updateReservations.entries()) {
          const rv = reservationsMap.get(reservation.id || '');
          if (!(rv?.note && status === ReservationStatusEnum.CONFIRMED)) {
            continue;
          }
          const newNote = rv.note
            .split('\n')
            .filter((line) => !line.startsWith('Proposal Expiry:'))
            .join('\n');
          updateReservations[index].note = newNote;
        }
      }
      return await this.reservationRepository.upsert(updateReservations, {
        conflictPaths: ['id'],
        skipUpdateIfNoValuesChanged: true
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll(
    filter: {
      hotelId?: string;
      statuses?: ReservationStatusEnum[];
      fromDate?: Date;
      toDate?: Date;
      mappingReservationCodes?: string[];
      relations?: FindOptionsRelations<Reservation>;
      isCompleted?: boolean;
      bookingIds?: string[];
    },
    select?: FindOptionsSelect<Reservation>
  ) {
    const {
      hotelId,
      statuses,
      fromDate,
      toDate,
      relations,
      isCompleted,
      mappingReservationCodes,
      bookingIds
    } = filter;

    const where: FindOptionsWhere<Reservation> = {
      deletedAt: IsNull()
    };

    if (hotelId) {
      where.hotelId = hotelId;
    }

    if (bookingIds?.length) {
      where.bookingId = In(bookingIds);
    }

    if (statuses?.length) {
      where.status = In(statuses);
    }

    if (toDate) {
      where.arrival = LessThanOrEqual(toDate);
    }
    if (fromDate) {
      where.departure = MoreThan(fromDate);
    }

    if (isCompleted) {
      where.booking = {
        completedDate: Not(IsNull())
      };
    }

    if (mappingReservationCodes?.length) {
      where.mappingReservationCode = In(mappingReservationCodes);
    }

    return this.reservationRepository.find({
      where: where,
      relations: relations,
      select: select
    });
  }

  async findOne(
    filter: { id?: string; reservationNumber?: string; hotelId?: string },
    select?: FindOptionsSelect<Reservation>
  ) {
    const { id, reservationNumber, hotelId } = filter;

    if (!id && !reservationNumber) {
      throw new BadRequestException('Either id or reservationNumber must be provided');
    }

    const where: FindOptionsWhere<Reservation> = {};

    if (id) {
      where.id = id;
    }

    if (reservationNumber) {
      where.reservationNumber = reservationNumber;
    }

    if (hotelId) {
      where.hotelId = hotelId;
    }

    return this.reservationRepository.findOne({
      where: where,
      select: select
    });
  }

  getByBookingId(bookingId: string, relations: string[]) {
    return this.reservationRepository.find({
      where: {
        bookingId: bookingId
      },
      relations: relations
    });
  }

  getById(id: string, hotelId: string, relations: string[]) {
    return this.reservationRepository.findOne({
      where: {
        id: id,
        hotelId: hotelId
      },
      relations: relations
    });
  }

  async getReservationsAndCount(filter: ReservationManagementFilterDto) {
    try {
      const {
        hotelId,
        statusList,
        notInStatusList,
        fromDate,
        toDate,
        bookingChannelList,
        bookingFlowList,
        bookingSourceList,
        promoCodeList,
        isPmsSync,
        text,
        reservationNumbers,
        bookingId,
        reservationIds,
        type = ReservationFilterDateType.ARRIVAL
      } = filter;
      const queryBuilder = this.reservationRepository.createQueryBuilder('reservation');
      // ignore soft deleted
      queryBuilder.andWhere('reservation.deletedAt IS NULL');

      if (hotelId) {
        queryBuilder.where('reservation.hotelId = :hotelId', { hotelId });
      }
      if (reservationNumbers?.length) {
        queryBuilder.andWhere('reservation.reservationNumber IN (:...reservationNumbers)', {
          reservationNumbers
        });
      }
      if (reservationIds?.length) {
        queryBuilder.andWhere('reservation.id IN (:...reservationIds)', { reservationIds });
      }
      if (bookingId) {
        queryBuilder.andWhere('reservation.bookingId = :bookingId', { bookingId });
      }
      if (statusList?.length) {
        queryBuilder.andWhere('reservation.status IN (:...statusList)', { statusList });
      }
      if (notInStatusList?.length) {
        queryBuilder.andWhere('reservation.status NOT IN (:...notInStatusList)', {
          notInStatusList
        });
      }
      if (fromDate && toDate) {
        if (type === ReservationFilterDateType.ARRIVAL) {
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.where('DATE(reservation.arrival) >= :fromDate', {
                fromDate: `${fromDate}`
              }).andWhere('DATE(reservation.arrival) <= :toDate', { toDate: `${toDate}` });
            })
          );
        }

        if (type === ReservationFilterDateType.STAY_IN) {
          // To include a full day, compare with the start of the next day
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.where("reservation.arrival < (:toDate::date + interval '1 day')", {
                toDate
              }).andWhere('reservation.departure > :fromDate::date', { fromDate });
            })
          );
        }
      }

      if (bookingChannelList?.length) {
        queryBuilder.andWhere('reservation.channel IN (:...bookingChannelList)', {
          bookingChannelList
        });
      }
      if (bookingFlowList?.length) {
        queryBuilder.andWhere('reservation.bookingFlow IN (:...bookingFlowList)', {
          bookingFlowList
        });
      }
      if (bookingSourceList?.length) {
        queryBuilder.andWhere('reservation.source IN (:...bookingSourceList)', {
          bookingSourceList
        });
      }
      if (promoCodeList?.length) {
        queryBuilder.andWhere('reservation.promoCode IN (:...promoCodeList)', { promoCodeList });
      }
      if (isPmsSync === true) {
        queryBuilder.andWhere('reservation.mappingReservationCode IS NOT NULL');
        queryBuilder.andWhere("reservation.mappingReservationCode != ''");
      } else if (isPmsSync === false) {
        queryBuilder.andWhere(
          "(reservation.mappingReservationCode IS NULL OR reservation.mappingReservationCode = '')"
        );
      }

      if (filter.relations?.length) {
        Filter.setQueryBuilderRelations(queryBuilder, 'reservation', filter.relations);
      }

      if (text) {
        // Add left joins for related entities to enable searching

        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('reservation.reservationNumber ILIKE :text', { text: `%${text}%` })
              .orWhere('booking.bookingNumber ILIKE :text', { text: `%${text}%` })
              .orWhere('primaryGuest.firstName ILIKE :text', { text: `%${text}%` })
              .orWhere('primaryGuest.lastName ILIKE :text', { text: `%${text}%` })
              .orWhere(`(primaryGuest.firstName || ' ' || primaryGuest.lastName) ILIKE :text`, {
                text: `%${text}%`
              })
              .orWhere('company.name ILIKE :text', { text: `%${text}%` });
          })
        );
      }

      Filter.setQueryBuilderPaging(queryBuilder, filter);

      if (filter.sort?.length) {
        Filter.setQueryBuilderSort(queryBuilder, 'reservation', filter.sort);
      }
      // If isPmsSync is not true or false, no additional filtering is applied
      return await queryBuilder.getManyAndCount();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getReservationSourceList(filter: ReservationSourceFilterDto) {
    try {
      const { hotelId } = filter;
      const sources = await this.reservationRepository
        .createQueryBuilder('reservation')
        .select('DISTINCT reservation.source', 'source')
        .where('reservation.hotelId = :hotelId', { hotelId })
        .getRawMany();
      return sources;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getReservationBookingFlowList(filter: ReservationManagementFilterDto) {
    try {
      const { hotelId } = filter;
      const bookingFlows = await this.reservationRepository
        .createQueryBuilder('reservation')
        .select('DISTINCT reservation.bookingFlow', 'bookingFlow')
        .where('reservation.hotelId = :hotelId', { hotelId })
        .getRawMany();
      return (bookingFlows || []).map((flow) => flow.bookingFlow).filter((flow) => flow !== null);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getReservationChannelList(filter: ReservationChannelFilterDto) {
    try {
      const { hotelId } = filter;
      const channels = await this.reservationRepository
        .createQueryBuilder('reservation')
        .select('DISTINCT reservation.channel', 'channel')
        .where('reservation.hotelId = :hotelId', { hotelId })
        .getRawMany();
      return channels;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getReservationDetails(filter: ReservationManagementFilterDto) {
    try {
      const { hotelId, reservationNumbers, relations, bookingNumber } = filter;
      const queryBuilder = this.reservationRepository.createQueryBuilder('reservation');

      if (hotelId) {
        queryBuilder.where('reservation.hotelId = :hotelId', { hotelId });
      }

      if (reservationNumbers?.length) {
        queryBuilder.andWhere('reservation.reservationNumber IN (:...reservationNumbers)', {
          reservationNumbers
        });
      }
      if (bookingNumber) {
        queryBuilder.leftJoin('reservation.booking', 'booking');
        queryBuilder.andWhere('booking.bookingNumber = :bookingNumber', { bookingNumber });
      }
      if (relations?.length) {
        Filter.setQueryBuilderRelations(queryBuilder, 'reservation', relations);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateReservations(reservations: Partial<Reservation> & Pick<Reservation, 'id'>[]) {
    try {
      for (const reservation of reservations) {
        await this.reservationRepository.update(reservation.id, { ...reservation });
      }
      return reservations;
    } catch (error) {
      this.logger.error(`Error updating reservations: ${error}`);
      throw new Error(error);
    }
  }

  async updatePartialReservations(reservations: Partial<Reservation> & Pick<Reservation, 'id'>[]) {
    try {
      for (const reservation of reservations) {
        await this.reservationRepository.update(reservation.id, { ...reservation });
      }
      return reservations;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateReservationList(reservations: Partial<Reservation> & Pick<Reservation, 'id'>[]) {
    try {
      for (const reservation of reservations) {
        await this.reservationRepository.update(reservation.id, { ...reservation });
      }
      return reservations;
    } catch (error) {
      throw new Error(error);
    }
  }

  async upsertReservations(reservations: Partial<Reservation>[]) {
    await this.reservationRepository.upsert(reservations, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true
    });
  }

  private buildTaxDetails(input: {
    reservation: ReservationDto;
    hotelTaxMap: Map<string, HotelTax>;
  }) {
    const { reservation, hotelTaxMap } = input;

    const buildTaxItem = (hotelTax, amount) => {
      return {
        id: hotelTax.id,
        name: hotelTax.name,
        code: hotelTax.code,
        rate: hotelTax.rate,
        description: hotelTax.description,
        amount: Number(amount),
        mappingTaxCode: hotelTax.mappingPmsTaxCode,
        isDefault: hotelTax.isDefault
      };
    };
    const accommodationTax: any[] = [];
    Object.entries(reservation.reservationPricing?.taxAccommodationDetailsMap || {}).forEach(
      ([taxCode, amount]) => {
        const hotelTax = hotelTaxMap.get(taxCode);
        if (hotelTax) {
          accommodationTax.push(buildTaxItem(hotelTax, amount));
        }
      }
    );

    const extraServiceTax: any[] = [];
    for (const amenityPricing of reservation.amenityPricingList || []) {
      if (!amenityPricing.taxDetailsMap) continue;
      for (const [taxCode, amount] of Object.entries(amenityPricing.taxDetailsMap)) {
        const hotelTax = hotelTaxMap.get(taxCode);
        if (!hotelTax) continue;

        extraServiceTax.push({
          ...buildTaxItem(hotelTax, amount),
          hotelAmenityId: amenityPricing.hotelAmenityId,
          hotelAmenityName: amenityPricing.hotelAmenityName
        });
      }
    }

    return {
      current: {
        accommodationTax,
        extraServiceTax
      },
      original: {
        accommodationTax,
        extraServiceTax
      }
    };
  }

  private buildCityTaxDetails(input: { reservation: ReservationDto }) {
    const { reservation } = input;
    const cityTaxDetails = reservation.reservationPricing?.cityTaxDetails;
    if (!cityTaxDetails?.length) return [];

    const newCityTaxDetails: any[] = cityTaxDetails.map((cityTax) => ({
      id: cityTax.id,
      // hotelId: null
      // unit: null,
      // value: null,
      name: cityTax.name,
      code: cityTax.code,
      // status: null,
      // description: null,
      chargeMethod: cityTax.chargeMethod,
      // mappingCityTaxCode: null,
      amount: Number(cityTax.amount)
    }));
    return newCityTaxDetails;
  }

  async getReservationWithRelations(filter: {
    id?: string;
    reservationNumber?: string;
    hotelId: string;
    relations: string[];
  }) {
    try {
      const { id, reservationNumber, hotelId, relations } = filter;
      const qb = this.reservationRepository.createQueryBuilder('reservation');
      if (id) {
        qb.andWhere('reservation.id = :id', { id });
      }
      if (reservationNumber) {
        qb.andWhere('reservation.reservationNumber = :reservationNumber', { reservationNumber });
      }
      qb.andWhere('reservation.hotelId = :hotelId', { hotelId });
      if (relations?.length) {
        for (const relation of relations) {
          qb.leftJoinAndSelect(`reservation.${relation}`, relation);
        }
      }
      return await qb.getOne();
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to get reservation with relations');
    }
  }

  async getReservationByBookingIdAndReservationNumber(filter: {
    bookingId: string;
    reservationNumber: string;
    relations: string[];
  }) {
    const { bookingId, reservationNumber, relations } = filter;
    return await this.reservationRepository.findOne({
      where: {
        bookingId: bookingId,
        reservationNumber: reservationNumber
      },
      relations: relations
    });
  }

  async getReservationByMappingReservationCode(filter: {
    mappingReservationCodes: string[];
    hotelId?: string;
    relations?: string[];
  }) {
    try {
      const { mappingReservationCodes, hotelId, relations } = filter;
      return await this.reservationRepository.find({
        where: {
          mappingReservationCode: In(mappingReservationCodes),
          ...(hotelId ? { hotelId } : {})
        },
        relations: relations
      });
    } catch (error) {
      this.logger.error(error?.message || 'Failed to get reservation by mapping reservation code');
      return [];
    }
  }
}
