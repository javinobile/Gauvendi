import { Module } from "@nestjs/common";
import { CppController } from "./cpp.controller";
import { CppService } from "./cpp.service";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";

@Module({
  controllers: [CppController],
  providers: [CppService],
  imports: [PlatformClientModule]
})
export class CppModule {}

