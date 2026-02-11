// sendgrid.service.ts
import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '@src/core/constants/environment.const';
import { MailDataRequired } from '@sendgrid/mail';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmailHistory,
  EmailHistoryDocument
} from '@src/core/schemas/email-history/email-history.schema';
import { AttachmentData, EmailMetadata } from '../dtos/notification.dto';
import { TranslationService } from '../../translation/services/translation.service';
import { Booking } from '@src/core/entities/booking-entities/booking.entity';
import { HotelTemplateEmailCodeEnum } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { HttpService } from '@nestjs/axios';
import { TranslationStaticContent } from '@src/core/entities/translation-entities/translation-static-content.entity';
import {
  EntityTranslationConfigCodeEnum,
  TranslationEntityConfig
} from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { LanguageCodeEnum } from '@src/core/enums/common';
@Injectable()
export class SendgridService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(EmailHistory.name) private emailHistoryModel: Model<EmailHistoryDocument>,
    private readonly translationService: TranslationService,
    private readonly httpService: HttpService
  ) {
    this.setApiKey();
  }

  private setApiKey() {
    const apiKey = this.configService.get<string>(ENVIRONMENT.SENDGRID_API_KEY) || '';
    sgMail.setApiKey(apiKey);
  }

  async constructAndSendMail(
    templateCode: HotelTemplateEmailCodeEnum,
    senderName: string,
    senderEmail: string,
    recipientList: string[],
    emailTemplateId: string,
    metadata: EmailMetadata,
    attachmentList?: AttachmentData[],
    language?: string,
    isNoPreferences?: boolean
  ): Promise<void> {
    // Set hotel icon image url for email template compatibility
    if (metadata.hotel) {
      metadata.hotel.iconImageUrl = metadata.hotel.emailImageUrl;
    }

    metadata.translation = await this.fetchEmailStaticContentTranslationV2(language);

    if (isNoPreferences) {
      for (const reservation of metadata.mailReservationList) {
        const name = metadata.translation['NO_PREFERENCES_OR_FEATURES_GUARANTEED'];

        if (name) {
          reservation.reservation.rfc.name = name;
          reservation.reservation.rfc.description = '';
        } else {
          reservation.reservation.rfc.name = 'No preferences';
          reservation.reservation.rfc.description = '';
          if (language === LanguageCodeEnum.FR) {
            reservation.reservation.rfc.name = 'Aucune préférence';
          } else if (language === LanguageCodeEnum.DE) {
            reservation.reservation.rfc.name = 'Keine Vorlieben';
          } else if (language === LanguageCodeEnum.IT) {
            reservation.reservation.rfc.name = 'Nessuna preferenza';
          } else if (language === LanguageCodeEnum.ES) {
            reservation.reservation.rfc.name = 'Sin preferencias';
          } else if (language === LanguageCodeEnum.AR) {
            reservation.reservation.rfc.name = 'بدون تفضيلات';
          }
        }
      }
    }

    const from = {
      email: senderEmail,
      name: senderName
    };

    const bookingIdStr = metadata.booking?.id?.toString();
    const reservationIdStr =
      metadata.reservation?.id?.toString() ||
      (!bookingIdStr && metadata.reservation?.bookingId?.toString());

    for (const recipient of recipientList) {
      try {
        const mailData: MailDataRequired = {
          to: recipient,
          from: from,
          templateId: emailTemplateId,
          dynamicTemplateData: metadata
        };

        // Add attachments if provided
        if (attachmentList && attachmentList.length > 0) {
          mailData.attachments = attachmentList.map((att) => ({
            content: att.content,
            filename: att.filename,
            type: att.type,
            disposition: att.disposition || 'attachment'
          }));
        }

        // Store email history
        let emailHistory: EmailHistoryDocument | null = null;
        try {
          const emailHistoryData = {
            code: templateCode,
            sender_name: senderName,
            sender_email: senderEmail,
            recipient_email: recipient,
            status: 'Pending',
            delivered_date: new Date(),
            ...(bookingIdStr && { booking_id: bookingIdStr }),
            ...(reservationIdStr && { reservation_id: reservationIdStr })
          };

          // Generate subject if possible
          if (metadata.hotel && metadata.email && metadata.translation && metadata.booking) {
            emailHistoryData['subject'] = this.getEmailSubject(
              metadata.email,
              metadata.translation,
              metadata.hotel.name,
              metadata.booking.bookingNumber,
              templateCode,
              metadata.reservation?.reservationNumber
            );
          }

          emailHistory = new this.emailHistoryModel(emailHistoryData);
          await emailHistory.save();
        } catch (error) {}

        // Send email
        await this.sendMailWithHistory(
          mailData,
          recipient,
          emailHistory,
          templateCode,
          bookingIdStr,
          reservationIdStr
        );
      } catch (error) {
        throw error;
      }
    }
  }

  private async fetchEmailStaticContentTranslationV2(language: string = 'en') {
    try {
      const response = await this.httpService.axiosRef.get<
        {
          attribute: {
            key: string;
            value: string;
          }[];
          entityTranslationConfig: TranslationEntityConfig;
        }[]
      >(
        `${this.configService.get<string>(ENVIRONMENT.S3_CDN_URL)}/platform/translation/${language.toLowerCase()}-${language.toUpperCase()}/i18n.json`
      );

      const entity = response.data.find(
        (item) =>
          item.entityTranslationConfig.code ===
          EntityTranslationConfigCodeEnum.EMAIL_TRANSLATION_CONTENT
      );

      let translation: { [key: string]: string } =
        await this.translationService.getEmailStaticContentTranslation(language);
      if (entity) {
        for (const item of entity.attribute) {
          translation[item.key] = item.value;
        }
      } else {
        if (!translation || Object.keys(translation).length === 0) {
          translation = this.getFallbackTranslations();
        }
      }

      return translation;
    } catch (error) {
      return this.getFallbackTranslations();
    }
  }

  private getFallbackTranslations(): { [key: string]: string } {
    return {
      'email.greeting': 'Dear Guest',
      'email.booking.confirmation': 'Booking Confirmation',
      'email.thank.you': 'Thank you for your booking',
      'email.reservation.details': 'Reservation Details',
      'email.check.in': 'Check-in',
      'email.check.out': 'Check-out',
      'email.guests': 'Guests',
      'email.room.type': 'Room Type',
      'email.total.amount': 'Total Amount',
      'email.best.regards': 'Best regards'
    };
  }

  private getEmailSubject(
    emailConfig: any,
    translation: { [key: string]: string },
    hotelName: string,
    bookingNumber: string,
    templateCode: string,
    reservationNumber?: string
  ): string {
    // Simple subject generation - in real implementation this would be more sophisticated
    let status = '';
    switch (templateCode) {
      case HotelTemplateEmailCodeEnum.BOOKING_CONFIRMATION:
      case HotelTemplateEmailCodeEnum.BOOKING_CONFIRMATION_V2:
      case HotelTemplateEmailCodeEnum.VOICE_BOOKING_CONFIRMATION:
      case HotelTemplateEmailCodeEnum.CPP_BOOKING_CONFIRMATION:
        status = translation['BOOKING_CONFIRMATION'] || 'Booking Confirmation';
        break;
      case HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION:
        status = translation['CANCELLED_RESERVATION'] || 'Cancelled Reservation';
        break;
      case HotelTemplateEmailCodeEnum.RELEASED_EMAIL:
        status = translation['BOOKING_RELEASED'] || 'Proposal Released';
        break;
      case HotelTemplateEmailCodeEnum.PROPOSAL_BOOKING_CONFIRMATION:
      case HotelTemplateEmailCodeEnum.CPP_PROPOSAL_BOOKING_CONFIRMATION:
        status = translation['OFFER_PROPOSAL'] || 'Proposal Information';
        break;
      case HotelTemplateEmailCodeEnum.CPP_VERIFY_BOOKING_CONFIRMATION:
        status = translation['CONFIRM_TERMS_CONDITIONS'] || 'Confirm Terms & Conditions';
        break;
      default:
        status = 'Booking';
        break;
    }
    const number =
      reservationNumber && templateCode === HotelTemplateEmailCodeEnum.RESERVATION_CANCELLATION
        ? reservationNumber
        : bookingNumber;
    return `${hotelName} - ${status} ${number}`;
  }

  private async sendMailWithHistory(
    mailData: MailDataRequired,
    recipient: string,
    emailHistory: EmailHistoryDocument | null,
    templateCode: string,
    bookingIdStr?: string,
    reservationIdStr?: string
  ): Promise<void> {
    try {
      const response = await sgMail.send(mailData);

      // Update email history status
      if (emailHistory) {
        emailHistory.status = 'Sent';
        await emailHistory.save();
      }
    } catch (error) {
      // Update email history status to failed
      if (emailHistory) {
        emailHistory.status = 'Failed';
        await emailHistory.save();
      }

      throw error;
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const fromEmail = 'gauvendi-tech@inipod.com';

    const msg = {
      to,
      from: fromEmail,
      subject,
      text,
      html: html ?? text
    };
    return sgMail.send(msg);
  }
}
