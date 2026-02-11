
import { Module } from '@nestjs/common';
import { GraphqlProxyController } from './graphql-proxy.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    controllers: [GraphqlProxyController],
})
export class GraphqlProxyModule { }
