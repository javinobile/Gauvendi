import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import {
  NearestBookableDateDto,
  StayOptionDetailsDto,
  StayOptionsDto
} from './ise-recommendation.dto';
import { lastValueFrom } from 'rxjs';
import { RedisService } from 'src/core/modules/redis/redis.service';

@Injectable()
export class IseRecommendationService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy,
    private readonly redisService: RedisService
  ) {}

  async getNearestBookableDate(body: NearestBookableDateDto) {
    const cacheKey = this.redisService.generateCacheKey('nearest_bookable_date', body);
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    const result = await lastValueFrom(
      this.platformClient.send({ cmd: 'get_nearest_bookable_date' }, body)
    );
    await this.redisService.setCachedResult(cacheKey, result);
    return result;
  }

  async getStayOptions(body: StayOptionsDto) {
    const cacheKey = this.redisService.generateCacheKey('stay_options', body);
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }
    const result = await lastValueFrom(
      this.platformClient.send({ cmd: 'get_ise_recommendation_stay_options' }, body)
    );
    await this.redisService.setCachedResult(cacheKey, result);
    return result;
  }

  getStayOptionDetails(body: StayOptionDetailsDto) {
    return this.platformClient.send({ cmd: 'get_ise_recommendation_stay_option_details' }, body);
  }
}
