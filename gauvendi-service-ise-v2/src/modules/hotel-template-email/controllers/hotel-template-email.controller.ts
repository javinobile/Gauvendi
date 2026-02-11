import { Controller, Get, Query } from '@nestjs/common';
import {
  HotelTemplateEmailResponseDto,
  HotelTemplateEmailsFilterDto
} from '../dtos/hotel-template-email.dto';
import { HotelTemplateEmailService } from '../services/hotel-template-email.service';

@Controller('hotel-template-email')
export class HotelTemplateEmailController {
  constructor(private readonly hotelService: HotelTemplateEmailService) {}

  @Get()
  async getHotelTemplateEmails(
    @Query() filter: HotelTemplateEmailsFilterDto
  ): Promise<HotelTemplateEmailResponseDto[] | null> {
    return await this.hotelService.getHotelTemplateEmails(filter);
  }
}
