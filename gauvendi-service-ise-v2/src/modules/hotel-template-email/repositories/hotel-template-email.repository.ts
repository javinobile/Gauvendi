import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { HotelTemplateEmail } from 'src/core/entities/hotel-entities/hotel-template-email.entity';
import { BadRequestException } from 'src/core/exceptions';
import { BaseService } from 'src/core/services/base.service';
import { Repository } from 'typeorm';
import { HotelTemplateEmailsFilterDto } from '../dtos/hotel-template-email.dto';

@Injectable()
export class HotelTemplateEmailRepository extends BaseService {
  constructor(
    @InjectRepository(HotelTemplateEmail, DB_NAME.POSTGRES)
    private readonly hotelTemplateEmailRepository: Repository<HotelTemplateEmail>,
    configService: ConfigService
  ) {
    super(configService);
  }

  async getHotelTemplateEmails(
    filter: HotelTemplateEmailsFilterDto
  ): Promise<HotelTemplateEmail[] | null> {
    try {
      const hotelTemplateEmails = await this.hotelTemplateEmailRepository.find({
        where: { hotelId: filter.hotelId }
      });

      return hotelTemplateEmails;
    } catch (error) {
      const err = error?.response?.data;
      throw new BadRequestException(err);
    }
  }
}
