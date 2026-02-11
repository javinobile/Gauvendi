import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from 'src/core/constants/cmd.const';
import { HotelCancellationPolicyFilterDto } from 'src/modules/hotel-cancellation-policy/dto';
import { HotelCancellationPolicyChangeDefaultInputDto } from 'src/modules/hotel-cancellation-policy/dto/hotel-cancellation-policy-change-default-input.dto';
import { HotelCancellationPolicyPricingInputDto } from 'src/modules/hotel-cancellation-policy/dto/hotel-cancellation-policy-pricing-input.dto';
import { PropertyTaxFilterDto, UpdateTaxSettingsInputDto } from 'src/modules/hotel-tax/dto';
import { HotelExtrasListPricingFilterDto } from '../dtos/hotel-extras-pricing.dto';
import { RatePlanFeatureWithDailyRateListFilterDto } from '../dtos/rate-plan-feature-with-daily-rate-pricing-filter.dto';
import {
  RatePlanServiceDeleteInputDto,
  RatePlanServiceInputDto
} from '../dtos/rate-plan-service-pricing.dto';
import { HotelCancellationPolicyPricingService } from '../services/hotel-cancellation-policy-pricing.service';
import { HotelExtrasPricingService } from '../services/hotel-extras-pricing.service';
import { HotelTaxPricingService } from '../services/hotel-tax-pricing.service';
import { RatePlanFeatureDailyRatePricingService } from '../services/rate-plan-feature-daily-rate-prcing.service';
import { RatePlanServicePricingService } from '../services/rate-plan-service-pricing.service';
import {
  DeleteHotelAmenityDto,
  GetCppExtrasServiceListQueryDto,
  HotelAmenityInputDto,
  UploadHotelAmenityImageDto
} from '@src/modules/hotel/dtos/hotel-amenity-filter.dto';
// @Controller('pricing')
@Controller()
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly ratePlanServicePricingService: RatePlanServicePricingService,
    private readonly ratePlanFeatureDailyRatePricingService: RatePlanFeatureDailyRatePricingService,
    private readonly hotelCancellationPolicyPricingService: HotelCancellationPolicyPricingService,
    private readonly hotelExtrasPricingService: HotelExtrasPricingService,
    private readonly hotelTaxPricingService: HotelTaxPricingService
  ) {}

  // @Get('rate-plan-service-list')
  @MessagePattern({ cmd: CMD.PRICING.GET_RATE_PLAN_SERVICE_LIST })
  async ratePlanServiceList(@Payload() filter: any) {
    return await this.ratePlanServicePricingService.ratePlanServiceList(filter);
  }

  @MessagePattern({ cmd: CMD.PRICING.CREATE_RATE_PLAN_SERVICE })
  async createRatePlanService(@Payload() filter: RatePlanServiceInputDto) {
    return await this.ratePlanServicePricingService.createRatePlanService(filter);
  }

  @MessagePattern({ cmd: CMD.PRICING.DELETE_RATE_PLAN_SERVICE })
  async deleteRatePlanService(@Payload() filter: RatePlanServiceDeleteInputDto) {
    return await this.ratePlanServicePricingService.deleteRatePlanService(filter);
  }

  @MessagePattern({ cmd: CMD.PRICING.GET_RATE_PLAN_FEATURE_DAILY_RATE_LIST })
  async ratePlanFeatureDailyRateList(@Payload() filter: RatePlanFeatureWithDailyRateListFilterDto) {
    return await this.ratePlanFeatureDailyRatePricingService.ratePlanFeatureWithDailyRateList(
      filter
    );
  }

  @MessagePattern({ cmd: CMD.PRICING.GET_HOTEL_CANCELLATION_POLICY_LIST })
  async hotelCancellationPolicyList(@Payload() filter: HotelCancellationPolicyFilterDto) {
    return await this.hotelCancellationPolicyPricingService.hotelCancellationPolicyList(filter);
  }

  @MessagePattern({ cmd: CMD.PRICING.CHANGE_DEFAULT_HOTEL_CANCELLATION_POLICY })
  async hotelCancellationPolicyChangeDefault(
    @Payload() dto: HotelCancellationPolicyChangeDefaultInputDto
  ) {
    return await this.hotelCancellationPolicyPricingService.ChangeDefault(dto);
  }

  @MessagePattern({ cmd: CMD.PRICING.CREATE_OR_UPDATE_HOTEL_CANCELLATION_POLICY })
  async hotelCancellationPolicyCreateOrUpdate(
    @Payload() dto: HotelCancellationPolicyPricingInputDto
  ) {
    return await this.hotelCancellationPolicyPricingService.createOrUpdate(dto);
  }

  @MessagePattern({ cmd: CMD.PRICING.GET_HOTEL_EXTRAS_LIST })
  async hotelExtrasList(@Payload() filter: HotelExtrasListPricingFilterDto) {
    return await this.hotelExtrasPricingService.hotelExtrasList(filter);
  }

  @MessagePattern({ cmd: CMD.PRICING.GET_HOTEL_TAX_LIST })
  async hotelTaxList(@Payload() filter: PropertyTaxFilterDto) {
    return await this.hotelTaxPricingService.hotelTaxList(filter);
  }

  @MessagePattern({ cmd: CMD.PRICING.UPDATE_HOTEL_TAX_SETTINGS })
  async hotelTaxUpdate(@Payload() dto: UpdateTaxSettingsInputDto) {
    return await this.hotelTaxPricingService.updateHotelTaxSettings(dto);
  }

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.UPDATE })
  async hotelExtrasUpdate(@Payload() dto: HotelAmenityInputDto) {
    return await this.hotelExtrasPricingService.updathotelExtras(dto);
  }

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.UPLOAD_IMAGE })
  async uploadHotelExtrasImage(@Payload() dto: UploadHotelAmenityImageDto) {
    return await this.hotelExtrasPricingService.uploadHotelAmenityImage(dto);
  }

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.CREATE })
  async createHotelExtras(@Payload() dto: HotelAmenityInputDto) {
    return await this.hotelExtrasPricingService.createHotelExtras(dto);
  }

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.GET_CPP_EXTRAS_SERVICE_LIST })
  async getCppExtrasServiceList(@Payload() payload: GetCppExtrasServiceListQueryDto) {
    return await this.hotelExtrasPricingService.getCppExtrasServiceList(payload);
  }

  @MessagePattern({ cmd: CMD.HOTEL_AMENITY.DELETE })
  async deleteHotelExtras(@Payload() dto: DeleteHotelAmenityDto) {
    return await this.hotelExtrasPricingService.deleteHotelExtras(dto);
  }
}
