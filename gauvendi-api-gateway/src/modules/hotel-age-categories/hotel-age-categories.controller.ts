import { Controller, Get, Post, Query, Body, Patch, Delete, Param } from '@nestjs/common';
import { HotelAgeCategoryQueryDto, UpdateHotelAgeCategoryDto, CreateHotelAgeCategoryDto, GetHotelAgeCategoryDto } from './hotel-age-categories.dto';
import { HotelAgeCategoriesService } from './hotel-age-categories.service';

@Controller('hotel-age-categories')
export class HotelAgeCategoriesController {
  constructor(private readonly hotelAgeCategoriesService: HotelAgeCategoriesService) {}

  @Get()
  getHotelAgeCategories(@Query() query: HotelAgeCategoryQueryDto) {
    return this.hotelAgeCategoriesService.getHotelAgeCategories(query);
  }

  @Get(':id')
  getHotelAgeCategory(@Param('id') id: string, @Query() query: GetHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.getHotelAgeCategory(id, query.hotelCode);
  }

  @Post()
  createHotelAgeCategory(@Body() dto: CreateHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.createHotelAgeCategory(dto);
  }

  @Patch(':id')
  updateHotelAgeCategory(@Param('id') id: string, @Body() dto: UpdateHotelAgeCategoryDto) {
    return this.hotelAgeCategoriesService.updateHotelAgeCategory(id, dto);
  }

  @Delete(':id')
  deleteHotelAgeCategory(@Param('id') id: string) {
    return this.hotelAgeCategoriesService.deleteHotelAgeCategory(id);
  }
}
