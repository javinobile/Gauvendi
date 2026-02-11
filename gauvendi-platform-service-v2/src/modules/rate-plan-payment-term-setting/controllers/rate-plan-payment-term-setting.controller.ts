import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Res
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ResponseContent,
  ResponseContentStatusEnum,
  ResponseData
} from '../../../core/dtos/common.dto';
import {
  RatePlanPaymentTermSettingDto,
  RatePlanPaymentTermSettingFilterDto,
  RatePlanPaymentTermSettingInputDto,
  RatePlanPaymentTermSettingDeleteDto
} from '../dtos';
import { RatePlanPaymentTermSettingService } from '../services/rate-plan-payment-term-setting.service';
import { RatePlanPaymentTermSettingListPricingFilterDto } from '@src/modules/pricing/dtos/rate-plan-payment-term-setting-pricing.dto';
import { CMD } from '@src/core/constants/cmd.const';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Response } from 'express';
import { CreateRatePlanPaymentTermSettingInputDto } from '../dtos/rate-plan-payment-term-setting-input.dto';

@ApiTags('Rate Plan Payment Term Setting')
@Controller('rate-plan-payment-term-setting')
export class RatePlanPaymentTermSettingController {
  constructor(
    private readonly ratePlanPaymentTermSettingService: RatePlanPaymentTermSettingService
  ) {}

  @MessagePattern({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.GET_LIST })
  async ratePlanPaymentTermSettingList(@Payload() filter: RatePlanPaymentTermSettingFilterDto) {
    return await this.ratePlanPaymentTermSettingService.ratePlanPaymentTermSettingList(filter);
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.UPDATE })
  async updateRatePlanPaymentTermSetting(@Payload() filter: RatePlanPaymentTermSettingInputDto) {
    const result =
      await this.ratePlanPaymentTermSettingService.updateRatePlanPaymentTermSetting(filter);
    return result;
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.DELETE })
  async deleteRatePlanPaymentTermSetting(@Payload() input: RatePlanPaymentTermSettingDeleteDto) {
    const result =
      await this.ratePlanPaymentTermSettingService.deleteRatePlanPaymentTermSetting(input);
    return result;
  }

  @MessagePattern({ cmd: CMD.RATE_PLAN_PAYMENT_TERM_SETTING.CREATE })
  async createRatePlanPaymentTermSettings(
    @Payload() input: CreateRatePlanPaymentTermSettingInputDto
  ) {
    const result =
      await this.ratePlanPaymentTermSettingService.createRatePlanPaymentTermSettingList(input);
    return result;
  }
}
