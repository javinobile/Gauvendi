import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { HotelPaymentMethodSetting } from '@src/core/entities/hotel-entities/hotel-payment-method-setting.entity';
import { EntityTranslationConfigCodeEnum } from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { Helper } from '@src/core/helper/utils';
import { Decimal } from 'decimal.js';
import { Booking } from 'src/core/entities/booking-entities/booking.entity';
import { Guest } from 'src/core/entities/booking-entities/guest.entity';
import { ReservationAmenity } from 'src/core/entities/booking-entities/reservation-amenity.entity';
import { Reservation } from 'src/core/entities/booking-entities/reservation.entity';
import {
  ExtraServiceTypeEnum,
  LanguageCodeEnum,
  MeasureMetricEnum,
  PaymentMethodStatusEnum,
  TaxSettingEnum
} from 'src/core/enums/common';
import { S3Service } from 'src/core/s3/s3.service';
import { GuestRepository } from 'src/modules/guest/repositories/guest.repository';
import { HotelCancellationPolicyRepository } from 'src/modules/hotel-cancellation-policy/repositories/hotel-cancellation-policy.repository';
import { HotelPaymentTermRepository } from 'src/modules/hotel-payment-term/repositories/hotel-payment-term.repository';
import { HotelRetailFeaturesService } from 'src/modules/hotel-retail-features/hotel-retail-features.service';
import { ReservationAmenityRepository } from 'src/modules/reservation-amenity/repositories/reservation-amenity.repository';
import { RoomProductRetailFeatureRepository } from 'src/modules/room-product-retail-feature/repositories/room-product-retail-feature.repository';
import { RoomProductStandardFeatureRepository } from 'src/modules/room-product-standard-feature/repositories/room-product-retail-feature.repository';
import { In, IsNull, Repository } from 'typeorm';
import {
  BookingSummaryBookerDto,
  BookingSummaryCancellationPolicyDto,
  BookingSummaryFilterDto,
  BookingSummaryGuestDto,
  BookingSummaryPaymentTermDto,
  BookingSummaryPrimaryGuestDto,
  BookingSummaryReservationDto,
  BookingSummaryResponseDto,
  BookingSummaryTransactionDto
} from '../booking/dtos/booking.dto';
import { BookingRepository } from '../booking/repositories/booking.repository';
import { GlobalPaymentMethodRepository } from '../global-payment-method/repositories/global-payment-method.repository';
import { HotelAmenityRepository } from '../hotel-amenity/repositories/hotel-amenity.repository';
import { HotelCityTaxRepository } from '../hotel-city-tax/hotel-city-tax.repository';
import { HotelTaxRepository } from '../hotel-tax/repositories/hotel-tax.repository';
import { HotelRepository } from '../hotel/repositories/hotel.repository';
import { TranslationService } from '../translation/services/translation.service';
import { RoomProduct } from '@src/core/entities/room-product.entity';

@Injectable()
export class BookingSummaryService {
  private readonly zero = new Decimal(0);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly hotelCityTaxRepository: HotelCityTaxRepository,
    private readonly hotelTaxRepository: HotelTaxRepository,
    private readonly roomProductRetailFeatureRepository: RoomProductRetailFeatureRepository,
    private readonly roomProductStandardFeatureRepository: RoomProductStandardFeatureRepository,
    private readonly hotelPaymentTermRepository: HotelPaymentTermRepository,
    private readonly hotelCancellationPolicyRepository: HotelCancellationPolicyRepository,
    private readonly reservationAmenityRepository: ReservationAmenityRepository,
    private readonly guestRepository: GuestRepository,
    private readonly hotelRetailFeaturesService: HotelRetailFeaturesService,
    private readonly hotelRepository: HotelRepository,
    private readonly s3Service: S3Service,
    private readonly globalPaymentMethodRepository: GlobalPaymentMethodRepository,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly translationService: TranslationService,

    @InjectRepository(HotelPaymentMethodSetting, DB_NAME.POSTGRES)
    private readonly hotelPaymentMethodSettingRepository: Repository<HotelPaymentMethodSetting>,

    @InjectRepository(RoomProduct, DB_NAME.POSTGRES)
    private readonly roomProductRepository: Repository<RoomProduct>
  ) {}

  async getBookingSummary(filter: BookingSummaryFilterDto): Promise<BookingSummaryResponseDto> {
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
    const [cityTaxList, taxList, hotelAmenityList, translationList] = await Promise.all([
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
      this.translationService.getStaticContentTranslations({
        code: EntityTranslationConfigCodeEnum.INTERNET_SALES_ENGINE_CONTENTS,
        translateTo: filter.translateTo || LanguageCodeEnum.EN
      })
    ]);
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
    const newBookingTaxList = bookingTaxList?.map((tax) => {
      const taxDetail = taxMap.get(tax.id);
      if (!taxDetail) return tax;
      const hotelAmenity = hotelAmenityMap.get(tax.hotelAmenityId);
      const isAccommodationTax = !tax.hotelAmenityId;
      const name =
        isAccommodationTax && accommodationTranslation
          ? `${taxDetail.name} - ${accommodationTranslation}`
          : hotelAmenity?.name
            ? `${taxDetail.name} - ${hotelAmenity?.name}`
            : taxDetail.name;
      return {
        ...tax,
        name: name,
        nameWithoutHotelAmenity: taxDetail.name,
        description: taxDetail.description
      };
    });

    const reservationList = await this.mapReservations(reservations || [], booking, filter);

    let cxlPolicy: BookingSummaryCancellationPolicyDto | null = null;
    let paymentTerm: BookingSummaryPaymentTermDto | null = null;

    if (reservationList && reservationList.length > 0) {
      cxlPolicy = reservationList[0].cxlPolicy;
      paymentTerm = reservationList[0].paymentTerm;
    }

    return {
      id: booking.id,
      hotelId: booking.hotelId,
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
      guestList: await this.extractGuestList(
        reservations || [],
        booking.booker,
        booking.hotelId || ''
      ),
      additionalGuest: this.extractAdditionalGuests(reservations || []),
      primaryGuest: reservationList?.[0]?.primaryGuest || null,
      bookingCityTaxList: newBookingCityTaxList, // Placeholder - needs city tax data
      bookingTaxList: newBookingTaxList, // Placeholder - needs tax data
      cityTaxList: newBookingCityTaxList, // Placeholder - needs city tax data
      paymentTerm: paymentTerm, // This needs to be populated from reservation payment terms
      cxlPolicy: cxlPolicy, // This needs to be populated from reservation cancellation policies
      reservationList: reservationList,
      hotelPaymentModeCode: reservations?.[0]?.hotelPaymentModeCode || '',
      bookingTransactionList: mappedTransactions,
      cityTaxAmount: this.safeToNumber(
        reservations?.reduce(
          (sum, res) => sum.plus(this.safeDecimal(res.cityTaxAmount)),
          this.zero
        ) || this.zero
      ),
      currencyCode: reservations?.[0]?.currencyCode || ''
    };
  }

  //TODO: Refactor this to use the new reservation entity
  private async mapReservations(
    reservations: Reservation[],
    booking: Booking,
    filter: BookingSummaryFilterDto
  ): Promise<BookingSummaryReservationDto[]> {
    const translateTo = filter.translateTo || LanguageCodeEnum.EN;
    const hotel = await this.hotelRepository.findHotelById(booking.hotelId || '');
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
    let paymentMethodCodes: string[] = [];
    let roomProductIds: string[] = [];
    for (const reservation of reservations) {
      if (reservation?.roomProductId) {
        featureFilters.roomProductIds.push(reservation.roomProductId);
        roomProductIds.push(reservation.roomProductId);
      }
      matchedFeatureCodes.push(...(JSON.parse(reservation.matchedFeature || '[]') as string[]));
      reservation.paymentTermCode && paymentTermCodes.push(reservation.paymentTermCode);
      reservation.hotelPaymentModeCode && paymentMethodCodes.push(reservation.hotelPaymentModeCode);
      reservation.cxlPolicyCode && cxlPolicyCodes.push(reservation.cxlPolicyCode);
      reservationAmenityIds.push(
        ...reservation.reservationAmenities.flatMap((amenity) => amenity.id)
      );
    }

    matchedFeatureCodes = [...new Set(matchedFeatureCodes)];
    paymentTermCodes = [...new Set(paymentTermCodes)];
    cxlPolicyCodes = [...new Set(cxlPolicyCodes)];
    reservationAmenityIds = [...new Set(reservationAmenityIds)];
    paymentMethodCodes = [...new Set(paymentMethodCodes)];
    roomProductIds = [...new Set(roomProductIds)];

    const [
      retailFeatureList,
      standardFeatureList,
      matchedFeatureList,
      hotelPaymentTerms,
      cxlPolicies,
      allReservationAmenities,
      paymentMethods,
      roomProducts
    ] = await Promise.all([
      featureFilters.roomProductIds?.length
        ? this.roomProductRetailFeatureRepository.getRoomProductRetailFeatures(featureFilters)
        : Promise.resolve([]),
      featureFilters.roomProductIds?.length
        ? this.roomProductStandardFeatureRepository.getRoomProductStandardFeatures(featureFilters)
        : Promise.resolve([]),
      matchedFeatureCodes?.length
        ? this.getMatchedFeatureList(
            matchedFeatureCodes,
            booking.hotelId || '',
            filter.translateTo!
          )
        : Promise.resolve([]),
      paymentTermCodes?.length
        ? this.hotelPaymentTermRepository.getHotelPaymentTermsByCodes({
            codes: paymentTermCodes,
            hotelId: booking.hotelId!,
            translateTo: filter.translateTo
          })
        : Promise.resolve([]),
      cxlPolicyCodes?.length
        ? this.hotelCancellationPolicyRepository.getHotelCancellationPolicies({
            codes: cxlPolicyCodes,
            hotelId: booking.hotelId!,
            translateTo: filter.translateTo
          })
        : Promise.resolve([]),
      reservationAmenityIds?.length
        ? this.reservationAmenityRepository.getReservationAmenitiesWithRelations({
            ids: reservationAmenityIds,
            translateTo: filter.translateTo
          })
        : Promise.resolve([]),
      paymentMethodCodes?.length
        ? this.globalPaymentMethodRepository.getGlobalPaymentMethodList({
            codes: paymentMethodCodes,
            translateTo: filter.translateTo
          })
        : Promise.resolve([]),
      roomProductIds?.length
        ? this.roomProductRepository.find({
            where: {
              id: In(roomProductIds),
              deletedAt: IsNull()
            }
          })
        : Promise.resolve([])
    ]);

    const paymentMethodIds = paymentMethods?.map((method) => method.id);
    let hotelPaymentMethodSettings: HotelPaymentMethodSetting[] = [];
    if (paymentMethodIds?.length) {
      hotelPaymentMethodSettings = await this.hotelPaymentMethodSettingRepository.find({
        where: {
          hotelId: booking.hotelId!,
          globalPaymentMethodId: In(paymentMethodIds),
          deletedAt: IsNull(),
          status: PaymentMethodStatusEnum.ACTIVE
        }
      });
    }
    const hotelPaymentMethodSettingsMap = new Map(
      hotelPaymentMethodSettings?.map((setting) => [setting.globalPaymentMethodId, setting])
    );

    const paymentMethodMap = new Map(paymentMethods?.map((method) => [method.code, method]));
    const roomProductMap = new Map(roomProducts?.map((product) => [product.id, product]));

    reservations.forEach((reservation) => {
      const rsRetailFeatureList = retailFeatureList.filter(
        (feature) => feature.roomProductId === reservation.roomProductId
      );
      const rsStandardFeatureList = standardFeatureList.filter(
        (feature) => feature.roomProductId === reservation.roomProductId
      );
      if (reservation.rfc) {
        reservation.rfc.roomProductRetailFeatures = rsRetailFeatureList;
        reservation.rfc.roomProductStandardFeatures = rsStandardFeatureList;
      }

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
        allReservationAmenities?.filter((amenity) => amenity.reservationId === reservation.id) ||
        [];
      reservation.reservationAmenities = reservationAmenities;
    });
    const bookingTransactions = booking.bookingTransactions;

    return await Promise.all(
      reservations.map(async (reservation) => {
        const rfcImageList = await Promise.all(
          reservation.rfc?.roomProductImages?.map(async (image) => ({
            imageUrl: await this.s3Service.getPreSignedUrl(image?.imageUrl || '')
          }))
        );

        const cxlPolicy = reservation['cxlPolicy'];
        const paymentTerm = reservation['paymentTerm'];
        const ratePlan = reservation['ratePlan'];
        const ratePlanTranslation = ratePlan?.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        const newRatePlan = {
          code: ratePlan?.code,
          name: ratePlanTranslation?.name || ratePlan?.name,
          description: ratePlanTranslation?.description || ratePlan?.description
        };
        const roomProduct = roomProductMap.get(reservation.roomProductId || '');
        const roomProductTranslation = roomProduct?.translations?.find(
          (translation) => translation.languageCode === translateTo
        );
        const newRoomProduct: any = {
          ...(reservation.rfc || {}),
          name: roomProductTranslation?.name || roomProduct?.name,
          description: roomProductTranslation?.description || roomProduct?.description
        };

        let totalAmenityBaseAmount = 0;
        let totalAmenityGrossAmount = 0;
        for (const amenity of reservation.reservationAmenities) {
          if (amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED) {
            continue;
          }
          totalAmenityBaseAmount += amenity.totalBaseAmount || 0;
          totalAmenityGrossAmount += amenity.totalGrossAmount || 0;
        }
        const totalAccommodationAmount =
          (reservation.totalGrossAmount || 0) - totalAmenityGrossAmount;
        const totalAccommodationAmountBySetting = isInclusiveTax
          ? totalAccommodationAmount
          : (reservation.totalBaseAmount || 0) - totalAmenityBaseAmount;

        const paymentMethod = paymentMethodMap.get(reservation.hotelPaymentModeCode || '');
        const hotelPaymentMethodSetting = hotelPaymentMethodSettingsMap.get(
          paymentMethod?.id || ''
        );

        return {
          id: reservation.id,
          additionalGuest: this.parseAdditionalGuests(reservation.additionalGuests),
          primaryGuest: this.mapPrimaryGuest(reservation),
          reservationNumber: reservation.reservationNumber || '',
          status: reservation.status || '',
          adult: reservation.adults || 0,
          childrenAgeList: reservation.childrenAges || [],
          pets: reservation.pets || 0,
          arrival: reservation.arrival || new Date(),
          departure: reservation.departure || new Date(),
          specialRequest: booking.specialRequest ?? null,
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
          paymentMethod: {
            name: paymentMethod?.name || '',
            description: paymentMethod?.description || '',
            code: paymentMethod?.code || '',
            cardType: bookingTransactions?.[0]?.cardType?.toUpperCase() || '',
            accountNumber: bookingTransactions?.[0]?.accountNumber || '',
            moreInfo: hotelPaymentMethodSetting?.metadata || {}
          },
          cxlPolicy: {
            name: cxlPolicy?.name,
            description: cxlPolicy?.description
          },
          rfc: {
            name: newRoomProduct?.name,
            description: newRoomProduct?.description,
            numberOfBedrooms: newRoomProduct?.numberOfBedrooms,
            extraBedKid: newRoomProduct?.extraBedKid,
            extraBedAdult: newRoomProduct?.extraBedAdult,
            space: newRoomProduct.space,
            rfcImageList,
            standardFeatureList: newRoomProduct?.roomProductStandardFeatures.map((feature) => ({
              name: feature.standardFeature?.name,
              code: feature.standardFeature?.code,
              iconImageUrl: feature.standardFeature.imageUrl,
              retailFeatureImageList: [
                {
                  imageUrl: feature.standardFeature.imageUrl
                }
              ]
            })),
            retailFeatureList: newRoomProduct?.roomProductRetailFeatures.map((feature) => ({
              name: feature.retailFeature.name,
              code: feature.retailFeature.code,
              measurementUnit:
                feature.retailFeature.measurementUnit == MeasureMetricEnum.SQM
                  ? 'm2'
                  : feature.retailFeature.measurementUnit == MeasureMetricEnum.SQFT
                    ? 'ft2'
                    : feature.retailFeature.measurementUnit,
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
            ratePlan: newRatePlan
          },
          tripPurpose: reservation.tripPurpose || '',
          company: null,
          reservationAmenityList: await this.buildReservationAmenityList(
            reservation.reservationAmenities,
            translateTo
          )
        };
      })
    );
  }

  async buildReservationAmenityList(
    reservationAmenities: ReservationAmenity[],
    translateTo: LanguageCodeEnum
  ): Promise<any[]> {
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
    const comboAmenityResults: any[] = [];
    for (const [masterId, childAmenities] of mapReservationComboAmenityId.entries()) {
      const masterHotelAmenity = masterHotelAmenityMap.get(masterId);
      if (!masterHotelAmenity) continue;

      const foundTranslateToHotelAmenity = masterHotelAmenity.translations.find(
        (translation) => translation.languageCode?.toLowerCase() === translateTo?.toLowerCase()
      );

      // Aggregate totals from all child reservation amenities
      const totalBaseAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.totalBaseAmount || 0),
        new Decimal(0)
      );
      const totalGrossAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.totalGrossAmount || 0),
        new Decimal(0)
      );
      const taxAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.taxAmount || 0),
        new Decimal(0)
      );
      const serviceChargeAmount = childAmenities.reduce(
        (sum, amenity) => sum.plus(amenity.serviceChargeAmount || 0),
        new Decimal(0)
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
        isIncluded: isIncluded,
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
        })),
        extraServiceType: extraServiceType
      });
    }

    // Build single amenities
    const singleAmenityResults = singleAmenities.map((amenity) => ({
      id: amenity.id,
      extraServiceType: amenity.extraServiceType,
      isIncluded: amenity.extraServiceType === ExtraServiceTypeEnum.INCLUDED,
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
    }));

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
    booker: Guest,
    hotelId: string
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
            isBooker: false,
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
            address: booker.address,
            hotelId: hotelId
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
            address: primaryGuest?.address || '',
            hotelId: hotelId
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
          address: guest?.address || '',
          hotelId: hotelId
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

  private mapPrimaryGuest(reservation: any): BookingSummaryPrimaryGuestDto {
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
      isBooker: false,
      isMainGuest: true
    };
  }

  private parseAdditionalGuests(additionalGuestsJson: string | null): {
    id: string;
    firstName: string;
    lastName: string;
    isAdult: boolean;
  }[] {
    if (!additionalGuestsJson) return [];

    try {
      const data = JSON.parse(additionalGuestsJson || '[]');

      if (data && Array.isArray(data)) {
        return data.filter((item) => {
          return (
            item &&
            item.firstName &&
            item.firstName.trim() !== '' &&
            item.lastName &&
            item.lastName.trim() !== ''
          );
        });
      }

      return data;
    } catch (error) {
      console.error('Error parsing additional guests:', error);
      return [];
    }
  }

  private parseChildrenAges(childrenAgesJson: string | null): number[] {
    if (!childrenAgesJson) return [];

    try {
      const ages = JSON.parse(childrenAgesJson);
      return Array.isArray(ages) ? ages : [];
    } catch (error) {
      console.error('Error parsing children ages:', error);
      return [];
    }
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
