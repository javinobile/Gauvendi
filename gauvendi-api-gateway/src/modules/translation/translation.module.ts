import { Module } from "@nestjs/common";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";
import { TranslationController } from "./translation.controller";
import { TranslationService } from "./translation.service";

@Module({
  imports: [PlatformClientModule],
  controllers: [TranslationController],
  providers: [TranslationService],
})
export class TranslationModule {}
