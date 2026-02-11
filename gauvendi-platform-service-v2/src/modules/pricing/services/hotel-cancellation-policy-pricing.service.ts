import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from '@src/core/constants/db.const';
import { RatePlan } from '@src/core/entities/pricing-entities/rate-plan.entity';
import { BadRequestException } from 'src/core/exceptions';
import {
  HotelCancellationPolicyDto,
  HotelCancellationPolicyFilterDto
} from 'src/modules/hotel-cancellation-policy/dto';
import { HotelCancellationPolicyChangeDefaultInputDto } from 'src/modules/hotel-cancellation-policy/dto/hotel-cancellation-policy-change-default-input.dto';
import { HotelCancellationPolicyInputDto } from 'src/modules/hotel-cancellation-policy/dto/hotel-cancellation-policy-input.dto';
import { HotelCancellationPolicyPricingInputDto } from 'src/modules/hotel-cancellation-policy/dto/hotel-cancellation-policy-pricing-input.dto';
import { HotelCancellationPolicyRepository } from 'src/modules/hotel-cancellation-policy/repositories/hotel-cancellation-policy.repository';
import { HotelRepository } from 'src/modules/hotel/repositories/hotel.repository';
import { Repository, UpdateResult } from 'typeorm';

@Injectable()
export class HotelCancellationPolicyPricingService {
  constructor(
    private readonly hotelCancellationPolicyRepository: HotelCancellationPolicyRepository,
    private readonly hotelRepository: HotelRepository,

    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private readonly ratePlanRepository: Repository<RatePlan>
  ) {}

  async hotelCancellationPolicyList(
    filter: HotelCancellationPolicyFilterDto
  ): Promise<HotelCancellationPolicyDto[]> {
    return this.hotelCancellationPolicyRepository.findAll(filter);
  }

  async ChangeDefault(dto: HotelCancellationPolicyChangeDefaultInputDto): Promise<UpdateResult> {
    const hotel = await this.hotelRepository.findByCode(dto.hotelCode);
    if (!hotel) {
      throw new BadRequestException('Hotel not found');
    }

    return this.ratePlanRepository.update(dto.ratePlanId, {
      hotelId: hotel.id,
      hotelCxlPolicyCode: dto.hotelCxlPolicyCode
    });
  }

  async createOrUpdate(
    input: HotelCancellationPolicyPricingInputDto
  ): Promise<HotelCancellationPolicyDto> {
    try {
      // Get hotel ID by hotel code
      const hotel = await this.hotelRepository.findByCode(input.hotelCode);
      if (!hotel) {
        throw new BadRequestException('Hotel not found');
      }

      // Map extranet input to hotel cancellation policy input
      const hotelCancellationPolicyInput: HotelCancellationPolicyInputDto = {
        id: input.id,
        hotelId: hotel.id,
        name: input.name,
        cancellationType: input.cancellationType,
        hourPrior: input.hourPrior,
        displayUnit: input.displayUnit,
        cancellationFeeValue: input.cancellationFeeValue,
        cancellationFeeUnit: input.cancellationFeeUnit,
        description: input.description,
        translationList: input.translationList
      };

      // Update hotel cancellation policy
      const result = await this.hotelCancellationPolicyRepository.updateHotelCancellationPolicy(
        hotelCancellationPolicyInput
      );

      return result;
    } catch (error) {
      console.log('Error updating hotel cancellation policy:', error);
      throw new BadRequestException('Failed to update hotel cancellation policy', error.message);
    }
  }
}
