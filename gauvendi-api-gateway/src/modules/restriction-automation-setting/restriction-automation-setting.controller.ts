import { map } from "rxjs";
import { RestrictionAutomationSettingFilterDto, RestrictionAutomationSettingInputDto } from "./restriction-automation-setting.dto";
import { RestrictionAutomationSettingService } from "./restriction-automation-setting.service";
import { Body, Controller, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";

@Controller("restriction-automation-setting")
export class RestrictionAutomationSettingController {
  constructor(private readonly restrictionAutomationSettingService: RestrictionAutomationSettingService) {}

  @Get("rate-plan-setting")
  getRatePlanRestrictionAutomationSetting(@Query() query: RestrictionAutomationSettingFilterDto) {
    return this.restrictionAutomationSettingService.getRatePlanRestrictionAutomationSettingList(query);
  }

  @Get("room-product-setting")
  getRoomProductRestrictionAutomationSetting(@Query() query: RestrictionAutomationSettingFilterDto) {
    return this.restrictionAutomationSettingService.getRoomProductRestrictionAutomationSettingList(query);
  }

  @Get("list")
  getRestrictionAutomationSetting(@Query() query: RestrictionAutomationSettingFilterDto) {
    return this.restrictionAutomationSettingService.getRestrictionAutomationSettingList(query);
  }

  @Post("upsert")
  updateRestrictionAutomationSetting(@Body() body: RestrictionAutomationSettingInputDto[], @Res() response: Response) {
    return this.restrictionAutomationSettingService.updateRestrictionAutomationSetting(body).pipe(
      map((result) => {
        return response.status(HttpStatus.OK).send(result);
      })
    );
  }
}
