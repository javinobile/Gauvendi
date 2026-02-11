import { Controller, Get, Post, Query } from '@nestjs/common';
import { HotelRetailCategoryDto } from './dtos/hotel-retail-category.dto';
import { HotelRetailCategoryFilterDto } from './dtos/hotel-retail-category.filter';
import { HotelRetailCategoryService } from './services/hotel-retail-category.service';

@Controller('hotel-retail-category')
export class HotelRetailCategoryController {
  constructor(private readonly hotelRetailCategoryService: HotelRetailCategoryService) {}

  @Get('')
  async findAll(@Query() filter: HotelRetailCategoryFilterDto): Promise<HotelRetailCategoryDto[]> {
    return this.hotelRetailCategoryService.findHotelRetailCategory(filter);
  }

  @Post('sync-image-url')
  async syncImageUrl() {
    return this.hotelRetailCategoryService.syncImageUrl();
  }
}
