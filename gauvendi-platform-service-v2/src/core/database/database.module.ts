import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ENVIRONMENT } from '../constants/environment.const';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: 'postgres',
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          url: configService.get('DATABASE_URL'),
          schema: configService.get('DB_SCHEMA', 'public'),
          entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
          migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
          synchronize: false,
          migrationsRun: false,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          logging: false,
          autoLoadEntities: true,
          namingStrategy: new SnakeNamingStrategy(),
          // extra: {
          //   max: configService.get('DB_MAX_CONNECTIONS') || 10, // Maximum connections in pool (2 per replica)
          //   idleTimeoutMillis: configService.get('DB_MAX_IDLE_TIMEOUT') || 60000, // Close idle connections after 60s,
          //   connectionTimeoutMillis: configService.get('DB_MAX_CONNECTION_TIMEOUT') || 10000 // Timeout when acquiring connection (3s)
          // }
        };
      }
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get(ENVIRONMENT.MONGO_USERNAME || '');
        const password = configService.get(ENVIRONMENT.MONGO_PASSWORD || '');
        const host = configService.get(ENVIRONMENT.MONGO_HOST || '');
        const port = configService.get(ENVIRONMENT.MONGO_PORT);
        const database = configService.get(ENVIRONMENT.MONGO_EMAIL_HISTORY_DB || '');

        // If port is specified, use standard connection string
        // Otherwise assume SRV (cloud) connection
        let uri = '';
        if (port) {
          if (username && password) {
            uri = `mongodb://${username}:${password}@${host}:${port}/${database}`;
          } else {
            uri = `mongodb://${host}:${port}/${database}`;
          }
        } else {
          uri = `mongodb+srv://${username}:${password}@${host}/${database}`;
        }

        return {
          uri: uri
        };
      }
    })
  ]
})
export class DatabaseModule { }
