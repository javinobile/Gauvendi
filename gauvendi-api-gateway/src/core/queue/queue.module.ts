// import { BullModule } from "@nestjs/bullmq";
// import { Module } from "@nestjs/common";
// import { ConfigModule, ConfigService } from "@nestjs/config";
// import { ENV_CONST } from "../constants/environment.const";

// const bullmqFactory = (configService: ConfigService) => {
//   return {
//     connection: {
//       host: configService.get<string>(ENV_CONST.REDIS_HOST),
//       port: Number(configService.get<number>(ENV_CONST.REDIS_PORT)),
//     },
//   };
// };

// @Module({
//   imports: [
//     BullModule.forRootAsync({
//       imports: [ConfigModule],
//       useFactory: bullmqFactory,
//       inject: [ConfigService],
//     }),
//   ],
// })
// export class QueueModule {}
