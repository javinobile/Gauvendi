import { Module } from "@nestjs/common";
import { CurrenciesService } from "./currencies.service";
import { CurrenciesController } from "./currencies.controller";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";

@Module({
  controllers: [CurrenciesController],
  providers: [CurrenciesService],
  imports: [PlatformClientModule],
})
export class CurrenciesModule {}
