import { Controller, Get, Query } from '@nestjs/common';
import { HotelConfiguration } from 'src/core/entities/hotel-entities/hotel-configuration.entity';
import { HotelConfigurationFilterDto } from './dtos/hotel-configuration-filter.dto';
import { HotelMainFontDto } from './dtos/hotel-main-font.dto';
import { HotelConfigurationService } from './services/hotel-configuration.service';
import { HotelBrandingResponseDto } from './dtos/hotel-brandings.dto';

@Controller('hotel-configuration')
export class HotelConfigurationController {
  constructor(private readonly hotelConfigurationService: HotelConfigurationService) {}

  @Get('main-font')
  async findMainFont(
    @Query() filter: HotelConfigurationFilterDto
  ): Promise<HotelMainFontDto[] | null> {
    return this.hotelConfigurationService.findMainFontInformation(filter);
  }

  @Get('')
  async findAll(@Query() filter: HotelConfigurationFilterDto): Promise<HotelConfiguration[]> {
    return this.hotelConfigurationService.findAll(filter);
  }

  @Get('hotel-brandings')
  async getHotelBrandings(
    @Query() filter: HotelConfigurationFilterDto
  ): Promise<HotelBrandingResponseDto[]> {
    return this.hotelConfigurationService.getHotelBrandings(filter);
  }
}
