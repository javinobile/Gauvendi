# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GauVendi API Gateway - A NestJS-based API gateway for the GauVendi hotel management platform. This service acts as the entry point for client requests and routes them to backend microservices via RabbitMQ.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (with watch mode)
npm run start:dev

# Build
npm run build              # Standard build
npm run build:prod         # Production build (uses tsconfig.build-prod.json)

# Linting & Formatting
npm run lint               # Fix lint issues
npm run lint:check         # Check lint without fixing
npm run format             # Format code with Prettier

# Testing
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run e2e tests
```

## Architecture

### Gateway Pattern
This is a **thin API Gateway** - it does not contain business logic. Controllers receive HTTP requests and forward them to the **Platform Service** microservice via RabbitMQ using NestJS's `ClientProxy.send()`.

```
Client -> API Gateway (this) -> RabbitMQ -> Platform Service (hotel-service)
```

### Module Structure
Each domain module follows a consistent pattern:
- `*.module.ts` - NestJS module importing `PlatformClientModule`
- `*.controller.ts` - REST endpoints
- `*.service.ts` - Injects `PLATFORM_SERVICE` ClientProxy and calls `hotelClient.send({ cmd: "command_name" }, payload)`
- `dtos/*.dto.ts` - Request/response DTOs (no `@ApiProperty` decorators)

### Key Directories
- `src/core/` - Shared infrastructure (auth, guards, decorators, interceptors, constants)
- `src/core/clients/platform-client.module.ts` - RabbitMQ client configuration
- `src/core/constants/cmd.const.ts` - All microservice command names
- `src/modules/` - Feature modules (hotels, reservations, pricing, etc.)

### Path Aliases (tsconfig.json)
```typescript
@services/* -> src/core/services/*
@src/*       -> src/*
```

## Communication with Microservice

Send messages to the Platform Service microservice:

```typescript
@Injectable()
export class XService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy
  ) {}

  xMethod(query: XQueryDto) {
    return this.hotelClient.send({ cmd: "command_name" }, query);
  }
}
```

Command names are defined in `src/core/constants/cmd.const.ts` - use constants from `CMD.*`.

## Authentication

- Uses Auth0 with JWT strategy (`passport-jwt` + `jwks-rsa`)
- Global guard `GvdAuthGuard` protects all routes by default
- Mark public endpoints with `@Public()` decorator from `src/core/decorators/is-public.decorator.ts`
- Access authenticated user with `@User()` decorator

## Environment Variables

Key variables (see `src/core/constants/environment.const.ts`):
- `PORT` - Server port (default: 3000)
- `RMQ_URL`, `RMQ_QUEUE`, `RMQ_HEARTBEAT` - RabbitMQ connection
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` - Redis cache
- `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` - Auth0 configuration
- `SHOW_SWAGGER` - Enable Swagger UI at `/swagger` (set to "1")
- `ALLOW_ORIGINS` - CORS origins (comma-separated)

## Global Features

- **Global prefix**: All routes prefixed with `/api`
- **Validation**: Global `ValidationPipe` with `whitelist: true`, implicit conversion enabled
- **Response format**: `ResponseInterceptor` wraps successful responses in `{ statusCode, message, data }`
- **Caching**: Redis-based caching with `@nestjs/cache-manager`
- **Security**: Helmet, compression, and configurable CORS

## DTO Conventions

- Do NOT include `@ApiProperty` or `@ApiPropertyOptional` in DTOs
- Use class-validator decorators for validation
- DTOs are in `dtos/` folders within each module

## Context: Migration from Java

This codebase is being migrated from Java. When adding new APIs:
1. Read the type/schema/entity from Java
2. Convert to NestJS API following the module pattern above
3. Keep service method implementations simple - forward to microservice
