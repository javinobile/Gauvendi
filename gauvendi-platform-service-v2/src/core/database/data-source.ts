import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

config();

const isProduction = process.env.NODE_ENV === 'production';

/** Generate migration example:  npm run migration:create src/core/database/migrations/AddDeletedAtColumn */

// Limit connections per replica: 1-2 connections per replica
// With 6 replicas: 6-12 total connections (safe for most PostgreSQL instances)
const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10);
// const minConnections = parseInt(process.env.DB_MIN_CONNECTIONS || '1', 10);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: process.env.DB_SCHEMA || 'public',
  entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false, // not set true
  logging: !isProduction,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  migrationsRun: false, // disabled autorun
  namingStrategy: new SnakeNamingStrategy(), // convert from snake case to camel case property_id -> propertyId
  // Connection pool configuration - limit connections per replica
  // extra: {
  //   max: maxConnections, // Maximum connections in pool (2 per replica)
  //   // min: minConnections, // Minimum connections in pool (1 per replica)
  //   idleTimeoutMillis: 30000, // Close idle connections after 30s
  //   connectionTimeoutMillis: 10000 // Timeout when acquiring connection (10s)
  // }
});
