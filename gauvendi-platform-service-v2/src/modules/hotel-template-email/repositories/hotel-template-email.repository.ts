import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { HotelTemplateEmail } from '@src/core/entities/hotel-entities/hotel-template-email.entity';
import { BadRequestException } from '@src/core/exceptions';
import {
  EmailTranslationInput,
  HotelTemplateEmailFilterDto,
  UpdateEmailContentInput,
  UpdateEmailTranslationInput
} from '../dtos/hotel-template-emai.dto';

@Injectable()
export class HotelTemplateEmailRepository {
  constructor(
    @InjectRepository(HotelTemplateEmail, DbName.Postgres)
    private readonly hotelTemplateEmailRepository: Repository<HotelTemplateEmail>
  ) {}

  async getHotelTemplateEmail(
    filter: HotelTemplateEmailFilterDto
  ): Promise<HotelTemplateEmail | null> {
    try {
      const { hotelId, code, languageCode } = filter;

      const queryBuilder = this.hotelTemplateEmailRepository
        .createQueryBuilder('hte')
        .where('hte.hotelId = :hotelId', { hotelId })
        .andWhere('hte.code = :code', { code });

      if (languageCode) {
        // First try to find template with exact language match
        const templateWithLanguage = await queryBuilder
          .andWhere('hte.languageCode = :languageCode', { languageCode })
          .orderBy('hte.isDefault', 'DESC')
          .getOne();

        if (templateWithLanguage) {
          return templateWithLanguage;
        }
      }

      // Fallback to English or default template
      const fallbackTemplate = await this.hotelTemplateEmailRepository
        .createQueryBuilder('hte')
        .where('hte.hotelId = :hotelId', { hotelId })
        .andWhere('hte.code = :code', { code })
        .andWhere('(hte.languageCode = :englishCode OR hte.isDefault = :isDefault)', {
          englishCode: 'EN',
          isDefault: true
        })
        .orderBy('hte.languageCode = :englishCode', 'DESC')
        .addOrderBy('hte.isDefault', 'DESC')
        .getOne();

      return fallbackTemplate;
    } catch (error) {
      throw new BadRequestException(`Failed to get hotel template email: ${error.message}`);
    }
  }

  async getHotelTemplateEmails(filter: HotelTemplateEmailFilterDto): Promise<HotelTemplateEmail[]> {
    try {
      const { hotelId, languageCode, codes } = filter;

      const queryBuilder = this.hotelTemplateEmailRepository
        .createQueryBuilder('hte')
        .andWhere('hte.hotelId = :hotelId', { hotelId })
        .andWhere('hte.code IN (:...codes)', { codes });
      // .andWhere('hte.isEnable = true');
      // .andWhere('hte.isDefault = true');

      if (languageCode) {
        queryBuilder.andWhere('hte.languageCode = :languageCode', { languageCode });
      }

      return await queryBuilder
        .orderBy('hte.languageCode = :englishCode', 'DESC')
        .addOrderBy('hte.isDefault', 'DESC')
        .setParameter('englishCode', 'EN')
        .getMany();
    } catch (error) {
      throw new BadRequestException(`Failed to get hotel template emails: ${error.message}`);
    }
  }

  async getEmailTranslations(input: EmailTranslationInput) {
    try {
      const { hotelId, code } = input;

      const queryBuilder = this.hotelTemplateEmailRepository
        .createQueryBuilder('hte')
        .where('hte.hotelId = :hotelId', { hotelId })
        .andWhere('hte.code = :code', { code })
        .andWhere('hte.isEnable = true');

      return await queryBuilder.getMany();
    } catch (error) {
      throw new BadRequestException(
        `Failed to get hotel template email translation: ${error.message}`
      );
    }
  }

  async updateEmailTranslation(input: UpdateEmailTranslationInput[]) {
    try {
      return await this.hotelTemplateEmailRepository.save(input);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update hotel template email translation: ${error.message}`
      );
    }
  }

  async updateEmailContent(input: UpdateEmailContentInput) {
    try {
      return await this.hotelTemplateEmailRepository.save(input);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update hotel template email content: ${error.message}`
      );
    }
  }
}
