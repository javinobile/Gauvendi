import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DB_NAME } from 'src/core/constants/db.const';
import { RatePlan } from 'src/core/entities/pricing-entities/rate-plan.entity';
import { In, Repository } from 'typeorm';
import { RatePlanDto } from '../dtos/rate-plan.dto';

@Injectable()
export class RatePlanRepository {
  private readonly logger = new Logger(RatePlanRepository.name);
  constructor(
    @InjectRepository(RatePlan, DB_NAME.POSTGRES)
    private ratePlanRepository: Repository<RatePlan>
  ) {}

  async getRatePlan(body: RatePlanDto): Promise<RatePlan | null> {
    try {
      const result = await this.ratePlanRepository.findOne({
        where: {
          ...(body.id && { id: body.id }),
          ...(body.hotelId && { hotelId: body.hotelId }),
          ...(body.code && { code: body.code })
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting rate plan', error);
      throw new BadRequestException('Error getting rate plan');
    }
  }

  async getRatePlanListBySalesPlanIds(salesPlanIds: string[]): Promise<RatePlan[]> {
    try {
      const result = await this.ratePlanRepository.find({
        where: {
          id: In(salesPlanIds)
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Error getting rate plan list by sales plan ids', error);
      throw new BadRequestException('Error getting rate plan list by sales plan ids');
    }
  }
}
