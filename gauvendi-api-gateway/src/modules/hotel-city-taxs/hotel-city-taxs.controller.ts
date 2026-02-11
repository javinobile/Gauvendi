import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { CreateHotelCityTaxDto } from "./dto/create-hotel-city-tax.dto";
import { HotelCityTaxQueryDto } from "./dto/hotel-city-tax-query.dto";
import { HotelCityTaxInputDto, UpdateHotelCityTaxDto } from "./dto/update-hotel-city-tax.dto";
import { HotelCityTaxsService } from "./hotel-city-taxs.service";
import { map } from "rxjs";

@Controller("hotel-city-taxs")
export class HotelCityTaxsController {
  constructor(private readonly hotelCityTaxsService: HotelCityTaxsService) {}

  @Get()
  getHotelCityTaxs(@Query() query: HotelCityTaxQueryDto) {
    return this.hotelCityTaxsService.getHotelCityTaxs(query);
  }

  @Get("pms-city-tax-list")
  getPmsCityTaxList(@Query() hotelId: string) {
    return this.hotelCityTaxsService.getPmsCityTaxList(hotelId);
  }

  @Post("update-hotel-city-tax-list")
  updateHotelCityTaxList(@Body() dto: HotelCityTaxInputDto[], @Res() response: Response) {
    return this.hotelCityTaxsService.updateHotelCityTaxList(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Get(":id")
  getHotelCityTax(@Param("id") id: string, @Query("hotelCode") hotelCode: string) {
    return this.hotelCityTaxsService.getHotelCityTax(id, hotelCode);
  }

  @Post()
  createHotelCityTax(@Body() dto: CreateHotelCityTaxDto) {
    return this.hotelCityTaxsService.createHotelCityTax(dto);
  }

  @Patch(":id")
  updateHotelCityTax(@Param("id") id: string, @Body() dto: UpdateHotelCityTaxDto) {
    return this.hotelCityTaxsService.updateHotelCityTax(id, dto);
  }

  @Delete(":id")
  deleteHotelCityTax(@Param("id") id: string, @Query("hotelCode") hotelCode: string) {
    return this.hotelCityTaxsService.deleteHotelCityTax(id, hotelCode);
  }
}
