import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ENV_CONST } from "./core/constants/environment.const";
import { GlobalExceptionFilter } from "./core/filters/global-exception.filter";
import { ResponseInterceptor } from "./core/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // ✅ safer for PM2 / multi-process start
  });

  const logger = new Logger("Bootstrap");
  const configService = app.get(ConfigService); // ✅ proper DI (not new instance)

  // ==========================
  // Global configuration
  // ==========================
  app.setGlobalPrefix("api", { exclude: ["/"] });

  // ✅ Security and compression
  app.use(helmet());
  app.use(compression());

  // ✅ Request size limit
  app.use(bodyParser.json({ limit: "20mb" }));
  app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

  // ==========================
  // Validation & Filters
  // ==========================
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      // forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ==========================
  // Swagger (conditional)
  // ==========================
  const showSwagger = configService.get<string>(ENV_CONST.SHOW_SWAGGER) === "1";
  if (showSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("API Gateway")
      .setDescription("API documentation for Gateway")
      .setVersion("1.0")
      .addBearerAuth(
        { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        "Authorization",
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("swagger", app, document);
    logger.log("Swagger documentation enabled at /swagger");
  }

  // ==========================
  // CORS
  // ==========================
  const allowOriginRaw =
    configService.get<string>(ENV_CONST.ALLOW_ORIGINS) ?? "*";
  const allowedOrigins = allowOriginRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  logger.log(`CORS allowed for: ${allowedOrigins.join(", ")}`);

  // ==========================
  // Start server
  // ==========================
  const port = Number(configService.get(ENV_CONST.PORT) || 3000);
  await app.listen(port, "0.0.0.0");

  const appUrl = await app.getUrl();
  logger.verbose(`🚀 Application is running on: ${appUrl}`);
}

// Graceful bootstrap with error capture
bootstrap().catch((err) => {
  console.error("❌ Fatal error during bootstrap:", err);
  process.exit(1);
});
