import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ENV_CONST } from "src/core/constants/environment.const";

export const PLATFORM_SERVICE = Symbol("PLATFORM_SERVICE");
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PLATFORM_SERVICE,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get(ENV_CONST.RMQ_URL) as string],
            queue: configService.get(ENV_CONST.RMQ_QUEUE),
            queueOptions: {
              durable: false,
            },
            // Socket-level connection settings for stability

            socketOptions: {
              // Send heartbeat every 60 seconds to keep connection alive
              heartbeatIntervalInSeconds: configService.get(ENV_CONST.RMQ_HEARTBEAT) || 300,
              // Attempt reconnection after 10 seconds if disconnected
              reconnectTimeInSeconds: 10,
              // Timeout for establishing initial connection (60 seconds)
              connectionTimeout: 60000,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class PlatformClientModule {}
