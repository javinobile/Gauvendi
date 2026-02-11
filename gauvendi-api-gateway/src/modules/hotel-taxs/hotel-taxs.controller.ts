import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { map } from "rxjs";
import { CreateHotelTaxDto } from "./dto/create-hotel-tax.dto";
import { HotelTaxQueryDto } from "./dto/hotel-tax-query.dto";
import { SetDefaultHotelTaxDto } from "./dto/set-default-hotel-tax.dto";
import { HotelTaxInputDto, UpdateHotelTaxDto } from "./dto/update-hotel-tax.dto";
import { HotelTaxsService } from "./hotel-taxs.service";

@Controller("hotel-taxs")
export class HotelTaxsController {
  constructor(private readonly hotelTaxsService: HotelTaxsService) {}

  @Get()
  getHotelTaxs(@Query() query: HotelTaxQueryDto) {
    return this.hotelTaxsService.getHotelTaxs(query);
  }

  @Get("pms-tax-list")
  getPmsTaxList(@Query() hotelId: string) {
    return this.hotelTaxsService.getPmsTaxList(hotelId);
  }

  @Post("update-hotel-tax-list")
  updateHotelTaxList(@Body() dto: HotelTaxInputDto[], @Res() response: Response) {
    return this.hotelTaxsService.updateHotelTaxList(dto).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Get(":id")
  getHotelTax(@Param("id") id: string, @Query("propertyCode") propertyCode: string) {
    return this.hotelTaxsService.getHotelTax(id, propertyCode);
  }

  @Post()
  createHotelTax(@Body() dto: CreateHotelTaxDto) {
    return this.hotelTaxsService.createHotelTax(dto);
  }

  @Patch("set-default")
  setDefault(@Body() dto: SetDefaultHotelTaxDto) {
    return this.hotelTaxsService.setDefaultHotelTax(dto);
  }

  @Patch(":id")
  updateHotelTax(@Param("id") id: string, @Body() dto: UpdateHotelTaxDto) {
    return this.hotelTaxsService.updateHotelTax(id, dto);
  }

  @Delete(":id")
  deleteHotelTax(@Param("id") id: string, @Query("hotelCode") hotelCode: string) {
    return this.hotelTaxsService.deleteHotelTax(id, hotelCode);
  }
}
