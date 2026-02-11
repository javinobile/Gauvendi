import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Decimal } from 'decimal.js';
import { DB_NAME } from 'src/core/constants/db.const';
import { LanguageCodeEnum } from 'src/core/database/entities/base.entity';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Company } from 'src/core/entities/booking-entities/company.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { ReservationAmenity } from 'src/core/entities/booking-entities/reservation-amenity.entity';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import { TaxSettingEnum } from 'src/core/entities/hotel-entities/hotel.entity';
import { EntityTranslationConfigCodeEnum } from 'src/core/entities/translation-entities/translation-entity-config.entity';
import { ExtraServiceTypeEnum } from 'src/core/enums/common';
import { S3Service } from 'src/core/s3/s3.service';
import { GuestRepository } from 'src/modules/guest/repositories/guest.repository';
import { HotelAmenityRepository } from 'src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { HotelCancellationPolicyRepository } from 'src/modules/hotel-cancellation-policy/repositories/hotel-cancellation-policy.repository';
import { HotelCityTaxRepository } from 'src/modules/hotel-city-tax/hotel-city-tax.repository';
import { HotelPaymentTermRepository } from 'src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';
import { HotelRetailFeaturesService } from 'src/modules/hotel-retail-features/hotel-retail-features.service';
import { HotelTaxRepository } from 'src/modules/hotel-tax/hotel-tax.repository';
import { HotelRepository } from 'src/modules/hotel/repositories/hotel.repository';
import { ReservationAmenityRepository } from 'src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { RoomProductRetailFeatureRepository } from 'src/modules/room-product-retail-feature/repositories/room-product-retail-feature.repository';
import { RoomProductStandardFeatureRepository } from 'src/modules/room-product-standard-feature/repositories/room-product-retail-feature.repository';
import { TranslationRepository } from 'src/modules/translation/repositories/translation.repository';
import { In, IsNull, Repository } from 'typeorm';
import { BookingSummaryFilterDto } from '../dtos/booking-status.dto';
import {
  BookingSummaryBookerDto,
  BookingSummaryGuestDto,
  BookingSummaryPrimaryGuestDto,
  BookingSummaryReservationAmenityDto,
  BookingSummaryReservationDto,
  BookingSummaryResponseDto,
  BookingSummaryTransactionDto
} from '../dtos/booking-summary.dto';
import { BookingRepository } from '../repositories/booking.repository';
import { Helper } from 'src/core/helper/utils';
import {
  HotelPaymentMethodSetting,
  PaymentMethodStatusEnum
} from 'src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { GlobalPaymentMethod } from 'src/core/entities/hotel-entities/global-payment-method.entity';
import {
  RfcAllocationSetting,
  RoomProduct,
  RoomProductType
} from 'src/core/entities/room-product.entity';
import { HotelTax } from 'src/core/entities/hotel-entities/hotel-tax.entity';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';

@Injectable()
export class BookingSummaryService {
  private readonly zero = new Decimal(0);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly roomProductRetailFeatureRepository: RoomProductRetailFeatureRepository,
    private readonly roomProductStandardFeatureRepository: RoomProductStandardFeatureRepository,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly hotelCancellationPolicyRepository: HotelCancellationPolicyRepository,
    private readonly reservationAmenityRepository: ReservationAmenityRepository,
    private readonly guestRepository: GuestRepository,
    private readonly hotelRetailFeaturesService: HotelRetailFeaturesService,
    private readonly hotelRepository: HotelRepository,
    private readonly hotelCityTaxRepository: HotelCityTaxRepository,
    private readonly hotelTaxRepository: HotelTaxRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly s3Service: S3Service,
    private readonly translationRepository: TranslationRepository,

    @InjectRepository(Company, DB_NAME.POSTGRES)
    private companyRepository: Repository<Company>,

    @InjectRepository(HotelPaymentMethodSetting, DB_NAME.POSTGRES)
    private hotelPaymentMethodSettingRepository: Repository<HotelPaymentMethodSetting>,

    @InjectRepository(GlobalPaymentMethod, DB_NAME.POSTGRES)
    private globalPaymentMethodRepository: Repository<GlobalPaymentMethod>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private ratePlanRepository: Repository<RatePlan>
  ) {}

  async getBookingSummary(filter: BookingSummaryFilterDto): Promise<any> {
    const result = await this.bookingRepository.getBookingSummary(filter);

    const mappedResult = await this.mappingBookingSummary(result as unknown as Booking, filter);
    return mappedResult;
  }

  private async mappingBookingSummary(
    booking: Booking,
    filter: BookingSummaryFilterDto
  ): Promise<BookingSummaryResponseDto> {
    const { booker, reservations, bookingTransactions } = booking;

    // Calculate aggregated values from reservations
    const totalAdult = reservations?.reduce((sum, res) => sum + (res.adults || 0), 0) || 0;
    const totalChildren =
      reservations?.reduce((sum, res) => {
        const childrenAges = res.childrenAges || [];
        return sum + childrenAges.length;
      }, 0) || 0;

    // Use Decimal for monetary calculations
    const totalBaseAmount =
      reservations?.reduce(
        (sum, res) => sum.plus(this.safeDecimal(res.totalBaseAmount)),
        this.zero
      ) || this.zero;

    const totalGrossAmount =
      reservations?.reduce(
        (sum, res) => sum.plus(this.safeDecimal(res.totalGrossAmount)),
        this.zero
      ) || this.zero;

    const payOnConfirmationAmount =
      reservations?.reduce(
        (sum, res) => sum.plus(this.safeDecimal(res.payOnConfirmationAmount)),
        this.zero
      ) || this.zero;

    const payAtHotelAmount =
      reservations?.reduce(
        (sum, res) => sum.plus(this.safeDecimal(res.payAtHotelAmount)),
        this.zero
      ) || this.zero;

    // Get earliest arrival and latest departure
    const arrival = reservations?.reduce(
      (earliest, res) => {
        if (!res.arrival) return earliest;
        return !earliest || res.arrival < earliest ? res.arrival : earliest;
      },
      null as Date | null
    );

    const departure = reservations?.reduce(
      (latest, res) => {
        if (!res.departure) return latest;
        return !latest || res.departure > latest ? res.departure : latest;
      },
      null as Date | null
    );

    // Get cancelled date from reservations
    const cancelledDate = reservations?.find((res) => res.cancelledDate)?.cancelledDate || null;

    // Map booker information
    const mappedBooker: BookingSummaryBookerDto = booker
      ? {
          id: booker.id,
          address: booker.address || '',
          city: booker.city,
          state: booker.state,
          countryId: booker.countryId || '',
          country: null, // This would need to be populated from country relation
          postalCode: booker.postalCode,
          phoneNumber: booker.phoneNumber || '',
          countryNumber: booker.countryNumber || '',
          firstName: booker.firstName || '',
          lastName: booker.lastName || '',
          emailAddress: booker.emailAddress || '',
          companyName: booker.companyName,
          companyCity: booker.companyCity,
          companyTaxId: booker.companyTaxId,
          companyAddress: booker.companyAddress,
          companyCountry: booker.companyCountry,
          companyEmail: booker.companyEmail,
          companyPostalCode: booker.companyPostalCode
        }
      : {
          // Default booker if none exists
          id: '',
          address: '',
          city: null,
          state: null,
          countryId: '',
          country: null,
          postalCode: null,
          phoneNumber: '',
          countryNumber: '',
          firstName: '',
          lastName: '',
          emailAddress: '',
          companyName: null,
          companyCity: null,
          companyTaxId: null,
          companyAddress: null,
          companyCountry: null,
          companyEmail: null,
          companyPostalCode: null
        };

    // Map booking transactions
    const mappedTransactions: BookingSummaryTransactionDto[] =
      bookingTransactions?.map((transaction) => ({
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: transaction.status || '',
        accountNumber: transaction.accountNumber,
        accountHolder: transaction.accountHolder,
        expiryMonth: transaction.expiryMonth,
        expiryYear: transaction.expiryYear,
        cardType: transaction.cardType,
        totalAmount: this.safeDecimalToRounded(transaction.totalAmount)
      })) || [];

    let bookingCityTaxList = booking.reservations?.flatMap(
      (reservation) => reservation.cityTaxDetails || []
    );
    bookingCityTaxList = [...new Set(bookingCityTaxList)];
    let bookingTaxList = booking.reservations?.flatMap((reservation) => {
      const a = reservation.taxDetails || {};
      const b = a?.current || {};
      const c = [...(b?.accommodationTax || []), ...(b?.extraServiceTax || [])];
      return c;
    });
    bookingTaxList = [...new Set(bookingTaxList)];
    const hotelAmenityIds = bookingTaxList
      .filter((tax) => !!tax.hotelAmenityId)
      .map((tax) => tax.hotelAmenityId);

    const hotelPaymentModeCode = reservations?.[0]?.hotelPaymentModeCode || '';
    const [cityTaxList, taxList, hotelAmenityList, translationList, globalPaymentMethod] =
      await Promise.all([
        bookingCityTaxList?.length
          ? this.hotelCityTaxRepository.getHotelCityTaxsWithTranslations({
              ids: bookingCityTaxList?.map((tax) => tax.id),
              translateTo: filter.translateTo
            })
          : Promise.resolve([]),
        bookingTaxList?.length
          ? this.hotelTaxRepository.getHotelTaxsWithTranslations({
              ids: bookingTaxList?.map((tax) => tax.id),
              translateTo: filter.translateTo
            })
          : Promise.resolve([]),
        hotelAmenityIds?.length
          ? this.hotelAmenityRepository.getHotelAmenityWithTranslations({
              ids: hotelAmenityIds,
              translateTo: filter.translateTo
            })
          : Promise.resolve([]),
        this.translationRepository.getStaticContentTranslations({
          code: EntityTranslationConfigCodeEnum.INTERNET_SALES_ENGINE_CONTENTS,
          translateTo: filter.translateTo || LanguageCodeEnum.EN
        }),
        hotelPaymentModeCode
          ? this.globalPaymentMethodRepository.findOne({
              where: {
                code: hotelPaymentModeCode
              }
            })
          : Promise.resolve(null)
      ]);

    let hotelPaymentMethodSettings: any = null;
    if (globalPaymentMethod) {
      hotelPaymentMethodSettings = await this.hotelPaymentMethodSettingRepository.findOne({
        where: {
          hotelId: booking.hotelId || '',
          status: PaymentMethodStatusEnum.ACTIVE,
          globalPaymentMethodId: globalPaymentMethod.id,
          deletedAt: IsNull()
        }
      });
    }

    const accommodationTranslation = translationList?.find(
      (translation) => translation.key === 'ACCOMMODATION'
    )?.value;
    const cityTaxMap = new Map(cityTaxList?.map((tax) => [tax.id, tax]));
    const taxMap = new Map(taxList?.map((tax) => [tax.id, tax]));
    const hotelAmenityMap = new Map(hotelAmenityList?.map((amenity) => [amenity.id, amenity]));

    const newBookingCityTaxList = bookingCityTaxList?.map((tax) => {
      const cityTax = cityTaxMap.get(tax.id);
      if (!cityTax) return tax;
      return {
        ...tax,
        name: cityTax.name,
        description: cityTax.description,
        translations: cityTax.translations
      };
    });

    // Group city taxes by name and sum amounts
    const groupedCityTaxList = this.groupCityTaxesByName(newBookingCityTaxList || []);

    // const newBookingTaxList = bookingTaxList?.map((tax) => {
    //   const taxDetail = taxMap.get(tax.id);
    //   if (!taxDetail) return tax;
    //   const hotelAmenity = hotelAmenityMap.get(tax.hotelAmenityId);
    //   const isAccommodationTax = !tax.hotelAmenityId;
    //   const name =
    //     isAccommodationTax && accommodationTranslation
    //       ? `${taxDetail.name} - ${accommodationTranslation}`
    //       : hotelAmenity?.name
    //         ? `${taxDetail.name} - ${hotelAmenity?.name}`
    //         : taxDetail.name;
    //   return {
    //     ...tax,
    //     name: name,
    //     description: taxDetail.description
    //   };
    // });

    const groupedBookingTaxList = this.groupTaxesById(bookingTaxList || [], taxMap);

    return {
      id: booking.id,
      status: reservations?.[0]?.status || '', // Default status - this should be derived from reservation statuses
      bookingNumber: booking.bookingNumber || '',
      arrival: arrival || new Date(),
      departure: departure || new Date(),
      acceptTnc: booking.acceptTnc || false,
      totalAdult,
      cancelledDate,
      totalChildren,
      payOnConfirmationAmount: this.safeToNumber(payOnConfirmationAmount),
      payAtHotelAmount: this.safeToNumber(payAtHotelAmount),
      totalBaseAmount: this.safeToNumber(totalBaseAmount),
      totalGrossAmount: this.safeToNumber(totalGrossAmount),
      totalSellingRate: this.safeToNumber(totalGrossAmount), // Assuming selling rate equals gross amount
      bookingFlow: reservations?.[0]?.bookingFlow || '',
      specialRequest: booking.specialRequest,
      booker: mappedBooker,
      guestList: await this.extractGuestList(reservations || [], booking.booker),
      additionalGuest: this.extractAdditionalGuests(reservations || []),
      bookingCityTaxList: groupedCityTaxList, // Grouped city taxes by name with summed amounts
      bookingTaxList: groupedBookingTaxList,
      cityTaxList: groupedCityTaxList, // Grouped city taxes by name with summed amounts
      paymentTerm: null, // This needs to be populated from reservation payment terms
      cxlPolicy: null, // This needs to be populated from reservation cancellation policies
      reservationList: await this.mapReservations(reservations || [], booking, filter),
      hotelPaymentModeCode: hotelPaymentModeCode,
      hotelPaymentMethodSettings: hotelPaymentMethodSettings?.metadata,
      bookingTransactionList: mappedTransactions,
      cityTaxAmount: this.safeToNumber(
        reservations?.reduce(
          (sum, res) => sum.plus(this.safeDecimal(res.cityTaxAmount)),
          this.zero
        ) || this.zero
      )
    };
  }

  private async mapReservations(
    reservations: Reservation[],
    booking: Booking,
    filter: BookingSummaryFilterDto
  ): Promise<BookingSummaryReservationDto[]> {
    const { translateTo } = filter;
    const hotel = await this.hotelRepository.getHotel({ hotelId: booking.hotelId || '' });
    const isInclusiveTax = hotel?.taxSetting === TaxSettingEnum.INCLUSIVE;
    const featureFilters = {
      hotelId: booking.hotelId || '',
      translateTo: filter.translateTo,
      roomProductIds: [] as string[]
    };
    let matchedFeatureCodes: string[] = [];
    let paymentTermCodes: string[] = [];
    let cxlPolicyCodes: string[] = [];
    let reservationAmenityIds: string[] = [];
    let companyIds: string[] = [];
    let ratePlanIds: string[] = [];
    for (const reservation of reservations) {
      if (reservation?.roomProductId) {
        featureFilters.roomProductIds.push(reservation.roomProductId);
      }
      matchedFeatureCodes.push(...(JSON.parse(reservation.matchedFeature || '[]') as string[]));
      paymentTermCodes.push(reservation.paymentTermCode || '');
      cxlPolicyCodes.push(reservation.cxlPolicyCode || '');
      reservationAmenityIds.push(
        ...reservation.reservationAmenities.flatMap((amenity) => amenity.id)
      );
      if (reservation.companyId) {
        companyIds.push(reservation.companyId);
      }
      if (reservation.ratePlanId) {
        ratePlanIds.push(reservation.ratePlanId);
      }
    }

    matchedFeatureCodes = [...new Set(matchedFeatureCodes)];
    paymentTermCodes = [...new Set(paymentTermCodes)];
    cxlPolicyCodes = [...new Set(cxlPolicyCodes)];
    reservationAmenityIds = [...new Set(reservationAmenityIds)];
    companyIds = [...new Set(companyIds)];
    ratePlanIds = [...new Set(ratePlanIds)];

    const [
      retailFeatureList,
      standardFeatureList,
      matchedFeatureList,
      hotelPaymentTerms,
      cxlPolicies,
      allReservationAmenities,
      companies,
      roomProducts,
      ratePlans
    ] = await Promise.all([
      this.roomProductRetailFeatureRepository.getRoomProductRetailFeatures(featureFilters),
      this.roomProductStandardFeatureRepository.getRoomProductStandardFeatures(featureFilters),
      this.getMatchedFeatureList(matchedFeatureCodes, booking.hotelId || '', filter.translateTo!),
      this.hotelPaymentTermRepository.getHotelPaymentTermsByCodes({
        codes: paymentTermCodes,
        hotelId: booking.hotelId!,
        translateTo: filter.translateTo
      }),
      this.hotelCancellationPolicyRepository.getHotelCancellationPolicies({
        codes: cxlPolicyCodes,
        hotelId: booking.hotelId!,
        translateTo: filter.translateTo
      }),
      this.reservationAmenityRepository.getReservationAmenitiesWithRelations({
        ids: reservationAmenityIds,
        translateTo: filter.translateTo
      }),
      this.companyRepository.find({
        where: {
          id: In(companyIds)
        }
      }),
      this.roomProductRepository.find({
        where: {
          id: In([...new Set(reservations.map((res) => res.roomProductId))])
        },
        select: {
          id: true,
          type: true,
          rfcAllocationSetting: true
        }
      }),
      this.ratePlanRepository.find({
        where: {
          id: In(ratePlanIds)
        }
      })
    ]);

    const companyMap = new Map(companies?.map((company) => [company.id, company]));
    const roomProductMap = new Map(
      roomProducts?.map((roomProduct) => [roomProduct.id, roomProduct])
    );
    const ratePlanMap = new Map(ratePlans?.map((ratePlan) => [ratePlan.id, ratePlan]));

    const normalReservations: Reservation[] = [];
    const erfcReservations: Reservation[] = [];
    const erfcReservationsMap: Map<string, Reservation[]> = new Map();
    for (const reservation of reservations) {
      const roomProduct = roomProductMap.get(reservation.roomProductId || '');
      if (
        roomProduct?.rfcAllocationSetting === RfcAllocationSetting.ALL &&
        roomProduct?.type === RoomProductType.ERFC
      ) {
        const rvs = erfcReservationsMap.get(reservation.roomProductId || '') || [];
        rvs.push(reservation);
        erfcReservationsMap.set(reservation.roomProductId || '', rvs);
      } else {
        normalReservations.push(reservation);
      }
    }

    normalReservations.forEach((reservation) => {
      const rsRetailFeatureList = retailFeatureList.filter(
        (feature) => feature.roomProductId === reservation.roomProductId
      );
      const rsStandardFeatureList = standardFeatureList.filter(
        (feature) => feature.roomProductId === reservation.roomProductId
      );
      reservation.rfc.roomProductRetailFeatures = rsRetailFeatureList;
      reservation.rfc.roomProductStandardFeatures = rsStandardFeatureList;

      const codes = JSON.parse(reservation.matchedFeature || '[]') as string[];
      const rsMatchedFeatureList = matchedFeatureList.filter((feature) =>
        codes.includes(feature.code)
      );
      reservation['matchedFeatureList'] = rsMatchedFeatureList;
      const hotelPaymentTerm = hotelPaymentTerms?.find(
        (term) => term.code === reservation.paymentTermCode
      );
      reservation['paymentTerm'] = {
        name: hotelPaymentTerm?.name || '',
        code: hotelPaymentTerm?.code || '',
        description: hotelPaymentTerm?.description || '',
        payAtHotelDescription: hotelPaymentTerm?.payAtHotelDescription || '',
        payOnConfirmationDescription: hotelPaymentTerm?.payOnConfirmationDescription || ''
      };
      const cxlPolicy = cxlPolicies?.find((policy) => policy.code === reservation.cxlPolicyCode);
      reservation['cxlPolicy'] = {
        name: cxlPolicy?.name || '',
        description: cxlPolicy?.description || ''
      };
      const reservationAmenities =
        allReservationAmenities?.filter((amenity) =>
          reservation.reservationAmenities?.some((a) => a.id === amenity.id)
        ) || [];
      reservation.reservationAmenities = reservationAmenities;
    });

    for (const [roomProductId, reservations] of erfcReservationsMap) {
      const newErfcRv =
        reservations.find((rv) => rv.reservationNumber?.endsWith('01')) || reservations[0];
      const newRvs = reservations.filter((rv) => !rv.reservationNumber?.endsWith('01'));

      let totalBaseAmount = newErfcRv.totalBaseAmount || 0;
      let totalGrossAmount = newErfcRv.totalGrossAmount || 0;
      let totalTaxAmount = newErfcRv.taxAmount || 0;
      let totalCityTaxAmount = newErfcRv.cityTaxAmount || 0;
      let payOnConfirmationAmount = newErfcRv.payOnConfirmationAmount || 0;
      let payAtHotelAmount = newErfcRv.payAtHotelAmount || 0;
      let serviceChargeAmount = newErfcRv.serviceChargeAmount || 0;
      let newReservationAmenities = newErfcRv.reservationAmenities || [];
      const newReservationAmenitiesMap = new Map<string, ReservationAmenity>(
        newReservationAmenities.map((amenity) => [amenity.hotelAmenityId || '', amenity])
      );
      let newAdditionalGuests = this.parseAdditionalGuests(newErfcRv.additionalGuests);
      let newChildrenAges = newErfcRv.childrenAges || [];
      let newCityTaxDetails = newErfcRv.cityTaxDetails || [];
      let newTaxDetails = newErfcRv.taxDetails || {};

      for (const reservation of newRvs) {
        totalBaseAmount += reservation.totalBaseAmount || 0;
        totalGrossAmount += reservation.totalGrossAmount || 0;
        totalCityTaxAmount += reservation.cityTaxAmount || 0;
        totalTaxAmount += reservation.taxAmount || 0;
        payOnConfirmationAmount += reservation.payOnConfirmationAmount || 0;
        payAtHotelAmount += reservation.payAtHotelAmount || 0;
        serviceChargeAmount += reservation.serviceChargeAmount || 0;
        const additionalGuests = this.parseAdditionalGuests(reservation.additionalGuests);
        newAdditionalGuests.push(reservation.primaryGuest);
        newAdditionalGuests.push(...additionalGuests);
        newChildrenAges.push(...(reservation.childrenAges || []));
        for (const reservationAmenity of reservation.reservationAmenities) {
          newReservationAmenities.push(reservationAmenity);
          const existing = newReservationAmenitiesMap.get(reservationAmenity.hotelAmenityId || '');
          if (existing) {
            // const newItem = {
            //   ...existing,
            //   count: existing.hotelAmenityId + reservationAmenity.count,

            // };
            continue;
          }
        }
        newCityTaxDetails.push(...(reservation.cityTaxDetails || []));
        const taxDetails = reservation.taxDetails || {};
        newTaxDetails.current = {
          extraServiceTax: [
            ...(newTaxDetails.current?.extraServiceTax || []),
            ...(taxDetails.current?.extraServiceTax || [])
          ],
          accommodationTax: [
            ...(newTaxDetails.current?.accommodationTax || []),
            ...(taxDetails.current?.accommodationTax || [])
          ]
        };
      }
      newErfcRv.totalBaseAmount = totalBaseAmount;
      newErfcRv.totalGrossAmount = totalGrossAmount;
      newErfcRv.cityTaxAmount = totalCityTaxAmount;
      newErfcRv.taxAmount = totalTaxAmount;
      newErfcRv.reservationAmenities = newReservationAmenities;
      newErfcRv.additionalGuests = JSON.stringify(newAdditionalGuests);
      newErfcRv.payOnConfirmationAmount = payOnConfirmationAmount;
      newErfcRv.payAtHotelAmount = payAtHotelAmount;
      newErfcRv.serviceChargeAmount = serviceChargeAmount;
      newErfcRv.childrenAges = newChildrenAges;
      newErfcRv.cityTaxDetails = newCityTaxDetails;
      newErfcRv.taxDetails = newTaxDetails;

      const rsRetailFeatureList = retailFeatureList.filter(
        (feature) => feature.roomProductId === newErfcRv.roomProductId
      );
      const rsStandardFeatureList = standardFeatureList.filter(
        (feature) => feature.roomProductId === newErfcRv.roomProductId
      );
      newErfcRv.rfc.roomProductRetailFeatures = rsRetailFeatureList;
      newErfcRv.rfc.roomProductStandardFeatures = rsStandardFeatureList;

      const codes = JSON.parse(newErfcRv.matchedFeature || '[]') as string[];
      const rsMatchedFeatureList = matchedFeatureList.filter((feature) =>
        codes.includes(feature.code)
      );
      newErfcRv['matchedFeatureList'] = rsMatchedFeatureList;
      const hotelPaymentTerm = hotelPaymentTerms?.find(
        (term) => term.code === newErfcRv.paymentTermCode
      );
      newErfcRv['paymentTerm'] = {
        name: hotelPaymentTerm?.name || '',
        code: hotelPaymentTerm?.code || '',
        description: hotelPaymentTerm?.description || '',
        payAtHotelDescription: hotelPaymentTerm?.payAtHotelDescription || '',
        payOnConfirmationDescription: hotelPaymentTerm?.payOnConfirmationDescription || ''
      };
      const cxlPolicy = cxlPolicies?.find((policy) => policy.code === newErfcRv.cxlPolicyCode);
      newErfcRv['cxlPolicy'] = {
        name: cxlPolicy?.name || '',
        description: cxlPolicy?.description || ''
      };
      const reservationAmenities =
        allReservationAmenities?.filter((amenity) =>
          newReservationAmenities.some((a) => a.id === amenity.id)
        ) || [];
      newErfcRv.reservationAmenities = reservationAmenities;

      erfcReservations.push(newErfcRv);
    }

    const newReservations = [...normalReservations, ...erfcReservations];

    return await Promise.all(
      newReservations.map(async (reservation) => {
        const rfcImageList = await Promise.all(
          reservation.rfc?.roomProductImages?.map(async (image) => ({
            imageUrl: await this.s3Service.getPreSignedUrl(image?.imageUrl || '')
          }))
        );

        const cxlPolicy = reservation['cxlPolicy'];
        const paymentTerm = reservation['paymentTerm'];
        const ratePlan = ratePlanMap.get(reservation.ratePlanId || '');
        const transactionRatePlan = ratePlan?.translations?.find(
          (i) => i.languageCode === translateTo
        );
        const newRatePlan = {
          ...ratePlan,
          name: transactionRatePlan?.name || ratePlan?.name || '',
          description: transactionRatePlan?.description || ratePlan?.description || ''
        };

        let totalAmenityBaseAmount = 0;
        let totalAmenityGrossAmount = 0;
        for (const amenity of reservation.reservationAmenities) {
          if (amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED) continue;
          totalAmenityBaseAmount += amenity.totalBaseAmount || 0;
          totalAmenityGrossAmount += amenity.totalGrossAmount || 0;
        }
        const totalAccommodationAmount =
          (reservation.totalGrossAmount || 0) - totalAmenityGrossAmount;
        const totalAccommodationAmountBySetting = isInclusiveTax
          ? totalAccommodationAmount
          : (reservation.totalBaseAmount || 0) - totalAmenityBaseAmount;

        const company = companyMap.get(reservation.companyId || '');

        const rfcTranslations = reservation.rfc.translations;
        const rfcTranslation = rfcTranslations?.find((i) => i.languageCode === translateTo);

        return {
          id: reservation.id,
          additionalGuest: this.parseAdditionalGuests(reservation.additionalGuests),
          primaryGuest: this.mapPrimaryGuest(reservation, booking.booker),
          reservationNumber: reservation.reservationNumber || '',
          status: reservation.status || '',
          adult: reservation.adults || 0,
          childrenAgeList: reservation.childrenAges || [],
          pets: reservation.pets || 0,
          arrival: reservation.arrival || new Date(),
          departure: reservation.departure || new Date(),
          specialRequest: reservation.note,
          guestNote: reservation.guestNote,
          totalBaseAmount: this.safeDecimalToRounded(reservation.totalBaseAmount),
          taxAmount: this.safeDecimalToRounded(reservation.taxAmount),
          serviceChargeAmount: this.safeDecimalToRounded(reservation.serviceChargeAmount),
          cityTaxAmount: this.safeDecimalToRounded(reservation.cityTaxAmount),
          totalGrossAmount: this.safeDecimalToRounded(reservation.totalGrossAmount),
          totalSellingRate: this.safeDecimalToRounded(reservation.totalGrossAmount),
          payOnConfirmationAmount: this.safeDecimalToRounded(reservation.payOnConfirmationAmount),
          payAtHotelAmount: this.safeDecimalToRounded(reservation.payAtHotelAmount),
          totalAccommodationAmount: totalAccommodationAmount,
          totalAccommodationAmountBySetting: totalAccommodationAmountBySetting,
          paymentTerm: {
            name: paymentTerm?.name,
            code: paymentTerm?.code,
            description: paymentTerm?.description,
            payAtHotelDescription: paymentTerm?.payAtHotelDescription,
            payOnConfirmationDescription: paymentTerm?.payOnConfirmationDescription
          },
          cxlPolicy: {
            name: cxlPolicy?.name,
            description: cxlPolicy?.description
          },
          rfc: {
            name: rfcTranslation?.name || reservation.rfc.name,
            code: reservation.rfc.code,
            description: rfcTranslation?.description || reservation.rfc.description,
            numberOfBedrooms: reservation.rfc.numberOfBedrooms,
            extraBedKid: reservation.rfc.extraBedKid,
            extraBedAdult: reservation.rfc.extraBedAdult,
            space: reservation.rfc.space,
            rfcImageList,
            standardFeatureList: reservation.rfc.roomProductStandardFeatures.map((feature) => ({
              name: feature.standardFeature.name,
              code: feature.standardFeature.code,
              iconImageUrl: feature.standardFeature.imageUrl,
              retailFeatureImageList: [
                {
                  imageUrl: feature.standardFeature.imageUrl
                }
              ]
            })),
            retailFeatureList: reservation.rfc.roomProductRetailFeatures.map((feature) => ({
              name: feature.retailFeature.name,
              code: feature.retailFeature.code,
              measurementUnit: feature.retailFeature.measurementUnit,
              hotelRetailCategory: feature.retailFeature.hotelRetailCategory,
              retailFeatureImageList: [
                {
                  imageUrl: feature.retailFeature.imageUrl
                }
              ]
            }))
          },
          matchedFeatureList: reservation['matchedFeatureList'],
          rfcRatePlan: {
            ratePlan: {
              name: newRatePlan?.name || '',
              code: newRatePlan?.code || '',
              description: newRatePlan?.description || ''
            }
          },
          tripPurpose: reservation.tripPurpose || '',
          company: company || null,
          reservationAmenityList: await this.buildReservationAmenityList(
            reservation.reservationAmenities,
            filter.translateTo!
          )
        };
      })
    );
  }

  async buildReservationAmenityList(
    reservationAmenities: ReservationAmenity[],
    translateTo: LanguageCodeEnum
  ): Promise<BookingSummaryReservationAmenityDto[]> {
    // check field masterHotelAmenityId is not null, if so, it is a combo amenity
    const comboAmenities = [...reservationAmenities].filter(
      (amenity) =>
        amenity.masterHotelAmenityId !== null &&
        amenity.masterHotelAmenityId !== undefined &&
        amenity.masterHotelAmenityId !== '' &&
        amenity.masterHotelAmenityId !== 'null'
    );

    const singleAmenities = [...reservationAmenities].filter(
      (amenity) =>
        amenity.masterHotelAmenityId === null ||
        amenity.masterHotelAmenityId === undefined ||
        amenity.masterHotelAmenityId === '' ||
        amenity.masterHotelAmenityId === 'null'
    );

    // Group combo amenities by masterHotelAmenityId
    const mapReservationComboAmenityId = new Map<string, ReservationAmenity[]>();
    for (const amenity of comboAmenities) {
      const masterId = amenity.masterHotelAmenityId!;
      if (mapReservationComboAmenityId.has(masterId)) {
        mapReservationComboAmenityId.get(masterId)?.push(amenity);
      } else {
        mapReservationComboAmenityId.set(masterId, [amenity]);
      }
    }

    // Get hotel amenities by masterHotelAmenityId for combo display info
    const masterAmenityIds = Array.from(mapReservationComboAmenityId.keys());
    const masterHotelAmenities =
      masterAmenityIds.length > 0
        ? await this.hotelAmenityRepository.getHotelAmenities({
            ids: masterAmenityIds
          })
        : [];

    const masterHotelAmenityMap = new Map(
      masterHotelAmenities.map((amenity) => [amenity.id, amenity])
    );

    // Build combo amenities by aggregating child reservation amenities
    const comboAmenityResults: BookingSummaryReservationAmenityDto[] = [];
    for (const [masterId, childAmenities] of mapReservationComboAmenityId.entries()) {
      const masterHotelAmenity = masterHotelAmenityMap.get(masterId);
      if (!masterHotelAmenity) continue;

      const foundTranslateToHotelAmenity = masterHotelAmenity.translations.find(
        (translation) => translation.languageCode?.toLowerCase() === translateTo?.toLowerCase()
      );

      // Aggregate totals from all child reservation amenities
      const totalBaseAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.totalBaseAmount || 0),
        this.zero
      );
      const totalGrossAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.totalGrossAmount || 0),
        this.zero
      );
      const taxAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.taxAmount || 0),
        this.zero
      );
      const serviceChargeAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.serviceChargeAmount || 0),
        this.zero
      );

      // Aggregate dates from all child reservation amenities
      const dateMap = new Map<
        string,
        {
          id: string;
          date: string;
          totalBaseAmount: Decimal;
          totalGrossAmount: Decimal;
          serviceChargeAmount: Decimal;
          taxAmount: Decimal;
          count: number;
        }
      >();

      for (const childAmenity of childAmenities) {
        for (const dateItem of childAmenity.reservationAmenityDates || []) {
          const dateKey = dateItem.date || '';
          if (dateMap.has(dateKey)) {
            const existing = dateMap.get(dateKey)!;
            existing.totalBaseAmount = existing.totalBaseAmount.plus(dateItem.totalBaseAmount || 0);
            existing.totalGrossAmount = existing.totalGrossAmount.plus(
              dateItem.totalGrossAmount || 0
            );
            existing.serviceChargeAmount = existing.serviceChargeAmount.plus(
              dateItem.serviceChargeAmount || 0
            );
            existing.taxAmount = existing.taxAmount.plus(dateItem.taxAmount || 0);
            existing.count = Math.max(existing.count, dateItem.count || 0);
          } else {
            dateMap.set(dateKey, {
              id: dateItem.id,
              date: dateKey,
              totalBaseAmount: new Decimal(dateItem.totalBaseAmount || 0),
              totalGrossAmount: new Decimal(dateItem.totalGrossAmount || 0),
              serviceChargeAmount: new Decimal(dateItem.serviceChargeAmount || 0),
              taxAmount: new Decimal(dateItem.taxAmount || 0),
              count: dateItem.count || 0
            });
          }
        }
      }

      const extraServiceType = childAmenities[0]?.extraServiceType || ExtraServiceTypeEnum.INCLUDED;
      const isIncluded = extraServiceType === ExtraServiceTypeEnum.INCLUDED;

      comboAmenityResults.push({
        id: masterId, // Use master amenity ID for combo
        totalBaseAmount: isIncluded ? 0 : totalBaseAmount.toNumber(),
        totalGrossAmount: isIncluded ? 0 : totalGrossAmount.toNumber(),
        serviceChargeAmount: serviceChargeAmount.toNumber(),
        taxAmount: taxAmount.toNumber(),
        totalSellingRate: isIncluded ? 0 : totalGrossAmount.toNumber(),
        hotelAmenity: {
          name: foundTranslateToHotelAmenity?.name || masterHotelAmenity.name || '',
          code: masterHotelAmenity.code || '',
          iconImageUrl: masterHotelAmenity.iconImageUrl || '',
          id: masterHotelAmenity.id || masterId,
          displaySequence: masterHotelAmenity.displaySequence || null
        },
        reservationAmenityDateList: Array.from(dateMap.values()).map((dateItem) => ({
          id: dateItem.id,
          date: dateItem.date,
          totalBaseAmount: isIncluded ? 0 : dateItem.totalBaseAmount.toNumber(),
          totalGrossAmount: isIncluded ? 0 : dateItem.totalGrossAmount.toNumber(),
          serviceChargeAmount: dateItem.serviceChargeAmount.toNumber(),
          taxAmount: dateItem.taxAmount.toNumber(),
          totalSellingRate: isIncluded ? 0 : dateItem.totalGrossAmount.toNumber(),
          count: dateItem.count
        }))
      });
    }

    // Build single amenities
    const newSingleAmenitiesMap = new Map<string, ReservationAmenity>();
    for (const amenity of singleAmenities) {
      const key = `${amenity.hotelAmenityId}-${amenity.ageCategoryCode}`;
      const item = newSingleAmenitiesMap.get(key);
      if (!item) {
        newSingleAmenitiesMap.set(key, amenity);
        continue;
      }
      for (const reservationAmenityDate of amenity.reservationAmenityDates || []) {
        const itemReservationAmenityDates = item.reservationAmenityDates || [];
        const index = itemReservationAmenityDates.findIndex(
          (x) => x.date === reservationAmenityDate.date
        );
        if (index === -1) {
          itemReservationAmenityDates.push(reservationAmenityDate);
          continue;
        }

        const existing = item.reservationAmenityDates?.[index];
        if (!existing) {
          continue;
        }

        existing.totalBaseAmount =
          (existing.totalBaseAmount || 0) + (reservationAmenityDate.totalBaseAmount || 0);
        existing.totalGrossAmount =
          (existing.totalGrossAmount || 0) + (reservationAmenityDate.totalGrossAmount || 0);
        existing.serviceChargeAmount =
          (existing.serviceChargeAmount || 0) + (reservationAmenityDate.serviceChargeAmount || 0);
        existing.taxAmount = (existing.taxAmount || 0) + (reservationAmenityDate.taxAmount || 0);
        existing.count = (existing.count || 0) + (reservationAmenityDate.count || 0);
        itemReservationAmenityDates[index] = existing;
        item.reservationAmenityDates = itemReservationAmenityDates;
      }
      const newItem = {
        ...item,
        totalBaseAmount: (item.totalBaseAmount || 0) + (amenity.totalBaseAmount || 0),
        totalGrossAmount: (item.totalGrossAmount || 0) + (amenity.totalGrossAmount || 0),
        serviceChargeAmount: (item.serviceChargeAmount || 0) + (amenity.serviceChargeAmount || 0),
        taxAmount: (item.taxAmount || 0) + (amenity.taxAmount || 0),
        reservationAmenityDates: item.reservationAmenityDates
      };
      newSingleAmenitiesMap.set(key, newItem);
    }
    let singleAmenityResults: any = [];
    const newSingleAmenities = Array.from(newSingleAmenitiesMap.values());
    for (const amenity of newSingleAmenities) {
      const newItem = {
        id: amenity.id,
        totalBaseAmount:
          amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
            ? 0
            : amenity.totalBaseAmount || 0,
        totalGrossAmount:
          amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
            ? 0
            : amenity.totalGrossAmount || 0,
        serviceChargeAmount: amenity.serviceChargeAmount || 0,
        taxAmount: amenity.taxAmount || 0,
        totalSellingRate:
          amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
            ? 0
            : amenity.totalGrossAmount || 0,
        hotelAmenity: {
          name: amenity.hotelAmenity?.name || '',
          code: amenity.hotelAmenity?.code || '',
          iconImageUrl: amenity.hotelAmenity?.iconImageUrl || '',
          id: amenity.hotelAmenity?.id || amenity.hotelAmenityId || '',
          displaySequence: amenity.hotelAmenity?.displaySequence || null
        },
        reservationAmenityDateList: (amenity.reservationAmenityDates || []).map((date) => ({
          id: date.id,
          date: date.date || '',
          totalBaseAmount:
            amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
              ? 0
              : date.totalBaseAmount || 0,
          totalGrossAmount:
            amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
              ? 0
              : date.totalGrossAmount || 0,
          serviceChargeAmount: date.serviceChargeAmount || 0,
          taxAmount: date.taxAmount || 0,
          totalSellingRate:
            amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED
              ? 0
              : date.totalGrossAmount || 0,
          count: date.count || 0
        }))
      };
      singleAmenityResults.push(newItem);
    }

    // Return both single and combo amenities
    return [...singleAmenityResults, ...comboAmenityResults];
  }

  async getMatchedFeatureList(
    matchedFeatureCodes: string[],
    hotelId: string,
    translateTo: LanguageCodeEnum
  ) {
    if (!matchedFeatureCodes?.length) return [];
    const matchedFeatureList = await this.hotelRetailFeaturesService.getAllHotelRetailFeatures({
      hotelId: hotelId,
      codes: matchedFeatureCodes,
      relations: ['mainFeatureImage'],
      translateTo: translateTo,
      usingSortDefault: true
    });

    return matchedFeatureList?.map((feature) => ({
      name: feature.name,
      code: feature.code,
      description: feature.description,
      quantity: 1,
      retailFeatureImageList: feature.retailFeatureImageList
    }));
  }

  private async extractGuestList(
    reservations: Reservation[],
    booker: Guest
  ): Promise<BookingSummaryGuestDto[]> {
    const guests: BookingSummaryGuestDto[] = [];
    const primaryGuestIds =
      reservations
        .map((reservation) => reservation.primaryGuestId)
        .filter((id) => id !== booker.id && !!id) || [];
    const primaryGuests =
      (await this.guestRepository.getGuestsByIds(primaryGuestIds as string[])) || [];

    reservations.forEach((reservation) => {
      // Add primary guest if exists
      if (reservation.primaryGuestId) {
        if (reservation.primaryGuestId === booker.id) {
          guests.push({
            id: reservation.primaryGuestId,
            isBooker: true,
            isMainGuest: true,
            isReturningGuest: false,
            countryId: booker.countryId,
            firstName: booker.firstName,
            lastName: booker.lastName,
            phoneNumber: booker.phoneNumber,
            city: booker.city,
            state: booker.state,
            emailAddress: booker.emailAddress,
            countryNumber: booker.countryNumber,
            postalCode: booker.postalCode,
            isAdult: true,
            country: { name: '', id: booker.countryId || '' },
            address: booker.address
          });
        } else {
          const primaryGuest = primaryGuests.find(
            (guest) => guest.id === reservation.primaryGuestId
          );
          guests.push({
            id: reservation.primaryGuestId,
            isBooker: false,
            isMainGuest: false,
            isReturningGuest: false,
            countryId: primaryGuest?.countryId || '',
            firstName: primaryGuest?.firstName || '',
            lastName: primaryGuest?.lastName || '',
            phoneNumber: primaryGuest?.phoneNumber || '',
            city: primaryGuest?.city || null,
            state: primaryGuest?.state || null,
            emailAddress: primaryGuest?.emailAddress || '',
            countryNumber: primaryGuest?.countryNumber || '',
            postalCode: primaryGuest?.postalCode || null,
            isAdult: true,
            country: { name: '', id: primaryGuest?.countryId || '' },
            address: primaryGuest?.address || ''
          });
        }
        // Note: This would need to fetch the actual guest data from the database
        // For now, creating a placeholder
      }

      // Add additional guests
      const additionalGuests = this.parseAdditionalGuests(reservation.additionalGuests);
      additionalGuests.forEach((guest: any) => {
        guests.push({
          id: guest?.id || '',
          isBooker: false,
          isMainGuest: false,
          isReturningGuest: false,
          countryId: guest?.countryId || '',
          firstName: guest?.firstName || '',
          lastName: guest?.lastName || '',
          phoneNumber: guest?.phoneNumber || '',
          city: guest?.city,
          state: guest?.state,
          emailAddress: guest?.emailAddress || '',
          countryNumber: guest?.countryNumber || '',
          postalCode: guest?.postalCode,
          isAdult: guest?.isAdult || true,
          country: { name: '', id: guest?.countryId || '' },
          address: guest?.address || ''
        });
      });
    });

    return guests;
  }

  private extractAdditionalGuests(reservations: any[]): any[] {
    const additionalGuests: any[] = [];

    reservations.forEach((reservation) => {
      const guests = this.parseAdditionalGuests(reservation.additionalGuests);
      additionalGuests.push(...guests);
    });

    return additionalGuests;
  }

  private mapPrimaryGuest(reservation: any, booker: Guest): BookingSummaryPrimaryGuestDto {
    // Placeholder primary guest - this would need actual guest data from database
    return {
      id: reservation.primaryGuestId || '',
      countryId: reservation.primaryGuest?.countryId || '',
      firstName: reservation.primaryGuest?.firstName || '',
      lastName: reservation.primaryGuest?.lastName || '',
      phoneNumber: reservation.primaryGuest?.phoneNumber || '',
      city: reservation.primaryGuest?.city || null,
      state: reservation.primaryGuest?.state || null,
      emailAddress: reservation.primaryGuest?.emailAddress || '',
      countryNumber: reservation.primaryGuest?.countryNumber || '',
      postalCode: reservation.primaryGuest?.postalCode || null,
      isAdult: reservation.primaryGuest?.isAdult || true,
      country: {
        name: reservation.primaryGuest?.country?.name || '',
        id: reservation.primaryGuest?.country?.id || ''
      },
      address: reservation.primaryGuest?.address || '',
      isBooker: booker.id === reservation.primaryGuestId,
      isMainGuest: true
    };
  }

  private parseAdditionalGuests(additionalGuestsJson: string | null): any[] {
    if (!additionalGuestsJson) return [];

    try {
      return JSON.parse(additionalGuestsJson || '[]');
    } catch (error) {
      console.error('Error parsing additional guests:', error);
      return [];
    }
  }

  private parseChildrenAges(childrenAgesJson: string | null): number[] {
    if (!childrenAgesJson) return [];

    try {
      // First try parsing as JSON array
      const ages = JSON.parse(childrenAgesJson);
      if (Array.isArray(ages)) {
        return ages.map((age) => Number(age)).filter((age) => !isNaN(age));
      }
    } catch (error) {
      // If JSON parsing fails, try parsing as comma-separated string
      try {
        const ages = childrenAgesJson.split(',').map((age) => age.trim());
        return ages.map((age) => Number(age)).filter((age) => !isNaN(age));
      } catch (parseError) {
        console.error('Error parsing children ages:', parseError);
        return [];
      }
    }

    return [];
  }

  /**
   * Groups city taxes by name and sums their amounts
   * @param cityTaxList - Array of city tax objects to group
   * @returns Array of grouped city taxes with summed amounts
   */
  private groupCityTaxesByName(cityTaxList: any[]): any[] {
    const groupedMap = new Map<string, any>();

    cityTaxList.forEach((tax) => {
      const name = tax.name || '';

      if (groupedMap.has(name)) {
        // If tax with same name exists, sum the amount
        const existing = groupedMap.get(name);
        existing.amount = this.safeDecimalToRounded(
          this.safeDecimal(existing.amount).plus(this.safeDecimal(tax.amount))
        );
      } else {
        // First occurrence, add to map
        groupedMap.set(name, {
          ...tax,
          amount: this.safeDecimalToRounded(tax.amount)
        });
      }
    });

    return Array.from(groupedMap.values());
  }

  /**
   * Groups taxes by id and sums their amounts
   * @param taxList - Array of tax objects to group
   * @returns Array of grouped taxes with summed amounts
   */
  private groupTaxesById(taxList: any[], taxMap: Map<string, HotelTax>): any[] {
    const groupedMap = new Map<string, any>();

    taxList.forEach((tax) => {
      const id = tax.id || '';

      if (groupedMap.has(id)) {
        // If tax with same id exists, sum the amount
        const existing = groupedMap.get(id);
        existing.amount = this.safeDecimalToRounded(
          this.safeDecimal(existing.amount).plus(this.safeDecimal(tax.amount))
        );
      } else {
        const hotelTax = taxMap?.get(id);
        // First occurrence, add to map
        groupedMap.set(id, {
          ...tax,
          name: hotelTax?.name || tax.name,
          description: hotelTax?.description || tax.description,
          amount: this.safeDecimalToRounded(tax.amount)
        });
      }
    });

    return Array.from(groupedMap.values());
  }

  /**
   * Safely converts a value to Decimal, handling null/undefined values
   * @param value - The value to convert to Decimal
   * @param defaultValue - Default value if conversion fails (default: 0)
   * @returns Decimal instance
   */
  private safeDecimal(value: any, defaultValue: number = 0): Decimal {
    try {
      if (value === null || value === undefined) {
        return new Decimal(defaultValue);
      }
      return new Decimal(value);
    } catch (error) {
      console.error('Error creating Decimal from value:', value, error);
      return new Decimal(defaultValue);
    }
  }

  /**
   * Converts a value to Decimal and immediately rounds to 2 decimal places
   * @param value - The value to convert and round
   * @param defaultValue - Default value if conversion fails (default: 0)
   * @returns number rounded to 2 decimal places
   */
  private safeDecimalToRounded(value: any, defaultValue: number = 0): number {
    return this.safeToNumber(this.safeDecimal(value, defaultValue), defaultValue);
  }

  /**
   * Safely converts Decimal to number with proper error handling and rounding to 2 decimal places
   * @param decimal - Decimal instance to convert
   * @param defaultValue - Default value if conversion fails (default: 0)
   * @returns number rounded to 2 decimal places
   */
  private safeToNumber(decimal: Decimal, defaultValue: number = 0): number {
    try {
      return decimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
    } catch (error) {
      console.error('Error converting Decimal to number:', decimal, error);
      return defaultValue;
    }
  }
}
