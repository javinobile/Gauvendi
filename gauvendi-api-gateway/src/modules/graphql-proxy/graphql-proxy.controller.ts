import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Response } from 'express';
import { Public } from '../../core/decorators/is-public.decorator';
import { Agent } from 'https';

@Controller('graphql')
export class GraphqlProxyController {
    constructor(private readonly httpService: HttpService) { }

    @Public()
    @Post()
    async proxyGraphql(
        @Body() body: any,
        @Headers() headers: any,
        @Res() res: Response
    ) {
        try {
            const graphqlUrl = 'https://sandbox.service.gauvendi.com/graphql'; // Target URL

            // Filter headers to forward (avoid host/content-length mismatches)
            const forwardHeaders = {
                'Content-Type': 'application/json',
                'Authorization': headers.authorization,
                'apollographql-client-name': headers['apollographql-client-name'],
                'apollographql-client-version': headers['apollographql-client-version']
            };

            const httpsAgent = new Agent({ rejectUnauthorized: false });

            const response = await firstValueFrom(
                this.httpService.post(graphqlUrl, body, {
                    headers: forwardHeaders,
                    httpsAgent: httpsAgent
                })
            );

            return res.status(response.status).json(response.data);
        } catch (error: any) {
            console.error('GraphQL Proxy Error:', error.message);
            if (error.response) {
                return res.status(error.response.status).json(error.response.data);
            }
            return res.status(500).json({ message: 'Internal Server Error (Proxy)', error: error.message });
        }
    }
}
