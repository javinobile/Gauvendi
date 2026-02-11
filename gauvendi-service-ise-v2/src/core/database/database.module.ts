import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

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
          namingStrategy: new SnakeNamingStrategy()
        };
      }
    })
  ]
})
export class DatabaseModule {}
