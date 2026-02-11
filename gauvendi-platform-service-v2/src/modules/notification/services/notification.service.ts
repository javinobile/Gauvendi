import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { BookingProposalSetting } from '@src/core/entities/booking-entities/booking-proposal-setting.entity';
import { Guest } from '@src/core/entities/booking-entities/guest.entity';
import { HotelAmenity } from '@src/core/entities/hotel-entities/hotel-amenity.entity';
import { HotelConfiguration } from '@src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelTemplateEmailCodeEnum } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { NotFoundException } from '@src/core/exceptions';
import { DecimalRoundingHelper } from '@src/core/helper/decimal-rounding.helper';
import { Helper } from '@src/core/helper/utils';
import { S3Service } from '@src/core/s3/s3.service';
import { formatDateWithLanguage, parseLanguageCode } from '@src/core/utils/datetime.util';
import { BookingSummaryService } from '@src/modules/booking-summary/booking-summary.service';
import { HotelAmenityRepository } from '@src/modules/hotel-amenity/repositories/hotel-amenity.repository';
import { HotelConfigurationRepository } from '@src/modules/hotel-configuration/hotel-configuration.repository';
import { PdfService } from '@src/modules/pdf/services/pdf.service';
import { ReservationRepository } from '@src/modules/reservation/repositories/reservation.repository';
import { RoomProductHotelExtraListService } from '@src/modules/room-product-hotel-extra-list/room-product-hotel-extra-list.service';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import Decimal from 'decimal.js';
import { Repository } from 'typeorm';
import {
  BookingFlow,
  ExtraServiceTypeEnum,
  HotelConfigurationTypeEnum,
  HotelPaymentModeCodeEnum,
  LanguageCodeEnum,
  MeasureMetricEnum,
  RoundingModeEnum,
  TaxSettingEnum
} from '../../../core/enums/common';
import { BookingSummaryFilterDto, BookingSummaryResponseDto } from '../../booking/dtos/booking.dto';
import { HotelTemplateEmailService } from '../../hotel-template-email/services/hotel-template-email.service';
import { HotelsService } from '../../hotels/hotels.service';
import { BookingInformationForEmailDto } from '../dtos/booking-information.dto';
import { HotelInformationDto } from '../dtos/hotel-information.dto';
import {
  AttachmentData,
  EmailMetadata,
  EmailValidationMessage,
  ResponseContent,
  ResponseContentStatusEnum
} from '../dtos/notification.dto';
import { SendCancelReservationEmailDto } from '../dtos/send-cancel-reservation-email.dto';
import { SendConfirmBookingEmailDto } from '../dtos/send-confirm-booking-email.dto';
import { SendTestEmailDto } from '../dtos/send-test-email.dto';
import { SendgridService } from './sendgrid.service';

const FALLBACK_TEMPLATE_EMAIL = {
  templateId: '',
  isEnable: true,
  subject: '',
  senderName: undefined,
  senderEmail: undefined
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly sendgridService: SendgridService,
    private readonly configService: ConfigService,
    private readonly bookingSummaryService: BookingSummaryService,
    private readonly hotelsService: HotelsService,
    private readonly hotelConfigurationRepository: HotelConfigurationRepository,
    private readonly hotelTemplateEmailService: HotelTemplateEmailService,
    private readonly roomProductHotelExtraListService: RoomProductHotelExtraListService,
    private readonly hotelAmenityRepository: HotelAmenityRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly pdfService: PdfService,
    private readonly s3Service: S3Service,

    @InjectRepository(BookingProposalSetting, DbName.Postgres)
    private readonly bookingProposalSettingRepository: Repository<BookingProposalSetting>
  ) {}

  async sendConfirmBookingEmail(filter: SendConfirmBookingEmailDto): Promise<ResponseContent> {
    return this.sendCppBookingConfirmationEmail(filter);
  }

  async sendCancelReservationEmail(input: SendCancelReservationEmailDto): Promise<boolean> {
    const { bookingId, reservation, translateTo, hotelTemplateEmail } = input;
    const language = translateTo || LanguageCodeEnum.EN;
    // Get booking information
    const booking = await this.getBookingInformation({ bookingId, language });
    if (!booking || !booking.hotelId) {
      throw new Error('Booking not found or hotelId is missing');
    }

    // Get hotel information
    const hotel = await this.getHotelInformation(booking.hotelId);
    if (!hotel) {
      throw new Error('Hotel not found');
    }

    const reservationCancellationEmailType =
      hotelTemplateEmail || HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION;
    const templateEmail = await this.getCancelReservationTemplateEmail({
      hotel,
      booker: reservation.primaryGuest,
      templateType: reservationCancellationEmailType,
      language
    });

    const emailTemplateId = templateEmail?.templateId;

    // Check if template is enabled
    if (templateEmail && !templateEmail.isEnable) {
      // Update booking as email sent even if template is disabled
      await this.updateBookingEmailSentStatus(bookingId, true);

      return true;
    }

    const sendToMails = new Set<string>();
    if (reservation.primaryGuest && reservation.primaryGuest.emailAddress) {
      sendToMails.add(reservation.primaryGuest.emailAddress);
    }
    if (hotel.emailAddressList && hotel.emailAddressList.length > 0) {
      sendToMails.add(hotel.emailAddressList[0]);
    }
    const metadata: EmailMetadata = {
      booking: booking,
      hotel: hotel,
      booker: reservation.primaryGuest,
      reservation: reservation,
      email: templateEmail
    };

    const senderName = hotel.senderName;
    const senderEmail = hotel.senderEmail;

    await this.sendgridService.constructAndSendMail(
      HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION,
      senderName,
      senderEmail,
      Array.from(sendToMails),
      emailTemplateId,
      metadata,
      undefined,
      reservation.bookingLanguage || LanguageCodeEnum.EN
    );

    return true;
  }

  async sendReleasedReservationEmail(input: SendCancelReservationEmailDto): Promise<boolean> {
    const { bookingId, reservation, translateTo, hotelTemplateEmail } = input;
    const language = translateTo || LanguageCodeEnum.EN;
    // Get booking information
    const booking = await this.getBookingInformation({ bookingId, language });
    if (!booking || !booking.hotelId) {
      throw new Error('Booking not found or hotelId is missing');
    }

    // Get hotel information
    const hotel = await this.getHotelInformation(booking.hotelId);
    if (!hotel) {
      throw new Error('Hotel not found');
    }

    const reservationCancellationEmailType =
      hotelTemplateEmail || HotelTemplateEmailCodeEnum.RELEASED_EMAIL;
    const templateEmail = await this.getCancelReservationTemplateEmail({
      hotel,
      booker: reservation.primaryGuest,
      templateType: reservationCancellationEmailType,
      language
    });

    const emailTemplateId = templateEmail?.templateId;

    // Check if template is enabled
    if (templateEmail && !templateEmail.isEnable) {
      // Update booking as email sent even if template is disabled
      await this.updateBookingEmailSentStatus(bookingId, true);

      return true;
    }

    const sendToMails = new Set<string>();
    if (reservation.primaryGuest && reservation.primaryGuest.emailAddress) {
      sendToMails.add(reservation.primaryGuest.emailAddress);
    }
    if (hotel.emailAddressList && hotel.emailAddressList.length > 0) {
      sendToMails.add(hotel.emailAddressList[0]);
    }

    // TODO: Implement this method metadata need ise link
    const metadata: EmailMetadata = {
      booking: booking,
      hotel: hotel,
      booker: reservation.primaryGuest,
      reservation: reservation,
      email: templateEmail,
      ibeHomeUrl: hotel.ibeHomeUrl
    };

    const senderName = hotel.senderName;
    const senderEmail = hotel.senderEmail;

    await this.sendgridService.constructAndSendMail(
      HotelTemplateEmailCodeEnum.RELEASED_EMAIL,
      senderName,
      senderEmail,
      Array.from(sendToMails),
      emailTemplateId || '',
      metadata,
      undefined,
      reservation.bookingLanguage || LanguageCodeEnum.EN
    );

    return true;
  }

  /**
   * Send CPP booking confirmation email
   */

  async sendTestEmail(input: SendTestEmailDto) {
    const { hotelTemplateEmail, language = LanguageCodeEnum.EN, toEmail, hotelId } = input;
    const booking = {
      id: 'd09f61bc-33e7-4879-9a82-8f99123f7540',
      hotelId: '25e00815-16e6-4afb-ab7f-c66942a7aba7',
      bookingFlow: BookingFlow.LOWEST_PRICE,
      bookingNumber: '1767378734060',
      arrivalStr: 'Wed, 21 Jan 2026',
      departureStr: 'Sat, 24 Jan 2026',
      totalChildren: 1,
      childrenAgeList: [3],
      totalAdult: 2,
      totalPets: 1,
      totalGrossAmountStr: '1211.45',
      totalBaseAmountStr: '1051.25',
      taxAmount: 60.300000000000004,
      bookingTaxList: this.buildSampleTaxList(language),
      cityTaxAmount: 102,
      cityTaxList: this.buildSampleCityTaxList(language),
      cityTaxAmountStr: '',
      amountStr: '',
      paidAmountStr: '363.44',
      totalAmountDueStr: '848.02',
      spaceTypeCount: 1,
      totalAccommodations: '1211.45',
      totalServices: '0',
      specialRequest: null,
      booker: this.buildSampleBooker(language),
      paymentTerm: this.buildSamplePaymentTerm(language),
      cxlPolicy: this.buildSampleCxlPolicy(language),
      reservationList: this.buildSampleReservationList(language),
      mailReservationList: this.buildSampleMailReservationList(language),
      primaryGuest: this.buildSamplePrimaryGuest(language)
    };

    const hotel = await this.getHotelInformation(hotelId);
    if (!hotel) {
      throw new Error('Hotel not found');
    }

    let templateEmail: any = null;
    let metadata: EmailMetadata | null = null;
    let attachments: AttachmentData[] = [];
    switch (hotelTemplateEmail) {
      case HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION:
      case HotelTemplateEmailCodeEnum.BOOKING_CONFIRMATION:
        templateEmail = await this.getTemplateEmail(
          hotel,
          booking,
          HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
          language
        );

        // Prepare metadata to match sample data structure with all fields
        metadata = {
          booking: booking,
          hotel: {
            ...hotel,
            isTaxIncluded: hotel.taxSetting === TaxSettingEnum.INCLUSIVE ? true : false
          },
          booker: booking.booker,
          email: templateEmail,
          translation: {}, // Will be populated by fetchEmailStaticContentTranslation
          bookingConfirmationUrl: this.getBookingConfirmationUrl(hotel),
          // Additional fields from sample data
          standardFeature: booking['standardFeature'] || null,
          spaceTypeList: booking['spaceTypeList'] || null,
          mailReservationList: booking.mailReservationList || null,
          // departureStr: booking.departureStr || null,
          // arrivalStr: booking.arrivalStr || null,
          numberRoom: booking['numberRoom'] || null,
          brandingMarketing: hotel.brandingMarketing || null
        };

        attachments = await this.prepareReservationAttachments(booking, hotel, language);

        break;

      case HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION:
        const reservation = booking.reservationList[0];
        const primaryGuest = booking.primaryGuest;

        const reservationCancellationEmailType =
          hotelTemplateEmail || HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION;
        templateEmail = await this.getCancelReservationTemplateEmail({
          hotel,
          booker: booking.booker as any,
          templateType: reservationCancellationEmailType,
          language
        });

        metadata = {
          booking: booking,
          hotel: hotel,
          booker: primaryGuest,
          reservation: reservation,
          email: templateEmail
        };

      case HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION:
      case HotelTemplateEmailCodeEnum.PROPOSAL_BOOKING_CONFIRMATION:
        const hotelConfigurations = await this.hotelConfigurationRepository.getHotelConfigurations({
          hotelId,
          configTypes: [
            HotelConfigurationTypeEnum.TAX_INFORMATION,
            HotelConfigurationTypeEnum.TERMS_OF_USE_URL,
            HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL,
            HotelConfigurationTypeEnum.IMPRESSUM_URL,
            HotelConfigurationTypeEnum.ISE_URL
          ]
        });

        const bookingProposalSetting: any = {
          id: 'ad31c3b5-7926-4374-9074-85ee6f711485',
          createdAt: '2026-01-05T03:56:14.228Z',
          updatedAt: '2026-01-05T03:56:14.228Z',
          hotelId: '25e00815-16e6-4afb-ab7f-c66942a7aba7',
          bookingId: '04a70ff8-7938-4b4e-8ec7-4bb322453588',
          triggerAt: '2026-01-05T03:56:14.226Z',
          validBefore: '2026-01-05T15:57:14.226Z',
          booking: undefined
        };

        this.getMoreDataForProposalBooking({
          booking,
          hotel,
          hotelConfigurations,
          language,
          bookingProposalSetting
        });

        templateEmail = await this.getTemplateEmail(
          hotel,
          booking,
          HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION,
          language
        );

        const emailTemplateId = templateEmail?.templateId;

        const cppProposalBookingConfirmationUrl = await this.getProposalBookingConfirmationUrl({
          hotelId,
          hotelCode: hotel.code,
          bookingId: booking.id,
          language
        });

        metadata = {
          booking: booking,
          hotel: hotel,
          booker: booking.booker,
          email: templateEmail,
          proposalBookingConfirmationUrl: cppProposalBookingConfirmationUrl
        };

        break;
      case HotelTemplateEmailCodeEnum.RELEASED_EMAIL:
        templateEmail = await this.getCancelReservationTemplateEmail({
          hotel,
          booker: booking.booker as any,
          templateType: HotelTemplateEmailCodeEnum.RELEASED_EMAIL,
          language
        });

        // TODO: Implement this method metadata need ise link
        metadata = {
          booking: booking,
          hotel: hotel,
          booker: booking.booker,
          reservation: booking.reservationList[0],
          email: templateEmail,
          ibeHomeUrl: hotel.ibeHomeUrl
        };
      default:
        break;
    }

    if (!templateEmail) {
      throw new Error('Template email not found');
    }

    // Set booking total accommodations and services
    this.setBookingTotalAccommodationsAndServices(booking, hotel);

    // Prepare email recipients
    const sendToMails = new Set<string>();

    if (toEmail) {
      sendToMails.add(toEmail);
    } else {
      if (hotel.emailAddressList && hotel.emailAddressList.length > 0) {
        for (const email of hotel.emailAddressList) {
          if (email) sendToMails.add(email);
        }
      }
    }

    const recipientList = Array.from(sendToMails).filter((email) => email);

    if (recipientList.length === 0) {
      throw new Error('No valid email recipients found');
    }

    if (!metadata) {
      throw new Error('Metadata not found');
    }

    // Prepare sender information (from hotel, matching Java implementation)
    const senderName = hotel.senderName;
    const senderEmail = hotel.senderEmail;

    const emailTemplateId = templateEmail?.templateId;
    await this.sendgridService.constructAndSendMail(
      hotelTemplateEmail,
      senderName,
      senderEmail,
      recipientList,
      emailTemplateId,
      metadata,
      attachments,
      language
    );

    return {
      message: {
        code: EmailValidationMessage.CPP_CONFIRMATION_EMAIL_SUCCESS,
        message: 'CPP booking confirmation email sent successfully'
      },
      status: ResponseContentStatusEnum.SUCCESS
    };
  }

  private buildSampleTaxList(language: string) {
    const translations = {
      'Normal - Accommodation': {
        FR: 'Normal - Hébergement',
        DE: 'Normal - Unterkunft',
        IT: 'Normale - Alloggio',
        ES: 'Normal - Alojamiento',
        NL: 'Normaal - Accommodatie',
        AR: 'عادي - إقامة'
      },
      'Normal - Extra bed for child': {
        FR: 'Normal - Lit supplémentaire pour enfant',
        DE: 'Normal - Zustellbett für Kind',
        IT: 'Normale - Letto supplementare per bambino',
        ES: 'Normal - Cama supletoria para niño',
        NL: 'Normaal - Extra bed voor kind',
        AR: 'عادي - سرير إضافي للطفل'
      }
    };

    const getTranslation = (key: string) => {
      return translations[key]?.[language] || key;
    };

    return [
      {
        name: getTranslation('Normal - Accommodation'),
        amount: 58.2,
        amountStr: 'USD 58.2',
        description: ''
      },
      {
        name: getTranslation('Normal - Extra bed for child'),
        amount: 2.1,
        amountStr: 'USD 2.1',
        description: ''
      }
    ];
  }

  private buildSampleCityTaxList(language: string) {
    const translations = {
      'Tourist Tax': {
        FR: 'Taxe de séjour',
        DE: 'Touristensteuer',
        IT: 'Tassa di soggiorno',
        ES: 'Impuesto turístico',
        NL: 'Toeristenbelasting',
        AR: 'ضريبة سياحية'
      },
      'Tourism Tax': {
        FR: 'Taxe de tourisme',
        DE: 'Tourismusabgabe',
        IT: 'Imposta sul turismo',
        ES: 'Tasa turística',
        NL: 'Toerismebelasting',
        AR: 'ضريبة السياحة'
      },
      '<p>A fixed city tax of $10 will be applied per person for each night.</p>': {
        FR: '<p>Une taxe de séjour fixe de 10 $ sera appliquée par personne et par nuit.</p>',
        DE: '<p>Eine feste Kurtaxe von 10 $ wird pro Person und Nacht erhoben.</p>',
        IT: '<p>Verrà applicata una tassa di soggiorno fissa di $ 10 a persona per notte.</p>',
        ES: '<p>Se aplicará un impuesto municipal fijo de $ 10 por persona por noche.</p>',
        NL: '<p>Er wordt een vaste toeristenbelasting van $ 10 per persoon per nacht in rekening gebracht.</p>',
        AR: '<p>سيتم تطبيق ضريبة مدينة ثابتة قدرها 10 دولارات لكل شخص في الليلة.</p>'
      }
    };

    const getTranslation = (key: string) => {
      return translations[key]?.[language] || key;
    };

    return [
      {
        name: getTranslation('Tourist Tax'),
        cityTaxAmountStr: 'USD 12',
        amount: 12,
        description: '',
        translationList: [
          {
            name: '',
            description: '<p></p>',
            languageCode: 'DE'
          },
          {
            name: null,
            description: null,
            languageCode: 'FR'
          },
          {
            name: null,
            description: null,
            languageCode: 'ES'
          },
          {
            name: null,
            description: null,
            languageCode: 'IT'
          },
          {
            name: null,
            description: null,
            languageCode: 'AR'
          }
        ]
      },
      {
        name: getTranslation('Tourism Tax'),
        cityTaxAmountStr: 'USD 90',
        amount: 90,
        description: getTranslation(
          '<p>A fixed city tax of $10 will be applied per person for each night.</p>'
        ),
        translationList: [
          {
            name: 'Tourismus Abgabe',
            description: null,
            languageCode: 'DE'
          },
          {
            name: null,
            description: null,
            languageCode: 'FR'
          },
          {
            name: null,
            description: null,
            languageCode: 'ES'
          },
          {
            name: null,
            description: null,
            languageCode: 'IT'
          },
          {
            name: null,
            description: null,
            languageCode: 'AR'
          }
        ]
      }
    ];
  }

  private buildSampleBooker(language: string) {
    return {
      firstName: 'Augusto',
      lastName: 'Traversa',
      emailAddress: 'augustotraversa98@gmail.com',
      phoneNumber: '+5491141683937',
      countryNumber: '598',
      companyName: null,
      companyAddress: null,
      companyCity: null,
      companyCountryName: null
    };
  }

  private buildSamplePaymentTerm(language: string) {
    const translations = {
      'Pay upon booking': {
        FR: 'Payer à la réservation',
        DE: 'Zahlung bei Buchung',
        IT: 'Paga alla prenotazione',
        ES: 'Pagar al reservar',
        NL: 'Betalen bij boeking',
        AR: 'ادفع عند الحجز'
      },
      '<p>Pay upon booking</p>': {
        FR: '<p>Payer à la réservation</p>',
        DE: '<p>Zahlung bei Buchung</p>',
        IT: '<p>Paga alla prenotazione</p>',
        ES: '<p>Pagar al reservar</p>',
        NL: '<p>Betalen bij boeking</p>',
        AR: '<p>ادفع عند الحجز</p>'
      }
    };

    const getTranslation = (key: string) => {
      return translations[key]?.[language] || key;
    };

    return {
      name: getTranslation('Pay upon booking'),
      code: 'POB',
      description: getTranslation('<p>Pay upon booking</p>'),
      payAtHotelDescription: getTranslation('<p>Pay upon booking</p>'),
      payOnConfirmationDescription: getTranslation('<p>Pay upon booking</p>')
    };
  }

  private buildSampleCxlPolicy(language: string) {
    const translations = {
      'Flexible 3 days / Free of charge': {
        FR: 'Flexible 3 jours / Gratuit',
        DE: 'Flexibel 3 Tage / Kostenlos',
        IT: 'Flessibile 3 giorni / Gratuito',
        ES: 'Flexible 3 días / Gratis',
        NL: 'Flexibel 3 dagen / Gratis',
        AR: 'مرن 3 أيام / مجاني'
      }
    };

    const getTranslation = (key: string) => {
      return translations[key]?.[language] || key;
    };

    return {
      name: getTranslation('Flexible 3 days / Free of charge'),
      description: getTranslation('Flexible 3 days / Free of charge')
    };
  }

  private buildSampleReservationList(language: string) {
    const translations = {
      'Pay upon booking': {
        FR: 'Payer à la réservation',
        DE: 'Zahlung bei Buchung',
        IT: 'Paga alla prenotazione',
        ES: 'Pagar al reservar',
        NL: 'Betalen bij boeking',
        AR: 'ادفع عند الحجز'
      },
      '<p>Pay upon booking</p>': {
        FR: '<p>Payer à la réservation</p>',
        DE: '<p>Zahlung bei Buchung</p>',
        IT: '<p>Paga alla prenotazione</p>',
        ES: '<p>Pagar al reservar</p>',
        NL: '<p>Betalen bij boeking</p>',
        AR: '<p>ادفع عند الحجز</p>'
      },
      'Other Payment Method': {
        FR: 'Autre méthode de paiement',
        DE: 'Andere Zahlungsmethode',
        IT: 'Altro metodo di pagamento',
        ES: 'Otro método de pago',
        NL: 'Andere betaalmethode',
        AR: 'طريقة دفع أخرى'
      },
      'Other Payment Method <br/>': {
        FR: 'Autre méthode de paiement <br/>',
        DE: 'Andere Zahlungsmethode <br/>',
        IT: 'Altro metodo di pagamento <br/>',
        ES: 'Otro método de pago <br/>',
        NL: 'Andere betaalmethode <br/>',
        AR: 'طريقة دفع أخرى <br/>'
      },
      'This option allows guests to pay using alternative methods managed by your hotel. You can customize the name and provide detailed payment instructions.':
        {
          FR: 'Cette option permet aux clients de payer en utilisant des méthodes alternatives gérées par votre hôtel. Vous pouvez personnaliser le nom et fournir des instructions de paiement détaillées.',
          DE: 'Diese Option ermöglicht es Gästen, mit alternativen Methoden zu bezahlen, die von Ihrem Hotel verwaltet werden. Sie können den Namen anpassen und detaillierte Zahlungsanweisungen bereitstellen.',
          IT: 'Questa opzione consente agli ospiti di pagare utilizzando metodi alternativi gestiti dal tuo hotel. Puoi personalizzare il nome e fornire istruzioni di pagamento dettagliate.',
          ES: 'Esta opción permite a los huéspedes pagar utilizando métodos alternativos gestionados por su hotel. Puede personalizar el nombre y proporcionar instrucciones de pago detalladas.',
          NL: 'Met deze optie kunnen gasten betalen met alternatieve methoden die door uw hotel worden beheerd. U kunt de naam aanpassen en gedetailleerde betalingsinstructies geven.',
          AR: 'يتيح هذا الخيار للضيوف الدفع باستخدام طرق بديلة يديرها فندقك. يمكنك تخصيص الاسم وتقديم تعليمات دفع مفصلة.'
        },
      'Flexible 3 days / Free of charge': {
        FR: 'Flexible 3 jours / Gratuit',
        DE: 'Flexibel 3 Tage / Kostenlos',
        IT: 'Flessibile 3 giorni / Gratuito',
        ES: 'Flexible 3 días / Gratis',
        NL: 'Flexibel 3 dagen / Gratis',
        AR: 'مرن 3 أيام / مجاني'
      }
    };

    const getTranslation = (key: string) => {
      return translations[key]?.[language] || key;
    };

    return [
      {
        bookingDateStr: null,
        paymentTerm: {
          name: getTranslation('Pay upon booking'),
          code: 'POB',
          description: getTranslation('<p>Pay upon booking</p>'),
          payAtHotelDescription: getTranslation('<p>Pay upon booking</p>'),
          payOnConfirmationDescription: getTranslation('<p>Pay upon booking</p>')
        },
        paymentMethod: {
          name: getTranslation('Other Payment Method'),
          description: getTranslation(
            'This option allows guests to pay using alternative methods managed by your hotel. You can customize the name and provide detailed payment instructions.'
          ),
          code: 'PMDOTH',
          cardType: '',
          accountNumber: '',
          moreInfo: {
            metadata: {
              customName: 'Apple pay',
              description: 'Apple pay Test'
            }
          }
        },
        paymentMethodName: getTranslation('Other Payment Method <br/>'),
        cxlPolicy: {
          name: getTranslation('Flexible 3 days / Free of charge'),
          description: getTranslation('Flexible 3 days / Free of charge')
        },
        hotelTimezone: null,
        arrival: '2026-01-21T13:00:00.000Z',
        departure: '2026-01-24T11:00:00.000Z'
      }
    ];
  }

  private buildSampleMailReservationList(language: string) {
    const translations = {
      'The hotel’s Superior Rooms are suitable for a maximum of 2 people, and all feature king-sized beds or pairs of single beds, complemented by chic en-suite bathrooms with tubs. All of them enjoy natural light through floor-to-ceiling windows, and offer a cosy 22 m² of space. Many have views to the east where the sun rises over the mainland. Others offer side views of the Straits of Malacca, the waterfront or </span></span><a href="https://bhgp.bayviewhotels.com/our-hotel/where-we-are/" target="_blank"><u><span style="color:rgb(0, 0, 0);">Georgetown’s museums</span></u></a><span style="color:rgb(0, 0, 0);"><span style="background-color:rgb(255, 255, 255);"> . Free WiFi helps you stay connected with friends and family, and there’s a large desk so you can keep on top of your work. Air conditioning with individual controls means the temperature is always just right, and minibar fridges and tea- and coffee-making facilities help you feel at home. You can catch movies or the latest news on the LCD TV, and an electronic safe guarantees that your valuables are always secure.':
        {
          FR: "Les chambres supérieures de l'hôtel conviennent à un maximum de 2 personnes et disposent toutes de lits king-size ou de lits jumeaux, complétées par des salles de bains privatives chics avec baignoire.",
          DE: 'Die Superior-Zimmer des Hotels sind für maximal 2 Personen geeignet und verfügen alle über Kingsize-Betten oder zwei Einzelbetten, ergänzt durch schicke eigene Badezimmer mit Badewanne.',
          IT: "Le camere Superior dell'hotel sono adatte per un massimo di 2 persone e dispongono tutte di letti king-size o due letti singoli, completate da eleganti bagni privati con vasca.",
          ES: 'Las habitaciones superiores del hotel son adecuadas para un máximo de 2 personas y todas cuentan con camas extragrandes o dos camas individuales, complementadas con elegantes baños privados con bañera.',
          NL: 'De Superior kamers van het hotel zijn geschikt voor maximaal 2 personen en beschikken allemaal over kingsize bedden of twee aparte bedden, aangevuld met chique en-suite badkamers met bad.',
          AR: 'غرف الفندق السوبيريور مناسبة لشخصين كحد أقصى، وتتميز جميعها بأسرة بحجم كينغ أو أزواج من الأسرة المفردة، تكملها حمامات داخلية أنيقة مع أحواض استحمام.'
        },
      'Short Stay': {
        FR: 'Court séjour',
        DE: 'Kurzaufenthalt',
        IT: 'Soggiorno breve',
        ES: 'Estancia corta',
        NL: 'Kort verblijf',
        AR: 'إقامة قصيرة'
      },
      '<p>For short stays only</p>': {
        FR: '<p>Pour les courts séjours uniquement</p>',
        DE: '<p>Nur für Kurzaufenthalte</p>',
        IT: '<p>Solo per soggiorni brevi</p>',
        ES: '<p>Solo para estancias cortas</p>',
        NL: '<p>Alleen voor kort verblijf</p>',
        AR: '<p>للإقامة القصيرة فقط</p>'
      },
      'Final Cleaning Service': {
        FR: 'Service de nettoyage final',
        DE: 'Endreinigungsservice',
        IT: 'Servizio di pulizia finale',
        ES: 'Servicio de limpieza final',
        NL: 'Eindschoonmaakservice',
        AR: 'خدمة التنظيف النهائي'
      },
      'Pet surchage 25 Euro': {
        FR: 'Supplément animal de 25 euros',
        DE: 'Haustierzuschlag 25 Euro',
        IT: 'Supplemento animali 25 Euro',
        ES: 'Suplemento mascota 25 Euro',
        NL: 'Huisdierentoeslag 25 Euro',
        AR: 'رسوم الحيوانات الأليفة 25 يورو'
      },
      'Extra bed for child': {
        FR: 'Lit supplémentaire pour enfant',
        DE: 'Zustellbett für Kind',
        IT: 'Letto supplementare per bambino',
        ES: 'Cama supletoria para niño',
        NL: 'Extra bed voor kind',
        AR: 'سرير إضافي للطفل'
      },
      Apartment: {
        FR: 'Appartement',
        DE: 'Wohnung',
        IT: 'Appartamento',
        ES: 'Apartamento',
        NL: 'Appartement',
        AR: 'شقة'
      },
      'Bunk bed': {
        FR: 'Lit superposé',
        DE: 'Etagenbett',
        IT: 'Letto a castello',
        ES: 'Litera',
        NL: 'Stapelbed',
        AR: 'سرير بطابقين'
      },
      'Boxspring bed': {
        FR: 'Lit boxspring',
        DE: 'Boxspringbett',
        IT: 'Letto boxspring',
        ES: 'Cama boxspring',
        NL: 'Boxspringbed',
        AR: 'سرير بوكس ​​سبرينج'
      },
      'Other Payment Method': {
        FR: 'Autre méthode de paiement',
        DE: 'Andere Zahlungsmethode',
        IT: 'Altro metodo di pagamento',
        ES: 'Otro método de pago',
        NL: 'Andere betaalmethode',
        AR: 'طريقة دفع أخرى'
      },
      'Other Payment Method <br/>': {
        FR: 'Autre méthode de paiement <br/>',
        DE: 'Andere Zahlungsmethode <br/>',
        IT: 'Altro metodo di pagamento <br/>',
        ES: 'Otro método de pago <br/>',
        NL: 'Andere betaalmethode <br/>',
        AR: 'طريقة دفع أخرى <br/>'
      },
      'This option allows guests to pay using alternative methods managed by your hotel. You can customize the name and provide detailed payment instructions.':
        {
          FR: 'Cette option permet aux clients de payer en utilisant des méthodes alternatives gérées par votre hôtel. Vous pouvez personnaliser le nom et fournir des instructions de paiement détaillées.',
          DE: 'Diese Option ermöglicht es Gästen, mit alternativen Methoden zu bezahlen, die von Ihrem Hotel verwaltet werden. Sie können den Namen anpassen und detaillierte Zahlungsanweisungen bereitstellen.',
          IT: 'Questa opzione consente agli ospiti di pagare utilizzando metodi alternativi gestiti dal tuo hotel. Puoi personalizzare il nome e fornire istruzioni di pagamento dettagliate.',
          ES: 'Esta opción permite a los huéspedes pagar utilizando métodos alternativos gestionados por su hotel. Puede personalizar el nombre y proporcionar instrucciones de pago detalladas.',
          NL: 'Met deze optie kunnen gasten betalen met alternatieve methoden die door uw hotel worden beheerd. U kunt de naam aanpassen en gedetailleerde betalingsinstructies geven.',
          AR: 'يتيح هذا الخيار للضيوف الدفع باستخدام طرق بديلة يديرها فندقك. يمكنك تخصيص الاسم وتقديم تعليمات دفع مفصلة.'
        },
      Bedroom: {
        FR: 'Chambre',
        DE: 'Schlafzimmer',
        IT: 'Camera da letto',
        ES: 'Dormitorio',
        NL: 'Slaapkamer',
        AR: 'غرفة نوم'
      }
    };

    // Feature list translations
    const featureTranslations = {
      Hairdryer: {
        FR: 'Sèche-cheveux',
        DE: 'Föhn',
        IT: 'Asciugacapelli',
        ES: 'Secador de pelo',
        NL: 'Haardroger',
        AR: 'مجفف شعر'
      },
      'Walk-in Shower': {
        FR: "Douche à l'italienne",
        DE: 'ebenerdige Dusche',
        IT: 'Doccia walk-in',
        ES: 'Ducha a ras de suelo',
        NL: 'Inloopdouche',
        AR: 'دش مقصورة'
      },
      'Air condition': {
        FR: 'Climatisation',
        DE: 'Klimaanlage',
        IT: 'Aria condizionata',
        ES: 'Aire acondicionado',
        NL: 'Airconditioning',
        AR: 'تكييف'
      },
      'Carpet Floor': {
        FR: 'Moquette',
        DE: 'Teppichboden',
        IT: 'Pavimento in moquette',
        ES: 'Suelo de moqueta',
        NL: 'Tapijtvloer',
        AR: 'أرضية مفروشة بالسجاد'
      },
      'Wlan/Wifi': {
        FR: 'Wlan/Wifi',
        DE: 'Wlan/Wifi',
        IT: 'Wlan/Wifi',
        ES: 'Wlan/Wifi',
        NL: 'Wlan/Wifi',
        AR: 'واي فاي'
      },
      'Daily Servicing': {
        FR: 'Entretien quotidien',
        DE: 'Tägliche Reinigung',
        IT: 'Pulizia giornaliera',
        ES: 'Servicio diario',
        NL: 'Dagelijkse schoonmaak',
        AR: 'خدمة يومية'
      },
      Dresser: {
        FR: 'Commode',
        DE: 'Kommode',
        IT: 'Cassettiera',
        ES: 'Cómoda',
        NL: 'Dressoir',
        AR: 'تسريحة'
      },
      'Ensuite Bathroom': {
        FR: 'Salle de bain attenante',
        DE: 'Eigenes Badezimmer',
        IT: 'Bagno in camera',
        ES: 'Baño en suite',
        NL: 'Ensuite badkamer',
        AR: 'حمام داخلي'
      },
      'Sofa chair': {
        FR: 'Fauteuil',
        DE: 'Sofasessel',
        IT: 'Poltrona',
        ES: 'Sillón',
        NL: 'Fauteuil',
        AR: 'كرسي أريكة'
      },
      'Floor lamp': {
        FR: 'Lampadaire',
        DE: 'Stehlampe',
        IT: 'Lampada da terra',
        ES: 'Lámpara de pie',
        NL: 'Vloerlamp',
        AR: 'مصباح أرضي'
      },
      'Smart TV': {
        FR: 'Smart TV',
        DE: 'Smart TV',
        IT: 'Smart TV',
        ES: 'Smart TV',
        NL: 'Smart TV',
        AR: 'تلفزيون ذكي'
      },
      Fridge: {
        FR: 'Réfrigérateur',
        DE: 'Kühlschrank',
        IT: 'Frigorifero',
        ES: 'Refrigerador',
        NL: 'Koelkast',
        AR: 'ثلاجة'
      },
      'Allergic friendly': {
        FR: 'Adapté aux allergies',
        DE: 'Allergikerfreundlich',
        IT: 'Adatto agli allergici',
        ES: 'Apto para alérgicos',
        NL: 'Allergievriendelijk',
        AR: 'صديق للحساسية'
      },
      'Blackout curtain': {
        FR: 'Rideau occultant',
        DE: 'Verdunkelungsvorhang',
        IT: 'Tenda oscurante',
        ES: 'Cortina opaca',
        NL: 'Verduisterend gordijn',
        AR: 'ستارة تعتيم'
      },
      Minibar: {
        FR: 'Minibar',
        DE: 'Minibar',
        IT: 'Minibar',
        ES: 'Minibar',
        NL: 'Minibar',
        AR: 'ميني بار'
      },
      Bidet: { FR: 'Bidet', DE: 'Bidet', IT: 'Bidet', ES: 'Bidet', NL: 'Bidet', AR: 'بيديه' },
      'Bathroom Amenities': {
        FR: 'Articles de toilette',
        DE: 'Badezimmerartikel',
        IT: 'Articoli da toeletta',
        ES: 'Artículos de aseo',
        NL: 'Badkamerbenodigdheden',
        AR: 'مستلزمات الحمام'
      }
    };

    const getTranslation = (key: string, dict: Record<string, any> = translations) => {
      // Allow partial match for long description if needed, or stick to exact key
      // The long description in the sample is extremely long and contains HTML, I will use a simplified key check or just the first sentence if it matched.
      // But for exact match provided above, I will just use the key.

      // Handle the long description specifically if it contains the start of the text
      if (key.startsWith('<p><span style="color:rgb(0, 0, 0);">')) {
        return (
          dict[
            'The hotel’s Superior Rooms are suitable for a maximum of 2 people, and all feature king-sized beds or pairs of single beds, complemented by chic en-suite bathrooms with tubs. All of them enjoy natural light through floor-to-ceiling windows, and offer a cosy 22 m² of space. Many have views to the east where the sun rises over the mainland. Others offer side views of the Straits of Malacca, the waterfront or </span></span><a href="https://bhgp.bayviewhotels.com/our-hotel/where-we-are/" target="_blank"><u><span style="color:rgb(0, 0, 0);">Georgetown’s museums</span></u></a><span style="color:rgb(0, 0, 0);"><span style="background-color:rgb(255, 255, 255);"> . Free WiFi helps you stay connected with friends and family, and there’s a large desk so you can keep on top of your work. Air conditioning with individual controls means the temperature is always just right, and minibar fridges and tea- and coffee-making facilities help you feel at home. You can catch movies or the latest news on the LCD TV, and an electronic safe guarantees that your valuables are always secure.'
          ]?.[language] || key
        );
      }

      return dict[key]?.[language] || key;
    };

    return [
      {
        idx: 1,
        reservation: {
          rfc: {
            name: 'Superior Clone AVRRFC', // Probably a product name, keep as is
            numberOfBedrooms: 2,
            space: 30,
            description: getTranslation(
              '<p><span style="color:rgb(0, 0, 0);"><span style="background-color:rgb(255, 255, 255);">The hotel’s Superior Rooms are suitable for a maximum of 2 people, and all feature king-sized beds or pairs of single beds, complemented by chic en-suite bathrooms with tubs. All of them enjoy natural light through floor-to-ceiling windows, and offer a cosy 22 m² of space. Many have views to the east where the sun rises over the mainland. Others offer side views of the Straits of Malacca, the waterfront or </span></span><a href="https://bhgp.bayviewhotels.com/our-hotel/where-we-are/" target="_blank"><u><span style="color:rgb(0, 0, 0);">Georgetown’s museums</span></u></a><span style="color:rgb(0, 0, 0);"><span style="background-color:rgb(255, 255, 255);"> . Free WiFi helps you stay connected with friends and family, and there’s a large desk so you can keep on top of your work. Air conditioning with individual controls means the temperature is always just right, and minibar fridges and tea- and coffee-making facilities help you feel at home. You can catch movies or the latest news on the LCD TV, and an electronic safe guarantees that your valuables are always secure.</span></span></p>'
            ),
            standardFeatureList: [
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Hairdryer', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Walk-in Shower', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Air condition', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Carpet Floor', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Wlan/Wifi', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Daily Servicing', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Dresser', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Ensuite Bathroom', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Sofa chair', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Floor lamp', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Smart TV', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Fridge', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Allergic friendly', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Blackout curtain', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Minibar', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: false,
                quantity: 1,
                name: getTranslation('Bidet', featureTranslations)
              },
              {
                isEvenIndexDirectionInEmail: true,
                quantity: 1,
                name: getTranslation('Bathroom Amenities', featureTranslations)
              }
            ],
            rfcImageList: [
              {
                imageUrl:
                  'https://assets-cdn-qa.gauvendi.com/hotel/GV205633/sens_hotel_rest_superior_slide_02.jpg'
              },
              {
                imageUrl: 'https://assets-cdn-qa.gauvendi.com/hotel/GV205633/superior-08.jpg'
              },
              {
                imageUrl:
                  'https://assets-cdn-qa.gauvendi.com/hotel/GV205633/Superior-Room-3-1-2200x1200.jpg'
              }
            ]
          },
          spaceTypeMeasurementUnit: getTranslation('Bedroom'),
          rfcRatePlan: {
            ratePlan: {
              name: getTranslation('Short Stay'),
              description: getTranslation('<p>For short stays only</p>')
            }
          },
          includedServiceList: [
            {
              isEvenIndexDirectionInEmail: true,
              totalCount: 1,
              hotelAmenity: {
                name: getTranslation('Final Cleaning Service')
              }
            },
            {
              isEvenIndexDirectionInEmail: false,
              totalCount: 2,
              hotelAmenity: {
                name: getTranslation('Final Cleaning Service')
              }
            },
            {
              isEvenIndexDirectionInEmail: true,
              totalCount: 3,
              hotelAmenity: {
                name: getTranslation('Pet surchage 25 Euro')
              }
            },
            {
              isEvenIndexDirectionInEmail: false,
              totalCount: 3,
              hotelAmenity: {
                name: getTranslation('Extra bed for child')
              }
            }
          ],
          extraServiceList: [],
          spaceTypeName: getTranslation('Apartment'),
          adult: 2,
          children: 1,
          childrenAgeList: [3],
          pets: 1,
          matchedFeatureList: [
            {
              isEvenIndexDirectionInEmail: true,
              quantity: 1,
              name: getTranslation('Apartment')
            },
            {
              isEvenIndexDirectionInEmail: false,
              quantity: 1,
              name: getTranslation('Bunk bed')
            },
            {
              isEvenIndexDirectionInEmail: true,
              quantity: 1,
              name: getTranslation('Boxspring bed')
            }
          ],
          guestNote: null,
          additionalGuest: [],
          totalAccommodations: 1211.45,
          paymentMethodName: getTranslation('Other Payment Method <br/>'),
          paymentMethod: {
            name: getTranslation('Other Payment Method'),
            description: getTranslation(
              'This option allows guests to pay using alternative methods managed by your hotel. You can customize the name and provide detailed payment instructions.'
            ),
            code: 'PMDOTH',
            cardType: '',
            accountNumber: '',
            moreInfo: {
              metadata: {
                customName: 'Apple pay',
                description: 'Apple pay Test'
              }
            }
          },
          specialRequest: null,
          arrival: '2026-01-21T13:00:00.000Z',
          departure: '2026-01-24T11:00:00.000Z',
          primaryGuest: {
            id: '7b3ca6a7-bf1b-49a0-8636-fbff43e106e7',
            countryId: '4c07aa31-3023-4cd8-9fce-e3777624646f',
            firstName: 'Augusto',
            lastName: 'Traversa',
            phoneNumber: '+5491141683937',
            city: 'Capital Federal',
            state: 'Buenos Aires',
            emailAddress: 'augustotraversa98@gmail.com',
            countryNumber: '598',
            postalCode: '1055',
            isAdult: true,
            country: {
              name: '',
              id: ''
            },
            address: 'cordoba 1505 piso 1 depto 1',
            isBooker: false,
            isMainGuest: true
          }
        }
      }
    ];
  }

  private buildSamplePrimaryGuest(language: string) {
    return {
      id: '7b3ca6a7-bf1b-49a0-8636-fbff43e106e7',
      countryId: '4c07aa31-3023-4cd8-9fce-e3777624646f',
      firstName: 'Augusto',
      lastName: 'Traversa',
      phoneNumber: '+5491141683937',
      city: 'Capital Federal',
      state: 'Buenos Aires',
      emailAddress: 'augustotraversa98@gmail.com',
      countryNumber: '598',
      postalCode: '1055',
      isAdult: true,
      country: {
        name: '',
        id: ''
      },
      address: 'cordoba 1505 piso 1 depto 1',
      isBooker: false,
      isMainGuest: true
    };
  }

  async sendCppBookingConfirmationEmail(
    input: SendConfirmBookingEmailDto,
    isRetryable: boolean = false
  ): Promise<ResponseContent> {
    try {
      const { bookingId, translateTo, hotelTemplateEmail } = input;
      const language = translateTo || LanguageCodeEnum.EN;
      // Get booking information
      const booking = await this.getBookingInformation({ bookingId, language });

      if (!booking || !booking.hotelId) {
        throw new Error('Booking not found or hotelId is missing');
      }

      // Get hotel information
      const hotel = await this.getHotelInformation(booking.hotelId);
      if (!hotel) {
        throw new Error('Hotel not found');
      }

      const gradedLabelSetting = await this.hotelConfigurationRepository.findOneByConfigType({
        hotelId: hotel.id,
        configType: HotelConfigurationTypeEnum.ROOM_PRODUCT_RECOMMENDATION_GRADED_LABEL_SETTING
      });

      const isLowestQpaque = gradedLabelSetting?.configValue?.metadata?.OPAQUE;

      const isNoPreferences = isLowestQpaque && booking.bookingFlow === BookingFlow.LOWEST_PRICE;

      if (isNoPreferences) {
        booking['standardFeature'] = null;
        booking['spaceTypeList'] = null;

        for (const reservation of booking.mailReservationList) {
          reservation.reservation.matchedFeatureList = [];
          reservation.reservation.rfc.standardFeatureList = [];
        }
      }
      // Get template configuration
      const bookingConfirmationEmailType =
        hotelTemplateEmail || HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION;
      const templateEmail = await this.getTemplateEmail(
        hotel,
        booking,
        bookingConfirmationEmailType,
        language
      );

      const emailTemplateId = templateEmail?.templateId;

      // Check if template is enabled
      if (templateEmail && !templateEmail.isEnable) {
        // Update booking as email sent even if template is disabled
        await this.updateBookingEmailSentStatus(bookingId, true);

        return {
          message: {
            code: EmailValidationMessage.CPP_CONFIRMATION_EMAIL_SUCCESS,
            message: 'Email template disabled but marked as sent'
          },
          status: ResponseContentStatusEnum.SUCCESS
        };
      }

      // Set booking total accommodations and services
      this.setBookingTotalAccommodationsAndServices(booking, hotel);

      // Prepare email recipients
      const sendToMails = new Set<string>();
      if (hotel.emailAddressList && hotel.emailAddressList.length > 0) {
        for (const email of hotel.emailAddressList) {
          if (email) sendToMails.add(email);
        }
      }
      // Add booker email
      if (booking.booker?.emailAddress) {
        sendToMails.add(booking.booker.emailAddress);
      }

      // Add guest emails
      booking.reservationList?.forEach((reservation: any) => {
        if (reservation.guestList) {
          reservation.guestList.forEach((guest: any) => {
            if (guest.emailAddress) {
              sendToMails.add(guest.emailAddress);
            }
          });
        }
      });

      // Add hotel emails if configured
      if (hotel.isIncludeHotelEmailInBookingConfirmation && hotel.emailAddressList) {
        hotel.emailAddressList.forEach((email: string) => {
          if (email) sendToMails.add(email);
        });
      }

      const recipientList = Array.from(sendToMails).filter((email) => email);

      if (recipientList.length === 0) {
        throw new Error('No valid email recipients found');
      }

      // Prepare sender information (from hotel, matching Java implementation)
      const senderName = hotel.senderName;
      const senderEmail = hotel.senderEmail;

      // Prepare metadata to match sample data structure with all fields
      const metadata: EmailMetadata = {
        booking: booking,
        hotel: {
          ...hotel,
          isTaxIncluded: hotel.taxSetting === TaxSettingEnum.INCLUSIVE ? true : false
        },
        booker: booking.booker,
        email: templateEmail,
        translation: {}, // Will be populated by fetchEmailStaticContentTranslation
        bookingConfirmationUrl: this.getBookingConfirmationUrl(hotel),
        // Additional fields from sample data
        standardFeature: booking['standardFeature'] || null,
        spaceTypeList: booking['spaceTypeList'] || null,
        mailReservationList: booking.mailReservationList || null,
        // departureStr: booking.departureStr || null,
        // arrivalStr: booking.arrivalStr || null,
        numberRoom: booking['numberRoom'] || null,
        brandingMarketing: hotel.brandingMarketing || null
      };

      // Prepare attachments (PDF generation would go here)
      const attachments = await this.prepareReservationAttachments(booking, hotel, language);

      // Send email
      await this.sendgridService.constructAndSendMail(
        HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION,
        senderName,
        senderEmail,
        recipientList,
        emailTemplateId,
        metadata,
        attachments,
        language,
        isNoPreferences
      );

      // Update booking email sent status
      await this.updateBookingEmailSentStatus(bookingId, true);

      return {
        message: {
          code: EmailValidationMessage.CPP_CONFIRMATION_EMAIL_SUCCESS,
          message: 'CPP booking confirmation email sent successfully'
        },
        status: ResponseContentStatusEnum.SUCCESS
      };
    } catch (error) {
      if (isRetryable && error.message.includes('retryable')) {
        throw error; // Re-throw for retry mechanism
      }

      return {
        message: {
          code: EmailValidationMessage.EMAIL_SEND_FAILED,
          message: error.message
        },
        status: ResponseContentStatusEnum.ERROR
      };
    }
  }

  async sendProposedBookingEmail(input: SendConfirmBookingEmailDto) {
    const { translateTo, bookingId, hotelId } = input;
    if (!hotelId) {
      return {
        message: {
          code: EmailValidationMessage.EMAIL_SEND_FAILED,
          message: 'Hotel ID is required'
        },
        status: ResponseContentStatusEnum.ERROR
      };
    }
    const [hotelConfigurations, bookingProposalSetting] = await Promise.all([
      this.hotelConfigurationRepository.getHotelConfigurations({
        hotelId,
        configTypes: [
          HotelConfigurationTypeEnum.TAX_INFORMATION,
          HotelConfigurationTypeEnum.TERMS_OF_USE_URL,
          HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL,
          HotelConfigurationTypeEnum.IMPRESSUM_URL,
          HotelConfigurationTypeEnum.ISE_URL
        ]
      }),
      this.bookingProposalSettingRepository.findOne({ where: { hotelId, bookingId } })
    ]);

    if (!bookingProposalSetting) {
      return {
        message: {
          code: EmailValidationMessage.EMAIL_SEND_FAILED,
          message: 'Booking proposal setting not found'
        },
        status: ResponseContentStatusEnum.ERROR
      };
    }
    await this.sendCppProposalBookingConfirmationEmail({
      bookingId: bookingId,
      hotelId,
      translateTo: translateTo,
      hotelConfigurations,
      bookingProposalSetting
    });
    return {
      message: {
        code: EmailValidationMessage.EMAIL_SEND_SUCCESS,
        message: 'CPP proposal booking confirmation email sent successfully'
      },
      status: ResponseContentStatusEnum.SUCCESS
    };
  }

  async sendCppProposalBookingConfirmationEmail(input: {
    bookingId: string;
    hotelId: string;
    translateTo?: string;
    hotelConfigurations: HotelConfiguration[];
    bookingProposalSetting: BookingProposalSetting;
  }) {
    const { bookingId, hotelId, translateTo, hotelConfigurations, bookingProposalSetting } = input;
    const language = translateTo || LanguageCodeEnum.EN;
    // Get booking information
    const booking = await this.getBookingInformation({ bookingId, language });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const hotel = await this.getHotelInformation(hotelId);
    if (!hotel) {
      throw new Error('Hotel not found');
    }

    const cppProposalBookingConfirmationUrl = await this.getProposalBookingConfirmationUrl({
      hotelId,
      hotelCode: hotel.code,
      bookingId,
      language
    });

    if (!cppProposalBookingConfirmationUrl) {
      throw new Error('Proposal booking confirmation url not found');
    }

    await this.getMoreDataForProposalBooking({
      booking,
      hotel,
      hotelConfigurations,
      bookingProposalSetting,
      language
    });

    const templateEmail = await this.getTemplateEmail(
      hotel,
      booking,
      HotelTemplateEmailCodeEnum.PROPOSAL_BOOKING_CONFIRMATION,
      language
    );

    const emailTemplateId = templateEmail?.templateId;

    const metadata = {
      booking: booking,
      hotel: hotel,
      booker: booking.booker,
      email: templateEmail,
      proposalBookingConfirmationUrl: cppProposalBookingConfirmationUrl
    };

    const sendToMails = new Set<string>();
    if (booking.booker?.emailAddress) sendToMails.add(booking.booker.emailAddress);
    if (hotel.emailAddressList) {
      hotel.emailAddressList.forEach((email: string) => {
        if (email) sendToMails.add(email);
      });
    }

    this.sendgridService.constructAndSendMail(
      HotelTemplateEmailCodeEnum.PROPOSAL_BOOKING_CONFIRMATION,
      hotel.senderName,
      hotel.senderEmail,
      Array.from(sendToMails),
      emailTemplateId,
      metadata,
      undefined,
      language
    );
  }

  async getMoreDataForProposalBooking(input: {
    booking: BookingInformationForEmailDto;
    hotel: HotelInformationDto;
    hotelConfigurations: HotelConfiguration[];
    bookingProposalSetting: BookingProposalSetting;
    language: string;
  }): Promise<void> {
    const { booking, hotel, hotelConfigurations, language, bookingProposalSetting } = input;
    try {
      // Set hotel timezone for all reservations
      const defaultTimezone = 'Europe/Berlin';
      const hotelTimezone = hotel.timeZone || defaultTimezone;

      booking.reservationList.forEach((reservation) => {
        reservation.hotelTimezone = hotelTimezone;
      });

      // Filter and process hotel configurations
      const relevantConfigTypes = [
        HotelConfigurationTypeEnum.TAX_INFORMATION,
        HotelConfigurationTypeEnum.TERMS_OF_USE_URL,
        HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL,
        HotelConfigurationTypeEnum.IMPRESSUM_URL
      ];

      for (const config of hotelConfigurations) {
        const value = config.configValue?.metadata?.[language];
        if (value) {
          if (config.configType === HotelConfigurationTypeEnum.TAX_INFORMATION) {
            hotel.taxInformation = value;
          }

          if (config.configType === HotelConfigurationTypeEnum.TERMS_OF_USE_URL) {
            hotel.termsOfUseUrl = value;
          }

          if (config.configType === HotelConfigurationTypeEnum.PRIVACY_STATEMENT_URL) {
            hotel.privacyStatementUrl = value;
          }

          if (config.configType === HotelConfigurationTypeEnum.IMPRESSUM_URL) {
            hotel.impressumUrl = value;
          }
        }
      }

      if (bookingProposalSetting.validBefore) {
        const zonedDate = toZonedTime(bookingProposalSetting.validBefore, hotelTimezone);
        const expiryDateStr = format(zonedDate, 'MMMM dd, hh:mm a');
        booking.expiryDateStr = expiryDateStr;
      }
    } catch (error) {
      throw new Error(`Failed to process booking proposal data: ${error.message}`);
    }
  }

  async downloadBookingConfirmationPdf(
    bookingId: string,
    reservationNumber?: string,
    isOriginPdf?: boolean,
    language?: string
  ): Promise<Buffer | null> {
    const reservation = await this.reservationRepository.findOne(
      { reservationNumber },
      { pdfUrl: true, id: true }
    );

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    let pdfUrl = reservation.pdfUrl;
    if (isOriginPdf && pdfUrl) {
      return await this.s3Service.getFileBuffer(pdfUrl);
    }

    const booking = await this.getBookingInformation({ bookingId, reservationNumber, language });

    if (!booking.hotelId) {
      throw new Error('Hotel ID not found in booking: ' + bookingId);
    }

    const hotel = await this.getHotelInformation(booking.hotelId);
    const { content, downloadUrl } = await this.pdfService.generateBookingConfirmationPdf(
      booking,
      hotel,
      language
    );

    if (reservation.pdfUrl) {
      reservation.pdfUrl = downloadUrl;
      await this.reservationRepository.updateReservations([reservation]);
    }

    return Buffer.from(content, 'base64');
  }

  // Helper methods - these would typically call external services
  private async getBookingInformation(input: {
    bookingId: string;
    reservationNumber?: string;
    language?: string;
  }): Promise<BookingInformationForEmailDto> {
    try {
      const { bookingId, reservationNumber, language } = input;
      const currentTranslateTo = parseLanguageCode(language);
      const filter: BookingSummaryFilterDto = {
        bookingId: bookingId,
        translateTo: currentTranslateTo
      };

      const bookingSummary: BookingSummaryResponseDto =
        await this.bookingSummaryService.getBookingSummary(filter);

      let totalAdult = 0;
      let totalChildren = 0;
      let childrenAgeList: number[] = [];
      let totalPets = 0;
      const spaceTypeList: {
        name: string;
        measurementUnit: string | null;
      }[] = [];
      const includedServiceList: any[] = [];
      const extraServiceList: any[] = [];
      let totalAccommodations = 0;
      let totalServices = 0;

      let reservation =
        bookingSummary.reservationList && bookingSummary.reservationList.length > 0
          ? bookingSummary.reservationList[0]
          : undefined;

      if (reservationNumber) {
        reservation = bookingSummary.reservationList.find(
          (reservation) => reservation.reservationNumber === reservationNumber
        );
      }

      const [amenityList] = await Promise.all([
        // this.roomProductHotelExtraListService.getAvailableAmenity({
        //   hotelId: bookingSummary.hotelId || '',
        //   fromTime: bookingSummary.arrival as any,
        //   toTime: bookingSummary.departure as any,
        //   roomProductCode: bookingSummary.reservationList[0].rfc.code,
        //   salesPlanCode: bookingSummary.reservationList[0].rfcRatePlan.ratePlan.code,
        //   translateTo: language
        // }),
        this.hotelAmenityRepository.getHotelAmenityList({
          ids: bookingSummary.reservationList?.flatMap((reservation) =>
            reservation.reservationAmenityList?.map((service) => service.hotelAmenity.id)
          ),
          translateTo: parseLanguageCode(language),
          relations: ['hotelAmenityPrices']
        })
      ]);

      const amenityMap = new Map<string, HotelAmenity>();

      amenityList.forEach((amenity) => {
        const translatedAmenity = amenity.translations?.find(
          (translation) => translation.languageCode === currentTranslateTo
        );
        const newAmenity = {
          ...amenity,
          name: translatedAmenity?.name || amenity.name,
          description: translatedAmenity?.description || amenity.description
        };
        amenityMap.set(amenity.code, newAmenity);
      });

      // Group city taxes by name and sum amounts
      const cityTaxMap = new Map<string, any>();
      bookingSummary.cityTaxList?.forEach((tax) => {
        // Apply same translation logic as frontend displayTaxInformation pipe
        const translations = tax.translations || [];
        const translatedTax = translations.find(
          (translation) => translation.languageCode === currentTranslateTo
        );
        const translatedName = translatedTax?.name || tax.name;
        const translatedDescription = translatedTax?.description || tax.description;

        // Check if tax with this name already exists
        if (cityTaxMap.has(translatedName)) {
          const existingTax = cityTaxMap.get(translatedName);
          existingTax.amount += tax.amount || 0;
        } else {
          cityTaxMap.set(translatedName, {
            ...tax,
            name: translatedName,
            description: translatedDescription,
            translations: translations
          });
        }
      });
      const cityTaxList = Array.from(cityTaxMap.values());

      const taxMap = new Map<string, any>();
      bookingSummary.bookingTaxList?.forEach((tax) => {
        if (taxMap.has(tax.id)) {
          const existingTax = taxMap.get(tax.id);
          existingTax.amount = Decimal.add(existingTax.amount, tax.amount).toNumber() || 0;
        } else {
          taxMap.set(tax.id, {
            ...tax,
            name: tax.nameWithoutHotelAmenity,
            amount: tax.amount || 0
          });
        }
      });
      const taxList = Array.from(taxMap.values());

      for (const reservation of bookingSummary.reservationList) {
        totalChildren += reservation.childrenAgeList?.length || 0;
        childrenAgeList.push(...(reservation.childrenAgeList || []));
        totalPets += reservation.pets || 0;
        totalAdult += reservation.adult || 0;
        const spaceType = reservation.rfc?.retailFeatureList?.find((feature) =>
          feature.code.startsWith('SPT_')
        );
        spaceTypeList.push({
          name: spaceType?.name || '',
          measurementUnit: spaceType?.measurementUnit || null
        });

        const includedService: any[] = [];
        const extraService: any[] = [];

        for (const service of reservation.reservationAmenityList) {
          const amenity = amenityMap.get(service.hotelAmenity.code);
          if (!amenity) continue;

          const totalCount = service.reservationAmenityDateList?.reduce(
            (acc, date) => acc + date.count,
            0
          );

          service.extraServiceType === ExtraServiceTypeEnum.INCLUDED
            ? includedService.push({
                ...service,
                price: service.totalGrossAmount,
                hotelAmenity: amenity
              })
            : extraService.push({
                ...service,
                price: service.totalGrossAmount / totalCount,
                hotelAmenity: amenity
              });
        }

        includedServiceList.push(includedService);
        extraServiceList.push(extraService);
        totalAccommodations += reservation.totalAccommodationAmount || 0;

        const totalGrossList = extraService
          ?.map((service) => service.totalGrossAmount)
          .filter((amount) => !!amount);

        totalServices +=
          DecimalRoundingHelper.sumWithRounding(totalGrossList, RoundingModeEnum.HALF_ROUND_UP) ||
          0;
      }

      // Transform booking summary to match expected format for email service (with all fields from sample data)
      const transformedData: BookingInformationForEmailDto = {
        // Core booking information
        id: bookingSummary.id || null,
        hotelId: bookingSummary.hotelId || null,
        bookingFlow: bookingSummary.bookingFlow || null,
        bookingNumber: bookingSummary.bookingNumber || null, // used
        arrivalStr: bookingSummary.arrival
          ? formatDateWithLanguage(bookingSummary.arrival, parseLanguageCode(language))
          : null, // used
        departureStr: bookingSummary.departure
          ? formatDateWithLanguage(bookingSummary.departure, parseLanguageCode(language))
          : null, // used
        totalChildren: totalChildren,
        childrenAgeList: childrenAgeList,
        totalAdult: totalAdult,
        totalPets: totalPets,
        totalGrossAmountStr: bookingSummary.totalGrossAmount?.toString(),
        totalBaseAmountStr: bookingSummary.totalBaseAmount?.toString(),
        taxAmount: bookingSummary.bookingTaxList.reduce((acc, tax) => acc + tax.amount, 0),
        bookingTaxList:
          taxList?.map((tax) => ({
            name: tax.name,
            amount: tax.amount,
            amountStr: `${bookingSummary.currencyCode} ${tax.amount?.toString()}`,
            description: tax.description
          })) || null,
        cityTaxAmount: bookingSummary.cityTaxList.reduce((acc, tax) => acc + tax.amount, 0),
        cityTaxList:
          cityTaxList?.map((tax) => {
            // Apply same translation logic as frontend displayTaxInformation pipe
            const translations = tax.translations || [];
            const languageCode = parseLanguageCode(language);
            const foundTranslation = languageCode
              ? translations.find(
                  (translation) =>
                    translation?.languageCode?.toUpperCase() === languageCode?.toUpperCase()
                )
              : null;

            return {
              name: foundTranslation?.name || tax.name,
              cityTaxAmountStr: `${bookingSummary.currencyCode} ${tax.amount?.toString()}`,
              amount: tax.amount,
              description: foundTranslation?.description || tax.description,
              translationList: translations // Include translations array to match frontend structure
            };
          }) || [],
        cityTaxAmountStr: '', // TODO
        amountStr: '', // TODO
        paidAmountStr: bookingSummary.payOnConfirmationAmount?.toString(),
        totalAmountDueStr: bookingSummary.payAtHotelAmount?.toString(),
        spaceTypeCount: bookingSummary.reservationList?.length || 1,
        totalAccommodations: totalAccommodations?.toString(),
        totalServices: totalServices?.toString(),
        specialRequest: bookingSummary.reservationList?.[0]?.specialRequest || null,
        // Hotel information (nested in booking data)
        // hotel: {
        // id: bookingSummary.hotelId || null,
        // name: (bookingSummary as any).hotel?.name || null,
        // code: (bookingSummary as any).hotel?.code || null,
        // timeZone: (bookingSummary as any).hotel?.timeZone || null,
        // address: (bookingSummary as any).hotel?.address || null,
        // taxSetting: (bookingSummary as any).hotel?.taxSetting || null,
        // baseCurrency: (bookingSummary as any).hotel?.baseCurrency || null,
        // measureMetric: (bookingSummary as any).hotel?.measureMetric || null,
        // connector: (bookingSummary as any).hotel?.connector || null,
        // isTaxIncluded: (bookingSummary as any).hotel?.isTaxIncluded || null
        // countryName: (bookingSummary as any).hotel?.countryName || null
        // },

        // Booker information
        booker: {
          firstName: bookingSummary.booker?.firstName || null,
          lastName: bookingSummary.booker?.lastName || null,
          emailAddress: bookingSummary.booker?.emailAddress || null,
          phoneNumber: bookingSummary.booker?.phoneNumber || null,
          countryNumber: bookingSummary.booker?.countryNumber || null,
          companyName: bookingSummary.booker?.companyName || null,
          companyAddress: bookingSummary.booker?.companyAddress || null,
          companyCity: bookingSummary.booker?.companyCity || null,
          companyCountryName: bookingSummary.booker?.companyCountry || null
        },

        // Payment and policy information
        paymentTerm: bookingSummary.paymentTerm || null,
        cxlPolicy: bookingSummary.cxlPolicy || null,

        // Reservation list with comprehensive mapping

        reservationList:
          bookingSummary.reservationList?.map((reservation, index) => {
            const cardType = reservation.paymentMethod?.cardType;
            const accountNumber = reservation.paymentMethod?.accountNumber;
            const cardInfo = `${cardType && accountNumber ? '(' + cardType + ' *' + accountNumber + ')' : ''}`;
            let moreInfo = ``;
            const paymentMethodCode = reservation.paymentMethod?.code;
            switch (paymentMethodCode) {
              case HotelPaymentModeCodeEnum.GUAWCC:
              case HotelPaymentModeCodeEnum.PAYPAL:
                moreInfo = cardInfo;
                break;
              case HotelPaymentModeCodeEnum.GUAWDE:
                moreInfo = `<br/>${Helper.convertNewLineForHtml(reservation.paymentMethod?.moreInfo?.value || '')}`;
                break;
              case HotelPaymentModeCodeEnum.PMDOTH:
                moreInfo = `<br/>${Helper.convertNewLineForHtml(reservation.paymentMethod?.moreInfo?.metadata?.metadata?.description || '')}`;
                break;
              default:
                break;
            }
            const item = {
              bookingDateStr: reservation.bookingDate
                ? formatDateWithLanguage(reservation.bookingDate, parseLanguageCode(language))
                : null,
              paymentTerm: reservation.paymentTerm || null,
              paymentMethod: reservation.paymentMethod || null,
              paymentMethodName: `${reservation.paymentMethod?.name || ''} ${moreInfo}`,
              cxlPolicy: reservation.cxlPolicy || null,
              hotelTimezone: null,
              arrival: reservation.arrival,
              departure: reservation.departure
            };
            return item;
          }) || [],

        mailReservationList:
          bookingSummary.reservationList?.map((reservation, index) => {
            const cardType = reservation.paymentMethod?.cardType;
            const accountNumber = reservation.paymentMethod?.accountNumber;
            const cardInfo = `${cardType && accountNumber ? '(' + cardType + ' *' + accountNumber + ')' : ''}`;
            let moreInfo = ``;
            const paymentMethodCode = reservation.paymentMethod?.code;
            switch (paymentMethodCode) {
              case HotelPaymentModeCodeEnum.GUAWCC:
              case HotelPaymentModeCodeEnum.PAYPAL:
                moreInfo = cardInfo;
                break;
              case HotelPaymentModeCodeEnum.GUAWDE:
                moreInfo = `<br/>${Helper.convertNewLineForHtml(reservation.paymentMethod?.moreInfo?.value || '')}`;
                break;
              case HotelPaymentModeCodeEnum.PMDOTH:
                moreInfo = `<br/>${Helper.convertNewLineForHtml(reservation.paymentMethod?.moreInfo?.metadata?.metadata?.description || '')}`;
                break;
              default:
                break;
            }
            const reservationItem = {
              idx: index + 1,
              reservation: {
                rfc: {
                  name: reservation.rfc?.name || null,
                  numberOfBedrooms: reservation.rfc?.numberOfBedrooms || null,
                  space: reservation.rfc?.space || null,
                  description: reservation.rfc?.description || null,
                  standardFeatureList:
                    reservation.rfc?.standardFeatureList?.map((feature, featureIndex) => {
                      return {
                        isEvenIndexDirectionInEmail: featureIndex % 2 === 0,
                        quantity: 1,
                        name: feature.name || null
                      };
                    }) || null,
                  rfcImageList: reservation.rfc?.rfcImageList || null
                },
                spaceTypeMeasurementUnit: spaceTypeList[index]?.measurementUnit || null,
                rfcRatePlan: {
                  ratePlan: {
                    name: reservation.rfcRatePlan?.ratePlan?.name || null,
                    description: reservation.rfcRatePlan?.ratePlan?.description || null
                  }
                },
                includedServiceList:
                  includedServiceList[index]?.map((service, serviceIndex) => {
                    return {
                      isEvenIndexDirectionInEmail: serviceIndex % 2 === 0,
                      totalCount: service.reservationAmenityDateList?.reduce(
                        (acc, date) => acc + date.count,
                        0
                      ),
                      hotelAmenity: {
                        name: service.hotelAmenity.name
                      }
                    };
                  }) || [],
                extraServiceList:
                  extraServiceList[index]?.map((service, serviceIndex) => ({
                    isEvenIndexDirectionInEmail: serviceIndex % 2 === 0,
                    totalCount: service.reservationAmenityDateList?.reduce(
                      (acc, date) => acc + date.count,
                      0
                    ),
                    hotelAmenity: {
                      name: service.hotelAmenity.name,
                      pricingUnit: service.hotelAmenity.pricingUnit
                    },
                    totalGrossAmountStr: service.totalGrossAmount?.toString(),
                    totalBaseAmountStr: service.totalBaseAmount?.toString(),
                    originalPriceStr: service.price?.toString()
                  })) || [],
                spaceTypeName: spaceTypeList[index]?.name || null,
                adult: reservation.adult || null,
                children: reservation.childrenAgeList?.length || null,
                childrenAgeList: reservation.childrenAgeList || null,
                pets: reservation.pets || null,
                matchedFeatureList:
                  reservation.matchedFeatureList?.map((feature, featureIndex) => {
                    return {
                      isEvenIndexDirectionInEmail: featureIndex % 2 === 0,
                      quantity: feature.quantity || null,
                      name: feature.name || null
                    };
                  }) || null,
                guestNote: reservation.guestNote || null,
                additionalGuest: reservation.additionalGuest || [],
                totalAccommodations: reservation.totalAccommodationAmount,
                paymentMethodName: `${reservation.paymentMethod?.name || ''} ${moreInfo}`,
                paymentMethod: reservation.paymentMethod || null,
                specialRequest: reservation.specialRequest || null,
                arrival: reservation.arrival,
                departure: reservation.departure,
                primaryGuest: reservation.primaryGuest || null
              }
            };
            return reservationItem;
          }) || [],
        primaryGuest: bookingSummary.primaryGuest || null
      };

      return transformedData;
    } catch (error) {
      // Throw a clean error message
      const errorMessage = error?.message || 'Unknown error occurred';
      throw new Error(
        `Failed to get booking information (ID: ${input.bookingId}): ${errorMessage}`
      );
    }
  }

  private extractGuestListFromReservation(reservation: any, allGuests: any[]): any[] {
    // Extract guests related to this specific reservation
    const reservationGuests = allGuests.filter(
      (guest) =>
        guest.id === reservation.primaryGuest?.id ||
        reservation.additionalGuest?.some((addGuest: any) => addGuest.id === guest.id)
    );

    return reservationGuests.map((guest) => ({
      email: guest.emailAddress,
      firstName: guest.firstName,
      lastName: guest.lastName,
      id: guest.id,
      countryId: guest.countryId,
      phoneNumber: guest.phoneNumber,
      city: guest.city,
      state: guest.state,
      countryNumber: guest.countryNumber,
      postalCode: guest.postalCode,
      isAdult: guest.isAdult,
      address: guest.address
    }));
  }

  private async getHotelInformation(hotelId: string): Promise<HotelInformationDto> {
    try {
      // First try to get hotel by ID, if that fails, try by code
      let hotel;

      try {
        // Assuming hotelId could be either ID or code, try to get hotel information
        hotel = await this.hotelsService.getHotelInformation({
          hotelId: hotelId, // If hotelId is actually a code
          expand: ['hotelConfiguration', 'currency', 'country', 'iconImage']
        });
      } catch (error) {
        throw new NotFoundException('Hotel not found');
      }

      // Transform hotel data to match email service expectations
      return {
        id: hotel.id,
        name: hotel.name,
        code: hotel.code,
        senderName: hotel.senderName,
        senderEmail: hotel.senderEmail,
        checkInTime: hotel.hotelTimeSliceConfiguration?.CI,
        checkOutTime: hotel.hotelTimeSliceConfiguration?.CO,
        emailAddressList: hotel.emailAddressList || [],
        isIncludeHotelEmailInBookingConfirmation:
          this.configService.get(ENVIRONMENT.INCLUDE_HOTEL_EMAIL_IN_BOOKING_CONFIRMATION) === 'true'
            ? true
            : false,
        emailImageUrl: hotel.brandingMarketing?.hotelImageLogoUrl || hotel.emailImageUrl,
        iconImageUrl: hotel.iconImageUrl,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state,
        postalCode: hotel.postalCode,
        phone: hotel.phone,
        timeZone: hotel.timeZone,
        country: hotel.country,
        baseCurrency: hotel.baseCurrency,
        hotelWebsiteUrl: hotel.hotelWebsiteUrl?.defaultUrl,
        hotelTermAndConditionUrl: hotel.hotelTermAndConditionUrl,
        hotelPrivacyPolicyUrl: hotel.hotelPrivacyPolicyUrl,
        hotelImpressumUrl: hotel.hotelImpressumUrl,
        propertyImageCoverUrl: hotel.brandingMarketing?.hotelImageCoverUrl || null,
        propertyImagePreviewUrl: hotel.brandingMarketing?.hotelImagePreviewUrl || null,
        measureMetric:
          hotel.measureMetric === MeasureMetricEnum.SQM
            ? 'm2'
            : hotel.measureMetric === MeasureMetricEnum.SQFT
              ? 'ft2'
              : hotel.measureMetric, // this function use only for send email so need to transform to display
        taxInformation: hotel.taxInformation,
        taxSetting: hotel.taxSetting,
        ibeHomeUrl: `${hotel.ibeHomeUrl || this.configService.get(ENVIRONMENT.ISE_URL)}?hc=${hotel.code}`,

        // Branding marketing information (includes hotelImageCoverUrl)
        brandingMarketing: {
          hotelImageCoverUrl: hotel.brandingMarketing?.hotelImageCoverUrl || null,
          hotelImagePreviewUrl: hotel.brandingMarketing?.hotelImagePreviewUrl || null,
          googleMapUrl: hotel.brandingMarketing?.googleMapUrl || null,
          socialMedia: hotel.brandingMarketing?.socialMedia || null
        }
      };
    } catch (error) {
      throw new Error(`Hotel not found: ${error.message}`);
    }
  }

  private async getCancelReservationTemplateEmail(input: {
    hotel: HotelInformationDto;
    templateType: string;
    booker?: Guest;
    language?: string;
  }): Promise<{
    templateId: string;
    isEnable: boolean;
    subject: string;
    senderEmail?: string;
    senderName?: string;
    openingSection?: string;
    openingSectionForReturningGuest?: string;
    closingSection?: string;
    signature?: string;
    languageCode?: string;
    code?: string;
    name?: string;
    id?: string;
  }> {
    try {
      const { booker, hotel, templateType, language } = input;
      const templateEmail = await this.hotelTemplateEmailService.getHotelTemplateEmail(
        hotel.id,
        templateType,
        language
      );

      if (!templateEmail) {
        return FALLBACK_TEMPLATE_EMAIL;
      }

      if (templateEmail.openingSection) {
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{booker.firstName}}',
          booker?.firstName || ''
        );
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{booker.lastName}}',
          booker?.lastName || ''
        );
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{hotel.phone}}',
          hotel.phone || ''
        );
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{hotel.name}}',
          hotel.name || ''
        );
        if (hotel.emailAddressList?.length) {
          templateEmail.openingSection = templateEmail.openingSection.replaceAll(
            '{{hotel.emailAddress}}',
            hotel.emailAddressList[0]
          );
        }
      }
      if (templateEmail.closingSection && hotel.emailAddressList?.length) {
        templateEmail.closingSection = templateEmail.closingSection.replaceAll(
          '{{hotel.emailAddress}}',
          hotel.emailAddressList[0]
        );
      }
      return {
        id: templateEmail.id,
        templateId: templateEmail.templateId,
        isEnable: templateEmail.isEnable,
        subject: templateEmail.title || templateEmail.name || 'Email Notification',
        senderName: templateEmail.senderName,
        senderEmail: templateEmail.senderEmail,
        openingSection: templateEmail.openingSection,
        openingSectionForReturningGuest: templateEmail.openingSectionForReturningGuest,
        closingSection: templateEmail.closingSection,
        signature: templateEmail.signature,
        languageCode: templateEmail.languageCode,
        code: templateEmail.code,
        name: templateEmail.name
      };
    } catch (error) {
      // Return fallback template configuration on error
      console.error('Error getting cancel reservation template email:', error);
      return FALLBACK_TEMPLATE_EMAIL;
    }
  }

  private async getTemplateEmail(
    hotel: HotelInformationDto,
    booking: BookingInformationForEmailDto,
    templateType: string,
    language: string
  ): Promise<any> {
    let subject = 'Booking Confirmation';

    if (templateType === HotelTemplateEmailCodeEnum.BOOKING_CONFIRMATION) {
      subject = 'Booking Confirmation';
    }

    if (templateType === HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION) {
      subject = 'Booking Proposal Confirmation';
    }

    if (templateType === HotelTemplateEmailCodeEnum.RELEASED_EMAIL) {
      subject = 'Booking Released';
    }

    try {
      const templateEmail = await this.hotelTemplateEmailService.getHotelTemplateEmail(
        hotel.id,
        templateType,
        language
      );

      if (!templateEmail) {
        // Return fallback template configuration
        return FALLBACK_TEMPLATE_EMAIL;
      }

      const { booker } = booking;

      if (templateEmail.openingSection) {
        if (booker)
          templateEmail.openingSection = templateEmail.openingSection.replaceAll(
            '{{booker.firstName}}',
            booker?.firstName || ''
          );
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{booker.lastName}}',
          booker?.lastName || ''
        );
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{hotel.phone}}',
          hotel.phone || ''
        );
        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{hotel.name}}',
          hotel.name || ''
        );

        templateEmail.openingSection = templateEmail.openingSection.replaceAll(
          '{{hotel.emailAddress}}',
          hotel.emailAddressList?.[0]
        );

        if (booking.expiryDateStr) {
          templateEmail.openingSection = templateEmail.openingSection.replaceAll(
            '{{booking.expiryDateStr}}',
            booking.expiryDateStr
          );
        }
      }
      if (templateEmail.closingSection) {
        templateEmail.closingSection = templateEmail.closingSection.replaceAll(
          '{{hotel.emailAddress}}',
          hotel.emailAddressList?.[0]
        );
      }
      return {
        id: templateEmail.id,
        templateId: templateEmail.templateId,
        isEnable: templateEmail.isEnable,
        subject: templateEmail.title || templateEmail.name || 'Email Notification',
        senderName: templateEmail.senderName,
        senderEmail: templateEmail.senderEmail,
        openingSection: templateEmail.openingSection,
        openingSectionForReturningGuest: templateEmail.openingSectionForReturningGuest,
        closingSection: templateEmail.closingSection,
        signature: templateEmail.signature,
        languageCode: templateEmail.languageCode,
        code: templateEmail.code,
        name: templateEmail.name,
        title: templateEmail.title
      };
    } catch (error) {
      // Return fallback template configuration on error
      console.error('Error getting booking confirmation template email:', error);
      return FALLBACK_TEMPLATE_EMAIL;
    }
  }

  private setBookingTotalAccommodationsAndServices(booking: any, hotel: any): void {
    booking.totalGrossAmountStr = `${hotel.baseCurrency?.code} ${booking.totalGrossAmountStr || 0}`;
    booking.totalBaseAmountStr = `${hotel.baseCurrency?.code} ${booking.totalBaseAmountStr || 0}`;
    booking.paidAmountStr = `${hotel.baseCurrency?.code} ${booking.paidAmountStr || 0}`;
    booking.totalAmountDueStr = `${hotel.baseCurrency?.code} ${booking.totalAmountDueStr || 0}`;
    booking.mailReservationList?.forEach((item) => {
      item.reservation.extraServiceList?.forEach((service) => {
        service.totalGrossAmountStr = `${hotel.baseCurrency?.code} ${service.totalGrossAmountStr || 0}`;
        service.totalBaseAmountStr = `${hotel.baseCurrency?.code} ${service.totalBaseAmountStr || 0}`;
        service.originalPriceStr = `${hotel.baseCurrency?.code} ${service.originalPriceStr || 0}`;
      });
    });
    booking.totalAccommodations = `${hotel.baseCurrency?.code} ${booking.totalAccommodations || 0}`;
    booking.totalServices = `${hotel.baseCurrency?.code} ${booking.totalServices || 0}`;
  }

  private getBookingConfirmationUrl(hotel: any): string {
    const baseUrl = this.configService.get<string>('IBE_CPP_BOOKING_CONFIRMATION_URL');
    return `${baseUrl}?propertyId=${hotel.id}`;
  }

  private async getProposalBookingConfirmationUrl(input: {
    hotelId: string;
    hotelCode: string;
    bookingId: string;
    language: string;
  }): Promise<string> {
    const { hotelId, hotelCode, bookingId, language } = input;
    const baseUrl = this.configService.get<string>('IBE_CPP_PROPOSAL_BOOKING_CONFIRMATION_URL');

    const hotelIsEmailConfig = await this.hotelConfigurationRepository.getHotelConfiguration({
      hotelId,
      configType: HotelConfigurationTypeEnum.ISE_URL
    });

    let cppProposalBookingConfirmationUrl = `${baseUrl}?propertyId=${hotelId}&`;
    if (hotelIsEmailConfig && hotelIsEmailConfig.configValue?.metadata?.url) {
      const hotelIseUrl = hotelIsEmailConfig.configValue?.metadata?.url;
      cppProposalBookingConfirmationUrl = `${hotelIseUrl}/booking-proposal?`;
    }
    cppProposalBookingConfirmationUrl +=
      'hc=' + hotelCode + '&pm=' + bookingId + '&lang=' + language.toLowerCase();

    return cppProposalBookingConfirmationUrl;
  }

  private async prepareReservationAttachments(
    booking: any,
    hotel: any,
    language: string
  ): Promise<AttachmentData[]> {
    try {
      // Apply same data processing as Java EmailServiceImpl before PDF generation
      const processedBooking = await this.prepareBookingDataForPdf(booking, hotel, language);

      const attachments: AttachmentData[] = [];

      // Generate PDF for each reservation (matching Java loop in sendCppBookingConfirmationEmail)
      const reservationList = processedBooking.mailReservationList || [];

      for (let i = 0; i < reservationList.length; i++) {
        const reservationData = reservationList[i];
        const reservation = reservationData.reservation;

        try {
          // Generate PDF for this specific reservation (matching Java logic)
          const { content: pdfContent } = await this.pdfService.generateBookingConfirmationPdf(
            {
              ...processedBooking,
              // Focus on single reservation for PDF (matching Java convertToFileGenerateFilter)
              mailReservationList: [reservationData]
            },
            hotel,
            language
          );

          attachments.push({
            content: pdfContent,
            filename: `${reservation.reservationNumber || `${booking.bookingNumber}-${i + 1}`}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          });
        } catch (error) {
          // Continue with other reservations even if one fails
        }
      }

      // Fallback: if no individual reservation PDFs, generate one for whole booking
      if (attachments.length === 0) {
        const { content: pdfContent } = await this.pdfService.generateBookingConfirmationPdf(
          processedBooking,
          hotel,
          language
        );

        attachments.push({
          content: pdfContent,
          filename: `booking-confirmation-${booking.bookingNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        });
      }

      return attachments;
    } catch (error) {
      // Return empty array if PDF generation fails - email should still be sent
      return [];
    }
  }

  /**
   * Prepare booking data for PDF generation (matching Java EmailServiceImpl data processing)
   */
  private async prepareBookingDataForPdf(booking: any, hotel: any, language: string): Promise<any> {
    // Clone booking to avoid modifying original
    const processedBooking = JSON.parse(JSON.stringify(booking));

    // 1. Apply combineReservation logic (Java: combineReservation)
    // This combines reservations with same room product if they have DEDUCT_ALL setting
    // For now, we'll skip this complex logic and assume reservations are already properly structured

    // 2. Apply getMoreDataForConfirmationBooking logic (Java: getMoreDataForConfirmationBooking)
    // This sets hotel timezone, tax information, and other hotel configs
    this.applyHotelConfigurationData(processedBooking, hotel, language);

    // 3. Apply sortingReservationList logic (Java: sortingReservationList)
    this.sortReservationList(processedBooking);

    // 4. Apply setBookingTotalAccommodationsAndServices logic (Java: setBookingTotalAccommodationsAndServices)
    this.calculateBookingTotals(processedBooking, hotel);

    return processedBooking;
  }

  private applyHotelConfigurationData(booking: any, hotel: any, language: string): void {
    // Set hotel timezone for all reservations (matching Java)
    if (booking.mailReservationList) {
      booking.mailReservationList.forEach((item: any) => {
        if (item.reservation) {
          item.reservation.hotelTimezone = hotel.timeZone || 'Europe/Berlin';
        }
      });
    }

    // Apply hotel configuration data (tax info, terms, privacy, etc.)
    // This matches Java getMoreDataForConfirmationBooking logic
    if (hotel.hotelTermAndConditionUrl) {
      hotel.termOfUseUrl = hotel.hotelTermAndConditionUrl;
    }
    if (hotel.hotelPrivacyPolicyUrl) {
      hotel.privacyStatementUrl = hotel.hotelPrivacyPolicyUrl;
    }
    if (hotel.hotelImpressumUrl) {
      hotel.impressumUrl = hotel.hotelImpressumUrl;
    }
  }

  private sortReservationList(booking: any): void {
    // Sort reservations and set index (matching Java sortingReservationList)
    if (booking.mailReservationList) {
      booking.mailReservationList.forEach((item: any, index: number) => {
        if (item.reservation) {
          item.reservation.index = index + 1;

          // Set children count from childrenAgeList length
          const childrenAgeList = item.reservation.childrenAgeList || [];
          item.reservation.children = childrenAgeList.length;
        }
      });

      // Sort by index
      booking.mailReservationList.sort((a: any, b: any) => {
        const indexA = a.reservation?.index || 0;
        const indexB = b.reservation?.index || 0;
        return indexA - indexB;
      });
    }
  }

  private calculateBookingTotals(booking: any, hotel: any): void {
    // Calculate total accommodations and services (matching Java setBookingTotalAccommodationsAndServices)
    const isHotelTaxIncluded = hotel.taxSetting === TaxSettingEnum.INCLUSIVE;

    let totalAccommodationAmount = 0;
    let totalServicesAmount = 0;

    if (booking.mailReservationList) {
      for (const reservationData of booking.mailReservationList) {
        const reservation = reservationData.reservation;
        if (!reservation) continue;

        // Calculate accommodation amount (room + included services)
        const roomAmount = parseFloat(booking.totalAccommodations) || 0;
        totalAccommodationAmount += roomAmount;

        // Calculate extra services amount
        if (reservation.extraServiceList) {
          for (const service of reservation.extraServiceList) {
            const serviceAmount = parseFloat(service.totalGrossAmountStr) || 0;
            totalServicesAmount += serviceAmount;
          }
        }
      }
    }

    // Update booking totals with formatted strings (matching Java format)
    const currencyCode = booking.reservationList?.[0]?.currencyCode || 'EUR';
    booking.totalAccommodations = `${currencyCode} ${totalAccommodationAmount.toFixed(2)}`;
    booking.totalServices = `${currencyCode} ${totalServicesAmount.toFixed(2)}`;
  }

  private async updateBookingEmailSentStatus(bookingId: string, sent: boolean): Promise<void> {
    // TODO: Implement booking service call to update email sent status
  }
}
