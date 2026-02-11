import { Body, Controller, Delete, Get, HttpStatus, Patch, Post, Query, Res } from "@nestjs/common";
import { CreateOrUpdateHotelConfigurationDto } from "./dtos/create-or-update-hotel-configuration.dto";
import { CreateOrUpdateAccessibilityIntegrationDto, DeleteAccessibilityIntegrationDto, HotelConfigurationDto, HotelConfigurationsQueryDto } from "./dtos/hotel-configurations-query.dto";
import { HotelOperationsQueryDto } from "./dtos/hotel-operation-query.dto";
import { UpdateHotelOperationBodyDto } from "./dtos/update-hotel-operation.dto";
import { HotelConfigurationsService } from "./hotel-configurations.service";
import { UpdateHotelLastAvailabilityDateDto } from "./dtos/update-hotel-last-availability-date.dto";
import { Observable, tap } from "rxjs";
import { Response } from "express";
import { HotelConfigurationsMigrationDto } from "./dtos/hotel-configurations-migration.dto";
@Controller("hotel-configurations")
export class HotelConfigurationsController {
  constructor(private readonly hotelConfigurationsService: HotelConfigurationsService) {}

  @Get()
  async getHotelConfigurations(@Query() payload: HotelConfigurationsQueryDto) {
    return this.hotelConfigurationsService.getHotelConfigurations(payload);
  }

  @Post()
  async createOrUpdateHotelConfiguration(@Body() payload: CreateOrUpdateHotelConfigurationDto) {
    return this.hotelConfigurationsService.createOrUpdateHotelConfiguration(payload);
  }

  @Get("operations")
  async getHotelOperations(@Query() payload: HotelOperationsQueryDto) {
    return this.hotelConfigurationsService.getHotelOperations(payload);
  }

  @Patch("operation")
  updateHotelOperation(@Body() body: UpdateHotelOperationBodyDto) {
    return this.hotelConfigurationsService.updateHotelOperation(body);
  }

  @Patch("last-availability-date")
  updateHotelLastAvailabilityDate(@Body() body: UpdateHotelLastAvailabilityDateDto) {
    return this.hotelConfigurationsService.updateHotelLastAvailabilityDate(body);
  }

  @Get("accessibility-integration")
  getAccessibilityIntegration(@Query() query: HotelConfigurationDto) {
    return this.hotelConfigurationsService.getAccessibilityIntegration(query);
  }

  @Post("accessibility-integration")
  createOrUpdateAccessibilityIntegration(@Body() payload: CreateOrUpdateAccessibilityIntegrationDto, @Res() res: Response): Observable<any> {
    return this.hotelConfigurationsService.createOrUpdateAccessibilityIntegration(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("delete-accessibility-integration")
  deleteAccessibilityIntegration(@Body() payload: DeleteAccessibilityIntegrationDto, @Res() res: Response): Observable<any> {
    return this.hotelConfigurationsService.deleteAccessibilityIntegration(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Get("meta-conversion/:hotelCode")
  getMetaConversionConfig(@Query("hotelCode") hotelCode: string) {
    return this.hotelConfigurationsService.getMetaConversionConfig(hotelCode);
  }

  @Post("migrate-hotel-configurations")
  migrateHotelConfigurations(@Body() dto: HotelConfigurationsMigrationDto) {
    return this.hotelConfigurationsService.migrateHotelConfigurations(dto);
  }
}
