import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import { DB_NAME } from 'src/core/constants/db.const';
import {
  Reservation,
  ReservationStatusEnum
} from 'src/core/entities/booking-entities/reservation.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { RoomProduct } from 'src/core/entities/room-product.entity';
import { BaseService } from 'src/core/services/base.service';
import { convertToUtcDate, setTimeFromTimeSlice } from 'src/core/utils/datetime.util';
import { ReservationDto } from 'src/modules/booking/dtos/request-booking.dto';
import { HotelConfigurationRepository } from 'src/modules/hotel-configuration/repositories/hotel-configuration.repository';
import { FindOptionsSelect, In, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateReservationDto } from '../dtos/reservation.dto';
import { RoomProductRetailFeature } from 'src/core/entities/room-product-retail-feature.entity';
import { HotelRetailFeature } from 'src/core/entities/hotel-retail-feature.entity';
import { groupByToMapSingle } from 'src/core/utils/group-by.util';

@Injectable()
export class ReservationRepository extends BaseService {
  private readonly logger = new Logger(ReservationRepository.name);

  constructor(
    @InjectRepository(Reservation, DB_NAME.POSTGRES)
    private reservationRepository: Repository<Reservation>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RoomProductRetailFeature, DB_NAME.POSTGRES)
    private roomProductRetailFeatureRepository: Repository<RoomProductRetailFeature>,

    @InjectRepository(HotelRetailFeature, DB_NAME.POSTGRES)
    private hotelRetailFeatureRepository: Repository<HotelRetailFeature>,

    @InjectRepository(HotelTax, DB_NAME.POSTGRES)
    private hotelTaxRepository: Repository<HotelTax>,

    private hotelConfigurationRepository: HotelConfigurationRepository,

    @Inject(PLATFORM_SERVICE) private readonly clientProxy: ClientProxy,

    configService: ConfigService
  ) {
    super(configService);
  }

  async getReservations(
    filter: {
      bookingId: string;
    },
    select?: FindOptionsSelect<Reservation>
  ): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: {
        bookingId: filter.bookingId,
        deletedAt: IsNull()
      },
      select: select
    });
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
        this.roomProductRepository
          .createQueryBuilder('roomProduct')
          .where('roomProduct.hotelId = :hotelId', { hotelId: hotel.id })
          .andWhere('roomProduct.id IN (:...roomProductIds)', { roomProductIds })
          .andWhere('roomProduct.deletedAt IS NULL')
          .leftJoinAndSelect(
            'roomProduct.roomProductRetailFeatures',
            'roomProductRetailFeatures',
            'roomProductRetailFeatures.quantity IS NOT NULL AND roomProductRetailFeatures.quantity >= :minQuantity'
          )
          .setParameter('minQuantity', 1)
          .select([
            'roomProduct.id',
            'roomProduct.isLockedUnit',
            'roomProductRetailFeatures'
          ])
          .getMany(),
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
        const firstDate = roomAvailabilityDates[0];
        const countDuplicateDate = roomAvailabilityDates?.filter(
          (date) => date === firstDate
        )?.length;

        // Create arrival date with check-in time from timeSlice.CI
        const arrival = convertToUtcDate(
          hotel.timeZone ?? 'UTC',
          setTimeFromTimeSlice(reservation.arrival, timeSlice?.CI)
        );

        const departure = convertToUtcDate(
          hotel.timeZone ?? 'UTC',
          setTimeFromTimeSlice(reservation.departure, timeSlice?.CO)
        );

        const roomProduct = roomProducts.find(
          (roomProduct) => roomProduct.id === reservation.roomProductId
        );
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
            status: ReservationStatusEnum.RESERVED,
            bookingLanguage: bookingInput.translateTo ?? 'EN',
            ratePlanId: reservation.salesPlanId ?? null,
            marketSegmentId: null, // TODO
            ratePlanType: null, // TODO
            roomProductId: reservation.roomProductId ?? null,
            adults: reservation.adult,
            childrenAges: reservation.childrenAgeList || [],
            pets: reservation.pets,
            primaryGuestId: guest?.id ?? null,
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
            balance: reservation.reservationPricing?.totalGrossAmount,
            bookingDate: new Date(),
            releasedDate: null,
            cancelledBy: null,
            cancelledDate: null,
            cancelledReason: null,
            cancellationFee: null,
            cxlPolicyCode: cancelPolicyCodes.get(reservation.salesPlanId ?? '') ?? null,
            noShowFee: null,
            matchedFeature: JSON.stringify(matchedPriorityCategories.map((item) => item.code)),

            currencyCode: bookingInput.bookingInformation.bookingPricing?.currencyCode ?? null,
            paymentTermCode: bookingInput.bookingInformation.paymentTermCode,
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
            mismatchedFeature: JSON.stringify(
              mismatchedPriorityCategories.map((item) => item.code)
            ),
            guestNote: null
          };

          reservations.push(newReservation);
          continue;
        }

        // Create a reservation for ERFC Deduct All
        const totalReservations = countDuplicateDate || 1;

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
          primaryGuestId: guest?.id ?? null,
          additionalGuests: JSON.stringify(additionalGuestList[index] || []),
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
          cityTaxDetails: cityTaxDetails,
          deletedAt: null,
          mismatchedFeature: null,
          guestNote: null
        };

        Array.from({ length: totalReservations }).forEach((_, reservationIndex) => {
          const adults = adultsDistribution[reservationIndex];
          const pets = petsDistribution[reservationIndex];
          const childrenAges = childrenAgesDistribution[reservationIndex];

          const newReservation: Partial<Reservation> = {
            ...commonReservationInfo,
            id: uuidv4(),
            reservationNumber: `${booking.bookingNumber}${count.toString().padStart(2, '0')}`,
            adults: adults,
            pets: pets,
            childrenAges: childrenAges,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          reservations.push(newReservation);
          count++;
        });
      }

      for (const [index, reservation] of reservations.entries()) {
        const reservationNotes = await lastValueFrom(
          this.clientProxy.send(
            { cmd: 'generate_reservation_notes' },
            {
              booking: booking,
              reservation: reservation,
              hotel: hotel,
              alternativeUnitIds:
                body.bookingInput?.bookingInformation?.reservationList[index]?.alternativeUnitIds ??
                []
            }
          )
        ).then((res) => res);
        reservation.note = reservationNotes;
      }

      const result = await this.reservationRepository.save(reservations);
      return result;
    } catch (error) {
      throw new Error(error);
    }
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
    for (const amenityPricing of reservation.amenityPricingList) {
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

  async updateReservationStatus(reservationIds: string[], status: ReservationStatusEnum) {
    try {
      return await this.reservationRepository.update(reservationIds, {
        status: status as unknown as ReservationStatusEnum
      });
    } catch (error) {
      this.logger.error(`Error updating reservation status: ${error}`);
      throw new Error(error);
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

  async updateStatusReservations(ids: string[], status: ReservationStatusEnum) {
    try {
      return await this.reservationRepository.update(ids, { status: status });
    } catch (error) {
      this.logger.error(`Error updating reservation status: ${error}`);
      throw new Error(error);
    }
  }
}
