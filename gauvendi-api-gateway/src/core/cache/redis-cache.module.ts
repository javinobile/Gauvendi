import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ENV_CONST } from "src/core/constants/environment.const";
import KeyvRedis from "@keyv/redis";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [
            new KeyvRedis(`redis://${configService.get(ENV_CONST.REDIS_USERNAME)}:${configService.get(ENV_CONST.REDIS_PASSWORD)}@${configService.get(ENV_CONST.REDIS_HOST)}:${configService.get(ENV_CONST.REDIS_PORT)}`)
          ],
          ttl: 100, // default 100ms apply for all
        };
      },

      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
