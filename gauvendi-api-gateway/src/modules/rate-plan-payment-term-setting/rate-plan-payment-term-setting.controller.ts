import { Body, Controller, Delete, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import {
  CreateRatePlanPaymentTermSettingInputDto,
  RatePlanPaymentTermSettingDeleteDto,
  RatePlanPaymentTermSettingFilterDto,
  RatePlanPaymentTermSettingInputDto,
} from "./rate-plan-payment-term-setting.dto";
import { RatePlanPaymentTermSettingService } from "./rate-plan-payment-term-setting.service";
import { map } from "rxjs";
import { ResponseContentStatusEnum } from "@src/core/dtos/common.dto";

@Controller("rate-plan-payment-term-setting")
export class RatePlanPaymentTermSettingController {
  constructor(private readonly ratePlanPaymentTermSettingService: RatePlanPaymentTermSettingService) {}

  @Get()
  getRatePlanPaymentTermSettingList(@Query() query: RatePlanPaymentTermSettingFilterDto) {
    return this.ratePlanPaymentTermSettingService.getRatePlanPaymentTermSettingList(query);
  }

  @Post("update")
  updateRatePlanPaymentTermSetting(@Body() body: RatePlanPaymentTermSettingInputDto, @Res() response: Response) {
    return this.ratePlanPaymentTermSettingService.updateRatePlanPaymentTermSetting(body).pipe(
      map((result) => {
        return response.status(result.status === ResponseContentStatusEnum.SUCCESS ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(result);
      })
    );
  }

  @Delete("delete")
  deleteRatePlanPaymentTermSetting(@Query() body: RatePlanPaymentTermSettingDeleteDto, @Res() response: Response) {
    return this.ratePlanPaymentTermSettingService.deleteRatePlanPaymentTermSetting(body).pipe(
      map((result) => {
        return response.status(result.status === ResponseContentStatusEnum.SUCCESS ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(result);
      })
    );
  }

  @Post("create")
  createRatePlanPaymentTermSetting(@Body() body: CreateRatePlanPaymentTermSettingInputDto, @Res() response: Response) {
    return this.ratePlanPaymentTermSettingService.createRatePlanPaymentTermSetting(body).pipe(
      map((result) => {
        return response.status(result.status === ResponseContentStatusEnum.SUCCESS ? HttpStatus.OK : HttpStatus.BAD_REQUEST).send(result);
      })
    );
  }
}
