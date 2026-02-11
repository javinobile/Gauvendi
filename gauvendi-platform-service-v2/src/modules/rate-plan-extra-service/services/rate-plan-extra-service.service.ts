import { Injectable } from '@nestjs/common';
import { RatePlanExtraServiceFilterDto } from '../dtos/rate-plan-extra-service-filter.dto';
import { RatePlanExtraServiceInputDto } from '../dtos/rate-plan-extra-service-input.dto';
import { RatePlanExtraServiceDto } from '../dtos/rate-plan-extra-service.dto';
import { RatePlanExtraServiceRepository } from '../repositories/rate-plan-extra-service.repository';
@Injectable()
export class RatePlanExtraServiceService {
  constructor(private readonly ratePlanExtraServiceRepository: RatePlanExtraServiceRepository) {}

  async ratePlanExtraServiceList(
    filter: RatePlanExtraServiceFilterDto
  ): Promise<RatePlanExtraServiceDto[]> {
    return await this.ratePlanExtraServiceRepository.ratePlanExtraServiceList(filter);
  }

  async createRatePlanExtraService(
    input: RatePlanExtraServiceInputDto,
  ): Promise<any> {
    return await this.ratePlanExtraServiceRepository.createRatePlanExtraService(input);
  }

  async deleteRatePlanExtraService(
    input: RatePlanExtraServiceInputDto,
  ): Promise<any> {
    return await this.ratePlanExtraServiceRepository.deleteRatePlanExtraService(input);
  }
}
