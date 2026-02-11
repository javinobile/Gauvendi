import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLClientService } from './graphql-client/graphql-client.service';
import { HttpClientService } from './http-client/http-client.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [GraphQLClientService, HttpClientService],
  exports: [GraphQLClientService, HttpClientService]
})
export class CoreClientsModule {}
