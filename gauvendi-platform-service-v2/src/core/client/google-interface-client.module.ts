import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const GOOGLE_INTERFACE_SERVICE = Symbol('GOOGLE_INTERFACE_SERVICE');
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GOOGLE_INTERFACE_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RMQ_URL') as string],
            queue: configService.get('RMQ_GOOGLE_QUEUE'),
          }
        }),
        inject: [ConfigService]
      }
    ])
  ],
  exports: [ClientsModule]
})
export class GoogleInterfaceClientModule {}
