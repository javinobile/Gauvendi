import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { Reservation } from '@src/core/entities/booking-entities/reservation.entity';
import { Hotel } from '@src/core/entities/hotel-entities/hotel.entity';
import { HotelRetailFeature } from '@src/core/entities/hotel-retail-feature.entity';
import { RoomProduct } from '@src/core/entities/room-product.entity';
import { RoomUnit } from '@src/core/entities/room-unit.entity';
import { EntityTranslationConfigCodeEnum } from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { TranslationI18nLocale } from '@src/core/entities/translation-entities/translation-i18n-locale.entity';
import { formatInTimeZone } from 'date-fns-tz';
import { In, Repository } from 'typeorm';
import {
  BOOKING_FLOW_MAP,
  CHANNEL_MAP,
  LOCALES_MAP,
  RESERVATION_NOTES_KEYS,
  RESERVATION_TITLE
} from '../constants/reservation-notes.const';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
export class ReservationNotesService {
  constructor(
    @InjectRepository(TranslationI18nLocale, DbName.Postgres)
    private readonly translationI18nLocaleRepository: Repository<TranslationI18nLocale>,

    @InjectRepository(RoomUnit, DbName.Postgres)
    private readonly roomUnitRepository: Repository<RoomUnit>,

    @InjectRepository(RoomProduct, DbName.Postgres)
    private readonly roomProductRepository: Repository<RoomProduct>,

    @InjectRepository(RatePlan, DbName.Postgres)
    private readonly ratePlanRepository: Repository<RatePlan>,

    @InjectRepository(BookingProposalSetting, DbName.Postgres)
    private readonly bookingProposalSettingRepository: Repository<BookingProposalSetting>,

    @InjectRepository(HotelRetailFeature, DbName.Postgres)
    private readonly hotelRetailFeatureRepository: Repository<HotelRetailFeature>
  ) {}

  async generateNotes(
    booking: Booking,
    reservation: Reservation,
    hotel: Hotel,
    alternativeUnitIds?: string[]
  ) {
    const hotelLanguageCode = hotel.preferredLanguageCode || 'EN';
    const localeCode = LOCALES_MAP[hotelLanguageCode as any];
    // const reservationCommentTemplateContent = await this.translationEntityConfigRepository.findOne({
    //   where: {
    //     code: EntityTranslationConfigCodeEnum.RESERVATION_COMMENT_TEMPLATE_CONTENT,
    //     deletedAt: IsNull()
    //   }
    // });
    const [
      roomProduct,
      ratePlan,
      alternativeUnits,
      bookingProposalSetting,
      retailFeatures,
      reservationCommentTemplateContent
    ] = await Promise.all([
      reservation.roomProductId
        ? this.roomProductRepository.findOne({
            where: { id: reservation.roomProductId, hotelId: hotel.id }
          })
        : Promise.resolve(null),
      reservation.ratePlanId
        ? this.ratePlanRepository.findOne({
            where: { id: reservation.ratePlanId, hotelId: hotel.id }
          })
        : Promise.resolve(null),
      alternativeUnitIds?.length
        ? this.roomUnitRepository.find({
            where: { id: In(alternativeUnitIds), hotelId: hotel.id }
          })
        : Promise.resolve([]),
      this.bookingProposalSettingRepository.findOne({
        where: { bookingId: booking.id, hotelId: hotel.id }
      }),
      reservation.matchedFeature
        ? this.hotelRetailFeatureRepository.find({
            where: { code: In(JSON.parse(reservation.matchedFeature || '[]')), hotelId: hotel.id }
          })
        : Promise.resolve([]),
      this.translationI18nLocaleRepository
        .createQueryBuilder('translationI18nLocale')
        .leftJoinAndSelect(
          'translationI18nLocale.staticContentTranslations',
          'staticContentTranslations'
        )
        .leftJoinAndSelect('staticContentTranslations.etc', 'etc')
        .where('translationI18nLocale.code = :localeCode', { localeCode })
        .andWhere('etc.deletedAt IS NULL')
        .andWhere('etc.isStatic = true')
        .andWhere('etc.code = :code', {
          code: EntityTranslationConfigCodeEnum.RESERVATION_COMMENT_TEMPLATE_CONTENT
        })
        .getOne()
    ]);

    const translationContent =
      reservationCommentTemplateContent?.staticContentTranslations?.[0]?.attribute || [];
    const translationContentMap = new Map<string, string>(
      translationContent.map((content) => [content.key, content.value])
    );

    const guaranteedUnitFeatures = retailFeatures?.length
      ? retailFeatures?.map((feature) => feature.name).join(', ')
      : '';

    let alternativeUnitsFeatures = alternativeUnits?.length
      ? alternativeUnits?.map((unit) => `#${unit.roomNumber}`).join(', ')
      : '';
    alternativeUnitsFeatures = alternativeUnitsFeatures ? `(${alternativeUnitsFeatures})` : '';

    let notes = `${RESERVATION_TITLE}`;
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.bookingSource.key) ||
        RESERVATION_NOTES_KEYS.bookingSource.defaultKeyvalue,
      reservation.source || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.channel.key) ||
        RESERVATION_NOTES_KEYS.channel.defaultKeyvalue,
      CHANNEL_MAP[reservation.channel as any] || CHANNEL_MAP['GV VOICE']
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.bookingFlow.key) ||
        RESERVATION_NOTES_KEYS.bookingFlow.defaultKeyvalue,
      BOOKING_FLOW_MAP[reservation.bookingFlow as any] || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.guestLanguage.key) ||
        RESERVATION_NOTES_KEYS.guestLanguage.defaultKeyvalue,
      reservation.bookingLanguage || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.specialRequest.key) ||
        RESERVATION_NOTES_KEYS.specialRequest.defaultKeyvalue,
      reservation.guestNote || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.paymentConditions.key) ||
        RESERVATION_NOTES_KEYS.paymentConditions.defaultKeyvalue,
      reservation.note || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.cancellationConditions.key) ||
        RESERVATION_NOTES_KEYS.cancellationConditions.defaultKeyvalue,
      reservation.note || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.productName.key) ||
        RESERVATION_NOTES_KEYS.productName.defaultKeyvalue,
      roomProduct?.name || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.productCode.key) ||
        RESERVATION_NOTES_KEYS.productCode.defaultKeyvalue,
      roomProduct?.code || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.ratePlanName.key) ||
        RESERVATION_NOTES_KEYS.ratePlanName.defaultKeyvalue,
      ratePlan?.name || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.ratePlanCode.key) ||
        RESERVATION_NOTES_KEYS.ratePlanCode.defaultKeyvalue,
      ratePlan?.code || ''
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.guaranteedUnitFeatures.key) ||
        RESERVATION_NOTES_KEYS.guaranteedUnitFeatures.defaultKeyvalue,
      guaranteedUnitFeatures
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.alternativeUnitsAssigned.key) ||
        RESERVATION_NOTES_KEYS.alternativeUnitsAssigned.defaultKeyvalue,
      alternativeUnitsFeatures
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.assignedUnitLocked.key) ||
        RESERVATION_NOTES_KEYS.assignedUnitLocked.defaultKeyvalue,
      reservation.isLocked ? 'Yes' : 'No'
    );
    notes += this.genTemplateData(
      translationContentMap.get(RESERVATION_NOTES_KEYS.proposalExpiry.key) ||
        RESERVATION_NOTES_KEYS.proposalExpiry.defaultKeyvalue,
      bookingProposalSetting?.validBefore
        ? this.formatDateInHotelTimezone(bookingProposalSetting.validBefore, hotel.timeZone)
        : ''
    );
    notes += this.genTemplateData(
      RESERVATION_NOTES_KEYS.promoCode.defaultKeyvalue,
      JSON.parse(reservation.promoCode || '[]')?.join(', ') || ''
    );
    notes += this.genTemplateData(
      RESERVATION_NOTES_KEYS.tripPurpose.defaultKeyvalue,
      reservation.tripPurpose || ''
    );

    return notes.trim();
  }

  //   private async getTranslation(key: string) {
  //     const localeCode = hotel.localeCode;
  //     if (!localeCode) {
  //       return '';
  //     }
  //     const translation = await this.translationI18nLocaleRepository.findOne({
  //       where: { code: localeCode }
  //     });
  //     return translation?.name || '';
  //   }

  private genTemplateData(key: string, value: string) {
    if (!value) return '';
    return `\n${key}: ${value}`;
  }

  private formatDateInHotelTimezone(date: Date, timezone: string): string {
    if (!timezone) {
      timezone = 'UTC';
    }

    return formatInTimeZone(date, timezone, 'MMM dd, yyyy HH:mm:ssxxx');
  }
}
