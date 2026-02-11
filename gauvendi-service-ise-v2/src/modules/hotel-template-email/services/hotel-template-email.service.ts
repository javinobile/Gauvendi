import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HotelTemplateEmailCodesEnum } from 'src/core/entities/hotel-entities/hotel-template-email.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { HotelRepository } from 'src/modules/hotel-v2/repositories/hotel.repository';
import {
  HotelTemplateEmailResponseDto,
  HotelTemplateEmailsFilterDto
} from '../dtos/hotel-template-email.dto';
import { HotelTemplateEmailRepository } from '../repositories/hotel-template-email.repository';

@Injectable()
export class HotelTemplateEmailService extends BaseService {
  constructor(
    private readonly hotelTemplateEmailRepository: HotelTemplateEmailRepository,
    private readonly hotelRepository: HotelRepository,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelTemplateEmails(
    filter: HotelTemplateEmailsFilterDto
  ): Promise<HotelTemplateEmailResponseDto[] | null> {
    try {
      const hotel = await this.hotelRepository.getHotelByCode(filter.hotelCode || '');

      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      const hotelTemplateEmails = await this.hotelTemplateEmailRepository.getHotelTemplateEmails({
        hotelId: hotel.id
      });
      const mapped =
        hotelTemplateEmails?.map((hotelTemplateEmail) => {
          return {
            closingSection: hotelTemplateEmail.closingSection,
            languageCode: hotelTemplateEmail.languageCode,
            code: hotelTemplateEmail.code as HotelTemplateEmailCodesEnum,
            name: hotelTemplateEmail.name,
            templateId: hotelTemplateEmail.templateId,
            isDefault: hotelTemplateEmail.isDefault,
            signature: hotelTemplateEmail.signature
          };
        }) || null;
      return mapped;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }
}
