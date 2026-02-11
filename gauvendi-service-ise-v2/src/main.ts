import helmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ENVIRONMENT } from './core/constants/environment.const';
import { GlobalRpcExceptionFilter } from './core/filters/rpc-exception.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';
import fastifyCompress from '@fastify/compress';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const fastifyAdapter = new FastifyAdapter();
  const configService = new ConfigService();

  // Configure allowed origins
  const allowOrigins = configService
    .get(ENVIRONMENT.ALLOW_ORIGINS)
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) || ['*'];

  // ✅ Register CORS plugin for Fastify
  await fastifyAdapter.register(fastifyCors, {
    origin: allowOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400
  });

  // ✅ Register helmet for security headers
  await fastifyAdapter.register(helmet);

  // ✅ Register Compression (gzip + brotli)
  await fastifyAdapter.register(fastifyCompress, {
    global: true,
    encodings: ['gzip', 'deflate', 'br']
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  app.useGlobalFilters(new GlobalRpcExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  // ---------- 🐰 RABBITMQ MICROSERVICE ----------
  const rmqUrl = configService.get<string>(ENVIRONMENT.RMQ_URL);
  const rmqQueue = configService.get<string>(ENVIRONMENT.ISE_RMQ_QUEUE);

  if (!rmqUrl || !rmqQueue) {
    throw new Error('RMQ_URL or ISE_RMQ_QUEUE is missing');
  }

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: rmqQueue,
      queueOptions: {
        durable: false
      },
      socketOptions: {
        heartbeatIntervalInSeconds: configService.get<number>(ENVIRONMENT.RMQ_HEARTBEAT) ?? 300,
        reconnectTimeInSeconds: 10,
        connectionTimeout: 60000
      },
      prefetchCount: Number(configService.get<number>(ENVIRONMENT.RMQ_PREFETCH_COUNT) || '1')
    }
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue: configService.get<string>(ENVIRONMENT.RMQ_ISE_SOCKET_QUEUE),
      queueOptions: {
        durable: false
      },
      socketOptions: {
        heartbeatIntervalInSeconds: configService.get<number>(ENVIRONMENT.RMQ_HEARTBEAT) ?? 300,
        reconnectTimeInSeconds: 10,
        connectionTimeout: 60000
      },
      prefetchCount: Number(configService.get<number>(ENVIRONMENT.RMQ_PREFETCH_COUNT) || '1')
    }
  });
  // ⬅️ Start ALL microservices
  await app.startAllMicroservices();

  const port = configService.get(ENVIRONMENT.PORT) ?? 3000;
  const host = configService.get(ENVIRONMENT.NODE_ENV) === 'development' ? 'localhost' : '0.0.0.0';
  await app.listen(port, host); // 👈 IMPORTANT: allows container/VM to listen externally

  if (configService.get(ENVIRONMENT.NODE_ENV) === 'development') {
    logger.log(`🚀 Application is running on: http://${host}:${port}`);
  }
}
bootstrap();
