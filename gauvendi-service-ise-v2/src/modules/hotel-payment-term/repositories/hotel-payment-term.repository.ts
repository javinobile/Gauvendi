import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelPaymentTerm } from 'src/core/entities/hotel-entities/hotel-payment-term.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { In, Repository } from 'typeorm';
import { HotelPaymentTermsFilterDto } from '../dtos/hotel-payment-term.dto';

@Injectable()
export class HotelPaymentTermRepository extends BaseService {
  constructor(
    @InjectRepository(HotelPaymentTerm, DB_NAME.POSTGRES)
    private readonly hotelPaymentTermRepository: Repository<HotelPaymentTerm>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelPaymentTermsByCodes(
    filter: HotelPaymentTermsFilterDto
  ): Promise<HotelPaymentTerm[] | null> {
    try {
      const hotelPaymentTerms = await this.hotelPaymentTermRepository.find({
        where: { code: In(filter.codes), hotelId: filter.hotelId }
      });
      const mappedHotelPaymentTerms = hotelPaymentTerms.map((hotelPaymentTerm) => {
        const itemTranslation =
          hotelPaymentTerm.translations.find(
            (translation) => translation.languageCode === filter.translateTo
          ) || {};

        return {
          ...hotelPaymentTerm,
          ...itemTranslation,
          payOnConfirmationDescription:
            itemTranslation['payUponBookingDescription'] ||
            hotelPaymentTerm.payOnConfirmationDescription
        };
      });
      return mappedHotelPaymentTerms;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }
}
