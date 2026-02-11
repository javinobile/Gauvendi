import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PropertyTrackingService } from './property-tracking.service';
import {
  CreateOrUpdatePropertyTrackingDto,
  PropertyTrackingFilterDto,
  PropertyTrackingTypeEnum,
} from './dtos/property-tracking.dto';

@Controller('hotels/:propertyCode/property-tracking')
export class PropertyTrackingController {
  constructor(private readonly propertyTrackingService: PropertyTrackingService) {}

  @Get()
  getPropertyTrackingList(
    @Param('propertyCode') propertyCode: string,
    @Query('propertyTrackingType') propertyTrackingType?: PropertyTrackingTypeEnum,
  ) {
    const filter: PropertyTrackingFilterDto = {
      propertyCode,
      propertyTrackingType,
    };
    return this.propertyTrackingService.getPropertyTrackingList(filter);
  }

  @Post()
  createOrUpdatePropertyTracking(
    @Param('propertyCode') propertyCode: string,
    @Body() body: Omit<CreateOrUpdatePropertyTrackingDto, 'propertyCode'>,
  ) {
    return this.propertyTrackingService.createOrUpdatePropertyTracking({
      ...body,
      propertyCode,
    });
  }

  @Delete(':propertyTrackingType')
  deletePropertyTracking(
    @Param('propertyCode') propertyCode: string,
    @Param('propertyTrackingType') propertyTrackingType: PropertyTrackingTypeEnum,
  ) {
    return this.propertyTrackingService.deletePropertyTracking({
      propertyCode,
      propertyTrackingType,
    });
  }

  @Get('meta/config')
  getMetaConversionConfig(@Param('propertyCode') propertyCode: string) {
    return this.propertyTrackingService.getMetaConversionConfig(propertyCode);
  }
}
