import { DataSource } from "typeorm";
import { config } from "dotenv";
import * as path from "path";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

config();

const isProduction = process.env.NODE_ENV === "production";

/** Generate migration example:  npm run migration:create src/core/database/migrations/AddDeletedAtColumn */

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  schema: process.env.DB_SCHEMA || "public",
  entities: [path.join(__dirname, "../../**/*.entity{.ts,.js}")],
  migrations: [path.join(__dirname, "./migrations/*{.ts,.js}")],
  synchronize: false, // not set true
  logging: !isProduction,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  migrationsRun: false, // disabled autorun
  namingStrategy: new SnakeNamingStrategy(), // convert from snake case to camel case property_id -> propertyId
});
