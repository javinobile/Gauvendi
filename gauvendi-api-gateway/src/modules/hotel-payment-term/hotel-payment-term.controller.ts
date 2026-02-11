import { Body, Controller, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { HotelPaymentTermFilterDto, HotelPaymentTermInputDto } from "./hotel-payment-term.dto";
import { HotelPaymentTermService } from "./hotel-payment-term.service";
import { Response } from "express";
import { map } from "rxjs";
import { ResponseContentStatusEnum } from "@src/core/dtos/common.dto";
import { Public } from "@src/core/decorators/is-public.decorator";

@Controller("hotel-payment-term")
export class HotelPaymentTermController {
  constructor(private readonly hotelPaymentTermService: HotelPaymentTermService) {}

  @Get("migrate-translation")
  @Public()
  migrateTranslation() {
    return this.hotelPaymentTermService.migrateTranslation();
  }

  @Get()
  getHotelPaymentTermList(@Query() query: HotelPaymentTermFilterDto) {
    return this.hotelPaymentTermService.getHotelPaymentTermList(query);
  }

  @Post("create")
  createHotelPaymentTerm(@Body() body: HotelPaymentTermInputDto, @Res() response: Response) {
    return this.hotelPaymentTermService.createHotelPaymentTerm(body).pipe(
      map((result) => {
        return response.status(result?.status === ResponseContentStatusEnum.SUCCESS ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(result);
      })
    );
  }

  @Post("update")
  updateHotelPaymentTerm(@Body() body: HotelPaymentTermInputDto, @Res() response: Response) {
    return this.hotelPaymentTermService.updateHotelPaymentTerm(body).pipe(
      map((result) => {
        return response.status(result?.status === ResponseContentStatusEnum.SUCCESS ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(result);
      })
    );
  }

  @Post("delete")
  deleteHotelPaymentTerm(@Body() body: HotelPaymentTermFilterDto, @Res() response: Response) {
    return this.hotelPaymentTermService.deleteHotelPaymentTerm(body).pipe(
      map((result) => {
        return response.status(result?.status === ResponseContentStatusEnum.SUCCESS ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(result);
      })
    );
  }
}
