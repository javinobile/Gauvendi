import { Module } from "@nestjs/common";
import { ImageService } from "./image.service";
import { ImageController } from "./image.controller";
import { PlatformClientModule } from "@src/core/clients/platform-client.module";

@Module({
  imports: [PlatformClientModule],
  controllers: [ImageController],
  providers: [ImageService],
})
export class ImageModule {}
