import { Body, Controller, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { ResponseContentStatusEnum } from "@src/core/dtos/common.dto";
import { Response } from "express";
import { map } from "rxjs";
import { HotelCancellationPolicyChangeDefaultPricingInputDto } from "./dtos/hotel-cancellation-policy-change-default-pricing-input.dto";
import { HotelCancellationPolicyFilterDto } from "./dtos/hotel-cancellation-policy-pricing-filter.dto";
import { HotelCancellationPolicyPricingInputDto } from "./dtos/hotel-cancellation-policy-pricing-input.dto";
import { HotelExtrasListPricingFilterDto } from "./dtos/hotel-extras-pricing.dto";
import { HotelTaxFilterDto } from "./dtos/property-tax-pricing-filter.dto";
import { RatePlanFeatureWithDailyRateListFilterDto } from "./dtos/rate-plan-feature-with-daily-rate-pricing-filter.dto";
import { RatePlanServiceDeleteInputDto, RatePlanServiceInputDto, RatePlanServiceListPricingFilterDto } from "./dtos/rate-plan-service-pricing.dto";
import { UpdateTaxSettingsPricingInputDto } from "./dtos/update-tax-settings-pricing-input.dto";
import { PricingService } from "./pricing.service";
@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get("rate-plan-service-list")
  async ratePlanServiceList(@Query() filter: RatePlanServiceListPricingFilterDto) {
    return await this.pricingService.ratePlanServiceList(filter);
  }

  @Post("create-rate-plan-service")
  async createRatePlanService(@Body() filter: RatePlanServiceInputDto, @Res() response: Response) {
    return this.pricingService.createRatePlanService(filter).pipe(
      map((result) => {
        return response.status(HttpStatus.CREATED).send(result);
      })
    );
  }

  @Post("delete-rate-plan-service")
  async deleteRatePlanService(@Body() filter: RatePlanServiceDeleteInputDto, @Res() response: Response) {
    return await this.pricingService.deleteRatePlanService(filter).pipe(
      map((result) => {
        if (Array.isArray(result) && result.length > 0) {
          return response.status(HttpStatus.OK).send({
            statusCode: HttpStatus.OK,
            message: `Rate plan extra services deleted successfully. ${result.length} services removed.`,
            status: ResponseContentStatusEnum.SUCCESS,
          });
        } else {
          return response.status(HttpStatus.BAD_REQUEST).send({
            statusCode: HttpStatus.BAD_REQUEST,
            message: "Delete rate plan extra service failure",
            status: ResponseContentStatusEnum.ERROR,
          });
        }
      })
    );
  }

  @Get("rate-plan-feature-daily-rate-list")
  async ratePlanFeatureDailyRateList(@Query() filter: RatePlanFeatureWithDailyRateListFilterDto) {
    return await this.pricingService.ratePlanFeatureDailyRateList(filter);
  }

  @Get("hotel-cancellation-policy-list")
  async hotelCancellationPolicyList(@Query() filter: HotelCancellationPolicyFilterDto) {
    return await this.pricingService.hotelCancellationPolicyList(filter);
  }

  @Post("hotel-cancellation-policy-change-default")
  async hotelCancellationPolicyUpdate(@Body() dto: HotelCancellationPolicyChangeDefaultPricingInputDto) {
    return await this.pricingService.hotelCancellationPolicyChangeDefault(dto);
  }

  @Post("hotel-cancellation-policy-create-or-update")
  async hotelCancellationPolicyCreateOrUpdate(@Body() dto: HotelCancellationPolicyPricingInputDto) {
    return await this.pricingService.hotelCancellationPolicyCreateOrUpdate(dto);
  }

  @Get("hotel-extras-list")
  async hotelExtrasList(@Query() filter: HotelExtrasListPricingFilterDto) {
    return await this.pricingService.hotelExtrasList(filter);
  }

  @Get("hotel-tax-list")
  async hotelTaxList(@Query() filter: HotelTaxFilterDto) {
    return await this.pricingService.hotelTaxList(filter);
  }

  @Post("hotel-tax-update-settings")
  async hotelTaxUpdateSettings(@Body() dto: UpdateTaxSettingsPricingInputDto) {
    return await this.pricingService.hotelTaxUpdateSettings(dto);
  }
}
