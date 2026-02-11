import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ENVIRONMENT } from '../constants/environment.const';

export const ISE_SOCKET_SERVICE = Symbol('ISE_SOCKET_SERVICE');
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ISE_SOCKET_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get(ENVIRONMENT.RMQ_URL) as string],
            queue: configService.get(ENVIRONMENT.RMQ_ISE_SOCKET_QUEUE),
            queueOptions: {
              durable: false
            },
            // Socket-level connection settings for stability
            socketOptions: {
              // Send heartbeat every 60 seconds to keep connection alive
              heartbeatIntervalInSeconds: 180,
              // Attempt reconnection after 10 seconds if disconnected
              reconnectTimeInSeconds: 10,
              // Timeout for establishing initial connection (60 seconds)
              connectionTimeout: 60000
            }
          }
        }),
        inject: [ConfigService]
      }
    ])
  ],
  exports: [ClientsModule]
})
export class IseSocketClientModule {}
