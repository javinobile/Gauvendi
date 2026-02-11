import { Injectable } from '@nestjs/common';
import { ResponseContent, ResponseData } from 'src/core/dtos/common.dto';
import {
  RatePlanDailySellabilityDto,
  RatePlanDailySellabilityFilterDto,
  RatePlanDailySellabilityInputDto
} from '../dtos';
import { RatePlanDailySellabilityRepository } from '../repositories/rate-plan-daily-sellability.repository';

@Injectable()
export class RatePlanDailySellabilityService {
  constructor(
    private readonly ratePlanDailySellabilityRepository: RatePlanDailySellabilityRepository,
  ) {}

  async ratePlanDailySellabilityList(
    filter: RatePlanDailySellabilityFilterDto
  ): Promise<ResponseData<RatePlanDailySellabilityDto>> {
    return await this.ratePlanDailySellabilityRepository.ratePlanDailySellabilityList(filter);
  }

  async createOrUpdateRatePlanDailySellability(
    input: RatePlanDailySellabilityInputDto
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityRepository.createOrUpdateRatePlanDailySellability(
      input
    );
  }

  async bulkCreateOrUpdateRatePlanDailySellability(
    inputList: RatePlanDailySellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityRepository.bulkCreateOrUpdateRatePlanDailySellability(
      inputList
    );
  }

  async deleteRatePlanDailySellability(
    input: RatePlanDailySellabilityInputDto
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityRepository.deleteRatePlanDailySellability(input);
  }

  async bulkDeleteRatePlanDailySellability(
    inputList: RatePlanDailySellabilityInputDto[]
  ): Promise<ResponseContent<RatePlanDailySellabilityDto | null>> {
    return await this.ratePlanDailySellabilityRepository.bulkDeleteRatePlanDailySellability(
      inputList
    );
  }
}
