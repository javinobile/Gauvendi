import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ENVIRONMENT } from './core/constants/environment.const';
import { GlobalRpcExceptionFilter } from './core/filters/rpc-exception.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

const cluster = require('node:cluster');

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const configService = new ConfigService();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get(ENVIRONMENT.RMQ_URL)],
      queue: configService.get(ENVIRONMENT.RMQ_QUEUE),
      queueOptions: {
        durable: false
      },
      // Socket-level connection settings for stability
      socketOptions: {
        // Send heartbeat every 60 seconds to keep connection alive
        heartbeatIntervalInSeconds: configService.get(ENVIRONMENT.RMQ_HEARTBEAT) || 300,
        // Attempt reconnection after 10 seconds if disconnected
        reconnectTimeInSeconds: 10,
        // Timeout for establishing initial connection (60 seconds)
        connectionTimeout: 60000
      },
      prefetchCount: Number(configService.get('PREFETCH_COUNT')) || 1
    }
  });
  app.useGlobalFilters(new GlobalRpcExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen();
  logger.verbose(`Worker ${process.pid} - Platform service has started`);
  logger.verbose(`PREFETCH_COUNT ${configService.get('PREFETCH_COUNT')}`);
}

async function clusterize() {
  const logger = new Logger('Cluster');
  const configService = new ConfigService();
  const numWorkers = parseInt(configService.get(ENVIRONMENT.MAX_WORKERS) || '1');

  if (cluster.isMaster || cluster.isPrimary) {
    logger.log(`Master server started on process ${process.pid}`);
    logger.log(`Running ${numWorkers} workers...`);

    for (let i = 0; i < numWorkers; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
      logger.log('Starting a new worker...');
      cluster.fork();
    });
  } else {
    bootstrap();
  }
}

clusterize();
// bootstrap();
